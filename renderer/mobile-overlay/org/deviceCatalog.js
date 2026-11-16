// کاتالوگ مشترک دستگاه‌ها / سیستم‌عامل‌ها / اقلام تامین کالا.
// این لیست‌ها ابتدا داخل ComprehensiveSelectionScreen.js بودند و چون مسیر
// «انتخاب سیستماتیک» هم دقیقاً همین اقلام و آیکون‌ها را لازم دارد، به اینجا
// منتقل شدند تا یک منبع واحد داشته باشند.

// نوع دستگاه‌هایی که کاربر تعداد آن‌ها را برای نصب سیستم عامل مشخص می‌کند
export const DEVICE_TYPES = [
  { id: 'laptop', title: 'لپ تاپ', image: require('@assets/icons/hardware-services/laptop.png') },
  { id: 'case', title: 'کیس / پی‌سی', image: require('@assets/icons/hardware-services/case-standard.png') },
];

// دستگاه‌هایی که کاربر تعداد آن‌ها را برای «نصب نرم‌افزارها» مشخص می‌کند.
// (زیربخش دوم «خدمات نرم‌افزاری»، جدا از نصب سیستم عامل.) آیکون شبکه/اینترنت
// فقط در ست procurement موجود است، بقیه از ست hardware-services می‌آیند.
export const SOFTWARE_DEVICE_TYPES = [
  { id: 'printer_multi', title: 'پرینتر لیزری چندکاره', image: require('@assets/icons/hardware-services/printer-multi.png') },
  { id: 'industrial_copier', title: 'دستگاه کپی صنعتی', image: require('@assets/icons/hardware-services/industrial-copier.png') },
  { id: 'storage_drive', title: 'هارد ذخیره‌سازی', image: require('@assets/icons/hardware-services/storage-drive.png') },
  { id: 'network_internet', title: 'شبکه و اینترنت', image: require('@assets/icons/procurement/network-internet.png') },
];

// دسته‌بندی خدمات سخت‌افزاری - مطابق ست آیکون‌های اختصاصی تحویل‌داده‌شده
// (assets/icons/hardware-services)، هماهنگ با پالت طلایی/سرمه‌ای پروژه.
export const HARDWARE_ITEMS = [
  { id: 'laptop', title: 'لپ تاپ', image: require('@assets/icons/hardware-services/laptop.png') },
  { id: 'monitor', title: 'مانیتور', image: require('@assets/icons/hardware-services/monitor.png') },
  { id: 'case_standard', title: 'کیس معمولی', image: require('@assets/icons/hardware-services/case-standard.png') },
  { id: 'case_professional', title: 'کیس حرفه‌ای', image: require('@assets/icons/hardware-services/case-professional.png') },
  { id: 'mini_case', title: 'مینی کیس', image: require('@assets/icons/hardware-services/mini-case.png') },
  { id: 'all_in_one', title: 'آل این وان', image: require('@assets/icons/hardware-services/all-in-one.png') },
  { id: 'printer_single', title: 'پرینتر لیزری تک‌کاره', image: require('@assets/icons/hardware-services/printer-single.png') },
  { id: 'printer_multi', title: 'پرینتر لیزری چندکاره', image: require('@assets/icons/hardware-services/printer-multi.png') },
  { id: 'industrial_copier', title: 'دستگاه کپی صنعتی', image: require('@assets/icons/hardware-services/industrial-copier.png') },
  { id: 'storage_drive', title: 'هارد ذخیره‌سازی', image: require('@assets/icons/hardware-services/storage-drive.png') },
];

// دسته‌بندی تامین تجهیزات/کالا - ست جداگانه‌ای از آیکون همین دسته‌هاست به‌علاوه
// چند مورد اضافه (شبکه/اینترنت، قطعات کیس، قطعات لپ‌تاپ، لوازم جانبی) که فقط
// در تامین کالا معنا دارند، نه در سرویس‌دهی سخت‌افزاری.
export const PROCUREMENT_ITEMS = [
  { id: 'laptop', title: 'لپ تاپ', image: require('@assets/icons/procurement/laptop.png') },
  { id: 'monitor', title: 'مانیتور', image: require('@assets/icons/procurement/monitor.png') },
  { id: 'case_standard', title: 'کیس معمولی', image: require('@assets/icons/procurement/case-standard.png') },
  { id: 'case_professional', title: 'کیس حرفه‌ای', image: require('@assets/icons/procurement/case-professional.png') },
  { id: 'mini_case', title: 'مینی کیس', image: require('@assets/icons/procurement/mini-case.png') },
  { id: 'all_in_one', title: 'آل این وان', image: require('@assets/icons/procurement/all-in-one.png') },
  { id: 'printer_single', title: 'پرینتر لیزری تک‌کاره', image: require('@assets/icons/procurement/printer-single.png') },
  { id: 'printer_multi', title: 'پرینتر لیزری چندکاره', image: require('@assets/icons/procurement/printer-multi.png') },
  { id: 'industrial_copier', title: 'دستگاه کپی صنعتی', image: require('@assets/icons/procurement/industrial-copier.png') },
  { id: 'network_internet', title: 'شبکه و اینترنت', image: require('@assets/icons/procurement/network-internet.png') },
  { id: 'case_parts', title: 'قطعات کیس', image: require('@assets/icons/procurement/case-parts.png') },
  { id: 'laptop_parts', title: 'قطعات لپ‌تاپ', image: require('@assets/icons/procurement/laptop-parts.png') },
  { id: 'accessories', title: 'لوازم جانبی', image: require('@assets/icons/procurement/accessories.png') },
  { id: 'storage_drive', title: 'هارد ذخیره‌سازی', image: require('@assets/icons/procurement/storage-drive.png') },
];

// همان لیست ویندوزهای موجود در WindowsInstallScreen.js - برای هماهنگی بین دو مسیر.
// تصاویر بج‌های واقعی هر نسخه (assets/icons/os) جایگزین دایره‌ی رنگی + گلیف برند شدند.
export const OS_ITEMS = [
  { id: 'win11', title: 'ویندوز 11', image: require('@assets/icons/os/win11.png') },
  { id: 'win10', title: 'ویندوز 10', image: require('@assets/icons/os/win10.png') },
  { id: 'win81', title: 'ویندوز 8.1', image: require('@assets/icons/os/win81.png') },
  { id: 'win7', title: 'ویندوز 7', image: require('@assets/icons/os/win7.png') },
  { id: 'winxp', title: 'ویندوز XP', image: require('@assets/icons/os/winxp.png') },
  { id: 'winserver', title: 'ویندوز سرور', image: require('@assets/icons/os/winserver.png') },
  { id: 'linux', title: 'لینوکس', image: require('@assets/icons/os/linux.png') },
  { id: 'mac', title: 'سیستم عامل Mac', image: require('@assets/icons/os/macos.png') },
];

export const SOFTWARE_ITEMS = [
  { id: 'general_office', title: 'نصب نرم‌افزارهای کاربردی/عمومی/آفیس' },
  { id: 'engineering', title: 'نصب نرم‌افزارهای مهندسی' },
  { id: 'graphic', title: 'نصب نرم‌افزارهای گرافیکی' },
  { id: 'antivirus', title: 'نصب آنتی ویروس' },
  { id: 'other', title: 'نرم‌افزارهای دیگر' },
];

// بازه‌های دو ساعته مطابق طرح «بازه زمانی / رزرو» (صفحات لپ تاپ و مانیتور طرح).
// start/end ساعت شروع و پایان هر بازه است تا SchedulePicker بتواند بازه‌های
// گذشته‌ی «امروز» را غیرفعال کند و کاربر زمانِ سپری‌شده را رزرو نکند.
export const hasDescriptionWithoutQuantity = (items = {}) =>
  Object.values(items).some((item) =>
    item.desc?.trim() && !(item.count > 0 || item.new > 0 || item.used > 0)
  );

export const TIME_SLOT_OPTIONS = [
  { id: 'slot_10_12', title: '۱۰ الی ۱۲', start: 10, end: 12 },
  { id: 'slot_12_14', title: '۱۲ الی ۱۴', start: 12, end: 14 },
  { id: 'slot_14_16', title: '۱۴ الی ۱۶', start: 14, end: 16 },
  { id: 'slot_16_18', title: '۱۶ الی ۱۸', start: 16, end: 18 },
  { id: 'slot_18_20', title: '۱۸ الی ۲۰', start: 18, end: 20 },
];

// «انتخاب تکنسین» - کاربر فقط جنسیت تکنسین را انتخاب می‌کند (انتخاب مستقیم
// تکنسین هنوز فعال نیست).
export const TECHNICIAN_GENDER_OPTIONS = [
  { id: 'male', title: 'آقا' },
  { id: 'female', title: 'خانم (به‌زودی)', disabled: true },
];
