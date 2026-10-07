/**
 * Launches Electron on this project with ELECTRON_RUN_AS_NODE removed.
 * Terminals spawned by VS Code (and other Electron-based tools) can inherit
 * that variable, which silently turns `electron .` into plain Node.
 */
const { spawn } = require('child_process');
const electronBinary = require('electron');

const { ROOT } = require('./paths');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, ['.', ...process.argv.slice(2)], { cwd: ROOT, stdio: 'inherit', env });
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
