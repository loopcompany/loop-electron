/**
 * Native browser dialogs, made safe for the desktop app. Imported for its side
 * effect by renderer/index.js, before the mobile entry runs.
 *
 * - `alert()` becomes an in-app toast. The mobile helpers (`showToastOrAlert`,
 *   …) call `alert()` on the web, which in Electron opens a native box headed
 *   "user-panel.clpiran.com says". Worse, on Windows the page can be left
 *   unable to take keyboard focus once that box closes: inputs look focused
 *   but typing does nothing (seen in the address form after a map action).
 * - `confirm()` / `prompt()` must stay native (callers need the answer
 *   synchronously); afterwards the main process gives the window its focus
 *   back (`loopDesktop.refocus`, see electron/main.js).
 *
 * The toast lives on <body> like ./tooltip, so scroll areas never clip it.
 */
import { palette } from './desktopTheme';

const MAX_TOASTS = 3;
const MIN_MS = 2600;
const PER_CHAR_MS = 45;
const MAX_MS = 7000;

const CSS = `
#loop-toasts {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
  z-index: 2147483001; display: flex; flex-direction: column; align-items: center; gap: 10px;
  pointer-events: none; width: max-content; max-width: min(520px, calc(100vw - 32px));
}
.loop-toast {
  pointer-events: auto; cursor: pointer; box-sizing: border-box; max-width: 100%;
  display: flex; align-items: center; gap: 12px; padding: 12px 0; padding-inline: 14px 18px;
  border-radius: 14px; color: #fff;
  background: linear-gradient(135deg, ${palette.navy700} 0%, ${palette.navy850} 60%, ${palette.navy950} 100%);
  border: 1px solid rgba(255, 215, 0, 0.32);
  box-shadow: 0 18px 50px rgba(4, 15, 31, 0.38), 0 4px 12px rgba(4, 15, 31, 0.2);
  font-family: VazirLightFD, VazirLight, sans-serif; font-size: 13.5px; line-height: 1.75;
  white-space: pre-line; overflow-wrap: anywhere; unicode-bidi: plaintext; text-align: start;
  opacity: 0; transform: translateY(12px) scale(0.98);
  transition: opacity 180ms ease, transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.loop-toast[data-on] { opacity: 1; transform: none; }
.loop-toast-icon {
  flex: none; width: 26px; height: 26px; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255, 215, 0, 0.16); color: ${palette.gold};
  font-family: VazirBold, sans-serif; font-size: 14px; line-height: 1;
}
`;

let host = null;

function ensureHost() {
  if (host?.isConnected) return host;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  host = document.createElement('div');
  host.id = 'loop-toasts';
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live', 'polite');
  document.body.appendChild(host);
  return host;
}

function dismiss(toast) {
  if (!toast.isConnected || toast.dataset.leaving) return;
  toast.dataset.leaving = '1';
  clearTimeout(toast._timer);
  toast.removeAttribute('data-on');
  setTimeout(() => toast.remove(), 300);
}

const durationFor = (text) => Math.min(MAX_MS, Math.max(MIN_MS, text.length * PER_CHAR_MS));

/** Shows a short, non-blocking message at the bottom of the window. */
export function showToast(message) {
  if (typeof document === 'undefined' || !document.body) return;
  const text = message == null ? '' : String(message).trim();
  if (!text) return;

  const stack = ensureHost();

  // The same message again (a double click) only restarts its timer.
  const same = [...stack.children].find((el) => !el.dataset.leaving && el._text === text);
  if (same) {
    clearTimeout(same._timer);
    same._timer = setTimeout(() => dismiss(same), durationFor(text));
    return;
  }

  const toast = document.createElement('div');
  toast.className = 'loop-toast';
  // the message's own direction (the Latin «i» icon would make `dir="auto"` LTR)
  toast.dir = /^[^A-Za-z֐-ࣿ]*[֐-ࣿ]/.test(text) ? 'rtl' : 'ltr';
  toast._text = text;
  const icon = document.createElement('span');
  icon.className = 'loop-toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = 'i';
  const body = document.createElement('span');
  body.textContent = text;
  toast.append(icon, body);
  toast.addEventListener('click', () => dismiss(toast));

  stack.appendChild(toast);
  const live = [...stack.children].filter((el) => !el.dataset.leaving);
  live.slice(0, Math.max(0, live.length - MAX_TOASTS)).forEach(dismiss);

  requestAnimationFrame(() => toast.setAttribute('data-on', ''));
  toast._timer = setTimeout(() => dismiss(toast), durationFor(text));
}

/** Runs a native dialog, then asks the main process to give the window its focus back. */
const thenRefocus = (native) =>
  function nativeDialog(...args) {
    const result = native.apply(window, args);
    try {
      window.loopDesktop?.refocus?.();
    } catch {
      /* not in Electron (plain web build) */
    }
    return result;
  };

if (typeof window !== 'undefined' && window.loopDesktop) {
  window.alert = (message) => showToast(message);
  if (typeof window.confirm === 'function') window.confirm = thenRefocus(window.confirm);
  if (typeof window.prompt === 'function') window.prompt = thenRefocus(window.prompt);
}
