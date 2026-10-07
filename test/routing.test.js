const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { classifyMainNavigation, classifyNewWindow, resolveWebPath } = require('../electron/routing');

const APP = 'app://loop';
const ctx = { appOrigins: [APP], currentUrl: `${APP}/orders` };

test('in-app navigation is allowed', () => {
  assert.equal(classifyMainNavigation(`${APP}/list`, ctx), 'allow');
});

test('payment gateway opens in the same window, like web', () => {
  assert.equal(classifyMainNavigation('https://sep.shaparak.ir/OnlinePG/SendToken?token=x', ctx), 'allow');
});

test('bank redirect back into the app is re-issued with loadURL', () => {
  const fromBank = { appOrigins: [APP], currentUrl: 'https://sep.shaparak.ir/OnlinePG' };
  assert.equal(classifyMainNavigation(`${APP}/?status=OK`, fromBank), 'load-app');
});

test('backend PDFs and receipts go to the system browser', () => {
  assert.equal(classifyMainNavigation('https://clpiran.com/storage/contracts/a.pdf', ctx), 'external');
  assert.equal(classifyMainNavigation('https://clpiran.com/reciept/42', ctx), 'external');
  assert.equal(classifyMainNavigation('tel:02191693909', ctx), 'external');
});

test('unknown schemes are denied', () => {
  assert.equal(classifyMainNavigation('file:///C:/Windows/win.ini', ctx), 'deny');
  assert.equal(classifyMainNavigation('javascript:alert(1)', ctx), 'deny');
  assert.equal(classifyMainNavigation('not a url', ctx), 'deny');
});

test('window.open never creates an app window', () => {
  assert.equal(classifyNewWindow('https://accounts.google.com/signup'), 'external');
  assert.equal(classifyNewWindow('mailto:a@b.c'), 'external');
  assert.equal(classifyNewWindow('file:///etc/passwd'), 'deny');
  assert.equal(classifyNewWindow('ms-settings:privacy'), 'deny');
});

test('web paths: files, SPA routes, traversal', () => {
  const root = path.resolve('/srv/web');
  assert.deepEqual(resolveWebPath(root, '/_expo/static/js/web/index.js'), {
    kind: 'file',
    file: path.join(root, '_expo/static/js/web/index.js'),
  });
  assert.equal(resolveWebPath(root, '/').kind, 'spa');
  assert.equal(resolveWebPath(root, '/orders/12').kind, 'spa');
  assert.equal(resolveWebPath(root, '/%D8%B1%D8%B3%DB%8C%D8%AF.png').kind, 'file');
  assert.notEqual(resolveWebPath(root, '/../../etc/passwd').file, '/etc/passwd');
  assert.equal(resolveWebPath(root, '/%2e%2e/%2e%2e/etc/passwd').file?.startsWith(root), true);
  assert.equal(resolveWebPath(root, '/%E0%A4%A').kind, 'forbidden');
});
