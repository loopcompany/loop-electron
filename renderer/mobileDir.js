/**
 * Absolute path of the shared React Native project. Every screen, service,
 * slice and asset is read from there; nothing is copied into this folder.
 * Override with LOOP_MOBILE_DIR.
 */
const path = require('path');

module.exports = path.resolve(
  process.env.LOOP_MOBILE_DIR || path.join(__dirname, '..', '..', 'loop-customer-mobile')
);
