/**
 * Pure URL decisions for the main process — no `electron` import, so
 * `npm test` can exercise them under plain Node.
 */
const path = require('path');

/**
 * Backend URLs that the shared code opens with `expo-linking`'s `openURL`,
 * which on web *replaces the current page* (`window.location = url`).
 * In a browser tab that is tolerable; in a desktop window it strands the user
 * on a PDF with no way back. These go to the system browser instead.
 *
 * Payment gateways are deliberately NOT here: `utils/paymentGateway.js` relies
 * on the main window navigating to the gateway and the bank redirecting back
 * to our origin, exactly like the web build.
 */
const EXTERNAL_IN_MAIN_WINDOW = [
  /^https?:\/\/(www\.)?clpiran\.com\/storage\//i,
  /^https?:\/\/(www\.)?clpiran\.com\/reciept\//i,
];

const EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function parse(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * `URL#origin` is the string "null" for non-special schemes such as `app:`,
 * so origins are rebuilt from protocol + host.
 */
function originOf(parsed) {
  return `${parsed.protocol}//${parsed.host}`;
}

function isAppUrl(url, appOrigins) {
  const parsed = parse(url);
  return !!parsed && appOrigins.includes(originOf(parsed));
}

/**
 * Decides what to do when the main window is about to navigate (or be redirected).
 *
 * @param {string} targetUrl
 * @param {{ appOrigins: string[], currentUrl?: string }} ctx
 * @returns {'allow'|'load-app'|'external'|'deny'}
 *   - `load-app`: coming back into the app from a foreign page (bank gateway
 *     redirect). The caller cancels the navigation and calls `loadURL` itself,
 *     so a cross-scheme https → app:// hop can never be blocked by Chromium.
 */
function classifyMainNavigation(targetUrl, { appOrigins, currentUrl }) {
  const target = parse(targetUrl);
  if (!target) return 'deny';

  if (appOrigins.includes(originOf(target))) {
    return isAppUrl(currentUrl, appOrigins) ? 'allow' : 'load-app';
  }

  if (target.protocol === 'mailto:' || target.protocol === 'tel:') return 'external';

  if (target.protocol === 'http:' || target.protocol === 'https:') {
    return EXTERNAL_IN_MAIN_WINDOW.some((re) => re.test(targetUrl)) ? 'external' : 'allow';
  }

  return 'deny';
}

/**
 * `window.open` / react-native `Linking.openURL` (which uses `_blank` on web):
 * never create a second Electron window — hand safe schemes to the OS.
 *
 * @returns {'external'|'deny'}
 */
function classifyNewWindow(targetUrl) {
  const target = parse(targetUrl);
  return target && EXTERNAL_PROTOCOLS.has(target.protocol) ? 'external' : 'deny';
}

/**
 * Maps an `app://loop/<pathname>` request onto the web build directory.
 *
 * @returns {{ kind: 'file'|'spa'|'forbidden', file?: string }}
 *   - `spa`: no such file and the path looks like a route (no extension) →
 *     serve index.html, same as the nginx `try_files ... /index.html` rule
 *     in the mobile repo's docs/guides/WEB_BUILD_DEPLOY_GUIDE.md.
 *   - `file` with a path that may not exist: caller checks and 404s.
 */
function resolveWebPath(webRoot, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return { kind: 'forbidden' };
  }

  const root = path.resolve(webRoot);
  const file = path.resolve(root, `.${path.posix.normalize(`/${decoded}`)}`);
  if (file !== root && !file.startsWith(root + path.sep)) return { kind: 'forbidden' };

  if (file === root || decoded.endsWith('/')) return { kind: 'spa' };
  return { kind: path.extname(file) ? 'file' : 'spa', file };
}

module.exports = {
  isAppUrl,
  classifyMainNavigation,
  classifyNewWindow,
  resolveWebPath,
};
