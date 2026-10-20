/**
 * "There is more below" cue for the home dashboards. On a tall window the
 * first screen ends at the order options, so the actions, account and quick
 * access further down went unnoticed. While the page sits at the top with
 * content hidden below, a glowing glass pill floats over the bottom edge: a
 * mouse whose wheel rolls, a gold sonar ring and a cascade of chevrons. A
 * click glides the page down; it fades away as soon as the user scrolls and
 * comes back when they return to the top.
 *
 * Usage: `const { scrollProps, cue } = useScrollCue(scrollRef);` — spread
 * `scrollProps` on the ScrollView and render `cue` as its sibling.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { animate } from './globalStyles';
import { motion, onDark, palette, radii } from './desktopTheme';
import { useDir } from './ui';

const COPY = {
  fa: { title: 'بخش‌های بیشتر در پایین صفحه', hint: 'اسکرول کنید یا همین‌جا کلیک کنید' },
  en: { title: 'More sections below', hint: 'Scroll down or click here' },
};

// Shown only near the top and only while this much is still hidden below.
const TOP_ZONE = 40;
const MIN_HIDDEN = 56;

const ease = 'cubic-bezier(0.45, 0, 0.55, 1)';
const forever = (keyframes, duration, delay = '0ms') => ({
  animationKeyframes: keyframes,
  animationDuration: duration,
  animationDelay: delay,
  animationIterationCount: 'infinite',
  animationTimingFunction: ease,
  animationFillMode: 'both',
});

const WHEEL = {
  '0%': { opacity: 0, transform: [{ translateY: -2 }] },
  '25%': { opacity: 1 },
  '75%': { opacity: 0, transform: [{ translateY: 9 }] },
  '100%': { opacity: 0, transform: [{ translateY: 9 }] },
};
const SONAR = {
  '0%': { opacity: 0.55, transform: [{ scale: 1 }] },
  '80%': { opacity: 0, transform: [{ scaleX: 1.12 }, { scaleY: 1.6 }] },
  '100%': { opacity: 0, transform: [{ scaleX: 1.12 }, { scaleY: 1.6 }] },
};
const CHEVRON = {
  '0%': { opacity: 0.15, transform: [{ translateY: -3 }] },
  '50%': { opacity: 1, transform: [{ translateY: 2 }] },
  '100%': { opacity: 0.15, transform: [{ translateY: -3 }] },
};
const FLOAT = {
  '0%': { transform: [{ translateY: 0 }] },
  '50%': { transform: [{ translateY: -5 }] },
  '100%': { transform: [{ translateY: 0 }] },
};
const SWEEP = {
  '0%': { backgroundPosition: '-160% 0' },
  '60%': { backgroundPosition: '260% 0' },
  '100%': { backgroundPosition: '260% 0' },
};

export function useScrollCue(scrollRef) {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const metrics = useRef({ y: 0, view: 0, content: 0 });
  const [show, setShow] = useState(false);

  const update = useCallback(() => {
    const { y, view, content } = metrics.current;
    setShow(view > 0 && y < TOP_ZONE && content - view - y > MIN_HIDDEN);
  }, []);

  const scrollProps = useMemo(
    () => ({
      scrollEventThrottle: 32,
      onScroll: (e) => {
        metrics.current.y = e.nativeEvent.contentOffset.y;
        update();
      },
      onLayout: (e) => {
        metrics.current.view = e.nativeEvent.layout.height;
        update();
      },
      onContentSizeChange: (_, height) => {
        metrics.current.content = height;
        update();
      },
    }),
    [update]
  );

  const reveal = useCallback(() => {
    const { y, view } = metrics.current;
    scrollRef.current?.scrollTo({ y: y + view * 0.72, animated: true });
  }, [scrollRef]);

  const cue = (
    <View pointerEvents="box-none" style={[styles.layer, show ? styles.layerOn : styles.layerOff]}>
      <View pointerEvents="none" style={styles.glow} />
      <View pointerEvents="box-none" style={[styles.dock, animate('loop-fade-up', '520ms', '900ms')]}>
        <View pointerEvents="box-none" style={forever(FLOAT, '3.2s')}>
          <View pointerEvents="none" style={[styles.sonar, forever(SONAR, '2.4s')]} />
          <View pointerEvents="none" style={[styles.sonar, forever(SONAR, '2.4s', '1.2s')]} />
          <Pressable
            onPress={reveal}
            disabled={!show}
            // hidden, it must not swallow clicks on the cards underneath
            pointerEvents={show ? 'auto' : 'none'}
            accessibilityRole="button"
            accessibilityLabel={copy.title}
            style={({ hovered, pressed }) => [styles.pill, dir.row, hovered && styles.pillHover, pressed && styles.pillPressed]}
          >
            <View pointerEvents="none" style={[styles.sweep, forever(SWEEP, '4.8s', '1.4s')]} />
            <View style={styles.mouse}>
              <View style={[styles.wheel, forever(WHEEL, '1.6s')]} />
            </View>
            <View style={styles.texts}>
              <Text style={[styles.title, dir.bold, dir.align]}>{copy.title}</Text>
              <Text style={[styles.hint, dir.light, dir.align]}>{copy.hint}</Text>
            </View>
            <View style={styles.chevrons}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.chevron, forever(CHEVRON, '1.5s', `${i * 180}ms`)]}>
                  <Ionicons name="chevron-down" size={15} color={palette.gold} />
                </View>
              ))}
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return { scrollProps, cue };
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 22,
    zIndex: 5,
    transitionProperty: 'opacity, transform',
    transitionDuration: '420ms',
    transitionTimingFunction: motion.ease,
  },
  layerOn: { opacity: 1, transform: [{ translateY: 0 }] },
  layerOff: { opacity: 0, transform: [{ translateY: 24 }] },
  // the page seems to sink into a soft glow, so the edge reads as "continues"
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage:
      'radial-gradient(60% 100% at 50% 100%, rgba(4, 15, 31, 0.55) 0%, rgba(4, 15, 31, 0.18) 55%, rgba(4, 15, 31, 0) 100%)',
  },
  dock: { alignItems: 'center' },
  sonar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.55)',
  },
  pill: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(6, 23, 45, 0.78)',
    backdropFilter: 'blur(14px) saturate(140%)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    boxShadow: '0 14px 40px rgba(4, 15, 31, 0.45), 0 0 26px rgba(255, 215, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionDuration: motion.slow,
    transitionTimingFunction: motion.ease,
  },
  pillHover: {
    transform: [{ translateY: -2 }, { scale: 1.03 }],
    borderColor: 'rgba(255, 215, 0, 0.7)',
    boxShadow: '0 18px 46px rgba(4, 15, 31, 0.5), 0 0 34px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
  },
  pillPressed: { transform: [{ scale: 0.98 }] },
  sweep: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: 'linear-gradient(105deg, rgba(255, 215, 0, 0) 35%, rgba(255, 228, 92, 0.22) 50%, rgba(255, 215, 0, 0) 65%)',
    backgroundSize: '60% 100%',
    backgroundRepeat: 'no-repeat',
  },
  mouse: {
    width: 20,
    height: 30,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.gold,
    alignItems: 'center',
    paddingTop: 5,
    boxShadow: '0 0 12px rgba(255, 215, 0, 0.35)',
  },
  wheel: { width: 3, height: 7, borderRadius: 2, backgroundColor: palette.gold },
  texts: { gap: 1 },
  title: { color: onDark.text, fontSize: 13.5 },
  hint: { color: onDark.soft, fontSize: 11.5 },
  chevrons: { alignItems: 'center', marginVertical: -4 },
  chevron: { height: 9, alignItems: 'center', justifyContent: 'center' },
});
