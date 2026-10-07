/**
 * `app://loop` — serves the exported web build to the renderer.
 *
 * `registerSchemePrivileges()` must run before `app.whenReady()`;
 * `registerAppProtocol()` after it.
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { protocol, net } = require('electron');

const { APP_SCHEME, APP_HOST } = require('./config');
const { resolveWebPath } = require('./routing');

function registerSchemePrivileges() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: {
        standard: true, // real origin → localStorage, relative URLs, history API
        secure: true, // treated like https (crypto.subtle, secure-context APIs)
        supportFetchAPI: true,
        corsEnabled: true,
        allowServiceWorkers: true,
        stream: true, // range requests for expo-video
      },
    },
  ]);
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function serveFile(file) {
  return net.fetch(pathToFileURL(file).toString());
}

/** @param {string} webRoot absolute path of the `expo export -p web` output */
function registerAppProtocol(webRoot) {
  const indexFile = path.join(webRoot, 'index.html');

  protocol.handle(APP_SCHEME, (request) => {
    const { host, pathname } = new URL(request.url);
    if (host !== APP_HOST) return new Response('Not found', { status: 404 });

    const resolved = resolveWebPath(webRoot, pathname);
    if (resolved.kind === 'forbidden') return new Response('Forbidden', { status: 403 });
    if (resolved.file && isFile(resolved.file)) return serveFile(resolved.file);
    if (resolved.kind === 'spa') return serveFile(indexFile);

    return new Response('Not found', { status: 404 });
  });
}

module.exports = { registerSchemePrivileges, registerAppProtocol };
