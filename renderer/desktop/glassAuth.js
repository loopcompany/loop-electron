/**
 * Glass sign-in forms.
 *
 * The sign-in / sign-up screens are the phone screens, each painting its own
 * moon artwork on an opaque near-black background. On the desktop the shell
 * already draws that artwork across the whole window and frames the form in
 * a frosted-glass card (MenuContext `authColumn`), so inside that card:
 *   - the screens' own artwork and opaque backgrounds are made see-through
 *     (`useGlassAuth`), and
 *   - their inputs become glass fields with a gold focus ring (AUTH_CSS,
 *     scoped to `[data-loop-auth]`, so nothing outside the card changes).
 * No screen is edited, so this covers every form in the `auth` layout.
 *
 * The sign-in and sign-up screens themselves are redrawn for the desktop
 * (@desktop/AuthKit); their fields carry `data-loop-field` and are left
 * alone here. This still dresses the screens that aren't redrawn (password
 * recovery and reset).
 */
import { useEffect } from 'react';

/** Backgrounds the auth screens paint that would hide the glass. */
// (phone screen colours, NewStyles.container, and React Navigation's screen background)
const OPAQUE = new Set(['rgb(2, 3, 5)', 'rgb(250, 250, 250)', 'rgb(246, 248, 252)', 'rgb(242, 242, 242)']);

export const AUTH_CSS = `
[data-loop-auth] img[src*="loopbackground"], [data-loop-auth] img[src*="moon."] { opacity: 0 !important; }
[data-loop-auth] input:not([data-loop-field]), [data-loop-auth] textarea:not([data-loop-field]) {
  background-color: rgba(2, 10, 22, 0.58) !important;
  border: 1px solid rgba(160, 192, 235, 0.28) !important;
  border-radius: 14px !important;
  color: #ffffff !important;
  min-height: 52px;
  font-size: 15px !important;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.35) !important;
  transition: border-color 140ms, box-shadow 140ms, background-color 140ms !important;
  backdrop-filter: blur(6px);
}
[data-loop-auth] input:not([data-loop-field]):hover, [data-loop-auth] textarea:not([data-loop-field]):hover { border-color: rgba(190, 215, 250, 0.5) !important; }
[data-loop-auth] input:not([data-loop-field]):focus, [data-loop-auth] textarea:not([data-loop-field]):focus {
  background-color: rgba(4, 16, 34, 0.86) !important;
  border-color: rgba(255, 215, 0, 0.95) !important;
  box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.16), 0 0 24px rgba(255, 215, 0, 0.12) !important;
}
[data-loop-auth] input:not([data-loop-field])::placeholder, [data-loop-auth] textarea:not([data-loop-field])::placeholder { color: rgba(226, 234, 247, 0.6) !important; }
[data-loop-auth] [data-loop-glass="panel"] {
  background-color: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  border-radius: 16px !important;
}
[data-loop-auth] [data-loop-glass="panel"] [dir] { color: rgba(255, 255, 255, 0.88) !important; }
[data-loop-auth] [data-loop-glass="cell"] {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.22) !important;
}
/* desktop select fields (the region picker) */
[data-loop-auth] [data-loop-select] > * {
  background-color: rgba(255, 255, 255, 0.07) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
  border-radius: 14px !important;
}
[data-loop-auth] [data-loop-select] > *:hover { border-color: rgba(255, 255, 255, 0.3) !important; }
[data-loop-auth] [data-loop-select] [dir] { color: rgba(255, 255, 255, 0.88) !important; }
/* the primary action is gold on the glass */
[data-loop-auth] [data-loop-primary] {
  background-image: linear-gradient(135deg, #ffe45c 0%, #ffd700 45%, #e9b308 100%) !important;
  box-shadow: 0 10px 26px rgba(233, 179, 8, 0.28) !important;
}
[data-loop-auth] [data-loop-primary] [dir] { color: #06172d !important; }
[data-loop-auth] input:-webkit-autofill {
  -webkit-text-fill-color: #ffffff !important;
  -webkit-box-shadow: 0 0 0 1000px rgba(16, 40, 72, 0.95) inset !important;
}
`;

export function useGlassAuth(active, routeName) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    const root = document.querySelector('[data-loop-auth]');
    if (!root) return undefined;

    let frame = 0;
    const clear = () => {
      frame = 0;
      root.querySelectorAll('div').forEach((el) => {
        if (el.dataset.loopGlass) return;
        const bg = getComputedStyle(el).backgroundColor;
        if (OPAQUE.has(bg)) {
          el.style.backgroundColor = 'transparent';
          el.dataset.loopGlass = '1';
        } else if (bg === 'rgb(255, 255, 255)' && el.offsetWidth > 240 && el.querySelector('input')) {
          // a white panel holding fields (e.g. the referral code) → a glass panel;
          // small white boxes (the captcha digits) stay white for contrast
          el.dataset.loopGlass = 'panel';
        } else if (bg === 'rgb(255, 255, 255)' && el.closest('[data-loop-glass="panel"]')) {
          // boxes inside such a panel (code cells) follow it
          el.dataset.loopGlass = 'cell';
        }
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(clear);
    };

    clear();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [active, routeName]);
}
