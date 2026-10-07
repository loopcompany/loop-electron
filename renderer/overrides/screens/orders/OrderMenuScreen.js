/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/orders/OrderMenuScreen.js
 *
 * The start menu, as a full-window desktop entry screen (@desktop/EntryLayout):
 * the brand story beside a glass card with the same four entries and the
 * same handlers as the mobile file.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { CUSTOMER_HOME_ROUTE, resetToHome } from '@navigation/homeRoute';

import EntryLayout, { EntryAction } from '@desktop/EntryLayout';

const COPY = {
  fa: {
    title: 'از کجا شروع کنیم؟',
    subtitle: 'نوع سفارش یا حساب خود را انتخاب کنید.',
    systematic: 'دستگاه را انتخاب کنید و مرحله‌به‌مرحله سفارش دهید',
    urgent: 'تماس مستقیم با پشتیبانی برای کارهای فوری',
    ai: 'دستیار هوشمند لوپ',
    org: 'ورود به پنل ویژه‌ی سازمان‌ها و شرکت‌ها',
  },
  en: {
    title: 'Where shall we start?',
    subtitle: 'Choose an order type or your account.',
    systematic: 'Pick a device and order step by step',
    urgent: 'Call support directly for urgent work',
    ai: 'The Loop smart assistant',
    org: 'The dedicated panel for organisations and companies',
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
  const callSupport = () => {
    // `contact_urgent` در پنل خالی است (null)، پس همین شماره‌ی پیش‌فرض واقعاً گرفته می‌شود.
    Linking.openURL(contact?.link ? `${contact?.link}` : "tel:+982191693909");
  };
  return (
    <EntryLayout title={copy.title} subtitle={copy.subtitle}>
      <EntryAction index={0} tone="gold" icon="grid" title={t("Systematic order")} subtitle={copy.systematic} onPress={openSystematicOrder} />
      <EntryAction index={1} icon="call-outline" title={t("Urgent order")} subtitle={copy.urgent} onPress={callSupport} />
      <EntryAction index={2} icon="sparkles-outline" title={t("Artificial intelligence")} subtitle={copy.ai} badge={t("(Coming soon)").replace(/[()]/g, '')} disabled onPress={() => {}} />
      <EntryAction index={3} tone="brand" icon="business-outline" title={t("Organization / Company")} subtitle={copy.org} onPress={() => navigation.navigate("Grouping")} />
    </EntryLayout>
  );
}

export default OrderMenuScreen;
