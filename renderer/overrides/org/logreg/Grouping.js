/**
 * DESKTOP OVERRIDE of loop-customer-mobile/org/logreg/Grouping.js
 *
 * The organisation / company entry as a desktop entry screen
 * (@desktop/EntryLayout). Same three destinations as the mobile file: the
 * organisation login, the organisational guide (PDF) and the panel's terms.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import ScreenHeaders from "@components/ScreenHeaders";
import { imageUri } from "@services/URL";

import EntryLayout, { EntryAction } from "@desktop/EntryLayout";

const COPY = {
  fa: {
    subtitle: 'ورود به پنل ویژه‌ی سازمان‌ها، شرکت‌ها و نهادهای دولتی.',
    login: 'با نام کاربری سازمان',
    guide: 'آشنایی با امکانات پنل سازمانی (PDF)',
    terms: 'پیش از ورود مطالعه کنید',
  },
  en: {
    subtitle: 'Sign in to the panel for organisations, companies and government bodies.',
    login: 'With your organisation username',
    guide: 'Get to know the organisation panel (PDF)',
    terms: 'Please read before signing in',
  },
};

const Grouping = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];
  const pdf = useSelector(state => state.pdf?.data)
  return (
    <>
      <ScreenHeaders title={t("Organization / Company")} />
      <EntryLayout title={t("Organization / Company")} subtitle={copy.subtitle}>
        <EntryAction index={0} tone="gold" icon="log-in-outline" title={t("Login to account")} subtitle={copy.login} onPress={() => navigation.navigate("Login")} />
        <EntryAction index={1} icon="book-outline" title={t("Organizational Application Guide")} subtitle={copy.guide} onPress={() => { Linking.openURL(`${imageUri}/${pdf?.organ}`) }} />
        <EntryAction index={2} icon="document-text-outline" title={t("System terms and conditions in the organization / company panel")} subtitle={copy.terms} onPress={() => navigation.navigate('OrganizationTermsScreen')} />
      </EntryLayout>
    </>
  );
};

export default Grouping;
