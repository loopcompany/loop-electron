/**
 * Small building blocks for everything the desktop bundle draws itself:
 * buttons, cards, status pills, section headings, empty and loading states.
 * They follow the language direction (Persian is RTL, English LTR) and take
 * their colours from ./desktopTheme.
 */
import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { getFontFamily } from '@theme/Typography';
import { animate, loop } from './globalStyles';
import { elevation, gradients, motion, palette, radii, surface, tone } from './desktopTheme';

/** Direction-aware style fragments for the current language. */
export function useDir() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  return useMemo(() => {
    const rtl = lang === 'fa';
    return {
      t,
      lang,
      rtl,
      row: { flexDirection: rtl ? 'row-reverse' : 'row' },
      align: { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' },
      start: { alignItems: rtl ? 'flex-end' : 'flex-start' },
      bold: { fontFamily: getFontFamily('bold', lang) },
      light: { fontFamily: getFontFamily('light', lang) },
      /** Chevron pointing "forward" in reading order. */
      forward: rtl ? 'chevron-back' : 'chevron-forward',
      back: rtl ? 'arrow-forward' : 'arrow-back',
    };
  }, [lang, t]);
}

/** Persian digits and thousands separators, as the rest of the app shows money. */
export function formatNumber(value, lang) {
  const n = Number(value);
  if (!Number.isFinite(n)) return lang === 'fa' ? '۰' : '0';
  return n.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');
}

export function Card({ children, style, padded = true, hoverable, onPress, accessibilityLabel }) {
  const base = [styles.card, padded && styles.cardPadded];
  if (!onPress) return <View style={[...base, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ hovered, pressed }) => [
        ...base,
        styles.cardInteractive,
        (hovered || hoverable === 'always') && styles.cardHover,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const BUTTON_VARIANTS = {
  primary: { bg: gradients.brand, fg: palette.white, shadow: elevation.brand },
  gold: { bg: gradients.gold, fg: palette.navy900, shadow: elevation.gold },
  soft: { bgColor: surface.brandTint, fg: surface.brandText },
  ghost: { bgColor: 'transparent', fg: palette.inkSoft },
  outline: { bgColor: surface.card, fg: surface.brandText, border: surface.borderStrong },
  danger: { bgColor: 'rgba(214, 69, 69, 0.1)', fg: palette.danger },
  glass: { bgColor: 'rgba(255, 255, 255, 0.1)', fg: palette.white, border: 'rgba(255,255,255,0.16)' },
};

export function DButton({
  title,
  icon,
  iconAfter,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
  block,
}) {
  const dir = useDir();
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  const height = size === 'sm' ? 34 : size === 'lg' ? 50 : 42;
  const fontSize = size === 'sm' ? 12.5 : size === 'lg' ? 15 : 13.5;
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ hovered, pressed }) => [
        styles.button,
        dir.row,
        {
          height,
          paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 22 : 16,
          backgroundImage: v.bg,
          backgroundColor: v.bgColor,
          borderColor: v.border || 'transparent',
          boxShadow: hovered && !inactive ? v.shadow : undefined,
        },
        block && styles.block,
        hovered && !inactive && styles.buttonHover,
        hovered && !inactive && !v.bg && { backgroundColor: hoverTint(variant) },
        pressed && !inactive && styles.buttonPressed,
        inactive && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {!!icon && (typeof icon === 'string' ? <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={v.fg} /> : icon)}
          {!!title && (
            <Text style={[styles.buttonText, dir.bold, { color: v.fg, fontSize }, textStyle]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {!!iconAfter && (typeof iconAfter === 'string' ? <Ionicons name={iconAfter} size={size === 'sm' ? 14 : 16} color={v.fg} /> : iconAfter)}
        </>
      )}
    </Pressable>
  );
}

// The running gold cheetah of the mobile Next / Back buttons (assets/gif/next,
// prev), with the white background turned into transparency so it sits on any
// button colour. Same 93×52 frame as the GIFs.
const CHEETAH = {
  left: require('./assets/cheetah-left.webp'),
  right: require('./assets/cheetah-right.webp'),
};
const CHEETAH_RATIO = 93 / 52;

/**
 * The cheetah running toward `facing`. For a Next / Back button pass the way
 * the button points: `cheetahFacing(dir.rtl, 'next')`.
 */
export function Cheetah({ facing = 'right', height = 30, style }) {
  return (
    <Image
      source={CHEETAH[facing === 'left' ? 'left' : 'right']}
      style={[{ width: Math.round(height * CHEETAH_RATIO), height }, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Which way the cheetah runs on a Next / Back button in the current direction. */
export const cheetahFacing = (rtl, kind) => ((kind === 'next') !== rtl ? 'right' : 'left');

const hoverTint = (variant) =>
  ({
    soft: surface.pressed,
    ghost: surface.hover,
    outline: surface.cardMuted,
    danger: 'rgba(214, 69, 69, 0.16)',
    glass: 'rgba(255, 255, 255, 0.16)',
  })[variant];

export function IconButton({ icon, onPress, label, color = palette.inkSoft, size = 36, dark, badge, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ hovered, pressed }) => [
        styles.iconButton,
        { width: size, height: size },
        hovered && { backgroundColor: dark ? 'rgba(255,255,255,0.1)' : surface.hover },
        pressed && { backgroundColor: dark ? 'rgba(255,255,255,0.16)' : surface.pressed },
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={color} />
      {!!badge && <View style={styles.badgeDot} />}
    </Pressable>
  );
}

export function Pill({ label, kind = 'neutral', icon, dot, style, size = 'md' }) {
  const dir = useDir();
  const c = tone[kind] || tone.neutral;
  return (
    <View style={[styles.pill, dir.row, size === 'sm' && styles.pillSm, { backgroundColor: c.bg }, style]}>
      {dot && <View style={[styles.pillDot, { backgroundColor: c.fg }]} />}
      {!!icon && <Ionicons name={icon} size={size === 'sm' ? 11 : 13} color={c.fg} />}
      <Text style={[styles.pillText, dir.bold, size === 'sm' && styles.pillTextSm, { color: c.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Rounded square holding an icon, tinted by tone. */
export function IconTile({ icon, kind = 'brand', size = 40, style, iconColor }) {
  const c = tone[kind] || tone.brand;
  return (
    <View
      style={[
        styles.iconTile,
        { width: size, height: size, borderRadius: Math.round(size * 0.32), backgroundColor: c.bg },
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={iconColor || c.fg} />
    </View>
  );
}

export function SectionHeader({ title, subtitle, icon, action, style }) {
  const dir = useDir();
  return (
    <View style={[styles.sectionHeader, dir.row, style]}>
      <View style={[styles.sectionTitleRow, dir.row]}>
        {!!icon && <IconTile icon={icon} size={32} />}
        <View style={styles.flexShrink}>
          <Text style={[styles.sectionTitle, dir.bold, dir.align]}>{title}</Text>
          {!!subtitle && <Text style={[styles.sectionSubtitle, dir.light, dir.align]}>{subtitle}</Text>}
        </View>
      </View>
      {action}
    </View>
  );
}

/**
 * "Nothing here yet": a small orbit illustration (the brand's night-sky
 * motif) around the page's icon, a title saying what is missing, a line on
 * what fills it, and optionally the action that does.
 */
export function EmptyState({ icon = 'file-tray-outline', title, message, action, compact, style }) {
  const dir = useDir();
  const size = compact ? 112 : 168;
  return (
    <View style={[styles.empty, compact && styles.emptyCompact, animate('loop-fade-up', '360ms'), style]}>
      <View style={[styles.emptyArt, { width: size, height: size }]}>
        <View style={[styles.emptyOrbit, { borderRadius: size / 2 }, loop('loop-spin', '24s')]}>
          <View style={[styles.emptyMoon, styles.emptyMoonGold]} />
          <View style={[styles.emptyMoon, styles.emptyMoonBlue]} />
        </View>
        <View style={[styles.emptyHalo, { width: size * 0.72, height: size * 0.72, borderRadius: size * 0.36 }]} />
        <View style={[styles.emptyIcon, compact && styles.emptyIconCompact]}>
          <Ionicons name={icon} size={compact ? 24 : 32} color={palette.white} />
          <View style={styles.emptySpark}>
            <Ionicons name="sparkles" size={compact ? 10 : 13} color={palette.gold} />
          </View>
        </View>
      </View>
      {!!title && <Text style={[styles.emptyTitle, compact && styles.emptyTitleCompact, dir.bold]}>{title}</Text>}
      {!!message && <Text style={[styles.emptyMessage, dir.light]}>{message}</Text>}
      {!!action && <View style={[styles.emptyActions, dir.row]}>{action}</View>}
    </View>
  );
}

/** The app-wide loading indicator: a gold ring around the Loop mark. */
export function Spinner({ size = 44, label, style }) {
  const dir = useDir();
  return (
    <View style={[styles.spinnerWrap, style]}>
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.spinnerRing,
            { width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(3, size / 12) },
            loop('loop-spin', '900ms'),
          ]}
        />
      </View>
      {!!label && <Text style={[styles.spinnerLabel, dir.light]}>{label}</Text>}
    </View>
  );
}

export function Skeleton({ width = '100%', height = 14, radius = 8, style }) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: surface.sunken,
          backgroundImage: 'linear-gradient(90deg, rgba(127, 150, 190, 0.10) 0px, rgba(127, 150, 190, 0.22) 120px, rgba(127, 150, 190, 0.10) 240px)',
          backgroundSize: '800px 100%',
          ...loop('loop-shimmer', '1.4s'),
        },
        style,
      ]}
    />
  );
}

/** Centred column that keeps desktop pages at a readable width. */
export function PageContainer({ children, maxWidth = 1240, style }) {
  return <View style={[styles.container, { maxWidth }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: surface.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.card,
  },
  cardPadded: { padding: 20 },
  cardInteractive: {
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionDuration: motion.base,
    transitionTimingFunction: motion.ease,
  },
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: elevation.raised,
    borderColor: 'rgba(29, 95, 174, 0.22)',
  },
  cardPressed: { transform: 'translateY(0px) scale(0.995)' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.sm + 2,
    borderWidth: 1,
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow, background-color, opacity, filter',
    transitionDuration: motion.fast,
    userSelect: 'none',
  },
  block: { alignSelf: 'stretch' },
  buttonHover: { transform: 'translateY(-1px)', filter: 'brightness(1.04)' },
  buttonPressed: { transform: 'translateY(0px) scale(0.98)' },
  buttonDisabled: { opacity: 0.5, cursor: 'default' },
  buttonText: { letterSpacing: 0.1 },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.gold,
    borderWidth: 1.5,
    borderColor: palette.navy800,
  },
  pill: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  pillSm: { height: 22, paddingHorizontal: 8, gap: 4 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12 },
  pillTextSm: { fontSize: 11 },
  iconTile: { alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  sectionTitleRow: { alignItems: 'center', gap: 10, flexShrink: 1 },
  flexShrink: { flexShrink: 1 },
  sectionTitle: { fontSize: 16, color: surface.title },
  sectionSubtitle: { fontSize: 12.5, color: surface.faint, marginTop: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 8 },
  emptyCompact: { paddingVertical: 28 },
  emptyArt: { alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyOrbit: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(29, 95, 174, 0.22)',
  },
  emptyMoon: { position: 'absolute', borderRadius: 999 },
  emptyMoonGold: {
    width: 14,
    height: 14,
    top: '12%',
    right: '10%',
    backgroundImage: gradients.gold,
    boxShadow: '0 0 12px rgba(255, 215, 0, 0.7)',
  },
  emptyMoonBlue: {
    width: 9,
    height: 9,
    bottom: '14%',
    left: '9%',
    backgroundColor: palette.sky,
    boxShadow: '0 0 10px rgba(79, 143, 224, 0.7)',
  },
  emptyHalo: {
    position: 'absolute',
    backgroundImage: 'radial-gradient(circle, rgba(79, 143, 224, 0.16) 0%, rgba(79, 143, 224, 0.04) 60%, rgba(79, 143, 224, 0) 72%)',
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: gradients.brand,
    boxShadow: '0 12px 28px rgba(0, 43, 84, 0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
  },
  emptyIconCompact: { width: 54, height: 54, borderRadius: 27 },
  emptySpark: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.navy900,
    borderWidth: 2,
    borderColor: surface.card,
  },
  emptyTitle: { fontSize: 18, color: surface.title, textAlign: 'center' },
  emptyTitleCompact: { fontSize: 15 },
  emptyMessage: { fontSize: 13.5, color: surface.muted, textAlign: 'center', maxWidth: 420, lineHeight: 24 },
  emptyActions: { gap: 10, marginTop: 10 },
  spinnerWrap: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  spinnerRing: {
    borderColor: 'rgba(0, 43, 84, 0.1)',
    borderTopColor: palette.gold,
    borderRightColor: palette.brandBright,
  },
  spinnerLabel: { fontSize: 13, color: surface.faint },
  container: { width: '100%', alignSelf: 'center' },
});
