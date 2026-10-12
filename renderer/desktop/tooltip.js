/**
 * Hover labels, like the ones the Windows taskbar shows: rest the mouse on a
 * sidebar entry or a top-bar button and its name appears in a small bubble
 * above it. One listener on the document serves the whole app, and the bubble
 * lives on <body>, so scroll areas and rounded cards never clip it.
 *
 * An element opts in with `{...tip(label)}` (React Native Web turns `dataSet`
 * into a `data-tip` attribute).
 */
import { palette } from './desktopTheme';

/** Props that give a React Native Web element a hover label. */
export const tip = (label) => (label ? { dataSet: { tip: String(label) } } : {});

const SHOW_DELAY = 380;
const GAP = 8;
const EDGE = 6;

const CSS = `
#loop-tooltip {
  position: fixed; z-index: 2147483000; pointer-events: none;
  max-width: 280px; padding: 5px 10px; border-radius: 8px;
  background: ${palette.navy950}; color: #fff;
  border: 1px solid rgba(255, 215, 0, 0.35);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  font-family: VazirBoldFD, VazirBold, sans-serif;
  font-size: 12px; line-height: 1.6; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
  opacity: 0; transform: translateY(3px);
  transition: opacity 120ms ease, transform 120ms ease;
}
#loop-tooltip[data-on] { opacity: 1; transform: translateY(0); }
`;

let installed = false;

export function installTooltips() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const bubble = document.createElement('div');
  bubble.id = 'loop-tooltip';
  bubble.setAttribute('role', 'tooltip');
  document.body.appendChild(bubble);

  let target = null;
  let timer = null;

  const hide = () => {
    clearTimeout(timer);
    target = null;
    bubble.removeAttribute('data-on');
  };

  const show = (el) => {
    if (!el.isConnected) return;
    const label = el.getAttribute('data-tip');
    bubble.textContent = label;
    bubble.dir = /[؀-ۿ]/.test(label) ? 'rtl' : 'ltr';
    const r = el.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    let left = r.left + r.width / 2 - b.width / 2;
    left = Math.max(EDGE, Math.min(left, vw - b.width - EDGE));
    // above the element; below it when there is no room up there
    let top = r.top - b.height - GAP;
    if (top < EDGE) top = r.bottom + GAP;
    bubble.style.left = `${Math.round(left)}px`;
    bubble.style.top = `${Math.round(top)}px`;
    bubble.setAttribute('data-on', '');
  };

  document.addEventListener(
    'mouseover',
    (e) => {
      const el = e.target instanceof Element ? e.target.closest('[data-tip]') : null;
      if (el === target) return;
      hide();
      if (!el) return;
      target = el;
      timer = setTimeout(() => show(el), SHOW_DELAY);
    },
    true
  );
  document.addEventListener('mousedown', hide, true);
  document.addEventListener('wheel', hide, { capture: true, passive: true });
  document.addEventListener('keydown', hide, true);
  window.addEventListener('blur', hide);
  document.documentElement.addEventListener('mouseleave', hide);
}
