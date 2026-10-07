/**
 * Document-level CSS that React Native Web has no style props for: scrollbars,
 * text selection, keyboard focus rings, pointer cursors and a couple of
 * keyframes the desktop components refer to by name. Injected once, when the
 * shell first renders.
 */
import { THEME_VARS, palette } from './desktopTheme';
import { AUTH_CSS } from './glassAuth';

const vars = (values) => Object.entries(values).map(([name, value]) => `--loop-${name}: ${value};`).join(' ');

/* Theme variables. `[data-loop-paper]` (the card phone-style screens sit in)
   keeps the light values in the dark theme, because those screens paint light
   colours of their own. */
const THEME_CSS = `
:root, [data-loop-paper] { ${vars(THEME_VARS.light)} color-scheme: light; }
:root[data-loop-theme="dark"] { ${vars(THEME_VARS.dark)} color-scheme: dark; }
:root[data-loop-theme="dark"] [data-loop-paper] { ${vars(THEME_VARS.light)} color-scheme: light; }
/* the margins around a narrow paper column follow the theme (not redefined by [data-loop-paper]) */
:root { --loop-gutter: ${THEME_VARS.light['card-muted']}; }
:root[data-loop-theme="dark"] { --loop-gutter: ${THEME_VARS.dark.card}; }
/* React Navigation paints every screen with its theme background (#f2f2f2,
   inline). On the canvas that hides the theme; inside a paper card it should
   be the paper colour. */
[data-loop-stage] [style*="background-color: rgb(242, 242, 242)"] { background-color: transparent !important; }
[data-loop-stage] [data-loop-paper] [style*="background-color: rgb(242, 242, 242)"] { background-color: var(--loop-card-muted) !important; }
`;

const CSS = `
html, body, #root { background: ${palette.navy950}; }
body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }

::selection { background: rgba(255, 215, 0, 0.45); color: ${palette.ink}; }

/* Slim, quiet scrollbars that darken on hover */
* { scrollbar-width: thin; scrollbar-color: var(--loop-scrollbar) transparent; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--loop-scrollbar);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: content-box;
}
::-webkit-scrollbar-thumb:hover { background-color: var(--loop-scrollbar-hover); }
::-webkit-scrollbar-corner { background: transparent; }
[data-loop-dark] ::-webkit-scrollbar-thumb,
[data-loop-dark]::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.12); }
[data-loop-dark] ::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.24); }

/* Keyboard focus is visible; mouse focus is not */
:focus { outline: none; }
:focus-visible { outline: 2px solid ${palette.sky}; outline-offset: 2px; border-radius: 8px; }
input:focus-visible, textarea:focus-visible { outline: none; }

/* Everything pressable looks pressable */
[role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="switch"], [role="menuitem"] { cursor: pointer; }
[aria-disabled="true"] { cursor: default; }

/* Inputs across the shared screens: calm borders, a clear focus state */
input, textarea { caret-color: ${palette.brandBright}; }
input::placeholder, textarea::placeholder { color: var(--loop-ink-muted); opacity: 1; }

/* Images never get dragged around the window by accident */
img { -webkit-user-drag: none; user-select: none; }

@keyframes loop-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes loop-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes loop-pop {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes loop-spin { to { transform: rotate(360deg); } }
@keyframes loop-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.85); }
}
@keyframes loop-shimmer {
  from { background-position: -400px 0; }
  to { background-position: 400px 0; }
}
@keyframes loop-twinkle { 0%, 100% { opacity: 0.85; } 50% { opacity: 0.45; } }
`;

let injected = false;

export function injectGlobalStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const style = document.createElement('style');
  style.id = 'loop-desktop-global';
  style.textContent = THEME_CSS + CSS + AUTH_CSS;
  document.head.appendChild(style);
}

/**
 * Keyframes as React Native Web wants them (`animationKeyframes`; it rejects a
 * plain `animationName`). Same names as the CSS @keyframes above, which stay
 * for anything styled outside React.
 */
export const KEYFRAMES = {
  'loop-fade-up': {
    '0%': { opacity: 0, transform: [{ translateY: 10 }] },
    '100%': { opacity: 1, transform: [{ translateY: 0 }] },
  },
  'loop-fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
  'loop-pop': {
    '0%': { opacity: 0, transform: [{ translateY: -6 }, { scale: 0.98 }] },
    '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
  },
  'loop-spin': { '0%': { transform: [{ rotate: '0deg' }] }, '100%': { transform: [{ rotate: '360deg' }] } },
  'loop-shimmer': { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
  'loop-twinkle': { '0%': { opacity: 0.85 }, '50%': { opacity: 0.45 }, '100%': { opacity: 0.85 } },
};

/** RNW style fragment that plays one of the keyframes above once. */
export const animate = (name, duration = '260ms', delay = '0ms') => ({
  animationKeyframes: KEYFRAMES[name],
  animationDuration: duration,
  animationDelay: delay,
  animationTimingFunction: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  // 'backwards', not 'both': a held final keyframe would pin `transform` and
  // swallow the hover lifts on cards that also play an entrance.
  animationFillMode: 'backwards',
});

/** RNW style fragment that loops one of the keyframes above. */
export const loop = (name, duration = '900ms') => ({
  animationKeyframes: KEYFRAMES[name],
  animationDuration: duration,
  animationIterationCount: 'infinite',
  animationTimingFunction: 'linear',
});
