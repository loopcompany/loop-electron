/**
 * Same alias table as loop-customer-mobile/babel.config.js, but every alias
 * points into the mobile project (absolute paths), plus:
 *   @desktop → ./desktop   desktop-only modules
 *   @mobile  → mobile root  (used by index.js)
 *
 * Metro compiles the mobile files with *this* config (Babel's project-wide
 * config is taken from the project root), so the two alias tables must list
 * the same names. `scripts/check-overrides.js` fails the build if they drift.
 */
const path = require('path');

const MOBILE_DIR = require('./mobileDir');

const MOBILE_ALIASES = [
  'assets', 'components', 'contexts', 'helpers', 'i18n', 'hooks', 'navigation', 'org',
  'screens', 'services', 'slices', 'store', 'styles', 'theme', 'utils',
];

module.exports = function (api) {
  const isProduction = api.env('production');

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.js', '.jsx', '.json', '.web.js', '.native.js'],
          alias: {
            ...Object.fromEntries(MOBILE_ALIASES.map((name) => [`@${name}`, path.join(MOBILE_DIR, name)])),
            '@desktop': path.join(__dirname, 'desktop'),
            '@mobile': MOBILE_DIR,
          },
        },
      ],
      isProduction && ['transform-remove-console', { exclude: ['error', 'warn'] }],
    ].filter(Boolean),
  };
};

module.exports.MOBILE_ALIASES = MOBILE_ALIASES;
