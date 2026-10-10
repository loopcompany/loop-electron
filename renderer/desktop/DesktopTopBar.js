import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { topBarHeight, topBarInset } from './Breakpoints';
import { motion, onDark, palette, radii } from './desktopTheme';
import { animate } from './globalStyles';
import { shellLabels } from './routeMeta';
import { Cheetah, cheetahFacing, formatNumber } from './ui';
import { getFontFamily } from '@theme/Typography';

/**
 * The bar across the top of every page, drawn on the starry band: back,
 * where you are, the page title, and the things a user reaches for from
 * anywhere (search / command palette, wallet balance, messages).
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.crumb]          section the page belongs to
 * @param {() => void} [props.onCrumb]
 * @param {(() => void)|null} props.onBack  null hides the button
 * @param {boolean} props.isLoggedIn
 * @param {number} [props.walletBalance]
 * @param {() => void} props.onWallet
 * @param {() => void} props.onMessages
 * @param {() => void} props.onSearch
 * @param {() => void} props.onSignIn
 * @param {'light'|'dark'} props.theme
 * @param {() => void} props.onToggleTheme
 * @param {boolean} props.musicOn          background music (./backgroundMusic)
 * @param {() => void} props.onToggleMusic
 * @param {string} props.lang
 */
export default function DesktopTopBar({
  title,
  crumb,
  onCrumb,
  onBack,
  isLoggedIn,
  walletBalance,
  onWallet,
  onMessages,
  onSearch,
  onSignIn,
  theme,
  onToggleTheme,
  musicOn,
  onToggleMusic,
  lang,
}) {
  const rtl = lang === 'fa';
  const L = shellLabels(lang);
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const align = { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' };
  const bold = { fontFamily: getFontFamily('bold', lang) };
  const light = { fontFamily: getFontFamily('light', lang) };

  return (
    <View style={[styles.bar, row]}>
      <View style={[styles.start, row]}>
        {onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={L.back}
            style={({ hovered, pressed }) => [styles.back, hovered && styles.glassHover, pressed && styles.glassPressed]}
          >
            <Cheetah facing={cheetahFacing(rtl, 'back')} height={28} />
          </Pressable>
        )}
        <View style={styles.titleBlock} key={title}>
          {!!crumb && (
            <Pressable onPress={onCrumb} disabled={!onCrumb} style={[styles.crumbRow, row]}>
              {({ hovered }) => (
                <>
                  <Text style={[styles.crumb, light, hovered && onCrumb && styles.crumbHover]} numberOfLines={1}>
                    {crumb}
                  </Text>
                  <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={11} color={onDark.muted} />
                </>
              )}
            </Pressable>
          )}
          <Text style={[styles.title, bold, align, animate('loop-fade-up', '280ms')]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      <View style={[styles.end, row]}>
        <Pressable
          onPress={onSearch}
          accessibilityRole="button"
          accessibilityLabel={L.search}
          style={({ hovered }) => [styles.search, row, hovered && styles.glassHover]}
        >
          <Ionicons name="search" size={16} color={onDark.muted} />
          <Text style={[styles.searchText, light, align]} numberOfLines={1}>
            {L.search}
          </Text>
          <View style={styles.kbd}>
            <Text style={[styles.kbdText, bold]}>Ctrl</Text>
            <Text style={[styles.kbdText, bold]}>K</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={onToggleTheme}
          accessibilityRole="button"
          accessibilityLabel={theme === 'dark' ? L.lightMode : L.darkMode}
          style={({ hovered, pressed }) => [styles.round, hovered && styles.glassHover, pressed && styles.glassPressed]}
        >
          <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={17} color={theme === 'dark' ? palette.gold : onDark.text} />
        </Pressable>

        <Pressable
          onPress={onToggleMusic}
          accessibilityRole="button"
          accessibilityLabel={musicOn ? L.musicOff : L.musicOn}
          style={({ hovered, pressed }) => [styles.round, hovered && styles.glassHover, pressed && styles.glassPressed]}
        >
          <Ionicons name={musicOn ? 'musical-notes' : 'volume-mute'} size={17} color={musicOn ? palette.gold : onDark.muted} />
        </Pressable>

        {isLoggedIn ? (
          <>
            <Pressable
              onPress={onWallet}
              accessibilityRole="link"
              accessibilityLabel={L.wallet}
              style={({ hovered }) => [styles.wallet, row, hovered && styles.glassHover]}
            >
              <View style={styles.walletIcon}>
                <Ionicons name="wallet" size={15} color={palette.navy900} />
              </View>
              <View>
                <Text style={[styles.walletLabel, light, align]}>{L.wallet}</Text>
                <Text style={[styles.walletValue, bold, align]} numberOfLines={1}>
                  {formatNumber(walletBalance ?? 0, lang)}{' '}
                  <Text style={[styles.walletUnit, light]}>{L.toman}</Text>
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={onMessages}
              accessibilityRole="link"
              accessibilityLabel={L.support_}
              style={({ hovered, pressed }) => [styles.round, hovered && styles.glassHover, pressed && styles.glassPressed]}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={onDark.text} />
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={onSignIn}
            accessibilityRole="button"
            style={({ hovered }) => [styles.signIn, row, hovered && styles.signInHover]}
          >
            <Ionicons name="log-in-outline" size={17} color={palette.navy900} />
            <Text style={[styles.signInText, bold]}>{L.signIn}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const glass = {
  backgroundColor: onDark.glass,
  borderWidth: 1,
  borderColor: onDark.hairline,
  backdropFilter: 'blur(10px)',
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color, transform',
  transitionDuration: motion.fast,
};

const styles = StyleSheet.create({
  bar: {
    height: topBarHeight,
    marginTop: topBarInset,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    paddingHorizontal: 28,
    zIndex: 2,
  },
  start: { alignItems: 'center', gap: 14, flexShrink: 1, minWidth: 0 },
  back: { ...glass, width: 64, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  glassHover: { backgroundColor: onDark.glassStrong, borderColor: 'rgba(255,255,255,0.2)' },
  glassPressed: { transform: 'scale(0.96)' },
  titleBlock: { flexShrink: 1, minWidth: 0 },
  crumbRow: { alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  crumb: { color: onDark.muted, fontSize: 11.5 },
  crumbHover: { color: palette.gold },
  title: { color: onDark.text, fontSize: 20, lineHeight: 30 },
  end: { alignItems: 'center', gap: 10, flexShrink: 0 },
  search: { ...glass, height: 40, width: 280, borderRadius: radii.md, alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchText: { flex: 1, color: onDark.muted, fontSize: 13 },
  kbd: { flexDirection: 'row', gap: 3 },
  kbdText: {
    color: onDark.soft,
    fontSize: 10.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  wallet: { ...glass, height: 44, borderRadius: radii.md, alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  walletIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: 'linear-gradient(135deg, #ffe45c 0%, #ffd700 45%, #e9b308 100%)',
  },
  walletLabel: { color: onDark.muted, fontSize: 10.5, lineHeight: 14 },
  walletValue: { color: onDark.text, fontSize: 13.5, lineHeight: 18 },
  walletUnit: { color: onDark.muted, fontSize: 10.5 },
  round: { ...glass, width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  signIn: {
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    backgroundImage: 'linear-gradient(135deg, #ffe45c 0%, #ffd700 45%, #e9b308 100%)',
    cursor: 'pointer',
  },
  signInHover: { filter: 'brightness(1.05)' },
  signInText: { color: palette.navy900, fontSize: 13.5 },
});
