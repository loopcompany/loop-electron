/**
 * Starts the desktop bundle's Expo dev server on :8081 for `npm run dev`.
 * Sources (and edits to them) come live from the mobile project. Plain
 * `expo start` (not `--web`) so it doesn't open a browser tab.
 */
const { spawn } = require('child_process');

const { SPAWN_OPTS } = require('./paths');
const { prepareRenderer } = require('./prepare-renderer');

prepareRenderer();

const child = spawn('npx', ['expo', 'start', '--port', '8081'], SPAWN_OPTS);
child.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
