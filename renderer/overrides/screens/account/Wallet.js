/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/account/Wallet.js
 *
 * The wallet home as a desktop page: the balance as a bank-card style panel
 * beside the quick top-up amounts, and the latest transactions as a table
 * (@desktop/TransactionTable) underneath.
 *
 * Same data flow as the mobile file: balance from `/wallet/balance` seeded
 * from the profile snapshot until it answers, the latest RECENT_COUNT
 * transactions, refreshed on focus, the same quick amounts handed to
 * `Increase`, and the same `latest` ref that keeps `t` out of the focus
 * effect's dependencies (see the mobile file for why that matters).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import ScreenHeaders from '@components/ScreenHeaders';
import { showToastOrAlert } from '@helpers/Common';
import { getTransactions, selectTransactions } from '@services/WalletApi';
import { fetchWalletBalance, seedBalance, selectWalletBalance } from '@slices/walletSlice';

import TransactionTable from '@desktop/TransactionTable';
import { Card, DButton, SectionHeader, Skeleton, formatNumber, useDir } from '@desktop/ui';
import { elevation, gradients, motion, onDark, palette, radii, surface } from '@desktop/desktopTheme';
import { animate, loop } from '@desktop/globalStyles';
import { contentGutter, contentMaxWidth } from '@desktop/Breakpoints';

/** چند تراکنش آخر روی این صفحه؛ بقیه در صفحه‌ی تراکنش‌ها. */
const RECENT_COUNT = 5;

/** مبالغ آماده‌ی شارژ (تومان) — همه در بازه‌ی ۱۰٬۰۰۰ تا ۵۰٬۰۰۰٬۰۰۰ تومانِ سرور. */
const QUICK_AMOUNTS = [500000, 1000000, 2000000, 5000000];

const COPY = {
  fa: {
    cardTitle: 'کیف پول لوپ',
    balance: 'موجودی قابل استفاده',
    quickHint: 'یک مبلغ را انتخاب کنید تا به صفحه‌ی پرداخت بروید',
    custom: 'مبلغ دلخواه',
    customHint: 'هر مبلغی بین ۱۰ هزار تا ۵۰ میلیون تومان',
    recentHint: 'آخرین شارژها و پرداخت‌های شما',
    secure: 'پرداخت امن از طریق درگاه بانکی',
    member: 'دارنده‌ی حساب',
  },
  en: {
    cardTitle: 'Loop Wallet',
    balance: 'Available balance',
    quickHint: 'Pick an amount to go to the payment page',
    custom: 'Custom amount',
    customHint: 'Anything from 10 thousand to 50 million Toman',
    recentHint: 'Your latest top-ups and payments',
    secure: 'Secure payment via bank gateway',
    member: 'Account holder',
  },
};

export default function Wallet({ navigation }) {
  const { t } = useTranslation();
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const dispatch = useDispatch();

  const token = useSelector((state) => state?.auth?.token);
  const user = useSelector((state) => state?.user?.data);
  const balance = useSelector(selectWalletBalance);
  const balanceLoading = useSelector((state) => state.wallet?.loading);

  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hidden, setHidden] = useState(false);

  const latest = useRef({ t, wallet: user?.wallet });
  latest.current = { t, wallet: user?.wallet };

  const refresh = useCallback(async () => {
    if (!token) return;

    dispatch(seedBalance(latest.current.wallet));

    const [, transactionsResult] = await Promise.all([
      dispatch(fetchWalletBalance(token)),
      getTransactions(token, { per_page: RECENT_COUNT }),
    ]);

    if (transactionsResult.ok) {
      setRecent(selectTransactions(transactionsResult.data).slice(0, RECENT_COUNT));
    } else {
      showToastOrAlert(
        transactionsResult.message || latest.current.t('Error retrieving transactions')
      );
    }

    setLoadingRecent(false);
  }, [dispatch, token]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const holder = user?.organization_name || user?.name || '';

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t('Loop Wallet')} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.page}>
          <View style={[styles.top, dir.row]}>
            {/* Balance, as a card */}
            <View style={[styles.balanceCard, animate('loop-fade-up', '360ms')]}>
              <View style={styles.cardStars} pointerEvents="none" />
              <View style={styles.cardOrb} pointerEvents="none" />
              <View style={[styles.cardTop, dir.row]}>
                <View style={[styles.cardBrand, dir.row]}>
                  <Image source={require('@assets/images/start.png')} style={styles.cardLogo} />
                  <Text style={[styles.cardTitle, dir.bold]}>{copy.cardTitle}</Text>
                </View>
                <View style={[styles.cardTopActions, dir.row]}>
                  <Pressable
                    onPress={onRefresh}
                    accessibilityRole="button"
                    style={({ hovered }) => [styles.cardIcon, hovered && styles.cardIconHover]}
                  >
                    <Ionicons name="refresh" size={17} color={onDark.soft} style={refreshing ? spin : undefined} />
                  </Pressable>
                  <Pressable
                    onPress={() => setHidden((v) => !v)}
                    accessibilityRole="button"
                    style={({ hovered }) => [styles.cardIcon, hovered && styles.cardIconHover]}
                  >
                    <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={18} color={onDark.soft} />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.chipRow, dir.row]}>
                <View style={styles.chip}>
                  <View style={styles.chipLine} />
                  <View style={[styles.chipLine, styles.chipLine2]} />
                </View>
                <Ionicons name="wifi" size={20} color={onDark.muted} style={styles.contactless} />
              </View>

              <View style={dir.start}>
                <Text style={[styles.balanceLabel, dir.light, dir.align]}>{copy.balance}</Text>
                {balanceLoading && balance === 0 ? (
                  <Skeleton width={220} height={38} radius={10} style={styles.balanceSkeleton} />
                ) : (
                  <View style={[styles.balanceRow, dir.row]}>
                    <Text style={[styles.balanceValue, dir.bold]} numberOfLines={1}>
                      {hidden ? '••••••••' : formatNumber(balance, dir.lang)}
                    </Text>
                    <Text style={[styles.balanceUnit, dir.light]}>{t('Tomans')}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.cardBottom, dir.row]}>
                <View style={dir.start}>
                  <Text style={[styles.holderLabel, dir.light]}>{copy.member}</Text>
                  <Text style={[styles.holder, dir.bold]} numberOfLines={1}>{holder || '—'}</Text>
                </View>
                {!!user?.code && <Text style={[styles.code, dir.bold]}>{user.code}</Text>}
              </View>

              <View style={[styles.cardActions, dir.row]}>
                <DButton title={t('Wallet recharge')} icon="add-circle" variant="gold" onPress={() => navigation.navigate('Increase')} />
                <DButton title={t('Transactions')} icon="receipt-outline" variant="glass" onPress={() => navigation.navigate('TransactionsScreen')} />
              </View>
            </View>

            {/* Quick top-up */}
            <Card style={[styles.quickCard, animate('loop-fade-up', '360ms', '80ms')]}>
              <SectionHeader title={t('Quick recharge')} subtitle={copy.quickHint} icon="flash-outline" />
              <View style={[styles.quickGrid, dir.row]}>
                {QUICK_AMOUNTS.map((amount, i) => (
                  <Pressable
                    key={amount}
                    onPress={() => navigation.navigate('Increase', { amount })}
                    accessibilityRole="button"
                    style={({ hovered, pressed }) => [
                      styles.quick,
                      animate('loop-fade-up', '300ms', `${140 + i * 50}ms`),
                      hovered && styles.quickHover,
                      pressed && styles.quickPressed,
                    ]}
                  >
                    {({ hovered }) => (
                      <>
                        <View style={[styles.quickPlus, hovered && styles.quickPlusOn]}>
                          <Ionicons name="add" size={16} color={hovered ? palette.navy900 : surface.brandText} />
                        </View>
                        <Text style={[styles.quickAmount, dir.bold]}>{formatNumber(amount, dir.lang)}</Text>
                        <Text style={[styles.quickUnit, dir.light]}>{t('Tomans')}</Text>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={() => navigation.navigate('Increase')}
                accessibilityRole="button"
                style={({ hovered }) => [styles.custom, dir.row, hovered && styles.customHover]}
              >
                <View style={styles.customIcon}>
                  <Ionicons name="create-outline" size={18} color={surface.brandText} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.customTitle, dir.bold, dir.align]}>{copy.custom}</Text>
                  <Text style={[styles.customHint, dir.light, dir.align]}>{copy.customHint}</Text>
                </View>
                <Ionicons name={dir.forward} size={16} color={surface.faint} />
              </Pressable>
              <View style={[styles.secure, dir.row]}>
                <Ionicons name="shield-checkmark" size={14} color={palette.success} />
                <Text style={[styles.secureText, dir.light]}>{copy.secure}</Text>
              </View>
            </Card>
          </View>

          {/* Latest transactions */}
          <Card padded={false} style={[styles.tableCard, animate('loop-fade-up', '380ms', '140ms')]}>
            <View style={styles.tableHeader}>
              <SectionHeader
                title={t('Recent transactions')}
                subtitle={copy.recentHint}
                icon="time-outline"
                style={styles.noMargin}
                action={
                  <DButton
                    title={t('View all')}
                    iconAfter={dir.forward}
                    variant="soft"
                    size="sm"
                    onPress={() => navigation.navigate('TransactionsScreen')}
                  />
                }
              />
            </View>
            <TransactionTable items={recent} loading={loadingRecent} emptyText={t('No transactions yet.')} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const spin = loop('loop-spin', '800ms');

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: contentGutter, paddingBottom: 32 },
  page: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 20 },
  flex: { flex: 1, minWidth: 0 },
  noMargin: { marginBottom: 0 },
  top: { gap: 20, alignItems: 'stretch' },

  balanceCard: {
    flex: 1.15,
    minWidth: 0,
    minHeight: 330,
    borderRadius: radii.xl,
    padding: 28,
    gap: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.floating,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars, opacity: 0.8 },
  cardOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -140,
    right: -90,
    backgroundImage: 'radial-gradient(circle at 35% 35%, rgba(130, 180, 255, 0.45) 0%, rgba(29, 95, 174, 0.18) 45%, rgba(29, 95, 174, 0) 70%)',
  },
  cardTop: { alignItems: 'center', justifyContent: 'space-between' },
  cardBrand: { alignItems: 'center', gap: 10 },
  cardLogo: { width: 30, height: 30, resizeMode: 'contain' },
  cardTitle: { color: onDark.text, fontSize: 15 },
  cardTopActions: { gap: 6 },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onDark.glass,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  cardIconHover: { backgroundColor: onDark.glassStrong },
  chipRow: { alignItems: 'center', gap: 12 },
  chip: {
    width: 46,
    height: 34,
    borderRadius: 8,
    backgroundImage: 'linear-gradient(135deg, #fff1a6 0%, #ffd700 40%, #c99a06 100%)',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 6,
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
  },
  chipLine: { height: 1, backgroundColor: 'rgba(90, 60, 0, 0.35)' },
  chipLine2: { marginHorizontal: 8 },
  contactless: { transform: 'rotate(90deg)' },
  balanceLabel: { color: onDark.muted, fontSize: 12.5 },
  balanceSkeleton: { marginTop: 8, opacity: 0.3 },
  balanceRow: { alignItems: 'baseline', gap: 8, marginTop: 2 },
  balanceValue: { color: onDark.text, fontSize: 40, lineHeight: 56, letterSpacing: 0.5 },
  balanceUnit: { color: onDark.soft, fontSize: 15 },
  cardBottom: { alignItems: 'flex-end', justifyContent: 'space-between' },
  holderLabel: { color: onDark.muted, fontSize: 10.5 },
  holder: { color: onDark.text, fontSize: 14 },
  code: { color: palette.gold, fontSize: 14, letterSpacing: 2 },
  cardActions: { gap: 10 },

  quickCard: { flex: 1, minWidth: 0, padding: 24, gap: 14 },
  quickGrid: { flexWrap: 'wrap', gap: 12 },
  quick: {
    width: 'calc(50% - 6px)',
    height: 96,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.border,
    backgroundColor: surface.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    cursor: 'pointer',
    transitionProperty: 'transform, border-color, background-color, box-shadow',
    transitionDuration: motion.base,
  },
  quickHover: {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(233, 179, 8, 0.6)',
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    boxShadow: '0 8px 20px rgba(233, 179, 8, 0.15)',
  },
  quickPressed: { transform: 'scale(0.98)' },
  quickPlus: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 43, 84, 0.06)',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  quickPlusOn: { backgroundImage: gradients.gold },
  quickAmount: { fontSize: 19, color: surface.title },
  quickUnit: { fontSize: 11.5, color: surface.faint },
  custom: {
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: surface.borderStrong,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: motion.fast,
  },
  customHover: { backgroundColor: surface.cardMuted, borderColor: 'rgba(29, 95, 174, 0.4)' },
  customIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 43, 84, 0.07)',
  },
  customTitle: { fontSize: 13.5, color: surface.title },
  customHint: { fontSize: 11.5, color: surface.faint },
  secure: { alignItems: 'center', gap: 6, justifyContent: 'center' },
  secureText: { fontSize: 11.5, color: surface.faint },

  tableCard: { overflow: 'hidden' },
  tableHeader: { padding: 20, paddingBottom: 14 },
});
