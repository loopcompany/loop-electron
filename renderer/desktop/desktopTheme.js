/**
 * The desktop design language ("Loop Nebula").
 *
 * The brand is a deep navy (#002b54) with a gold mark (#ffd700) set against a
 * night sky; the mobile app shows it as full-screen moon artwork. On a
 * monitor that artwork becomes the *frame* — a deep-space sidebar and a
 * starry band across the top of every page — while the pages themselves sit
 * on calm, light surfaces so long forms and lists stay readable.
 *
 * Screens shared with the phone keep the mobile palette from @theme/Color;
 * everything drawn only by the desktop bundle (shell, desktop screens,
 * restyled shared components) takes its colours from here.
 */
import { colors } from '@theme/Color';

/** Raw palette. Prefer the semantic groups below in components. */
export const palette = {
  navy950: '#040f1f',
  navy900: '#06172d',
  navy850: '#0a1f3b',
  navy800: '#0c2747',
  navy700: '#0f3360',
  navy600: '#134379',
  brand: colors.primary.color, // #002b54
  /** links and accents; lighter in the dark theme */
  brandBright: 'var(--loop-link)',
  sky: '#4f8fe0',
  gold: colors.accent.color, // #ffd700
  goldDeep: '#e9b308',
  goldSoft: '#fff4bf',
  canvas: '#eef2f8',
  canvasDeep: '#e3e9f3',
  white: '#ffffff',
  ink: '#0b1b33',
  inkSoft: '#46566f',
  inkMuted: '#8592a8',
  success: '#1f9d55',
  danger: '#d64545',
  warning: '#e08a00',
  info: '#2f7bd8',
  violet: '#6c4bd8',
};

/** Shell chrome: sidebar, title bar, the starry band. */
export const chrome = {
  titleBar: palette.navy950,
  sidebar: palette.navy900,
  sidebarBorder: 'rgba(255, 255, 255, 0.06)',
  sectionLabel: 'rgba(255, 255, 255, 0.38)',
  itemText: 'rgba(226, 234, 247, 0.72)',
  itemTextActive: palette.white,
  itemHover: 'rgba(255, 255, 255, 0.05)',
  itemActive: 'rgba(255, 255, 255, 0.07)',
  accent: palette.gold,
  card: 'rgba(255, 255, 255, 0.045)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
};

/**
 * Page surfaces and text follow the light / dark theme (@desktop/theme):
 * they are CSS variables, defined for both themes in THEME_VARS and emitted
 * by ./globalStyles. A `[data-loop-paper]` element (the card the phone-style
 * screens sit in) always gets the light values, because those screens paint
 * light colours of their own.
 */
const v = (name) => `var(--loop-${name})`;

export const THEME_VARS = {
  light: {
    canvas: '#eef2f8',
    card: '#ffffff',
    'card-muted': '#f6f8fc',
    sunken: '#f1f4f9',
    border: 'rgba(14, 42, 84, 0.08)',
    'border-strong': 'rgba(14, 42, 84, 0.16)',
    hover: 'rgba(0, 43, 84, 0.05)',
    pressed: 'rgba(0, 43, 84, 0.09)',
    ink: '#0b1b33',
    'ink-soft': '#46566f',
    'ink-muted': '#8592a8',
    'brand-text': '#002b54',
    'brand-tint': 'rgba(0, 43, 84, 0.07)',
    link: '#1d5fae',
    scrollbar: 'rgba(14, 42, 84, 0.18)',
    'scrollbar-hover': 'rgba(14, 42, 84, 0.36)',
  },
  dark: {
    canvas: '#08111f',
    card: '#0f1b2e',
    'card-muted': '#0c1727',
    sunken: '#0a1422',
    border: 'rgba(255, 255, 255, 0.07)',
    'border-strong': 'rgba(255, 255, 255, 0.15)',
    hover: 'rgba(255, 255, 255, 0.045)',
    pressed: 'rgba(255, 255, 255, 0.08)',
    ink: '#e7edf7',
    'ink-soft': '#a8b5cb',
    'ink-muted': '#7a89a2',
    'brand-text': '#9cc4ff',
    'brand-tint': 'rgba(156, 196, 255, 0.1)',
    link: '#6fa6f0',
    scrollbar: 'rgba(255, 255, 255, 0.14)',
    'scrollbar-hover': 'rgba(255, 255, 255, 0.28)',
  },
};

export const surface = {
  canvas: v('canvas'),
  card: v('card'),
  cardMuted: v('card-muted'),
  sunken: v('sunken'),
  border: v('border'),
  borderStrong: v('border-strong'),
  hover: v('hover'),
  pressed: v('pressed'),
  title: v('ink'),
  text: v('ink'),
  muted: v('ink-soft'),
  faint: v('ink-muted'),
  /** Brand navy as a text / icon colour (lightened in the dark theme). */
  brandText: v('brand-text'),
  brandTint: v('brand-tint'),
  // kept for the screens that read the old toolbar tokens
  toolbar: v('card'),
  toolbarBorder: v('border'),
};

/** The light values as plain colours, for code that must stay light in both themes. */
export const light = {
  canvas: THEME_VARS.light.canvas,
  card: THEME_VARS.light.card,
  cardMuted: THEME_VARS.light['card-muted'],
  border: THEME_VARS.light.border,
  borderStrong: THEME_VARS.light['border-strong'],
  ink: THEME_VARS.light.ink,
};

/** Text and icon colours on the dark chrome. */
export const onDark = {
  text: palette.white,
  soft: 'rgba(226, 234, 247, 0.78)',
  muted: 'rgba(226, 234, 247, 0.52)',
  hairline: 'rgba(255, 255, 255, 0.1)',
  glass: 'rgba(255, 255, 255, 0.07)',
  glassStrong: 'rgba(255, 255, 255, 0.12)',
};

/** Status colours: [foreground, tinted background]. */
export const tone = {
  neutral: { fg: palette.inkSoft, bg: 'rgba(70, 86, 111, 0.1)' },
  info: { fg: palette.info, bg: 'rgba(47, 123, 216, 0.1)' },
  success: { fg: palette.success, bg: 'rgba(31, 157, 85, 0.11)' },
  warning: { fg: '#b86e00', bg: 'rgba(224, 138, 0, 0.13)' },
  danger: { fg: palette.danger, bg: 'rgba(214, 69, 69, 0.1)' },
  brand: { fg: 'var(--loop-brand-text)', bg: 'var(--loop-brand-tint)' },
  gold: { fg: '#8a6a00', bg: 'rgba(255, 215, 0, 0.2)' },
  violet: { fg: palette.violet, bg: 'rgba(108, 75, 216, 0.1)' },
};

/** CSS box-shadows (react-native-web passes them through). */
export const elevation = {
  card: '0 1px 2px rgba(10, 30, 60, 0.05), 0 6px 20px rgba(10, 30, 60, 0.05)',
  raised: '0 2px 4px rgba(10, 30, 60, 0.06), 0 14px 34px rgba(10, 30, 60, 0.1)',
  floating: '0 18px 50px rgba(4, 15, 31, 0.28), 0 4px 12px rgba(4, 15, 31, 0.12)',
  gold: '0 8px 24px rgba(233, 179, 8, 0.35)',
  brand: '0 8px 22px rgba(0, 43, 84, 0.28)',
  focus: '0 0 0 3px rgba(79, 143, 224, 0.35)',
};

/** CSS background images. */
export const gradients = {
  brand: `linear-gradient(135deg, ${palette.navy600} 0%, ${palette.brand} 55%, ${palette.navy850} 100%)`,
  gold: `linear-gradient(135deg, #ffe45c 0%, ${palette.gold} 45%, ${palette.goldDeep} 100%)`,
  sidebar: `radial-gradient(120% 60% at 50% -10%, rgba(29, 95, 174, 0.35) 0%, rgba(29, 95, 174, 0) 60%), linear-gradient(180deg, ${palette.navy850} 0%, ${palette.navy900} 45%, ${palette.navy950} 100%)`,
  /** The band across the top of every page. */
  band: [
    'radial-gradient(1.2px 1.2px at 12% 30%, rgba(255,255,255,0.75) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 28% 68%, rgba(255,255,255,0.55) 50%, transparent 51%)',
    'radial-gradient(1.4px 1.4px at 46% 22%, rgba(255,255,255,0.7) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 63% 54%, rgba(255,255,255,0.5) 50%, transparent 51%)',
    'radial-gradient(1.3px 1.3px at 78% 18%, rgba(255,255,255,0.75) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 89% 62%, rgba(255,255,255,0.5) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 6% 80%, rgba(255,255,255,0.4) 50%, transparent 51%)',
    'radial-gradient(1.1px 1.1px at 55% 85%, rgba(255,255,255,0.45) 50%, transparent 51%)',
    'radial-gradient(60% 140% at 85% 0%, rgba(79, 143, 224, 0.42) 0%, rgba(79, 143, 224, 0) 60%)',
    'radial-gradient(45% 120% at 10% 10%, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0) 60%)',
    `linear-gradient(180deg, ${palette.navy800} 0%, ${palette.navy700} 100%)`,
  ].join(', '),
  /** Hero cards on the dashboard. */
  hero: [
    'radial-gradient(70% 120% at 100% 0%, rgba(79, 143, 224, 0.55) 0%, rgba(79, 143, 224, 0) 60%)',
    'radial-gradient(50% 90% at 0% 100%, rgba(255, 215, 0, 0.16) 0%, rgba(255, 215, 0, 0) 65%)',
    `linear-gradient(135deg, ${palette.navy700} 0%, ${palette.navy850} 60%, ${palette.navy950} 100%)`,
  ].join(', '),
  stars: [
    'radial-gradient(1.2px 1.2px at 20% 30%, rgba(255,255,255,0.6) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.5) 50%, transparent 51%)',
    'radial-gradient(1.3px 1.3px at 40% 75%, rgba(255,255,255,0.55) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 85% 65%, rgba(255,255,255,0.45) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 10% 85%, rgba(255,255,255,0.4) 50%, transparent 51%)',
  ].join(', '),
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

/** Height of the starry band behind the top bar (see ./Breakpoints). */
export { bandHeight } from './Breakpoints';

export const motion = {
  fast: '120ms',
  base: '180ms',
  slow: '280ms',
  ease: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
};

/** Brand panel beside the sign-in forms. */
export const authPanel = {
  overlay: 'rgba(6, 23, 45, 0.45)',
  overlayStrong: 'rgba(4, 15, 31, 0.94)',
};

export default chrome;
