/**
 * Sandboxed preload. Exposes a small, read-only `window.loopDesktop` so the
 * shared web code can tell it is running inside the desktop app:
 *
 *   const isDesktop = typeof window !== 'undefined' && !!window.loopDesktop;
 *
 * Keep this surface minimal — every addition is reachable from page script.
 */
const { contextBridge } = require('electron');

const argValue = (name) => {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : null;
};

contextBridge.exposeInMainWorld('loopDesktop', {
  isDesktop: true,
  platform: process.platform,
  appVersion: argValue('loop-app-version'),
  /** 'overlay': the app draws its own title bar (Windows); 'native': the OS frame. */
  titleBar: argValue('loop-title-bar') || 'native',
  electronVersion: process.versions.electron,
});
