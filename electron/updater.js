const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const ORIGIN = 'https://clpiran.com';
const newer = (a, b) => {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if (left[i] !== right[i]) return left[i] > right[i]; }
  return false;
};
function validateRelease(release, variant, version) {
  if (!release || release.app !== 'desktop' || release.platform !== 'windows' || release.variant !== variant || !/^\d+\.\d+\.\d+$/.test(release.version) || !newer(release.version, version)) throw Error('Invalid update release');
  const [family, arch] = variant.split('-');
  const name = `Loop-${release.version}-Windows-${family === 'win7' ? '7-8' : '10-11'}-${arch === 'x64' ? '64' : '32'}bit-Setup.exe`;
  const url = new URL(release.url);
  if (url.origin !== ORIGIN || url.pathname !== '/downloads/windows/' + name || url.username || url.password || !/^[a-f0-9]{64}$/i.test(release.sha256) || !Number.isSafeInteger(release.bytes) || release.bytes < 1024 || release.bytes > 1024 * 1024 * 1024) throw Error('Untrusted installer');
  return name;
}
function request(url, consume, redirects = 0) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    if (target.origin !== ORIGIN || redirects > 5) return reject(Error('Untrusted update redirect'));
    const req = https.get(target, { headers: { 'Accept-Encoding': 'identity' } }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume(); return request(new URL(response.headers.location, target), consume, redirects + 1).then(resolve, reject);
      }
      if (response.statusCode !== 200) { response.resume(); reject(Error('Update server unavailable')); return; }
      Promise.resolve(consume(response)).then(resolve, reject);
    });
    req.setTimeout(45000, () => req.destroy(Error('Update request timed out')));
    req.on('error', reject);
  });
}
function createUpdater(app, notify, dependencies = {}) {
  const variant = dependencies.variant || ((Number(os.release().split('.')[0]) >= 10 ? 'win10-' : 'win7-') + (process.arch === 'ia32' ? 'ia32' : 'x64'));
  const version = app.getVersion();
  const root = path.join(app.getPath('userData'), 'updates');
  let release, readyFile, downloading;
  const publish = value => notify?.(value);
  return {
    async check() {
      const query = new URLSearchParams({ app: 'desktop', platform: 'windows', variant, version });
      const result = await request(ORIGIN + '/api/app-updates/check?' + query, async response => {
        const chunks = []; let size = 0;
        for await (const chunk of response) { size += chunk.length; if (size > 1024 * 1024) throw Error('Oversized update metadata'); chunks.push(chunk); }
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
      });
      if (result.available) { validateRelease(result.release, variant, version); if (!downloading) release = result.release; }
      else if (!downloading) release = null;
      return result;
    },
    async download() {
      if (downloading) return downloading;
      const name = validateRelease(release, variant, version);
      const selected = release;
      fs.mkdirSync(root, { recursive: true });
      const partial = path.join(root, name + '.part');
      downloading = (async () => {
        try {
          await request(selected.url, response => new Promise((resolve, reject) => {
            const output = fs.createWriteStream(partial, { flags: 'w', mode: 0o600 });
            const digest = crypto.createHash('sha256'); let bytes = 0, lastPercent = -1;
            const fail = error => { response.destroy(); output.destroy(); reject(error); };
            response.on('data', chunk => {
              bytes += chunk.length; if (bytes > selected.bytes) { fail(Error('Installer size exceeds release')); return; }
              digest.update(chunk); const percent = Math.floor(bytes * 100 / selected.bytes);
              if (percent !== lastPercent) { lastPercent = percent; publish({ status: 'downloading', progress: percent }); }
            });
            response.on('error', fail); response.on('aborted', () => fail(Error('Download interrupted'))); output.on('error', fail);
            output.on('finish', () => {
              if (bytes !== selected.bytes || digest.digest('hex').toLowerCase() !== selected.sha256.toLowerCase()) reject(Error('Installer verification failed'));
              else resolve();
            });
            response.pipe(output);
          }));
          readyFile = path.join(root, name);
          fs.renameSync(partial, readyFile);
          publish({ status: 'ready', progress: 100 }); return true;
        } catch (error) { fs.rmSync(partial, { force: true }); publish({ status: 'error' }); throw error; }
        finally { downloading = null; }
      })();
      return downloading;
    },
    async install() {
      validateRelease(release, variant, version);
      if (!readyFile || !fs.existsSync(readyFile)) throw Error('Download the update first');
      const digest = crypto.createHash('sha256');
      for await (const chunk of fs.createReadStream(readyFile)) digest.update(chunk);
      if (digest.digest('hex').toLowerCase() !== release.sha256.toLowerCase() || fs.statSync(readyFile).size !== release.bytes) throw Error('Downloaded installer changed');
      if (process.platform !== 'win32') throw Error('Windows installation is unavailable on this platform');
      await new Promise((resolve, reject) => {
        const child = (dependencies.spawn || spawn)(readyFile, [], { detached: true, stdio: 'ignore', shell: false });
        child.once('error', reject); child.once('spawn', () => { child.unref(); resolve(); });
      });
      app.quit(); return 'installer_opened';
    },
  };
}
module.exports = { createUpdater, validateRelease, newer };
