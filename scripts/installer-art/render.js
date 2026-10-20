/**
 * Electron main script (started by scripts/installer-art.js): renders the
 * installer's own pages from ./pages.html — welcome, folder, install, finish — at each
 * Windows display scale, and writes what build/installer.nsh needs:
 *
 *   build/installer/<page>-<scale>.bmp                  welcome / folder / finish: the whole
 *                                                        window, buttons in their normal look
 *   build/installer/<page>-<button>[-hover]-<scale>.bmp  each button cut out, normal and hover
 *   build/installer/install-header|footer-<scale>.bmp    the band and bar around NSIS's
 *                                                        own progress page
 *   build/installer/layout.nsh                           where buttons and controls sit
 *
 * The installer picks the set made for the scale it runs at, so the pictures
 * and their text stay sharp at 100 % … 200 %.
 *
 * Args: --preview <dir>  also write PNG copies there, to look at.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { app, BrowserWindow } = require('electron');

const ROOT = path.resolve(__dirname, '..', '..');
const MOBILE_DIR = require('../../renderer/mobileDir');

/** The setup window's client area at 100 %, in pixels (page + button bar). */
const PAGE = { width: 497, height: 360 };
/** 175 % uses the 200 % set, scaled down a little. */
const SCALES = [100, 125, 150, 200];
const PAGES = ['welcome', 'folder', 'install', 'finish'];
/** Margin around each cut-out button (CSS px): room for its hover ring, matching the picture behind. */
const BUTTON_PAD = 6;
/** NSIS's header band and button bar on its own (progress) page, at 100 %. */
const HEADER_H = 56;
const BAR_H = 46;
const OUT_DIR = path.join(ROOT, 'build', 'installer');
/** Page colour under any transparent pixel (the art is opaque; this is a safety net). */
const BACKDROP = [0x04, 0x0f, 0x1f];

const previewArg = process.argv.indexOf('--preview');
const PREVIEW_DIR = previewArg > -1 ? path.resolve(process.argv[previewArg + 1]) : null;

/** BGRA pixels (nativeImage.toBitmap) → an uncompressed 24-bit, bottom-up BMP. */
function toBmp(bgra, width, height) {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const out = Buffer.alloc(54 + pixelBytes);
  out.write('BM', 0, 'ascii');
  out.writeUInt32LE(out.length, 2);
  out.writeUInt32LE(54, 10);
  out.writeUInt32LE(40, 14);
  out.writeInt32LE(width, 18);
  out.writeInt32LE(height, 22);
  out.writeUInt16LE(1, 26);
  out.writeUInt16LE(24, 28);
  out.writeUInt32LE(pixelBytes, 34);
  out.writeInt32LE(3780, 38); // 96 dpi
  out.writeInt32LE(3780, 42);
  for (let y = 0; y < height; y++) {
    const dst = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const a = bgra[src + 3] / 255;
      out[dst + x * 3] = Math.round(bgra[src] * a + BACKDROP[2] * (1 - a));
      out[dst + x * 3 + 1] = Math.round(bgra[src + 1] * a + BACKDROP[1] * (1 - a));
      out[dst + x * 3 + 2] = Math.round(bgra[src + 2] * a + BACKDROP[0] * (1 - a));
    }
  }
  return out;
}

function save(image, name) {
  const { width, height } = image.getSize();
  fs.writeFileSync(path.join(OUT_DIR, `${name}.bmp`), toBmp(image.toBitmap(), width, height));
  if (PREVIEW_DIR) fs.writeFileSync(path.join(PREVIEW_DIR, `${name}.png`), image.toPNG());
}

function pageHtml() {
  const fonts = pathToFileURL(path.join(MOBILE_DIR, 'assets', 'fonts')).href;
  const assets = pathToFileURL(path.join(ROOT, 'renderer', 'desktop', 'assets')).href;
  const icon = path.join(ROOT, 'build', 'icon.png');
  const html = fs
    .readFileSync(path.join(__dirname, 'pages.html'), 'utf8')
    .replaceAll('%FONTS%', fonts)
    .replaceAll("'%ASSETS%/icon.png'", `'${pathToFileURL(icon).href}'`)
    .replaceAll('%ASSETS%', assets);
  const file = path.join(os.tmpdir(), `loop-installer-pages-${process.pid}.html`);
  fs.writeFileSync(file, html);
  return file;
}

const js = (win, code) => win.webContents.executeJavaScript(code);
const settle = async (win) => {
  // two frames so the new layout is painted, plus a moment for the compositor
  await js(win, 'new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))');
  await new Promise((r) => setTimeout(r, 350));
};

async function capture(win, width, height) {
  let image = await win.webContents.capturePage();
  const size = image.getSize();
  if (size.width !== width || size.height !== height) image = image.resize({ width, height, quality: 'best' });
  return image;
}

/** Rectangles (CSS px, the 100 % layout) of the visible buttons and slots, by name. */
const rectsOf = (win, attr, pad) =>
  js(
    win,
    `Object.fromEntries([...document.querySelectorAll('[${attr}]')].filter((el) => el.getClientRects().length).map((el) => {
      const r = el.getBoundingClientRect();
      return [el.getAttribute('${attr}'), { x: r.left - ${pad}, y: r.top - ${pad}, w: r.width + ${pad * 2}, h: r.height + ${pad * 2} }];
    }))`
  );

/** A rectangle in whole pixels at scale f (rounded outwards). */
const scaled = (r, f) => {
  const x = Math.floor(r.x * f);
  const y = Math.floor(r.y * f);
  return { x, y, width: Math.ceil((r.x + r.w) * f) - x, height: Math.ceil((r.y + r.h) * f) - y };
};

/** Renders one page at every scale; returns its layout (button and slot rectangles at 100 %). */
async function renderPage(win, page) {
  const setState = async (hover) => {
    await js(win, `window.setPage(${JSON.stringify(page)}, ${JSON.stringify(hover)})`);
    await settle(win);
  };

  win.setContentSize(PAGE.width, PAGE.height);
  win.webContents.setZoomFactor(1);
  await setState('');
  const buttons = await rectsOf(win, 'data-button', BUTTON_PAD);
  const slots = await rectsOf(win, 'data-slot', 0);

  for (const scale of SCALES) {
    const f = scale / 100;
    const width = Math.round(PAGE.width * f);
    const height = Math.round(PAGE.height * f);
    win.setContentSize(width, height);
    win.webContents.setZoomFactor(f);

    await setState('');
    const normal = await capture(win, width, height);
    if (page === 'install') {
      // only the band above NSIS's progress page and the bar under it
      save(normal.crop(scaled({ x: 0, y: 0, w: PAGE.width, h: HEADER_H }, f)), `install-header-${scale}`);
      save(normal.crop(scaled({ x: 0, y: PAGE.height - BAR_H, w: PAGE.width, h: BAR_H }, f)), `install-footer-${scale}`);
    } else {
      save(normal, `${page}-${scale}`);
      for (const [name, r] of Object.entries(buttons)) {
        save(normal.crop(scaled(r, f)), `${page}-${name}-${scale}`);
        await setState(name);
        save((await capture(win, width, height)).crop(scaled(r, f)), `${page}-${name}-hover-${scale}`);
      }
    }
    console.log(`[loop] ${page} ${scale}%  ${width}×${height}`);
  }
  return { ...prefixed(buttons, ''), ...prefixed(slots, 'SLOT_') };
}

const prefixed = (rects, prefix) =>
  Object.fromEntries(Object.entries(rects).map(([name, r]) => [`${prefix}${name}`, r]));

function writeLayout(layout) {
  const lines = [
    '; Generated by `npm run installer:art` (scripts/installer-art/render.js) — do not edit.',
    '; Loop\'s setup pages: buttons and control slots in pixels at 100 %; build/installer.nsh',
    '; scales them to the window it runs in.',
    `!define LOOP_PAGE_W ${PAGE.width}`,
    `!define LOOP_PAGE_H ${PAGE.height}`,
    `!define LOOP_HEADER_H ${HEADER_H}`,
    `!define LOOP_BAR_H ${BAR_H}`,
  ];
  for (const [page, rects] of Object.entries(layout)) {
    for (const [name, r] of Object.entries(rects)) {
      const key = `LOOP_${page}_${name}`.toUpperCase();
      const p = scaled(r, 1);
      lines.push(`!define ${key}_X ${p.x}`, `!define ${key}_Y ${p.y}`, `!define ${key}_W ${p.width}`, `!define ${key}_H ${p.height}`);
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'layout.nsh'), `${lines.join('\n')}\n`);
}

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const old of fs.readdirSync(OUT_DIR)) if (old.endsWith('.bmp')) fs.rmSync(path.join(OUT_DIR, old));
    if (PREVIEW_DIR) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

    const file = pageHtml();
    const win = new BrowserWindow({
      show: false,
      width: PAGE.width,
      height: PAGE.height,
      useContentSize: true,
      webPreferences: { offscreen: true },
    });
    await win.loadFile(file);
    await js(
      win,
      'document.fonts.load("700 20px Vazirmatn").then(() => document.fonts.load("300 12px Vazirmatn")).then(() => document.fonts.ready)'
    );

    const layout = {};
    for (const page of PAGES) {
      const rects = await renderPage(win, page);
      if (Object.keys(rects).length) layout[page] = rects;
    }
    writeLayout(layout);

    win.destroy();
    fs.rmSync(file, { force: true });
  } catch (error) {
    console.error('[loop] installer art failed:', error);
    process.exitCode = 1;
  }
  app.quit();
});
