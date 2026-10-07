/**
 * How each route sits in the desktop window, without touching the screen.
 *
 *   page       a card centred on the canvas, under the starry band
 *                                              ← default for any route not listed
 *   narrow     the same card, with the screen in a centred column inside it:
 *              single-column forms and receipts, which only get harder to
 *              read when they are wide
 *   dashboard  no card: desktop-designed screens lay out their own cards and
 *              grids directly on the canvas
 *
 * page, narrow and dashboard all share one content width and one gap under
 * the top bar (contentMaxWidth / contentTopGap in ./Breakpoints).
 *   full       the whole window, no sidebar or top bar (splash, entry screens)
 *   auth       sign-in and sign-up forms beside the brand panel
 *   authWide   the same, with a wider form card for long sign-up forms
 *
 * Whether the sidebar shows is decided separately, by MenuContext's
 * `screensWithoutMenu`.
 */
const LAYOUTS = {
  Landing: 'full',
  Welcome: 'full',
  SignInLanding: 'full',
  OrderMenuScreen: 'full',
  Grouping: 'full',
  Method: 'full',
  AccessRestrictedScreen: 'full',

  MainSignIn: 'auth',
  LoginScreen: 'auth',
  RegistrationVerificationScreen: 'auth',
  ForgotPassword: 'auth',
  ResetPasswordScreen: 'auth',
  Login: 'auth',
  Register: 'authWide',
  OTPVerification: 'auth',
  OrganizationForgotPassword: 'auth',
  OrganizationResetPassword: 'auth',

  // Desktop-designed screens (renderer/overrides/…)
  SystematicCategoryScreen: 'dashboard',
  List: 'dashboard',
  OrdersScreen: 'dashboard',
  CanceledOrdersScreen: 'dashboard',
  Wallet: 'dashboard',
  TransactionsScreen: 'dashboard',
  MessageScreen: 'dashboard',
  SystematicDeviceScreen: 'dashboard',
  ComprehensiveSelectionScreen: 'dashboard',
  RateCategory: 'dashboard',
  LearnMoreScreen: 'dashboard',
  AboutScreen: 'dashboard',
  OrganizationTermsScreen: 'dashboard',
  PrivacyScreen: 'dashboard',
  WarrantyScreen: 'dashboard',
  Profile: 'dashboard',
  ViolationReportScreen: 'dashboard',
  ProductIssueScreen: 'dashboard',
  TrainingRegistrationScreen: 'dashboard',
  FeedbackSurveyScreen: 'dashboard',
  Increase: 'dashboard',
  AddEditNoteScreen: 'dashboard',

  // Single-column forms, receipts and conversations
  ChatRoom: 'narrow',
  IdeaBoxScreen: 'narrow',
  PaymentScreen: 'narrow',
  DiscountCodeScreen: 'narrow',
  DiscountDetail: 'narrow',
  AddNewAddress: 'narrow',
  OrganizationProfile: 'narrow',
  AccountSecurity: 'narrow',
  Details: 'narrow',
  Invoice: 'narrow',
  OrderReceipt: 'narrow',
  Preview: 'narrow',
  OrderSummaryScreen: 'narrow',
  DeviceOrderSummary: 'narrow',
  OrderTrackingScreen: 'narrow',
  OrgPrivacy: 'narrow',
};

/**
 * @param {string} routeName
 * @returns {'page'|'narrow'|'dashboard'|'full'|'auth'|'authWide'}
 */
export function screenLayoutFor(routeName) {
  return LAYOUTS[routeName] || 'page';
}

export default screenLayoutFor;
