/**
 * Light / dark theme of the desktop app.
 *
 * The mode is 'light', 'dark' or 'system' (follow the OS), remembered per
 * machine; dark until the user picks otherwise. The resolved theme is written to `<html data-loop-theme>`, which
 * switches the CSS variables the desktop tokens are made of
 * (desktopTheme THEME_VARS, emitted by ./globalStyles). Components don't
 * re-render to change colour; only the toggle reads the mode.
 */
import { useSyncExternalStore } from 'react';

const KEY = 'loop.theme';
const listeners = new Set();

const read = () => {
  try {
    const saved = window.localStorage.getItem(KEY);
    return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'dark';
  } catch {
    return 'dark';
  }
};

let mode = typeof window !== 'undefined' ? read() : 'dark';

const media = () =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export const resolveTheme = (m = mode) => (m === 'system' ? (media()?.matches ? 'dark' : 'light') : m);

const apply = () => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.loopTheme = resolveTheme();
  listeners.forEach((listener) => listener());
};

export function setThemeMode(next) {
  mode = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    // only a preference
  }
  apply();
}

export function toggleTheme() {
  setThemeMode(resolveTheme() === 'dark' ? 'light' : 'dark');
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** @returns {{ mode: 'light'|'dark'|'system', theme: 'light'|'dark' }} */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => resolveTheme());
  return { mode, theme };
}

if (typeof window !== 'undefined') {
  apply();
  media()?.addEventListener?.('change', () => {
    if (mode === 'system') apply();
  });
}
