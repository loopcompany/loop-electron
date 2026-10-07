/**
 * Runtime constants shared by the main process modules.
 *
 * The UI is the loop-customer-mobile **web build**, served from a privileged
 * custom scheme (`app://loop`) rather than `file://`, so that:
 *   - absolute asset paths emitted by `expo export` (`/_expo/...`, `/assets/...`) resolve,
 *   - React Navigation's path-based linking works (`/orders`, `/list`, ...),
 *   - localStorage (AsyncStorage on web) has a stable origin and survives updates.
 *
 * Changing APP_SCHEME / APP_HOST changes the origin and therefore logs every
 * user out (their token lives in that origin's localStorage). Don't.
 */
const path = require('path');

const APP_SCHEME = 'app';
const APP_HOST = 'loop';
const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;

/** Expo dev server started by `npm run dev:web` (same port as the mobile repo's `npm run web`). */
const DEV_URL = process.env.LOOP_DEV_URL || 'http://localhost:8081';

const isDev = process.argv.includes('--dev');

/** Must match electron-builder's `appId` so Windows groups notifications/taskbar correctly. */
const APP_USER_MODEL_ID = 'com.clpiran.loop.desktop';

/**
 * Where the exported web build lives.
 * Packaged: `resources/web` (electron-builder `extraResources`, kept outside asar).
 * Unpacked (`npm start`): `<repo>/web-build`, produced by `npm run build:web`.
 */
function getWebRoot(app) {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'web')
    : path.resolve(__dirname, '..', 'web-build');
}

module.exports = {
  APP_SCHEME,
  APP_HOST,
  APP_ORIGIN,
  DEV_URL,
  isDev,
  APP_USER_MODEL_ID,
  getWebRoot,
};
