/**
 * The single source of truth for every screen in the app.
 *
 * Both the navigator (`RootNavigator.js`) and the web deep-link map
 * (`linking.js`) are derived from this array, so a screen can no longer be
 * registered on one and forgotten on the other — which is exactly how
 * `AccessRestrictedScreen` and `Footer` ended up unreachable by URL, and how
 * `CorporateScreen` and `OrganizationProfile` ended up navigated-to but never
 * registered at all.
 *
 * Fields:
 *   name          Route name. This is what `navigation.navigate(...)` takes.
 *   module        Import specifier, resolved lazily via `getComponent`.
 *   path          URL segment for web deep links. `null` means "no deep link".
 *   options       Per-screen navigator options. `headerShown: false` is the
 *                 navigator-wide default and must not be repeated here.
 *   header        Convenience: renders the shared `ScreenHeaders` with this
 *                 title instead of the native header.
 *
 * Screens are loaded through `getComponent` rather than a static import so
 * React Navigation only evaluates a screen's module the first time that screen
 * is shown. With ~85 screens that is the difference between parsing the whole
 * app at launch and parsing one screen.
 */

/**
 * @typedef {object} RouteDefinition
 * @property {string} name
 * @property {() => import('react').ComponentType<any>} getComponent
 * @property {string|null} [path]
 * @property {object} [options]
 * @property {string} [header]
 */

/** @type {RouteDefinition[]} */
export const routes = [
  { name: 'TechnicianIdentity', getComponent: () => require('@screens/account/TechnicianIdentityScreen').default, path: 'technician-identity' },
  /* ---- Entry ---- */
  { name: 'Landing', getComponent: () => require('@screens/Landing').default, path: '' },
  { name: 'Welcome', getComponent: () => require('@screens/Welcome').default, path: 'welcome' },

  /* ---- Customer authentication ---- */
  {
    name: 'SignInLanding',
    getComponent: () => require('@screens/auth/SignInLanding').default,
    path: 'signin-landing',
  },
  {
    name: 'MainSignIn',
    getComponent: () => require('@screens/auth/MainSignIn').default,
    path: 'main-signin',
  },
  {
    name: 'RegistrationVerificationScreen',
    getComponent: () => require('@screens/auth/RegistrationVerificationScreen').default,
    path: 'registration-verification',
  },
  {
    name: 'LoginScreen',
    getComponent: () => require('@screens/auth/LoginScreen').default,
    path: 'login',
  },
  {
    name: 'AccessRestrictedScreen',
    getComponent: () => require('@screens/AccessRestrictedScreen').default,
    path: 'access-restricted',
  },

  /* ---- Organization authentication ---- */
  { name: 'Login', getComponent: () => require('@org/logreg/Login').default, path: 'org-login' },
  {
    name: 'Register',
    getComponent: () => require('@org/logreg/Register').default,
    path: 'org-register',
  },
  {
    name: 'OTPVerification',
    getComponent: () => require('@org/logreg/OTPVerification').default,
    path: 'org-otp-verification',
  },
  {
    name: 'TestConnection',
    getComponent: () => require('@org/logreg/TestConnection').default,
    path: 'org-test-connection',
  },
  {
    name: 'OrganizationForgotPassword',
    getComponent: () => require('@org/logreg/OrganizationForgotPassword').default,
    path: 'org-forgot-password',
  },
  {
    name: 'OrganizationResetPassword',
    getComponent: () => require('@org/logreg/OrganizationResetPassword').default,
    path: 'org-reset-password',
  },
  {
    name: 'OrgPrivacy',
    getComponent: () => require('@org/logreg/Privacy').default,
    path: 'org-privacy',
  },
  {
    name: 'Grouping',
    getComponent: () => require('@org/logreg/Grouping').default,
    path: 'grouping',
  },
  { name: 'Method', getComponent: () => require('@org/logreg/Method').default, path: 'method' },
  {
    name: 'ForgotPassword',
    getComponent: () => require('@screens/auth/ForgotPassword').default,
    path: 'forgot-password',
  },
  {
    name: 'ResetPasswordScreen',
    getComponent: () => require('@screens/auth/ResetPasswordScreen').default,
    path: 'reset-password',
  },

  /* ---- Ordering ---- */
  {
    name: 'OrderMenuScreen',
    getComponent: () => require('@screens/orders/OrderMenuScreen').default,
    path: 'order-menu',
  },
  // The app's home page. `/folder` (screens/FolderScreen.js) used to be a second
  // home and is gone: nothing navigates to it and the old URL is rewritten to
  // `/list` in navigation/linking.js.
  { name: 'List', getComponent: () => require('@org/List').default, path: 'list' },
  {
    name: 'SubCategories',
    getComponent: () => require('@screens/category/SubCategories').default,
    path: 'subcategories',
  },
  {
    name: 'ContractScreen',
    getComponent: () => require('@org/ContractScreen').default,
    path: 'contract',
  },
  {
    name: 'AddNewAddress',
    getComponent: () => require('@screens/address/AddNewAddress').default,
    path: 'add-address',
  },
  {
    name: 'Map',
    getComponent: () => require('@screens/address/Map').default,
    path: 'map',
    header: 'موقعیت مکانی',
  },
  {
    name: 'Preview',
    getComponent: () => require('@screens/category/Preview').default,
    path: 'preview',
  },
  {
    name: 'Details',
    getComponent: () => require('@screens/orders/Details').default,
    path: 'order-details',
  },
  {
    name: 'Invoice',
    getComponent: () => require('@screens/orders/Invoice').default,
    path: 'invoice',
  },
  {
    name: 'OrderReceipt',
    getComponent: () => require('@screens/orders/OrderReceiptScreen').default,
    path: 'receipt',
  },
  {
    name: 'Wallet',
    getComponent: () => require('@screens/account/Wallet').default,
    path: 'wallet',
  },
  {
    name: 'Increase',
    getComponent: () => require('@screens/account/Increase').default,
    path: 'increase',
  },
  {
    // «کیف پول مأمور خرید» - پورسانت کد معرف، برداشت و تهاتر (بند ۹).
    name: 'AgentWallet',
    getComponent: () => require('@screens/account/AgentWalletScreen').default,
    path: 'agent-wallet',
  },
  {
    name: 'PaymentScreen',
    getComponent: () => require('@screens/account/PaymentScreen').default,
    path: 'payment',
  },
  { name: 'ChatRoom', getComponent: () => require('@screens/chat/ChatRoom').default, path: 'chat' },
  { name: 'Club', getComponent: () => require('@screens/club/Club').default, path: 'club' },
  {
    name: 'DiscountDetail',
    getComponent: () => require('@screens/club/DiscountDetail').default,
    path: 'discount-detail',
  },
  {
    name: 'GemTransactions',
    getComponent: () => require('@screens/club/GemTransactions').default,
    path: 'gem-transactions',
  },
  {
    name: 'UserDiscounts',
    getComponent: () => require('@screens/club/UserDiscounts').default,
    path: 'user-discounts',
  },
  {
    name: 'DiscountCodeScreen',
    getComponent: () => require('@org/DiscountCodeScreen').default,
    path: 'discount-code',
  },
  {
    name: 'Steps',
    getComponent: () => require('@screens/category/Steps').default,
    path: 'steps',
    options: { gestureEnabled: false },
  },

  /* ---- Service selection ---- */
  {
    name: 'TechnicianVisitScreen',
    getComponent: () => require('@org/TechnicianVisitScreen').default,
    path: 'technician-visit',
  },
  {
    name: 'HardwareSelectionScreen',
    getComponent: () => require('@org/HardwareSelectionScreen').default,
    path: 'hardware-selection',
  },
  {
    name: 'ComprehensiveSelectionScreen',
    getComponent: () => require('@org/ComprehensiveSelectionScreen').default,
    path: 'comprehensive-selection',
  },
  {
    name: 'SystematicCategoryScreen',
    getComponent: () => require('@org/SystematicCategoryScreen').default,
    path: 'systematic-selection',
  },
  {
    name: 'SystematicDeviceScreen',
    getComponent: () => require('@org/SystematicDeviceScreen').default,
    path: 'systematic-selection/:categoryId',
  },
  {
    name: 'SystematicDeviceMenuScreen',
    getComponent: () => require('@org/SystematicDeviceMenuScreen').default,
    path: 'systematic-selection/:categoryId/actions',
  },
  {
    name: 'ChooseTechnicianScreen',
    getComponent: () => require('@org/ChooseTechnicianScreen').default,
    path: 'choose-technician',
  },
  {
    name: 'GuideScreen',
    getComponent: () => require('@screens/GuideScreen').default,
    path: 'guide',
  },
  {
    name: 'HardwareIssueScreen',
    getComponent: () => require('@screens/HardwareIssueScreen').default,
    path: 'hardware-issue',
  },
  {
    name: 'WindowsInstallScreen',
    getComponent: () => require('@screens/WindowsInstallScreen').default,
    path: 'windows-install',
  },
  {
    name: 'SoftwareInstallScreen',
    getComponent: () => require('@screens/SoftwareInstallScreen').default,
    path: 'software-install',
  },

  /* ---- Order tracking & summary ---- */
  {
    name: 'OrderTrackingScreen',
    getComponent: () => require('@screens/orders/OrderTrackingScreen').default,
    path: 'order-tracking',
  },
  {
    name: 'OrderSummaryScreen',
    getComponent: () => require('@screens/orders/OrderSummaryScreen').default,
    path: 'order-summary',
  },
  {
    name: 'PartsSupplyScreen',
    getComponent: () => require('@screens/PartsSupplyScreen').default,
    path: 'parts-supply',
  },
  {
    name: 'TechnicianBookingScreen',
    getComponent: () => require('@screens/TechnicianBookingScreen').default,
    path: 'technician-booking',
  },
  {
    name: 'DeviceModelInfoScreen',
    getComponent: () => require('@screens/DeviceModelInfoScreen').default,
    path: 'device-model-info',
  },
  {
    name: 'DeviceOrderSummary',
    getComponent: () => require('@screens/orders/DeviceOrderSummary').default,
    path: 'device-order-summary',
  },

  /* ---- Account & profile ---- */
  { name: 'Footer', getComponent: () => require('@screens/Footer').default, path: 'footer' },
  {
    name: 'CorporateScreen',
    getComponent: () => require('@screens/CorporateScreen').default,
    path: 'corporate',
  },
  {
    name: 'AddressScreen',
    getComponent: () => require('@screens/account/AddressScreen').default,
    path: 'address',
  },
  {
    name: 'Profile',
    getComponent: () => require('@screens/account/Profile').default,
    path: 'profile',
  },
  {
    name: 'OrganizationProfile',
    getComponent: () => require('@screens/account/OrganizationProfile').default,
    path: 'organization-profile',
  },
  {
    // «امنیت حساب» - کاربر عادی و سازمانی/شرکتی (نیازمند ورود).
    name: 'AccountSecurity',
    getComponent: () => require('@screens/account/AccountSecurityScreen').default,
    path: 'account-security',
  },
  {
    name: 'OrganizationContract',
    getComponent: () => require('@screens/organization/OrganizationContract').default,
    path: 'org-contract',
  },

  /* ---- Messaging, wallet & orders ---- */
  {
    name: 'MessageScreen',
    getComponent: () => require('@screens/MessageScreen').default,
    path: 'messages',
  },
  {
    name: 'TransactionsScreen',
    getComponent: () => require('@screens/TransactionsScreen').default,
    path: 'transactions',
  },
  {
    name: 'OrdersScreen',
    getComponent: () => require('@screens/orders/OrdersScreen').default,
    path: 'orders',
  },
  {
    name: 'CanceledOrdersScreen',
    getComponent: () => require('@screens/orders/CanceledOrdersScreen').default,
    path: 'canceled-orders',
  },
  {
    name: 'IdeaBoxScreen',
    getComponent: () => require('@screens/IdeaBoxScreen').default,
    path: 'idea-box',
  },

  /* ---- Feedback & reports ---- */
  {
    name: 'ViolationReportScreen',
    getComponent: () => require('@screens/contact/ViolationReportScreen').default,
    path: 'violation-report',
  },
  {
    name: 'ViolationReportsListScreen',
    getComponent: () => require('@screens/ViolationReportsListScreen').default,
    path: 'violation-reports',
  },
  {
    name: 'FeedbackSurveyScreen',
    getComponent: () => require('@screens/contact/FeedbackSurveyScreen').default,
    path: 'feedback',
  },
  {
    name: 'RateListScreen',
    getComponent: () => require('@screens/RateListScreen').default,
    path: 'rates',
  },
  {
    name: 'RateCategory',
    getComponent: () => require('@screens/RateCategory').default,
    path: 'category-rates',
  },
  {
    name: 'ProductIssueScreen',
    getComponent: () => require('@screens/ProductIssueScreen').default,
    path: 'product-issue',
  },
  {
    name: 'IncentivePlansScreen',
    getComponent: () => require('@screens/IncentivePlansScreen').default,
    path: 'incentive-plans',
  },
  {
    name: 'TrainingRegistrationScreen',
    getComponent: () => require('@screens/TrainingRegistrationScreen').default,
    path: 'training-registration',
  },

  /* ---- Notes ---- */
  {
    name: 'NotesScreen',
    getComponent: () => require('@screens/NotesScreen').default,
    path: 'notes',
  },
  {
    name: 'AddEditNoteScreen',
    getComponent: () => require('@screens/notes/AddEditNoteScreen').default,
    path: 'note',
  },

  /* ---- Static / informational ---- */
  {
    name: 'LearnMoreScreen',
    getComponent: () => require('@screens/resources/LearnMoreScreen').default,
    path: 'learn-more',
  },
  {
    name: 'AboutScreen',
    getComponent: () => require('@screens/resources/AboutScreen').default,
    path: 'about',
  },
  {
    name: 'OrganizationTermsScreen',
    getComponent: () => require('@screens/resources/OrganizationTermsScreen').default,
    path: 'organization-terms',
  },
  {
    name: 'PrivacyScreen',
    getComponent: () => require('@screens/resources/PrivacyScreen').default,
    path: 'privacy',
  },
  {
    name: 'LOOPMenuScreen',
    getComponent: () => require('@screens/LOOPMenuScreen').default,
    path: 'loop-menu',
  },
  {
    name: 'FAQScreen',
    getComponent: () => require('@screens/resources/FAQScreen').default,
    path: 'faq',
  },
  {
    name: 'ArticlesScreen',
    getComponent: () => require('@screens/resources/ArticlesScreen').default,
    path: 'articles',
  },
  {
    name: 'WarrantyScreen',
    getComponent: () => require('@screens/resources/WarrantyScreen').default,
    path: 'warranty',
  },

  /* ---- Game ---- */
  {
    name: 'GameMenu',
    getComponent: () => require('@screens/game/GameMenuScreen').default,
    path: 'game',
  },
  {
    name: 'GamePlay',
    getComponent: () => require('@screens/game/GamePlayScreen').default,
    path: 'game-play',
  },
  {
    name: 'GameResult',
    getComponent: () => require('@screens/game/GameResultScreen').default,
    path: 'game-result',
  },

  /* ---- Utility ---- */
  {
    name: 'WebView',
    getComponent: () => require('@screens/WebViewScreen').default,
    path: 'webview',
  },
  {
    name: 'MapPickerScreen',
    getComponent: () => require('@screens/MapPickerScreen').default,
    path: 'map-picker',
  },

  /* ---- Dev-only ---- */
  // گالری ۹ حالت رسید. تولید همه‌ی ترکیب‌ها از داده‌ی واقعی عملی نیست، پس
  // این صفحه آن‌ها را از fixture می‌سازد. فقط در توسعه ثبت می‌شود تا در
  // بیلد تولیدی نه مسیر داشته باشد نه URL.
  ...(__DEV__
    ? [
        {
          name: 'ReceiptGallery',
          getComponent: () => require('@screens/dev/ReceiptGalleryScreen').default,
          path: 'dev/receipts',
        },
      ]
    : []),
];

/** The route the app opens on. */
export const INITIAL_ROUTE = 'Landing';

/**
 * مسیرهایی که بدون ورود به حساب هم قابل مشاهده‌اند.
 *
 * The routes a signed-out visitor is allowed to open.
 *
 * This is an **allowlist, not a blocklist** — `requiresAuth(name)` below denies
 * anything that is not on it. That direction is deliberate (`fail secure`, the
 * same principle `docs/SECURITY_FIX_ACCESS_CONTROL.md` sets out for
 * organization access): forgetting to list a new screen makes it ask for a
 * login, which is a visible annoyance, whereas forgetting to *block* one hands
 * a guest a screen whose every request 401s and whose UI assumes a user object.
 *
 * Only three kinds of route belong here: the splash, the sign-in/sign-up flows
 * (a guest obviously cannot be asked to log in before logging in), and the
 * static informational pages a guest may legitimately want to read.
 */
export const PUBLIC_ROUTES = new Set([
  /* Splash */
  'Landing',
  'Welcome',

  /* Customer authentication */
  'SignInLanding',
  'MainSignIn',
  'LoginScreen',
  'RegistrationVerificationScreen',
  'ForgotPassword',
  'ResetPasswordScreen',
  'AccessRestrictedScreen',

  /* Organization authentication (`org/logreg/*`) */
  'Login',
  'Register',
  'OTPVerification',
  'OrganizationForgotPassword',
  'OrganizationResetPassword',
  'OrgPrivacy',
  'Grouping',
  'Method',
  'TestConnection',

  /* منوی ورودی اپ — دروازه‌ی هر دو مسیر ورود است */
  //
  // The four-way entry menu (systematic order / urgent order / AI /
  // organisation-company) is how a signed-out visitor reaches *either* login
  // flow: the customer chooser (`SignInLanding`) and the organisation login
  // (`Grouping` → `Login`) both hang off it. Guarding it made `RequireAuth`
  // bounce every signed-out visitor to `SignInLanding`, which removed the
  // organisation login from the app entirely — you could not sign in to an
  // organisation account at all.
  //
  // It is safe to expose: the screen renders four navigation buttons and a
  // support phone number from the public contacts endpoint, reads nothing off
  // the user and issues no authenticated request. `OrderMenuScreen.js` has said
  // so in a comment since it was written; the route table simply never agreed.
  'OrderMenuScreen',

  /* Static / informational — readable without an account */
  'AboutScreen',
  'PrivacyScreen',
  'OrganizationTermsScreen',
  'LearnMoreScreen',
  'FAQScreen',
  'ArticlesScreen',
  'GuideScreen',
  'WebView',

  /* Dev-only */
  'ReceiptGallery',
]);

/**
 * Does this route need a signed-in user?
 *
 * @param {string} routeName
 * @returns {boolean}
 */
export const requiresAuth = (routeName) => !PUBLIC_ROUTES.has(routeName);

/** Where a signed-out visitor is sent when they reach for a guarded route. */
export const AUTH_ROUTE = 'SignInLanding';

/**
 * Routes on which the Android back button should offer to exit the app.
 *
 * `List` is the home page a signed-in cold start lands on and `SignInLanding`
 * is where a signed-out one lands, so both belong here — otherwise back from
 * either pops to an empty stack. (`Landing` replaces itself with one of the
 * two, so neither ever has a screen beneath it.)
 *
 * A customer's home, `SystematicCategoryScreen` (navigation/homeRoute.js), is
 * deliberately *not* listed: for an organisation user it sits above `List`, so
 * back must pop to `List`. `useExitConfirmation` treats it as a root only when it
 * is the bottom of the stack.
 */
export const ROOT_ROUTES = ['Landing', 'Welcome', 'List', 'SignInLanding'];

export default routes;
