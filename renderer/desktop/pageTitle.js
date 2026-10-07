import { useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * What each screen's header said, by route key, so the shell's top bar can
 * show it. Screens don't know about the top bar: the ScreenHeaders override
 * registers the title (and the back behaviour it was given) for the route it
 * is rendered in, and renders nothing itself.
 *
 * @typedef {{ title: string, onBack?: () => void }} PageMeta
 */
const pages = new Map();
const listeners = new Set();
let version = 0;

const emit = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * @param {string|undefined} routeKey
 * @param {string|undefined} title
 * @param {(() => void)|undefined} [onBack]  the screen's own back behaviour
 */
export function usePublishPageTitle(routeKey, title, onBack) {
  // The latest handler is read through a ref, so a screen re-creating its
  // callback on every render doesn't churn the store.
  const backRef = useRef(onBack);
  backRef.current = onBack;
  const hasBack = !!onBack;

  useEffect(() => {
    if (!routeKey || !title) return undefined;
    const entry = {
      title: String(title).trim(),
      onBack: hasBack ? () => backRef.current?.() : undefined,
    };
    pages.set(routeKey, entry);
    emit();
    return () => {
      if (pages.get(routeKey) === entry) pages.delete(routeKey);
      emit();
    };
  }, [routeKey, title, hasBack]);
}

/**
 * @param {string|undefined} routeKey
 * @returns {PageMeta|null}
 */
export function usePageMeta(routeKey) {
  useSyncExternalStore(subscribe, () => version);
  return (routeKey && pages.get(routeKey)) || null;
}

/**
 * @param {string|undefined} routeKey
 * @returns {string}
 */
export function usePageTitle(routeKey) {
  return usePageMeta(routeKey)?.title || '';
}
