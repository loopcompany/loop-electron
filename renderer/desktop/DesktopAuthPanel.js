import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandStory } from './EntryLayout';
import { motion, onDark } from './desktopTheme';
import { Cheetah, cheetahFacing } from './ui';
import { SITE_LABEL, SITE_URL, openLink } from './links';
import { getFontFamily } from '@theme/Typography';

const BAR_COPY = {
  fa: { back: 'بازگشت', language: 'English' },
  en: { back: 'Back', language: 'فارسی' },
};

/**
 * The top bar inside the sign-in card: «بازگشت» with the running cheetah on
 * the reading-start side, the Loop mark and the language switch on the
 * other. Part of the card (not floating over it), and always there — with no
 * history to go back to, the shell sends it to the start menu.
 *
 * @param {object} props
 * @param {string} props.lang
 * @param {() => void} props.onBack
 * @param {() => void} props.onToggleLanguage
 */
export function AuthCardBar({ lang, onBack, onToggleLanguage }) {
  const rtl = lang === 'fa';
  const copy = BAR_COPY[rtl ? 'fa' : 'en'];
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const bold = { fontFamily: getFontFamily('bold', lang) };
  return (
    <View style={[styles.bar, row]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={copy.back}
        style={({ hovered, pressed }) => [styles.back, row, hovered && styles.backHover, pressed && styles.pressed]}
      >
        <Cheetah facing={cheetahFacing(rtl, 'back')} height={32} />
        <Text style={[styles.backText, bold]}>{copy.back}</Text>
      </Pressable>
      <View style={[styles.end, row]}>
        <Pressable
          onPress={onToggleLanguage}
          accessibilityRole="button"
          style={({ hovered, pressed }) => [styles.lang, row, hovered && styles.backHover, pressed && styles.pressed]}
        >
          <Ionicons name="language-outline" size={15} color={onDark.soft} />
          <Text style={[styles.langText, bold]}>{copy.language}</Text>
        </Pressable>
        <Image source={require('@assets/images/start.png')} style={styles.mark} />
      </View>
    </View>
  );
}

/**
 * The side of the sign-in window that isn't the form: the same brand story
 * as the entry screens, over the window-wide artwork the shell draws behind
 * both (@desktop/EntryLayout CosmicBackdrop). Purely decorative — the form
 * beside it is the unchanged mobile screen.
 *
 * @param {object} props
 * @param {string} props.lang
 * @param {boolean} [props.compact]  beside the wide sign-up form
 */
export default function DesktopAuthPanel({ lang, compact }) {
  const version = typeof window !== 'undefined' ? window.loopDesktop?.appVersion : null;
  return (
    <View style={[styles.panel, compact && styles.panelCompact]}>
      <BrandStory style={styles.story} compact={compact} />
      <Text style={[styles.footer, { fontFamily: getFontFamily('light', lang) }]}>
        <Text accessibilityRole="link" onPress={() => openLink(SITE_URL)} style={styles.siteLink}>
          {SITE_LABEL}
        </Text>
        {version ? `  ·  v${version}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: 56,
    paddingVertical: 48,
  },
  panelCompact: { paddingHorizontal: 40 },

  bar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 6,
  },
  back: {
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, transform',
    transitionDuration: motion.fast,
  },
  backHover: { backgroundColor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 215, 0, 0.45)' },
  pressed: { transform: 'scale(0.97)' },
  backText: { color: onDark.text, fontSize: 13.5 },
  end: { alignItems: 'center', gap: 10 },
  lang: {
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: motion.fast,
  },
  langText: { color: onDark.soft, fontSize: 12.5 },
  mark: { width: 36, height: 36, borderRadius: 11, boxShadow: '0 0 18px rgba(255, 215, 0, 0.25)' },
  story: { alignSelf: 'center', width: '100%' },
  siteLink: { cursor: 'pointer', textDecorationLine: 'underline', textDecorationColor: 'rgba(255, 255, 255, 0.25)' },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: onDark.muted,
    fontSize: 12,
  },
});
