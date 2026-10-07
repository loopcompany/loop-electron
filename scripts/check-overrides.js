/**
 * Guards the files in renderer/overrides/ against silently going stale.
 *
 * Each override replaces a mobile file in the desktop bundle and was written
 * against a specific version of it; overrides.lock.json pins that version's
 * sha256. If the mobile file has changed since, the desktop copy is missing
 * those changes — fail and say which file to port.
 *
 *   node scripts/check-overrides.js           check (runs before every build)
 *   node scripts/check-overrides.js --accept  re-pin after porting the change
 *
 * Also checks that renderer/babel.config.js knows every alias the mobile
 * project defines, since mobile files are compiled with the renderer config.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { ROOT, RENDERER_DIR, MOBILE_DIR, assertMobileDir } = require('./paths');

const LOCK_FILE = path.join(ROOT, 'overrides.lock.json');
const OVERRIDES_DIR = path.join(RENDERER_DIR, 'overrides');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function listOverrides(dir = OVERRIDES_DIR) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listOverrides(full) : [path.relative(OVERRIDES_DIR, full).split(path.sep).join('/')];
  });
}

function mobileAliases() {
  const source = fs.readFileSync(path.join(MOBILE_DIR, 'babel.config.js'), 'utf8');
  return [...source.matchAll(/'@([a-z]+)':\s*'\.\//gi)].map((m) => m[1]);
}

assertMobileDir();

const accept = process.argv.includes('--accept');
const lock = fs.existsSync(LOCK_FILE) ? JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')) : {};
const nextLock = {};
const problems = [];

for (const rel of listOverrides()) {
  const original = path.join(MOBILE_DIR, rel);
  if (!fs.existsSync(original)) {
    problems.push(`${rel}: no longer exists in the mobile project — remove or re-target the override.`);
    continue;
  }
  const hash = sha256(original);
  nextLock[rel] = hash;
  if (!accept && lock[rel] !== hash) {
    problems.push(
      `${rel}: the mobile file changed since the override was written.\n` +
        `    see: git -C "${MOBILE_DIR}" log -p -- ${rel}\n` +
        `    port the change into renderer/overrides/${rel}, then run: npm run overrides:accept`
    );
  }
}

const { MOBILE_ALIASES } = require(path.join(RENDERER_DIR, 'babel.config.js'));
const missing = mobileAliases().filter((name) => !MOBILE_ALIASES.includes(name));
if (missing.length) {
  problems.push(`renderer/babel.config.js is missing mobile aliases: ${missing.map((n) => `@${n}`).join(', ')}`);
}

if (accept) {
  fs.writeFileSync(LOCK_FILE, `${JSON.stringify(nextLock, null, 2)}\n`);
  console.log(`[loop] overrides.lock.json updated (${Object.keys(nextLock).length} file(s)).`);
}

if (problems.length) {
  console.error(`[loop] override check failed:\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
if (!accept) console.log(`[loop] overrides up to date (${Object.keys(nextLock).length} file(s)).`);
