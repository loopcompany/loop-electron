/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/orders/CanceledOrdersScreen.js
 *
 * Cancelled orders (status 3–6) in the same card grid as the orders page.
 * Same data as the mobile file: `fetchOrders()` on mount and on focus,
 * filtered locally to the cancelled orders (`onlyCancelledOrders`).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import ScreenHeaders from '@components/ScreenHeaders';
import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchOrders } from '@slices/ordersSlice';
import { useFocusEffect } from '@react-navigation/native';
import OrderItem from '@components/OrderItem';
import { onlyCancelledOrders } from '@services/orderStatus';

import { DButton, EmptyState, IconTile, formatNumber, useDir } from '@desktop/ui';
import { elevation, radii, surface } from '@desktop/desktopTheme';
import { contentGutter, contentMaxWidth } from '@desktop/Breakpoints';

const COPY = {
  fa: {
    intro: 'سفارش‌هایی که توسط شما، تکنسین یا لوپ لغو شده‌اند یا زمانشان گذشته است.',
    count: (n) => `${n} سفارش لغوشده`,
    empty: 'سفارش لغوشده‌ای ندارید',
    emptyHint: 'خوشبختانه هیچ‌کدام از سفارش‌های شما لغو نشده است.',
    refresh: 'به‌روزرسانی',
  },
  en: {
    intro: 'Orders cancelled by you, the technician or Loop, or that expired.',
    count: (n) => `${n} cancelled orders`,
    empty: 'No cancelled orders',
    emptyHint: 'None of your orders has been cancelled.',
    refresh: 'Refresh',
  },
};

function CanceledOrdersScreen({ navigation }) {
  const { t } = useTranslation();
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const dispatch = useDispatch();
  const orders = useSelector(state => state.orders?.data);
  const user = useSelector(state => state.user?.data);
  const { width } = useWindowDimensions();
  const columns = width >= 1640 ? 3 : 2;

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchOrders());
    }, [dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchOrders());
    setRefreshing(false);
  };

  const canceled = onlyCancelledOrders(orders);
  const cellWidth = `calc(${100 / columns}% - ${(16 * (columns - 1)) / columns}px)`;

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t('Canceled Orders')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          <View style={[styles.banner, dir.row]}>
            <IconTile icon="close-circle-outline" kind="danger" size={44} />
            <View style={styles.flex}>
              <Text style={[styles.bannerTitle, dir.bold, dir.align]}>{copy.count(formatNumber(canceled.length, dir.lang))}</Text>
              <Text style={[styles.bannerText, dir.light, dir.align]}>{copy.intro}</Text>
            </View>
            <DButton title={copy.refresh} icon="refresh" variant="outline" size="sm" loading={refreshing} onPress={onRefresh} />
          </View>

          {canceled.length === 0 ? (
            <View style={styles.emptyCard}>
              <EmptyState icon="happy-outline" title={copy.empty} message={copy.emptyHint} />
            </View>
          ) : (
            <View style={[styles.grid, dir.row]}>
              {canceled.map((item) => (
                <View key={String(item.id)} style={[styles.cell, { width: cellWidth }]}>
                  <OrderItem user={user} item={item} navigation={navigation} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: contentGutter, paddingBottom: 32 },
  page: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  banner: {
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.raised,
  },
  bannerTitle: { fontSize: 15, color: surface.title },
  bannerText: { fontSize: 12.5, color: surface.faint, marginTop: 2 },
  grid: { flexWrap: 'wrap', gap: 16, alignItems: 'stretch' },
  cell: { display: 'flex' },
  emptyCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.card,
  },
});

export default CanceledOrdersScreen;
