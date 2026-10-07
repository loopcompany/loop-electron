/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/auth/RegistrationVerificationScreen.js
 *
 * The customer's one-time code step redrawn for the desktop glass card
 * (@desktop/AuthKit): six code cells backed by one input (typing and pasting
 * both work), the number it was sent to with a way back to correct it, and
 * the resend countdown.
 *
 * State, the verify / resend requests and the auto-submit on the sixth digit
 * are the mobile file's. Differences: the Android SMS auto-fill subscription
 * is left out (it only ever ran on Android), the success toast is dropped (the app moves
 * on), "code resent" shows in the card, and "edit number" goes straight back
 * instead of asking in a browser `confirm()`.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import { authAPI } from '@services/Api';
import TokenManager from '@services/TokenManager';
import { setToken, setUserType } from '@slices/authSlice';
import { resetToHome } from '@navigation/homeRoute';
import { fetchUser } from '@slices/userSlice';
import { restartOtpRetriever, stopOtpRetriever } from './OtpRetriever';

import {
  AuthAlert,
  AuthFooter,
  AuthHeader,
  AuthScreen,
  OtpInput,
  ResendRow,
  SubmitButton,
} from '@desktop/AuthKit';

const COPY = {
  fa: {
    title: 'تأیید شماره موبایل',
    sentTo: (phone) => `کد ۶ رقمی پیامک‌شده به ${phone} را وارد کنید.`,
    wrongNumber: 'شماره اشتباه است؟',
    edit: 'ویرایش شماره',
    resent: 'کد تازه ارسال شد.',
  },
  en: {
    title: 'Verify your mobile',
    sentTo: (phone) => `Enter the 6-digit code we texted to ${phone}.`,
    wrongNumber: 'Wrong number?',
    edit: 'Edit number',
    resent: 'A new code is on its way.',
  },
};

const normalizeVerificationCode = value => String(value || '')
  .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/\D/g, '')
  .slice(0, 6);

export default function RegistrationVerificationScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];
  const dispatch = useDispatch();
  const { phone, userData } = route.params || {};

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [timer, setTimer] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);

  // Timer for resend code
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleVerificationCodeChange = value => {
    setError('');
    setVerificationCode(normalizeVerificationCode(value));
  };

  const handleVerifyCode = async () => {
    if (loading) return;
    if (verificationCode.length !== 6) {
      setError(t('Please enter the complete 6-digit code'));
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      // Use the correct format that matches the API
      const response = await authAPI.verifyPhone({
        phone: phone,

        code: verificationCode
      });

      if (response.success) {
        // Save user token and data
        console.log(response.data);

        if (response.data?.token) {
          // Use TokenManager for consistent token storage
          await TokenManager.saveAuthData(response.data.token, response.data.user);

          // Update Redux store
          dispatch(setToken(response.data.token));
          // مثل LoginScreen: بدون نوع حساب، بقیه‌ی اپ نمی‌دانست این کاربر مشتری است
          // و «خانه» را List (صفحه‌ی سازمانی) حساب می‌کرد.
          dispatch(setUserType('individual'));
          await AsyncStorage.setItem('accountType', 'individual');
          await AsyncStorage.setItem('userType', 'individual');
          dispatch(fetchUser(response.data.token));
        }

        stopOtpRetriever({ clearPending: true });
        // صفحه‌ی اصلی مشتری «انتخاب سیستماتیک» است، نه List.
        resetToHome(navigation, 'individual');
      } else {
        setError(response.message || t('The entered code is not correct!'));
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Verification error:', error);

      let errorMessage = t('Error verifying code. Please try again');

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.errors) {
          // Handle Laravel validation errors
          const validationErrors = Object.values(errorData.errors).flat();
          errorMessage = validationErrors[0] || errorMessage;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        // Show specific error for 422
        if (error.response?.status === 422) {
          errorMessage = errorMessage || t('The entered information is incorrect');
        }
      }

      setError(errorMessage);
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verificationCode.length === 6 && !loading) {
      handleVerifyCode();
    }
  }, [verificationCode]);

  const handleResendCode = async () => {
    if (!canResend) return;

    setLoading(true);
    setNotice('');
    try {
      try {
        await restartOtpRetriever();
      } catch (otpError) {
        console.log('SMS Retriever restart error:', otpError);
      }

      const response = await authAPI.resendCode(phone);

      if (response.success) {
        setTimer(120);
        setCanResend(false);
        setError('');
        setNotice(copy.resent);
      } else {
        stopOtpRetriever({ clearPending: true });
        setError(response.message || t('Error resending code'));
      }
    } catch (error) {
      stopOtpRetriever({ clearPending: true });
      console.error('Resend code error:', error);

      let errorMessage = t('Error resending code');

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.errors) {
          // Handle Laravel validation errors
          const validationErrors = Object.values(errorData.errors).flat();
          errorMessage = validationErrors[0] || errorMessage;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMobile = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('MainSignIn');
  };

  return (
    <AuthScreen>
      <AuthHeader icon="chatbubble-ellipses-outline" title={copy.title} subtitle={copy.sentTo(phone || '')} />

      {!!error && <AuthAlert kind="error">{error}</AuthAlert>}
      {!!notice && !error && <AuthAlert kind="success">{notice}</AuthAlert>}

      <OtpInput
        value={verificationCode}
        onChangeText={handleVerificationCodeChange}
        invalid={!!error}
        disabled={loading}
      />

      <ResendRow seconds={canResend ? 0 : timer} onResend={handleResendCode} loading={loading && canResend} />

      <SubmitButton
        title={t('Confirm')}
        icon="checkmark-circle-outline"
        loading={loading}
        disabled={verificationCode.length !== 6}
        onPress={handleVerifyCode}
      />

      <AuthFooter text={copy.wrongNumber} link={copy.edit} onPress={handleEditMobile} disabled={loading} />
    </AuthScreen>
  );
}
