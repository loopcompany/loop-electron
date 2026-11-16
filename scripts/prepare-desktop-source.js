/** Reproducible mobile snapshot for desktop; never repin overrides to an incompatible branch. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

module.exports = function prepareDesktopSource(mobile) {
  const root = path.resolve(__dirname, '..');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'mobile-source.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'overrides.lock.json'), 'utf8'));
  const overlay = path.join(root, 'renderer', 'mobile-overlay');
  const hash = crypto.createHash('sha256').update(config.revision);
  for (const rel of config.overlayFiles) {
    if (lock[rel] || path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) throw new Error(`Invalid desktop overlay: ${rel}`);
    hash.update(rel).update(fs.readFileSync(path.join(overlay, rel)));
  }
  const cache = path.join(root, '.cache');
  const directory = path.join(cache, 'mobile-' + hash.digest('hex').slice(0, 16));
  const ready = path.join(directory, '.loop-source-ready');
  fs.mkdirSync(cache, { recursive: true });
  if (!fs.existsSync(ready)) {
    fs.mkdirSync(directory, { recursive: true });
    const archive = path.join(cache, 'source-' + config.revision + '.tar');
    const result = spawnSync('git', ['archive', '--format=tar', '-o', archive, config.revision], { cwd: mobile, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`Pinned mobile commit ${config.revision} is unavailable. Fetch it in ${mobile} before building. ${result.stderr}`);
    const extracted = spawnSync('tar', ['-xf', archive, '-C', directory], { encoding: 'utf8' });
    if (extracted.status !== 0) throw new Error(extracted.stderr || 'Could not extract desktop mobile snapshot');
    for (const rel of config.overlayFiles) {
      const destination = path.join(directory, rel);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.join(overlay, rel), destination);
    }
    fs.writeFileSync(ready, config.revision + os.EOL);
  }
  const modules = path.join(directory, 'node_modules');
  if (!fs.existsSync(modules)) fs.symlinkSync(path.join(mobile, 'node_modules'), modules, process.platform === 'win32' ? 'junction' : 'dir');
  process.env.LOOP_MOBILE_DIR = directory;
  return directory;
};
