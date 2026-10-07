/**
 * Metro for the desktop bundle.
 *
 * - Source comes from the mobile project (watchFolders) and so do packages
 *   (`node_modules` here is a link to the mobile project's, made by
 *   scripts/prepare-renderer.js).
 * - Overrides: a file at `overrides/<path>` replaces `<mobile>/<path>` for
 *   every importer, whichever specifier (alias or relative) it used. An
 *   override can still import the rest of the app normally — including with
 *   the original's relative specifiers (`./systematicFlows`), which resolve
 *   from the mobile file's folder as if the override lived there. Each
 *   override is pinned to the original's hash in ../overrides.lock.json.
 * - `inlineRequires` mirrors the mobile project's metro.config.js.
 */
const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const MOBILE_DIR = require('./mobileDir');

const OVERRIDES_DIR = path.join(__dirname, 'overrides');

function listOverrides(dir = OVERRIDES_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listOverrides(full) : [full];
  });
}

/** `<mobile>/contexts/MenuContext.js` → `<renderer>/overrides/contexts/MenuContext.js` */
const OVERRIDES = new Map(
  listOverrides().map((file) => [path.join(MOBILE_DIR, path.relative(OVERRIDES_DIR, file)), file])
);

const config = getDefaultConfig(__dirname);

config.watchFolders = [MOBILE_DIR];
config.resolver.nodeModulesPaths = [path.join(MOBILE_DIR, 'node_modules')];

const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // An override's relative imports mean what they mean in the file it replaces.
  const fromOverride = moduleName.startsWith('.') && context.originModulePath.startsWith(OVERRIDES_DIR + path.sep);
  const ctx = fromOverride
    ? { ...context, originModulePath: path.join(MOBILE_DIR, path.relative(OVERRIDES_DIR, context.originModulePath)) }
    : context;
  const resolved = (upstreamResolve || context.resolveRequest)(ctx, moduleName, platform);
  if (resolved?.type === 'sourceFile') {
    const override = OVERRIDES.get(resolved.filePath);
    if (override) return { type: 'sourceFile', filePath: override };
  }
  return resolved;
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
