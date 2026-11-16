// پیکربندی مسیر «انتخاب سیستماتیک» (اپلیکیشن کاربر سازمانی / شرکتی).
//
// در طرح تحویلی، کاربر سازمانی بعد از انتخاب «انتخاب سیستماتیک» یک شبکه‌ی
// آیکونی از دسته‌ها می‌بیند (حساب کاربری، لپ تاپ، پرینتر/کپی، مانیتور، کیس،
// ضایعات، آل این وان، هارد دیسک) و با انتخاب هر دسته، مراحل مخصوص همان دسته
// به‌صورت stepper باز می‌شود - مثلاً برای «لپ تاپ» سیزده مرحله از «برند لپ تاپ»
// تا «نمایش / استعلام / ثبت سفارش».
//
// این فایل فقط داده است؛ رندر همه‌ی انواع مرحله در org/SystematicDeviceScreen.js
// انجام می‌شود و از همان کیت رابط کاربری «انتخاب جامع» استفاده می‌کند.

import { PROCUREMENT_ITEMS, SOFTWARE_ITEMS } from './deviceCatalog';
import {
  LAPTOP_SOFTWARE_ISSUES,
  LAPTOP_HARDWARE_ISSUES,
  CASE_HARDWARE_ISSUES,
  PRINTER_SOFTWARE_ISSUES,
  PRINTER_HARDWARE_ISSUES,
  COPIER_ISSUES,
  HARD_DISK_SOFTWARE_ISSUES,
  HARD_DISK_HARDWARE_ISSUES,
} from './defaultIssues';

const sectionIcon = {
  software: require('@assets/icons/sections/software-services.png'),
  hardware: require('@assets/icons/sections/hardware-services.png'),
  procurement: require('@assets/icons/sections/procurement.png'),
  equipmentStatus: require('@assets/icons/sections/equipment-status.png'),
  deliveryMode: require('@assets/icons/sections/delivery-mode.png'),
  serviceLevel: require('@assets/icons/sections/service-level.png'),
  technician: require('@assets/icons/sections/technician.png'),
  timeRange: require('@assets/icons/sections/time-range.png'),
  address: require('@assets/icons/sections/address.png'),
  orderActions: require('@assets/icons/sections/order-actions.png'),
  operatorInfo: require('@assets/icons/sections/operator-info.png'),
  criticalInfra: require('@assets/icons/sections/critical-infra.png'),
};

const deviceIcon = {
  laptop: require('@assets/icons/hardware-services/laptop.png'),
  monitor: require('@assets/icons/hardware-services/monitor.png'),
  case: require('@assets/icons/hardware-services/case-standard.png'),
  allInOne: require('@assets/icons/hardware-services/all-in-one.png'),
  printer: require('@assets/icons/hardware-services/printer-multi.png'),
  hardDisk: require('@assets/icons/hardware-services/storage-drive.png'),
  // آیکون اختصاصی «ضایعات» - جایگزین گلیف trash-outline قبلی
  trash: require('@assets/icons/hardware-services/trash.png'),
};

// ---------------------------------------------------------------------------
// شبکه‌ی دسته‌ها - همان کاشی‌های صفحه‌ی «انتخاب سیستماتیک» در طرح
// ---------------------------------------------------------------------------
export const SYSTEMATIC_CATEGORIES = [
  {
    id: 'user_account',
    title: 'حساب کاربری',
    subtitle: 'User Account',
    image: sectionIcon.operatorInfo,
    // این کاشی مرحله‌ای ندارد و مستقیم صفحه‌ی حساب کاربری موجود را باز می‌کند.
    screen: 'Profile',
  },
  { id: 'laptop', title: 'لپ تاپ', subtitle: 'Laptop', image: deviceIcon.laptop },
  { id: 'printer_copy', title: 'پرینتر / کپی', subtitle: 'Printer / Copy', image: deviceIcon.printer },
  { id: 'monitor', title: 'مانیتور', subtitle: 'Monitor', image: deviceIcon.monitor },
  { id: 'case', title: 'کیس', subtitle: 'Case', image: deviceIcon.case },
  { id: 'trash', title: 'ضایعات', subtitle: 'Trash', image: deviceIcon.trash },
  { id: 'all_in_one', title: 'آل این وان', subtitle: 'All in One', image: deviceIcon.allInOne },
  { id: 'hard_disk', title: 'هارد دیسک', subtitle: 'Hard Disk', image: deviceIcon.hardDisk },
];

// ---------------------------------------------------------------------------
// برندها - در طرح به‌صورت دایره‌های لوگو نمایش داده شده‌اند. اگر برندی لوگو
// نداشته باشد (لوگوی معتبری برایش نرسیده)، BrandGrid به‌طور خودکار نام برند را
// به‌جای تصویر داخل همان دایره می‌نویسد.
// ---------------------------------------------------------------------------
const brandId = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '_');
const toBrands = (names) => names.map((name) => ({ id: brandId(name), title: name }));

// [عنوان، لوگو] - لوگوی null یعنی برند بدون تصویر و فقط با نام نمایش داده می‌شود.
const brandList = (entries) =>
  entries.map(([title, image]) => ({ id: brandId(title), title, ...(image ? { image } : {}) }));

// لوگوها از پوشه‌ی ارسالی کارفرما (لیست ادیت‌های ۱۴۰۵/۰۷/۰۳) با پس‌زمینه‌ی حذف‌شده و
// حجم کاهش‌یافته در assets/icons/brands/<دسته> قرار گرفته‌اند. برندهای پرکاربرد اول
// و بقیه به ترتیب الفبا.
const LAPTOP_BRANDS = brandList([
  ['Apple', require('@assets/icons/brands/laptop/Apple.png')],
  ['HP', require('@assets/icons/brands/laptop/HP.png')],
  ['Lenovo', require('@assets/icons/brands/laptop/Lenovo.png')],
  ['Asus', require('@assets/icons/brands/laptop/Asus.png')],
  ['Acer', require('@assets/icons/brands/laptop/Acer.png')],
  ['Dell', require('@assets/icons/brands/laptop/Dell.png')],
  ['MSI', require('@assets/icons/brands/laptop/MSI.png')],
  ['Microsoft', require('@assets/icons/brands/laptop/Microsoft.png')],
  ['Sony', require('@assets/icons/brands/laptop/Sony.png')],
  ['Toshiba', require('@assets/icons/brands/laptop/Toshiba.png')],
  ['Samsung', require('@assets/icons/brands/laptop/Samsung.png')],
  ['Fujitsu', require('@assets/icons/brands/laptop/Fujitsu.png')],
  ['GIGABYTE', require('@assets/icons/brands/laptop/GIGABYTE.png')],
  ['Panasonic', require('@assets/icons/brands/laptop/Panasonic.png')],
  ['Packard Bell', require('@assets/icons/brands/laptop/Packard_Bell.png')],
  // فایل ارسالی عکس استوکِ واترمارک‌دار یک لپ‌تاپ بود، نه لوگو.
  ['HTC', null],
  ['HCL', require('@assets/icons/brands/laptop/HCL.png')],
  ['LG', require('@assets/icons/brands/laptop/LG.png')],
  ['Alienware', require('@assets/icons/brands/laptop/Alienware.png')],
  ['BenQ', require('@assets/icons/brands/laptop/BenQ.png')],
  ['Compaq', require('@assets/icons/brands/laptop/Compaq.png')],
  ['Corsair', require('@assets/icons/brands/laptop/Corsair.png')],
  ['Durabook', require('@assets/icons/brands/laptop/Durabook.png')],
  ['E-Blue', require('@assets/icons/brands/laptop/E_Blue.png')],
  ['Epson', require('@assets/icons/brands/laptop/Epson.png')],
  ['Esonic', require('@assets/icons/brands/laptop/Esonic.png')],
  ['Gateway', require('@assets/icons/brands/laptop/Gateway.png')],
  ['Getac', require('@assets/icons/brands/laptop/Getac.png')],
  ['G-Plus', require('@assets/icons/brands/laptop/G_Plus.png')],
  ['Green', require('@assets/icons/brands/laptop/Green.png')],
  ['Huawei', require('@assets/icons/brands/laptop/Huawei.png')],
  ['IBM', require('@assets/icons/brands/laptop/IBM.png')],
  ['Innovers', require('@assets/icons/brands/laptop/Innovers.png')],
  ['Intel', require('@assets/icons/brands/laptop/Intel.png')],
  ['Life Digital', require('@assets/icons/brands/laptop/Life_Digital.png')],
  ['Master Tech', require('@assets/icons/brands/laptop/Master_Tech.png')],
  ['Microsoft Surface', require('@assets/icons/brands/laptop/Microsoft_Surface.png')],
  ['NEXT', require('@assets/icons/brands/laptop/NEXT.png')],
  ['Razer', require('@assets/icons/brands/laptop/Razer.png')],
  ['Thomson', require('@assets/icons/brands/laptop/Thomson.png')],
  ['Univo', require('@assets/icons/brands/laptop/Univo.png')],
  ['Wipro', require('@assets/icons/brands/laptop/Wipro.png')],
  ['Xiaomi', require('@assets/icons/brands/laptop/Xiaomi.png')],
]);

const monitorLogoMap = {
  'alienware': require('@assets/icons/brands/monitor/Alienware.png'),
  'aoc': require('@assets/icons/brands/monitor/AOC.png'),
  'aopen': require('@assets/icons/brands/monitor/AOPEN.png'),
  'asus': require('@assets/icons/brands/monitor/ASUS.png'),
  'acer': require('@assets/icons/brands/monitor/Acer.png'),
  'benq': require('@assets/icons/brands/monitor/BenQ.png'),
  'cooler_master': require('@assets/icons/brands/monitor/Cooler_Master.png'),
  'crua': require('@assets/icons/brands/monitor/CRUA.png'),
  'daewoo': require('@assets/icons/brands/monitor/Daewoo.png'),
  'dahua': require('@assets/icons/brands/monitor/Dahua.png'),
  'dell': require('@assets/icons/brands/monitor/Dell.png'),
  'fotor': require('@assets/icons/brands/monitor/Fotor.png'),
  'gigabyte': require('@assets/icons/brands/monitor/Gigabyte.png'),
  'gplus': require('@assets/icons/brands/monitor/GPlus.png'),
  'horizon': require('@assets/icons/brands/monitor/Horizon.png'),
  'hp': require('@assets/icons/brands/monitor/HP.png'),
  'huawei': require('@assets/icons/brands/monitor/Huawei.png'),
  'hyundai': require('@assets/icons/brands/monitor/Hyundai.png'),
  'innoview': require('@assets/icons/brands/monitor/InnoView.png'),
  'kefeya': require('@assets/icons/brands/monitor/Kefeya.png'),
  'koorui': require('@assets/icons/brands/monitor/Koorui.png'),
  'lg': require('@assets/icons/brands/monitor/LG.png'),
  'life_digital': require('@assets/icons/brands/monitor/Life_Digital.png'),
  'master_tech': require('@assets/icons/brands/monitor/Master_Tech.png'),
  'meva': require('@assets/icons/brands/monitor/MEVA.png'),
  'mindos': require('@assets/icons/brands/monitor/MINDOS.png'),
  'mnn': require('@assets/icons/brands/monitor/MNN.png'),
  'msi': require('@assets/icons/brands/monitor/MSI.png'),
  'nec': require('@assets/icons/brands/monitor/NEC.png'),
  'nexar': require('@assets/icons/brands/monitor/Nexar.png'),
  'philips_badge': require('@assets/icons/brands/monitor/Philips_Badge.png'),
  'philips_wordmark': require('@assets/icons/brands/monitor/Philips_Wordmark.png'),
  'pixio': require('@assets/icons/brands/monitor/Pixio.png'),
  'samsung': require('@assets/icons/brands/monitor/Samsung.png'),
  'sam': require('@assets/icons/brands/monitor/SAM.png'),
  'sansui': require('@assets/icons/brands/monitor/Sansui.png'),
  'sceptre': require('@assets/icons/brands/monitor/Sceptre.png'),
  'snowa': require('@assets/icons/brands/monitor/Snowa.png'),
  'twisted_minds': require('@assets/icons/brands/monitor/Twisted_Minds.png'),
  'univo': require('@assets/icons/brands/monitor/Univo.png'),
  'viewsonic': require('@assets/icons/brands/monitor/ViewSonic.png'),
  'xiaomi': require('@assets/icons/brands/monitor/Xiaomi.png'),
  'xvision': require('@assets/icons/brands/monitor/XVision.png'),
  'lenovo': require('@assets/icons/brands/monitor/Lenovo.png'),
  'sony': require('@assets/icons/brands/monitor/Sony.png'),
};

const MONITOR_BRANDS = toBrands([
  'Alienware', 'AOC', 'AOPEN', 'ASUS', 'Acer', 'BenQ', 'Cooler Master', 'CRUA', 'Daewoo', 'Dahua',
  'Dell', 'Fotor', 'Gigabyte', 'G-Plus', 'Horizon', 'HP', 'Huawei', 'Hyundai', 'InnoView', 'Kefeya',
  'Koorui', 'LG', 'Life Digital', 'Master Tech', 'MEVA', 'MINDOS', 'MNN', 'MSI', 'NEC', 'Nexar',
  'Philips', 'Pixio', 'Samsung', 'SAM', 'Sansui', 'Sceptre', 'Snowa', 'Twisted Minds', 'Univo', 'ViewSonic',
  'Xiaomi', 'XVision', 'Lenovo', 'Sony', 'Sonic',
]).map((brand) => ({
  ...brand,
  image: monitorLogoMap[brand.id],
}));

const ALL_IN_ONE_BRANDS = brandList([
  ['HP', require('@assets/icons/brands/all-in-one/HP.png')],
  ['Lenovo', require('@assets/icons/brands/all-in-one/Lenovo.png')],
  ['Dell', require('@assets/icons/brands/all-in-one/Dell.png')],
  ['Asus', require('@assets/icons/brands/all-in-one/Asus.png')],
  ['Acer', require('@assets/icons/brands/all-in-one/Acer.png')],
  ['MSI', require('@assets/icons/brands/all-in-one/MSI.png')],
  ['Apple', require('@assets/icons/brands/all-in-one/Apple.png')],
  ['Samsung', require('@assets/icons/brands/all-in-one/Samsung.png')],
  ['LG', require('@assets/icons/brands/all-in-one/LG.png')],
  ['Sony', require('@assets/icons/brands/all-in-one/Sony.png')],
  ['Microsoft Surface', require('@assets/icons/brands/all-in-one/Microsoft_Surface.png')],
  ['Green', require('@assets/icons/brands/all-in-one/Green.png')],
  ['E-Blue', require('@assets/icons/brands/all-in-one/E_Blue.png')],
  ['Epson', require('@assets/icons/brands/all-in-one/Epson.png')],
  ['Esonic', require('@assets/icons/brands/all-in-one/Esonic.png')],
  ['G-Plus', require('@assets/icons/brands/all-in-one/G_Plus.png')],
  ['Intel', require('@assets/icons/brands/all-in-one/Intel.png')],
  ['Maya', require('@assets/icons/brands/all-in-one/Maya.png')],
  ['NEXT', require('@assets/icons/brands/all-in-one/NEXT.png')],
  ['Univo', require('@assets/icons/brands/all-in-one/Univo.png')],
]);

const PRINTER_BRANDS = brandList([
  ['HP', require('@assets/icons/brands/printer/HP.png')],
  ['Canon', require('@assets/icons/brands/printer/Canon.png')],
  ['Epson', require('@assets/icons/brands/printer/Epson.png')],
  ['Brother', require('@assets/icons/brands/printer/Brother.png')],
  ['Samsung', require('@assets/icons/brands/printer/Samsung.png')],
  ['Xerox', require('@assets/icons/brands/printer/Xerox.png')],
  ['Ricoh', require('@assets/icons/brands/printer/Ricoh.png')],
  ['Sharp', require('@assets/icons/brands/printer/Sharp.png')],
  ['Konica Minolta', require('@assets/icons/brands/printer/Konica_Minolta.png')],
  ['Kyocera', require('@assets/icons/brands/printer/Kyocera.png')],
  // فایل ارسالی لوگوی Pantone (سیستم رنگ) بود، نه برند پرینتر Pantum.
  ['Pantum', null],
  ['Copystar', require('@assets/icons/brands/printer/Copystar.png')],
  ['Dell', require('@assets/icons/brands/printer/Dell.png')],
  ['Innovers', require('@assets/icons/brands/printer/Innovers.png')],
  ['Lanier', require('@assets/icons/brands/printer/Lanier.png')],
  ['Lexmark', require('@assets/icons/brands/printer/Lexmark.png')],
  ['OKI', require('@assets/icons/brands/printer/OKI.png')],
  ['Panasonic', require('@assets/icons/brands/printer/Panasonic.png')],
  ['Savin', require('@assets/icons/brands/printer/Savin.png')],
]);

const HDD_BRANDS = brandList([
  ['Western Digital', require('@assets/icons/brands/hard-disk/Western_Digital.png')],
  ['Seagate', require('@assets/icons/brands/hard-disk/Seagate.png')],
  ['Samsung', require('@assets/icons/brands/hard-disk/Samsung.png')],
  ['Toshiba', require('@assets/icons/brands/hard-disk/Toshiba.png')],
  ['Kingston', require('@assets/icons/brands/hard-disk/Kingston.png')],
  ['ADATA', require('@assets/icons/brands/hard-disk/ADATA.png')],
  ['Crucial', require('@assets/icons/brands/hard-disk/Crucial.png')],
  ['SanDisk', require('@assets/icons/brands/hard-disk/SanDisk.png')],
  ['Intel', require('@assets/icons/brands/hard-disk/Intel.png')],
  ['Apacer', require('@assets/icons/brands/hard-disk/Apacer.png')],
  ['Apple', require('@assets/icons/brands/hard-disk/Apple.png')],
  ['Asus', require('@assets/icons/brands/hard-disk/Asus.png')],
  ['ATP', require('@assets/icons/brands/hard-disk/ATP.png')],
  ['Biostar', require('@assets/icons/brands/hard-disk/Biostar.png')],
  ['Corsair', require('@assets/icons/brands/hard-disk/Corsair.png')],
  ['Dahua', require('@assets/icons/brands/hard-disk/Dahua.png')],
  ['Dataram', require('@assets/icons/brands/hard-disk/Dataram.png')],
  ['Dell', require('@assets/icons/brands/hard-disk/Dell.png')],
  ['Edge', require('@assets/icons/brands/hard-disk/Edge.png')],
  ['Fusion', require('@assets/icons/brands/hard-disk/Fusion.png')],
  ['G.Skill', require('@assets/icons/brands/hard-disk/G_Skill.png')],
  ['Galax', require('@assets/icons/brands/hard-disk/Galax.png')],
  ['GIGABYTE', require('@assets/icons/brands/hard-disk/GIGABYTE.png')],
  ['Goodram', require('@assets/icons/brands/hard-disk/Goodram.png')],
  ['Greenliant', require('@assets/icons/brands/hard-disk/Greenliant.png')],
  ['GS Group', require('@assets/icons/brands/hard-disk/GS_Group.png')],
  ['HGST', require('@assets/icons/brands/hard-disk/HGST.png')],
  ['HIKSEMI', require('@assets/icons/brands/hard-disk/HIKSEMI.png')],
  ['Hikvision', require('@assets/icons/brands/hard-disk/Hikvision.png')],
  ['HP', require('@assets/icons/brands/hard-disk/HP.png')],
  ['Imation', require('@assets/icons/brands/hard-disk/Imation.png')],
  ['Inland', require('@assets/icons/brands/hard-disk/Inland.png')],
  ['Innodisk', require('@assets/icons/brands/hard-disk/Innodisk.png')],
  ['KIOXIA', require('@assets/icons/brands/hard-disk/KIOXIA.png')],
  ['Lenovo', require('@assets/icons/brands/hard-disk/Lenovo.png')],
  ['Lexar', require('@assets/icons/brands/hard-disk/Lexar.png')],
  ['LITEON', require('@assets/icons/brands/hard-disk/LITEON.png')],
  ['Micron', require('@assets/icons/brands/hard-disk/Micron.png')],
  ['Microsemi', require('@assets/icons/brands/hard-disk/Microsemi.png')],
  ['MSI', require('@assets/icons/brands/hard-disk/MSI.png')],
  ['Mushkin', require('@assets/icons/brands/hard-disk/Mushkin.png')],
  ['Netac', require('@assets/icons/brands/hard-disk/Netac.png')],
  ['Netlist', require('@assets/icons/brands/hard-disk/Netlist.png')],
  ['Nimbus Data', require('@assets/icons/brands/hard-disk/Nimbus_Data.png')],
  ['OCZ', require('@assets/icons/brands/hard-disk/OCZ.png')],
  ['Optiarc', require('@assets/icons/brands/hard-disk/Optiarc.png')],
  ['OSCOO', require('@assets/icons/brands/hard-disk/OSCOO.png')],
  ['OWC', require('@assets/icons/brands/hard-disk/OWC.png')],
  ['Patriot', require('@assets/icons/brands/hard-disk/Patriot.png')],
  ['PNY', require('@assets/icons/brands/hard-disk/PNY.png')],
  ['Quantum', require('@assets/icons/brands/hard-disk/Quantum.png')],
  ['Ritek', require('@assets/icons/brands/hard-disk/Ritek.png')],
  ['Silicon Power', require('@assets/icons/brands/hard-disk/Silicon_Power.png')],
  ['SK hynix', require('@assets/icons/brands/hard-disk/SK_hynix.png')],
  ['Sony', require('@assets/icons/brands/hard-disk/Sony.png')],
  ['sTec', require('@assets/icons/brands/hard-disk/sTec.png')],
  ['Strontium', require('@assets/icons/brands/hard-disk/Strontium.png')],
  ['TDK', require('@assets/icons/brands/hard-disk/TDK.png')],
  ['Team Group', require('@assets/icons/brands/hard-disk/Team_Group.png')],
  ['Transcend', require('@assets/icons/brands/hard-disk/Transcend.png')],
  ['TXRUI', require('@assets/icons/brands/hard-disk/TXRUI.png')],
  ['Verbatim', require('@assets/icons/brands/hard-disk/Verbatim.png')],
  ['Verity', require('@assets/icons/brands/hard-disk/Verity.png')],
  ['Virtium', require('@assets/icons/brands/hard-disk/Virtium.png')],
  ['Xiaomi', require('@assets/icons/brands/hard-disk/Xiaomi.png')],
  ['ZhiTai', require('@assets/icons/brands/hard-disk/ZhiTai.png')],
  ['Zotac', require('@assets/icons/brands/hard-disk/Zotac.png')],
]);

// ---------------------------------------------------------------------------
// گزینه‌های مشترک بین چند دسته
// ---------------------------------------------------------------------------
// «وضعیت» دستگاه - برای پرینتر/کپی صنعتی، آل این وان، کیس، لپ تاپ، هارد و
// مانیتور یکسان است (لیست ادیت‌های ۱۴۰۵/۰۷/۰۳): فقط نو/آکبند یا کارکرده، سپس
// وضعیت گارانتی، و بارگذاری عکس از گالری و دوربین.
const DEVICE_STATUS_OPTIONS = [
  { id: 'new', title: 'نو / آکبند' },
  { id: 'used', title: 'کارکرده' },
];

const WARRANTY_OPTIONS = [
  { id: 'in_warranty', title: 'دارای گارانتی' },
  { id: 'out_of_warranty', title: 'عدم گارانتی' },
  { id: 'unknown', title: 'نامشخص' },
];

const deviceStatusStep = (title) => ({
  id: 'device_status',
  title,
  hint: 'نو یا کارکرده بودن دستگاه و وضعیت گارانتی آن را انتخاب کنید و در صورت نیاز عکس دستگاه را از گالری یا دوربین بارگذاری کنید.',
  icon: sectionIcon.equipmentStatus,
  type: 'options',
  options: DEVICE_STATUS_OPTIONS,
  extra: { id: 'warranty', title: 'وضعیت گارانتی', options: WARRANTY_OPTIONS, columns: 3 },
  // به‌جای کادر توضیح ساده، همان ورودی «عکس از گالری و دوربین» + توضیح.
  photo: true,
  notePlaceholder: 'توضیحات دیگری دارید بنویسید...',
});

// «مدل کیس» - نوع کاربری کیس، نه برند (کیس برند و لوگو ندارد).
const CASE_MODEL_OPTIONS = [
  { id: 'office', title: 'کیس اداری' },
  { id: 'home', title: 'کیس خانگی' },
  { id: 'gaming', title: 'کیس گیمینگ' },
  { id: 'workstation', title: 'کیس حرفه‌ای / ورک استیشن' },
  { id: 'server', title: 'کیس سروری' },
];

const ALL_IN_ONE_MODEL_OPTIONS = [
  { id: 'office', title: 'آل‌این‌وان اداری' },
  { id: 'home', title: 'آل‌این‌وان خانگی' },
  { id: 'professional', title: 'آل‌این‌وان حرفه‌ای' },
  { id: 'gaming', title: 'آل‌این‌وان گیمینگ' },
];

const APPEARANCE_ISSUE_OPTIONS = [
  { id: 'healthy_body', title: 'بدنه سالم است' },
  { id: 'scratches', title: 'خط و خش روی بدنه' },
  { id: 'broken_body', title: 'شکستگی بدنه / لولا' },
  { id: 'screen_scratch', title: 'خط افتادگی صفحه نمایش' },
  { id: 'worn_keyboard', title: 'کیبورد / دکمه‌ها فرسوده' },
  { id: 'damaged_label', title: 'برچسب / گارانتی مخدوش' },
];

const HARD_DISK_DATA_OPTIONS = [
  { id: 'has_important_data', title: 'اطلاعات مهم دارد - بکاپ گرفته شود' },
  { id: 'no_important_data', title: 'اطلاعات مهم ندارد' },
  { id: 'wipe_disk', title: 'هارد کاملاً پاک‌سازی شود' },
  { id: 'replace_and_transfer', title: 'تعویض هارد و انتقال اطلاعات' },
];

const LOANER_OPTIONS = [
  { id: 'needed', title: 'بله، دستگاه امانی لازم دارم' },
  { id: 'if_long', title: 'فقط اگر تعمیر طولانی شود' },
  { id: 'not_needed', title: 'خیر، لازم ندارم' },
];

const softwareChecklist = SOFTWARE_ITEMS.map((item) => ({ id: item.id, title: item.title }));

// مراحل پایانی مشترک همه‌ی دسته‌ها (تامین تجهیزات / تکنسین / بازه زمانی / آدرس / ثبت سفارش).
//
// «تامین تجهیزات» یعنی خرید کالا یا قطعات، و در همه‌ی دسته‌ها باید یکسان و کامل
// باشد: کاربری که لپ‌تاپش را برای سرویس می‌دهد ممکن است بخواهد یک پرینتر هم
// بخرد. پس همه‌ی دسته‌ها کل PROCUREMENT_ITEMS را با همان آیکون‌ها می‌بینند
// (itemIds تعریف نمی‌شود = همه‌ی اقلام).
// afterProcurement برای مراحلی است که در طرح دقیقاً بعد از «تامین تجهیزات / کالا»
// می‌آیند - مثل «لپ تاپ بصورت موقت / امانت».
const closingSteps = (afterProcurement = []) => [
  {
    id: 'procurement',
    title: 'تامین تجهیزات / کالا',
    hint: 'اگر علاوه بر سرویس، قصد خرید کالا یا قطعه دارید (مثلاً یک پرینتر یا لوازم جانبی)، تعداد آکبند/کارکرده هر مورد را وارد کنید.',
    icon: sectionIcon.procurement,
    type: 'procurement',
  },
  ...afterProcurement,
  {
    id: 'technician',
    title: 'انتخاب تکنسین',
    hint: 'جنسیت تکنسینی که برای انجام خدمت مراجعه می‌کند را انتخاب کنید.',
    icon: sectionIcon.technician,
    type: 'technician',
    required: true,
  },
  {
    id: 'time_range',
    title: 'بازه زمانی / رزرو',
    hint: 'تاریخ مراجعه و بازه ساعتی مورد نظر خود را انتخاب کنید.',
    icon: sectionIcon.timeRange,
    type: 'schedule',
    required: true,
  },
  // پیش از این، این مسیر مرحله‌ی آدرس نداشت و صفحه‌ی ثبت نهایی آدرس را حدس می‌زد؛
  // کاربرِ بدون آدرس در آخرین قدم متوقف می‌شد. حالا آدرس یک مرحله‌ی اجباری است.
  {
    id: 'address',
    title: 'آدرس‌های منتخب',
    hint: 'آدرس محل ارائه خدمت را از آدرس‌های ذخیره‌شده انتخاب کنید یا از همین‌جا آدرس جدیدی اضافه کنید.',
    icon: sectionIcon.address,
    type: 'address',
    required: true,
  },
  {
    id: 'order_actions',
    title: 'نمایش / استعلام / ثبت سفارش',
    hint: 'پیش از ثبت نهایی می‌توانید پیش‌رسید را صادر یا مشاهده کنید و در نهایت سفارش را ثبت یا لغو نمایید.',
    icon: sectionIcon.orderActions,
    type: 'orderActions',
  },
];

// ---------------------------------------------------------------------------
// مراحل هر دسته
// ---------------------------------------------------------------------------
export const SYSTEMATIC_FLOWS = {
  // «لپ تاپ» - سیزده مرحله‌ی طرح
  laptop: [
    {
      id: 'brand',
      title: 'برند لپ تاپ',
      hint: 'برند لپ تاپ خود را انتخاب کنید. اگر برند شما در فهرست نیست، آن را در کادر «برند دیگر» بنویسید.',
      icon: deviceIcon.laptop,
      type: 'brands',
      brands: LAPTOP_BRANDS,
      required: true,
    },
    {
      id: 'model',
      title: 'مدل لپ تاپ',
      hint: 'در صورتی که مدل لپ تاپ را می‌دانید بنویسید. مثلاً X550',
      icon: deviceIcon.laptop,
      type: 'fields',
      fields: [
        { id: 'model', placeholder: 'مدل لپ تاپ (مثلاً X550)' },
      ],
    },
    {
      id: 'os',
      title: 'انتخاب سیستم عامل',
      hint: 'سیستم عاملی که باید روی دستگاه نصب شود را انتخاب کنید.',
      icon: sectionIcon.software,
      type: 'osGrid',
    },
    {
      id: 'software_install',
      title: 'نصب نرم افزار',
      hint: 'نرم‌افزارهای مورد نیاز برای نصب روی این دستگاه را انتخاب کنید.',
      icon: sectionIcon.software,
      type: 'checklist',
      options: softwareChecklist,
      columns: 1,
    },
    {
      id: 'software_default',
      title: 'نرم افزار (پیش فرض)',
      hint: 'مشکلات نرم‌افزاری لپ تاپ؛ هر مورد که مصداق دارد را انتخاب کنید.',
      icon: sectionIcon.software,
      type: 'checklist',
      options: LAPTOP_SOFTWARE_ISSUES,
      columns: 1,
    },
    {
      id: 'hardware_default',
      title: 'سخت افزار (پیش فرض)',
      hint: 'مشکلات سخت‌افزاری لپ تاپ؛ هر مورد که مصداق دارد را انتخاب کنید.',
      icon: sectionIcon.hardware,
      type: 'checklist',
      options: LAPTOP_HARDWARE_ISSUES,
      columns: 1,
    },
    {
      id: 'appearance_issue',
      title: 'ایراد ظاهری',
      hint: 'در صورتی که لپ تاپ دارای نواقص ظاهری می‌باشد بنویسید.',
      icon: sectionIcon.equipmentStatus,
      type: 'note',
      notePlaceholder: 'در صورتی که لپ تاپ دارای نواقص ظاهری می‌باشد بنویسید...',
    },
    deviceStatusStep('وضعیت لپ تاپ'),
    {
      id: 'hard_disk_data',
      title: 'اطلاعات شخصی در هارد دیسک',
      hint: 'تعیین تکلیف محتویات موجود روی هارد لپ تاپ پیش از تحویل دستگاه به تکنسین.',
      icon: deviceIcon.hardDisk,
      type: 'options',
      options: [
        { id: 'has_personal_data', title: 'دارای محتویات شخصی در هارد' },
        { id: 'full_wipe', title: 'حذف کامل محتویات هارد' },
        { id: 'transfer_backup', title: 'انتقال / بکاپ محتویات توسط تکنسین' },
      ],
      columns: 1,
      note: true,
      required: true,
    },
    ...closingSteps(
      [
        {
          id: 'loaner',
          title: 'لپ تاپ بصورت موقت / امانت',
          hint: 'این بخش برای درخواست دستگاه جایگزین تا زمان تعمیر، به‌زودی فعال می‌شود.',
          icon: sectionIcon.deliveryMode,
          type: 'comingSoon',
        },
      ]
    ),
  ],

  // «مانیتور» - هشت مرحله‌ی طرح
  monitor: [
    {
      id: 'brand',
      title: 'برند مانیتور',
      hint: 'برند مانیتور خود را انتخاب کنید. اگر برند شما در فهرست نیست، آن را در کادر «برند دیگر» بنویسید.',
      icon: require('@assets/icons/sections/monitor-brand.png'),
      type: 'brands',
      brands: MONITOR_BRANDS,
      required: true,
    },
    {
      id: 'panel_type',
      title: 'مدل مانیتور',
      hint: 'نوع پنل مانیتور را انتخاب و در صورت نیاز مدل دقیق را بنویسید.',
      icon: require('@assets/icons/sections/monitor-model.png'),
      type: 'options',
      options: [
        { id: 'lcd', title: 'LCD' },
        { id: 'led', title: 'LED' },
        { id: 'oled', title: 'OLED' },
      ],
      columns: 1,
      note: true,
      notePlaceholder: 'مدل دقیق / شماره سریال (اختیاری)',
      required: true,
    },
    {
      id: 'size',
      title: 'ابعاد مانیتور',
      hint: 'اندازه‌ی صفحه‌ی مانیتور بر حسب اینچ.',
      icon: sectionIcon.serviceLevel,
      type: 'options',
      options: [
        { id: 'in_19', title: '۱۹ اینچ' },
        { id: 'in_215', title: '۲۱.۵ اینچ' },
        { id: 'in_22', title: '۲۲ اینچ' },
        { id: 'in_24', title: '۲۴ اینچ' },
        { id: 'in_27', title: '۲۷ اینچ' },
        { id: 'in_32', title: '۳۲ اینچ و بالاتر' },
      ],
      columns: 3,
      note: true,
      notePlaceholder: 'ابعاد / اینچ دقیق را بنویسید: ...',
      // نوشتن اینچ دقیق به‌تنهایی هم این مرحله‌ی اجباری را کامل می‌کند.
      noteSatisfies: true,
      required: true,
    },
    {
      id: 'physical_issue',
      title: 'ایراد فیزیکی / ظاهری مانیتور',
      hint: 'مشکلات مشاهده‌شده روی مانیتور را انتخاب کنید.',
      icon: sectionIcon.hardware,
      type: 'checklist',
      options: [
        { id: 'no_power', title: 'مانیتور روشن نمی‌شود' },
        { id: 'no_image', title: 'مانیتور تصویر ندارد' },
        { id: 'no_hdmi', title: 'پورت HDMI / کابل مشکل دارد' },
        { id: 'flicker', title: 'تصویر چشمک می‌زند یا قطع و وصل می‌شود' },
        { id: 'stain', title: 'لکه، خط عمودی یا خط و خش روی صفحه' },
        { id: 'color', title: 'رنگ‌ها را درست نمایش نمی‌دهد' },
        { id: 'broken_stand', title: 'پایه / بدنه شکسته است' },
        { id: 'other', title: 'سایر مشکلات مانیتور' },
      ],
      columns: 1,
    },
    deviceStatusStep('وضعیت مانیتور'),
    ...closingSteps(),
  ],

  // «کیس» - همان فهرست ایرادهای HardwareIssueScreen موجود در پروژه.
  // کیس مرحله‌ی برند/لوگو ندارد؛ به‌جایش «مدل کیس» (نوع کاربری) و مشخصات
  // سخت‌افزاری اختیاری می‌آید.
  case: [
    {
      id: 'model',
      title: 'مدل کیس',
      hint: 'نوع کیس را بر اساس کاربری آن انتخاب کنید.',
      icon: deviceIcon.case,
      type: 'options',
      options: CASE_MODEL_OPTIONS,
      columns: 2,
      required: true,
    },
    {
      id: 'specs',
      title: 'مشخصات کیس',
      hint: 'اختیاری: در صورت اطلاع، مشخصات سخت‌افزاری کیس را وارد کنید.',
      icon: sectionIcon.hardware,
      type: 'fields',
      fields: [
        { id: 'cpu', placeholder: 'پردازنده (CPU) - اختیاری' },
        { id: 'ram', placeholder: 'حافظه رم (RAM) - اختیاری' },
        { id: 'gpu', placeholder: 'کارت گرافیک - اختیاری' },
        { id: 'storage', placeholder: 'هارد / SSD - اختیاری' },
        { id: 'other', placeholder: 'سایر مشخصات (مادربرد، پاور و ...) - اختیاری' },
      ],
    },
    {
      id: 'os',
      title: 'انتخاب سیستم عامل',
      hint: 'سیستم عاملی که باید روی کیس نصب شود را انتخاب کنید.',
      icon: sectionIcon.software,
      type: 'osGrid',
    },
    {
      id: 'software_install',
      title: 'نصب نرم افزار',
      hint: 'نرم‌افزارهای مورد نیاز برای نصب روی این دستگاه را انتخاب کنید.',
      icon: sectionIcon.software,
      type: 'checklist',
      options: softwareChecklist,
      columns: 1,
    },
    {
      id: 'hardware_default',
      title: 'سخت افزار (پیش فرض)',
      hint: 'ایرادهای سخت‌افزاری متداول کیس؛ هر مورد که مصداق دارد را انتخاب کنید.',
      icon: sectionIcon.hardware,
      type: 'checklist',
      options: CASE_HARDWARE_ISSUES,
      columns: 1,
    },
    {
      id: 'appearance_issue',
      title: 'ایراد ظاهری',
      hint: 'وضعیت ظاهری دستگاه را مشخص کنید تا هنگام تحویل اختلافی پیش نیاید.',
      icon: sectionIcon.equipmentStatus,
      type: 'checklist',
      options: APPEARANCE_ISSUE_OPTIONS,
    },
    deviceStatusStep('وضعیت کیس'),
    {
      id: 'hard_disk_data',
      title: 'اطلاعات شخصی در هارد دیسک',
      hint: 'تعیین تکلیف اطلاعات موجود روی هارد پیش از تحویل دستگاه به تکنسین.',
      icon: deviceIcon.hardDisk,
      type: 'options',
      options: HARD_DISK_DATA_OPTIONS,
      columns: 1,
      note: true,
      required: true,
    },
    ...closingSteps(
      [
        {
          id: 'loaner',
          title: 'کیس بصورت موقت / امانت',
          hint: 'اگر تا زمان تعمیر به دستگاه جایگزین نیاز دارید، اینجا مشخص کنید.',
          icon: sectionIcon.deliveryMode,
          type: 'options',
          options: LOANER_OPTIONS,
          columns: 1,
          note: true,
        },
      ]
    ),
  ],

  // «آل این وان» - ترکیب مسیر کیس و مانیتور
  all_in_one: [
    {
      id: 'brand',
      title: 'برند آل این وان',
      hint: 'برند دستگاه آل این وان خود را انتخاب کنید.',
      icon: deviceIcon.allInOne,
      type: 'brands',
      brands: ALL_IN_ONE_BRANDS,
      required: true,
    },
    {
      id: 'model',
      title: 'مدل آل این وان',
      hint: 'نوع آل این وان را بر اساس کاربری آن انتخاب کنید و در صورت اطلاع، مدل دقیق را بنویسید.',
      icon: deviceIcon.allInOne,
      type: 'options',
      options: ALL_IN_ONE_MODEL_OPTIONS,
      columns: 2,
      note: true,
      notePlaceholder: 'مدل دقیق / شماره سریال / مشخصات (اختیاری)',
      required: true,
    },
    {
      id: 'os',
      title: 'انتخاب سیستم عامل',
      hint: 'سیستم عاملی که باید روی دستگاه نصب شود را انتخاب کنید.',
      icon: sectionIcon.software,
      type: 'osGrid',
    },
    {
      id: 'software_install',
      title: 'نصب نرم افزار',
      hint: 'نرم‌افزارهای مورد نیاز برای نصب روی این دستگاه را انتخاب کنید.',
      icon: sectionIcon.software,
      type: 'checklist',
      options: softwareChecklist,
      columns: 1,
    },
    {
      id: 'hardware_default',
      title: 'سخت افزار (پیش فرض)',
      hint: 'ایرادهای سخت‌افزاری متداول دستگاه؛ هر مورد که مصداق دارد را انتخاب کنید.',
      icon: sectionIcon.hardware,
      type: 'checklist',
      options: [
        { id: 'no_power', title: 'دستگاه روشن نمی‌شود' },
        { id: 'no_image', title: 'صفحه نمایش تصویر ندارد' },
        { id: 'touch', title: 'تاچ صفحه کار نمی‌کند' },
        { id: 'slow', title: 'دستگاه کند است' },
        { id: 'hang_reset', title: 'هنگ می‌کند / ریست می‌شود' },
        { id: 'noise', title: 'صدا / فن مشکل دارد' },
        { id: 'ports', title: 'پورت‌ها کار نمی‌کنند' },
        { id: 'other', title: 'سایر مشکلات' },
      ],
      columns: 1,
    },
    {
      id: 'appearance_issue',
      title: 'ایراد ظاهری',
      hint: 'وضعیت ظاهری دستگاه را مشخص کنید تا هنگام تحویل اختلافی پیش نیاید.',
      icon: sectionIcon.equipmentStatus,
      type: 'checklist',
      options: APPEARANCE_ISSUE_OPTIONS,
    },
    deviceStatusStep('وضعیت آل این وان'),
    {
      id: 'hard_disk_data',
      title: 'اطلاعات شخصی در هارد دیسک',
      hint: 'تعیین تکلیف اطلاعات موجود روی هارد پیش از تحویل دستگاه به تکنسین.',
      icon: deviceIcon.hardDisk,
      type: 'options',
      options: HARD_DISK_DATA_OPTIONS,
      columns: 1,
      note: true,
      required: true,
    },
    ...closingSteps(),
  ],

  // «پرینتر / کپی»
  printer_copy: [
    {
      id: 'brand',
      title: 'برند پرینتر / کپی',
      hint: 'برند دستگاه چاپ یا کپی خود را انتخاب کنید.',
      icon: deviceIcon.printer,
      type: 'brands',
      brands: PRINTER_BRANDS,
      required: true,
    },
    {
      id: 'model',
      title: 'مدل پرینتر / کپی',
      hint: 'مدل دقیق دستگاه و شماره سریال آن را وارد کنید.',
      icon: deviceIcon.printer,
      type: 'fields',
      fields: [
        { id: 'model', placeholder: 'مدل دستگاه' },
        { id: 'serial', placeholder: 'شماره سریال' },
      ],
    },
    {
      id: 'device_type',
      title: 'نوع دستگاه',
      hint: 'نوع دستگاه چاپ را مشخص کنید.',
      icon: sectionIcon.hardware,
      type: 'options',
      options: [
        { id: 'laser_single', title: 'لیزری تک‌کاره' },
        { id: 'laser_multi', title: 'لیزری چندکاره' },
        { id: 'inkjet', title: 'جوهرافشان' },
        { id: 'industrial_copier', title: 'کپی صنعتی' },
      ],
      required: true,
    },
    {
      id: 'connection',
      title: 'نحوه اتصال',
      hint: 'دستگاه از چه طریقی به سیستم‌ها متصل می‌شود.',
      icon: sectionIcon.criticalInfra,
      type: 'options',
      options: [
        { id: 'usb', title: 'USB / مستقیم' },
        { id: 'network', title: 'شبکه (LAN)' },
        { id: 'wireless', title: 'وایرلس' },
      ],
      columns: 3,
      note: true,
    },
    {
      id: 'software_default',
      title: 'نرم افزار (پیش فرض)',
      hint: 'خطاها و مشکلات نرم‌افزاری پرینتر؛ هر مورد که مصداق دارد را انتخاب کنید.',
      icon: sectionIcon.software,
      type: 'checklist',
      options: PRINTER_SOFTWARE_ISSUES,
      columns: 1,
      // فهرست پرینتر فقط وقتی «کپی صنعتی» انتخاب نشده باشد.
      visibleWhen: (answers) => answers.device_type?.selected !== 'industrial_copier',
    },
    {
      id: 'hardware_default',
      title: 'سخت افزار (پیش فرض)',
      hint: 'ایرادهای سخت‌افزاری پرینتر؛ هر مورد که مصداق دارد را انتخاب کنید.',
      icon: sectionIcon.hardware,
      type: 'checklist',
      options: PRINTER_HARDWARE_ISSUES,
      columns: 1,
      // فهرست پرینتر فقط وقتی «کپی صنعتی» انتخاب نشده باشد.
      visibleWhen: (answers) => answers.device_type?.selected !== 'industrial_copier',
    },
    {
      id: 'copier_default',
      title: 'ایراد دستگاه کپی (پیش فرض)',
      hint: 'مشکلات دستگاه کپی صنعتی؛ هر مورد که مصداق دارد را انتخاب کنید.',
      icon: sectionIcon.hardware,
      type: 'checklist',
      options: COPIER_ISSUES,
      columns: 1,
      visibleWhen: (answers) => answers.device_type?.selected === 'industrial_copier',
    },
    deviceStatusStep('وضعیت دستگاه'),
    ...closingSteps(),
  ],

  // «هارد دیسک»
  hard_disk: [
    {
      id: 'brand',
      title: 'برند هارد دیسک',
      hint: 'برند هارد یا حافظه‌ی خود را انتخاب کنید.',
      icon: deviceIcon.hardDisk,
      type: 'brands',
      brands: HDD_BRANDS,
      required: true,
    },
    {
      id: 'disk_type',
      title: 'نوع حافظه',
      hint: 'نوع حافظه‌ای که سرویس روی آن انجام می‌شود.',
      icon: deviceIcon.hardDisk,
      type: 'options',
      options: [
        { id: 'hdd', title: 'HDD اینترنال' },
        { id: 'ssd', title: 'SSD' },
        { id: 'nvme', title: 'NVMe / M.2' },
        { id: 'external', title: 'هارد اکسترنال' },
      ],
      required: true,
    },
    {
      id: 'capacity',
      title: 'ظرفیت',
      hint: 'ظرفیت حافظه را انتخاب کنید.',
      icon: sectionIcon.serviceLevel,
      type: 'options',
      options: [
        { id: 'c_256', title: '۲۵۶ گیگابایت' },
        { id: 'c_512', title: '۵۱۲ گیگابایت' },
        { id: 'c_1t', title: '۱ ترابایت' },
        { id: 'c_2t', title: '۲ ترابایت' },
        { id: 'c_4t', title: '۴ ترابایت و بالاتر' },
      ],
      columns: 3,
      note: true,
      notePlaceholder: 'ظرفیت / حجم هارد را بنویسید: ...',
      noteSatisfies: true,
    },
    {
      id: 'software_default',
      title: 'نرم افزار (پیش فرض)',
      hint: 'مشکلات نرم‌افزاری هارد؛ هر مورد که مصداق دارد را انتخاب کنید.',
      icon: sectionIcon.software,
      type: 'checklist',
      options: HARD_DISK_SOFTWARE_ISSUES,
      columns: 1,
    },
    {
      id: 'hardware_default',
      title: 'سخت افزار (پیش فرض)',
      hint: 'مشکلات سخت‌افزاری هارد؛ هر مورد که مصداق دارد را انتخاب کنید.',
      icon: sectionIcon.hardware,
      type: 'checklist',
      options: HARD_DISK_HARDWARE_ISSUES,
      columns: 1,
    },
    deviceStatusStep('وضعیت هارد'),
    {
      id: 'hard_disk_data',
      title: 'اطلاعات شخصی در هارد دیسک',
      hint: 'تعیین تکلیف اطلاعات موجود روی هارد پیش از تحویل به تکنسین.',
      icon: deviceIcon.hardDisk,
      type: 'options',
      options: [
        ...HARD_DISK_DATA_OPTIONS,
        { id: 'recovery', title: 'بازیابی اطلاعات پاک‌شده' },
      ],
      columns: 1,
      note: true,
      required: true,
    },
    ...closingSteps(),
  ],

  // «ضایعات» - جمع‌آوری و تحویل اقلام اسقاط سازمان
  trash: [
    {
      id: 'scrap_items',
      title: 'اقلام ضایعاتی',
      hint: 'تعداد اقلام اسقاط سازمان را به تفکیک نوع دستگاه وارد کنید.',
      icon: sectionIcon.procurement,
      type: 'hardwareCounters',
      itemIds: [
        'laptop', 'monitor', 'case_standard', 'case_professional',
        'mini_case', 'all_in_one', 'printer_single', 'printer_multi',
        'industrial_copier', 'storage_drive',
      ],
      required: true,
    },
    {
      id: 'scrap_status',
      title: 'وضعیت اقلام',
      hint: 'وضعیت کلی اقلام تحویلی را مشخص کنید.',
      icon: sectionIcon.equipmentStatus,
      type: 'options',
      options: [
        { id: 'repairable', title: 'قابل تعمیر / بازیابی' },
        { id: 'parts_only', title: 'فقط قطعات قابل استفاده' },
        { id: 'full_scrap', title: 'اسقاط کامل' },
      ],
      columns: 3,
      note: true,
      required: true,
    },
    {
      id: 'hard_disk_data',
      title: 'اطلاعات شخصی در هارد دیسک',
      hint: 'پیش از تحویل اقلام، تکلیف اطلاعات روی هاردها را مشخص کنید.',
      icon: deviceIcon.hardDisk,
      type: 'options',
      options: HARD_DISK_DATA_OPTIONS,
      columns: 1,
      note: true,
      required: true,
    },
    {
      id: 'pickup_mode',
      title: 'نحوه تحویل / جمع‌آوری',
      hint: 'اقلام توسط تکنسین لوپ جمع‌آوری شود یا سازمان خودش تحویل می‌دهد.',
      icon: sectionIcon.deliveryMode,
      type: 'options',
      options: [
        { id: 'loop_pickup', title: 'جمع‌آوری توسط لوپ' },
        { id: 'org_delivery', title: 'تحویل توسط سازمان' },
      ],
      note: true,
      required: true,
    },
    ...closingSteps(),
  ],
};

const REQUIRED_DEVICE_STEPS = {
  laptop: ['brand', 'model', 'device_status', 'hard_disk_data'],
  monitor: ['brand', 'panel_type', 'size', 'physical_issue', 'device_status'],
  case: ['model', 'device_status', 'hard_disk_data'],
  all_in_one: ['brand', 'model', 'device_status', 'hard_disk_data'],
  hard_disk: ['brand', 'disk_type', 'device_status', 'hard_disk_data'],
  printer_copy: ['brand', 'model', 'device_type', 'device_status'],
};

export const SERVICE_STEP_IDS = ['os', 'software_install', 'software_default', 'hardware_default'];

export const getFlow = (categoryId) => {
  const flow = SYSTEMATIC_FLOWS[categoryId] || [];
  const required = REQUIRED_DEVICE_STEPS[categoryId];
  if (!required) return flow;
  return flow.map((step) => ({
    ...step,
    required: required.includes(step.id) || ['technician', 'time_range', 'address'].includes(step.id),
  }));
};

// مراحلی که با پاسخ‌های فعلی دیده می‌شوند. مرحله‌ی دارای `visibleWhen` فقط وقتی
// نمایش داده (و در خلاصه/رسید حساب) می‌شود که شرطش برقرار باشد - مثلاً فهرست
// ایرادهای «دستگاه کپی» فقط وقتی نوع دستگاه «کپی صنعتی» است. پاسخِ مرحله‌ی
// پنهان در answers می‌ماند ولی جایی خوانده نمی‌شود.
export const getVisibleFlow = (categoryId, answers = {}) =>
  getFlow(categoryId).filter((step) => !step.visibleWhen || step.visibleWhen(answers));

export const getCategory = (categoryId) =>
  SYSTEMATIC_CATEGORIES.find((c) => c.id === categoryId) || null;

export const procurementItemsByIds = (ids) =>
  PROCUREMENT_ITEMS.filter((item) => ids.includes(item.id));

// ---------------------------------------------------------------------------
// تطبیق دسته‌های برگشتی از API (`/api/categories`) با مسیرهای سیستماتیک بالا.
//
// صفحه‌ی «انتخاب سیستماتیک» همان کاشی‌ها و همان آیکون‌های سروری صفحه‌ی اصلی
// (screens/FolderScreen.js) را نشان می‌دهد؛ بنابراین آیتم‌ها از API می‌آیند و
// اینجا فقط به id مسیر داخلی نگاشت می‌شوند. عنوان‌ها بسته به زبان فارسی یا
// انگلیسی برمی‌گردند، پس هر دو حالت به‌عنوان alias ثبت شده است.
// ---------------------------------------------------------------------------
const CATEGORY_ALIASES = {
  user_account: ['حساب کاربری', 'user account', 'profile'],
  laptop: ['لپ تاپ', 'لپتاپ', 'laptop', 'notebook'],
  printer_copy: ['پرینتر / کپی', 'پرینتر کپی', 'پرینتر', 'کپی', 'printer copy', 'printer', 'copy', 'copier'],
  monitor: ['مانیتور', 'نمایشگر', 'monitor', 'display'],
  case: ['کیس', 'کیس پی سی', 'case', 'pc', 'desktop'],
  trash: ['ضایعات', 'اسقاط', 'trash', 'scrap', 'waste'],
  all_in_one: ['آل این وان', 'all in one', 'allinone', 'aio'],
  hard_disk: ['هارد دیسک', 'هارد', 'hard disk', 'harddisk', 'hdd', 'ssd', 'storage'],
};

// حذف نیم‌فاصله/اعراب و یکدست‌کردن جداکننده‌ها تا «پرینتر / کپی» و «پرینتر/کپی»
// و «Printer / Copy» همگی یک کلید بدهند.
const normalizeTitle = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[‌‏‎]/g, ' ')
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[/\-_.,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ALIAS_LOOKUP = Object.entries(CATEGORY_ALIASES).reduce((acc, [id, aliases]) => {
  aliases.forEach((alias) => {
    acc[normalizeTitle(alias)] = id;
  });
  return acc;
}, {});

// دسته‌ی API (یا هر آبجکت {id, title}) را به id مسیر سیستماتیک تبدیل می‌کند؛
// اگر مسیری برای آن تعریف نشده باشد null برمی‌گرداند تا صفحه رفتار قبلی
// (زیر‌دسته / Steps) را برای آن دسته حفظ کند.
export const resolveSystematicCategoryId = (category) => {
  if (!category) return null;

  // ۱) id دقیقاً یکی از کلیدهای مسیرهاست (مثلاً وقتی از SYSTEMATIC_CATEGORIES
  //    محلی می‌آید و نه از API).
  const rawId = category.id;
  if (rawId && (SYSTEMATIC_FLOWS[rawId] || rawId === 'user_account')) return rawId;

  // ۲) id یا عنوان با یکی از alias‌ها می‌خواند (id عددی API از اینجا رد می‌شود
  //    و با عنوان تطبیق داده می‌شود).
  return (
    ALIAS_LOOKUP[normalizeTitle(rawId)] ||
    ALIAS_LOOKUP[normalizeTitle(category.title)] ||
    null
  );
};
