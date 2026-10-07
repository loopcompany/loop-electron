/**
 * Loop desktop — main process.
 *
 * The whole UI (screens, Redux, API services) is loop-customer-mobile's web
 * build; this file only provides the window and the OS integration around it.
 * See README.md for the architecture.
 */
const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, Menu, screen, shell, session } = require('electron');

const { APP_ORIGIN, DEV_URL, isDev, APP_USER_MODEL_ID, getWebRoot } = require('./config');
const { registerSchemePrivileges, registerAppProtocol } = require('./protocol');
const { classifyMainNavigation, classifyNewWindow } = require('./routing');
const windowState = require('./windowState');

/** Permissions the web app actually uses; everything else is refused (fail closed). */
const ALLOWED_PERMISSIONS = new Set([
  'notifications',
  'geolocation', // map / address picker
  'clipboard-sanitized-write', // expo-clipboard
  'fullscreen', // expo-video
]);

/**
 * Below this the screens stop looking like a desktop app; keep in sync with
 * renderer/desktop/Breakpoints.js (`minWindow`).
 */
const MIN_WINDOW = { width: 1100, height: 700 };

/**
 * On Windows the native frame is replaced by the app's own title bar
 * (renderer/desktop/DesktopTitleBar.js) with Windows still drawing the
 * minimise / maximise / close buttons over it. Height and colour must match
 * `titleBarHeight` and `chrome.titleBar` in the renderer.
 * `LOOP_TITLEBAR=overlay|native` forces either style (e.g. to try it on Linux).
 */
const TITLE_BAR =
  process.env.LOOP_TITLEBAR || (process.platform === 'win32' ? 'overlay' : 'native');
const TITLE_BAR_OVERLAY = { color: '#081a30', symbolColor: '#ffffff', height: 36 };

/**
 * Desktop-only chrome:
 *   - thin Windows-11-style scrollbars instead of Chromium's wide default,
 *   - the custom title bar drags the window (React Native Web has no style for it),
 *   - a visible focus ring for keyboard users only.
 */
const DESKTOP_CSS = `
  #loop-titlebar { -webkit-app-region: drag; }
  #loop-titlebar [role="button"], #loop-titlebar [tabindex] { -webkit-app-region: no-drag; }
  [tabindex]:focus-visible { outline: 2px solid rgba(255, 215, 0, 0.9); outline-offset: 1px; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 43, 84, 0.35);
    border-radius: 8px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  ::-webkit-scrollbar-thumb:hover { background-color: rgba(0, 43, 84, 0.6); }
`;

const START_URL = isDev ? DEV_URL : `${APP_ORIGIN}/`;
const APP_ORIGINS = isDev ? [new URL(DEV_URL).origin] : [APP_ORIGIN];

/** @type {BrowserWindow | null} */
let mainWindow = null;

registerSchemePrivileges();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(onReady);

  app.on('window-all-closed', () => app.quit());
}

function onReady() {
  app.setAppUserModelId(APP_USER_MODEL_ID);
  Menu.setApplicationMenu(null);

  if (!isDev) {
    const webRoot = getWebRoot(app);
    if (!fs.existsSync(path.join(webRoot, 'index.html'))) {
      console.error(`[loop] web build not found at ${webRoot} — run "npm run build:web" first.`);
      app.exit(1);
      return;
    }
    registerAppProtocol(webRoot);
  }

  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => ALLOWED_PERMISSIONS.has(permission));

  createMainWindow();
}

function createMainWindow() {
  // A small laptop screen (1280×720 minus the taskbar) must still fit the window.
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const minSize = {
    width: Math.min(MIN_WINDOW.width, workArea.width),
    height: Math.min(MIN_WINDOW.height, workArea.height),
  };
  const state = windowState.load(minSize);

  mainWindow = new BrowserWindow({
    ...state,
    minWidth: minSize.width,
    minHeight: minSize.height,
    ...(TITLE_BAR === 'overlay' && { titleBarStyle: 'hidden', titleBarOverlay: TITLE_BAR_OVERLAY }),
    show: false,
    title: 'لوپ',
    backgroundColor: '#020305', // matches the loading screen in public/index.html
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      additionalArguments: [`--loop-app-version=${app.getVersion()}`, `--loop-title-bar=${TITLE_BAR}`],
    },
  });

  windowState.track(mainWindow);
  if (state.isMaximized) mainWindow.maximize();

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Keep the Persian product name instead of the page's <title> churn.
  mainWindow.on('page-title-updated', (event) => event.preventDefault());

  // Desktop-only chrome; injected here so the public web build stays untouched.
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow?.webContents.insertCSS(DESKTOP_CSS).catch(() => {});
  });

  wireNavigation(mainWindow.webContents);
  wireShortcuts(mainWindow.webContents);
  wireContextMenu(mainWindow.webContents);
  wireScreenshotMode(mainWindow.webContents);

  mainWindow.loadURL(START_URL);
}

function openExternal(url) {
  shell.openExternal(url).catch((error) => console.warn('[loop] openExternal failed:', error));
}

/**
 * - in-app routes: allowed
 * - payment gateway (any other https): allowed in the same window, like web
 * - bank → app redirect: re-issued with loadURL (see routing.classifyMainNavigation)
 * - backend PDFs/receipts, tel:, mailto:: system handler
 * - window.open: never a second Electron window
 */
function wireNavigation(webContents) {
  const onNavigate = (event, url) => {
    const decision = classifyMainNavigation(url, {
      appOrigins: APP_ORIGINS,
      currentUrl: webContents.getURL(),
    });
    if (decision === 'allow') return;

    event.preventDefault();
    if (decision === 'load-app') webContents.loadURL(url);
    else if (decision === 'external') openExternal(url);
  };

  webContents.on('will-navigate', (event) => onNavigate(event, event.url));
  webContents.on('will-redirect', (event) => {
    if (event.isMainFrame) onNavigate(event, event.url);
  });

  webContents.setWindowOpenHandler(({ url }) => {
    if (classifyNewWindow(url) === 'external') openExternal(url);
    return { action: 'deny' };
  });

  webContents.on('will-attach-webview', (event) => event.preventDefault());
}

/** There is no app menu on Windows, so the usual browser shortcuts are wired by hand. */
function wireShortcuts(webContents) {
  webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const ctrl = input.control || input.meta;
    const key = input.key;
    const history = webContents.navigationHistory;

    let handled = true;
    if (key === 'F5' || (ctrl && key.toLowerCase() === 'r')) {
      webContents.reload();
    } else if (input.alt && key === 'ArrowLeft') {
      if (history.canGoBack()) history.goBack();
    } else if (input.alt && key === 'ArrowRight') {
      if (history.canGoForward()) history.goForward();
    } else if (ctrl && (key === '=' || key === '+')) {
      webContents.setZoomLevel(Math.min(webContents.getZoomLevel() + 0.5, 4));
    } else if (ctrl && key === '-') {
      webContents.setZoomLevel(Math.max(webContents.getZoomLevel() - 0.5, -3));
    } else if (ctrl && key === '0') {
      webContents.setZoomLevel(0);
    } else if (key === 'F11') {
      const win = BrowserWindow.fromWebContents(webContents);
      win?.setFullScreen(!win.isFullScreen());
    } else if ((isDev || !app.isPackaged) && (key === 'F12' || (ctrl && input.shift && key.toLowerCase() === 'i'))) {
      webContents.toggleDevTools();
    } else {
      handled = false;
    }

    if (handled) event.preventDefault();
  });
}

/** Electron has no default right-click menu; text fields need copy/paste. */
function wireContextMenu(webContents) {
  webContents.on('context-menu', (_event, params) => {
    const { isEditable, selectionText, editFlags } = params;
    if (!isEditable && !selectionText) return;

    const template = isEditable
      ? [
          { label: 'برش', role: 'cut', enabled: editFlags.canCut },
          { label: 'کپی', role: 'copy', enabled: editFlags.canCopy },
          { label: 'چسباندن', role: 'paste', enabled: editFlags.canPaste },
          { type: 'separator' },
          { label: 'انتخاب همه', role: 'selectAll', enabled: editFlags.canSelectAll },
        ]
      : [{ label: 'کپی', role: 'copy', enabled: editFlags.canCopy }];

    Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(webContents) });
  });
}

/**
 * `LOOP_SCREENSHOT=out.png electron .` — loads the app, saves a screenshot and
 * quits. Used to smoke-test a build without clicking through it.
 */
function wireScreenshotMode(webContents) {
  const target = process.env.LOOP_SCREENSHOT;
  if (!target) return;

  const delay = Number(process.env.LOOP_SCREENSHOT_DELAY) || 6000;
  webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const image = await webContents.capturePage();
        fs.writeFileSync(path.resolve(target), image.toPNG());
        console.log(`[loop] screenshot saved: ${target} (url: ${webContents.getURL()})`);
      } catch (error) {
        console.error('[loop] screenshot failed:', error);
      } finally {
        app.quit();
      }
    }, delay);
  });
}
