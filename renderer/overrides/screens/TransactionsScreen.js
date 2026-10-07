/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/TransactionsScreen.js
 *
 * Every wallet transaction as a desktop page: totals for the period at the
 * top, type tabs and the date-range dialog in a toolbar, and the list as a
 * table (@desktop/TransactionTable) instead of one coloured block per row.
 *
 * Same requests as the mobile file: `getTransactions` with from_date /
 * to_date, refetched whenever the range changes, both response shapes
 * accepted via `selectTransactions`. The type tabs only filter what was
 * loaded; they send nothing extra to the server.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import CalendarPicker from '@components/calendar/CalendarPicker';
import moment from 'moment-jalaali';
import { useTranslation } from 'react-i18next';
import ScreenHeaders from '@components/ScreenHeaders';
import { showToastOrAlert } from '@helpers/Common';
import { getTransactions, selectTransactions, TRANSACTION_STATUS, TRANSACTION_TYPE } from '@services/WalletApi';

import Dialog from '@desktop/Dialog';
import TransactionTable from '@desktop/TransactionTable';
import { Card, DButton, IconTile, formatNumber, useDir } from '@desktop/ui';
import { elevation, motion, palette, radii, surface } from '@desktop/desktopTheme';
import { animate } from '@desktop/globalStyles';
import { contentGutter, contentMaxWidth } from '@desktop/Breakpoints';

const COPY = {
  fa: {
    charged: 'جمع شارژها',
    paid: 'جمع پرداخت‌ها',
    count: 'تعداد تراکنش‌ها',
    toman: 'تومان',
    all: 'همه',
    charges: 'شارژها',
    payments: 'پرداخت‌ها',
    dateRange: 'بازه‌ی تاریخ',
    anyDate: 'همه‌ی تاریخ‌ها',
    clear: 'پاک کردن فیلتر',
    refresh: 'به‌روزرسانی',
    from: 'از تاریخ',
    to: 'تا تاریخ',
    dialogHint: 'تراکنش‌هایی که در این بازه انجام شده‌اند نمایش داده می‌شوند.',
    successOnly: 'فقط تراکنش‌های موفق در جمع‌ها حساب می‌شوند',
  },
  en: {
    charged: 'Total top-ups',
    paid: 'Total payments',
    count: 'Transactions',
    toman: 'Toman',
    all: 'All',
    charges: 'Top-ups',
    payments: 'Payments',
    dateRange: 'Date range',
    anyDate: 'Any date',
    clear: 'Clear filter',
    refresh: 'Refresh',
    from: 'From',
    to: 'To',
    dialogHint: 'Shows the transactions made within this range.',
    successOnly: 'Only successful transactions count towards the totals',
  },
};

const TYPE_TABS = [
  { id: 'all', icon: 'apps-outline' },
  { id: 'charges', icon: 'arrow-down' },
  { id: 'payments', icon: 'arrow-up' },
];

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const token = useSelector((state) => state?.auth?.token);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeTab, setTypeTab] = useState('all');

  // فیلتر تاریخ
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [tempFromDate, setTempFromDate] = useState(null);
  const [tempToDate, setTempToDate] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [fromDate, toDate]);

  const fetchTransactions = async () => {
    try {
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const result = await getTransactions(token, params);

      if (result.ok) {
        setTransactions(selectTransactions(result.data));
      } else {
        showToastOrAlert(result.message || t('Error retrieving transactions'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const convertJalaliToGregorian = (jalaliDate) => {
    if (!jalaliDate) return null;
    return moment(jalaliDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
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
    setLoading(true);
  };

  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setTempFromDate(null);
    setTempToDate(null);
    setShowFilterModal(false);
    setLoading(true);
  };

  const jalali = (date) => moment(date, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
  const hasDate = !!(fromDate || toDate);
  const rangeLabel = hasDate
    ? [fromDate && `${t('from')} ${jalali(fromDate)}`, toDate && `${t('to')} ${jalali(toDate)}`].filter(Boolean).join(' ')
    : copy.anyDate;

  const isCharge = (item) => Number(item?.type) === TRANSACTION_TYPE.CHARGE;
  const succeeded = transactions.filter((item) => Number(item?.status) === TRANSACTION_STATUS.SUCCESS);
  const totalCharged = succeeded.filter(isCharge).reduce((sum, item) => sum + Number(item?.price || 0), 0);
  const totalPaid = succeeded.filter((item) => !isCharge(item)).reduce((sum, item) => sum + Number(item?.price || 0), 0);
  const visible = transactions.filter((item) =>
    typeTab === 'all' ? true : typeTab === 'charges' ? isCharge(item) : !isCharge(item)
  );

  const stats = [
    { key: 'charged', icon: 'arrow-down', kind: 'success', label: copy.charged, value: totalCharged, unit: copy.toman },
    { key: 'paid', icon: 'arrow-up', kind: 'brand', label: copy.paid, value: totalPaid, unit: copy.toman },
    { key: 'count', icon: 'swap-vertical', kind: 'violet', label: copy.count, value: transactions.length },
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t("Transactions")} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          <View style={[styles.stats, dir.row]}>
            {stats.map((stat, i) => (
              <Card key={stat.key} style={[styles.stat, animate('loop-fade-up', '340ms', `${i * 60}ms`)]}>
                <View style={[styles.statRow, dir.row]}>
                  <IconTile icon={stat.icon} kind={stat.kind} size={46} />
                  <View style={styles.flex}>
                    <Text style={[styles.statLabel, dir.light, dir.align]}>{stat.label}</Text>
                    <Text style={[styles.statValue, dir.bold, dir.align]} numberOfLines={1}>
                      {loading ? '—' : formatNumber(stat.value, dir.lang)}
                      {!!stat.unit && <Text style={[styles.statUnit, dir.light]}> {stat.unit}</Text>}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>

          <Card padded={false} style={[styles.tableCard, animate('loop-fade-up', '360ms', '120ms')]}>
            <View style={[styles.toolbar, dir.row]}>
              <View style={[styles.tabs, dir.row]} accessibilityRole="tablist">
                {TYPE_TABS.map((tab) => {
                  const active = typeTab === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setTypeTab(tab.id)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      style={({ hovered }) => [styles.tab, dir.row, hovered && !active && styles.tabHover, active && styles.tabActive]}
                    >
                      <Ionicons name={tab.icon} size={14} color={active ? palette.white : surface.muted} />
                      <Text style={[styles.tabText, active ? dir.bold : dir.light, active && styles.tabTextActive]}>{copy[tab.id]}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={[styles.toolbarEnd, dir.row]}>
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
                {hasDate && <DButton title={copy.clear} icon="close-circle-outline" variant="ghost" size="sm" onPress={clearFilter} />}
                <DButton title={copy.refresh} icon="refresh" variant="outline" size="sm" loading={refreshing} onPress={onRefresh} />
              </View>
            </View>
            <TransactionTable
              items={visible}
              loading={loading}
              skeletonRows={6}
              emptyText={t("No transactions found")}
              detailed
            />
          </Card>
          <View style={[styles.note, dir.row]}>
            <Ionicons name="information-circle-outline" size={14} color={surface.faint} />
            <Text style={[styles.noteText, dir.light]}>{copy.successOnly}</Text>
          </View>
        </View>
      </ScrollView>

      <Dialog
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title={t("Filter by Date")}
        message={copy.dialogHint}
        icon="calendar-outline"
        width={780}
        actions={
          <>
            <DButton title={t("Apply Filter")} icon="checkmark" onPress={applyFilter} />
            <DButton title={t("Clear")} icon="trash-outline" variant="danger" onPress={clearFilter} />
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
                <Text style={[styles.calendarValue, dir.light]}>{field.value ? jalali(field.value) : t('Select Date')}</Text>
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
  page: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 18 },
  flex: { flex: 1, minWidth: 0 },
  stats: { gap: 16 },
  stat: { flex: 1, minWidth: 0, paddingVertical: 18 },
  statRow: { alignItems: 'center', gap: 14 },
  statLabel: { fontSize: 12.5, color: surface.faint },
  statValue: { fontSize: 21, color: surface.title, lineHeight: 30 },
  statUnit: { fontSize: 12, color: surface.faint },
  tableCard: { overflow: 'hidden' },
  toolbar: { alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: 14 },
  tabs: { gap: 4, padding: 4, borderRadius: radii.md, backgroundColor: surface.sunken },
  tab: {
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  tabHover: { backgroundColor: surface.hover },
  tabActive: { backgroundImage: 'linear-gradient(135deg, #134379 0%, #002b54 100%)', boxShadow: elevation.brand },
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
  },
  dateButtonHover: { borderColor: surface.borderStrong, backgroundColor: surface.cardMuted },
  dateButtonActive: { borderColor: 'rgba(29, 95, 174, 0.4)', backgroundColor: 'rgba(29, 95, 174, 0.05)' },
  dateCaption: { fontSize: 10.5, color: surface.faint, lineHeight: 14 },
  dateValue: { fontSize: 12.5, color: surface.title, lineHeight: 18 },
  note: { alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  noteText: { fontSize: 11.5, color: surface.faint },
  calendars: { gap: 16 },
  calendarCol: { flex: 1, minWidth: 0, gap: 10 },
  calendarHead: { alignItems: 'center', justifyContent: 'space-between' },
  calendarLabel: { fontSize: 13.5, color: surface.title },
  calendarValue: { fontSize: 12.5, color: palette.brandBright },
  calendarBox: { borderRadius: radii.md, borderWidth: 1, borderColor: surface.border, overflow: 'hidden' },
});
