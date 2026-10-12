/**
 * `app://loop` — serves the exported web build to the renderer.
 *
 * `registerSchemePrivileges()` must run before `app.whenReady()`;
 * `registerAppProtocol()` after it.
 *
 * The Windows 7/8 build runs on Electron 22, which predates `protocol.handle`
 * (Electron 25), so it falls back to `registerFileProtocol`.
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

/** @returns {{ file: string } | { status: 403 | 404 }} */
function resolveRequest(webRoot, url) {
  const { host, pathname } = new URL(url);
  if (host !== APP_HOST) return { status: 404 };

  const resolved = resolveWebPath(webRoot, pathname);
  if (resolved.kind === 'forbidden') return { status: 403 };
  if (resolved.file && isFile(resolved.file)) return { file: resolved.file };
  if (resolved.kind === 'spa') return { file: path.join(webRoot, 'index.html') };

  return { status: 404 };
}

/** @param {string} webRoot absolute path of the `expo export -p web` output */
function registerAppProtocol(webRoot) {
  if (!protocol.handle) {
    // Electron 22: net::ERR_ACCESS_DENIED (-10) / net::ERR_FILE_NOT_FOUND (-6)
    protocol.registerFileProtocol(APP_SCHEME, (request, callback) => {
      const result = resolveRequest(webRoot, request.url);
      callback(result.file ? { path: result.file } : { error: result.status === 403 ? -10 : -6 });
    });
    return;
  }

  protocol.handle(APP_SCHEME, (request) => {
    const result = resolveRequest(webRoot, request.url);
    if (result.file) return serveFile(result.file);
    return new Response(result.status === 403 ? 'Forbidden' : 'Not found', { status: result.status });
  });
}

module.exports = { registerSchemePrivileges, registerAppProtocol };
