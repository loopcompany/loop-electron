# Loop Desktop (لوپ — نسخه ویندوز)

نسخه‌ی ویندوز اپ مشتری لوپ. تمام صفحه‌ها، Redux، سرویس‌های API (`axiosConfig`، `WalletApi`، ...) و
ترجمه‌ها **مستقیم از پروژه‌ی کناری** [`../loop-customer-mobile`](../loop-customer-mobile) خوانده
می‌شوند و **هیچ تغییری در آن پروژه داده نمی‌شود** — همه‌ی کدِ مخصوص دسکتاپ همین‌جاست.

```
ReactNative/
├── loop-customer-mobile/     ← کد مشترک (تنها منبع حقیقت)
└── loop-customer-electron/   ← این پروژه
    ├── electron/
    │   ├── main.js           پنجره، ناوبری، میانبرها، منوی راست‌کلیک
    │   ├── protocol.js       سرو کردن web-build روی app://loop
    │   ├── routing.js        تصمیم‌های خالص URL (تست‌شده)
    │   ├── preload.js        window.loopDesktop (sandbox)
    │   ├── windowState.js    اندازه/مکان پنجره بین اجراها
    │   └── config.js
    ├── renderer/             پروژه‌ی Expo باندل دسکتاپ (منبع: پروژه‌ی موبایل)
    │   ├── metro.config.js   سورس از موبایل + جایگزینی فایل‌های overrides
    │   ├── babel.config.js   همان aliasهای موبایل (@components، ...) + @desktop
    │   ├── desktop/          ماژول‌های فقط-دسکتاپ (سایدبار، breakpoints، قاب صفحه‌ها)
    │   └── overrides/        نسخه‌ی دسکتاپِ چند فایل موبایل، با همان مسیر
    ├── overrides.lock.json   hash نسخه‌ی موبایلی که هر override از رویش نوشته شده
    ├── scripts/              build-web، dev-web، check-overrides، لانچر electron
    ├── test/                 node --test
    └── electron-builder.yml  نصب‌کننده‌ی NSIS ویندوز
```

## دستورها

| دستور | کار |
| --- | --- |
| `npm run dev` | سرور Expo باندل دسکتاپ (:8081) + Electron با hot reload (ویرایش در موبایل هم زنده دیده می‌شود) |
| `npm run build:web` | چک overrides + `expo export -p web` در `renderer/` ← `web-build/` |
| `npm run check:overrides` | آیا فایل موبایلیِ پشت هر override عوض شده؟ |
| `npm run overrides:accept` | بعد از منتقل‌کردن تغییر موبایل به override، hash را به‌روز می‌کند |
| `npm start` | اجرای Electron روی `web-build/` (مثل نسخه‌ی نهایی) |
| `npm run dist:win` | نصب‌کننده‌ی ویندوز: `release/Loop-Setup-<version>.exe` (روی لینوکس به Wine نیاز دارد) |
| `npm run dist:win:portable` | نسخه‌ی بدون نصب: `release/Loop-<version>-win-x64.zip` (بدون Wine) |
| `npm test` | تست‌های routing |

پیش‌نیاز: `npm install` در **هر دو** پروژه. مسیر پروژه‌ی موبایل را با `LOOP_MOBILE_DIR` می‌شود عوض کرد.

## تصمیم‌های معماری

- **`app://loop` به‌جای `file://`** — خروجی Expo مسیرهای مطلق (`/_expo/...`) دارد و React Navigation
  مسیرمحور است (`/orders`، `/list`). اسکیم استاندارد و secure یک origin ثابت می‌دهد که
  localStorage (یعنی AsyncStorage وب و توکن ورود) روی آن می‌ماند. **این origin را عوض نکنید** —
  همه‌ی کاربران logout می‌شوند. مسیرهای بدون پسوند index.html می‌گیرند (معادل `try_files` در nginx).
- **CORS** — API (`clpiran.com`) هدر `Access-Control-Allow-Origin: *` می‌فرستد؛ هیچ پروکسی یا
  دست‌کاری هدری لازم نیست.
- **درگاه پرداخت** — مثل نسخه‌ی وب، `utils/paymentGateway.js` همین پنجره را به درگاه می‌برد و بانک به
  `app://loop/?status=OK` برمی‌گرداند؛ main process این بازگشت را با `loadURL` انجام می‌دهد تا پرش
  https → app:// هرگز مسدود نشود.
- **لینک‌های بیرونی** — `window.open`، `tel:`، `mailto:` و PDF/رسیدهای `clpiran.com/storage|reciept`
  در مرورگر/برنامه‌ی پیش‌فرض ویندوز باز می‌شوند؛ هیچ پنجره‌ی Electron دومی ساخته نمی‌شود.
- **امنیت** — `contextIsolation` + `sandbox` + بدون `nodeIntegration`؛ مجوزها فقط از فهرست
  مجاز (notifications، geolocation، clipboard، fullscreen) و بقیه رد (fail closed).
- **تشخیص دسکتاپ در کد مشترک** — `typeof window !== 'undefined' && !!window.loopDesktop`.

## باندل دسکتاپ و overrideها

`renderer/` یک پروژه‌ی Expo است که entry آن `index.web.js` موبایل است؛ `node_modules`ش لینک به
`node_modules` موبایل است و `public/` در هر build از موبایل کپی می‌شود. Metro هر فایلی را که در
`renderer/overrides/<مسیر>` وجود داشته باشد به‌جای `<موبایل>/<مسیر>` می‌گذارد — برای همه‌ی
importکننده‌ها، با هر شکلی که import شده باشد. importهای نسبیِ داخل یک override (`./systematicFlows`)
از پوشه‌ی فایل موبایل حل می‌شوند، انگار override همان‌جا نشسته است.

> **فایل override تازه فقط با راه‌اندازی دوباره‌ی Metro دیده می‌شود** (`npm run dev` را از نو اجرا کنید).

**هزینه‌ی override:** هر override یک کپی است. اگر تیم موبایل فایل اصلی را عوض کند، build با پیام
`check-overrides` متوقف می‌شود؛ تغییر را (با `git log -p` که پیام نشان می‌دهد) به override منتقل
کنید و `npm run overrides:accept` بزنید. پس override را فقط وقتی بسازید که راه دیگری نیست.

overrideهای فعلی — منطق (درخواست‌ها، state، اعتبارسنجی) همان فایل موبایل است و فقط ظاهر عوض شده:

| گروه | فایل‌ها | چه می‌کند |
| --- | --- | --- |
| پوسته | `contexts/MenuContext.js`، `components/ScreenHeaders.js` | سایدبار، نوار بالا، قاب صفحه‌ها، پالت فرمان؛ هدر صفحه‌ها چیزی رسم نمی‌کند و فقط عنوان و «بازگشت» را به نوار بالا می‌دهد |
| ظاهر سراسری | `styles/NewStyles.js`، `components/Button.js`، `Loader.js`، `BlankScreen.js`، `PairButton.js`، `ConfirmationModal.js`، `Folder.js`، `OrgSelectionKit.js` | همه‌ی صفحه‌هایی که جداگانه بازطراحی نشده‌اند هم ظاهر دسکتاپ می‌گیرند؛ `BlankScreen` برای هر صفحه آیکون و متن مناسب خودش را انتخاب می‌کند |
| صفحه‌های دسکتاپ | `org/SystematicCategoryScreen.js` (داشبورد مشتری)، `org/List.js` (داشبورد سازمان)، `org/SystematicDeviceScreen.js` (ویزارد سفارش)، `screens/orders/OrdersScreen.js`، `CanceledOrdersScreen.js`، `components/OrderItem.js`، `screens/account/Wallet.js`، `screens/TransactionsScreen.js`، `screens/MessageScreen.js`، `org/ComprehensiveSelectionScreen.js` (ویزارد انتخاب جامع)، `screens/RateCategory.js` (نرخ‌نامه) | چیدمان واقعی دسکتاپ: شبکه‌ی کارت، جدول، ستون‌ها |
| صفحه‌های متنی | `screens/resources/LearnMoreScreen.js` (سوالات متداول)، `AboutScreen.js`، `OrganizationTermsScreen.js`، `PrivacyScreen.js`، `WarrantyScreen.js` | جستجو، بخش‌های شماره‌دار، فهرست مطالب و دسترسی به پشتیبانی (`desktop/DocumentPage.js`) |
| صفحه‌های ورودی | `screens/orders/OrderMenuScreen.js`، `screens/auth/SignInLanding.js`، `org/logreg/Grouping.js` | تصویر کیهانی تمام‌پنجره + کارت شیشه‌ای عملیات (`desktop/EntryLayout.js`) |
| فرم‌های ورود و ثبت‌نام | `screens/auth/LoginScreen.js`، `MainSignIn.js`، `RegistrationVerificationScreen.js`، `org/logreg/Login.js`، `Register.js`، `OTPVerification.js` | فرم دسکتاپ روی کارت شیشه‌ای (`desktop/AuthKit.js`): سوییچ حساب شخصی/سازمانی، فیلدهای برچسب‌دار، کد امنیتی و کد یک‌بارمصرف یک‌تکه، Enter برای ارسال، خطاها داخل فرم به‌جای `alert()`؛ ثبت‌نام سازمان در بخش‌های دوستونه |

### چیدمان

باندل دسکتاپ فقط یک چیدمان دارد — چیدمان موبایل (داک شناور، مودال منو) هیچ‌وقت نشان داده نمی‌شود،
حتی با زوم. کوچک‌ترین اندازه‌ی پنجره 1100×700 است (`minWindow` در `renderer/desktop/Breakpoints.js`
و `MIN_WINDOW` در `electron/main.js`؛ روی صفحه‌نمایش کوچک‌تر، به اندازه‌ی صفحه).

نوع هر صفحه در `renderer/desktop/screenLayouts.js` تعیین می‌شود — بدون دست‌زدن به خود صفحه:

| نوع | چیدمان |
| --- | --- |
| `page` (پیش‌فرض) | کارت سفید وسط بوم (حداکثر 1120px) که روی نوار ستاره‌ای زیر نوار بالا می‌نشیند |
| `narrow` | همان کارت، باریک‌تر (860px): فرم‌ها، رسیدها، صفحه‌های متنی |
| `dashboard` | بدون کارت: صفحه‌های دسکتاپ (overrideها) کارت‌ها و شبکه‌ی خودشان را تمام‌عرض روی بوم می‌چینند |
| `full` | کل پنجره بدون سایدبار و نوار بالا (اسپلش و صفحه‌های ورودی) |
| `auth` | فرم ورود/ثبت‌نام به شکل کارت شناور کنار داستان برند (`DesktopAuthPanel`)، هر دو روی یک تصویر |
| `authWide` | همان، با کارت فرم پهن‌تر و پنل برند فشرده — برای فرم‌های ثبت‌نام بلند (ثبت‌نام سازمان) |

`page`، `narrow` و `dashboard` همه یک عرض محتوا (`contentMaxWidth`) و یک فاصله از نوار بالا
(`contentTopGap`) دارند — هر دو در `renderer/desktop/Breakpoints.js`؛ عرض صفحه‌ها را فقط همان‌جا عوض کنید.

صفحه‌ای که در `screenLayouts.js` نیست `page` می‌گیرد؛ صفحه‌ی تازه‌ی موبایل بدون هیچ کاری درست در قاب می‌نشیند.
در `full` و `auth` نوار بالا نیست، پس پوسته یک دکمه‌ی «بازگشت» شناور نشان می‌دهد.

### زبان طراحی («Loop Nebula»)

برند سرمه‌ای (`#002b54`) و طلایی (`#ffd700`) روی آسمان شب است. روی دسکتاپ آن تصویر «قاب» است و صفحه‌ها
روی سطح روشن می‌نشینند تا فرم‌ها و فهرست‌های بلند خوانا بمانند:

- **سایدبار** — گرادیان کیهانی سرمه‌ای، دکمه‌ی طلایی «ثبت سفارش جدید»، گروه‌های منو با آیکون
  (`desktop/routeMeta.js`)، کارت حساب کاربر؛ با دکمه‌ی ‹ به نوار آیکون جمع می‌شود و انتخاب ذخیره می‌ماند.
- **نوار بالا** (`DesktopTopBar`) — بازگشت، مسیر و عنوان صفحه، جستجو، موجودی کیف پول، پیام‌ها.
- **پالت فرمان** (`CommandPalette`) — `Ctrl+K` یا `Ctrl+F`: پرش به هر صفحه یا عملیات با کیبورد.
- **توکن‌ها** در `desktop/desktopTheme.js` (رنگ، سایه، گرادیان، شعاع، حرکت)؛ اجزای آماده (`DButton`،
  `Card`، `Pill`، `IconTile`، `EmptyState`، `Skeleton`، `Spinner`) در `desktop/ui.js`؛ دیالوگ در
  `desktop/Dialog.js`؛ قاب ویزارد سفارش در `desktop/WizardLayout.js`؛ اجزای داشبورد در
  `desktop/DashboardParts.js`؛ CSS سراسری (اسکرول‌بار، فوکوس، انتخاب متن) در `desktop/globalStyles.js`.
- **حالت روشن / تیره** (`desktop/theme.js`) — دکمه‌ی ماه/خورشید در نوار بالا و در پالت فرمان؛ انتخاب
  ذخیره می‌ماند (پیش‌فرض: روشن). رنگ‌های سطح و متن در `desktopTheme.js` متغیر CSS هستند
  (`THEME_VARS`)؛ پس کامپوننت‌ها برای عوض‌شدن تم دوباره رندر نمی‌شوند. صفحه‌های موبایلیِ داخل کارت
  (`page` / `narrow`) رنگ‌های روشن خودشان را دارند، پس کارتشان (`data-loop-paper`) در حالت تیره هم روشن
  می‌ماند. کد جدید رنگ پس‌زمینه را از `surface.*` بگیرد، نه `palette.white`.
- **فرم‌های ورود شیشه‌ای** — کارت فرم شیشه‌ی مات روی تصویر ماه است. صفحه‌های ورود و ثبت‌نام (شخصی و
  سازمانی) با اجزای `desktop/AuthKit.js` از نو چیده شده‌اند (`AuthScreen`، `AccountSwitch`، `AuthField`،
  `AuthInput`، `PasswordInput`، `CaptchaField`، `OtpInput`، `SubmitButton`، ...)؛ ارقام فارسی در فیلدهای
  عددی خودکار انگلیسی می‌شوند. صفحه‌های بازیابی و تغییر رمز هنوز صفحه‌ی موبایل‌اند و با CSS محدود به
  `[data-loop-auth]` (`desktop/glassAuth.js`) شیشه‌ای می‌شوند؛ فیلدهای AuthKit (`data-loop-field`) از آن CSS
  مستثنا هستند.
- انیمیشن‌ها با `animate()` / `loop()` از `globalStyles.js` — react-native-web فقط `animationKeyframes`
  را می‌پذیرد، نه `animationName`. تصویری که باید از قابش بزرگ‌تر باشد را با `transform: scale` بزرگ کنید؛
  react-native-web عرض تصویر را به عرض والد محدود می‌کند.

روی ویندوز قاب بومی پنجره حذف و نوار عنوان خود اپ (`DesktopTitleBar`) با `titleBarOverlay` کشیده
می‌شود؛ دکمه‌های کمینه/بیشینه/بستن را خود ویندوز رویش می‌کشد. روی لینوکس قاب بومی می‌ماند
(`LOOP_TITLEBAR=overlay npm run dev` برای امتحان). رنگ‌های پوسته در `renderer/desktop/desktopTheme.js`.

## نکته‌ها

- اگر ترمینال از VS Code باز شده، ممکن است `ELECTRON_RUN_AS_NODE=1` داشته باشد؛ `scripts/electron.js`
  آن را حذف می‌کند، پس همیشه از `npm start` / `npm run dev` استفاده کنید نه `electron .`.
- `LOOP_SCREENSHOT=out.png npm start` — اپ را باز می‌کند، اسکرین‌شات می‌گیرد و می‌بندد (smoke test).
- DevTools (`F12`) فقط در حالت dev یا اجرای unpacked فعال است.

## نقشه‌ی راه

- [x] مرحله ۱ — پوسته، پروتکل `app://`، ناوبری/پرداخت، اجرای واقعی روی web build
- [x] مرحله ۲ — خروجی exe: نصب‌کننده‌ی NSIS + نسخه‌ی portable (هنوز روی ویندوز واقعی تست نشده)
- [~] مرحله ۳ — چیدمان دسکتاپ (همه در این پوشه):
  - [x] باندل مستقل `renderer/` + مکانیزم override + چک drift
  - [x] سایدبار دسکتاپ و قاب صفحه‌ها به ازای route
  - [x] زبان طراحی دسکتاپ: پوسته، قاب صفحه‌ها، ظاهر سراسری، پالت فرمان
  - [x] صفحه‌های دسکتاپ: داشبوردها، سفارش‌ها، ویزارد سفارش سیستماتیک، کیف پول، تراکنش‌ها، پیام‌ها، صفحه‌های ورودی
  - [x] انتخاب جامع، نرخ‌نامه، صفحه‌های متنی، فرم‌های ورود شیشه‌ای، حالت تیره، عرض یکسان صفحه‌ها
  - [ ] بعدی: جزئیات سفارش (`Details`)، پروفایل
  - [ ] بازبینی صفحه‌های پشت لاگین با حساب تست واقعی
- [ ] مرحله ۴ — اعلان‌ها: FCM وب در Electron کار نمی‌کند؛ اعلان بومی ویندوز
- [ ] مرحله ۵ — آپدیت خودکار (electron-updater) و امضای کد
