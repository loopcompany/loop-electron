/**
 * DESKTOP OVERRIDE of loop-customer-mobile/org/List.js
 *
 * The organisation home. On a phone: two icon tiles on the moon artwork.
 * On the desktop: the same calm home as the customer's
 * (@desktop/DashboardParts): a greeting banner, three large actions (order a
 * service, goods / product supply, orders), then the two ways to order —
 * comprehensive and systematic — as large cards that show their explanation
 * up front instead of behind a "?" badge (always shown; «ثبت سفارش خدمات»
 * scrolls to them), the account at a glance and a quick-access row.
 *
 * Same behaviour as the mobile file: the same two destinations, the same
 * title (the organisation's name), and customers are redirected to their
 * own home.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useEffect, useRef } from 'react';
import { View, Image, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import ScreenHeaders from '@components/ScreenHeaders';
import { fetchOrders } from '@slices/ordersSlice';
import { L } from './orgI18n';
import { CUSTOMER_HOME_ROUTE } from '@navigation/homeRoute';

import { Card, Pill, SectionHeader, useDir } from '@desktop/ui';
import { elevation, gradients, motion, onDark, palette, radii, surface } from '@desktop/desktopTheme';
import { animate } from '@desktop/globalStyles';
import { brandCopy, useTimeGreeting } from '@desktop/brandCopy';
import {
  AccountStats,
  HomeActions,
  QuickAccess,
  Shortcut,
  WelcomeHero,
  greetingIcon,
  dashboardStyles,
  greetingName,
} from '@desktop/DashboardParts';

const entryOptions = [
  {
    id: 'comprehensive',
    title: 'انتخاب جامع',
    image: require('@assets/jame.jpg'),
    screen: 'ComprehensiveSelectionScreen',
    hint: 'در «انتخاب جامع» تمام خدمات نرم‌افزاری، سخت‌افزاری و تامین تجهیزات سازمان را یکجا در یک فرم کامل ثبت می‌کنید.',
  },
  {
    id: 'systematic',
    title: 'انتخاب سیستماتیک',
    image: require('@assets/systematic.png'),
    screen: 'SystematicCategoryScreen',
    hint: 'در «انتخاب سیستماتیک» دسته‌بندی مورد نظر (کیس، لپ‌تاپ، پرینتر و ...) را جداگانه انتخاب و سفارش می‌دهید.',
  },
];

const COPY = {
  fa: {
    badge: 'پنل سازمانی',
    heroText: 'سفارش‌های سازمان را یکجا ثبت کنید یا دستگاه‌به‌دستگاه پیش بروید؛ پیگیری و پرداخت هم همین‌جاست.',
    contract: 'قرارداد',
    contractHint: 'قرارداد و توافق‌نامه‌ی سازمان',
    choose: 'روش ثبت سفارش',
    chooseHint: 'یکی از دو مسیر زیر را انتخاب کنید',
    start: 'شروع',
    badges: { comprehensive: 'همه‌ی خدمات در یک فرم', systematic: 'دستگاه‌به‌دستگاه' },
    profile: 'پروفایل سازمان',
    profileHint: 'اطلاعات، اعضا و آدرس‌ها',
    support: 'پشتیبانی لوپ',
    supportHint: 'پیام به تیم پشتیبانی',
  },
  en: {
    badge: 'Organisation panel',
    heroText: 'Place your organisation’s orders all at once or device by device — tracking and payment live here too.',
    contract: 'Contract',
    contractHint: 'Your organisation’s agreement',
    choose: 'How to order',
    chooseHint: 'Pick one of the two ways below',
    start: 'Start',
    badges: { comprehensive: 'Every service in one form', systematic: 'Device by device' },
    profile: 'Organisation profile',
    profileHint: 'Details, members and addresses',
    support: 'Loop support',
    supportHint: 'Message the support team',
  },
};

const List = ({ navigation }) => {
  useTranslation();
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const dispatch = useDispatch();
  const token = useSelector((state) => state?.auth?.token);
  const user = useSelector((state) => state?.user?.data);
  const orders = useSelector((state) => state?.orders?.data);
  const greeting = useTimeGreeting(dir.lang);
  const brand = brandCopy(dir.lang);

  // «ثبت سفارش خدمات» به بخش «روش ثبت سفارش» (همیشه باز) اسکرول می‌کند
  const scrollRef = useRef(null);
  const servicesY = useRef(0);
  const scrollToServices = () =>
    scrollRef.current?.scrollTo({ y: Math.max(0, servicesY.current - 16), animated: true });

  const organizationName = useSelector(
    (state) => state?.organization?.profile?.company_name
  );

  const isCustomer = useSelector((state) => state?.auth?.userType) === 'individual';
  useEffect(() => {
    if (isCustomer) navigation.replace(CUSTOMER_HOME_ROUTE);
  }, [isCustomer, navigation]);

  // دسکتاپ: آخرین سفارش‌ها کنار مسیرهای سفارش نمایش داده می‌شوند
  useEffect(() => {
    if (token && !isCustomer) dispatch(fetchOrders());
  }, [token, isCustomer, dispatch]);

  if (isCustomer) return null;

  const name = organizationName || greetingName(user);

  return (
    <View style={dashboardStyles.screen}>
      <ScreenHeaders title={organizationName || L('سازمانی / دولتی')} />
      <ScrollView ref={scrollRef} style={dashboardStyles.scroll} contentContainerStyle={dashboardStyles.scrollContent}>
        <View style={dashboardStyles.page}>
          <WelcomeHero
            greeting={[greeting, name].filter(Boolean).join(dir.rtl ? '، ' : ', ')}
            greetingIcon={greetingIcon()}
            title={brand.welcome}
            text={brand.tagline}
          />

          <HomeActions
            onService={scrollToServices}
            onSupply={() => navigation.navigate('HardwareSelectionScreen')}
            onOrders={() => navigation.navigate('OrdersScreen')}
            orders={orders}
          />

          {/* Two ways to order */}
          <View onLayout={(e) => { servicesY.current = e.nativeEvent.layout.y; }}>
            <Card style={[styles.services, animate('loop-fade-up', '320ms')]}>
              <SectionHeader title={copy.choose} subtitle={copy.chooseHint} icon="git-branch-outline" />
              <View style={[styles.options, dir.row]}>
                {entryOptions.map((item, i) => (
                  <Pressable
                    key={item.id}
                    onPress={() => navigation.navigate(item.screen)}
                    accessibilityRole="button"
                    accessibilityLabel={L(item.title)}
                    style={({ hovered, pressed }) => [
                      styles.option,
                      animate('loop-fade-up', '340ms', `${80 + i * 80}ms`),
                      hovered && styles.optionHover,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    {({ hovered }) => (
                      <>
                        <View style={styles.optionStars} pointerEvents="none" />
                        <View style={[styles.optionTop, dir.row]}>
                          <View style={[styles.optionImageWrap, hovered && styles.optionImageHover]}>
                            <Image source={item.image} style={styles.optionImage} />
                          </View>
                          <Pill label={copy.badges[item.id]} kind="gold" size="sm" />
                        </View>
                        <Text style={[styles.optionTitle, dir.bold, dir.align]}>{L(item.title)}</Text>
                        <Text style={[styles.optionText, dir.light, dir.align]}>{L(item.hint)}</Text>
                        <View style={[styles.optionCta, dir.row, hovered && styles.optionCtaOn]}>
                          <Text style={[styles.optionCtaText, dir.bold]}>{copy.start}</Text>
                          <Ionicons name={dir.rtl ? 'arrow-back' : 'arrow-forward'} size={16} color={palette.navy900} />
                        </View>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
            </Card>
          </View>

          <AccountStats navigation={navigation} orders={orders} />

          <QuickAccess>
            <Shortcut icon="document-text-outline" title={copy.contract} hint={copy.contractHint} onPress={() => navigation.navigate('OrganizationContract')} />
            <Shortcut icon="business-outline" title={copy.profile} hint={copy.profileHint} onPress={() => navigation.navigate('Profile')} />
            <Shortcut icon="headset-outline" title={copy.support} hint={copy.supportHint} onPress={() => navigation.navigate('MessageScreen')} />
          </QuickAccess>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  services: { padding: 24 },
  options: { gap: 16, alignItems: 'stretch' },
  option: {
    flex: 1,
    minWidth: 0,
    minHeight: 300,
    padding: 24,
    gap: 12,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionDuration: motion.base,
    transitionTimingFunction: motion.ease,
  },
  optionHover: { transform: 'translateY(-4px)', boxShadow: elevation.floating, borderColor: 'rgba(255, 215, 0, 0.4)' },
  optionPressed: { transform: 'scale(0.99)' },
  optionStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  optionTop: { alignItems: 'flex-start', justifyContent: 'space-between' },
  optionImageWrap: {
    width: 84,
    height: 84,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    boxShadow: '0 0 30px rgba(79, 143, 224, 0.4)',
    transitionProperty: 'transform',
    transitionDuration: motion.slow,
  },
  optionImageHover: { transform: 'scale(1.05) rotate(-2deg)' },
  optionImage: { width: '100%', height: '100%' },
  optionTitle: { color: onDark.text, fontSize: 21, marginTop: 8 },
  optionText: { flex: 1, color: onDark.soft, fontSize: 13.5, lineHeight: 25 },
  optionCta: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: radii.md,
    backgroundImage: gradients.gold,
    opacity: 0.9,
    transitionProperty: 'opacity, transform',
    transitionDuration: motion.base,
  },
  optionCtaOn: { opacity: 1, transform: 'translateY(-1px)' },
  optionCtaText: { color: palette.navy900, fontSize: 14 },
});

export default List;
