/**
 * Makes renderer/ a runnable Expo project without copying the mobile app:
 *   renderer/node_modules → link to <mobile>/node_modules
 *                           (a junction on Windows: no admin rights needed)
 *   renderer/public       ← fresh copy of <mobile>/public (index.html, styles.css, ...)
 *                           Expo refuses a public folder that resolves outside
 *                           the project root, so this one can't be a link.
 */
const fs = require('fs');
const path = require('path');

const { RENDERER_DIR, MOBILE_DIR, assertMobileDir } = require('./paths');

function link(name) {
  const target = path.join(MOBILE_DIR, name);
  const linkPath = path.join(RENDERER_DIR, name);

  try {
    if (fs.realpathSync(linkPath) === fs.realpathSync(target)) return;
  } catch {
    // missing or dangling — recreated below
  }

  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
  console.log(`[loop] linked renderer/${name} → ${target}`);
}

function copyPublic() {
  const target = path.join(RENDERER_DIR, 'public');
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(path.join(MOBILE_DIR, 'public'), target, { recursive: true });
}

function prepareRenderer() {
  assertMobileDir();
  link('node_modules');
  copyPublic();
}

if (require.main === module) prepareRenderer();

module.exports = { prepareRenderer };
