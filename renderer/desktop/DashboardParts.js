import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { formatDate } from '@helpers/Common';
import { selectWalletBalance } from '@slices/walletSlice';

import { elevation, gradients, motion, onDark, palette, radii, surface } from './desktopTheme';
import { animate } from './globalStyles';
import { orderStatusMeta } from './orderStatus';
import { Card, DButton, IconTile, Pill, SectionHeader, Skeleton, formatNumber, useDir } from './ui';
import { contentGutter, contentMaxWidth } from './Breakpoints';
import { WALLPAPER } from './Wallpaper';

/**
 * Pieces shared by the home dashboards (the customer's systematic-order home
 * and the organisation home): the welcome banner, the three main actions,
 * the account at a glance, and the latest orders.
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
    service: 'ثبت سفارش خدمات',
    serviceText: 'تعمیر، نصب و پشتیبانی دستگاه‌ها؛ قدم‌به‌قدم همراهتان هستیم.',
    supply: 'تامین کالا / محصول',
    supplyText: 'قطعات، کالا و تجهیزات مورد نیازتان را سفارش دهید.',
    orders: 'سفارشات',
    ordersText: 'وضعیت سفارش‌ها، فاکتورها و پرداخت‌ها را پیگیری کنید.',
    start: 'شروع',
    view: 'مشاهده',
    openOrders: (n) => `${n} سفارش جاری`,
    quick: 'دسترسی سریع',
    quickHint: 'بقیه‌ی امکانات از ستون کناری و جستجو (Ctrl+K) هم در دسترس است',
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
    service: 'Order a service',
    serviceText: 'Repairs, installation and support for your devices, step by step.',
    supply: 'Goods / product supply',
    supplyText: 'Order the parts, goods and equipment you need.',
    orders: 'Orders',
    ordersText: 'Track your orders, invoices and payments.',
    start: 'Start',
    view: 'View',
    openOrders: (n) => `${n} open`,
    quick: 'Quick access',
    quickHint: 'Everything else is in the sidebar and in search (Ctrl+K)',
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
export function WelcomeHero({ badge, greeting, greetingIcon: greetIcon = 'sunny', title, text, actions = [] }) {
  const dir = useDir();
  return (
    <View style={[styles.hero, dir.row, animate('loop-fade-up', '360ms')]}>
      <View style={[styles.heroText, dir.start]}>
        {!!badge && <Pill label={badge} kind="gold" icon="sparkles" />}
        {!!greeting && (
          <View style={[styles.greeting, dir.row]}>
            <Ionicons name={greetIcon} size={18} color={palette.gold} />
            <Text style={[styles.greetingText, dir.bold, dir.align]}>{greeting}</Text>
          </View>
        )}
        <Text style={[styles.heroTitle, dir.bold, dir.align]}>{title}</Text>
        <Text style={[styles.heroSubtitle, dir.light, dir.align]}>{text}</Text>
        {actions.length > 0 && (
          <View style={[styles.heroActions, dir.row]}>
            {actions.map((action, i) => (
              <DButton key={action.title} {...action} variant={action.variant || (i === 0 ? 'gold' : 'glass')} />
            ))}
          </View>
        )}
      </View>
      <View style={styles.heroArt} pointerEvents="none">
        <ExpoImage source={WALLPAPER} style={styles.heroImage} contentFit="cover" contentPosition="right center" cachePolicy="memory-disk" />
        <View style={[styles.heroArtFade, { backgroundImage: dir.rtl ? FADE_RTL : FADE_LTR }]} />
      </View>
    </View>
  );
}

export { greetingIcon } from './brandCopy';

/**
 * The three things the home page is for, as three large cards: order a
 * service, goods / product supply, and the orders. Everything else stays one
 * step away (quick access row, sidebar, Ctrl+K) so it never competes with
 * them.
 *
 * @param {object} props
 * @param {() => void} props.onService
 * @param {() => void} props.onSupply
 * @param {() => void} props.onOrders
 * @param {Array} [props.orders]          for the open-orders count
 * @param {boolean} [props.serviceOpen]    the service card's panel is showing
 */
export function HomeActions({ onService, onSupply, onOrders, orders, serviceOpen }) {
  const dir = useDir();
  const copy = dashboardCopy(dir.rtl);
  const list = Array.isArray(orders) ? orders : [];
  const openCount = list.filter((o) => Number(o?.status) === 0 || Number(o?.status) === 1).length;

  const actions = [
    { key: 'service', icon: 'construct', title: copy.service, text: copy.serviceText, cta: copy.start, onPress: onService, active: serviceOpen },
    { key: 'supply', icon: 'cube', title: copy.supply, text: copy.supplyText, cta: copy.start, onPress: onSupply },
    {
      key: 'orders',
      icon: 'receipt',
      title: copy.orders,
      text: copy.ordersText,
      cta: copy.view,
      onPress: onOrders,
      badge: openCount ? copy.openOrders(formatNumber(openCount, dir.lang)) : null,
    },
  ];

  return (
    <View style={[styles.actions, dir.row]}>
      {actions.map((action, i) => (
        <Pressable
          key={action.key}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.title}
          accessibilityState={action.active != null ? { expanded: !!action.active } : undefined}
          style={({ hovered, pressed }) => [
            styles.action,
            animate('loop-fade-up', '380ms', `${120 + i * 70}ms`),
            (hovered || action.active) && styles.actionHover,
            pressed && styles.actionPressed,
          ]}
        >
          {({ hovered }) => (
            <>
              <View style={styles.actionStars} pointerEvents="none" />
              <View style={[styles.actionTop, dir.row]}>
                <View style={[styles.actionIcon, (hovered || action.active) && styles.actionIconHover]}>
                  <Ionicons name={action.icon} size={30} color={palette.gold} />
                </View>
                {!!action.badge && <Pill label={action.badge} kind="gold" size="sm" dot />}
              </View>
              <Text style={[styles.actionTitle, dir.bold, dir.align]}>{action.title}</Text>
              <Text style={[styles.actionText, dir.light, dir.align]}>{action.text}</Text>
              <View style={[styles.actionCta, dir.row, (hovered || action.active) && styles.actionCtaOn]}>
                <Text style={[styles.actionCtaText, dir.bold]}>{action.cta}</Text>
                <Ionicons
                  name={action.active ? 'chevron-up' : dir.rtl ? 'arrow-back' : 'arrow-forward'}
                  size={16}
                  color={palette.navy900}
                />
              </View>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

/** The quiet row under the main actions: everything else, one click away. */
export function QuickAccess({ children }) {
  const dir = useDir();
  const copy = dashboardCopy(dir.rtl);
  return (
    <View style={[styles.quick, animate('loop-fade-up', '380ms', '320ms')]}>
      <View style={[styles.quickHead, dir.row]}>
        <Text style={[styles.quickTitle, dir.bold, dir.align]}>{copy.quick}</Text>
        <Text style={[styles.quickHint, dir.light, dir.align]} numberOfLines={1}>{copy.quickHint}</Text>
      </View>
      <View style={[dashboardStyles.shortcuts, dir.row]}>{children}</View>
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
  greeting: { alignItems: 'center', gap: 8 },
  greetingText: { color: palette.gold, fontSize: 17, textShadow: '0 0 18px rgba(255, 215, 0, 0.3)' },
  heroTitle: { color: onDark.text, fontSize: 28, lineHeight: 42 },
  heroSubtitle: { color: onDark.soft, fontSize: 14.5, lineHeight: 26, maxWidth: 520 },
  heroActions: { gap: 10, marginTop: 8 },
  heroArt: { flex: 1, position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroArtFade: { ...StyleSheet.absoluteFillObject },

  actions: { gap: 18, alignItems: 'stretch' },
  action: {
    flex: 1,
    minWidth: 0,
    minHeight: 236,
    padding: 24,
    gap: 10,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    boxShadow: elevation.raised,
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionDuration: motion.base,
    transitionTimingFunction: motion.ease,
  },
  actionHover: { transform: 'translateY(-4px)', boxShadow: elevation.floating, borderColor: 'rgba(255, 215, 0, 0.45)' },
  actionPressed: { transform: 'scale(0.99)' },
  actionStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  actionTop: { alignItems: 'flex-start', justifyContent: 'space-between' },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    boxShadow: '0 0 30px rgba(79, 143, 224, 0.35)',
    transitionProperty: 'transform',
    transitionDuration: motion.slow,
  },
  actionIconHover: { transform: 'scale(1.06) rotate(-3deg)' },
  actionTitle: { color: onDark.text, fontSize: 21, marginTop: 8 },
  actionText: { flex: 1, color: onDark.soft, fontSize: 13.5, lineHeight: 24 },
  actionCta: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: radii.md,
    backgroundImage: gradients.gold,
    opacity: 0.88,
    transitionProperty: 'opacity, transform',
    transitionDuration: motion.base,
  },
  actionCtaOn: { opacity: 1, transform: 'translateY(-1px)' },
  actionCtaText: { color: palette.navy900, fontSize: 14 },

  quick: { gap: 12 },
  quickHead: { alignItems: 'baseline', gap: 12 },
  quickTitle: { fontSize: 15, color: surface.canvasText },
  quickHint: { flex: 1, fontSize: 12, color: surface.canvasMuted },

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
