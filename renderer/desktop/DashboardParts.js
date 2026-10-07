import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { formatDate } from '@helpers/Common';
import { selectWalletBalance } from '@slices/walletSlice';

import { elevation, gradients, motion, onDark, radii, surface } from './desktopTheme';
import { animate } from './globalStyles';
import { orderStatusMeta } from './orderStatus';
import { Card, DButton, IconTile, Pill, SectionHeader, Skeleton, formatNumber, useDir } from './ui';
import { contentGutter, contentMaxWidth } from './Breakpoints';

/**
 * Pieces shared by the home dashboards (the customer's systematic-order home
 * and the organisation home): the welcome banner, the account at a glance,
 * and the latest orders.
 */

const COPY = {
  fa: {
    hello: (name) => (name ? `سلام ${name}، خوش آمدید` : 'به لوپ خوش آمدید'),
    wallet: 'موجودی کیف پول',
    active: 'سفارش‌های جاری',
    done: 'سفارش‌های انجام‌شده',
    points: 'امتیاز باشگاه',
    toman: 'تومان',
    recent: 'آخرین سفارش‌ها',
    recentHint: 'وضعیت سفارش‌های اخیر شما',
    seeAll: 'همه',
    noOrders: 'هنوز سفارشی ثبت نکرده‌اید',
    noOrdersHint: 'اولین سفارش را از همین صفحه شروع کنید.',
    urgent: 'فوری',
  },
  en: {
    hello: (name) => (name ? `Welcome back, ${name}` : 'Welcome to Loop'),
    wallet: 'Wallet balance',
    active: 'Open orders',
    done: 'Completed orders',
    points: 'Club points',
    toman: 'Toman',
    recent: 'Latest orders',
    recentHint: 'Where your recent orders stand',
    seeAll: 'All',
    noOrders: 'No orders yet',
    noOrdersHint: 'Start your first one right here.',
    urgent: 'Urgent',
  },
};

export const dashboardCopy = (rtl) => COPY[rtl ? 'fa' : 'en'];

/** Name to greet: an organisation by its name, a person by their first name. */
export function greetingName(user) {
  if (user?.organization_name) return user.organization_name;
  return (user?.fname || user?.first_name || user?.name || '').split(' ')[0];
}

const FADE_RTL = 'linear-gradient(270deg, rgba(10, 31, 59, 1) 0%, rgba(10, 31, 59, 0.35) 45%, rgba(10, 31, 59, 0) 100%)';
const FADE_LTR = 'linear-gradient(90deg, rgba(10, 31, 59, 1) 0%, rgba(10, 31, 59, 0.35) 45%, rgba(10, 31, 59, 0) 100%)';

/**
 * @param {object} props
 * @param {string} props.badge
 * @param {string} props.title
 * @param {string} props.text
 * @param {Array<{title: string, icon: string, variant?: string, onPress: () => void}>} props.actions
 */
export function WelcomeHero({ badge, title, text, actions = [] }) {
  const dir = useDir();
  return (
    <View style={[styles.hero, dir.row, animate('loop-fade-up', '360ms')]}>
      <View style={[styles.heroText, dir.start]}>
        {!!badge && <Pill label={badge} kind="gold" icon="sparkles" />}
        <Text style={[styles.heroTitle, dir.bold, dir.align]}>{title}</Text>
        <Text style={[styles.heroSubtitle, dir.light, dir.align]}>{text}</Text>
        <View style={[styles.heroActions, dir.row]}>
          {actions.map((action, i) => (
            <DButton key={action.title} {...action} variant={action.variant || (i === 0 ? 'gold' : 'glass')} />
          ))}
        </View>
      </View>
      <View style={styles.heroArt} pointerEvents="none">
        <ExpoImage source={require('@assets/loopbackground.webp')} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" />
        <View style={[styles.heroArtFade, { backgroundImage: dir.rtl ? FADE_RTL : FADE_LTR }]} />
        <Image source={require('@assets/logo.png')} style={styles.heroLogo} resizeMode="contain" />
      </View>
    </View>
  );
}

/** Wallet, open orders, completed orders and club points. */
export function AccountStats({ navigation, orders }) {
  const dir = useDir();
  const copy = dashboardCopy(dir.rtl);
  const user = useSelector((state) => state?.user?.data);
  const walletBalance = useSelector(selectWalletBalance);
  const list = Array.isArray(orders) ? orders : [];
  const activeCount = list.filter((o) => Number(o?.status) === 0 || Number(o?.status) === 1).length;
  const doneCount = list.filter((o) => Number(o?.status) === 2).length;

  const stats = [
    { key: 'wallet', icon: 'wallet', kind: 'gold', label: `${copy.wallet} (${copy.toman})`, value: walletBalance, route: 'Wallet' },
    { key: 'active', icon: 'flash', kind: 'info', label: copy.active, value: activeCount, route: 'OrdersScreen' },
    { key: 'done', icon: 'checkmark-done', kind: 'success', label: copy.done, value: doneCount, route: 'OrdersScreen' },
    { key: 'points', icon: 'diamond', kind: 'violet', label: copy.points, value: user?.user_gems ?? 0, route: 'UserDiscounts' },
  ];

  return (
    <View style={[styles.stats, dir.row]}>
      {stats.map((stat, i) => (
        <Card
          key={stat.key}
          onPress={() => navigation.navigate(stat.route)}
          accessibilityLabel={stat.label}
          style={[styles.stat, animate('loop-fade-up', '360ms', `${60 + i * 50}ms`)]}
        >
          <View style={[styles.statRow, dir.row]}>
            <IconTile icon={stat.icon} kind={stat.kind} size={46} />
            <View style={styles.flex}>
              <Text style={[styles.statLabel, dir.light, dir.align]} numberOfLines={1}>{stat.label}</Text>
              <Text style={[styles.statValue, dir.bold, dir.align]} numberOfLines={1}>
                {formatNumber(stat.value, dir.lang)}
                {!!stat.unit && <Text style={[styles.statUnit, dir.light]}> {stat.unit}</Text>}
              </Text>
            </View>
            <Ionicons name={dir.forward} size={16} color={surface.faint} />
          </View>
        </Card>
      ))}
    </View>
  );
}

export function RecentOrdersCard({ navigation, orders, loading, limit = 5 }) {
  const dir = useDir();
  const { t } = useTranslation();
  const copy = dashboardCopy(dir.rtl);
  const list = (Array.isArray(orders) ? orders : []).slice(0, limit);

  return (
    <Card padded={false} style={styles.recentCard}>
      <View style={styles.recentHeader}>
        <SectionHeader
          title={copy.recent}
          subtitle={copy.recentHint}
          icon="time-outline"
          style={styles.noMargin}
          action={
            <DButton title={copy.seeAll} iconAfter={dir.forward} variant="soft" size="sm" onPress={() => navigation.navigate('OrdersScreen')} />
          }
        />
      </View>
      {loading && !list.length ? (
        <View style={styles.recentSkeletons}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.recentRow, dir.row]}>
              <Skeleton width={40} height={40} radius={12} />
              <View style={styles.flex}>
                <Skeleton width="70%" height={12} />
                <Skeleton width="40%" height={10} style={styles.mt6} />
              </View>
            </View>
          ))}
        </View>
      ) : list.length ? (
        list.map((order) => {
          const meta = orderStatusMeta(order, t);
          const when = order?.is_urgent > 0
            ? copy.urgent
            : [formatDate(order?.date), order?.time?.split(':')?.slice(0, 2)?.join(':')].filter(Boolean).join(' · ');
          return (
            <Pressable
              key={order.id}
              onPress={() => navigation.navigate('Details', { orderId: order?.id })}
              accessibilityRole="link"
              style={({ hovered }) => [styles.recentRow, dir.row, hovered && styles.recentRowHover]}
            >
              <IconTile icon={meta.icon} kind={meta.kind} size={40} />
              <View style={styles.flex}>
                <View style={[styles.recentTop, dir.row]}>
                  <Text style={[styles.recentTitle, dir.bold, dir.align]} numberOfLines={1}>
                    {order?.category?.title || t('Order')}
                  </Text>
                  <Text style={[styles.recentId, dir.light]}>#{formatNumber(order?.id, dir.lang).replace(/[,٬]/g, '')}</Text>
                </View>
                <View style={[styles.recentBottom, dir.row]}>
                  <Pill label={meta.label} kind={meta.kind} size="sm" dot />
                  <Text style={[styles.recentWhen, dir.light]} numberOfLines={1}>{when}</Text>
                </View>
              </View>
            </Pressable>
          );
        })
      ) : (
        <View style={styles.noOrders}>
          <IconTile icon="receipt-outline" kind="brand" size={52} />
          <Text style={[styles.noOrdersTitle, dir.bold]}>{copy.noOrders}</Text>
          <Text style={[styles.noOrdersText, dir.light]}>{copy.noOrdersHint}</Text>
        </View>
      )}
    </Card>
  );
}

export function Shortcut({ icon, title, hint, onPress }) {
  const dir = useDir();
  return (
    <Card onPress={onPress} style={styles.shortcut} accessibilityLabel={title}>
      <IconTile icon={icon} kind="brand" size={38} />
      <Text style={[styles.shortcutTitle, dir.bold, dir.align]} numberOfLines={1}>{title}</Text>
      <Text style={[styles.shortcutHint, dir.light, dir.align]} numberOfLines={2}>{hint}</Text>
    </Card>
  );
}

export const dashboardStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: contentGutter, paddingBottom: 32 },
  page: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 20 },
  columns: { gap: 20, alignItems: 'flex-start' },
  mainColumn: { flex: 1, minWidth: 0, padding: 24 },
  sideColumn: { width: 380, flexShrink: 0, gap: 16 },
  shortcuts: { gap: 16 },
});

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  mt6: { marginTop: 6 },
  noMargin: { marginBottom: 0 },

  hero: {
    minHeight: 220,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.floating,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroText: { flex: 1.15, padding: 32, gap: 12, justifyContent: 'center', zIndex: 1 },
  heroTitle: { color: onDark.text, fontSize: 28, lineHeight: 42 },
  heroSubtitle: { color: onDark.soft, fontSize: 14.5, lineHeight: 26, maxWidth: 520 },
  heroActions: { gap: 10, marginTop: 8 },
  heroArt: { flex: 1, position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  // the artwork's own watermark sits in its bottom corner: scale it out of view
  // (react-native-web clamps an image wider than its parent, so no offsets)
  heroImage: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 1.45 }], transformOrigin: '50% 30%', opacity: 0.95 },
  heroArtFade: { ...StyleSheet.absoluteFillObject },
  heroLogo: { width: 210, height: 90, opacity: 0.95, filter: 'drop-shadow(0 6px 22px rgba(0,0,0,0.45))' },

  stats: { gap: 16 },
  stat: { flex: 1, minWidth: 0, paddingVertical: 18 },
  statRow: { alignItems: 'center', gap: 14 },
  statLabel: { fontSize: 12.5, color: surface.faint },
  statValue: { fontSize: 21, color: surface.title, lineHeight: 30 },
  statUnit: { fontSize: 12, color: surface.faint },

  recentCard: { overflow: 'hidden' },
  recentHeader: { padding: 20, paddingBottom: 12 },
  recentSkeletons: { paddingBottom: 12 },
  recentRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: surface.border,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  recentRowHover: { backgroundColor: surface.cardMuted },
  recentTop: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  recentTitle: { flex: 1, fontSize: 13.5, color: surface.title },
  recentId: { fontSize: 11.5, color: surface.faint },
  recentBottom: { alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  recentWhen: { fontSize: 11.5, color: surface.faint, flexShrink: 1 },
  noOrders: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, gap: 8, borderTopWidth: 1, borderTopColor: surface.border },
  noOrdersTitle: { fontSize: 14, color: surface.title, marginTop: 6 },
  noOrdersText: { fontSize: 12.5, color: surface.faint, textAlign: 'center' },

  shortcut: { flex: 1, minWidth: 0, gap: 8, padding: 18 },
  shortcutTitle: { fontSize: 14, color: surface.title, marginTop: 4 },
  shortcutHint: { fontSize: 12, color: surface.faint, lineHeight: 19 },
});
