/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/Landing.js
 *
 * The splash logo motion, played WITH sound on desktop (the mobile file mutes
 * it on web because browsers block unmuted autoplay; the Electron window
 * allows it — `autoplayPolicy` in electron/main.js). The background music is
 * held while the logo motion plays so the two never overlap, and starts once
 * the splash is gone. Same data flow as the mobile file: the same requests,
 * auth check, timeouts and navigation.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
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
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useEvent } from 'expo';
import { getSmsHash } from '@screens/auth/OtpRetriever';
import { setHashApp } from '@slices/hashAppSlice';
import { holdBackgroundMusic } from '@desktop/backgroundMusic';

// اگر ویدیوی اسپلش اصلاً شروع به پخش نکند (کدک، شبکه، autoplay) کاربر برای
// همیشه روی صفحه‌ی سیاه می‌ماند. این سقف فقط تا «شروع پخش» است.
//
// قبلاً همین ۶ ثانیه از لحظه‌ی mount شمرده می‌شد، در حالی که لوگوموشن ۸ ثانیه
// است؛ پس روی همه‌ی دستگاه‌ها ویدیو وسط پخش قطع می‌شد. حالا بعد از شروع پخش،
// سقف دوباره از روی مدت واقعی ویدیو تنظیم می‌شود (پایین‌تر، اثرِ isPlaying).
const SPLASH_START_TIMEOUT_MS = 6000;

// مدت لوگوموشن، وقتی player هنوز duration را گزارش نکرده است.
const SPLASH_VIDEO_FALLBACK_S = 8;

// حاشیه‌ی بعد از پایان ویدیو برای رسیدن رویداد playToEnd؛ فقط اگر آن رویداد
// نرسد، این تایمر ادامه می‌دهد.
const SPLASH_END_GRACE_MS = 1500;

// سقفِ مطلق: حتی اگر بررسیِ توکن هم گیر کند (شبکه‌ی کند، تایم‌اوتِ ۱۰ ثانیه‌ای
// axios)، کاربر بعد از این مدت به هر حال وارد صفحه‌ی خانه می‌شود.
const SPLASH_MAX_MS = 20000;

export default function Landing({ navigation }) {
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);
  // نگهبان‌های تک‌بار-بودن: هم playToEnd و هم تایم‌اوت می‌توانند مسیر را ادامه دهند.
  const startedRef = React.useRef(false);
  const settledRef = React.useRef(false);
  const fallbackTimerRef = React.useRef(null);
  const playbackArmedRef = React.useRef(false);
  const player = useVideoPlayer(require('@assets/video/InShot_20260626_171217014.mp4'), player => {
    console.log("player ready");
    // desktop: the logo motion plays with its sound (not muted like mobile web)
    player.muted = false;
    player.play();
  });

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

      if (authStatus.authenticated) {
        dispatch(setToken(authStatus.token));
        dispatch(fetchAddresses(authStatus.token));
        await dispatch(fetchUser(authStatus.token));
        if (authStatus.user) {
          if (authStatus.user?.account_type !== 'individual') {
            dispatch(setUserType('organization'))
          } else {
            dispatch(setUserType('individual'))
          }
          navigateToMainApp();
        } else {
          const userResult = await dispatch(fetchUser(authStatus.token));
          if (userResult?.payload?.account_type !== 'individual') {
            dispatch(setUserType('organization'))
          } else {
            dispatch(setUserType('individual'))
          }

          if (fetchUser.fulfilled.match(userResult)) {
            navigateToMainApp();
          } else {
            navigateToWelcome();
          }
        }
      } else {
        navigateToWelcome();
      }

    } catch (error) {
      navigateToWelcome();
    }
  };

  // مقصد بعد از اسپلش. هر دو مسیر از این می‌گذرند تا فقط یک بار جابه‌جایی رخ دهد.
  //
  // Both auth branches funnel through here so the "settle once" guard covers
  // them equally — `playToEnd` and either timeout can all reach this point.
  const settle = (routeName) => {
    if (settledRef.current) return;
    settledRef.current = true;
    setChecking(false);
    navigation.replace(routeName);
  };

  // یک شروعِ واردشده از اسپلش «خوش آمدید» رد می‌شود و بعد روی منوی چهارگزینه‌ای
  // (`OrderMenuScreen`) می‌نشیند — سفارش سیستماتیک / سفارش فوری / هوش مصنوعی /
  // سازمانی و شرکتی.
  //
  // A signed-in cold start goes through the `Welcome` splash, which then lands
  // on `OrderMenuScreen` — the four-way entry menu.
  //
  // `Welcome` had been orphaned: it is the only screen that navigates to
  // `OrderMenuScreen`, and nothing navigated to *it*, so the whole entry menu
  // (and the organisation login behind it) was unreachable from a cold start.
  // `Welcome` re-checks the session itself before choosing where to go, so the
  // signed-out case stays covered even if the token is dropped in between.
  const navigateToMainApp = () => settle('Welcome');

  // کاربر خارج‌شده هم به همان اسپلش و منوی ورودی می‌رود — آنجا هر دو مسیر ورود
  // (مشتری و سازمانی) در دسترس است.
  //
  // A signed-out visitor goes to the same place: the entry menu is public and
  // is where both sign-in paths start.
  //
  // The hazard this branch was split to avoid was sending an unauthenticated
  // user to `List` — a signed-in UI whose every request then went out with no
  // Authorization header, and whose 401s `axiosConfig` swallows precisely
  // because they carried no token. `OrderMenuScreen` is not that: it makes no
  // authenticated request at all, so routing a guest there reintroduces
  // nothing.
  const navigateToWelcome = () => settle('Welcome');


  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      // ۲. بعد از اتمام ویدیو به صفحه بعد بروید
      checkAuthenticationStatus();
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

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

  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status, error }) => {

      console.log('Player status changed: ', error);
    });

    return () => {
      subscription.remove();
    };
  }, []);
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // به محض شروع پخش، سقف «شروع نشد» را با «باقی‌مانده‌ی ویدیو + حاشیه» عوض
  // می‌کنیم تا لوگوموشن کامل پخش شود و فقط اگر playToEnd نرسید، ادامه دهیم.
  useEffect(() => {
    if (!isPlaying || playbackArmedRef.current || settledRef.current) return;
    playbackArmedRef.current = true;
    const duration = player.duration > 0 ? player.duration : SPLASH_VIDEO_FALLBACK_S;
    const remaining = Math.max(0, duration - (player.currentTime || 0));
    armFallback(remaining * 1000 + SPLASH_END_GRACE_MS);
  }, [isPlaying, player]);


  useEffect(() => {
    if (Platform.OS === 'web' && !isPlaying && player) {
      player.play();


    }
  }, [player, isPlaying])

  return (
    <View style={styles.root}>
      <CustomStatusBar />
      <LinearGradient colors={SPLASH_GRADIENT} style={StyleSheet.absoluteFill} />

      {/* کادر ویدیو دقیقاً هم‌اندازه‌ی صفحه است و `cover` خودش تصویر را وسط
          نگه می‌دارد — پس روی هر نسبت‌تصویری تمام‌صفحه و بدون نوار سیاه است.
          اندازه از `useWindowDimensions` حساب نمی‌شود: آن عدد روی اندروید
          (edge-to-edge، نوار وضعیت/ناوبری، حالت چندپنجره‌ای) با اندازه‌ی واقعی
          این کادر یکی نیست و همان اختلاف بود که ویدیو را روی بعضی گوشی‌ها از
          بالا و پایین می‌برید.

          The box is the screen, and `cover` does the centring itself, so the
          video fills any aspect ratio with nothing letterboxed. Deriving a size
          from `useWindowDimensions` is what cropped it on some devices: on
          Android that number does not always match this view's real height
          (edge-to-edge insets, split screen), so the computed box overflowed. */}
      <VideoView
        style={styles.video}
        nativeControls={false}
        player={player}
        contentFit="cover"
      />
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
  // عرض/ارتفاعِ صریح، نه فقط `StyleSheet.absoluteFill`.
  //
  // روی وب این استایل مستقیم روی خودِ تگ `<video>` می‌نشیند، و `<video>` یک
  // replaced element است: طبق CSS، وقتی `width`/`height` برابر `auto` باشند
  // (چیزی که absoluteFill تنها با top/left/right/bottom باقی می‌گذارد) مرورگر
  // ابعادِ ذاتیِ فایل را به کار می‌برد — یعنی ۷۲۰×۱۲۸۰ پیکسل. روی پنجره‌ی
  // کوچکِ موبایل این از صفحه بیرون می‌زد و `#root` (که `overflow: auto` دارد)
  // اسکرول افقی و عمودی نشان می‌داد. با `100%` این اتفاق نمی‌افتد و روی نیتیو
  // هم دقیقاً همان absoluteFill است.
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
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