import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { titleBarHeight } from './Breakpoints';
import { chrome } from './desktopTheme';
import { colors } from '@theme/Color';
import { fontSize, getFontFamily } from '@theme/Typography';

/**
 * True when the main process hid the native frame and drew only the window
 * buttons over the page (`titleBarOverlay`, Windows). The app then has to
 * draw the rest of the title bar itself.
 */
export const hasCustomTitleBar = () =>
  typeof window !== 'undefined' && window.loopDesktop?.titleBar === 'overlay';

const overlay = () => (typeof navigator !== 'undefined' ? navigator.windowControlsOverlay : undefined);

/**
 * Where the window buttons are, so the bar's content never slides under them.
 * They are on the right on Windows whatever the app language. Hidden in
 * fullscreen (F11), where the bar goes away too.
 */
function useWindowControlsInset() {
  const read = () => {
    const wco = overlay();
    if (!wco) return { visible: true, left: 0, right: 0 };
    const rect = wco.getTitlebarAreaRect();
    return {
      visible: wco.visible,
      left: rect.x,
      right: Math.max(0, window.innerWidth - rect.x - rect.width),
    };
  };

  const [inset, setInset] = useState(read);

  useEffect(() => {
    const wco = overlay();
    if (!wco) return undefined;
    const update = () => setInset(read());
    wco.addEventListener('geometrychange', update);
    window.addEventListener('resize', update);
    return () => {
      wco.removeEventListener('geometrychange', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return inset;
}

/**
 * The strip across the top of the window on Windows: app name, the current
 * page, and the native minimise / maximise / close buttons (drawn by Windows
 * over the reserved space). The whole strip drags the window; that is wired
 * in CSS (`#loop-titlebar` in electron/main.js) because React Native Web has
 * no style for `-webkit-app-region`.
 *
 * @param {object} props
 * @param {string} [props.pageTitle]
 * @param {string} props.appName
 * @param {string} props.lang
 */
export default function DesktopTitleBar({ pageTitle, appName, lang }) {
  const { visible, left, right } = useWindowControlsInset();
  if (!visible) return null;

  const rtl = lang === 'fa';

  return (
    <View
      nativeID="loop-titlebar"
      style={[
        styles.bar,
        { flexDirection: rtl ? 'row-reverse' : 'row', paddingLeft: left + 12, paddingRight: right + 12 },
      ]}
    >
      <View style={[styles.brand, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Image source={require('@assets/images/start.png')} style={styles.logo} />
        <Text style={[styles.appName, { fontFamily: getFontFamily('bold', lang) }]}>{appName}</Text>
      </View>
      {!!pageTitle && (
        <>
          <View style={styles.separator} />
          <Text
            style={[styles.pageTitle, { fontFamily: getFontFamily('light', lang) }]}
            numberOfLines={1}
          >
            {pageTitle}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: titleBarHeight,
    alignItems: 'center',
    gap: 10,
    backgroundColor: chrome.titleBar,
    borderBottomWidth: 1,
    borderBottomColor: chrome.sidebarBorder,
  },
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  appName: {
    color: colors.white.color,
    fontSize: fontSize.xs + 1,
  },
  separator: {
    width: 1,
    height: 14,
    backgroundColor: colors.white.bgColor(0.2),
  },
  pageTitle: {
    flexShrink: 1,
    color: colors.white.bgColor(0.72),
    fontSize: fontSize.xs + 1,
  },
});
