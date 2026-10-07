/**
 * DESKTOP OVERRIDE of loop-customer-mobile/styles/NewStyles.js
 *
 * The shared stylesheet ~130 mobile screens and components are built from.
 * Same keys, same language handling; a handful of values are retuned so the
 * screens that are not individually redesigned still read as part of the
 * desktop app (@desktop/desktopTheme, always its light values — the phone
 * screens paint light colours of their own, so they stay light in dark mode):
 *   - container: the calm page surface instead of the phone's light blue
 *   - shadow: a soft, neutral desktop shadow instead of the navy glow
 *   - border10 / border5: the desktop corner radii
 *   - textInput: white field with a hairline border
 *   - whiteButton / strip: desktop surfaces
 * Everything else is the mobile file verbatim.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { StyleSheet, Platform, Dimensions } from "react-native";
import i18n from "i18next";
import { elevation, light } from "@desktop/desktopTheme";
import {
  themeColor0,
  themeColor1,
  themeColor2,
  themeColor3,
  themeColor4,
  themeColor5,
  themeColor6,
  themeColor7,
  themeColor8,
  themeColor9,
  themeColor10,
  themeColor11,
  themeColor14,
} from "@theme/Color";

export const { width: deviceWidth, height: deviceHeight } =
  Dimensions.get("window");
export const CELL_SIZE = 45;
export const CELL_BORDER_RADIUS = Platform.OS === "ios" ? 8 : 0;
export const DEFAULT_CELL_BG_COLOR = themeColor1.bgColor(1);
export const NOT_EMPTY_CELL_BG_COLOR = themeColor0.bgColor(1);
export const ACTIVE_CELL_BG_COLOR = themeColor1.bgColor(1);

export const gradientColors = [
  themeColor0.bgColor(1),
  themeColor0.bgColor(0.7),
  themeColor0.bgColor(0.5),
  themeColor0.bgColor(0.2),
  themeColor1.bgColor(0.2),
  themeColor1.bgColor(0.5),
  themeColor1.bgColor(0.8),
  themeColor1.bgColor(1),
];
const RTL_LANGS = new Set(['fa', 'ar', 'he', 'ur', 'ps', 'ckb']);

const langIsRTL = (lang) => (lang || '').toLowerCase().split('-')[0] && RTL_LANGS.has((lang || '').toLowerCase().split('-')[0]);


const styleCache = new Map();

const buildStyles = (lang) => {

  return (
    StyleSheet.create({
      selectBox: {
        height: 50,
        alignItems: "center",
        justifyContent: "center",
      },
      spacing: {
        paddingVertical: '5%',
        paddingHorizontal: '5%',
      },
      strip: {
        minHeight: 50,
        width: '100%',
        marginVertical: 10,
        backgroundColor: themeColor0.bgColor(0.08),
        borderRadius: 14,
      },
      seperator: {
        paddingBottom: '5%',
        paddingHorizontal: '5%',
        gap: 20,
        borderBottomWidth: 5,
        borderBottomColor: themeColor3.bgColor(0.2),
      },
      whiteButton: {
        backgroundColor: themeColor4.bgColor(1),
        borderRadius: 100,
        margin: 5,
        padding: 10,
        borderWidth: 1,
        borderColor: light.border,
        boxShadow: elevation.card,
        cursor: 'pointer',
      },
      title6: {
        fontSize: 14,
        fontFamily: 'VazirBold',
        color: themeColor6.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },
      add: {
        padding: 3,
        backgroundColor: themeColor0.bgColor(1),
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center'
      },

      remove: {
        padding: 3,
        borderRadius: 100,
        borderColor: themeColor0.bgColor(1),
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
      },
      seperator1: {
        paddingBottom: '5%',
        paddingHorizontal: '5%',
        gap: 20,
        // borderBottomWidth: 5,
        // borderBottomColor: themeColor3.bgColor(0.2),
      },
      nav: {
        gap: 50,
        paddingHorizontal: '5%',
        backgroundColor: themeColor4.bgColor(0),
        marginBottom: 60
      },
      categoriesWrapper: {
        justifyContent: "flex-start",
        alignItems: "center",
        marginTop: 10,
      },
      wrapper: {
        paddingHorizontal: "5%",
        gap: 10,
        paddingVertical: 20,
      },
      formGroup: {
        marginVertical: 5,
        gap: 10,
      },
      codeFieldRoot: {
        height: 45,
        paddingHorizontal: 20,
        justifyContent: "center",
      },
      button: {
        marginVertical: 20,
        // padding: 15,
        alignItems: "center",
        borderRadius: 5,
      },
      circularWrapper: {
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 10,
      },
      contentContainerStyle: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        gap: 10,
        alignItems: "center",
        justifyContent: "center",
      },
      cell: {
        marginHorizontal: 8,
        height: 45,
        width: 45,
        lineHeight: 45 - 5,
        borderBottomColor: themeColor0.bgColor(1),
        borderBottomWidth: StyleSheet.hairlineWidth,
        ...Platform.select({ web: { lineHeight: 65 } }),
        fontSize: 24,
        textAlign: "center",
        borderRadius: 8,
        borderCurve: "continuous",
        overflow: "hidden",
        color: themeColor0.bgColor(1),
        backgroundColor: "#fff",
      },
      status: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
        // backgroundColor: themeColor0.bgColor(1),
        color: themeColor3.bgColor(1),
        paddingHorizontal: 15,
        paddingVertical: 5,
      },
      logo: {
        width: 200,
        height: 100,
      },
      container: {
        flex: 1,
        backgroundColor: light.cardMuted,
        ...(Platform.OS === 'web' && {
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden',
        }),
      },

      center: {
        alignItems: "center",
        justifyContent: "center",
      },

      rowWrapper: {
        flexDirection: langIsRTL(lang) ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
      },

      row: {
        flexDirection: langIsRTL(lang) ? "row-reverse" : "row",
        alignItems: "center",
      },

      shadow: {
        boxShadow: elevation.card,
      },

      border5: {
        borderRadius: 8,
        borderCurve: "continuous",
        overflow: "hidden",
      },

      border10: {
        borderRadius: 14,
        borderCurve: "continuous",
        // overflow: "hidden",
      },

      border100: {
        borderRadius: 100,
        borderCurve: "continuous",
        overflow: "hidden",
      },

      text: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor0.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      text1: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor1.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      text2: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor2.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      text3: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor3.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      text4: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor4.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      text6: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor6.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      text7: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor7.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      text10: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor10.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },
      text11: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor11.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      title: {
        fontSize: 16,
        fontFamily: langIsRTL(lang) ? "VazirBoldFD" : "VazirBold",
        color: themeColor0.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },
      title1: {
        fontSize: 16,
        fontFamily: langIsRTL(lang) ? "VazirBoldFD" : "VazirBold",
        color: themeColor1.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },
      title3: {
        fontSize: 16,
        fontFamily: langIsRTL(lang) ? "VazirBoldFD" : "VazirBold",
        color: themeColor3.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      title4: {
        fontSize: 16,
        fontFamily: langIsRTL(lang) ? "VazirBoldFD" : "VazirBold",
        color: themeColor4.bgColor(1),
        textAlign: "center",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },
      title7: {
        fontSize: 16,
        fontFamily: langIsRTL(lang) ? "VazirBoldFD" : "VazirBold",
        color: themeColor7.bgColor(1),
        textAlign: "center",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      title10: {
        fontSize: 16,
        fontFamily: langIsRTL(lang) ? "VazirBoldFD" : "VazirBold",
        color: themeColor10.bgColor(1),
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },
      background: {
        position: "absolute",
        zIndex: 1,
        width: "100%",
        top: 0,
        height: 200,
      },
      discountText: {
        fontFamily: langIsRTL(lang) ? "VazirLightFD" : "VazirLight",
        color: themeColor3.bgColor(1),
        textDecorationLine: "line-through",
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
      },

      textInput: {
        backgroundColor: themeColor4.bgColor(1),
        borderWidth: 1,
        borderColor: light.borderStrong,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: "100%",
        textAlign: langIsRTL(lang) ? "right" : "left",
        writingDirection: langIsRTL(lang) ? "rtl" : "ltr",
        // maxWidth: 800,
      },

      profileImage: {
        height: 70,
        wiidth: 70,
        backgroundColor: themeColor4.bgColor(1),
      },

      more: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderColor: themeColor4.bgColor(1),
        borderWidth: 0.2,
      },
    })
  );
}

export const createStyles = (lang) => {
  const key = langIsRTL(lang) ? 'rtl' : 'ltr';
  let sheet = styleCache.get(key);
  if (!sheet) {
    sheet = buildStyles(lang);
    styleCache.set(key, sheet);
  }
  return sheet;
};

const currentLang = () => i18n?.resolvedLanguage ?? i18n?.language ?? 'fa';

/**
 * The default export used to be `createStyles('fa')`, i.e. a sheet frozen to
 * Persian. Around a hundred screens import it directly, so in English they all
 * rendered right-aligned text, `row-reverse` rows and the RTL (`*FD`) fonts.
 *
 * This proxy resolves each style against the *current* i18n language at read
 * time, so those screens follow the language without having to be rewritten to
 * `createStyles(i18n.language)` one by one. Components re-render on language
 * change through `useTranslation()`, which is what re-reads these styles.
 */
export const NewStyles = new Proxy(
  {},
  {
    get: (_target, prop) => createStyles(currentLang())[prop],
    has: (_target, prop) => prop in createStyles(currentLang()),
    ownKeys: () => Reflect.ownKeys(createStyles(currentLang())),
    getOwnPropertyDescriptor: (_target, prop) => {
      const value = createStyles(currentLang())[prop];
      if (value === undefined) return undefined;
      return { value, enumerable: true, configurable: true, writable: false };
    },
  }
);

export default NewStyles;
