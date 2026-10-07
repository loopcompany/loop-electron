/**
 * DESKTOP OVERRIDE of loop-customer-mobile/org/SystematicCategoryScreen.js
 *
 * The customer's home page. On a phone it is a two-column grid of icon tiles
 * over the moon artwork; on the desktop it is a dashboard: a welcome banner,
 * the account at a glance (wallet, orders, points), the device categories as
 * large cards, and the latest orders beside them.
 *
 * Everything that decides *what happens* is the mobile file's, unchanged:
 * loading and caching /categories, which tiles exist and in what order,
 * and where each tile leads (`openCategory`). Only the render differs.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import ScreenHeaders from '@components/ScreenHeaders';
import categoriesAPI from '@services/CategoriesApi';
import { fetchSteps } from '@slices/stepSlice';
import { fetchOrders } from '@slices/ordersSlice';
import { describeApiError } from '@utils/apiErrorHandler';
import { setCategory } from '@slices/categorySlice';
import { showToastOrAlert } from '@helpers/Common';
import { imageUri } from '@services/URL';
import {
  SYSTEMATIC_CATEGORIES,
  getCategory,
  getFlow,
  resolveSystematicCategoryId,
} from '@org/systematicFlows';
import { L } from '@org/orgI18n';

import { Card, DButton, Pill, SectionHeader, Skeleton, useDir } from '@desktop/ui';
import { elevation, motion, palette, radii, surface } from '@desktop/desktopTheme';
import { animate } from '@desktop/globalStyles';
import {
  AccountStats,
  RecentOrdersCard,
  Shortcut,
  WelcomeHero,
  dashboardCopy,
  dashboardStyles,
  greetingName,
} from '@desktop/DashboardParts';

// ستون سمت چپ دقیقاً سه کاشی دارد و «ضایعات» کاشی سوم همان ستون است؛ بقیه‌ی
// کاشی‌ها در ستون دوم می‌نشینند.
const LEFT_COLUMN_SIZE = 3;

// ستون چپ = [حساب کاربری، اولین دسته، ضایعات]. پس جای «ضایعات» در فهرست دسته‌ها
// (بدون کاشی حساب کاربری) یکی مانده به انتهای ستون چپ است.
const TRASH_INDEX_IN_CATEGORIES = LEFT_COLUMN_SIZE - 2;

const localIconFor = (categoryId) => getCategory(categoryId)?.image || null;

const CATEGORIES_CACHE_KEY = 'systematicCategoriesCache';
const cacheKeyFor = (lang) => `${CATEGORIES_CACHE_KEY}:${lang || 'fa'}`;

const readCachedCategories = async (lang) => {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyFor(lang));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeCachedCategories = (lang, categories) =>
  AsyncStorage.setItem(cacheKeyFor(lang), JSON.stringify(categories)).catch(() => {});

const prefetchIcons = (categories) => {
  const urls = [
    `${imageUri}/userfolder/Profile.png`,
    ...categories.map((item) => item?.image_path).filter(Boolean).map((path) => `${imageUri}/${path}`),
  ];
  ExpoImage.prefetch(urls, 'memory-disk').catch(() => {});
};

// Desktop-only copy; kept here rather than in the shared i18n files.
const COPY = {
  fa: {
    heroText: 'دستگاه مورد نظرتان را انتخاب کنید؛ مراحل سفارش سیستماتیک قدم‌به‌قدم همراهتان است.',
    myOrders: 'سفارش‌های من',
    topUp: 'شارژ کیف پول',
    categories: 'دسته‌بندی دستگاه‌ها',
    categoriesHint: 'برای شروع سفارش، یک دستگاه را انتخاب کنید',
    start: 'شروع سفارش',
    soon: 'به‌زودی',
    account: 'حساب کاربری',
    accountHint: 'اطلاعات، امنیت و آدرس‌ها',
    support: 'پشتیبانی لوپ',
    supportHint: 'پیام به تیم پشتیبانی',
    refresh: 'به‌روزرسانی',
  },
  en: {
    heroText: 'Pick a device to start a systematic order — we will walk you through it step by step.',
    myOrders: 'My orders',
    topUp: 'Top up wallet',
    categories: 'Device categories',
    categoriesHint: 'Choose a device to start an order',
    start: 'Start order',
    soon: 'Coming soon',
    account: 'Account',
    accountHint: 'Details, security and addresses',
    support: 'Loop support',
    supportHint: 'Message the support team',
    refresh: 'Refresh',
  },
};

const SystematicCategoryScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];

  const dispatch = useDispatch();
  const token = useSelector((state) => state?.auth?.token);
  const user = useSelector((state) => state?.user?.data);
  const orders = useSelector((state) => state?.orders?.data);
  const ordersLoading = useSelector((state) => state?.orders?.loading);

  const [folders, setFolders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loader, setLoader] = useState(true);

  const lang = i18n.language;

  const handleHeaderBack = () => {
    if (!navigation.canGoBack()) {
      navigation.navigate('OrderMenuScreen');
    } else if (Platform.OS === 'web') {
      window.history.back();
    } else {
      navigation.goBack();
    }
  };

  const loadCategories = async () => {
    if (!token) {
      setRefreshing(false);
      setLoader(false);
      return;
    }

    try {
      const res = await categoriesAPI.getCategories();
      const categories = Array.isArray(res.data) ? res.data : res.data || res.data?.data || [];
      prefetchIcons(categories);
      setFolders(categories);
      writeCachedCategories(lang, categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
      if (err?.response?.status !== 401) {
        showToastOrAlert(`${L('خطا در دریافت دسته‌ها')} — ${describeApiError(err, t)}`);
      }
      setFolders((prev) => (prev.length ? prev : []));
    } finally {
      setRefreshing(false);
      setLoader(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    readCachedCategories(lang).then((cached) => {
      if (cancelled || !cached?.length) return;
      prefetchIcons(cached);
      setFolders((prev) => (prev.length ? prev : cached));
      setLoader(false);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    loadCategories();
  }, [token, lang]);

  // دسکتاپ: آخرین سفارش‌ها کنار دسته‌ها نمایش داده می‌شوند
  useEffect(() => {
    if (token) dispatch(fetchOrders());
  }, [token, dispatch]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const items = useMemo(() => {
    if (folders.length) {
      return folders.map((item) => ({
        key: String(item?.id),
        title: item?.title,
        image: item?.image_path,
        apiItem: item,
      }));
    }
    return SYSTEMATIC_CATEGORIES.map((item) => ({
      key: item.id,
      title: item.title,
      imageSource: item.image,
      apiItem: item,
    }));
  }, [folders]);

  const openCategory = async (entry) => {
    const source = entry.apiItem;
    const systematicId = resolveSystematicCategoryId(source);

    if (systematicId === 'user_account') {
      navigation.navigate('Profile');
      return;
    }

    if (systematicId === 'trash') {
      showToastOrAlert(L('به زودی'));
      return;
    }

    if (!user?.code) {
      showToastOrAlert(
        t('To place an order, first complete your information in the account section.')
      );
      return;
    }

    if (systematicId && getFlow(systematicId).length) {
      const backendId = Number(source?.id);
      navigation.navigate('SystematicDeviceScreen', {
        categoryId: systematicId,
        categoryTitle: entry.title,
        backendCategoryId: Number.isInteger(backendId) ? backendId : null,
      });
      return;
    }

    if (source?.has_subcategory === 1) {
      navigation.push('SubCategories', {
        categoryId: source.id,
        categoryTitle: source.title,
      });
      return;
    }

    try {
      const result = await dispatch(fetchSteps({ categoryId: source?.id, token }));
      if (fetchSteps.rejected.match(result)) {
        showToastOrAlert(result.payload || t('An unexpected error occurred!'));
        return;
      }
      dispatch(setCategory(source));
      navigation.navigate('Steps', {
        categoryId: source?.id,
        categoryTitle: source?.title,
      });
    } catch (error) {
      console.log('❌ [SystematicCategoryScreen] خطا در dispatch fetchSteps:', error);
    }
  };

  // همان کاشی‌ها و همان ترتیب صفحه‌ی موبایل؛ «حساب کاربری» روی دسکتاپ در
  // میان‌برهای کنار صفحه است، نه بین دستگاه‌ها.
  const buildTiles = () => {
    const categories = items.filter((entry) => {
      const categoryId = resolveSystematicCategoryId(entry.apiItem);
      const isComprehensive = entry.apiItem?.id === 'comprehensive' ||
                             entry.title === 'انتخاب جامع' ||
                             entry.title === 'Comprehensive Selection';
      return categoryId !== 'user_account' && !isComprehensive;
    });

    const rest = categories.map((entry) => {
      const categoryId = resolveSystematicCategoryId(entry.apiItem);
      return {
        key: entry.key,
        title: entry.title,
        subtitle: getCategory(categoryId)?.subtitle,
        image: categoryId === 'trash' ? undefined : entry.image,
        imageSource: localIconFor(categoryId) || entry.imageSource,
        onPress: () => openCategory(entry),
        isTrash: categoryId === 'trash',
      };
    });

    // «ضایعات» آخر از همه — روی دسکتاپ هنوز فعال نیست و نباید وسط دستگاه‌ها باشد
    const trashIndex = rest.findIndex((tile) => tile.isTrash);
    if (trashIndex > -1) {
      const [trashTile] = rest.splice(trashIndex, 1);
      rest.push(trashTile);
    }
    return rest;
  };

  const tiles = buildTiles();

  return (
    <View style={dashboardStyles.screen}>
      <ScreenHeaders title={L('انتخاب سیستماتیک')} onBackPress={handleHeaderBack} />
      <ScrollView style={dashboardStyles.scroll} contentContainerStyle={dashboardStyles.scrollContent}>
        <View style={dashboardStyles.page}>
          <WelcomeHero
            badge={dir.rtl ? 'سفارش سیستماتیک' : 'Systematic ordering'}
            title={dashboardCopy(dir.rtl).hello(greetingName(user))}
            text={copy.heroText}
            actions={[
              { title: copy.myOrders, icon: 'receipt-outline', onPress: () => navigation.navigate('OrdersScreen') },
              { title: copy.topUp, icon: 'add-circle-outline', onPress: () => navigation.navigate('Increase') },
            ]}
          />

          <AccountStats navigation={navigation} orders={orders} />

          <View style={[dashboardStyles.columns, dir.row]}>
            {/* Device categories */}
            <Card style={[dashboardStyles.mainColumn, animate('loop-fade-up', '380ms', '120ms')]}>
              <SectionHeader
                title={copy.categories}
                subtitle={copy.categoriesHint}
                icon="grid-outline"
                action={
                  <DButton
                    title={copy.refresh}
                    icon="refresh"
                    variant="ghost"
                    size="sm"
                    loading={refreshing}
                    onPress={handleRefresh}
                  />
                }
              />
              <View style={[styles.grid, dir.row]}>
                {loader
                  ? Array.from({ length: 6 }, (_, i) => (
                      <View key={i} style={[styles.tile, styles.tileSkeleton]}>
                        <Skeleton width={84} height={84} radius={20} />
                        <Skeleton width="60%" height={14} />
                      </View>
                    ))
                  : tiles.map((tile, i) => (
                      <CategoryTile key={tile.key} tile={tile} index={i} dir={dir} copy={copy} />
                    ))}
              </View>
            </Card>

            {/* Side column */}
            <View style={[dashboardStyles.sideColumn, animate('loop-fade-up', '380ms', '180ms')]}>
              <RecentOrdersCard navigation={navigation} orders={orders} loading={ordersLoading} />
              <View style={[dashboardStyles.shortcuts, dir.row]}>
                <Shortcut icon="person-circle-outline" title={copy.account} hint={copy.accountHint} onPress={() => navigation.navigate('Profile')} />
                <Shortcut icon="headset-outline" title={copy.support} hint={copy.supportHint} onPress={() => navigation.navigate('MessageScreen')} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

function CategoryTile({ tile, index, dir, copy }) {
  const [remoteFailed, setRemoteFailed] = useState(false);
  const remote = tile.image && !remoteFailed;
  const source = remote ? { uri: `${imageUri}/${tile.image}` } : tile.imageSource;

  return (
    <Pressable
      onPress={tile.onPress}
      accessibilityRole="button"
      accessibilityLabel={L(tile.title)}
      style={({ hovered, pressed }) => [
        styles.tile,
        animate('loop-fade-up', '320ms', `${160 + index * 40}ms`),
        hovered && !tile.isTrash && styles.tileHover,
        pressed && !tile.isTrash && styles.tilePressed,
        tile.isTrash && styles.tileDisabled,
      ]}
    >
      {({ hovered }) => (
        <>
          <View style={[styles.tileGlow, hovered && !tile.isTrash && styles.tileGlowOn]} />
          {tile.isTrash && (
            <View style={[styles.soon, dir.rtl ? styles.soonRtl : styles.soonLtr]}>
              <Pill label={copy.soon} kind="neutral" size="sm" />
            </View>
          )}
          <View style={[styles.tileIconWrap, hovered && !tile.isTrash && styles.tileIconHover]}>
            {source ? (
              <ExpoImage
                source={source}
                placeholder={remote ? tile.imageSource : undefined}
                placeholderContentFit="contain"
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={150}
                onError={() => tile.image && setRemoteFailed(true)}
                style={styles.tileIcon}
              />
            ) : (
              <Ionicons name="cube-outline" size={40} color={surface.brandText} />
            )}
          </View>
          <Text style={[styles.tileTitle, dir.bold]} numberOfLines={1}>
            {L(tile.title)}
          </Text>
          <View style={[styles.tileCta, dir.row, hovered && !tile.isTrash && styles.tileCtaOn]}>
            <Text style={[styles.tileCtaText, dir.light]}>{tile.isTrash ? copy.soon : copy.start}</Text>
            {!tile.isTrash && <Ionicons name={dir.forward} size={13} color={palette.brandBright} />}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexWrap: 'wrap', gap: 16 },
  tile: {
    width: 'calc(33.333% - 11px)',
    minWidth: 170,
    flexGrow: 1,
    height: 196,
    borderRadius: radii.lg,
    backgroundColor: surface.cardMuted,
    borderWidth: 1,
    borderColor: surface.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow, border-color, background-color',
    transitionDuration: motion.base,
    transitionTimingFunction: motion.ease,
  },
  tileSkeleton: { cursor: 'default', gap: 14 },
  tileHover: {
    transform: 'translateY(-4px)',
    backgroundColor: surface.card,
    borderColor: 'rgba(29, 95, 174, 0.28)',
    boxShadow: elevation.raised,
  },
  tilePressed: { transform: 'translateY(-1px) scale(0.99)' },
  tileDisabled: { opacity: 0.6, cursor: 'default' },
  tileGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    backgroundImage: 'radial-gradient(60% 55% at 50% 28%, rgba(255, 215, 0, 0.22) 0%, rgba(255, 215, 0, 0) 70%)',
    transitionProperty: 'opacity',
    transitionDuration: motion.slow,
  },
  tileGlowOn: { opacity: 1 },
  tileIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'transform',
    transitionDuration: motion.slow,
    transitionTimingFunction: motion.ease,
    filter: 'drop-shadow(0 10px 18px rgba(0, 43, 84, 0.18))',
  },
  tileIconHover: { transform: 'scale(1.06) rotate(-2deg)' },
  tileIcon: { width: 92, height: 92, borderRadius: 24 },
  tileTitle: { fontSize: 15.5, color: surface.title, textAlign: 'center' },
  tileCta: {
    alignItems: 'center',
    gap: 4,
    opacity: 0.55,
    transitionProperty: 'opacity',
    transitionDuration: motion.base,
  },
  tileCtaOn: { opacity: 1 },
  tileCtaText: { fontSize: 12, color: palette.brandBright },
  soon: { position: 'absolute', top: 12, zIndex: 1 },
  soonRtl: { right: 12 },
  soonLtr: { left: 12 },
});

export default SystematicCategoryScreen;
