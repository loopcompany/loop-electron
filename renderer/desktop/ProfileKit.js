import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { showAlert, showToastOrAlert } from '@helpers/Common';
import { checkAppVersion, isNotImplemented } from '@services/AccountSecurityApi';
import { getAppVersion } from '@services/notifications/deviceInfo';

import { contentGutter, contentMaxWidth } from './Breakpoints';
import { elevation, gradients, motion, onDark, palette, radii, surface, tone } from './desktopTheme';
import { animate } from './globalStyles';
import { setThemeMode, useTheme } from './theme';
import { DButton, Pill, formatNumber, useDir } from './ui';

/**
 * Account pages (the individual `Profile` and `OrganizationProfile`
 * overrides): an identity banner, a tab list beside one focused panel, and
 * the small pieces those panels share.
 *
 *   <ProfileLayout banner={<ProfileBanner …/>} side={<><ProfileNav …/><ChecklistCard …/></>}>
 *     <ProfilePanel key={tab} icon title hint footer={<SaveBar …/>}>
 *       <PanelGroup title hint icon>…fields…</PanelGroup>
 *     </ProfilePanel>
 *   </ProfileLayout>
 *
 * The screens keep their own state, requests and validation.
 */

const COPY = {
  fa: {
    light: 'روشن', dark: 'تیره', system: 'سیستم',
    strength: ['', 'ضعیف', 'متوسط', 'خوب', 'قوی'],
    photo: 'تغییر عکس',
  },
  en: {
    light: 'Light', dark: 'Dark', system: 'System',
    strength: ['', 'Weak', 'Fair', 'Good', 'Strong'],
    photo: 'Change photo',
  },
};

/* ---------------------------------------------------------------- layout */

export function ProfileLayout({ banner, side, children }) {
  const dir = useDir();
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.page}>
        {banner}
        <View style={[styles.columns, dir.row]}>
          <View style={[styles.side, animate('loop-fade-up', '320ms', '80ms')]}>{side}</View>
          <View style={styles.main}>{children}</View>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * @param {object} props
 * @param {string|null} props.image          photo / logo URL
 * @param {string} [props.initial]           letter shown without a photo
 * @param {string} [props.fallbackIcon]
 * @param {() => void} [props.onPickImage]   omit to make the photo read-only
 * @param {string} [props.kicker]            small line above the name
 * @param {string} props.name
 * @param {Array<{label: string, kind?: string, icon?: string}>} [props.pills]
 * @param {Array<{icon: string, text: string}>} [props.meta]
 * @param {{label: string, value: string}} [props.code]
 * @param {{percent: number, title: string, hint: string}} [props.progress]
 */
export function ProfileBanner({ image, initial, fallbackIcon = 'person', onPickImage, kicker, name, pills = [], meta = [], code, progress }) {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const percent = progress ? Math.max(0, Math.min(100, Math.round(progress.percent))) : 0;
  return (
    <View style={[styles.banner, dir.row, animate('loop-fade-up', '320ms')]}>
      <View style={styles.stars} pointerEvents="none" />
      <View style={[styles.bannerGlow, dir.rtl ? styles.glowLeft : styles.glowRight]} pointerEvents="none" />
      <Pressable
        onPress={onPickImage}
        disabled={!onPickImage}
        accessibilityRole="button"
        accessibilityLabel={copy.photo}
        style={[styles.avatarRing, !onPickImage && styles.avatarStatic]}
      >
        {({ hovered }) => (
          <>
            {image ? (
              <Image source={{ uri: image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                {initial ? (
                  <Text style={[styles.avatarInitial, dir.bold]}>{initial}</Text>
                ) : (
                  <Ionicons name={fallbackIcon} size={44} color={palette.navy700} />
                )}
              </View>
            )}
            {!!onPickImage && (
              <>
                <View style={[styles.avatarOverlay, hovered && styles.avatarOverlayOn]}>
                  <Ionicons name="camera" size={22} color={onDark.text} />
                  <Text style={[styles.avatarOverlayText, dir.bold]}>{copy.photo}</Text>
                </View>
                <View style={[styles.cameraBadge, dir.rtl ? styles.badgeLeft : styles.badgeRight]}>
                  <Ionicons name="camera" size={14} color={palette.navy900} />
                </View>
              </>
            )}
          </>
        )}
      </Pressable>

      <View style={[styles.bannerBody, dir.start]}>
        {!!kicker && <Text style={[styles.bannerKicker, dir.light, dir.align]}>{kicker}</Text>}
        <Text style={[styles.bannerName, dir.bold, dir.align]} numberOfLines={1}>{name}</Text>
        {!!pills.length && (
          <View style={[styles.chips, dir.row]}>
            {pills.map((pill) => (
              <Pill key={pill.label} label={pill.label} kind={pill.kind || 'gold'} icon={pill.icon} size="sm" />
            ))}
          </View>
        )}
        <View style={[styles.meta, dir.row]}>
          {meta.filter((item) => item.text).map((item) => (
            <View key={item.icon} style={[styles.metaItem, dir.row]}>
              <Ionicons name={item.icon} size={14} color={onDark.muted} />
              <Text style={[styles.metaText, dir.light]} numberOfLines={1}>{item.text}</Text>
            </View>
          ))}
          {!!code?.value && (
            <View style={[styles.codeChip, dir.row]}>
              <Text style={[styles.codeLabel, dir.light]}>{code.label}</Text>
              <Text style={[styles.code, dir.bold]} selectable>{code.value}</Text>
            </View>
          )}
        </View>
      </View>

      {!!progress && (
        <View style={styles.progress}>
          <View style={[styles.ring, { backgroundImage: `conic-gradient(${palette.gold} ${percent * 3.6}deg, ${onDark.glassStrong} 0deg)` }]}>
            <View style={styles.ringInner}>
              <Text style={[styles.ringValue, dir.bold]}>{dir.rtl ? `${formatNumber(percent, 'fa')}٪` : `${percent}%`}</Text>
            </View>
          </View>
          <Text style={[styles.progressTitle, dir.bold]}>{progress.title}</Text>
          <Text style={[styles.progressHint, dir.light]}>{progress.hint}</Text>
        </View>
      )}
    </View>
  );
}

/** The tab list. Each tab: { key, icon, title, hint, error?, done? }. */
export function ProfileNav({ tabs, active, onChange }) {
  const dir = useDir();
  return (
    <View style={styles.nav} accessibilityRole="tablist">
      {tabs.map((item) => {
        const on = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={({ hovered }) => [styles.navItem, dir.row, hovered && !on && styles.navItemHover, on && styles.navItemOn]}
          >
            <View style={[styles.navAccent, dir.rtl ? styles.accentRight : styles.accentLeft, on && styles.navAccentOn]} />
            <View style={[styles.navIcon, on && styles.navIconOn]}>
              <Ionicons name={item.icon} size={18} color={on ? palette.navy900 : surface.brandText} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.navTitle, dir.bold, dir.align]} numberOfLines={1}>{item.title}</Text>
              {!!item.hint && <Text style={[styles.navHint, dir.light, dir.align]} numberOfLines={1}>{item.hint}</Text>}
            </View>
            {item.error ? (
              <View style={styles.errorDot} />
            ) : item.done ? (
              <Ionicons name="checkmark-circle" size={17} color={palette.success} />
            ) : item.badge != null ? (
              <View style={styles.countBadge}>
                <Text style={[styles.countText, dir.bold]}>{formatNumber(item.badge, dir.lang)}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** What is still missing, with a progress bar; each item opens where it is filled. */
export function ChecklistCard({ title, percent, items, doneText }) {
  const dir = useDir();
  return (
    <View style={styles.sideCard}>
      <Text style={[styles.sideTitle, dir.bold, dir.align]}>{title}</Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${percent}%` }, dir.rtl && styles.barFillRtl]} />
      </View>
      {items.length ? (
        items.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            accessibilityRole="button"
            style={({ hovered }) => [styles.todoRow, dir.row, hovered && styles.todoRowHover]}
          >
            <Ionicons name="ellipse-outline" size={16} color={surface.faint} />
            <Text style={[styles.todoText, dir.light, dir.align]}>{item.label}</Text>
            <Ionicons name="add-circle-outline" size={17} color={surface.brandText} />
          </Pressable>
        ))
      ) : (
        <View style={[styles.todoRow, dir.row]}>
          <Ionicons name="sparkles" size={16} color={palette.success} />
          <Text style={[styles.todoText, dir.light, dir.align]}>{doneText}</Text>
        </View>
      )}
    </View>
  );
}

/** A small titled card for the side column (status, notes). */
export function SideCard({ title, icon, children }) {
  const dir = useDir();
  return (
    <View style={styles.sideCard}>
      {!!title && (
        <View style={[styles.sideHead, dir.row]}>
          {!!icon && <Ionicons name={icon} size={16} color={surface.brandText} />}
          <Text style={[styles.sideTitle, styles.flex, dir.bold, dir.align]}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

/* ---------------------------------------------------------------- panel */

/** The active tab. Give it `key={tab}` so switching tabs replays the entrance. */
export function ProfilePanel({ icon, title, hint, right, children, footer }) {
  const dir = useDir();
  return (
    <View style={[styles.panel, animate('loop-fade-up', '260ms')]}>
      <View style={[styles.panelHead, dir.row]}>
        <View style={styles.panelIcon}>
          <Ionicons name={icon} size={22} color={palette.gold} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.panelTitle, dir.bold, dir.align]}>{title}</Text>
          {!!hint && <Text style={[styles.panelHint, dir.light, dir.align]}>{hint}</Text>}
        </View>
        {right}
      </View>
      <View style={styles.panelBody}>{children}</View>
      {footer}
    </View>
  );
}

/** The bar under a panel: a hint and its buttons. */
export function SaveBar({ hint, children }) {
  const dir = useDir();
  return (
    <View style={[styles.saveBar, dir.row]}>
      <Ionicons name="information-circle-outline" size={17} color={surface.faint} />
      <Text style={[styles.saveHint, dir.light, dir.align]}>{hint}</Text>
      <View style={[styles.saveActions, dir.row]}>{children}</View>
    </View>
  );
}

/** A titled group inside a panel. */
export function PanelGroup({ title, hint, icon, children, right }) {
  const dir = useDir();
  return (
    <View style={styles.group}>
      <View style={[styles.groupHead, dir.row]}>
        {!!icon && <Ionicons name={icon} size={16} color={surface.brandText} />}
        <View style={styles.flex}>
          <Text style={[styles.groupTitle, dir.bold, dir.align]}>{title}</Text>
          {!!hint && <Text style={[styles.groupHint, dir.light, dir.align]}>{hint}</Text>}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

/** A tinted note line inside a panel. */
export function PanelNote({ icon = 'information-circle-outline', kind = 'brand', children }) {
  const dir = useDir();
  const c = tone[kind] || tone.brand;
  return (
    <View style={[styles.note, dir.row, { backgroundColor: c.bg }]}>
      <Ionicons name={icon} size={16} color={c.fg} />
      <Text style={[styles.noteText, dir.light, dir.align]}>{children}</Text>
    </View>
  );
}

/** Red-tinted box for irreversible actions. */
export function DangerZone({ children }) {
  return <View style={styles.dangerZone}>{children}</View>;
}

/* ---------------------------------------------------------------- rows */

/**
 * The rows of the mobile AccountActionsCard (components/account/
 * OrganizationAccountSections): the same targets, labels and app-version
 * check, keyed so each tab can show its own.
 */
export function useAccountRows(navigation, { isOrganization } = {}) {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const version = getAppVersion() || '-';

  const checkVersion = async () => {
    setChecking(true);
    const result = await checkAppVersion();
    setChecking(false);
    if (!result.ok) {
      showToastOrAlert(
        isNotImplemented(result)
          ? t('Checking for updates will be available soon.')
          : result.message || t('The operation failed. Please try again.')
      );
      return;
    }
    const info = result.data || {};
    if (info.update_available && info.update_url) {
      showAlert(
        t('Update available'),
        t('Version {{version}} of the app is available.', { version: info.latest_version || '' }),
        [
          ...(info.force ? [] : [{ text: t('Later'), style: 'cancel' }]),
          { text: t('Update'), onPress: () => Linking.openURL(info.update_url) },
        ]
      );
    } else {
      showToastOrAlert(t('You are using the latest version.'));
    }
  };

  return {
    security: { icon: 'shield-half-outline', title: t('Account security'), subtitle: t('Two-step verification, devices, sessions, alerts'), onPress: () => navigation.navigate('AccountSecurity') },
    twoFactor: { icon: 'shield-checkmark-outline', title: t('Two-step verification'), onPress: () => navigation.navigate('AccountSecurity', { section: 'two_factor' }) },
    update: { icon: 'cloud-download-outline', title: t('Update the app'), subtitle: `${t('Version')} ${version}`, onPress: checking ? undefined : checkVersion },
    remove: {
      icon: 'trash-outline',
      danger: true,
      title: isOrganization ? t('Delete organization / company account') : t('Delete account'),
      subtitle: isOrganization ? t('Carried out after review and approval by the admin panel.') : undefined,
      onPress: () => navigation.navigate('AccountSecurity', { section: 'delete' }),
    },
  };
}

/** Navigation rows: icon, title, subtitle, chevron. */
export function LinkRows({ rows }) {
  const dir = useDir();
  return (
    <View style={styles.links}>
      {rows.map((row) => {
        const c = row.danger ? tone.danger : tone.brand;
        return (
          <Pressable
            key={row.icon}
            onPress={row.onPress}
            accessibilityRole="button"
            style={({ hovered }) => [styles.link, dir.row, hovered && styles.linkHover, row.danger && hovered && styles.linkDangerHover]}
          >
            <View style={[styles.linkIcon, { backgroundColor: c.bg }]}>
              <Ionicons name={row.icon} size={18} color={c.fg} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.linkTitle, dir.bold, dir.align, row.danger && { color: palette.danger }]} numberOfLines={1}>{row.title}</Text>
              {!!row.subtitle && <Text style={[styles.linkSub, dir.light, dir.align]} numberOfLines={2}>{row.subtitle}</Text>}
            </View>
            <Ionicons name={dir.forward} size={16} color={surface.faint} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** Light / dark / system as three segments (./theme). */
export function ThemeSwitch() {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const { mode: savedMode } = useTheme();
  const [mode, setMode] = useState(savedMode);
  const options = [
    { value: 'light', icon: 'sunny-outline', label: copy.light },
    { value: 'dark', icon: 'moon-outline', label: copy.dark },
    { value: 'system', icon: 'desktop-outline', label: copy.system },
  ];
  return (
    <View style={[styles.segments, dir.row]} accessibilityRole="radiogroup">
      {options.map((option) => {
        const on = mode === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              setMode(option.value);
              setThemeMode(option.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={({ hovered }) => [styles.segment, dir.row, hovered && !on && styles.segmentHover, on && styles.segmentOn]}
          >
            <Ionicons name={option.icon} size={16} color={on ? palette.navy900 : surface.muted} />
            <Text style={[styles.segmentText, dir.bold, on && styles.segmentTextOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 0–4 from length and character variety; only a hint, the server decides. */
export const passwordScore = (value = '') => {
  if (!value) return 0;
  let score = value.length >= 8 ? 1 : 0;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.max(score, 1);
};
const STRENGTH_COLORS = [surface.border, palette.danger, tone.warning.fg, palette.success, palette.success];

/** Four bars and a word under a new-password field. */
export function StrengthMeter({ value }) {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const score = passwordScore(value);
  return (
    <View style={[styles.strength, dir.row]}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={[styles.strengthBar, { backgroundColor: score >= step ? STRENGTH_COLORS[score] : surface.border }]} />
      ))}
      <Text style={[styles.strengthText, dir.bold, { color: STRENGTH_COLORS[score] }]}>{copy.strength[score]}</Text>
    </View>
  );
}

/** Sign-out button for the bottom of the side column. */
export function SignOutButton({ title, onPress, disabled }) {
  return <DButton title={title} icon="log-out-outline" variant="danger" size="lg" block onPress={onPress} disabled={disabled} />;
}

/* ---------------------------------------------------------------- styles */

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  scrollContent: { paddingHorizontal: contentGutter, paddingBottom: 32 },
  page: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 18 },
  columns: { gap: 18, alignItems: 'flex-start' },
  side: { width: 310, flexShrink: 0, gap: 16 },
  main: { flex: 1, minWidth: 0 },

  /* banner */
  banner: {
    alignItems: 'center',
    gap: 24,
    paddingVertical: 28,
    paddingHorizontal: 30,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.floating,
    borderWidth: 1,
    borderColor: onDark.hairline,
  },
  stars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  bannerGlow: {
    position: 'absolute',
    top: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundImage: 'radial-gradient(circle, rgba(255, 215, 0, 0.16) 0%, rgba(255, 215, 0, 0) 70%)',
  },
  glowLeft: { left: -80 },
  glowRight: { right: -80 },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    flexShrink: 0,
    backgroundImage: gradients.gold,
    boxShadow: '0 0 40px rgba(255, 215, 0, 0.28)',
    cursor: 'pointer',
  },
  avatarStatic: { cursor: 'default' },
  avatar: { width: '100%', height: '100%', borderRadius: 56, backgroundColor: palette.white },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff6cc' },
  avatarInitial: { fontSize: 44, color: palette.navy800 },
  avatarOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(4, 15, 31, 0.6)',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: motion.base,
  },
  avatarOverlayOn: { opacity: 1 },
  avatarOverlayText: { color: onDark.text, fontSize: 11.5 },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: gradients.gold,
    borderWidth: 3,
    borderColor: palette.navy850,
  },
  badgeLeft: { left: 4 },
  badgeRight: { right: 4 },
  bannerBody: { flex: 1, minWidth: 0, gap: 8 },
  bannerKicker: { color: onDark.muted, fontSize: 12.5 },
  bannerName: { color: onDark.text, fontSize: 26 },
  chips: { gap: 8, flexWrap: 'wrap' },
  meta: { gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  metaItem: {
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: onDark.glass,
    borderWidth: 1,
    borderColor: onDark.hairline,
    maxWidth: 300,
  },
  metaText: { color: onDark.soft, fontSize: 13 },
  codeChip: {
    alignItems: 'center',
    gap: 8,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  codeLabel: { color: onDark.muted, fontSize: 11.5 },
  code: { color: palette.gold, fontSize: 14, letterSpacing: 1.5 },
  progress: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: radii.lg,
    backgroundColor: onDark.glass,
    borderWidth: 1,
    borderColor: onDark.hairline,
  },
  ring: { width: 84, height: 84, borderRadius: 42, padding: 7, marginBottom: 6 },
  ringInner: { flex: 1, borderRadius: 35, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.navy850 },
  ringValue: { color: onDark.text, fontSize: 19 },
  progressTitle: { color: onDark.text, fontSize: 13.5 },
  progressHint: { color: onDark.muted, fontSize: 12 },

  /* side */
  nav: {
    padding: 8,
    gap: 2,
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.card,
  },
  navItem: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    overflow: 'hidden',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  navItemHover: { backgroundColor: surface.hover },
  navItemOn: { backgroundColor: surface.brandTint },
  navAccent: { position: 'absolute', top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: 'transparent' },
  navAccentOn: { backgroundImage: gradients.gold },
  accentLeft: { left: 0 },
  accentRight: { right: 0 },
  navIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.brandTint,
  },
  navIconOn: { backgroundImage: gradients.gold, boxShadow: elevation.gold },
  navTitle: { fontSize: 14, color: surface.title },
  navHint: { fontSize: 11.5, color: surface.faint, marginTop: 2 },
  errorDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.danger, boxShadow: '0 0 0 3px rgba(214, 69, 69, 0.18)' },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.brandTint,
  },
  countText: { fontSize: 11.5, color: surface.brandText },

  sideCard: {
    gap: 6,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.card,
  },
  sideHead: { alignItems: 'center', gap: 8, marginBottom: 4 },
  sideTitle: { fontSize: 14, color: surface.title },
  bar: { height: 6, borderRadius: 3, backgroundColor: surface.sunken, overflow: 'hidden', marginVertical: 6 },
  barFill: { height: '100%', borderRadius: 3, backgroundImage: gradients.gold, transitionProperty: 'width', transitionDuration: motion.slow },
  barFillRtl: { alignSelf: 'flex-end' },
  todoRow: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: radii.sm,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  todoRowHover: { backgroundColor: surface.hover },
  todoText: { flex: 1, fontSize: 13, color: surface.muted, lineHeight: 21 },

  /* panel */
  panel: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.card,
  },
  panelHead: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: surface.border,
    backgroundColor: surface.cardMuted,
  },
  panelIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: gradients.brand,
    boxShadow: elevation.brand,
  },
  panelTitle: { fontSize: 18, color: surface.title },
  panelHint: { fontSize: 12.5, color: surface.muted, marginTop: 2 },
  panelBody: { padding: 24, gap: 26 },
  group: { gap: 14 },
  groupHead: { alignItems: 'center', gap: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: surface.border },
  groupTitle: { fontSize: 14.5, color: surface.title },
  groupHint: { fontSize: 12, color: surface.faint, marginTop: 1 },
  saveBar: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: surface.border,
    backgroundColor: surface.cardMuted,
  },
  saveHint: { flex: 1, fontSize: 12.5, color: surface.faint, lineHeight: 21 },
  saveActions: { gap: 10, alignItems: 'center' },
  note: { alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: radii.md },
  noteText: { flex: 1, fontSize: 12.5, color: surface.muted, lineHeight: 21 },
  dangerZone: {
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(214, 69, 69, 0.3)',
    backgroundColor: tone.danger.bg,
  },

  /* rows */
  links: { gap: 4, marginHorizontal: -8 },
  link: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  linkHover: { backgroundColor: surface.hover },
  linkDangerHover: { backgroundColor: tone.danger.bg },
  linkIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 13.5, color: surface.title },
  linkSub: { fontSize: 12, color: surface.muted, lineHeight: 19 },

  /* theme switch */
  segments: {
    gap: 6,
    padding: 5,
    borderRadius: radii.md,
    backgroundColor: surface.sunken,
    borderWidth: 1,
    borderColor: surface.border,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: radii.sm,
    cursor: 'pointer',
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: motion.base,
  },
  segmentHover: { backgroundColor: surface.hover },
  segmentOn: { backgroundImage: gradients.gold, boxShadow: elevation.gold },
  segmentText: { fontSize: 13.5, color: surface.muted },
  segmentTextOn: { color: palette.navy900 },

  /* password strength */
  strength: { alignItems: 'center', gap: 6, marginTop: 8 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, transitionProperty: 'background-color', transitionDuration: motion.base },
  strengthText: { fontSize: 11.5, minWidth: 44, textAlign: 'center' },
});
