/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/orders/OrdersScreen.js
 *
 * The orders list as a desktop page: status tabs across the top (instead of
 * a status picker hidden in a bottom sheet), a date-range dialog with both
 * calendars side by side, and the orders as a grid of cards
 * (@overrides/components/OrderItem).
 *
 * Same data and requests as the mobile file: `fetchOrders` with
 * from_date / to_date / status, refetch on focus, drafts above the list, the
 * filter hidden for `apple_check` accounts, and "back" resetting to home.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, BackHandler, useWindowDimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CalendarPicker from '@components/calendar/CalendarPicker';
import moment from 'moment-jalaali';
import { useTranslation } from 'react-i18next';

import ScreenHeaders from '@components/ScreenHeaders';
import { fetchOrders } from '@slices/ordersSlice';
import OrderItem from '@components/OrderItem';
import OrderDraftsSection from '@components/OrderDraftsSection';
import { useHomeRoute } from '@navigation/homeRoute';

import Dialog from '@desktop/Dialog';
import { DButton, EmptyState, Skeleton, formatNumber, useDir } from '@desktop/ui';
import { elevation, motion, palette, radii, surface } from '@desktop/desktopTheme';
import { ORDER_STATUS_TABS } from '@desktop/orderStatus';
import { contentGutter, contentMaxWidth } from '@desktop/Breakpoints';

const COPY = {
  fa: {
    dateRange: 'بازه‌ی تاریخ',
    anyDate: 'همه‌ی تاریخ‌ها',
    count: (n) => `${n} سفارش`,
    refresh: 'به‌روزرسانی',
    emptyTitle: 'سفارشی پیدا نشد',
    emptyFiltered: 'با این فیلترها سفارشی وجود ندارد. فیلترها را تغییر دهید یا پاک کنید.',
    emptyAll: 'هنوز سفارشی ثبت نکرده‌اید. از داشبورد یک دستگاه را انتخاب کنید و اولین سفارش را ثبت کنید.',
    newOrder: 'ثبت سفارش جدید',
    clear: 'پاک کردن فیلترها',
    from: 'از تاریخ',
    to: 'تا تاریخ',
    dialogHint: 'سفارش‌هایی که در این بازه ثبت شده‌اند نمایش داده می‌شوند.',
  },
  en: {
    dateRange: 'Date range',
    anyDate: 'Any date',
    count: (n) => `${n} orders`,
    refresh: 'Refresh',
    emptyTitle: 'No orders found',
    emptyFiltered: 'No orders match these filters. Change or clear them.',
    emptyAll: "You haven't placed an order yet. Pick a device on the dashboard to place your first one.",
    newOrder: 'New order',
    clear: 'Clear filters',
    from: 'From',
    to: 'To',
    dialogHint: 'Shows the orders placed within this range.',
  },
};

function OrdersScreen({ navigation }) {
  const homeRoute = useHomeRoute();
  const { t } = useTranslation();
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const dispatch = useDispatch();
  const orders = useSelector(state => state.orders?.data);
  const orderLoader = useSelector(state => state.orders?.loading);
  const user = useSelector(state => state.user?.data);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const columns = width >= 1640 ? 3 : 2;

  // فیلتر تاریخ و وضعیت
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [status, setStatus] = useState(null);
  const [tempFromDate, setTempFromDate] = useState(null);
  const [tempToDate, setTempToDate] = useState(null);

  useEffect(() => {
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (status !== null) params.status = status;

    dispatch(fetchOrders(params));
  }, [dispatch, fromDate, toDate, status]);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchOrders());
    }, [dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (status !== null) params.status = status;

    await dispatch(fetchOrders(params));
    setRefreshing(false);
  };

  // تبدیل تاریخ جلالی به میلادی (Y-m-d)
  const convertJalaliToGregorian = (jalaliDate) => {
    if (!jalaliDate) return null;
    const gregorian = moment(jalaliDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
    return gregorian;
  };

  const openFilterModal = () => {
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setShowFilterModal(true);
  };

  const applyFilter = () => {
    setFromDate(tempFromDate);
    setToDate(tempToDate);
    setShowFilterModal(false);
  };

  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setStatus(null);
    setTempFromDate(null);
    setTempToDate(null);
    setShowFilterModal(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: homeRoute }],
        });
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [homeRoute])
  );

  const jalali = (date) => moment(date, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
  const hasDate = !!(fromDate || toDate);
  const hasFilter = hasDate || status !== null;
  const rangeLabel = hasDate
    ? [fromDate && `${t('From:')} ${jalali(fromDate)}`, toDate && `${t('To:')} ${jalali(toDate)}`].filter(Boolean).join('  ')
    : copy.anyDate;
  const list = Array.isArray(orders) ? orders : [];
  const showSkeleton = orderLoader && !refreshing && list.length === 0;
  const cellWidth = `calc(${100 / columns}% - ${(16 * (columns - 1)) / columns}px)`;

  return (
    <View style={styles.screen}>
      <ScreenHeaders
        title={t('Transactions/Orders')}
        onBackPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: homeRoute }],
          });
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          {/* Toolbar */}
          <View style={[styles.toolbar, dir.row]}>
            <View style={[styles.tabs, dir.row]} accessibilityRole="tablist">
              {ORDER_STATUS_TABS.map((tab) => {
                const active = status === tab.value;
                return (
                  <Pressable
                    key={String(tab.value)}
                    onPress={() => setStatus(tab.value)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={({ hovered }) => [styles.tab, dir.row, hovered && !active && styles.tabHover, active && styles.tabActive]}
                  >
                    <Ionicons name={tab.icon} size={15} color={active ? palette.white : surface.muted} />
                    <Text style={[styles.tabText, active ? dir.bold : dir.light, active && styles.tabTextActive]}>
                      {t(tab.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.toolbarEnd, dir.row]}>
              {user?.apple_check != 1 && (
                <Pressable
                  onPress={openFilterModal}
                  accessibilityRole="button"
                  style={({ hovered }) => [styles.dateButton, dir.row, hovered && styles.dateButtonHover, hasDate && styles.dateButtonActive]}
                >
                  <Ionicons name="calendar-outline" size={16} color={hasDate ? palette.brandBright : surface.muted} />
                  <View>
                    <Text style={[styles.dateCaption, dir.light, dir.align]}>{copy.dateRange}</Text>
                    <Text style={[styles.dateValue, dir.bold, dir.align]} numberOfLines={1}>{rangeLabel}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={14} color={surface.faint} />
                </Pressable>
              )}
              {hasFilter && (
                <DButton title={copy.clear} icon="close-circle-outline" variant="ghost" size="sm" onPress={clearFilter} />
              )}
              <DButton
                title={copy.refresh}
                icon="refresh"
                variant="outline"
                size="sm"
                loading={refreshing}
                onPress={onRefresh}
              />
            </View>
          </View>

          {/* Drafts of unfinished organisation orders */}
          <OrderDraftsSection navigation={navigation} />

          <Text style={[styles.count, dir.light, dir.align]}>
            {showSkeleton ? ' ' : copy.count(formatNumber(list.length, dir.lang))}
          </Text>

          {showSkeleton ? (
            <View style={[styles.grid, dir.row]}>
              {Array.from({ length: columns * 2 }, (_, i) => (
                <View key={i} style={[styles.cell, { width: cellWidth }]}>
                  <View style={styles.skeletonCard}>
                    <View style={[styles.skeletonHead, dir.row]}>
                      <Skeleton width={44} height={44} radius={14} />
                      <View style={styles.flex}>
                        <Skeleton width="55%" height={14} />
                        <Skeleton width="30%" height={10} style={styles.mt8} />
                      </View>
                    </View>
                    <Skeleton height={64} radius={14} />
                    <Skeleton width="40%" height={30} radius={10} />
                  </View>
                </View>
              ))}
            </View>
          ) : list.length === 0 ? (
            <View style={styles.emptyCard}>
              <EmptyState
                icon="receipt-outline"
                title={copy.emptyTitle}
                message={hasFilter ? copy.emptyFiltered : copy.emptyAll}
                action={
                  hasFilter ? (
                    <DButton title={copy.clear} icon="close-circle-outline" variant="outline" onPress={clearFilter} style={styles.mt8} />
                  ) : (
                    <DButton
                      title={copy.newOrder}
                      icon="add"
                      variant="gold"
                      style={styles.mt8}
                      onPress={() => navigation.reset({ index: 0, routes: [{ name: homeRoute }] })}
                    />
                  )
                }
              />
            </View>
          ) : (
            <View style={[styles.grid, dir.row]}>
              {list.map((item) => (
                <View key={item.id.toString()} style={[styles.cell, { width: cellWidth }]}>
                  <OrderItem user={user} item={item} navigation={navigation} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date range */}
      <Dialog
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title={t('Filter Orders')}
        message={copy.dialogHint}
        icon="calendar-outline"
        width={780}
        actions={
          <>
            <DButton title={t('Apply Filter')} icon="checkmark" onPress={applyFilter} />
            <DButton title={t('Clear')} icon="trash-outline" variant="danger" onPress={clearFilter} />
          </>
        }
      >
        <View style={[styles.calendars, dir.row]}>
          {[
            { label: copy.from, value: tempFromDate, set: setTempFromDate },
            { label: copy.to, value: tempToDate, set: setTempToDate },
          ].map((field) => (
            <View key={field.label} style={styles.calendarCol}>
              <View style={[styles.calendarHead, dir.row]}>
                <Text style={[styles.calendarLabel, dir.bold]}>{field.label}</Text>
                <Text style={[styles.calendarValue, dir.light]}>
                  {field.value ? jalali(field.value) : t('Select Date')}
                </Text>
              </View>
              <View style={styles.calendarBox}>
                <CalendarPicker
                  calendar="jalaali"
                  value={field.value ? jalali(field.value) : ''}
                  onSelect={(date) => field.set(convertJalaliToGregorian(date))}
                />
              </View>
            </View>
          ))}
        </View>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: contentGutter, paddingBottom: 32 },
  page: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  mt8: { marginTop: 8 },

  toolbar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    padding: 10,
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.raised,
  },
  tabs: {
    gap: 4,
    padding: 4,
    borderRadius: radii.md,
    backgroundColor: surface.sunken,
  },
  tab: {
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    cursor: 'pointer',
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: motion.fast,
  },
  tabHover: { backgroundColor: surface.hover },
  tabActive: {
    backgroundImage: 'linear-gradient(135deg, #134379 0%, #002b54 100%)',
    boxShadow: '0 4px 12px rgba(0, 43, 84, 0.25)',
  },
  tabText: { fontSize: 13, color: surface.muted },
  tabTextActive: { color: palette.white },
  toolbarEnd: { alignItems: 'center', gap: 8 },
  dateButton: {
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.border,
    backgroundColor: surface.card,
    minWidth: 200,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: motion.fast,
  },
  dateButtonHover: { borderColor: surface.borderStrong, backgroundColor: surface.cardMuted },
  dateButtonActive: { borderColor: 'rgba(29, 95, 174, 0.4)', backgroundColor: 'rgba(29, 95, 174, 0.05)' },
  dateCaption: { fontSize: 10.5, color: surface.faint, lineHeight: 14 },
  dateValue: { fontSize: 12.5, color: surface.title, lineHeight: 18 },
  count: { fontSize: 12.5, color: surface.faint, paddingHorizontal: 4 },

  grid: { flexWrap: 'wrap', gap: 16, alignItems: 'stretch' },
  cell: { display: 'flex' },
  skeletonCard: {
    flex: 1,
    gap: 14,
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
  },
  skeletonHead: { alignItems: 'center', gap: 12 },
  emptyCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.card,
  },

  calendars: { gap: 16 },
  calendarCol: { flex: 1, minWidth: 0, gap: 10 },
  calendarHead: { alignItems: 'center', justifyContent: 'space-between' },
  calendarLabel: { fontSize: 13.5, color: surface.title },
  calendarValue: { fontSize: 12.5, color: palette.brandBright },
  calendarBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.border,
    overflow: 'hidden',
  },
});

export default OrdersScreen;
