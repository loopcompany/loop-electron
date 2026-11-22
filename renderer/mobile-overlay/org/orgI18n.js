// Fast bilingual lookup for the organization "selection" flow (List /
// Comprehensive / Systematic screens + their shared kit).
//
// The Persian string stays the canonical value in the data files
// (deviceCatalog.js, systematicFlows.js, the SECTION/OPTION arrays). This map
// only supplies the English rendering. Wrap a value with `L(...)` at the render
// site (not at module load) so it reacts to a runtime language switch, and use
// `LO(list)` to translate the `title` of an options array before passing it to
// SelectableOptions / grids.
import i18n from '@i18n';

// fa -> en. Anything missing falls back to the Persian text unchanged.
const EN = {
  // --- entry / headers -------------------------------------------------------
  'سازمانی / دولتی': 'Organization / Government',
  'انتخاب جامع': 'Comprehensive Selection',
  'انتخاب سیستماتیک': 'Systematic Selection',
  'انتخاب جامع - خدمات سازمانی': 'Comprehensive Selection - Organization Services',
  'در «انتخاب جامع» تمام خدمات نرم‌افزاری، سخت‌افزاری و تامین تجهیزات سازمان را یکجا در یک فرم کامل ثبت می‌کنید.':
    'In "Comprehensive Selection" you register all of the organization\'s software, hardware and equipment-supply needs at once in a single complete form.',
  'در «انتخاب سیستماتیک» دسته‌بندی مورد نظر (کیس، لپ‌تاپ، پرینتر و ...) را جداگانه انتخاب و سفارش می‌دهید.':
    'In "Systematic Selection" you pick a category (case, laptop, printer, ...) and order for it separately.',

  // --- categories / devices ------------------------------------------------
  'حساب کاربری': 'User Account',
  'لپ تاپ': 'Laptop',
  'لپتاپ': 'Laptop',
  'پرینتر / کپی': 'Printer / Copy',
  'پرینتر کپی': 'Printer / Copy',
  'پرینتر': 'Printer',
  'کپی': 'Copy',
  'مانیتور': 'Monitor',
  'نمایشگر': 'Monitor',
  'کیس': 'Case',
  'کیس / پی‌سی': 'Case / PC',
  'کیس پی سی': 'Case / PC',
  'ضایعات': 'Trash / Scrap',
  'اقلام ضایعاتی': 'Scrap items',
  'آل این وان': 'All in One',
  'هارد دیسک': 'Hard Disk',
  'هارد': 'Hard Disk',
  'هارد ذخیره‌سازی': 'Storage Drive',
  'دسته‌بندی': 'Category',
  'کیس معمولی': 'Standard Case',
  'کیس حرفه‌ای': 'Professional Case',
  'مینی کیس': 'Mini Case',
  'پرینتر لیزری تک‌کاره': 'Single-function Laser Printer',
  'پرینتر لیزری چندکاره': 'Multi-function Laser Printer',
  'لیزری تک‌کاره': 'Single-function laser',
  'لیزری چندکاره': 'Multi-function laser',
  'دستگاه کپی صنعتی': 'Industrial Copier',
  'کپی صنعتی': 'Industrial copier',
  'جوهرافشان': 'Inkjet',
  'شبکه و اینترنت': 'Network & Internet',
  'شبکه / اینترنت': 'Network / Internet',
  'قطعات کیس': 'Case Parts',
  'قطعات لپ‌تاپ': 'Laptop Parts',
  'لوازم جانبی': 'Accessories',

  // --- OS ------------------------------------------------------------------
  'ویندوز 11': 'Windows 11',
  'ویندوز 10': 'Windows 10',
  'ویندوز 8.1': 'Windows 8.1',
  'ویندوز 7': 'Windows 7',
  'ویندوز XP': 'Windows XP',
  'ویندوز سرور': 'Windows Server',
  'لینوکس': 'Linux',
  'سیستم عامل Mac': 'macOS',

  // --- software ----------------------------------------------------------
  'نصب نرم‌افزارهای کاربردی/عمومی/آفیس': 'Install general / office applications',
  'نصب نرم‌افزارهای مهندسی': 'Install engineering software',
  'نصب نرم‌افزارهای گرافیکی': 'Install graphics software',
  'نصب آنتی ویروس': 'Install antivirus',
  'نرم‌افزارهای دیگر': 'Other software',
  'نصب نرم افزار': 'Software installation',
  'نصب نرم‌افزارها': 'Install software',
  'نصب سیستم عامل': 'Operating system installation',
  'انتخاب سیستم عامل': 'Select operating system',

  // --- section titles (Comprehensive) ----------------------------------
  'نحوه ارائه خدمات': 'Service delivery mode',
  'خدمات نرم‌افزاری': 'Software services',
  'خدمات سخت‌افزاری': 'Hardware services',
  'تامین تجهیزات / کالا': 'Equipment / goods supply',
  'تامین قطعات / کالا': 'Parts / goods supply',
  'وضعیت فعلی تجهیزات': 'Current equipment status',
  'زیر ساخت‌های حیاتی': 'Critical infrastructure',
  'سطح خدمات و تامین تجهیزات': 'Service level & equipment supply',
  'بازه زمانی / رزرو': 'Time slot / booking',
  'اطلاعات اپراتور': 'Operator information',
  'انتخاب تکنسین': 'Technician selection',
  'بارگزاری نامه / درخواست': 'Upload letter / request',
  'نمایش / استعلام / ثبت سفارش': 'Preview / inquiry / submit order',
  'توافق نامه': 'Agreement',
  'رزرو / مراجعه تکنسین': 'Booking / technician visit',
  'تخفیف پنل / کد تشویقی': 'Panel discount / discount code',
  'کد تشویقی': 'Discount code',

  // --- section hints (Comprehensive) ---------------------------------
  'مشخص کنید خدمات به چه شکل و در چه بازه‌ای ارائه شود: کوتاه‌مدت/یکبار، ماهانه، سالیانه یا پروژه‌ای.':
    'Specify how and over what period the services should be delivered: short-term/one-time, monthly, yearly or project-based.',
  'تعداد سیستم‌عامل‌ها و نرم‌افزارهای مورد نیاز برای نصب را برای هر مورد مشخص کنید.':
    'Specify the number of operating systems and software to install for each item.',
  'تعداد و توضیحات مربوط به سرویس سخت‌افزاری هر دسته از تجهیزات (لپ‌تاپ، کیس، مانیتور و ...) را وارد کنید.':
    'Enter the count and notes for the hardware service of each equipment category (laptop, case, monitor, ...).',
  'تعداد تجهیزات آکبند یا کارکرده‌ای که نیاز به تامین دارید را برای هر دسته وارد کنید.':
    'Enter the number of new or used devices you need supplied for each category.',
  'وضعیت کنونی تجهیزات سازمان را از نظر نیاز به بررسی نرم‌افزاری، سخت‌افزاری یا تامین کالا مشخص کنید.':
    'Specify the current state of the organization\'s equipment in terms of needing software review, hardware review or goods supply.',
  'مهم‌ترین زیرساخت سازمان (نرم‌افزار سازمانی، شبکه/اینترنت یا سخت‌افزار) را انتخاب کنید تا در اولویت بررسی قرار گیرد.':
    'Select the organization\'s most important infrastructure (enterprise software, network/internet or hardware) so it is reviewed first.',
  'سطح اولویت ارائه خدمت (استاندارد، اولویت‌دار یا اضطراری) را انتخاب کنید.':
    'Select the service priority level (standard, priority or emergency).',
  'بسته به نحوه ارائه خدمات انتخابی، تاریخ، بازه زمانی و تعداد بازدید مورد نیاز را تعیین کنید.':
    'Depending on the chosen delivery mode, set the date, time slot and number of visits needed.',
  'مشخصات فردی که به عنوان اپراتور/رابط سازمان با تکنسین در ارتباط خواهد بود را وارد کنید.':
    'Enter the details of the person who will be the operator / liaison between the organization and the technician.',
  'جنسیت تکنسینی که برای انجام خدمت مراجعه می‌کند را انتخاب کنید.':
    'Select the gender of the technician who will visit to perform the service.',
  'در صورت نیاز، نامه یا درخواست رسمی سازمان را به‌صورت فایل بارگذاری کنید (اختیاری).':
    'If needed, upload the organization\'s official letter or request as a file (optional).',
  'پیش از ثبت نهایی می‌توانید پیش‌رسید را صادر یا مشاهده کنید و در نهایت سفارش را ثبت یا لغو نمایید.':
    'Before final submission you can issue or view the pre-receipt, and finally submit or cancel the order.',

  // --- delivery mode / options ---------------------------------------
  'کوتاه مدت / یکبار': 'Short-term / one-time',
  'کوتاه مدت / ماهانه': 'Short-term / monthly',
  'بلند مدت / سالیانه': 'Long-term / yearly',
  'پروژه‌ای': 'Project-based',
  'نیاز به بررسی نرم‌افزاری': 'Needs software review',
  'نیاز به بررسی سخت‌افزاری': 'Needs hardware review',
  'تامین کالا / بررسی فنی': 'Goods supply / technical review',
  'فاقد تجهیزات / تامین کالا': 'No equipment / goods supply',
  'نرم‌افزارهای سازمانی': 'Enterprise software',
  'سخت‌افزار': 'Hardware',
  'سخت افزار (پیش فرض)': 'Hardware (default)',
  'استاندارد': 'Standard',
  'اولویت‌دار': 'Priority',
  'اضطراری': 'Emergency',
  '۲ بازدید در ماه': '2 visits per month',
  '۴ بازدید در ماه': '4 visits per month',
  '۶ بازدید در ماه': '6 visits per month',
  'طبق توافق‌نامه': 'Per the agreement',
  'برحسب زمان حضور': 'Based on presence time',
  'فروش تحویل پروژه': 'Project delivery sale',
  'طبق پیشرفت پروژه': 'Per project progress',
  'تعداد بازدید': 'Number of visits',
  'تاریخ شروع': 'Start date',
  'تاریخ مراجعه': 'Visit date',
  'بازه ساعتی': 'Time slot',
  'چون «کوتاه مدت / یکبار» انتخاب شده، فقط روز و بازه ساعتی مراجعه را انتخاب کنید.':
    'Since "Short-term / one-time" is selected, just choose the day and time slot for the visit.',

  // --- technician gender -------------------------------------------------
  'آقا': 'Male',
  'خانم': 'Female',
  'خانم (به‌زودی)': 'Female (Coming soon)',

  // --- operator info form --------------------------------------------
  'عنوان شغلی اپراتور': 'Operator job title',
  'نام و نام خانوادگی اپراتور': 'Operator full name',
  'شماره ملی اپراتور': 'Operator national ID',
  'شماره تلفن موبایل اپراتور': 'Operator mobile number',
  'تاریخ تولد (روز/ماه/سال)': 'Date of birth (D/M/Y)',
  'بارگزاری نامه (اختیاری)': 'Upload letter (optional)',

  // --- order actions --------------------------------------------------
  'صدور پیش‌رسید': 'Issue pre-receipt',
  'نمایش پیش‌رسید': 'View pre-receipt',
  'ثبت سفارش': 'Submit order',
  'لغو سفارش': 'Cancel order',
  'آیا از لغو سفارش مطمئن هستید؟': 'Are you sure you want to cancel the order?',
  'انصراف': 'Dismiss',
  'سفارش لغو شد': 'Order canceled',
  'پیش‌رسید صادر شد': 'Pre-receipt issued',
  'لطفاً اطلاعات اپراتور را کامل کنید.': 'Please complete the operator information.',
  'خطا در بارگذاری فایل': 'Error uploading file',
  'خطا در دریافت دسته‌ها': 'Error fetching categories',

  // --- summary sub-labels ------------------------------------------
  'آکبند': 'New',
  'اکبند': 'New',
  'کارکرده': 'Used',
  'نو / آکبند': 'New',
  'کارکرده و سالم': 'Used & healthy',
  'برای موارد دارای توضیحات، تعداد را وارد کنید.': 'Enter a quantity for each item with a description.',
  'ابتدا یک آدرس ثبت کنید.': 'Add an address first.',
  'مدیریت آدرس‌ها': 'Manage addresses',
  'آدرس محل مراجعه را انتخاب کنید.': 'Choose the service address.',
  'برآورد هزینه سفارش شما آماده است.': 'Your order estimate is ready.',
  'استعلام سفارش': 'Request an estimate',
  'پیش‌رسید برآورد سفارش': 'Order estimate',
  'دلیل درخواست بازنگری را وارد کنید.': 'Enter the reason for requesting a revision.',
  'دلیل درخواست بازنگری': 'Reason for requesting a revision',
  'ثبت تصمیم انجام نشد.': 'Could not save your decision.',
  'درخواست بازنگری هزینه‌ها': 'Request a price review',
  'وضعیت هارد دیسک': 'Drive condition',
  'وضعیت فعلی هارد دیسک را انتخاب کنید.': 'Choose the current condition of the drive.',
  'خلاصه سفارش': 'Order summary',
  'تعداد مورد نیاز': 'Quantity needed',
  '{n} از {total} مرحله تکمیل شده': '{n} of {total} steps completed',

  // --- shared kit misc -------------------------------------------------
  'توضیحات': 'Notes',
  'توضیحات...': 'Notes...',
  'توضیحات (اختیاری)': 'Notes (optional)',
  'توضیحات اضافی را وارد کنید...': 'Enter additional notes...',
  'توضیحات دیگری دارید بنویسید...': 'Write any other notes...',
  'توضیح درباره زمان مراجعه (اختیاری)': 'Note about the visit time (optional)',
  'درخواست دیگری دارید بنویسید...': 'Write any other request...',
  'شرح کلی نیاز خود را وارد کنید...': 'Describe your overall need...',
  'برند دیگر (اگر در فهرست بالا نیست)': 'Other brand (if not in the list above)',
  'بارگزاری عکس مرتبط با سفارش': 'Upload a photo related to the order',
  'عکس از گالری و دوربین': 'Photo from gallery or camera',
  'برای گرفتن عکس، دسترسی به دوربین لازم است': 'Camera access is required to take a photo',
  'برای انتخاب عکس، دسترسی به گالری لازم است': 'Gallery access is required to pick a photo',
  'خطا در انتخاب عکس': 'Error selecting photo',
  'ابتدا روز مراجعه، سپس بازه ساعتی را انتخاب کنید': 'Choose the visit day first, then the time slot',
  'بازه ساعتی را انتخاب کنید': 'Select a time slot',
  'ساعت': 'at',
  'امروز': 'Today',
  'فردا': 'Tomorrow',
  'تقویم': 'Calendar',
  'به زودی': 'Coming soon',
  'عکس': 'Photo',
  'لطفاً این مرحله را تکمیل کنید': 'Please complete this step',
  'مراحل این دسته هنوز تعریف نشده است.': 'The steps for this category are not defined yet.',

  // --- time slots ------------------------------------------------------
  '۱۰ الی ۱۲': '10–12',
  '۱۲ الی ۱۴': '12–14',
  '۱۴ الی ۱۶': '14–16',
  '۱۶ الی ۱۸': '16–18',
  '۱۸ الی ۲۰': '18–20',
  '۱۰ صبح به بعد': 'From 10 AM',
  '۱۲ ظهر به بعد': 'From 12 PM',
  '۱۴ الی ۱۷ عصر': '2–5 PM',

  // --- systematic flow: shared step titles / hints -------------------
  'برند لپ تاپ': 'Laptop brand',
  'برند مانیتور': 'Monitor brand',
  'برند کیس': 'Case brand',
  'برند پرینتر / کپی': 'Printer / copier brand',
  'برند آل این وان': 'All-in-One brand',
  'برند هارد دیسک': 'Hard disk brand',
  'برند لپ تاپ خود را انتخاب کنید. اگر برند شما در فهرست نیست، آن را در کادر «برند دیگر» بنویسید.':
    'Select your laptop brand. If your brand is not listed, type it in the "Other brand" box.',
  'برند مانیتور خود را انتخاب کنید. اگر برند شما در فهرست نیست، آن را در کادر «برند دیگر» بنویسید.':
    'Select your monitor brand. If your brand is not listed, type it in the "Other brand" box.',
  'برند کیس یا مونتاژکننده‌ی آن را انتخاب کنید.': 'Select the case brand or its assembler.',
  'برند دستگاه چاپ یا کپی خود را انتخاب کنید.': 'Select your printer or copier brand.',
  'برند دستگاه آل این وان خود را انتخاب کنید.': 'Select your All-in-One device brand.',
  'برند هارد یا حافظه‌ی خود را انتخاب کنید.': 'Select your hard drive or storage brand.',
  'مونتاژ ایرانی': 'Iranian assembly',

  'مدل لپ تاپ': 'Laptop model',
  'مدل مانیتور': 'Monitor model',
  'مدل کیس': 'Case model',
  'مدل / مشخصات کیس': 'Case model / specs',
  'مدل پرینتر / کپی': 'Printer / copier model',
  'مدل آل این وان': 'All-in-One model',
  'مدل دستگاه': 'Device model',
  'مدل لپ تاپ (مثلاً X550)': 'Laptop model (e.g. X550)',
  'در صورتی که مدل لپ تاپ را می‌دانید بنویسید. مثلاً X550': 'Enter the laptop model if you know it. E.g. X550',
  'مدل دقیق / شماره سریال (اختیاری)': 'Exact model / serial number (optional)',
  'مدل دقیق دستگاه و شماره سریال آن را وارد کنید.': 'Enter the exact device model and its serial number.',
  'مدل، شماره سریال و مشخصات کلی دستگاه را وارد کنید.': 'Enter the model, serial number and general specs of the device.',
  'مدل و مشخصات سخت‌افزاری کیس را وارد کنید.': 'Enter the case model and hardware specs.',
  'شماره سریال': 'Serial number',
  'مشخصات (CPU / RAM / هارد)': 'Specs (CPU / RAM / disk)',
  'مشخصات (CPU / RAM / هارد / گرافیک)': 'Specs (CPU / RAM / disk / GPU)',

  'وضعیت دستگاه': 'Device status',
  'وضعیت لپ تاپ': 'Laptop status',
  'وضعیت مانیتور': 'Monitor status',
  'وضعیت محصول / دستگاه': 'Product / device status',
  'وضعیت اقلام': 'Items status',
  'وضعیت گارانتی': 'Warranty status',
  'وضعیت کلی دستگاه و شرایط گارانتی آن را انتخاب کنید.': 'Select the overall device condition and its warranty status.',
  'وضعیت کلی مانیتور و شرایط گارانتی آن را انتخاب کنید.': 'Select the overall monitor condition and its warranty status.',
  'وضعیت کلی اقلام تحویلی را مشخص کنید.': 'Specify the overall condition of the delivered items.',
  'وضعیت ظاهری دستگاه را مشخص کنید تا هنگام تحویل اختلافی پیش نیاید.':
    'Specify the device\'s physical condition to avoid disputes at handover.',
  'در گارانتی': 'In warranty',
  'خارج از گارانتی': 'Out of warranty',
  'نامشخص': 'Unknown',
  'معیوب / نیاز به تعمیر': 'Faulty / needs repair',
  'اسقاط / غیرقابل استفاده': 'Scrap / unusable',
  'اسقاط': 'Scrap',
  'اسقاط کامل': 'Full scrap',
  'قابل تعمیر / بازیابی': 'Repairable / recoverable',
  'فقط قطعات قابل استفاده': 'Only usable parts',

  'ایراد ظاهری': 'Cosmetic defect',
  'ایراد فیزیکی / ظاهری مانیتور': 'Monitor physical / cosmetic defect',
  'بدنه سالم است': 'Body is intact',
  'خط و خش روی بدنه': 'Scratches on the body',
  'شکستگی بدنه / لولا': 'Broken body / hinge',
  'خط افتادگی صفحه نمایش': 'Screen line defect',
  'کیبورد / دکمه‌ها فرسوده': 'Worn keyboard / buttons',
  'برچسب / گارانتی مخدوش': 'Damaged label / warranty seal',
  'پایه / بدنه شکسته است': 'Stand / body is broken',
  'لکه، خط عمودی یا خط و خش روی صفحه': 'Stain, vertical line or scratch on the screen',
  'در صورتی که لپ تاپ دارای نواقص ظاهری می‌باشد بنویسید.': 'Describe any cosmetic defects the laptop has.',
  'در صورتی که لپ تاپ دارای نواقص ظاهری می‌باشد بنویسید...': 'Describe any cosmetic defects the laptop has...',

  'ایراد دستگاه': 'Device fault',
  'ایراد حافظه': 'Storage fault',
  'سایر مشکلات': 'Other issues',
  'سایر مشکلات مانیتور': 'Other monitor issues',
  'ایرادهای سخت‌افزاری متداول دستگاه؛ هر مورد که مصداق دارد را انتخاب کنید.':
    'Common hardware faults of the device; select every one that applies.',
  'ایرادهای سخت‌افزاری متداول کیس؛ هر مورد که مصداق دارد را انتخاب کنید.':
    'Common hardware faults of the case; select every one that applies.',
  'مشکلات متداول نرم‌افزاری و سیستمی لپ تاپ؛ هر مورد که مصداق دارد را انتخاب کنید.':
    'Common software / system issues of the laptop; select every one that applies.',
  'مشکلات مشاهده‌شده روی دستگاه چاپ را انتخاب کنید.': 'Select the issues seen on the printing device.',
  'مشکلات مشاهده‌شده روی مانیتور را انتخاب کنید.': 'Select the issues seen on the monitor.',
  'مشکل مشاهده‌شده روی هارد یا حافظه را انتخاب کنید.': 'Select the issue seen on the drive or storage.',

  'دستگاه روشن نمی‌شود': 'Device does not power on',
  'دستگاه کند است': 'Device is slow',
  'صدای غیرعادی می‌دهد': 'Makes abnormal noise',
  'صدا / فن مشکل دارد': 'Sound / fan problem',
  'هنگ می‌کند / ریست می‌شود': 'Freezes / restarts',
  'پیغام صفحه آبی می‌آید': 'Blue screen error appears',
  'پورت‌ها کار نمی‌کنند': 'Ports do not work',
  'پورت HDMI / کابل مشکل دارد': 'HDMI port / cable problem',
  'کیبورد کار نمی‌کند': 'Keyboard does not work',
  'ماوس کار نمی‌کند': 'Mouse does not work',
  'تاچ صفحه کار نمی‌کند': 'Touchscreen does not work',
  'صفحه نمایش تصویر ندارد': 'Screen shows no image',
  'ویندوز نصب نمی‌شود': 'Windows will not install',
  'درایور نصب نمی‌شود': 'Driver will not install',
  'برخی نرم‌افزارها نصب نمی‌شوند': 'Some software will not install',
  'برخی برنامه‌ها اجرا نمی‌شوند': 'Some apps will not run',
  'ویروسی شدن لپ تاپ': 'Laptop is infected with a virus',
  'آنتی ویروس، بروزرسانی یا آپدیت نمی‌شود': 'Antivirus will not update',
  'درایورهای هارد در زمان نصب ویندوز نمایش داده نمی‌شوند': 'Disk drivers not shown during Windows install',

  'کیس روشن نمی‌شود': 'Case does not power on',
  'کیس کار نمی‌کند': 'Case does not work',
  'کیس کند است': 'Case is slow',
  'کیس داغ می‌شود': 'Case overheats',
  'کیس صدا دارد': 'Case is noisy',
  'کیس ریست می‌شود': 'Case keeps resetting',
  'کیس هنگ می‌کند': 'Case freezes',

  'مانیتور روشن نمی‌شود': 'Monitor does not power on',
  'مانیتور تصویر ندارد': 'Monitor shows no image',
  'تصویر چشمک می‌زند یا قطع و وصل می‌شود': 'Image flickers or cuts in and out',
  'رنگ‌ها را درست نمایش نمی‌دهد': 'Colors are not displayed correctly',

  'چاپ نمی‌کند': 'Does not print',
  'اسکنر یا کپی کار نمی‌کند': 'Scanner or copier does not work',
  'کاغذ گیر می‌کند': 'Paper jams',
  'کیفیت چاپ پایین است / خط می‌اندازد': 'Print quality is poor / streaks',
  'تونر / کارتریج نیاز به شارژ یا تعویض دارد': 'Toner / cartridge needs refill or replacement',
  'در شبکه شناسایی نمی‌شود': 'Not detected on the network',

  'بدسکتور دارد / کند است': 'Has bad sectors / is slow',
  'شناسایی نمی‌شود': 'Not detected',
  'اطلاعات پاک شده است': 'Data has been erased',
  'نیاز به فرمت / پارتیشن‌بندی دارد': 'Needs formatting / partitioning',
  'بازیابی اطلاعات پاک‌شده': 'Recover erased data',

  'نوع دستگاه': 'Device type',
  'نوع دستگاه چاپ را مشخص کنید.': 'Specify the type of printing device.',
  'نوع حافظه': 'Storage type',
  'نوع حافظه‌ای که سرویس روی آن انجام می‌شود.': 'The type of storage the service is performed on.',
  'ظرفیت': 'Capacity',
  'ظرفیت حافظه را انتخاب کنید.': 'Select the storage capacity.',
  'ابعاد مانیتور': 'Monitor size',
  'اندازه‌ی صفحه‌ی مانیتور بر حسب اینچ.': 'Monitor screen size in inches.',
  'نوع پنل مانیتور را انتخاب و در صورت نیاز مدل دقیق را بنویسید.':
    'Select the monitor panel type and, if needed, enter the exact model.',
  'HDD اینترنال': 'Internal HDD',
  'هارد اکسترنال': 'External HDD',
  'USB / مستقیم': 'USB / direct',
  'وایرلس': 'Wireless',
  'شبکه (LAN)': 'Network (LAN)',
  'نحوه اتصال': 'Connection method',
  'دستگاه از چه طریقی به سیستم‌ها متصل می‌شود.': 'How the device connects to the computers.',
  '۱۹ اینچ': '19 inch',
  '۲۱.۵ اینچ': '21.5 inch',
  '۲۲ اینچ': '22 inch',
  '۲۴ اینچ': '24 inch',
  '۲۷ اینچ': '27 inch',
  '۳۲ اینچ و بالاتر': '32 inch and above',
  '۲۵۶ گیگابایت': '256 GB',
  '۵۱۲ گیگابایت': '512 GB',
  '۱ ترابایت': '1 TB',
  '۲ ترابایت': '2 TB',
  '۴ ترابایت و بالاتر': '4 TB and above',

  'وضعیت اقلام تحویلی': 'Delivered items status',
  'اطلاعات شخصی در هارد دیسک': 'Personal data on the hard disk',
  'دارای محتویات شخصی در هارد': 'Contains personal data on the disk',
  'اطلاعات مهم دارد - بکاپ گرفته شود': 'Has important data - back it up',
  'اطلاعات مهم ندارد': 'No important data',
  'هارد کاملاً پاک‌سازی شود': 'Fully wipe the disk',
  'حذف کامل محتویات هارد': 'Completely erase disk contents',
  'تعویض هارد و انتقال اطلاعات': 'Replace disk and transfer data',
  'انتقال / بکاپ محتویات توسط تکنسین': 'Data transfer / backup by the technician',
  'پیش از تحویل اقلام، تکلیف اطلاعات روی هاردها را مشخص کنید.':
    'Before handing over the items, decide what happens to the data on the disks.',
  'تعیین تکلیف اطلاعات موجود روی هارد پیش از تحویل به تکنسین.':
    'Decide what happens to the data on the disk before handing it to the technician.',
  'تعیین تکلیف اطلاعات موجود روی هارد پیش از تحویل دستگاه به تکنسین.':
    'Decide what happens to the data on the disk before handing the device to the technician.',
  'تعیین تکلیف محتویات موجود روی هارد لپ تاپ پیش از تحویل دستگاه به تکنسین.':
    'Decide what happens to the laptop disk contents before handing the device to the technician.',

  'دستگاه امانی / جایگزین': 'Loaner / replacement device',
  'بله، دستگاه امانی لازم دارم': 'Yes, I need a loaner device',
  'فقط اگر تعمیر طولانی شود': 'Only if the repair takes long',
  'خیر، لازم ندارم': 'No, I do not need one',
  'کیس بصورت موقت / امانت': 'Case as a temporary loaner',
  'لپ تاپ بصورت موقت / امانت': 'Laptop as a temporary loaner',
  'اگر تا زمان تعمیر به دستگاه جایگزین نیاز دارید، اینجا مشخص کنید.':
    'If you need a replacement device until the repair is done, specify it here.',
  'این بخش برای درخواست دستگاه جایگزین تا زمان تعمیر، به‌زودی فعال می‌شود.':
    'This section for requesting a replacement device until repair will be available soon.',

  'نحوه تحویل / جمع‌آوری': 'Handover / collection method',
  'جمع‌آوری توسط لوپ': 'Collection by Loop',
  'تحویل توسط سازمان': 'Handover by the organization',
  'اقلام توسط تکنسین لوپ جمع‌آوری شود یا سازمان خودش تحویل می‌دهد.':
    'Items collected by the Loop technician, or the organization delivers them itself.',
  'تعداد اقلام اسقاط سازمان را به تفکیک نوع دستگاه وارد کنید.':
    'Enter the count of the organization\'s scrap items by device type.',

  'اطلاعات مهم دارد': 'Has important data',
  'نرم‌افزارهای مورد نیاز برای نصب روی این دستگاه را انتخاب کنید.':
    'Select the software to install on this device.',
  'سیستم عاملی که باید روی دستگاه نصب شود را انتخاب کنید.': 'Select the operating system to install on the device.',
  'سیستم عاملی که باید روی کیس نصب شود را انتخاب کنید.': 'Select the operating system to install on the case.',
  'عکس مرتبط با وضعیت دستگاه را بارگذاری کنید و در صورت نیاز توضیح دهید.':
    'Upload a photo of the device condition and add notes if needed.',
  'تاریخ مراجعه و بازه ساعتی مورد نظر خود را انتخاب کنید.': 'Choose your preferred visit date and time slot.',
  'نیاز کلی': 'Overall need',
  'شرح کلی نیاز': 'Overall need description',

  // --- guide / help titles -------------------------------------------
  'راهنمای احتساب درصد تخفیف پنل / کد تشویقی ۱': 'Guide: panel discount / discount code calculation',
  'راهنمای اطلاعات اپراتور ۱': 'Guide: operator information',
  'راهنمای زمان نگهداری کوتاه مدت': 'Guide: short-term retention time',
  'زمان نگهداری و سرویس (کوتاه مدت)': 'Retention & service time (short-term)',
};

/** Translate a single Persian string. Falls back to the input unchanged. */
export const L = (fa) => {
  if (fa == null || fa === '') return fa;
  return i18n.t(fa, { defaultValue: i18n.language === 'en' ? (EN[fa] || fa) : fa });
};
export const LO = (options) => Array.isArray(options) ? options.map((option) => option?.title ? {...option,title:L(option.title)} : option) : options;

export default L;
