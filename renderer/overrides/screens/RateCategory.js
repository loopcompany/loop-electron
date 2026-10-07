/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/RateCategory.js
 *
 * The service price list as a desktop page: the categories down one side,
 * the selected category as a price table, and a search box that finds a
 * service across every category. On a phone it is a column of navy bars
 * that each fold open.
 *
 * Same data as the mobile file (`/info/letter-rate-categories`, each
 * category with its `letter_rates`) and the same "free visit above the
 * minimum" note, which is shown as a banner instead of behind a "?" badge.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import ScreenHeaders from '@components/ScreenHeaders';
import { formatPrice } from '@helpers/Common';
import letterRatesCategoryAPI from '@services/LetterRatesService';

import { contentGutter, contentMaxWidth } from '@desktop/Breakpoints';
import { Card, DButton, EmptyState, Skeleton, formatNumber, useDir } from '@desktop/ui';
import { elevation, gradients, motion, onDark, palette, radii, surface } from '@desktop/desktopTheme';
import { animate } from '@desktop/globalStyles';

const COPY = {
  fa: {
    title: 'نرخ‌نامه‌ی خدمات لوپ',
    lead: 'قیمت پایه‌ی خدمات بر اساس دسته‌بندی. مبلغ نهایی پس از بررسی تکنسین در پیش‌رسید اعلام می‌شود.',
    search: 'جستجوی خدمت… (مثلاً نصب ویندوز)',
    categories: 'دسته‌بندی‌ها',
    items: (n) => `${n} خدمت`,
    service: 'شرح خدمت',
    price: 'مبلغ',
    results: (n, q) => `${n} نتیجه برای «${q}»`,
    noResults: 'خدمتی با این عنوان پیدا نشد',
    noResultsHint: 'عبارت دیگری را امتحان کنید یا جستجو را پاک کنید.',
    clear: 'پاک کردن جستجو',
    empty: 'نرخ‌نامه هنوز منتشر نشده است',
    emptyHint: 'قیمت خدمات به‌زودی در این بخش قرار می‌گیرد.',
    emptyCategory: 'برای این دسته هنوز نرخی ثبت نشده است',
    refresh: 'به‌روزرسانی',
    toman: 'تومان',
  },
  en: {
    title: 'Loop service rates',
    lead: 'Base prices by category. The final amount is confirmed on the pre-receipt after the technician’s review.',
    search: 'Search a service… (e.g. Windows install)',
    categories: 'Categories',
    items: (n) => `${n} services`,
    service: 'Service',
    price: 'Price',
    results: (n, q) => `${n} results for “${q}”`,
    noResults: 'No service matches that',
    noResultsHint: 'Try another word or clear the search.',
    clear: 'Clear search',
    empty: 'The rate list isn’t published yet',
    emptyHint: 'Service prices will appear here soon.',
    emptyCategory: 'No rates in this category yet',
    refresh: 'Refresh',
    toman: 'Toman',
  },
};

export default function RateCategory() {
  const { t } = useTranslation();
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];

  const [show, setShow] = useState(null)
  const [rates, setRates] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  useEffect(() => {
    fetchLetterRates();
  }, [refreshing]);

  const fetchLetterRates = async () => {
    try {
      const response = await letterRatesCategoryAPI.getLetterRatesCategory();

      if (response.status === 'success') {
        const allRates = response.data;
        setRates(allRates);

      }
    } catch (error) {
      console.error('Error fetching letter rates:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const minPrice = useSelector(state => state.minPrice?.data)

  const categories = Array.isArray(rates) ? rates : [];
  const current = categories.find((c) => c.id === show) || categories[0];
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return [];
    return categories.flatMap((category) =>
      (category?.letter_rates || [])
        .filter((rate) => String(rate?.title || '').toLowerCase().includes(q))
        .map((rate) => ({ ...rate, category: category.title }))
    );
  }, [categories, q]);

  const amount = (value) => {
    const n = Number(String(value ?? '').replace(/[,٬]/g, ''));
    return Number.isFinite(n) && String(value ?? '').trim() !== '' ? formatNumber(n, dir.lang) : value;
  };
  const isNumeric = (value) => Number.isFinite(Number(String(value ?? '').replace(/[,٬]/g, ''))) && String(value ?? '').trim() !== '';

  const table = (rows, withCategory) => (
    <View>
      <View style={[styles.row, styles.headRow, dir.row]}>
        <Text style={[styles.head, styles.colTitle, dir.bold, dir.align]}>{copy.service}</Text>
        <Text style={[styles.head, styles.colPrice, dir.bold, { textAlign: dir.rtl ? 'left' : 'right' }]}>{copy.price}</Text>
      </View>
      {rows.map((rate, index) => (
        <View key={`${rate?.id ?? index}-${index}`} style={[styles.row, dir.row, index % 2 === 1 && styles.rowAlt]}>
          <View style={[styles.colTitle, styles.titleCell, dir.row]}>
            <View style={styles.bullet} />
            <View style={styles.flex}>
              <Text style={[styles.rateTitle, dir.bold, dir.align]}>{rate?.title}</Text>
              {withCategory && <Text style={[styles.rateCategory, dir.light, dir.align]}>{rate.category}</Text>}
            </View>
          </View>
          <View style={[styles.colPrice, dir.rtl ? styles.alignStart : styles.alignEnd]}>
            <View style={[styles.price, dir.row]}>
              <Text style={[styles.priceValue, dir.bold]}>{amount(rate?.amount)}</Text>
              {isNumeric(rate?.amount) && <Text style={[styles.priceUnit, dir.light]}>{copy.toman}</Text>}
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t('Rate List')} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          {/* Header with search */}
          <View style={[styles.hero, animate('loop-fade-up', '340ms')]}>
            <View style={styles.heroStars} pointerEvents="none" />
            <View style={[styles.heroTop, dir.row]}>
              <View style={styles.heroIcon}>
                <Ionicons name="cash-outline" size={26} color={palette.gold} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.heroTitle, dir.bold, dir.align]}>{copy.title}</Text>
                <Text style={[styles.heroLead, dir.light, dir.align]}>{copy.lead}</Text>
              </View>
              <DButton title={copy.refresh} icon="refresh" variant="glass" size="sm" loading={refreshing} onPress={() => setRefreshing(true)} />
            </View>
            <View style={[styles.search, dir.row]}>
              <Ionicons name="search" size={18} color={onDark.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={copy.search}
                placeholderTextColor={onDark.muted}
                style={[styles.searchInput, dir.light, dir.align]}
              />
              {!!query && (
                <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel={copy.clear} style={styles.searchClear}>
                  <Ionicons name="close" size={16} color={onDark.soft} />
                </Pressable>
              )}
            </View>
            {!!minPrice?.price && (
              <View style={[styles.note, dir.row]}>
                <Ionicons name="gift-outline" size={17} color={palette.gold} />
                <Text style={[styles.noteText, dir.light, dir.align]}>
                  {t("Dear Loop, the total receipt is more than {{price}} tomans, you are a guest of Loop (travel and examination expenses are covered)", { price: formatPrice(minPrice?.price) })}
                </Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={[styles.columns, dir.row]}>
              <Card style={styles.nav}>
                {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={42} radius={12} style={styles.mb8} />)}
              </Card>
              <Card style={styles.flex}>
                {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={22} style={styles.mb16} />)}
              </Card>
            </View>
          ) : categories.length === 0 ? (
            <Card>
              <EmptyState icon="cash-outline" title={copy.empty} message={copy.emptyHint} />
            </Card>
          ) : q ? (
            <Card padded={false} style={[styles.tableCard, animate('loop-fade-up', '260ms')]}>
              <View style={[styles.tableHead, dir.row]}>
                <Text style={[styles.tableTitle, dir.bold, dir.align]}>{copy.results(formatNumber(matches.length, dir.lang), query.trim())}</Text>
                <DButton title={copy.clear} icon="close-circle-outline" variant="ghost" size="sm" onPress={() => setQuery('')} />
              </View>
              {matches.length ? table(matches, true) : (
                <EmptyState compact icon="search-outline" title={copy.noResults} message={copy.noResultsHint} />
              )}
            </Card>
          ) : (
            <View style={[styles.columns, dir.row]}>
              {/* Categories */}
              <Card style={[styles.nav, animate('loop-fade-up', '320ms', '60ms')]} padded={false}>
                <Text style={[styles.navTitle, dir.bold, dir.align]}>{copy.categories}</Text>
                {categories.map((category) => {
                  const active = category.id === current?.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setShow(category.id)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      style={({ hovered }) => [styles.navItem, dir.row, hovered && !active && styles.navItemHover, active && styles.navItemActive]}
                    >
                      <View style={[styles.navIcon, active && styles.navIconActive]}>
                        <Ionicons name="pricetag" size={14} color={active ? palette.navy900 : palette.brandBright} />
                      </View>
                      <Text style={[styles.navText, active ? dir.bold : dir.light, dir.align, active && styles.navTextActive]} numberOfLines={2}>
                        {category.title}
                      </Text>
                      <Text style={[styles.navCount, dir.bold, active && styles.navCountActive]}>
                        {formatNumber(category?.letter_rates_count ?? category?.letter_rates?.length ?? 0, dir.lang)}
                      </Text>
                    </Pressable>
                  );
                })}
              </Card>

              {/* Prices of the selected category */}
              <Card padded={false} style={[styles.tableCard, styles.flex, animate('loop-fade-up', '320ms', '100ms')]} key={current?.id}>
                <View style={[styles.tableHead, dir.row]}>
                  <View style={styles.flex}>
                    <Text style={[styles.tableTitle, dir.bold, dir.align]}>{current?.title}</Text>
                    <Text style={[styles.tableSub, dir.light, dir.align]}>
                      {copy.items(formatNumber(current?.letter_rates?.length || 0, dir.lang))}
                    </Text>
                  </View>
                </View>
                {current?.letter_rates?.length ? table(current.letter_rates, false) : (
                  <EmptyState compact icon="pricetag-outline" title={copy.emptyCategory} />
                )}
              </Card>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1, minWidth: 0 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  scrollContent: { paddingHorizontal: contentGutter, paddingBottom: 32 },
  page: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 18 },

  hero: {
    padding: 24,
    gap: 16,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.floating,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  heroTop: { alignItems: 'center', gap: 16 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  heroTitle: { color: onDark.text, fontSize: 22, lineHeight: 34 },
  heroLead: { color: onDark.soft, fontSize: 13.5, lineHeight: 24 },
  search: {
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backdropFilter: 'blur(10px)',
  },
  searchInput: { flex: 1, height: 48, fontSize: 14.5, color: onDark.text, outlineStyle: 'none' },
  searchClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    cursor: 'pointer',
  },
  note: {
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.22)',
  },
  noteText: { flex: 1, color: onDark.soft, fontSize: 12.5, lineHeight: 22 },

  columns: { gap: 18, alignItems: 'flex-start' },
  nav: { width: 320, flexShrink: 0, padding: 10 },
  navTitle: { fontSize: 12, color: surface.faint, paddingHorizontal: 10, paddingTop: 6, paddingBottom: 10 },
  navItem: {
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.md,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  navItemHover: { backgroundColor: surface.cardMuted },
  navItemActive: { backgroundColor: 'rgba(29, 95, 174, 0.08)' },
  navIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(29, 95, 174, 0.08)',
  },
  navIconActive: { backgroundImage: gradients.gold },
  navText: { flex: 1, fontSize: 13.5, color: surface.muted, lineHeight: 22 },
  navTextActive: { color: surface.title },
  navCount: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 11.5,
    color: surface.faint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: surface.sunken,
    overflow: 'hidden',
  },
  navCountActive: { color: surface.brandText, backgroundColor: 'rgba(29, 95, 174, 0.12)' },

  tableCard: { overflow: 'hidden' },
  tableHead: { alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 18 },
  tableTitle: { fontSize: 17, color: surface.title },
  tableSub: { fontSize: 12, color: surface.faint, marginTop: 2 },
  row: {
    alignItems: 'center',
    gap: 16,
    minHeight: 58,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: surface.border,
  },
  rowAlt: { backgroundColor: surface.hover },
  headRow: { minHeight: 40, backgroundColor: surface.cardMuted },
  head: { fontSize: 11.5, color: surface.faint },
  colTitle: { flex: 1, minWidth: 0 },
  colPrice: { width: 220, flexShrink: 0 },
  titleCell: { alignItems: 'center', gap: 12 },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundImage: gradients.gold },
  rateTitle: { fontSize: 14, color: surface.title, lineHeight: 23 },
  rateCategory: { fontSize: 11.5, color: palette.brandBright, marginTop: 2 },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  price: {
    alignItems: 'baseline',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: 'rgba(0, 43, 84, 0.05)',
  },
  priceValue: { fontSize: 15, color: surface.brandText },
  priceUnit: { fontSize: 11, color: surface.faint },
});
