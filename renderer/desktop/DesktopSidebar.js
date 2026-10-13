import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { sidebarWidth, sidebarRailWidth } from './Breakpoints';
import { chrome, elevation, gradients, motion, onDark, palette, radii } from './desktopTheme';
import { NAV_GROUPS, iconForRoute, shellLabels } from './routeMeta';
import { formatNumber } from './ui';
import { brandCopy } from './brandCopy';
import { tip } from './tooltip';
import { APPS_URL, SITE_LABEL, SITE_URL, openLink } from './links';
import { getFontFamily } from '@theme/Typography';

/**
 * Permanent navigation column of the desktop app — the counterpart of the
 * floating dock + full-screen menu modal that `MenuProvider` renders on
 * phones. Same items, same handlers; only the presentation differs, so it is
 * driven entirely by props from `MenuProvider`.
 *
 * It can fold into an icon rail (`collapsed`), which the shell remembers.
 *
 * @param {object} props
 * @param {Array<{id: number, title: string, screen?: string, action?: Function}>} props.items
 * @param {string} props.currentRouteName
 * @param {string} props.homeRoute
 * @param {(screen: string) => void} props.onNavigate
 * @param {() => void} props.onHome
 * @param {() => void} props.onNewOrder
 * @param {() => void} props.onProfile
 * @param {() => void} props.onSupport
 * @param {() => void} props.onLogout
 * @param {() => void} props.onSignIn
 * @param {() => void} props.onToggleLanguage
 * @param {() => void} props.onToggleCollapsed
 * @param {boolean} props.collapsed
 * @param {boolean} props.isLoggedIn
 * @param {boolean} props.isLoggingOut
 * @param {string} [props.accountName]
 * @param {string} props.accountType
 * @param {string|number} [props.gems]
 * @param {string} [props.userCode]
 * @param {string} props.lang
 * @param {(key: string) => string} props.t
 */
export default function DesktopSidebar({
  items,
  currentRouteName,
  homeRoute,
  onNavigate,
  onHome,
  onNewOrder,
  onProfile,
  onSupport,
  onLogout,
  onSignIn,
  onToggleLanguage,
  onToggleCollapsed,
  collapsed,
  isLoggedIn,
  isLoggingOut,
  accountName,
  accountType,
  gems,
  userCode,
  lang,
  t,
}) {
  const rtl = lang === 'fa';
  const L = shellLabels(lang);
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const textAlign = { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' };
  const bold = { fontFamily: getFontFamily('bold', lang) };
  const light = { fontFamily: getFontFamily('light', lang) };
  const [copied, setCopied] = useState(false);

  const grouped = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.routes
      .map((route) => items.find((item) => item.screen === route))
      .filter(Boolean),
  }));
  const placed = new Set(NAV_GROUPS.flatMap((group) => group.routes));
  const leftovers = items.filter((item) => !item.screen || !placed.has(item.screen));
  const servicesGroup = grouped.find((group) => group.id === 'services');
  if (servicesGroup) servicesGroup.items.push(...leftovers);

  const copyCode = () => {
    try {
      navigator.clipboard?.writeText(String(userCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard is optional
    }
  };

  const renderItem = ({ key, title, active, onPress, icon }) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={title}
      accessibilityState={{ selected: active }}
      {...tip(title)}
      style={({ hovered, pressed }) => [
        styles.item,
        row,
        collapsed && styles.itemCollapsed,
        hovered && !active && styles.itemHover,
        pressed && styles.itemPressed,
        active && styles.itemActive,
        active && { backgroundImage: rtl ? ACTIVE_RTL : ACTIVE_LTR },
      ]}
    >
      {active && <View style={[styles.activeBar, rtl ? styles.activeBarRight : styles.activeBarLeft]} />}
      <View style={[styles.itemIcon, active && styles.itemIconActive]}>
        <Ionicons
          name={active ? icon.replace('-outline', '') : icon}
          size={18}
          color={active ? palette.gold : chrome.itemText}
        />
      </View>
      {!collapsed && (
        <Text
          style={[styles.itemText, active ? bold : light, textAlign, active && styles.itemTextActive]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );

  const renderGroup = (group) =>
    group.items.length > 0 && (
      <View key={group.id} style={styles.section}>
        {collapsed ? (
          <View style={styles.sectionRule} />
        ) : (
          <Text style={[styles.sectionLabel, bold, textAlign]}>{L[group.id]}</Text>
        )}
        {group.items.map((item) =>
          renderItem({
            key: String(item.id),
            title: item.title,
            icon: iconForRoute(item.screen),
            active: !!item.screen && item.screen === currentRouteName,
            onPress: () => (item.screen ? onNavigate(item.screen) : item.action?.()),
          })
        )}
      </View>
    );

  const initial = (accountName || '').trim().charAt(0);

  return (
    <View
      dataSet={{ loopDark: '' }}
      style={[
        styles.sidebar,
        { width: collapsed ? sidebarRailWidth : sidebarWidth },
        rtl ? styles.sidebarRight : styles.sidebarLeft,
      ]}
    >
      {/* Brand + fold button */}
      <View style={[styles.brand, row, collapsed && styles.brandCollapsed]}>
        <Pressable onPress={onHome} accessibilityRole="link" {...tip(L.home)} style={[styles.brandLink, row, !collapsed && styles.brandLinkWide]}>
          <View style={styles.brandMark}>
            <Image source={require('@assets/images/start.png')} style={styles.brandLogo} />
          </View>
          {!collapsed && (
            <View style={styles.brandText}>
              <Text style={[styles.brandName, bold, textAlign]}>Loop</Text>
              <Text style={[styles.brandTag, light, textAlign]} numberOfLines={2}>
                {brandCopy(lang).tagline}
              </Text>
            </View>
          )}
        </Pressable>
        {!collapsed && (
          <Pressable
            onPress={onToggleCollapsed}
            accessibilityRole="button"
            accessibilityLabel={L.collapse}
            {...tip(L.collapse)}
            style={({ hovered }) => [styles.fold, hovered && styles.itemHover]}
          >
            <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={16} color={onDark.muted} />
          </Pressable>
        )}
      </View>

      {collapsed && (
        <Pressable
          onPress={onToggleCollapsed}
          accessibilityRole="button"
          accessibilityLabel={L.expand}
          {...tip(L.expand)}
          style={({ hovered }) => [styles.unfold, hovered && styles.itemHover]}
        >
          <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={16} color={onDark.muted} />
        </Pressable>
      )}

      {/* Primary action */}
      <View style={[styles.ctaWrap, collapsed && styles.ctaWrapCollapsed]}>
        <Pressable
          onPress={isLoggedIn ? onNewOrder : onSignIn}
          accessibilityRole="button"
          accessibilityLabel={isLoggedIn ? L.newOrder : L.signIn}
          {...tip(isLoggedIn ? L.newOrder : L.signIn)}
          style={({ hovered, pressed }) => [
            styles.cta,
            row,
            collapsed && styles.ctaCollapsed,
            hovered && styles.ctaHover,
            pressed && styles.ctaPressed,
          ]}
        >
          <Ionicons name={isLoggedIn ? 'add' : 'log-in-outline'} size={20} color={palette.navy900} />
          {!collapsed && (
            <Text style={[styles.ctaText, bold]} numberOfLines={1}>
              {isLoggedIn ? L.newOrder : L.signIn}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.nav} contentContainerStyle={styles.navContent} showsVerticalScrollIndicator={false}>
        {renderItem({
          key: 'home',
          title: L.home,
          icon: 'grid-outline',
          active: currentRouteName === homeRoute,
          onPress: onHome,
        })}
        {grouped.map(renderGroup)}
      </ScrollView>

      {/* Account */}
      <View style={[styles.footer, collapsed && styles.footerCollapsed]}>
        <Pressable
          onPress={() => openLink(APPS_URL)}
          accessibilityRole="link"
          accessibilityLabel={L.apps}
          {...tip(collapsed ? L.apps : null)}
          style={({ hovered }) => [styles.apps, row, collapsed && styles.appsCollapsed, hovered && styles.appsHover]}
        >
          <View style={styles.appsIcon}>
            <Ionicons name="phone-portrait-outline" size={16} color={palette.gold} />
          </View>
          {!collapsed && (
            <View style={styles.appsText}>
              <Text style={[styles.appsTitle, bold, textAlign]} numberOfLines={1}>{L.apps}</Text>
              <Text style={[styles.appsHint, light, textAlign]} numberOfLines={1}>{L.appsHint}</Text>
            </View>
          )}
          {!collapsed && <Ionicons name="download-outline" size={16} color={chrome.itemText} />}
        </Pressable>

        {isLoggedIn ? (
          <Pressable
            onPress={onProfile}
            accessibilityLabel={L.profile}
            {...tip(L.profile)}
            style={({ hovered }) => [styles.profile, row, collapsed && styles.profileCollapsed, hovered && styles.profileHover]}
          >
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                {initial ? (
                  <Text style={[styles.avatarText, bold]}>{initial}</Text>
                ) : (
                  <Ionicons name="person" size={16} color={palette.navy800} />
                )}
              </View>
            </View>
            {!collapsed && (
              <View style={styles.profileText}>
                <Text style={[styles.profileName, bold, textAlign]} numberOfLines={1}>
                  {accountName || accountType}
                </Text>
                <View style={[styles.chips, row]}>
                  {!!accountName && (
                    <Text style={[styles.profileType, light, textAlign]} numberOfLines={1}>
                      {accountType}
                    </Text>
                  )}
                  <View style={[styles.gemChip, row]}>
                    <Ionicons name="diamond" size={9} color={palette.gold} />
                    <Text style={[styles.gemText, bold]}>{formatNumber(gems ?? 0, lang)}</Text>
                  </View>
                </View>
              </View>
            )}
            {!collapsed && (
              <Pressable
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onLogout();
                }}
                disabled={isLoggingOut}
                accessibilityRole="button"
                accessibilityLabel={isLoggingOut ? t('Logging out...') : L.logout}
                {...tip(L.logout)}
                style={({ hovered }) => [styles.logout, hovered && styles.logoutHover, isLoggingOut && styles.disabled]}
              >
                <Ionicons name="log-out-outline" size={17} color="rgba(255, 140, 140, 0.9)" />
              </Pressable>
            )}
          </Pressable>
        ) : (
          !collapsed && (
            <View style={styles.guest}>
              <Text style={[styles.profileName, bold, textAlign]}>{L.guest}</Text>
              <Text style={[styles.profileType, light, textAlign]}>{L.guestHint}</Text>
            </View>
          )
        )}

        {isLoggedIn && !!userCode && !collapsed && (
          <Pressable onPress={copyCode} accessibilityRole="button" {...tip(L.userCode)} style={({ hovered }) => [styles.codeRow, row, hovered && styles.itemHover]}>
            <Ionicons name={copied ? 'checkmark-circle' : 'qr-code-outline'} size={14} color={copied ? '#7ee2a8' : chrome.itemText} />
            <Text style={[styles.codeText, light, textAlign]}>{copied ? L.copy : L.userCode}</Text>
            <Text style={[styles.codeValue, bold]} selectable>
              {userCode}
            </Text>
          </Pressable>
        )}

        <View style={[styles.footerRow, collapsed ? styles.footerRowCollapsed : row]}>
          <Pressable
            onPress={onSupport}
            accessibilityRole="button"
            accessibilityLabel={L.support_}
            {...tip(L.support_)}
            style={({ hovered }) => [styles.footerButton, row, hovered && styles.itemHover]}
          >
            <Ionicons name="headset-outline" size={16} color={chrome.itemText} />
            {!collapsed && <Text style={[styles.footerButtonText, light]}>{L.support_}</Text>}
          </Pressable>
          <Pressable
            onPress={onToggleLanguage}
            accessibilityRole="button"
            accessibilityLabel={L.switchLanguage}
            {...tip(L.switchLanguage)}
            style={({ hovered }) => [styles.footerButton, row, hovered && styles.itemHover]}
          >
            <Ionicons name="language-outline" size={16} color={chrome.itemText} />
            {!collapsed && <Text style={[styles.footerButtonText, light]}>{L.language}</Text>}
          </Pressable>
          <Pressable
            onPress={() => openLink(SITE_URL)}
            accessibilityRole="link"
            accessibilityLabel={`${L.website} — ${SITE_LABEL}`}
            {...tip(SITE_LABEL)}
            style={({ hovered }) => [styles.footerButton, row, hovered && styles.itemHover]}
          >
            <Ionicons name="globe-outline" size={16} color={chrome.itemText} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const ACTIVE_RTL = 'linear-gradient(270deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.03) 100%)';
const ACTIVE_LTR = 'linear-gradient(90deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.03) 100%)';

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    backgroundColor: chrome.sidebar,
    backgroundImage: gradients.sidebar,
    borderColor: chrome.sidebarBorder,
    transitionProperty: 'width',
    transitionDuration: motion.slow,
    transitionTimingFunction: motion.ease,
    overflow: 'hidden',
  },
  sidebarRight: { borderLeftWidth: 1 },
  sidebarLeft: { borderRightWidth: 1 },
  brand: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  brandCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  brandLink: { alignItems: 'center', gap: 11, cursor: 'pointer' },
  brandLinkWide: { flex: 1, minWidth: 0 },
  brandText: { flex: 1, minWidth: 0 },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.22)',
    boxShadow: '0 0 24px rgba(79, 143, 224, 0.35)',
  },
  brandLogo: { width: 30, height: 30, resizeMode: 'contain' },
  brandName: { color: palette.white, fontSize: 18, lineHeight: 24 },
  brandTag: { color: onDark.muted, fontSize: 10.5, lineHeight: 17 },
  fold: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  unfold: {
    alignSelf: 'center',
    width: 36,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginBottom: 4,
  },
  ctaWrap: { paddingHorizontal: 14, paddingBottom: 8 },
  ctaWrapCollapsed: { paddingHorizontal: 0, alignItems: 'center' },
  cta: {
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundImage: gradients.gold,
    boxShadow: '0 6px 18px rgba(233, 179, 8, 0.22)',
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow, filter',
    transitionDuration: motion.fast,
  },
  ctaCollapsed: { width: 44, paddingHorizontal: 0 },
  ctaHover: { transform: 'translateY(-1px)', boxShadow: elevation.gold, filter: 'brightness(1.04)' },
  ctaPressed: { transform: 'scale(0.98)' },
  ctaText: { color: palette.navy900, fontSize: 14 },
  nav: { flex: 1 },
  navContent: { paddingTop: 8, paddingBottom: 16, paddingHorizontal: 12, gap: 2 },
  section: { marginTop: 14, gap: 2 },
  sectionLabel: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    color: chrome.sectionLabel,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  sectionRule: {
    height: 1,
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  item: {
    alignItems: 'center',
    gap: 10,
    height: 40,
    paddingHorizontal: 8,
    borderRadius: radii.sm + 2,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  itemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  itemHover: { backgroundColor: chrome.itemHover },
  itemPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  itemActive: { backgroundColor: chrome.itemActive },
  activeBar: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: radii.pill,
    backgroundColor: palette.gold,
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.7)',
  },
  activeBarRight: { right: -12 },
  activeBarLeft: { left: -12 },
  itemIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconActive: { backgroundColor: 'rgba(255, 215, 0, 0.14)', boxShadow: '0 0 14px rgba(255, 215, 0, 0.18)' },
  itemText: { flex: 1, color: chrome.itemText, fontSize: 13.5 },
  itemTextActive: { color: chrome.itemTextActive },
  footer: {
    padding: 12,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: chrome.sidebarBorder,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  footerCollapsed: { alignItems: 'center', paddingHorizontal: 6 },
  apps: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.22)',
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: motion.base,
  },
  appsCollapsed: { padding: 6, borderRadius: 10 },
  appsHover: { backgroundColor: 'rgba(255, 215, 0, 0.12)', borderColor: 'rgba(255, 215, 0, 0.45)' },
  appsIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  appsText: { flex: 1, minWidth: 0 },
  appsTitle: { color: onDark.text, fontSize: 12.5 },
  appsHint: { color: chrome.itemText, fontSize: 11 },
  profile: {
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radii.md,
    backgroundColor: chrome.card,
    borderWidth: 1,
    borderColor: chrome.cardBorder,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: motion.fast,
  },
  profileCollapsed: { padding: 6, backgroundColor: 'transparent', borderColor: 'transparent' },
  profileHover: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255, 215, 0, 0.25)' },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    backgroundImage: gradients.gold,
  },
  avatar: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff6cc',
  },
  avatarText: { color: palette.navy800, fontSize: 15 },
  profileText: { flex: 1, minWidth: 0, gap: 2 },
  profileName: { color: palette.white, fontSize: 13.5 },
  chips: { alignItems: 'center', gap: 6 },
  profileType: { flexShrink: 1, color: chrome.itemText, fontSize: 11 },
  gemChip: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 215, 0, 0.13)',
  },
  gemText: { color: palette.gold, fontSize: 10.5 },
  logout: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  logoutHover: { backgroundColor: 'rgba(214, 69, 69, 0.18)' },
  disabled: { opacity: 0.5 },
  guest: { paddingHorizontal: 6, paddingVertical: 4, gap: 2 },
  codeRow: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    cursor: 'pointer',
  },
  codeText: { flex: 1, color: chrome.itemText, fontSize: 11 },
  codeValue: { color: palette.white, fontSize: 12, letterSpacing: 0.6 },
  footerRow: { alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  footerRowCollapsed: { alignItems: 'center', gap: 4 },
  footerButton: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    cursor: 'pointer',
  },
  footerButtonText: { color: chrome.itemText, fontSize: 12.5 },
});
