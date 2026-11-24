const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRelease, newer } = require('../electron/updater');

const release = { app: 'desktop', platform: 'windows', variant: 'win10-x64', version: '1.1.10',
  url: 'https://clpiran.com/downloads/windows/Loop-1.1.10-Windows-10-11-64bit-Setup.exe', bytes: 1000000, sha256: 'a'.repeat(64) };
test('update comparison handles 1.1.10 correctly and prevents downgrades', () => {
  assert.equal(newer('1.1.10', '1.1.9'), true);
  assert.equal(newer('1.1.9', '1.1.10'), false);
  assert.equal(newer('1.1.10', '1.1.10'), false);
  assert.match(validateRelease(release, 'win10-x64', '1.1.9'), /1\.1\.10/);
  assert.throws(() => validateRelease(release, 'win10-x64', '1.1.10'));
});
test('update metadata cannot switch origin, OS, CPU, artifact path or checksum shape', () => {
  for (const change of [{ url: release.url.replace('clpiran.com', 'evil.example') }, { url: release.url.replace('https:', 'http:') },
    { url: 'https://clpiran.com/downloads/windows/payload.exe' }, { variant: 'win7-ia32' }, { sha256: 'bad' }, { bytes: 0 }, { app: 'customer' }]) {
    assert.throws(() => validateRelease({ ...release, ...change }, 'win10-x64', '1.1.9'));
  }
});
