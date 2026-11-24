/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/Landing.js
 *
 * Electron permits audible autoplay. The video owns its mute control and holds
 * the dashboard music until it finishes. Playback events drive navigation.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useDispatch } from 'react-redux';

import { setToken, setUserType } from '@slices/authSlice';
import { fetchUser } from '@slices/userSlice';
import TokenManager from '@services/TokenManager';
import CustomStatusBar from '@components/CustomStatusBar';
import { themeColor0, themeColor10 } from '@theme/Color';
import { fetchAddresses } from '@slices/addressSlice';
import { ImageBackground } from 'expo-image';
import { fetchRadii } from '@slices/radiusSlice';
import i18n from 'i18next';
import { setLanguage } from '@slices/languageSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPdfDocs } from '@slices/pdfDocumentSlice';
import { fetchMinPrice } from '@slices/minPriceSlice';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { getSmsHash } from '@screens/auth/OtpRetriever';
import { setHashApp } from '@slices/hashAppSlice';
import { holdBackgroundMusic } from '@desktop/backgroundMusic';

// اگر ویدیوی اسپلش اصلاً شروع به پخش نکند (کدک، شبکه، autoplay) کاربر برای
// همیشه روی صفحه‌ی سیاه می‌ماند. این سقف فقط تا «شروع پخش» است.
//
// قبلاً همین ۶ ثانیه از لحظه‌ی mount شمرده می‌شد، در حالی که لوگوموشن ۸ ثانیه
// است؛ پس روی همه‌ی دستگاه‌ها ویدیو وسط پخش قطع می‌شد. حالا بعد از شروع پخش،
// سقف دوباره از روی مدت واقعی ویدیو تنظیم می‌شود.
const SPLASH_START_TIMEOUT_MS = 10000;

// مدت لوگوموشن، وقتی player هنوز duration را گزارش نکرده است.
const SPLASH_VIDEO_FALLBACK_S = 8;

// حاشیه‌ی بعد از پایان ویدیو برای رسیدن رویداد playToEnd؛ فقط اگر آن رویداد
// نرسد، این تایمر ادامه می‌دهد.
const SPLASH_END_GRACE_MS = 3500;

// سقفِ مطلق: حتی اگر بررسیِ توکن هم گیر کند (شبکه‌ی کند، تایم‌اوتِ ۱۰ ثانیه‌ای
// axios)، کاربر بعد از این مدت به هر حال وارد صفحه‌ی خانه می‌شود.
const SPLASH_MAX_MS = 25000;
const splashSource = Asset.fromModule(require('@desktop/assets/logo-motion-landscape.mp4')).uri;
const fullVideo = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

export default function Landing({ navigation }) {
  const dispatch = useDispatch();
  const mountedRef=React.useRef(true);
  useEffect(()=>{mountedRef.current=true;return()=>{mountedRef.current=false;};},[]);
  const [logoMuted, setLogoMuted] = useState(false);
  // نگهبان‌های تک‌بار-بودن: هم playToEnd و هم تایم‌اوت می‌توانند مسیر را ادامه دهند.
  const startedRef = React.useRef(false);
  const settledRef = React.useRef(false);
  const fallbackTimerRef = React.useRef(null);
  const backdropRef = React.useRef(null);
  const backdropFrameRef = React.useRef(null);
  const videoRef = React.useRef(null);
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (backdropFrameRef.current !== null) video?.cancelVideoFrameCallback?.(backdropFrameRef.current);
    };
  }, []);

  // background music waits until the splash (and its sound) is over
  useEffect(() => holdBackgroundMusic(), []);
  // Check authentication on component mount
  useEffect(() => {

    dispatch(fetchRadii())
    dispatch(fetchPdfDocs())
    dispatch(fetchMinPrice())

  }, []);
  
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // getSmsHash() resolves to [] where the native module isn't linked
    // (Expo Go) instead of throwing, so no guard is needed here.
    getSmsHash().then(hashes => {
      dispatch(setHashApp(hashes))
      console.log('SMS hashes:', hashes);
    });
  }, []);

  const checkAuthenticationStatus = async () => {
    // هم رویداد پایان ویدیو و هم تایم‌اوت می‌توانند این را صدا بزنند؛ فقط یک بار اجرا شود.
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      // Use TokenManager to check authentication
      const authStatus = await TokenManager.isAuthenticated();

      if (!mountedRef.current) return;
      if (!authStatus.authenticated) {navigateToWelcome(); return;}
      dispatch(setToken(authStatus.token));
      dispatch(fetchAddresses(authStatus.token));
      const result=await dispatch(fetchUser(authStatus.token));
      if (!mountedRef.current) return;
      // Temporary network failures preserve an existing session. An actual 401
      // removes the token through the shared interceptor/TokenManager.
      if ((await TokenManager.getToken()) !== authStatus.token) {navigateToWelcome(); return;}
      const profile=fetchUser.fulfilled.match(result) ? result.payload : authStatus.user;
      const storedType=await AsyncStorage.getItem('userType');
      const accountType=profile?.account_type;
      dispatch(setUserType(accountType ? (['individual','indiviual'].includes(accountType)?'individual':'organization') : (storedType || 'individual')));
      navigateToMainApp();

    } catch (error) {
      navigateToWelcome();
    }
  };

  // مقصد بعد از اسپلش. هر دو مسیر از این می‌گذرند تا فقط یک بار جابه‌جایی رخ دهد.
  //
  // Both auth branches funnel through here so the "settle once" guard covers
  // them equally — `playToEnd` and either timeout can all reach this point.
  const settle = (routeName) => {
    if (settledRef.current || !mountedRef.current) return;
    settledRef.current = true;
    navigation.replace(routeName);
  };

  // Signed-in sessions open the dashboard; guests retain both sign-in paths.
  const navigateToMainApp = () => settle('List');
  const navigateToWelcome = () => settle('Welcome');


  // Fallback: never let a video that refuses to play (or never emits
  // `playToEnd`) strand the user on the splash screen.
  const armFallback = (ms) => {
    clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      if (!settledRef.current) {
        console.warn('[Landing] splash video did not finish in time — continuing');
        checkAuthenticationStatus();
      }
    }, ms);
  };

  useEffect(() => {
    armFallback(SPLASH_START_TIMEOUT_MS);

    // اگر بررسیِ توکن هم طول بکشد، مقصد را از روی *وجودِ* توکن انتخاب می‌کنیم،
    // نه از روی نتیجه‌ی تأییدِ آن؛ کاربری که توکن دارد نباید به‌خاطر کندیِ شبکه
    // دوباره به صفحه‌ی ورود فرستاده شود.
    //
    // If the auth check itself overruns, pick the destination from whether a
    // token *exists*, not from whether it was verified. A user who has a stored
    // token is signed in as far as this screen is concerned: bouncing them to
    // the login page because the network was slow is exactly the regression
    // this splash screen must not cause. Entering the app is safe here because
    // nothing downstream trusts this decision — `RequireAuth` still gates every
    // guarded route, and the 401 interceptor still raises the session-expiry
    // sheet the moment a real request proves the token is dead.
    //
    // settle() با settledRef محافظت شده، پس اگر بررسیِ توکن زودتر تمام شود این
    // فراخوانی بی‌اثر است.
    const hardTimer = setTimeout(async () => {
      if (settledRef.current) return;

      const storedToken = await TokenManager.getToken();
      console.warn(
        `[Landing] auth check exceeded budget — continuing as ${storedToken ? 'signed in' : 'guest'}`
      );

      if (storedToken) navigateToMainApp();
      else navigateToWelcome();
    }, SPLASH_MAX_MS);

    return () => {
      clearTimeout(fallbackTimerRef.current);
      clearTimeout(hardTimer);
    };
  }, []);

  const handleProgress = ({ currentTarget: video }) => {
    if (!video.currentTime || settledRef.current) return;
    const duration = Number.isFinite(video.duration) ? video.duration : SPLASH_VIDEO_FALLBACK_S;
    const remaining = Math.max(0, duration - video.currentTime);
    armFallback(remaining * 1000 + SPLASH_END_GRACE_MS);
    if (!video.requestVideoFrameCallback && backdropRef.current) {
      const canvas = backdropRef.current;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  };

  const drawBackdrop = ({ currentTarget: video }) => {
    if (!video.requestVideoFrameCallback || backdropFrameRef.current !== null) return;
    const canvas = backdropRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    const draw = () => {
      if (!mountedRef.current || settledRef.current || video.ended) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      backdropFrameRef.current = video.requestVideoFrameCallback(draw);
    };
    backdropFrameRef.current = video.requestVideoFrameCallback(draw);
  };



  return (
    <View style={styles.root}>
      <CustomStatusBar />
      <LinearGradient colors={SPLASH_GRADIENT} style={StyleSheet.absoluteFill} />

      {/* Preserve the complete landscape clip; the blurred backdrop fills window margins. */}
      <canvas
        ref={backdropRef}
        width={480}
        height={270}
        aria-hidden="true"
        style={{ ...fullVideo, objectFit: 'cover', filter: 'blur(34px)', transform: 'scale(1.12)', opacity: 0.85 }}
      />
      <video
        ref={videoRef}
        src={splashSource}
        autoPlay
        playsInline
        muted={logoMuted}
        onPlaying={drawBackdrop}
        onTimeUpdate={handleProgress}
        onEnded={checkAuthenticationStatus}
        onError={checkAuthenticationStatus}
        style={{ ...fullVideo, objectFit: 'contain' }}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={logoMuted ? "پخش صدای لوگوموشن" : "قطع صدای لوگوموشن"} onPress={() => setLogoMuted((value) => !value)} style={{ position: "absolute", bottom: 24, right: 24, padding: 12, backgroundColor: "#17334f", borderRadius: 12 }}><Text style={{color:"#fff"}}>{logoMuted ? "🔇" : "🔊"}</Text></Pressable>
    </View>
  );
}

// رنگ‌های اختصاصی اسپلش (در پالت theme/Color.js معادل ندارند).
const SPLASH_GRADIENT = ['#1c2833', '#0b0d11', '#0b0d11'];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_GRADIENT[1],
    // اسپلش هیچ‌وقت نباید اسکرول شود؛ این هر سرریزِ احتمالی را می‌برد.
    overflow: 'hidden',
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  spinner: {
    marginBottom: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'VazirBold',
    textAlign: 'center',
  },
  subText: {
    color: themeColor10.bgColor(0.8),
    fontSize: 14,
    fontFamily: 'VazirLight',
    textAlign: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 5,
    marginBottom: 40,
  },
  appName: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'VazirBold',
    textAlign: 'center',
  },
  appTagline: {
    color: themeColor10.bgColor(0.9),
    fontSize: 14,
    fontFamily: 'VazirLight',
    textAlign: 'center',
  },
});
