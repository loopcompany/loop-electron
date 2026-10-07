/**
 * Locations shared by the build scripts.
 * MOBILE_DIR defaults to the sibling folder; override with LOOP_MOBILE_DIR.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RENDERER_DIR = path.join(ROOT, 'renderer');
const MOBILE_DIR = require('../renderer/mobileDir');

function assertMobileDir() {
  if (!fs.existsSync(path.join(MOBILE_DIR, 'package.json'))) {
    console.error(`[loop] mobile project not found at ${MOBILE_DIR}. Set LOOP_MOBILE_DIR.`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(MOBILE_DIR, 'node_modules'))) {
    console.error(`[loop] ${MOBILE_DIR}/node_modules is missing — run "npm install" there first.`);
    process.exit(1);
  }
}

/** npx is a .cmd shim on Windows, which spawn() only resolves through a shell. */
const SPAWN_OPTS = { cwd: RENDERER_DIR, stdio: 'inherit', shell: process.platform === 'win32' };

module.exports = { ROOT, RENDERER_DIR, MOBILE_DIR, assertMobileDir, SPAWN_OPTS };
