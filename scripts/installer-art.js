/**
 * Regenerates the installer's pictures and layout (build/installer/*) from
 * scripts/installer-art/pages.html. Run it after changing that design;
 * the BMPs are committed, so building the installer does not need it.
 *
 * Usage: npm run installer:art [-- --preview <dir>]
 */
const path = require('path');
const { spawn } = require('child_process');
const electronBinary = require('electron');

const { ROOT } = require('./paths');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const script = path.join(__dirname, 'installer-art', 'render.js');
const child = spawn(electronBinary, [script, ...process.argv.slice(2)], { cwd: ROOT, stdio: 'inherit', env });
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
