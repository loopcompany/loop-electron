/**
 * Expo config for the desktop web export. Only what `expo export -p web`
 * reads; native config (plugins, Firebase files, bundle ids) stays in the
 * mobile project where it belongs.
 */
const path = require('path');

const MOBILE_DIR = require('./mobileDir');

module.exports = () => ({
  name: 'loop',
  slug: 'loop',
  version: require(path.join(MOBILE_DIR, 'app.json')).expo.version,
  userInterfaceStyle: 'light',
  web: {
    bundler: 'metro',
    favicon: path.relative(__dirname, path.join(MOBILE_DIR, 'assets', 'favicon.png')),
  },
});
