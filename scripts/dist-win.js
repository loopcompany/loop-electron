/**
 * Builds the Windows installers, one per Windows generation and CPU, into release/<version>/:
 *
 *   Loop-<version>-Windows-10-11-64bit-Setup.exe  (win10-x64)   Electron from package.json
 *   Loop-<version>-Windows-10-11-32bit-Setup.exe  (win10-ia32)  Electron 43 (last with 32-bit Windows)
 *   Loop-<version>-Windows-7-8-64bit-Setup.exe    (win7-x64)    Electron 22 (last for Windows 7/8/8.1)
 *   Loop-<version>-Windows-7-8-32bit-Setup.exe    (win7-ia32)   Electron 22
 *
 * electron-builder works in release/.work (unpacked apps, blockmaps, debug files), which is
 * deleted afterwards so release/ only holds the installers.
 *
 * Electron 22 is end-of-life (no security fixes) — ship it only to Windows 7/8 users.
 * All variants share appId, so they install over each other and keep the user's login.
 *
 * Usage: node scripts/dist-win.js [nsis|zip] [variant ...]   (default: nsis, all variants)
 * Expects web-build/ to exist (`npm run build:web`).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { ROOT, SPAWN_OPTS } = require('./paths');

const LEGACY_ELECTRON = '22.3.27';
const IA32_ELECTRON = '43.7.9';

const VARIANTS = {
  'win10-x64': { arch: 'x64', label: 'Windows-10-11-64bit' },
  'win10-ia32': { arch: 'ia32', label: 'Windows-10-11-32bit', electronVersion: IA32_ELECTRON },
  'win7-x64': { arch: 'x64', label: 'Windows-7-8-64bit', electronVersion: LEGACY_ELECTRON },
  'win7-ia32': { arch: 'ia32', label: 'Windows-7-8-32bit', electronVersion: LEGACY_ELECTRON },
};

const { version } = require('../package.json');
const WORK_DIR = path.join(ROOT, 'release', '.work');
const OUT_DIR = path.join(ROOT, 'release', version);

const args = process.argv.slice(2);
const target = ['nsis', 'zip'].includes(args[0]) ? args.shift() : 'nsis';
const names = args.length ? args : Object.keys(VARIANTS);

const unknown = names.filter((name) => !VARIANTS[name]);
if (unknown.length) {
  console.error(`[loop] unknown variant(s): ${unknown.join(', ')}. Known: ${Object.keys(VARIANTS).join(', ')}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(ROOT, 'web-build', 'index.html'))) {
  console.error('[loop] web-build/ is missing — run "npm run build:web" first.');
  process.exit(1);
}

fs.rmSync(WORK_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const name of names) {
  const { arch, label, electronVersion } = VARIANTS[name];
  const artifactName = `Loop-${version}-${label}-${target === 'nsis' ? 'Setup' : 'Portable'}.\${ext}`;
  const builderArgs = [
    'electron-builder',
    '--win',
    target,
    `--${arch}`,
    `-c.directories.output=${WORK_DIR}`,
    `-c.${target === 'nsis' ? 'nsis' : 'win'}.artifactName=${artifactName}`,
    ...(electronVersion ? [`-c.electronVersion=${electronVersion}`] : []),
  ];

  console.log(`\n[loop] building ${name} (${target}, Electron ${electronVersion || 'from package.json'})`);
  const result = spawnSync('npx', builderArgs, { ...SPAWN_OPTS, cwd: ROOT });
  if (result.status !== 0) process.exit(result.status ?? 1);

  const file = artifactName.replace('${ext}', target === 'nsis' ? 'exe' : 'zip');
  fs.renameSync(path.join(WORK_DIR, file), path.join(OUT_DIR, file));
  console.log(`[loop] ready: release/${version}/${file}`);
}

fs.rmSync(WORK_DIR, { recursive: true, force: true });
