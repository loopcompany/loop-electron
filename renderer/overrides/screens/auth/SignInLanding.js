/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/auth/SignInLanding.js
 *
 * The sign-in / sign-up choice as a desktop entry screen
 * (@desktop/EntryLayout). Same three actions as the mobile file.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { imageUri } from '@services/URL';
import { useSelector } from "react-redux";

import EntryLayout, { EntryAction } from '@desktop/EntryLayout';

const COPY = {
  fa: {
    title: 'ورود به حساب لوپ',
    subtitle: 'برای ثبت و پیگیری سفارش، وارد حساب خود شوید یا یک حساب تازه بسازید.',
    login: 'با شماره موبایل و رمز عبور',
    signup: 'ساخت حساب در کمتر از یک دقیقه',
    guide: 'آشنایی با امکانات اپلیکیشن (PDF)',
  },
  en: {
    title: 'Sign in to Loop',
    subtitle: 'Sign in to place and track orders, or create a new account.',
    login: 'With your mobile number and password',
    signup: 'Create an account in under a minute',
    guide: 'Get to know the app (PDF)',
  },
};

export default function SignInLanding({ navigation }) {
  const { t, i18n } = useTranslation();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];
  const pdf = useSelector(state => state.pdf?.data)
  return (
    <EntryLayout title={copy.title} subtitle={copy.subtitle}>
      <EntryAction index={0} tone="gold" icon="log-in-outline" title={t("Log in")} subtitle={copy.login} onPress={() => navigation.navigate("LoginScreen")} />
      <EntryAction index={1} tone="brand" icon="person-add-outline" title={t("Sign up")} subtitle={copy.signup} onPress={() => navigation.navigate("MainSignIn")} />
      <EntryAction index={2} icon="book-outline" title={t("User Application Guide")} subtitle={copy.guide} onPress={() => { Linking.openURL(`${imageUri}/${pdf?.user}`) }} />
    </EntryLayout>
  );
}
