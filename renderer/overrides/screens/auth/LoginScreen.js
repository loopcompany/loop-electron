/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/auth/LoginScreen.js
 *
 * The customer sign-in redrawn for the desktop glass card (@desktop/AuthKit):
 * a personal / organisation switch, labelled fields, "remember me" beside
 * "forgot password", the captcha as one control and Enter to submit.
 *
 * State, validation, the request, the saved-login and auto-login effects are
 * the mobile file's. Differences: messages that were `showToastOrAlert`
 * (a blocking `alert()` on the web) show in the form instead, and a
 * successful sign-in goes straight on without one.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useReducer } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from "react-redux";
import { authAPI } from "@services/Api";
import TokenManager from "@services/TokenManager";
import { useTranslation } from "react-i18next";
import { setToken, setUserType } from "@slices/authSlice";
import { fetchUser } from "@slices/userSlice";
import { fetchAddresses } from "@slices/addressSlice";
import { resetToHome } from '@navigation/homeRoute';

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

const COPY = {
  fa: {
    title: 'ورود به حساب لوپ',
    subtitle: 'با شماره موبایل و رمز عبور خود وارد شوید تا سفارش‌هایتان را ثبت و پیگیری کنید.',
    noAccount: 'هنوز حساب ندارید؟',
    signUp: 'ثبت‌نام کنید',
    phonePlaceholder: '۰۹۱۲۳۴۵۶۷۸۹',
    passwordPlaceholder: 'حداقل ۶ کاراکتر',
    attempts: 'تلاش ناموفق',
  },
  en: {
    title: 'Sign in to Loop',
    subtitle: 'Sign in with your mobile number and password to place and track your orders.',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
    phonePlaceholder: '09123456789',
    passwordPlaceholder: 'At least 6 characters',
    attempts: 'Failed attempts',
  },
};

const initialState = {
  phone: '',
  password: '',
  rememberMe: false,
  showPassword: false,
  captchaInput: '',
  captcha: Math.floor(1000 + Math.random() * 9000).toString(),
  errors: {},
  isLoading: false,
  loginAttempts: 0,
  lastAttemptTime: null,
};

const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        errors: { ...state.errors, [action.field]: null }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error }
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'GENERATE_CAPTCHA':
      return {
        ...state,
        captcha: Math.floor(1000 + Math.random() * 9000).toString(),
        captchaInput: ''
      };
    case 'INCREMENT_ATTEMPTS':
      return {
        ...state,
        loginAttempts: state.loginAttempts + 1,
        lastAttemptTime: new Date().getTime()
      };
    case 'RESET_ATTEMPTS':
      return { ...state, loginAttempts: 0, lastAttemptTime: null };
    case 'CLEAR_FORM':
      return { ...initialState, captcha: state.captcha };
    default:
      return state;
  }
};

export default function LoginScreen({ navigation }) {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const reduxDispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];

  // Form validation
  const validateForm = () => {
    const errors = {};

    // Phone validation (11 digits starting with 09)
    if (!state.phone) {
      errors.phone = t('Phone number is required');
    } else if (state.phone.length !== 11 || !/^09\d{9}$/.test(state.phone)) {
      errors.phone = t('Phone number must be 11 digits and start with 09');
    }

    // Password validation
    if (!state.password) {
      errors.password = t('Password is required');
    } else if (state.password.length < 6) {
      errors.password = t('Password must be at least 6 characters');
    }

    // Captcha validation
    if (!state.captchaInput) {
      errors.captchaInput = t('Security code is required');
    } else if (state.captchaInput !== state.captcha) {
      errors.captchaInput = t('Security code is incorrect');
    }

    return errors;
  };

  // Check if user can attempt login (rate limiting)
  const canAttemptLogin = () => {
    if (state.loginAttempts >= 5) {
      const now = new Date().getTime();
      const timeDiff = now - state.lastAttemptTime;
      const minutesPassed = timeDiff / (1000 * 60);

      if (minutesPassed < 15) {
        const remainingMinutes = Math.ceil(15 - minutesPassed);
        dispatch({ type: 'SET_ERROR', field: 'general', error: t('Try again after {{minutes}} minutes', { minutes: remainingMinutes }) });
        return false;
      } else {
        dispatch({ type: 'RESET_ATTEMPTS' });
      }
    }
    return true;
  };

  // Handle login submission
  const handleLogin = async () => {
    if (state.isLoading) return;
    if (!canAttemptLogin()) return;

    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors });
      return;
    }

    dispatch({ type: 'SET_LOADING', isLoading: true });

    try {
      const credentials = {
        phone: state.phone,
        password: state.password,
      };

      const response = await authAPI.login(credentials);

      if (response.success) {
        // Reset login attempts on success
        dispatch({ type: 'RESET_ATTEMPTS' });

        // Save user token and data
        const userData = response.data.user;
        const token = response.data.token;

        await TokenManager.saveAuthData(token, userData);
        console.log('✅ Token and user data saved to AsyncStorage');

        // Save additional data and enable auto-login only if user wants to remember login
        if (state.rememberMe) {
          await AsyncStorage.setItem('savedPhone', state.phone);
          await AsyncStorage.setItem('rememberLogin', 'true');
          await AsyncStorage.setItem('autoLoginEnabled', 'true');
          console.log('✅ Auto-login enabled');
        } else {
          // Remove any previous auto-login settings
          await AsyncStorage.removeItem('savedPhone');
          await AsyncStorage.removeItem('rememberLogin');
          await AsyncStorage.removeItem('autoLoginEnabled');
          console.log('✅ Auto-login disabled');
        }

        // Update Redux store
        reduxDispatch(setToken(token));
        reduxDispatch(setUserType('individual'));

        // Save account type to AsyncStorage for next app launch
        await AsyncStorage.setItem('accountType', 'individual');
        await AsyncStorage.setItem('userType', 'individual');
        console.log('💾 [LoginScreen] accountType و userType ذخیره شد: individual');

        reduxDispatch(fetchUser(token));
        reduxDispatch(fetchAddresses(token));

        // مشتری از «سفارش سیستماتیک» وارد شده؛ صفحه‌ی اصلی او «انتخاب سیستماتیک»
        // است، نه List. reset تا برگشت به صفحه‌ی ورود ممکن نباشد.
        resetToHome(navigation, 'individual');

      } else {
        dispatch({ type: 'INCREMENT_ATTEMPTS' });

        if (response.requires_verification) {
          // Navigate to verification screen
          navigation.navigate('RegistrationVerificationScreen', {
            phone: state.phone,
            isFromLogin: true
          });
        } else {
          dispatch({
            type: 'SET_ERROR',
            field: 'general',
            error: response.message || t('Phone number or password is incorrect')
          });
        }
      }
    } catch (error) {
      console.log('Login error:', error);
      dispatch({ type: 'INCREMENT_ATTEMPTS' });

      let errorMessage = t('Login error. Please try again');

      if (error.response?.status === 401) {
        errorMessage = t('Phone number or password is incorrect');
      } else if (error.response?.status === 403) {
        errorMessage = t('Access denied');
      } else if (error.response?.status === 429) {
        errorMessage = t('Too many requests. Please wait a moment');
      }

      dispatch({ type: 'SET_ERROR', field: 'general', error: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const generateCaptcha = () => {
    dispatch({ type: 'GENERATE_CAPTCHA' });
  };

  // Load saved credentials on component mount
  React.useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const rememberLogin = await AsyncStorage.getItem('rememberLogin');
        const savedPhone = await AsyncStorage.getItem('savedPhone');

        if (rememberLogin === 'true' && savedPhone) {
          dispatch({ type: 'SET_FIELD', field: 'phone', value: savedPhone });
          dispatch({ type: 'SET_FIELD', field: 'rememberMe', value: true });
        }
      } catch (error) {
        console.log('Error loading saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  // Check for auto-login on component mount
  React.useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        // First check if auto-login is explicitly enabled by user
        const autoLoginEnabled = await AsyncStorage.getItem('autoLoginEnabled');

        // Auto-login off simply means "don't sign the user in automatically".
        // It must NOT destroy an existing session: this screen is reachable from
        // the menu and from the org flow, so calling clearAuthData() here logged
        // the user out just for *looking* at the login page — which is exactly
        // the "ذخیره رمز عبور / ذخیره اطلاعات ورود tick logs me out" symptom.
        if (autoLoginEnabled !== 'true') {
          console.log('Auto-login not enabled by user, skipping automatic sign-in');
          return;
        }

        const savedToken = await TokenManager.getToken();

        if (savedToken) {
          // Validate token with backend
          try {
            const response = await authAPI.validateToken(savedToken);
            if (response.success) {
              // Token is valid, auto-login user
              const userData = await TokenManager.getUserData();

              // Update Redux store
              reduxDispatch(setToken(savedToken));
              reduxDispatch(setUserType('individual'));

              // Save account type to AsyncStorage for next app launch
              await AsyncStorage.setItem('accountType', 'individual');
              await AsyncStorage.setItem('userType', 'individual');
              console.log('💾 [LoginScreen Auto-Login] accountType و userType ذخیره شد: individual');

              reduxDispatch(fetchUser(savedToken));

              // صفحه‌ی اصلی مشتری «انتخاب سیستماتیک» است، نه List.
              resetToHome(navigation, 'individual');
              return;
            }
          } catch (error) {
            // Only a definitive "this token is dead" answer from the server may
            // clear the session. A timeout or an offline device is not proof the
            // token is bad, and wiping it there logged people out on a flaky
            // connection.
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
              console.log('Token rejected by server, clearing auto-login:', status);
              await TokenManager.clearAuthData();
            } else {
              console.log('Token validation unreachable, keeping session:', error?.message);
            }
          }
        } else {
          console.log('No token found, clearing auto-login flag');
          // If no token but auto-login is enabled, clear the flag
          await AsyncStorage.removeItem('autoLoginEnabled');
        }
      } catch (error) {
        console.log('Error checking auto-login:', error);
      }
    };

    checkAutoLogin();
  }, []);

  const setField = (field) => (value) => dispatch({ type: 'SET_FIELD', field, value });

  return (
    <AuthScreen>
      <AccountSwitch value="individual" onChange={() => navigation.replace('Login')} disabled={state.isLoading} />

      <AuthHeader title={copy.title} subtitle={copy.subtitle} />

      {!!state.errors.general && <AuthAlert kind="error">{state.errors.general}</AuthAlert>}

      {state.loginAttempts >= 3 && (
        <AuthAlert kind="warning" title={`${copy.attempts}: ${state.loginAttempts}/5`}>
          {t('{{attempts}}/5 failed attempts. Wait 15 minutes after 5 attempts.', { attempts: state.loginAttempts })}
        </AuthAlert>
      )}

      <AuthFields>
        <AuthField label={t('Mobile number')} required error={state.errors.phone}>
          <AuthInput
            icon="phone-portrait-outline"
            ltr
            value={state.phone}
            onChangeText={setField('phone')}
            placeholder={copy.phonePlaceholder}
            digits
            inputMode="tel"
            autoComplete="tel"
            maxLength={11}
            invalid={!!state.errors.phone}
            onSubmitEditing={handleLogin}
            autoFocus={!state.phone}
          />
        </AuthField>

        <AuthField
          label={t('Password')}
          required
          error={state.errors.password}
          aside={<TextLink title={t('Forgot password?')} onPress={handleForgotPassword} />}
        >
          <PasswordInput
            value={state.password}
            onChangeText={setField('password')}
            placeholder={copy.passwordPlaceholder}
            autoComplete="current-password"
            invalid={!!state.errors.password}
            onSubmitEditing={handleLogin}
          />
        </AuthField>

        <CaptchaField
          code={state.captcha}
          value={state.captchaInput}
          onChangeText={setField('captchaInput')}
          onRefresh={generateCaptcha}
          error={state.errors.captchaInput}
          onSubmitEditing={handleLogin}
        />

        <SplitRow>
          <CheckRow checked={state.rememberMe} onChange={setField('rememberMe')}>
            {t('Save login information')}
          </CheckRow>
        </SplitRow>
      </AuthFields>

      <SubmitButton
        title={t('Login')}
        icon="log-in-outline"
        loading={state.isLoading}
        onPress={handleLogin}
      />

      <AuthFooter
        text={copy.noAccount}
        link={copy.signUp}
        onPress={() => navigation.navigate("MainSignIn")}
        disabled={state.isLoading}
      />
    </AuthScreen>
  );
}
