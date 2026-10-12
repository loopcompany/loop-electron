/**
 * Builds the desktop bundle:
 *   1. checks renderer/overrides against the mobile project (check-overrides)
 *   2. links renderer/node_modules, copies public/ from the mobile project
 *   3. `expo export -p web` in renderer/ → ./web-build
 *
 * The app icon is ./build/icon.ico (16–256 px) with ./build/icon.png (512 px) for
 * the window — the mobile icon with rounded corners, generated once and kept
 * in this repo (the mobile project is not read for it at build time).
 *
 * The mobile project is only read, never written.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { ROOT, MOBILE_DIR, SPAWN_OPTS } = require('./paths');
const { prepareRenderer } = require('./prepare-renderer');

const OUT_DIR = path.join(ROOT, 'web-build');

const check = spawnSync(process.execPath, [path.join(__dirname, 'check-overrides.js')], { stdio: 'inherit' });
if (check.status !== 0) process.exit(check.status ?? 1);

prepareRenderer();
fs.rmSync(OUT_DIR, { recursive: true, force: true });

console.log(`[loop] exporting desktop bundle (sources: ${MOBILE_DIR})`);
const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--clear', '--output-dir', OUT_DIR], SPAWN_OPTS);
if (result.status !== 0) process.exit(result.status ?? 1);

if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
  console.error('[loop] export finished but web-build/index.html is missing.');
  process.exit(1);
}

console.log(`[loop] web build ready: ${OUT_DIR}`);
