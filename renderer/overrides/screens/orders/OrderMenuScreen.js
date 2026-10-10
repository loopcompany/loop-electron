/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/orders/OrderMenuScreen.js
 *
 * The start menu, as a full-window desktop entry screen (@desktop/EntryLayout):
 * the brand story beside a glass card that leads with the three main tasks —
 * order a service (the mobile «Systematic order» handler), goods / product
 * supply and orders (both need an account; guests go to sign-in) — and keeps
 * the mobile file's other entries (organisation, urgent call, AI) as small
 * links under them, with the same handlers.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { CUSTOMER_HOME_ROUTE, resetToHome } from '@navigation/homeRoute';

import EntryLayout, { EntryAction, EntryLink, EntryMore } from '@desktop/EntryLayout';

const COPY = {
  fa: {
    title: 'از کجا شروع کنیم؟',
    subtitle: 'یکی از سه کار اصلی را انتخاب کنید.',
    service: 'ثبت سفارش خدمات',
    serviceText: 'دستگاه را انتخاب کنید و مرحله‌به‌مرحله سفارش دهید',
    supply: 'تامین کالا / محصول',
    supplyText: 'قطعات، کالا و تجهیزات مورد نیازتان',
    orders: 'سفارشات',
    ordersText: 'پیگیری وضعیت سفارش‌ها و پرداخت‌ها',
    more: 'سایر امکانات',
  },
  en: {
    title: 'Where shall we start?',
    subtitle: 'Pick one of the three main tasks.',
    service: 'Order a service',
    serviceText: 'Pick a device and order step by step',
    supply: 'Goods / product supply',
    supplyText: 'The parts, goods and equipment you need',
    orders: 'Orders',
    ordersText: 'Track your orders and payments',
    more: 'More'
  },
};

function OrderMenuScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];
  const contact = useSelector(state => state.contacts?.data?.data?.contact_urgent)
  const token = useSelector(state => state.auth?.token);
  const userType = useSelector(state => state.auth?.userType);

  const openSystematicOrder = () => {
    if (!token) {
      navigation.navigate("SignInLanding");
    } else if (userType === 'organization') {
      navigation.navigate(CUSTOMER_HOME_ROUTE);
    } else {
      resetToHome(navigation, 'individual');
    }
  };
  // سفارش‌ها و تامین کالا حساب لازم دارند؛ مهمان مستقیم به صفحه‌ی ورود می‌رود
  const openSignedIn = (screen) => navigation.navigate(token ? screen : "SignInLanding");
  const callSupport = () => {
    // `contact_urgent` در پنل خالی است (null)، پس همین شماره‌ی پیش‌فرض واقعاً گرفته می‌شود.
    Linking.openURL(contact?.link ? `${contact?.link}` : "tel:+982191693909");
  };
  return (
    <EntryLayout title={copy.title} subtitle={copy.subtitle}>
      <EntryAction index={0} tone="gold" icon="construct" title={copy.service} subtitle={copy.serviceText} onPress={openSystematicOrder} />
      <EntryAction index={1} icon="cube-outline" title={copy.supply} subtitle={copy.supplyText} onPress={() => openSignedIn("HardwareSelectionScreen")} />
      <EntryAction index={2} icon="receipt-outline" title={copy.orders} subtitle={copy.ordersText} onPress={() => openSignedIn("OrdersScreen")} />
      <EntryMore title={copy.more}>
        <EntryLink icon="business-outline" title={t("Organization / Company")} onPress={() => navigation.navigate("Grouping")} />
        <EntryLink icon="call-outline" title={t("Urgent order")} onPress={callSupport} />
        <EntryLink icon="sparkles-outline" title={t("Artificial intelligence")} badge={t("(Coming soon)").replace(/[()]/g, '')} disabled onPress={() => {}} />
      </EntryMore>
    </EntryLayout>
  );
}

export default OrderMenuScreen;
