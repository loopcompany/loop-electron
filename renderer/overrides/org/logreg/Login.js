/**
 * DESKTOP OVERRIDE of loop-customer-mobile/org/logreg/Login.js
 *
 * The organisation sign-in redrawn for the desktop glass card
 * (@desktop/AuthKit), matching the customer one: personal / organisation
 * switch, labelled fields, "remember" beside "forgot password", the captcha
 * as one control and Enter to submit.
 *
 * State, validation, the request and everything it stores are the mobile
 * file's. Differences: errors show in the form instead of browser `alert()`
 * boxes, a successful sign-in goes straight to the dashboard instead of
 * waiting on a "Login successful — OK" box, and a rejected sign-in gets a
 * fresh captcha.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setToken, setUserType } from '@slices/authSlice';
import { setOrganizationData } from '@slices/organizationSlice';
import { fetchAddresses } from '@slices/addressSlice';
import { emptyUser, fetchUser } from '@slices/userSlice';
import { clearWallet } from '@slices/walletSlice';
import { uri } from '@services/URL';
import { useTranslation } from 'react-i18next';

import {
  AccountSwitch,
  AuthAlert,
  AuthField,
  AuthFields,
  AuthFooter,
  AuthHeader,
  AuthInput,
  AuthScreen,
  CaptchaField,
  CheckRow,
  PasswordInput,
  SplitRow,
  SubmitButton,
  TextLink,
} from '@desktop/AuthKit';

const SAVED_ORG_CODE_KEY = 'savedOrganizationCode';
const SAVED_ORG_PASSWORD_KEY = 'savedOrganizationPassword';

const COPY = {
  fa: {
    eyebrow: 'پنل سازمان‌ها، شرکت‌ها و نهادهای دولتی',
    title: 'ورود سازمانی',
    subtitle: 'با کد سازمانی که پس از ثبت‌نام دریافت کرده‌اید و رمز عبور وارد شوید.',
    codePlaceholder: 'مثلاً ۱۲۳۴۵',
    passwordPlaceholder: 'حداقل ۸ کاراکتر',
    noAccount: 'سازمان شما هنوز ثبت نشده؟',
    signUp: 'ثبت‌نام سازمان',
  },
  en: {
    eyebrow: 'For organisations, companies and government bodies',
    title: 'Organisation sign-in',
    subtitle: 'Sign in with the organisation code you received after registering, and your password.',
    codePlaceholder: 'e.g. 12345',
    passwordPlaceholder: 'At least 8 characters',
    noAccount: 'Organisation not registered yet?',
    signUp: 'Register your organisation',
  },
};

const Login = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];
  const dispatch = useDispatch();
  const [organizationCode, setOrganizationCode] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [securityCode, setSecurityCode] = useState('');

  // Generate random captcha code
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [displayedCaptcha, setDisplayedCaptcha] = useState(generateCaptcha());

  // "Remember password": restore the saved credentials so the form comes back
  // pre-filled. Nothing read these keys before, which is why ticking the box
  // appeared to do nothing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [savedCode, savedPassword] = await Promise.all([
          AsyncStorage.getItem(SAVED_ORG_CODE_KEY),
          AsyncStorage.getItem(SAVED_ORG_PASSWORD_KEY),
        ]);
        if (cancelled || !savedCode) return;
        setOrganizationCode(savedCode);
        if (savedPassword) setPassword(savedPassword);
        setRememberPassword(true);
      } catch (error) {
        console.warn('[Login] could not restore saved credentials', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    // Clear previous errors
    setErrors({});

    // Validation
    const newErrors = {};
    if (!organizationCode) {
      newErrors.organizationCode = t('Organization code is required');
    }

    if (!password) {
      newErrors.password = t('Password is required');
    } else if (password.length < 8) {
      newErrors.password = t('Password must be at least 8 characters');
    }

    // Validate captcha
    if (!securityCode) {
      newErrors.securityCode = t('Security code is required');
    } else if (securityCode.toLowerCase() !== displayedCaptcha.toLowerCase()) {
      newErrors.securityCode = t('Security code is incorrect');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${uri}/organization/login`, {
        organization_code: organizationCode,
        password: password,
      });

      if (response.data.status === 'success') {

        // Save token and user data — the token must always be persisted so the
        // axios interceptors (which read AsyncStorage 'userToken', not Redux) can
        // authenticate subsequent requests. `rememberPassword` only controls
        // whether the org code is pre-filled on the next launch.
        await AsyncStorage.setItem('userToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));

        await AsyncStorage.setItem('organizationData', JSON.stringify(response.data.data.organization));

        await AsyncStorage.setItem('accountType', 'organization');

        await AsyncStorage.setItem('organizationCode', organizationCode);

        // Dispatch to Redux
        dispatch(setToken(response.data.data.token));

        dispatch(setUserType('organization'));

        // Drop whatever account was in `state.user` before, then load this one —
        // the menu and footer dock read the code/name from it.
        dispatch(emptyUser());
        dispatch(clearWallet());
        dispatch(fetchUser(response.data.data.token));

        dispatch(setOrganizationData(response.data.data.organization));
        console.log('📦 [Login] اطلاعات سازمان به Redux ارسال شد:', response.data.data.organization);

        dispatch(fetchAddresses(response.data.data.token));
        console.log('📦 [Login] بارگذاری آدرس‌ها آغاز شد');

        // Persist (or clear) what the "Remember password" box controls. Besides
        // pre-filling the form, ticking it opts the account into the same
        // auto-login flags the customer login uses — without them the next cold
        // start dropped straight back to the login page, which is what made the
        // checkbox look like it did nothing.
        if (rememberPassword) {
          await AsyncStorage.multiSet([
            [SAVED_ORG_CODE_KEY, organizationCode],
            [SAVED_ORG_PASSWORD_KEY, password],
            ['rememberLogin', 'true'],
            ['autoLoginEnabled', 'true'],
          ]);
          console.log('💾 [Login] savedOrganizationCode ذخیره شد');
        } else {
          await AsyncStorage.multiRemove([
            SAVED_ORG_CODE_KEY,
            SAVED_ORG_PASSWORD_KEY,
            'rememberLogin',
            'autoLoginEnabled',
          ]);
        }

        console.log('✅ [Login] تمام اطلاعات با موفقیت ذخیره شد');

        // Clear navigation state from AsyncStorage to ensure fresh start
        try {
          await AsyncStorage.removeItem('NAVIGATION_STATE_V1');
          console.log('🗑️ [Login] Navigation state cleared from AsyncStorage');
        } catch (error) {
          console.error('Error clearing navigation state:', error);
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'List' }],
        });
      }
    } catch (error) {
      console.error('Login error:', error);

      if (error.response) {
        const errorData = error.response.data;

        if (errorData.error === 'organization_not_found') {
          setErrors({ organizationCode: t('Organization code not found') });
        } else if (errorData.error === 'phone_not_verified') {
          setErrors({ notice: t('Phone number is not verified yet. Please verify your phone number first.') });
        } else if (errorData.error === 'invalid_password') {
          setErrors({ password: t('Password is incorrect') });
        } else if (errorData.error === 'account_disabled') {
          setErrors({ general: t('Your account has been disabled. Please contact support') });
        } else {
          setErrors({ general: errorData.message || t('Login error') });
        }
      } else {
        setErrors({ general: t('Error connecting to server. Please check your internet connection') });
      }
      // a failed attempt gets a fresh captcha, like a wrong one would
      setDisplayedCaptcha(generateCaptcha());
      setSecurityCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('OrganizationForgotPassword');
  };

  const clearError = (field) => setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));

  return (
    <AuthScreen>
      <AccountSwitch value="organization" onChange={() => navigation.replace('LoginScreen')} disabled={loading} />

      <AuthHeader eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />

      {!!errors.general && <AuthAlert kind="error">{errors.general}</AuthAlert>}
      {!!errors.notice && <AuthAlert kind="warning">{errors.notice}</AuthAlert>}

      <AuthFields>
        <AuthField label={t('Organization code')} required error={errors.organizationCode}>
          <AuthInput
            icon="business-outline"
            ltr
            value={organizationCode}
            onChangeText={(value) => {
              setOrganizationCode(value);
              clearError('organizationCode');
            }}
            placeholder={copy.codePlaceholder}
            digits
            inputMode="numeric"
            autoComplete="username"
            invalid={!!errors.organizationCode}
            onSubmitEditing={handleLogin}
            autoFocus={!organizationCode}
          />
        </AuthField>

        <AuthField
          label={t('Password')}
          required
          error={errors.password}
          aside={<TextLink title={t('Forgot password?')} onPress={handleForgotPassword} />}
        >
          <PasswordInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearError('password');
            }}
            placeholder={copy.passwordPlaceholder}
            autoComplete="current-password"
            invalid={!!errors.password}
            onSubmitEditing={handleLogin}
          />
        </AuthField>

        <CaptchaField
          uppercase
          code={displayedCaptcha}
          value={securityCode}
          onChangeText={(value) => {
            setSecurityCode(value);
            clearError('securityCode');
          }}
          onRefresh={() => {
            setDisplayedCaptcha(generateCaptcha());
            setSecurityCode('');
          }}
          error={errors.securityCode}
          onSubmitEditing={handleLogin}
        />

        <SplitRow>
          <CheckRow checked={rememberPassword} onChange={setRememberPassword}>
            {t('Remember password')}
          </CheckRow>
        </SplitRow>
      </AuthFields>

      <SubmitButton title={t('Login')} icon="log-in-outline" loading={loading} onPress={handleLogin} />

      <AuthFooter text={copy.noAccount} link={copy.signUp} onPress={() => navigation.navigate('Register')} disabled={loading} />
    </AuthScreen>
  );
};

export default Login;
