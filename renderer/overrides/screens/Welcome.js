/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/Welcome.js
 *
 * The greeting shown every time the app opens, full-window on the Loop
 * wallpaper: «صبح / ظهر / عصر / شب بخیر» by Iran's clock, «به جوهر
 * آینده (لوپ) خوش آمدید» and the tagline, with a thin line filling up until
 * the entry menu takes over. Same data flow as the mobile file: waits for
 * `auth.isRestored`, then replaces itself with `OrderMenuScreen` after 4 s;
 * fetches the contacts.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { fetchContacts } from "@slices/contactSlice";
import { useDispatch, useSelector } from "react-redux";

import AppWallpaper from '@desktop/Wallpaper';
import { brandCopy, useTimeGreeting } from '@desktop/brandCopy';
import { onDark, palette } from '@desktop/desktopTheme';
import { animate } from '@desktop/globalStyles';
import { useDir } from '@desktop/ui';

// same wait as the mobile screen before the entry menu
const WELCOME_MS = 4000;

export default function Welcome({ navigation }) {
  useTranslation();
  const dir = useDir();
  const copy = brandCopy(dir.lang);
  const greeting = useTimeGreeting(dir.lang);
  const dispatch = useDispatch();
  const isRestored = useSelector((state) => state.auth.isRestored);

  // این صفحه هم مقصدِ بعد از اسپلش است و هم مقصدِ بعد از خروج از حساب، و در هر
  // دو حالت به منوی ورودی می‌رود — چون همان منو است که هر دو مسیر ورود (مشتری و
  // سازمانی) از آن باز می‌شوند.
  //
  // `isRestored` is still waited on: `token: null` means "not read yet" as much
  // as "signed out" on a cold start, and the menu's own contents do not depend
  // on it, but anything downstream does.
  useEffect(() => {
    if (!isRestored) return undefined;

    const timer = setTimeout(() => {
      navigation.replace('OrderMenuScreen');
    }, WELCOME_MS);

    return () => clearTimeout(timer);
  }, [isRestored, navigation]);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [])

  return (
    <View style={styles.root}>
      <AppWallpaper />
      <View pointerEvents="none" style={styles.shade} />

      <View style={styles.center}>
        <Image
          source={require("@assets/logo.png")}
          style={[styles.logo, animate('loop-pop', '600ms')]}
          resizeMode="contain"
        />
        <Text style={[styles.greeting, dir.bold, animate('loop-fade-up', '600ms', '200ms')]}>
          {greeting}
        </Text>
        <Text style={[styles.welcome, dir.bold, animate('loop-fade-up', '650ms', '420ms')]}>
          {copy.welcome}
        </Text>
        <Text style={[styles.tagline, dir.light, animate('loop-fade-up', '650ms', '640ms')]}>
          {copy.tagline}
        </Text>

        <View style={[styles.track, animate('loop-fade-in', '400ms', '800ms')]}>
          {isRestored && <View style={[styles.bar, dir.rtl ? styles.barRtl : styles.barLtr]} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.navy950, overflow: 'hidden' },
  // darker in the middle, where the text sits, so it reads over the planet
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage:
      'radial-gradient(60% 55% at 50% 50%, rgba(4, 15, 31, 0.72) 0%, rgba(4, 15, 31, 0.45) 60%, rgba(4, 15, 31, 0.2) 100%)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 14,
  },
  logo: { width: 220, height: 110, marginBottom: 8 },
  greeting: {
    color: palette.gold,
    fontSize: 34,
    lineHeight: 52,
    textAlign: 'center',
    textShadow: '0 0 24px rgba(255, 215, 0, 0.35)',
  },
  welcome: {
    color: onDark.text,
    fontSize: 42,
    lineHeight: 64,
    textAlign: 'center',
    textShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
  },
  tagline: {
    color: onDark.soft,
    fontSize: 19,
    lineHeight: 32,
    textAlign: 'center',
  },
  track: {
    width: 220,
    height: 3,
    marginTop: 26,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  bar: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
    backgroundImage: 'linear-gradient(90deg, #ffe45c 0%, #ffd700 50%, #e9b308 100%)',
    ...animate('loop-progress', `${WELCOME_MS}ms`),
    animationTimingFunction: 'linear',
    animationFillMode: 'both',
  },
  barRtl: { transformOrigin: 'right center' },
  barLtr: { transformOrigin: 'left center' },
});
