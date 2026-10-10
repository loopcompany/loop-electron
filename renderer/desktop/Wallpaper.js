/**
 * The Loop master wallpaper (the blue planet with the gold orbit) — the
 * background of the whole desktop app: the welcome and entry screens, the
 * sign-in backdrop, the home banner and, under a theme-coloured veil, the
 * canvas every page sits on.
 *
 * One WebP (≈110 KB, from "LOOP Master Wallpaper.png"), decoded once and kept
 * in expo-image's memory cache, so every screen that shows it reuses the same
 * bitmap.
 */
import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { KEYFRAMES } from './globalStyles';

export const WALLPAPER = require('./assets/wallpaper.webp');

/**
 * The wallpaper filling its parent (absolutely positioned; render it first).
 * `veil` lays a navy tint over it (--loop-wallpaper-veil, see desktopTheme
 * THEME_VARS) so the light cards of the pages stand out against it; text
 * straight on it uses `surface.canvasText`.
 * `drift` lets the image breathe very slowly (a transform-only animation the
 * compositor runs by itself, so it costs no layout or repaint).
 */
export default function AppWallpaper({ veil, drift, position = 'center' }) {
  return (
    <View pointerEvents="none" style={[styles.fill, styles.clip]}>
      <ExpoImage
        source={WALLPAPER}
        style={[styles.fill, drift && styles.drift]}
        contentFit="cover"
        contentPosition={position}
        cachePolicy="memory-disk"
        transition={0}
      />
      {veil && <View style={[styles.fill, styles.veil]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  clip: { overflow: 'hidden' },
  drift: {
    animationKeyframes: KEYFRAMES['loop-drift'],
    animationDuration: '48s',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationTimingFunction: 'ease-in-out',
    willChange: 'transform',
  },
  veil: { backgroundImage: 'var(--loop-wallpaper-veil)' },
});
