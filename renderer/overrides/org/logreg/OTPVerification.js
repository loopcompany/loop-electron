/**
 * DESKTOP OVERRIDE of loop-customer-mobile/org/logreg/OTPVerification.js
 *
 * The organisation's one-time code step redrawn for the desktop glass card
 * (@desktop/AuthKit): the new organisation code (with copy) above six code
 * cells backed by one input, then the resend countdown. Once verified, the
 * card turns into a success state with the code and a button to sign in.
 *
 * State, the verify / resend requests, what is stored and the auto-submit on
 * the sixth digit are the mobile file's. Differences: messages show in the
 * card instead of browser `alert()` / `confirm()` boxes, and the Android SMS
 * auto-fill subscription is left out (it only ever ran on Android).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { uri } from '@services/URL';
import { restartOtpRetriever, stopOtpRetriever } from '@screens/auth/OtpRetriever';

import {
  AuthAlert,
  AuthHeader,
  AuthScreen,
  OtpInput,
  ResendRow,
  SubmitButton,
} from '@desktop/AuthKit';
import { motion, onDark, palette, radii } from '@desktop/desktopTheme';
import { animate } from '@desktop/globalStyles';
import { useDir } from '@desktop/ui';

const COPY = {
  fa: {
    title: 'تأیید شماره موبایل',
    sentTo: (phone) => `کد ۶ رقمی پیامک‌شده به ${phone} را وارد کنید.`,
    codeLabel: 'کد سازمانی شما',
    codeHint: 'برای ورود به پنل به این کد نیاز دارید؛ آن را نگه دارید.',
    copy: 'کپی',
    copied: 'کپی شد',
    enterSix: 'لطفاً کد ۶ رقمی را کامل وارد کنید.',
    wrongCode: 'کد تأیید اشتباه است. لطفاً دوباره تلاش کنید.',
    noServer: 'سرور پاسخ نمی‌دهد. اتصال اینترنت را بررسی کنید.',
    unknown: 'خطای نامشخصی رخ داد.',
    resent: 'کد تأیید دوباره ارسال شد.',
    resendFailed: 'ارسال دوباره‌ی کد انجام نشد.',
    doneTitle: 'ثبت‌نام سازمان کامل شد',
    doneText: 'شماره موبایل تأیید شد. از این به بعد با کد سازمانی زیر و رمز عبوری که انتخاب کردید وارد شوید.',
    signIn: 'ورود به پنل سازمان',
  },
  en: {
    title: 'Verify the mobile number',
    sentTo: (phone) => `Enter the 6-digit code we texted to ${phone}.`,
    codeLabel: 'Your organisation code',
    codeHint: "You'll need this code to sign in — keep it safe.",
    copy: 'Copy',
    copied: 'Copied',
    enterSix: 'Please enter the full 6-digit code.',
    wrongCode: 'That code is not correct. Please try again.',
    noServer: 'The server is not responding. Check your internet connection.',
    unknown: 'Something went wrong.',
    resent: 'A new code is on its way.',
    resendFailed: "Couldn't resend the code.",
    doneTitle: 'Your organisation is registered',
    doneText: 'The mobile number is verified. From now on, sign in with the organisation code below and the password you chose.',
    signIn: 'Sign in to the organisation panel',
  },
};

const normalizeOtpCode = value => String(value || '')
  .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/\D/g, '')
  .slice(0, 6);

const OTPVerification = ({ route, navigation }) => {

  const { phone, organizationCode, userId, organizationId } = route.params;
  const { i18n } = useTranslation();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(120); // 2 minutes
  const [message, setMessage] = useState(null); // { kind, text }
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (timer <= 0) return undefined;

    const timeout = setTimeout(() => {
      setTimer(previousTimer => Math.max(previousTimer - 1, 0));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [timer]);

  const handleCodeChange = text => {
    setMessage(null);
    setCode(normalizeOtpCode(text));
  };

  const handleVerify = async () => {
    if (loading) return;

    const verificationCode = normalizeOtpCode(code);

    if (verificationCode.length !== 6) {
      setMessage({ kind: 'error', text: copy.enterSix });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${uri}/organization/verify-phone`, {
        phone: phone,
        code: verificationCode,
      });

      console.log('✅ Verification response:', response.data);

      if (response.data.status === 'success') {
        stopOtpRetriever({ clearPending: true });

        // Save organization info (token might not be provided in verify step)
        await AsyncStorage.setItem('accountType', 'organization');
        await AsyncStorage.setItem('organizationCode', organizationCode);

        // Save token only if provided
        if (response.data.data?.token) {
          await AsyncStorage.setItem('userToken', response.data.data.token);
        }

        // Save user data only if provided
        if (response.data.data?.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
        }

        // Save userId and organizationId
        if (userId) {
          await AsyncStorage.setItem('userId', userId.toString());
        }
        if (organizationId) {
          await AsyncStorage.setItem('organizationId', organizationId.toString());
        }

        setMessage(null);
        setVerified(true);
      } else {
        setCode('');
        setMessage({ kind: 'error', text: response.data.message || copy.wrongCode });
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      setCode('');

      if (error.response) {
        console.error('Response error:', error.response.data);
        setMessage({ kind: 'error', text: error.response.data.message || copy.wrongCode });
      } else if (error.request) {
        console.error('Request error:', error.request);
        setMessage({ kind: 'error', text: copy.noServer });
      } else {
        console.error('Unknown error:', error.message);
        setMessage({ kind: 'error', text: error.message || copy.unknown });
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleVerify();
    }
  }, [code]);

  const handleResendCode = async () => {
    if (timer > 0) return;

    setResendLoading(true);
    setCode('');
    setMessage(null);

    try {
      if (Platform.OS === 'android') {
        try {
          await restartOtpRetriever();
        } catch (otpError) {
          console.warn('OTP Retriever restart error:', otpError);
        }
      }

      const response = await axios.post(`${uri}/organization/resend-code`, {
        phone: phone,
      });

      if (response.data.status === 'success') {
        setMessage({ kind: 'success', text: copy.resent });
        setTimer(120);
        setCode('');
      } else {
        stopOtpRetriever({ clearPending: true });
        setMessage({ kind: 'error', text: response.data.message || copy.resendFailed });
      }
    } catch (error) {
      stopOtpRetriever({ clearPending: true });
      console.error('Resend error:', error);
      setMessage({ kind: 'error', text: error.response?.data?.message || copy.resendFailed });
    } finally {
      setResendLoading(false);
    }
  };

  if (verified) {
    return (
      <AuthScreen>
        <AuthHeader icon="checkmark-done-outline" title={copy.doneTitle} subtitle={copy.doneText} />
        <OrgCodeCard code={organizationCode} copy={copy} emphasis />
        <SubmitButton title={copy.signIn} icon="forward" onPress={() => navigation.navigate('Login')} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <AuthHeader icon="chatbubble-ellipses-outline" title={copy.title} subtitle={copy.sentTo(phone || '')} />

      <OrgCodeCard code={organizationCode} copy={copy} />

      {!!message && <AuthAlert kind={message.kind}>{message.text}</AuthAlert>}

      <OtpInput value={code} onChangeText={handleCodeChange} invalid={message?.kind === 'error'} disabled={loading} />

      <ResendRow seconds={timer} onResend={handleResendCode} loading={resendLoading} />

      <SubmitButton
        title={i18n.language === 'fa' ? 'تأیید' : 'Verify'}
        icon="checkmark-circle-outline"
        loading={loading}
        disabled={code.length !== 6}
        onPress={handleVerify}
      />
    </AuthScreen>
  );
};

/** The organisation code, large, with a copy button. */
function OrgCodeCard({ code, copy, emphasis }) {
  const dir = useDir();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  const copyCode = async () => {
    await Clipboard.setStringAsync(String(code ?? ''));
    setCopied(true);
  };

  return (
    <View style={[styles.card, emphasis && styles.cardEmphasis, animate('loop-fade-up', '360ms', '100ms')]}>
      <View style={[styles.row, dir.row]}>
        <View style={[styles.flex, dir.start]}>
          <Text style={[styles.label, dir.bold]}>{copy.codeLabel}</Text>
          <Text selectable style={styles.code}>{code}</Text>
        </View>
        <Pressable
          onPress={copyCode}
          accessibilityRole="button"
          style={({ hovered }) => [styles.copy, dir.row, hovered && styles.copyHover, copied && styles.copyDone]}
        >
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? palette.navy900 : palette.gold} />
          <Text style={[styles.copyText, dir.bold, copied && styles.copyTextDone]}>{copied ? copy.copied : copy.copy}</Text>
        </Pressable>
      </View>
      <Text style={[styles.hint, dir.light, dir.align]}>{copy.codeHint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: {
    gap: 8,
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.28)',
  },
  cardEmphasis: { boxShadow: '0 0 40px rgba(255, 215, 0, 0.12)' },
  row: { alignItems: 'center', gap: 14 },
  label: { color: onDark.soft, fontSize: 12.5 },
  code: { color: palette.gold, fontSize: 32, fontFamily: 'VazirBold', letterSpacing: 6, direction: 'ltr' },
  hint: { color: onDark.muted, fontSize: 12, lineHeight: 20 },
  copy: {
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  copyHover: { backgroundColor: 'rgba(255, 215, 0, 0.12)' },
  copyDone: { backgroundColor: palette.gold, borderColor: palette.gold },
  copyText: { color: palette.gold, fontSize: 13 },
  copyTextDone: { color: palette.navy900 },
});

export default OTPVerification;
