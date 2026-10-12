/**
 * DESKTOP OVERRIDE of loop-customer-mobile/contexts/MenuContext.js
 *
 * Metro serves this file instead of the mobile one in the desktop bundle
 * (see renderer/metro.config.js). It is the mobile file plus the desktop
 * window shell:
 *   - a permanent sidebar (@desktop/DesktopSidebar) instead of the floating
 *     dock + menu modal (the dock code is kept, unreachable, to stay diffable
 *     against the mobile file),
 *   - every screen filling the window; sign-in forms beside a brand panel
 *     (@desktop/screenLayouts, @desktop/DesktopAuthPanel),
 *   - the custom title bar on Windows (@desktop/DesktopTitleBar).
 * Everything else must stay identical to the mobile file. When the mobile
 * file changes, `npm run check:overrides` fails: port the change here, then
 * run `npm run overrides:accept`.
 */
import React, {
    createContext,
    useContext,
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TouchableOpacity,
    Image,
    FlatList,
    Modal,
    Linking,
    TouchableWithoutFeedback,
    Dimensions,
    Animated,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { themeColor0, themeColor10, themeColor13, themeColor4, themeColor1, themeColor12, themeColor8, themeColor6, colors } from '@theme/Color';
import { spacing } from '@theme/Spacing';
import { radius } from '@theme/Radius';
import { fontSize, getFontFamily } from '@theme/Typography';
import { shadow } from '@theme/Shadows';
import { deviceHeight } from '@styles/NewStyles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import useLogout from '@hooks/useLogout';
import { fetchContacts } from '@slices/contactSlice';
import { fetchUser, emptyUser } from '@slices/userSlice';
import { clearWallet, fetchWalletBalance, selectWalletBalance } from '@slices/walletSlice';
import { createStyles } from '@styles/NewStyles';
import { imageUri, mainUri } from '@services/URL';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage } from '@slices/languageSlice';
import { AUTH_ROUTE, requiresAuth } from '@navigation/routes';
import { homeRouteFor, resetToHome } from '@navigation/homeRoute';
import useResponsive from '@desktop/useResponsive';
import DesktopSidebar from '@desktop/DesktopSidebar';
import { authFormWidth, authWideFormWidth, contentGutter, contentMaxWidth, contentTopGap, documentWidth, narrowContentWidth } from '@desktop/Breakpoints';
import { screenLayoutFor } from '@desktop/screenLayouts';
import DesktopTitleBar, { hasCustomTitleBar } from '@desktop/DesktopTitleBar';
import DesktopAuthPanel, { AuthCardBar } from '@desktop/DesktopAuthPanel';
import { CosmicBackdrop } from '@desktop/EntryLayout';
import AppWallpaper from '@desktop/Wallpaper';
import { startBackgroundMusic, toggleBackgroundMusic, useBackgroundMusic } from '@desktop/backgroundMusic';
import { useGlassAuth } from '@desktop/glassAuth';
import { useDocumentFrame } from '@desktop/documentLayout';
import { toggleTheme, useTheme } from '@desktop/theme';
import DesktopTopBar from '@desktop/DesktopTopBar';
import { Cheetah, cheetahFacing } from '@desktop/ui';
import CommandPalette from '@desktop/CommandPalette';
import { usePageMeta } from '@desktop/pageTitle';
import { bandHeight, elevation, gradients, motion, radii, surface } from '@desktop/desktopTheme';
import { injectGlobalStyles } from '@desktop/globalStyles';
import { iconForRoute, shellLabels } from '@desktop/routeMeta';
import { tip } from '@desktop/tooltip';
// Create Context
const MenuContext = createContext();

// account_type های حساب حقیقی (املای غلط 'indiviual' هم از سمت سرور می‌آید)
const INDIVIDUAL_ACCOUNT_TYPES = ['individual', 'indiviual'];
const AnimatedFooterLogoButton = React.memo(({ onPress, logoStyle }) => {
    const idleScaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pressScaleAnim = useRef(new Animated.Value(1)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const motionLoop = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(idleScaleAnim, {
                        toValue: 1.08,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(idleScaleAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        const colorLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(colorAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: false,
                }),
                Animated.timing(colorAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: false,
                }),
            ])
        );

        motionLoop.start();
        colorLoop.start();

        return () => {
            motionLoop.stop();
            colorLoop.stop();
        };
    }, [idleScaleAnim, rotateAnim, colorAnim]);

    const handlePress = useCallback(() => {
        pressScaleAnim.stopAnimation();

        Animated.sequence([
            Animated.timing(pressScaleAnim, {
                toValue: 0.85,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.spring(pressScaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 120,
                useNativeDriver: true,
            }),
        ]).start();

        onPress?.();
    }, [onPress, pressScaleAnim]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-3deg', '3deg'],
    });

    const backgroundColor = colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
            themeColor4.bgColor(1),
            themeColor4.bgColor(0.5),
        ],
    });

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePress}
            style={{
                marginVertical: 5,
                borderRadius: 100,
            }}
        >
            {/* این View فقط برای رنگ است و JS-driven می‌ماند */}
            <Animated.View
                style={{
                    borderRadius: 100,
                    overflow: 'hidden',
                }}
            >
                {/* این View فقط transform دارد و native-driven است */}
                <Animated.View
                    style={{
                        transform: [
                            { scale: idleScaleAnim },
                            { rotate },
                        ],
                    }}
                >
                    {/* این View فقط برای press animation است و native-driven است */}
                    <Animated.View
                        style={{
                            transform: [
                                { scale: pressScaleAnim },
                            ],
                        }}
                    >
                        <Image
                            source={require("@assets/images/start.png")}
                            style={logoStyle}
                        />
                    </Animated.View>
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
});

// دکمه‌ی جمع‌وجمع شیشه‌ای داخل داک پایین — آیکون (یا تصویر) + برچسب کوتاه
function DockAction({ icon, image, imageStyle, label, onPress, lang, accessibilityLabel }) {
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={dockStyles.action}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || label}
        >
            {image ? (
                <Image
                    source={image}
                    style={[dockStyles.actionImage, imageStyle]}
                />
            ) : (
                <Ionicons name={icon} size={19} color={colors.white.color} />
            )}
            {!!label && (
                <Text
                    style={[dockStyles.actionLabel, { fontFamily: getFontFamily('bold', lang) }]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );
}

// سوییچ زبان — یک کلید کشویی دو‌بخشی به‌جای یک آیکون کره‌ی زمین بی‌روح.
// هر دو زبان همیشه با خط بومی خودشان دیده می‌شوند («EN» / «فا») و بخش فعال با
// یک قرص سفید براق زیرش هایلایت می‌شود که هنگام تعویض زبان نرم سُر می‌خورد.
const LanguageSwitch = React.memo(({ language, onToggle }) => {
    const isFa = language === 'fa';
    const slide = useRef(new Animated.Value(isFa ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(slide, {
            toValue: isFa ? 1 : 0,
            useNativeDriver: true,
            friction: 7,
            tension: 90,
        }).start();
    }, [isFa, slide]);

    const translateX = slide.interpolate({
        inputRange: [0, 1],
        outputRange: [0, LANG_SEG_WIDTH],
    });

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onToggle}
            style={dockStyles.action}
            accessibilityRole="switch"
            accessibilityState={{ checked: isFa }}
            accessibilityLabel="Language / زبان"
        >
            <View style={langStyles.track}>
                <Animated.View
                    style={[langStyles.thumb, { transform: [{ translateX }] }]}
                    pointerEvents="none"
                />
                <View style={langStyles.seg}>
                    <Text style={[langStyles.segText, !isFa && langStyles.segTextActive]}>EN</Text>
                </View>
                <View style={langStyles.seg}>
                    <Text
                        style={[
                            langStyles.segText,
                            { fontFamily: getFontFamily('bold', 'fa') },
                            isFa && langStyles.segTextActive,
                        ]}
                    >
                        فا
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const dockStyles = StyleSheet.create({
    // ویندوز ۷: آیکون‌های نوار وظیفه بدون حاشیه و بدون پلاک پس‌زمینه‌اند
    action: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minWidth: 54,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.xs,
        borderRadius: radius.md,
        backgroundColor: 'transparent',
    },
    actionImage: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    actionImageLarge: {
        width: 38,
        height: 38,
    },
    actionLabel: {
        color: colors.white.color,
        fontSize: fontSize.xs,
    },
});

// عرض هر بخش از سوییچ زبان (قرص هایلایت هم به همین اندازه سُر می‌خورد)
const LANG_SEG_WIDTH = 26;

const langStyles = StyleSheet.create({
    track: {
        flexDirection: 'row',
        borderRadius: radius.pill,
        backgroundColor: colors.primary.bgColor(0.16),
        borderWidth: 1,
        borderColor: colors.white.bgColor(0.6),
        padding: 2,
        overflow: 'hidden',
    },
    thumb: {
        position: 'absolute',
        top: 2,
        left: 2,
        width: LANG_SEG_WIDTH,
        bottom: 2,
        borderRadius: radius.pill,
        backgroundColor: colors.white.bgColor(0.95),
        ...shadow.sm,
    },
    seg: {
        width: LANG_SEG_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 3,
    },
    segText: {
        fontSize: fontSize.xs,
        fontFamily: getFontFamily('bold', 'en'),
        color: colors.white.color,
    },
    segTextActive: {
        color: colors.primary.color,
    },
});


// Menu Provider Component
export const MenuProvider = ({ children }) => {
    const { t, i18n } = useTranslation();
    const userData = useSelector((state) => state.user?.data);
    const NewStyles = useMemo(
        () => createStyles(i18n.language),
        [i18n.language]
    );



    const styles = useMemo(() => createLocalStyles(NewStyles, i18n.language), [NewStyles, i18n.language]);
    const navigation = useNavigation();
    const { logoutWithConfirmation, isLoggingOut } = useLogout();
    const [menuVisible, setMenuVisible] = useState(false);
    const [currentRouteName, setCurrentRouteName] = useState('');
    const [currentRouteKey, setCurrentRouteKey] = useState('');
    const [showCodeHint, setShowCodeHint] = useState(false);
    // ارتفاع واقعی نوار پایین که با onLayout اندازه‌گیری می‌شود تا محتوای صفحه
    // زیر آن پنهان نشود (نوار position: absolute/fixed است و روی محتوا شناور می‌ماند)
    const [footerHeight, setFooterHeight] = useState(0);
    const insets = useSafeAreaInsets();
    // پنجره‌ی پهنِ اپ ویندوز: داک و مودال منو جایشان را به ستون کناری می‌دهند
    const { hasSidebar } = useResponsive();
    // Get user type and auth token from Redux
    const userType = useSelector(state => state.auth.userType);
    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.user?.data);
    const isLoggedIn = !!token; // کاربر لاگین کرده است اگر token داشته باشد

    // نوع حساب کاربر برای نمایش در بالای منو
    // (سازمان دولتی / سازمان نیمه‌دولتی / شرکت خصوصی / کاربر حقیقی)
    const accountTypeLabel = useMemo(() => {
        switch (userData?.account_type) {
            case 'g_organization':
                return t('Government organization');
            case 's_g_organization':
                return t('Semi-governmental organization');
            case 'company':
                return t('Private company');
            case 'individual':
            case 'indiviual':
                return t('Individual user');
            default:
                // اگر account_type از سرور نیامده باشد، از نوع کاربر در auth استفاده می‌کنیم
                return userType === 'organization' ? t('Organization') : t('Individual user');
        }
    }, [userData?.account_type, userType, t]);

    const accountDisplayName = useMemo(() => {
        const isOrganizationAccount =
            userType === 'organization' ||
            (!!userData?.account_type && !INDIVIDUAL_ACCOUNT_TYPES.includes(userData.account_type));

        return isOrganizationAccount
            ? userData?.organization_name
            : userData?.name;
    }, [userType, userData?.account_type, userData?.organization_name, userData?.name]);


    // صفحاتی که نباید Footer و Menu نمایش داده شود
    const screensWithoutMenu = [
        'Landing',
        'Welcome',
        'SignInLanding',
        'MainSignIn',
        'RegistrationVerificationScreen',
        'LoginScreen',
        'Login',
        'Register',
        'OTPVerification',
        'TestConnection',
        'OrganizationForgotPassword',
        'OrganizationResetPassword',
        'OrgPrivacy',
        'Grouping',
        'Method',
        'ForgotPassword',
        'ResetPasswordScreen',
        'AccessRestrictedScreen',
        'OrderMenuScreen',
    ];

    // Track current route
    useEffect(() => {
        const unsubscribe = navigation.addListener('state', () => {
            const currentRoute = navigation.getCurrentRoute();
            setCurrentRouteName(currentRoute?.name || '');
            setCurrentRouteKey(currentRoute?.key || '');
        });

        // Set initial route
        const currentRoute = navigation.getCurrentRoute();
        setCurrentRouteName(currentRoute?.name || '');
        setCurrentRouteKey(currentRoute?.key || '');

        return unsubscribe;
    }, [navigation]);

    // Check if current screen should show menu
    const shouldShowMenu = useMemo(() => {
        // اگر در لیست صفحات بدون منو باشد، منو نشان نده
        if (screensWithoutMenu.includes(currentRouteName)) {
            return false;
        }

        // اگر در صفحه قوانین سازمانی هستیم و کاربر لاگین نکرده، منو نشان نده
        if (currentRouteName === 'OrganizationTermsScreen' && !isLoggedIn) {
            return false;
        }

        // در غیر این صورت منو را نشان بده
        return true;
    }, [currentRouteName, isLoggedIn]);

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchContacts());
        loadLanguage()
    }, [])
    // `state.user.data` feeds the dock's code and the menu's name. It must
    // never outlive the session it was fetched for: on sign-out (any path —
    // logout button, expired-session sheet) drop it, so the next account can't
    // be shown the previous account's code and name while its own loads.
    useEffect(() => {
        if (!token) {
            dispatch(emptyUser());
            dispatch(clearWallet());
        } else if (!user) {
            dispatch(fetchUser(token))
        }
    }, [token])

    // Generate menu items dynamically based on user type
    const menuItems = useMemo(() => {

        const baseMenuItems = [
            // { id: 24, title: t("Delete Account"), screen: null, action: () => { Linking.openURL(`${mainUri}/delete-account-request`) } },
            // { id: 23, title: t("Submit order"), screen: "FolderScreen" },
            // { id: 12, title: t("Lucky Wheel"), screen: "Club", apple_check: userData?.apple_check, image:`${imageUri}/userfolder/gift.png` },
            // { id: 11, title: t("Think and Play"), screen: "GameMenu" },
            // { id: 7, title: t("User Account"), screen: "Profile", image:`${imageUri}/userfolder/Profile.png` },
            
            
            { id: 3, title: t("Orders"), screen: "OrdersScreen", image: `${imageUri}/userfolder/Orders.png` },
            { id: 22, title: t("Loop Wallet"), screen: "Wallet", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/Increase.png` },
            { id: 5, title: t("Canceled Orders"), screen: "CanceledOrdersScreen", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/CanceledOrdersScreen.png` },
            { id: 6, title: t("Messages"), screen: "MessageScreen", image: `${imageUri}/userfolder/MessageScreen.png` },
            { id: 8, title: t("Contract"), screen: "OrganizationContract", organizationOnly: true, image: `${imageUri}/userfolder/OrganizationContract.png` },
            { id: 9, title: t("Selected Addresses"), screen: "AddressScreen", image: `${imageUri}/userfolder/AddressScreen.png` },
            { id: 10, title: t("Training Course Registration"), screen: "TrainingRegistrationScreen", image: `${imageUri}/userfolder/TrainingRegistrationScreen.png` },
            { id: 23, title: t("Promotional codes"), screen: "UserDiscounts", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/Club.png` },
            { id: 13, title: t("Service / Product Faults"), screen: "ProductIssueScreen", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/ProductIssueScreen.png` },
            { id: 14, title: t("Rate List"), screen: "RateCategory", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/RateCategory.png` },
            { id: 15, title: t("Report/Track Violation"), screen: "ViolationReportScreen", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/ViolationReportScreen.png` },
            // id 16 «نظرسنجی / عملکرد» (FeedbackSurveyScreen) is left out on the desktop: the
            // survey is only asked at the successful end of an order (orders/Details → rating).
            { id: 17, title: t("Warranty / Guarantee"), screen: "WarrantyScreen", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/WarrantyScreen.png` },
            { id: 18, title: t("Note"), screen: "NotesScreen", image: `${imageUri}/userfolder/NotesScreen.png` },
            { id: 19, title: t("FAQ"), screen: "LearnMoreScreen", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/LearnMoreScreen.png` },
            {
                id: 20,
                title: userType === 'organization' ? t("Organization Terms and Conditions") : t("Terms / About Loop"),
                screen: userType === 'organization' ? "OrganizationTermsScreen" : "AboutScreen", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/AboutScreen.png`
            },
            { id: 21, title: t("Privacy"), screen: "PrivacyScreen", apple_check: userData?.apple_check, image: `${imageUri}/userfolder/PrivacyScreen.png` },
        ];

        if (userType === 'organization') {
            // Show all items including organization-only items
            return baseMenuItems;
        } else {
            // Filter out organization-only items
            return baseMenuItems.filter(item => !item.organizationOnly);
        }
    }, [userType, t, userData?.apple_check]);


    const openMenu = useCallback(() => {
        setMenuVisible(true);
    }, []);

    const closeMenu = useCallback(() => {
        setMenuVisible(false);
    }, []);
    // منوی داک روی صفحه‌های عمومی هم دیده می‌شود، پس ورودی‌های نیازمندِ حساب باید
    // کاربرِ خارج‌شده را به صفحه‌ی ورود ببرند، نه به صفحه‌ای که بلافاصله پس می‌زند.
    //
    // The dock is visible on public screens too, so a signed-out user can tap
    // "Orders" or "Loop Wallet". `RequireAuth` would bounce them anyway, but
    // bouncing means a visible flash of the wrong screen — send them straight
    // to sign-in instead. The guard stays as the backstop for every other way
    // in (deep links, push notifications); this is the layer that makes the
    // common path look deliberate.
    const navigateToScreen = useCallback((screenName) => {
        if (!token && requiresAuth(screenName)) {
            navigation.navigate(AUTH_ROUTE);
            closeMenu();
            return;
        }

        navigation.navigate(screenName);
        closeMenu();
    }, [navigation, closeMenu, token]);

    const showSidebar = hasSidebar && shouldShowMenu;

    // چیدمان هر صفحه: کارت روی بوم زیر نوار بالا، داشبورد بدون کارت، تمام‌صفحه یا فرم ورود
    const screenLayout = screenLayoutFor(currentRouteName);
    const showAuthPanel = screenLayout === 'auth' || screenLayout === 'authWide';
    // صفحه‌هایی که نوار بالا و نوار ستاره‌ای پشت آن را دارند
    const framed = showSidebar && screenLayout !== 'full' && !showAuthPanel;
    const pageMeta = usePageMeta(currentRouteKey);
    const homeRoute = homeRouteFor(userType);
    const isHome = currentRouteName === homeRoute;
    const shellText = shellLabels(i18n.language);
    // حالت روشن / تیره (desktop/theme.js)
    const { theme } = useTheme();
    // موسیقی پس‌زمینه؛ با باز شدن برنامه شروع و تا بسته شدنش تکرار می‌شود
    const musicOn = useBackgroundMusic();

    // ستون کناری می‌تواند به نوار آیکون جمع شود؛ انتخاب کاربر بین اجراها می‌ماند
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            return window.localStorage.getItem('loop.sidebarCollapsed') === '1';
        } catch {
            return false;
        }
    });
    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed((collapsed) => {
            try {
                window.localStorage.setItem('loop.sidebarCollapsed', collapsed ? '0' : '1');
            } catch {
                // only a preference
            }
            return !collapsed;
        });
    }, []);

    // Ctrl+K: جستجو و پرش به هر صفحه
    const [paletteOpen, setPaletteOpen] = useState(false);
    useEffect(() => {
        injectGlobalStyles();
        startBackgroundMusic();
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyK' || e.code === 'KeyF')) {
                e.preventDefault();
                setPaletteOpen((open) => !open);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // موجودی کیف پول برای نوار بالا
    const walletBalance = useSelector(selectWalletBalance);
    useEffect(() => {
        if (token) dispatch(fetchWalletBalance(token));
    }, [token]);

    const goHome = useCallback(() => {
        if (!token) {
            navigation.navigate(AUTH_ROUTE);
            return;
        }
        resetToHome(navigation, userType);
    }, [navigation, token, userType]);

    const callSupport = useCallback(() => {
        Linking.openURL(`tel:02191693909`);
    }, []);

    const handleCodePress = useCallback(() => {
        setShowCodeHint(true);
        setTimeout(() => setShowCodeHint(false), 1800);
    }, []);

    const handleFooterLayout = useCallback((e) => {
        const h = e?.nativeEvent?.layout?.height ?? 0;
        setFooterHeight((prev) => (Math.abs(prev - h) > 1 ? h : prev));
    }, []);

    // فضایی که باید زیر محتوای صفحه رزرو شود تا پشت داک پایین نرود
    const contentBottomInset = shouldShowMenu && !hasSidebar
        ? footerHeight + (insets?.bottom || 0) + spacing.sm + spacing.xs
        : 0;


    const renderMenuItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={[styles.item, NewStyles.row]}
            onPress={() => {
                if (item?.screen) {
                    navigateToScreen(item.screen);
                } else if (item?.action) {
                    item.action();
                }
            }}
        >
            <Image
                source={{ uri: `${item?.image}` }}
                style={[{ height: 50, width: 50 }]}


            />
            <Text style={[NewStyles.text10, {}]}>
                {item.title}
            </Text>
        </TouchableOpacity>
    ), [styles.item, NewStyles.title10, navigateToScreen]);
    //   const MenuItems = token ? menuItemsLoggedIn?.filter(item => !item.apple_check || item.apple_check != 1) : menuItemsLoggedOut;
    const filteredMenuItems = useMemo(() => {
        // اگر لاگین نیست، همون menuItems رو بده
        if (!token) return menuItems;

        // اگر apple_check == 1 بود، آیتم‌هایی که apple_check دارن رو حذف کن
        return menuItems.filter(item => !(Number(item.apple_check) === 1));
    }, [menuItems, token]);
    const contextValue = useMemo(() => ({
        menuVisible,
        openMenu,
        closeMenu,
        navigateToScreen,
        callSupport,
        menuItems: filteredMenuItems,
        // فاصله‌ای که یک صفحه باید ته محتوای اسکرول‌شونده‌اش بگذارد تا زیر داک شناور نرود
        footerSpace: contentBottomInset,
    }), [
        menuVisible,
        openMenu,
        closeMenu,
        navigateToScreen,
        callSupport,
        filteredMenuItems,
        contentBottomInset,
    ]);
    const menuEntry = filteredMenuItems.find((item) => item.screen === currentRouteName);
    const topBarTitle = isHome ? shellText.home : pageMeta?.title || menuEntry?.title || '';
    // همان رفتار «بازگشت» هدر موبایل: اول هندلر خود صفحه، بعد تاریخچه‌ی مرورگر
    const handleBack = () => {
        if (pageMeta?.onBack) {
            pageMeta.onBack();
        } else if (Platform.OS === 'web') {
            window.history.back();
        } else {
            navigation.goBack();
        }
    };
    const canGoBack = !isHome && (!!pageMeta?.onBack || !!navigation.canGoBack?.());
    // صفحه‌های تمام‌پنجره و فرم‌های ورود نوار بالا ندارند؛ «بازگشت» برایشان شناور است
    const floatingBack = !framed && !showAuthPanel && canGoBack && !['Landing', 'Welcome', 'OrderMenuScreen'].includes(currentRouteName);
    // فرم‌های ورود «بازگشت» را در نوار بالای کارت خودشان دارند؛ بدون تاریخچه، به منوی شروع
    const authBack = canGoBack ? handleBack : () => navigation.navigate('OrderMenuScreen');

    const changeLanguage = async (lng) => {
        await i18n.changeLanguage(lng);
        await AsyncStorage.setItem('language', lng);
        dispatch(setLanguage(lng))
    };
    const loadLanguage = async () => {

        try {
            const language = await AsyncStorage.getItem('language');
            if (language) {
                dispatch(setLanguage(language));
                i18n.changeLanguage(language);
            } else {
                i18n.changeLanguage('fa');
            }
        } catch (error) {
            console.error('Error loading language', error);
        }
    };
    const toggleLanguage = () => changeLanguage(i18n.language === 'en' ? 'fa' : 'en');

    const commands = [
        ...(isLoggedIn
            ? [
                { id: 'new-order', title: shellText.newOrder, icon: 'add-circle-outline', group: 'actions', run: goHome },
                { id: 'charge', title: shellText.charge, icon: 'card-outline', group: 'actions', run: () => navigateToScreen('Increase') },
            ]
            : [{ id: 'sign-in', title: shellText.signIn, icon: 'log-in-outline', group: 'actions', run: () => navigation.navigate(AUTH_ROUTE) }]),
        { id: 'language', title: shellText.switchLanguage, icon: 'language-outline', group: 'actions', run: toggleLanguage },
        {
            id: 'theme',
            title: theme === 'dark' ? shellText.lightMode : shellText.darkMode,
            icon: theme === 'dark' ? 'sunny-outline' : 'moon-outline',
            group: 'actions',
            keywords: 'theme dark light تم تیره روشن',
            run: toggleTheme,
        },
        {
            id: 'music',
            title: musicOn ? shellText.musicOff : shellText.musicOn,
            icon: musicOn ? 'volume-mute-outline' : 'musical-notes-outline',
            group: 'actions',
            keywords: 'music sound audio موسیقی صدا آهنگ',
            run: toggleBackgroundMusic,
        },
        ...(isLoggedIn
            ? [{ id: 'logout', title: shellText.logout, icon: 'log-out-outline', group: 'actions', run: () => logoutWithConfirmation() }]
            : []),
        { id: 'home', title: shellText.home, icon: 'grid-outline', group: 'pages', run: goHome },
        ...(isLoggedIn
            ? [
                { id: 'profile', title: shellText.profile, icon: iconForRoute('Profile'), group: 'pages', run: () => navigateToScreen('Profile') },
                { id: 'transactions', title: shellText.transactions, icon: iconForRoute('TransactionsScreen'), group: 'pages', run: () => navigateToScreen('TransactionsScreen') },
            ]
            : []),
        ...filteredMenuItems.map((item) => ({
            id: `menu-${item.id}`,
            title: item.title,
            icon: iconForRoute(item.screen),
            group: 'pages',
            run: () => (item.screen ? navigateToScreen(item.screen) : item.action?.()),
        })),
    ];

    const isDocument = screenLayout === 'document';
    const cardFrame = framed && screenLayout !== 'dashboard' && !isDocument;
    // فرم‌های ورود: پس‌زمینه‌ی خود صفحه شفاف می‌شود تا کارت شیشه‌ای دیده شود
    useGlassAuth(showAuthPanel, currentRouteName);
    // رسید: برگه‌ی کاغذی روی والپیپر (پس‌زمینه‌های مات صفحه‌ی موبایل شفاف می‌شوند)
    useDocumentFrame(framed && isDocument, currentRouteName);

    return (
        <MenuContext.Provider value={contextValue}>
            <SafeAreaView edges={{ top: 'off', bottom: 'additive' }} style={{ flex: 1 }}>
                {hasCustomTitleBar() && (
                    <DesktopTitleBar
                        appName={i18n.language === 'fa' ? 'لوپ' : 'Loop'}
                        pageTitle={topBarTitle}
                        lang={i18n.language}
                    />
                )}
                {/* این ظرف‌ها همیشه رندر می‌شوند و فقط نوار بالا، ستون کناری و پنل برند
                    شرطی‌اند: اگر جای {children} (کل navigator) در درخت عوض شود، با ورود
                    به حساب یا رفتن به صفحه‌ی ورود navigator از نو mount می‌شود و پشته‌ی
                    صفحه‌ها از دست می‌رود. ستون کناری در فارسی سمت راست است. */}
                <View
                    style={[
                        styles.shell,
                        { flexDirection: i18n.language === 'fa' ? 'row' : 'row-reverse' },
                        showAuthPanel && styles.authShell,
                    ]}
                >
                    {/* فرم ورود و پنل برند روی یک تصویر مشترک می‌نشینند */}
                    {showAuthPanel && <View pointerEvents="none" style={StyleSheet.absoluteFill}><CosmicBackdrop /></View>}
                    <View
                        dataSet={showAuthPanel ? { loopAuth: '' } : undefined}
                        style={[styles.shellContent, showAuthPanel && styles.authColumn, screenLayout === 'authWide' && styles.authColumnWide, framed && styles.canvas]}
                    >
                        {showAuthPanel && <View pointerEvents="none" style={styles.authEdge} />}
                        {showAuthPanel && (
                            <AuthCardBar lang={i18n.language} onBack={authBack} onToggleLanguage={toggleLanguage} />
                        )}
                        {/* پس‌زمینه‌ی اصلی برنامه (والپیپر لوپ) زیر پرده‌ی رنگ تم */}
                        {framed && <AppWallpaper veil />}
                        {framed && <View pointerEvents="none" style={styles.band} />}
                        {framed && (
                            <DesktopTopBar
                                title={topBarTitle}
                                crumb={isHome ? null : shellText.home}
                                onCrumb={isHome ? undefined : goHome}
                                onBack={canGoBack ? handleBack : null}
                                isLoggedIn={isLoggedIn}
                                walletBalance={walletBalance}
                                onWallet={() => navigateToScreen('Wallet')}
                                onMessages={() => navigateToScreen('MessageScreen')}
                                onSearch={() => setPaletteOpen(true)}
                                onSignIn={() => navigation.navigate(AUTH_ROUTE)}
                                theme={theme}
                                onToggleTheme={toggleTheme}
                                musicOn={musicOn}
                                onToggleMusic={toggleBackgroundMusic}
                                lang={i18n.language}
                            />
                        )}
                        <View
                            dataSet={{ loopStage: '' }}
                            style={[styles.stage, framed && styles.stageGap, cardFrame && styles.stageFramed]}
                        >
                            <View
                                // صفحه‌های موبایلی رنگ روشن خودشان را دارند؛ کارتشان در حالت تیره هم روشن می‌ماند
                                dataSet={cardFrame ? { loopPaper: '' } : isDocument ? { loopDocument: '' } : undefined}
                                style={[
                                    styles.frame,
                                    cardFrame && styles.frameCard,
                                    // فرم‌های تک‌ستونه: همان کارتِ هم‌عرض، ستون محتوا در وسطش
                                    screenLayout === 'narrow' && styles.frameNarrow,
                                    // رسید: یک برگه روی والپیپر، بدون کارت سفید دورش
                                    isDocument && styles.frameDocument,
                                ]}
                            >
                                {children}
                            </View>
                        </View>
                        {floatingBack && (
                            <Pressable
                                onPress={handleBack}
                                accessibilityRole="button"
                                accessibilityLabel={shellText.back}
                                style={({ hovered }) => [
                                    styles.floatingBack,
                                    i18n.language === 'fa' ? styles.floatingBackRight : styles.floatingBackLeft,
                                    hovered && styles.floatingBackHover,
                                ]}
                            >
                                <Cheetah facing={cheetahFacing(i18n.language === 'fa', 'back')} height={28} />
                                <Text style={[styles.floatingBackText, { fontFamily: getFontFamily('bold', i18n.language) }]}>
                                    {shellText.back}
                                </Text>
                            </Pressable>
                        )}
                        {/* موسیقی از همان لحظه‌ی باز شدن برنامه پخش می‌شود؛ صفحه‌های بدون نوار
                            بالا (لوگو، خوش‌آمد، منوی ورود، فرم‌های ورود) هم دکمه‌ی قطع آن را دارند */}
                        {!framed && (
                            <Pressable
                                onPress={toggleBackgroundMusic}
                                accessibilityRole="button"
                                accessibilityLabel={musicOn ? shellText.musicOff : shellText.musicOn}
                                {...tip(musicOn ? shellText.musicOff : shellText.musicOn)}
                                style={({ hovered }) => [
                                    styles.floatingMusic,
                                    i18n.language === 'fa' ? styles.floatingMusicLeft : styles.floatingMusicRight,
                                    hovered && styles.floatingBackHover,
                                ]}
                            >
                                <Ionicons
                                    name={musicOn ? 'volume-high' : 'volume-mute'}
                                    size={19}
                                    color={musicOn ? '#ffd700' : 'rgba(255, 255, 255, 0.7)'}
                                />
                            </Pressable>
                        )}
                    </View>
                    {showAuthPanel && <DesktopAuthPanel lang={i18n.language} compact={screenLayout === 'authWide'} />}
                    {showSidebar && (
                        <DesktopSidebar
                            items={filteredMenuItems}
                            currentRouteName={currentRouteName}
                            homeRoute={homeRoute}
                            onNavigate={navigateToScreen}
                            onHome={goHome}
                            onNewOrder={goHome}
                            onProfile={() => navigateToScreen('Profile')}
                            onSupport={() => navigateToScreen('MessageScreen')}
                            onLogout={() => logoutWithConfirmation()}
                            onSignIn={() => navigation.navigate(AUTH_ROUTE)}
                            onToggleLanguage={toggleLanguage}
                            onToggleCollapsed={toggleSidebar}
                            collapsed={sidebarCollapsed}
                            isLoggedIn={isLoggedIn}
                            isLoggingOut={isLoggingOut}
                            accountName={accountDisplayName}
                            accountType={accountTypeLabel}
                            gems={userData?.user_gems}
                            userCode={user?.code}
                            lang={i18n.language}
                            t={t}
                        />
                    )}
                </View>
                <CommandPalette
                    visible={paletteOpen}
                    onClose={() => setPaletteOpen(false)}
                    commands={commands}
                    lang={i18n.language}
                />

                {shouldShowMenu && !hasSidebar && (
                    <View
                        pointerEvents="box-none"
                        style={[styles.footerWrap, { bottom: (insets?.bottom || 0) + spacing.sm }]}
                    >
                        {showCodeHint && !!user?.code && (
                            <View style={styles.codeTooltip}>
                                <Text style={styles.codeTooltipText} numberOfLines={1}>
                                    {userType === 'organization' ? t('Organization code') : t('User code')}
                                </Text>
                            </View>
                        )}

                        <View onLayout={handleFooterLayout} style={styles.dockShadow}>
                            {/* اپ فارسی‌محور است: لوگو همیشه سمت راست، کد سمت چپ */}
                            {/* داک = بلورِ پس‌زمینه‌ی صفحه + یک اسکریمِ نیمه‌شفافِ آبیِ برند روی آن.
                                اسکریم لازم است چون محتوای داک همه سفید است و بدون آن روی
                                صفحات روشن/سفید خوانا نمی‌ماند (styles.dockScrim) */}
                            <View style={styles.dock}>
                                <BlurView
                                    intensity={35}
                                    tint="default"
                                    style={StyleSheet.absoluteFill}
                                    pointerEvents="none"
                                />
                                {/* اسکریم برند روی بلور — تضمین می‌کند متن/آیکون‌های سفید داک
                                    روی هر پس‌زمینه‌ای (صفحه‌ی روشن یا تیره) خوانا بمانند */}
                                <View style={styles.dockScrim} pointerEvents="none" />
                                <View style={styles.dockTopEdge} pointerEvents="none" />

                                <View style={styles.menuButton}>
                                    <AnimatedFooterLogoButton
                                        onPress={openMenu}
                                        logoStyle={styles.footerLogo}
                                    />
                                </View>

                                <LanguageSwitch
                                    language={i18n.language}
                                    onToggle={() =>
                                        changeLanguage(i18n.language === 'en' ? 'fa' : 'en')
                                    }
                                />

                                <DockAction
                                    image={require('@assets/images/support-nobg.png')}
                                    imageStyle={dockStyles.actionImageLarge}
                                    lang={i18n.language}
                                    accessibilityLabel={t('Support')}
                                    onPress={() => navigation.navigate('MessageScreen')}
                                />

                                <TouchableOpacity
                                    activeOpacity={0.75}
                                    onPress={handleCodePress}
                                    style={styles.codeChip}
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                        userType === 'organization'
                                            ? t('Organization code')
                                            : t('User code')
                                    }
                                >
                                    <Ionicons
                                        name="qr-code-outline"
                                        size={15}
                                        color={colors.white.color}
                                    />
                                    <Text style={styles.codeChipText}>
                                        {user?.code ?? '—'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                <Modal
                    transparent={true}
                    visible={menuVisible}
                    onRequestClose={closeMenu}
                    animationType="fade"
                    // روی اندروید (edge-to-edge) مودال زیر نوار ناوبری سیستم کشیده می‌شد و
                    // ضربدر/خروج پشت دکمه‌های گوشی می‌افتاد و قابل لمس نبود. مودال را روی
                    // همه‌ی دستگاه‌ها یکسان تمام‌صفحه می‌کنیم و خودمان به اندازه‌ی insets
                    // فاصله می‌دهیم، تا روی گوشی‌های قدیمی‌تر فاصله دوبار حساب نشود.
                    statusBarTranslucent
                    navigationBarTranslucent
                >

                    <View
                        style={{
                            flex: 1,
                            alignSelf: 'flex-start',
                            paddingTop: insets?.top || 0,
                            paddingBottom: insets?.bottom || 0,
                            backgroundColor: themeColor0.bgColor(1),
                        }}
                    >
                        <FlatList
                            ListHeaderComponent={() => {
                                return (
                                    <View style={[{ backgroundColor: themeColor4.bgColor(1), padding: 15 }, NewStyles.center]}>
                                        {!!accountDisplayName && (
                                            <Text style={[NewStyles.title, styles.accountName]}>{accountDisplayName}</Text>
                                        )}
                                        <Text style={styles.accountTypeBadge}>{accountTypeLabel}</Text>
                                        <View style={[{ paddingVertical: 10, width: '90%', backgroundColor: themeColor8.bgColor(0.2), }, NewStyles.center, NewStyles.border10]}>
                                            <Text style={NewStyles.title}>{t("Your Points:")} {userData?.user_gems ?? '0'}</Text>
                                        </View>
                                    </View>
                                )
                            }}
                            // inverted={true}
                            data={filteredMenuItems}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderMenuItem}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                        />
                        {/* دکمه خروج */}
                        <View style={[styles.logoutContainer, NewStyles.rowWrapper]}>
                            <TouchableOpacity style={{ padding: 10 }} onPress={() => {
                                closeMenu()
                            }}>
                                <Ionicons
                                    name={'close'}
                                    size={20}
                                    color={themeColor4.bgColor(1)}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.logoutBtn, isLoggingOut && styles.logoutBtnDisabled]}
                                onPress={() => logoutWithConfirmation({ onSuccess: closeMenu })}
                                disabled={isLoggingOut}
                            >
                                <Ionicons name="power" size={20} color="#fff" />
                                <Text style={styles.logoutText}>
                                    {isLoggingOut ? t('Logging out...') : t('Log out of account')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </Modal>
            </SafeAreaView>

        </MenuContext.Provider>
    );
};

// Hook to use Menu Context
export const useMenu = () => {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
};

// Styles
const createLocalStyles = (NewStyles, language) => StyleSheet.create({


    shell: {
        flex: 1,
    },
    shellContent: {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
    },
    // بوم روشن صفحه‌ها با نوار ستاره‌ای پشت نوار بالا
    canvas: {
        backgroundColor: surface.canvas,
        backgroundImage: 'radial-gradient(70% 45% at 50% 105%, rgba(79, 143, 224, 0.10) 0%, rgba(79, 143, 224, 0) 70%)',
    },
    band: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: bandHeight,
        backgroundImage: gradients.band,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        // هدر صفحه یک نوار کامل است؛ محتوا زیرش شروع می‌شود (contentTopGap)
        boxShadow: '0 12px 32px rgba(4, 15, 31, 0.18), inset 0 -1px 0 rgba(255, 215, 0, 0.18)',
    },
    stage: {
        flex: 1,
        minHeight: 0,
    },
    // همه‌ی صفحه‌ها با یک فاصله از نوار بالا شروع می‌شوند تا نوار ستاره‌ای دیده شود
    stageGap: {
        paddingTop: contentTopGap,
    },
    stageFramed: {
        paddingHorizontal: contentGutter,
        paddingBottom: 24,
    },
    frame: {
        flex: 1,
        width: '100%',
        minHeight: 0,
    },
    floatingBack: {
        position: 'absolute',
        top: 18,
        zIndex: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(6, 23, 45, 0.55)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transitionProperty: 'background-color',
        transitionDuration: motion.fast,
    },
    floatingBackRight: { right: 18 },
    floatingBackLeft: { left: 18 },
    floatingBackHover: { backgroundColor: 'rgba(6, 23, 45, 0.8)' },
    floatingBackText: { color: '#ffffff', fontSize: 13 },
    floatingMusic: {
        position: 'absolute',
        bottom: 18,
        zIndex: 20,
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(6, 23, 45, 0.55)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transitionProperty: 'background-color',
        transitionDuration: motion.fast,
    },
    floatingMusicLeft: { left: 18 },
    floatingMusicRight: { right: 18 },
    // کارت صفحه: روی نوار ستاره‌ای می‌نشیند و پهنایش به نوع صفحه بستگی دارد
    frameCard: {
        alignSelf: 'center',
        borderRadius: radii.xl,
        overflow: 'hidden',
        backgroundColor: surface.card,
        boxShadow: elevation.raised,
        borderWidth: 1,
        borderColor: surface.border,
        maxWidth: contentMaxWidth,
    },
    frameDocument: {
        alignSelf: 'center',
        maxWidth: documentWidth,
    },
    frameNarrow: {
        // حاشیه‌های دو طرف ستون فرم با تم عوض می‌شوند؛ خود ستون روشن می‌ماند
        backgroundColor: 'var(--loop-gutter)',
        paddingHorizontal: `max(0px, calc((100% - ${narrowContentWidth}px) / 2))`,
    },
    authShell: {
        backgroundColor: '#040f1f',
        padding: 32,
    },
    // خط طلایی روشن روی لبه‌ی بالای کارت شیشه‌ای
    authEdge: {
        position: 'absolute',
        top: 0,
        left: 40,
        right: 40,
        height: 1,
        zIndex: 2,
        backgroundImage: 'linear-gradient(90deg, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0.7) 50%, rgba(255, 215, 0, 0) 100%)',
    },
    // فرم ورود: کارت شناور روی تصویر، نه یک ستون چسبیده به لبه‌ی پنجره
    authColumn: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: authFormWidth.ideal,
        minWidth: authFormWidth.min,
        maxWidth: authFormWidth.max,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.14)',
        // شیشه‌ی مات و عمیق روی والپیپر لوپ؛ تیره‌تر تا فیلدها و متن خوانا باشند
        backgroundColor: 'rgba(6, 18, 36, 0.66)',
        backgroundImage: [
            'radial-gradient(90% 40% at 50% 0%, rgba(255, 215, 0, 0.07) 0%, rgba(255, 215, 0, 0) 70%)',
            'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.015) 40%, rgba(79,143,224,0.08) 100%)',
        ].join(', '),
        backdropFilter: 'blur(30px) saturate(1.4)',
        boxShadow: '0 40px 90px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 215, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    },
    // فرم‌های ثبت‌نام بلند (سازمان): کارت پهن‌تر، پنل برند فشرده
    authColumnWide: {
        flexBasis: authWideFormWidth.ideal,
        minWidth: authWideFormWidth.min,
        maxWidth: authWideFormWidth.max,
    },

    // داک شیشه‌ای شناور پایین صفحه
    footerWrap: {
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: spacing.md,
        zIndex: 10,
    },
    dockShadow: {
        borderRadius: radius.lg,
        backgroundColor: 'transparent',
        ...shadow.lg,
    },
    dock: {
        // چیدمان داک به زبان وابسته نیست: دکمه‌ی استارت (لوگوی لوپ) همیشه سمت چپ می‌ماند
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.white.bgColor(0.6),
    },
    dockScrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.primary.bgColor(0.58),
    },
    dockTopEdge: {
        position: 'absolute',
        top: 0,
        left: spacing.lg,
        right: spacing.lg,
        height: 1,
        backgroundColor: colors.white.bgColor(0.85),
    },
    menuButton: {
        width: 52,
        height: 52,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    codeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.pill,
        backgroundColor: colors.primary.bgColor(0.1),
        borderWidth: 1,
        borderColor: colors.primary.bgColor(0.22),
        flexShrink: 0,
    },
    codeChipText: {
        color: colors.white.color,
        fontSize: fontSize.sm,
        fontFamily: getFontFamily('bold', language),
    },
    codeTooltip: {
        alignSelf: 'center',
        marginBottom: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.sm,
        backgroundColor: colors.primary.bgColor(0.96),
        ...shadow.md,
    },
    codeTooltipText: {
        color: colors.white.color,
        fontSize: fontSize.xs,
        fontFamily: getFontFamily('bold', language),
    },
    accountName: {
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    accountTypeBadge: {
        marginBottom: spacing.md,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        backgroundColor: colors.primary.bgColor(0.12),
        color: colors.primary.color,
        fontSize: fontSize.xs,
        fontFamily: getFontFamily('bold', language),
        textAlign: 'center',
    },
    footerLogo: {
        width: 34,
        height: 34,
        resizeMode: "contain",
    },
    list: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: themeColor0.bgColor(1)
    },
    item: {
        backgroundColor: themeColor4.bgColor(1),
        paddingVertical: 2,
        paddingHorizontal: 20,
        width: "100%",
        gap: 5
    },
    logoutContainer: {
        padding: 10,
        backgroundColor: themeColor0.bgColor(1),
    },
    logoutBtn: {
        ...NewStyles.row,
        ...NewStyles.center,
        backgroundColor: themeColor6.bgColor(1),
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    logoutBtnDisabled: {
        backgroundColor: '#999',
    },
    logoutText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'VazirBold',
    },
});