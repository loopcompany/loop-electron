import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { setLanguage } from '@slices/languageSlice';

import { elevation, gradients, motion, onDark, palette, radii } from './desktopTheme';
import { animate } from './globalStyles';
import { useDir } from './ui';
import AppWallpaper from './Wallpaper';
import { brandCopy, greetingIcon, useTimeGreeting } from './brandCopy';

const COPY = {
  fa: {
    headline: 'خدمات و راهکارهای فناوری،\nدر یک فضای یکپارچه',
    lead: 'سفارش تعمیر، نصب و تأمین تجهیزات برای خانه، شرکت و سازمان — با پیگیری لحظه‌ای و پرداخت امن.',
    features: [
      { icon: 'flash-outline', title: 'سفارش سیستماتیک', text: 'دستگاه را انتخاب کنید، بقیه‌اش قدم‌به‌قدم' },
      { icon: 'pulse-outline', title: 'پیگیری لحظه‌ای', text: 'وضعیت سفارش و تکنسین همیشه جلوی چشمتان' },
      { icon: 'shield-checkmark-outline', title: 'پرداخت امن', text: 'کیف پول لوپ و درگاه بانکی' },
    ],
    language: 'English',
  },
  en: {
    headline: 'Tech services & solutions,\nin one unified space',
    lead: 'Order repairs, installations and equipment for home, business and organisations — with live tracking and secure payment.',
    features: [
      { icon: 'flash-outline', title: 'Systematic ordering', text: 'Pick a device, we guide you step by step' },
      { icon: 'pulse-outline', title: 'Live tracking', text: 'Your order and technician, always in view' },
      { icon: 'shield-checkmark-outline', title: 'Secure payment', text: 'Loop Wallet and bank gateway' },
    ],
    language: 'فارسی',
  },
};

/**
 * The full-window entry screens (the start menu, sign-in choice): the brand
 * story on one side of the moon artwork and a glass card with the screen's
 * actions on the other.
 *
 * @param {object} props
 * @param {string} props.title        card title
 * @param {string} [props.subtitle]
 * @param {import('react').ReactNode} props.children   the actions
 * @param {import('react').ReactNode} [props.footer]   under the actions
 */
export default function EntryLayout({ title, subtitle, children, footer }) {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const version = typeof window !== 'undefined' ? window.loopDesktop?.appVersion : null;

  // same three steps as MenuProvider's language switch
  const toggleLanguage = async () => {
    const lng = i18n.language === 'en' ? 'fa' : 'en';
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem('language', lng);
    dispatch(setLanguage(lng));
  };

  return (
    <View style={styles.root}>
      <CosmicBackdrop />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.layout, dir.row]}>
          <BrandStory />

          {/* Actions */}
          <View style={[styles.card, animate('loop-pop', '420ms', '120ms')]}>
            <Text style={[styles.cardTitle, dir.bold, dir.align]}>{title}</Text>
            {!!subtitle && <Text style={[styles.cardSubtitle, dir.light, dir.align]}>{subtitle}</Text>}
            <View style={styles.actions}>{children}</View>
            {footer}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, dir.row]}>
        <Text style={[styles.bottomText, dir.light]}>
          www.clpiran.com{version ? `  ·  v${version}` : ''}
        </Text>
        <Pressable
          onPress={toggleLanguage}
          accessibilityRole="button"
          style={({ hovered }) => [styles.lang, dir.row, hovered && styles.langHover]}
        >
          <Ionicons name="language-outline" size={15} color={onDark.soft} />
          <Text style={[styles.langText, dir.bold]}>{copy.language}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The Loop wallpaper across the whole window, darkened on the reading side. */
export function CosmicBackdrop() {
  const dir = useDir();
  return (
    <>
      <AppWallpaper drift />
      <View style={[styles.shade, { backgroundImage: dir.rtl ? SHADE_RTL : SHADE_LTR }]} pointerEvents="none" />
    </>
  );
}

/**
 * Logo, headline and the three things Loop does well. `compact` (beside a
 * wide sign-up form) keeps the logo and a smaller headline only.
 */
export function BrandStory({ style, compact }) {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const greeting = useTimeGreeting(dir.lang);
  return (
    <View style={[styles.story, dir.start, animate('loop-fade-up', '500ms'), style]}>
      <Image source={require('@assets/logo.png')} style={styles.logo} resizeMode="contain" />
      {/* صبح بخیر · به جوهر آینده (لوپ) خوش آمدید */}
      <View style={[styles.greet, dir.row, animate('loop-fade-up', '500ms', '120ms')]}>
        <Ionicons name={greetingIcon()} size={16} color={palette.gold} />
        <Text style={[styles.greetText, dir.bold, dir.align]}>
          {greeting}
          <Text style={[styles.greetWelcome, dir.light]}>{`  ·  ${brandCopy(dir.lang).welcome}`}</Text>
        </Text>
      </View>
      <Text style={[styles.headline, compact && styles.headlineCompact, dir.bold, dir.align]}>{copy.headline}</Text>
      <Text style={[styles.lead, compact && styles.leadCompact, dir.light, dir.align]}>{copy.lead}</Text>
      {!compact && <View style={styles.features}>
        {copy.features.map((feature, i) => (
          <View key={feature.icon} style={[styles.feature, dir.row, animate('loop-fade-up', '420ms', `${200 + i * 90}ms`)]}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon} size={20} color={palette.gold} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.featureTitle, dir.bold, dir.align]}>{feature.title}</Text>
              <Text style={[styles.featureText, dir.light, dir.align]}>{feature.text}</Text>
            </View>
          </View>
        ))}
      </View>}
    </View>
  );
}

/**
 * The quieter row under the main actions: everything that should stay
 * reachable without competing with them.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {import('react').ReactNode} props.children   EntryLink items
 */
export function EntryMore({ title, children }) {
  const dir = useDir();
  return (
    <View style={[styles.more, animate('loop-fade-up', '380ms', '520ms')]}>
      <Text style={[styles.moreTitle, dir.light, dir.align]}>{title}</Text>
      <View style={[styles.moreRow, dir.row]}>{children}</View>
    </View>
  );
}

/** One small secondary action (icon + label chip) for EntryMore. */
export function EntryLink({ icon, title, onPress, badge, disabled }) {
  const dir = useDir();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ hovered, pressed }) => [
        styles.link,
        dir.row,
        hovered && !disabled && styles.linkHover,
        pressed && !disabled && styles.actionPressed,
        disabled && styles.actionDisabled,
      ]}
    >
      <Ionicons name={icon} size={16} color={palette.gold} />
      <Text style={[styles.linkText, dir.bold]} numberOfLines={1}>{title}</Text>
      {!!badge && <Text style={[styles.badgeText, dir.light]}>{badge}</Text>}
    </Pressable>
  );
}

/**
 * One big action in the entry card.
 *
 * @param {object} props
 * @param {string} props.icon
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {() => void} props.onPress
 * @param {'gold'|'brand'|'glass'} [props.tone]
 * @param {string} [props.badge]
 * @param {boolean} [props.disabled]
 * @param {number} [props.index]  for the entrance stagger
 */
export function EntryAction({ icon, title, subtitle, onPress, tone = 'glass', badge, disabled, index = 0 }) {
  const dir = useDir();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ hovered, pressed }) => [
        styles.action,
        dir.row,
        tone === 'gold' && styles.actionGold,
        tone === 'brand' && styles.actionBrand,
        animate('loop-fade-up', '380ms', `${260 + index * 70}ms`),
        hovered && !disabled && styles.actionHover,
        hovered && !disabled && tone === 'glass' && styles.actionGlassHover,
        pressed && !disabled && styles.actionPressed,
        disabled && styles.actionDisabled,
      ]}
    >
      {({ hovered }) => (
        <>
          <View style={[styles.actionIcon, tone === 'gold' && styles.actionIconGold]}>
            <Ionicons name={icon} size={22} color={tone === 'gold' ? palette.navy900 : palette.gold} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.actionTitle, dir.bold, dir.align, tone === 'gold' && styles.onGold]}>{title}</Text>
            {!!subtitle && (
              <Text style={[styles.actionSubtitle, dir.light, dir.align, tone === 'gold' && styles.onGoldSoft]}>{subtitle}</Text>
            )}
          </View>
          {!!badge && (
            <View style={styles.badge}>
              <Text style={[styles.badgeText, dir.bold]}>{badge}</Text>
            </View>
          )}
          {!disabled && (
            <Ionicons
              name={dir.forward}
              size={18}
              color={tone === 'gold' ? palette.navy900 : onDark.soft}
              style={[styles.chevron, hovered && (dir.rtl ? styles.chevronNudgeRtl : styles.chevronNudgeLtr)]}
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const SHADE_RTL = 'linear-gradient(270deg, rgba(4, 15, 31, 0.92) 0%, rgba(4, 15, 31, 0.62) 42%, rgba(4, 15, 31, 0.25) 100%)';
const SHADE_LTR = 'linear-gradient(90deg, rgba(4, 15, 31, 0.92) 0%, rgba(4, 15, 31, 0.62) 42%, rgba(4, 15, 31, 0.25) 100%)';

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  root: { flex: 1, backgroundColor: palette.navy950, overflow: 'hidden' },
  shade: { ...StyleSheet.absoluteFillObject },
  greet: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.28)',
  },
  greetText: { color: palette.gold, fontSize: 14 },
  greetWelcome: { color: onDark.soft, fontSize: 13.5 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 64 },
  layout: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 56,
  },
  story: { flex: 1, minWidth: 0, maxWidth: 560, gap: 18 },
  logo: { width: 210, height: 92, marginBottom: 6, filter: 'drop-shadow(0 8px 26px rgba(0,0,0,0.5))' },
  headline: { color: onDark.text, fontSize: 38, lineHeight: 60 },
  headlineCompact: { fontSize: 28, lineHeight: 46 },
  lead: { color: onDark.soft, fontSize: 15.5, lineHeight: 29, maxWidth: 500 },
  leadCompact: { fontSize: 14, lineHeight: 26 },
  features: { gap: 14, marginTop: 10, alignSelf: 'stretch' },
  feature: { alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.22)',
  },
  featureTitle: { color: onDark.text, fontSize: 14.5 },
  featureText: { color: onDark.muted, fontSize: 12.5, marginTop: 1 },

  card: {
    width: 460,
    flexShrink: 0,
    padding: 30,
    gap: 6,
    borderRadius: 28,
    backgroundColor: 'rgba(8, 26, 48, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backdropFilter: 'blur(22px) saturate(1.2)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  cardTitle: { color: onDark.text, fontSize: 22, lineHeight: 34 },
  cardSubtitle: { color: onDark.muted, fontSize: 13, lineHeight: 22 },
  actions: { gap: 12, marginTop: 18 },

  action: {
    alignItems: 'center',
    gap: 14,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    cursor: 'pointer',
    transitionProperty: 'transform, background-color, border-color, box-shadow',
    transitionDuration: motion.base,
    transitionTimingFunction: motion.ease,
  },
  actionGold: { backgroundImage: gradients.gold, borderColor: 'rgba(255, 228, 92, 0.8)', boxShadow: '0 10px 30px rgba(233, 179, 8, 0.25)' },
  actionBrand: { backgroundImage: gradients.brand, borderColor: 'rgba(79, 143, 224, 0.45)' },
  actionHover: { transform: 'translateY(-2px)', boxShadow: elevation.floating },
  actionGlassHover: { backgroundColor: 'rgba(255, 255, 255, 0.11)', borderColor: 'rgba(255, 215, 0, 0.45)' },
  actionPressed: { transform: 'scale(0.985)' },
  actionDisabled: { opacity: 0.55, cursor: 'default' },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionIconGold: { backgroundColor: 'rgba(255, 255, 255, 0.45)' },
  actionTitle: { color: onDark.text, fontSize: 15.5 },
  actionSubtitle: { color: onDark.muted, fontSize: 12, marginTop: 2 },
  onGold: { color: palette.navy900 },
  onGoldSoft: { color: 'rgba(6, 23, 45, 0.7)' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 215, 0, 0.16)',
  },
  badgeText: { color: palette.gold, fontSize: 11 },
  more: { marginTop: 18, paddingTop: 16, gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  moreTitle: { color: onDark.muted, fontSize: 12 },
  moreRow: { flexWrap: 'wrap', gap: 8 },
  link: {
    alignItems: 'center',
    gap: 7,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: motion.fast,
  },
  linkHover: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255, 215, 0, 0.35)' },
  linkText: { color: onDark.text, fontSize: 12.5 },
  chevron: { transitionProperty: 'transform', transitionDuration: motion.base },
  chevronNudgeRtl: { transform: 'translateX(-4px)' },
  chevronNudgeLtr: { transform: 'translateX(4px)' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  bottomText: { color: onDark.muted, fontSize: 12 },
  lang: {
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    cursor: 'pointer',
  },
  langHover: { backgroundColor: 'rgba(255,255,255,0.12)' },
  langText: { color: onDark.soft, fontSize: 12.5 },
});
