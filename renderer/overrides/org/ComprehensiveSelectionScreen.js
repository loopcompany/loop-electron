/**
 * DESKTOP OVERRIDE of loop-customer-mobile/org/ComprehensiveSelectionScreen.js
 *
 * The organisation's "everything in one form" order. On a phone it is twelve
 * accordions over the moon artwork; on the desktop it is the same wizard as
 * the systematic flow (@desktop/WizardLayout): the sections as a stepper,
 * the current section in a large card with Previous / Next, and everything
 * chosen so far in a live summary. Inside each section the devices, items
 * and options are laid out in grids instead of one long column.
 *
 * All state and logic is the mobile file's, copied verbatim: the options,
 * counters and draft, operator validation, the receipt, and the order
 * actions (including jumping to the section that is missing).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import ScreenHeaders from '@components/ScreenHeaders';
import DatePickerModal from '@components/DatePickerModal';
import SchedulePicker from '@components/SchedulePicker';
import SavedAddressPicker from '@components/SavedAddressPicker';
import useOrderDraft from '@hooks/useOrderDraft';
import { DRAFT_SOURCE } from '@services/orderDrafts';
import {
  SelectableOptions,
  SubSectionBanner,
  DeviceCountRow,
  DeviceCountTile,
  HardwareCard,
  ProcurementCard,
  CounterWithDescription,
  SummaryBox,
  OrderActionButtons,
} from '@components/OrgSelectionKit';
import {
  DEVICE_TYPES,
  HARDWARE_ITEMS,
  PROCUREMENT_ITEMS,
  OS_ITEMS,
  SOFTWARE_DEVICE_TYPES,
  SOFTWARE_ITEMS,
  TECHNICIAN_GENDER_OPTIONS,
  TIME_SLOT_OPTIONS,
} from './deviceCatalog';
import { showAlert, showToastOrAlert, validateMelicode, validatePhone } from '@helpers/Common';
import { L, LO } from './orgI18n';
import { RECEIPT_STATE, receiptFromComprehensive } from '@services/receipt';
import useReceiptSources from '@hooks/useReceiptSources';

import WizardLayout from '@desktop/WizardLayout';
import { useDir, useFitColumns } from '@desktop/ui';
import { elevation, motion, palette, radii, surface, tone } from '@desktop/desktopTheme';

const DELIVERY_MODE_OPTIONS = [
  { id: 'once_short', title: 'کوتاه مدت / یکبار' },
  { id: 'monthly_short', title: 'کوتاه مدت / ماهانه' },
  { id: 'yearly_long', title: 'بلند مدت / سالیانه' },
  { id: 'project', title: 'پروژه‌ای' },
];

const EQUIPMENT_STATUS_OPTIONS = [
  { id: 'needs_software_review', title: 'نیاز به بررسی نرم‌افزاری' },
  { id: 'needs_hardware_review', title: 'نیاز به بررسی سخت‌افزاری' },
  { id: 'supply_technical_review', title: 'تامین کالا / بررسی فنی' },
  { id: 'no_equipment_supply', title: 'فاقد تجهیزات / تامین کالا' },
];

const CRITICAL_INFRA_OPTIONS = [
  { id: 'org_software', title: 'نرم‌افزارهای سازمانی' },
  { id: 'network_internet', title: 'شبکه / اینترنت' },
  { id: 'hardware', title: 'سخت‌افزار' },
];

const SERVICE_LEVEL_OPTIONS = [
  { id: 'standard', title: 'استاندارد' },
  { id: 'priority', title: 'اولویت‌دار' },
  { id: 'emergency', title: 'اضطراری' },
];

const VISIT_FREQUENCY_OPTIONS = [
  { id: 'visits_2', title: '۲ بازدید در ماه' },
  { id: 'visits_4', title: '۴ بازدید در ماه' },
  { id: 'visits_6', title: '۶ بازدید در ماه' },
  { id: 'per_agreement', title: 'طبق توافق‌نامه' },
  { id: 'per_presence', title: 'برحسب زمان حضور' },
  { id: 'project_delivery', title: 'فروش تحویل پروژه' },
  { id: 'project_progress', title: 'طبق پیشرفت پروژه' },
];

const SECTIONS = [
  {
    id: 'delivery_mode',
    title: 'نحوه ارائه خدمات',
    hint: 'مشخص کنید خدمات به چه شکل و در چه بازه‌ای ارائه شود: کوتاه‌مدت/یکبار، ماهانه، سالیانه یا پروژه‌ای.',
    icon: require('@assets/icons/sections/delivery-mode.png'),
  },
  {
    id: 'software_services',
    title: 'خدمات نرم‌افزاری',
    hint: 'تعداد سیستم‌عامل‌ها و نرم‌افزارهای مورد نیاز برای نصب را برای هر مورد مشخص کنید.',
    icon: require('@assets/icons/sections/software-services.png'),
  },
  {
    id: 'hardware_services',
    title: 'خدمات سخت‌افزاری',
    hint: 'تعداد و توضیحات مربوط به سرویس سخت‌افزاری هر دسته از تجهیزات (لپ‌تاپ، کیس، مانیتور و ...) را وارد کنید.',
    icon: require('@assets/icons/sections/hardware-services.png'),
  },
  {
    id: 'procurement',
    title: 'تامین تجهیزات / کالا',
    hint: 'اگر علاوه بر سرویس، قصد خرید کالا یا قطعه دارید (مثلاً یک پرینتر یا لوازم جانبی)، تعداد آکبند/کارکرده هر مورد را وارد کنید.',
    icon: require('@assets/icons/sections/procurement.png'),
  },
  {
    id: 'equipment_status',
    title: 'وضعیت فعلی تجهیزات',
    hint: 'وضعیت کنونی تجهیزات سازمان را از نظر نیاز به بررسی نرم‌افزاری، سخت‌افزاری یا تامین کالا مشخص کنید.',
    icon: require('@assets/icons/sections/equipment-status.png'),
  },
  {
    id: 'critical_infra',
    title: 'زیر ساخت‌های حیاتی',
    hint: 'مهم‌ترین زیرساخت سازمان (نرم‌افزار سازمانی، شبکه/اینترنت یا سخت‌افزار) را انتخاب کنید تا در اولویت بررسی قرار گیرد.',
    icon: require('@assets/icons/sections/critical-infra.png'),
  },
  {
    id: 'service_level',
    title: 'سطح خدمات و تامین تجهیزات',
    hint: 'سطح اولویت ارائه خدمت (استاندارد، اولویت‌دار یا اضطراری) را انتخاب کنید.',
    icon: require('@assets/icons/sections/service-level.png'),
  },
  {
    id: 'time_range',
    title: 'بازه زمانی / رزرو',
    hint: 'بسته به نحوه ارائه خدمات انتخابی، تاریخ، بازه زمانی و تعداد بازدید مورد نیاز را تعیین کنید.',
    icon: require('@assets/icons/sections/time-range.png'),
  },
  {
    id: 'operator_info',
    title: 'اطلاعات اپراتور',
    hint: 'مشخصات فردی که به عنوان اپراتور/رابط سازمان با تکنسین در ارتباط خواهد بود را وارد کنید.',
    icon: require('@assets/icons/sections/operator-info.png'),
  },
  {
    id: 'technician',
    title: 'انتخاب تکنسین',
    hint: 'جنسیت تکنسینی که برای انجام خدمت مراجعه می‌کند را انتخاب کنید.',
    icon: require('@assets/icons/sections/technician.png'),
  },
  {
    id: 'letter_upload',
    title: 'بارگزاری نامه / درخواست',
    hint: 'در صورت نیاز، نامه یا درخواست رسمی سازمان را به‌صورت فایل بارگذاری کنید (اختیاری).',
    icon: require('@assets/icons/sections/letter-upload.png'),
  },
  {
    id: 'order_actions',
    title: 'نمایش / استعلام / ثبت سفارش',
    hint: 'پیش از ثبت نهایی می‌توانید پیش‌رسید را صادر یا مشاهده کنید و در نهایت سفارش را ثبت یا لغو نمایید.',
    icon: require('@assets/icons/sections/order-actions.png'),
  },
  // در JSX درست بعد از «بازه زمانی / رزرو» رندر می‌شود؛ انتهای آرایه آمده تا
  // اندیس‌های SEC[n] بخش‌های قبلی جابه‌جا نشوند.
  {
    id: 'address',
    title: 'آدرس‌های منتخب',
    hint: 'آدرس محل ارائه خدمت را از آدرس‌های ذخیره‌شده انتخاب کنید یا از همین‌جا آدرس جدیدی اضافه کنید.',
    icon: require('@assets/icons/sections/address.png'),
  },
];



// ------------------------------------------------------------------------------------------

const ComprehensiveSelectionScreen = ({ navigation, route }) => {
  // useTranslation subscribes the screen to runtime language switches so L()/LO() re-evaluate.
  const { i18n } = useTranslation();
  // دسکتاپ: هر بار فقط یک بخش در کارت ویزارد نمایش داده می‌شود، پس اسکرول به
  // بخش لازم نیست؛ کارت خودش با هر بخش تازه به بالا برمی‌گردد.
  const requestScrollTo = () => {};
  const SEC = useMemo(
    () => SECTIONS.map((s) => ({ ...s, title: L(s.title), hint: L(s.hint) })),
    [i18n.language]
  );
  const SEC_ADDRESS = SEC.find((section) => section.id === 'address');
  // برای «وضعیت کاربری» و «مشخصات کاربر» روی پیش‌رسید. آدرس و تلفن ثابت از
  // آدرس‌های ذخیره‌شده و - در نبودشان - از پروفایلِ سازمان می‌آید؛
  // `organization.profileData` هیچ‌جای اپ پر نمی‌شود و به‌تنهایی رسید را
  // «نامشخص» می‌کرد.
  const receiptSources = useReceiptSources();

  const [expanded, setExpanded] = useState('delivery_mode');

  const [deliveryMode, setDeliveryMode] = useState([]);

  const [deviceCounts, setDeviceCounts] = useState({});
  const [osCounts, setOsCounts] = useState({});
  const [softwareDeviceCounts, setSoftwareDeviceCounts] = useState({});
  const [softwareItems, setSoftwareItems] = useState({});

  const [hardwareItems, setHardwareItems] = useState({});
  const [procurementItems, setProcurementItems] = useState({});

  const [equipmentStatus, setEquipmentStatus] = useState([]);
  const [criticalInfra, setCriticalInfra] = useState(null);
  const [serviceLevel, setServiceLevel] = useState(null);

  const [visitFrequency, setVisitFrequency] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(null);
  const [onceDate, setOnceDate] = useState('');

  const [operatorInfo, setOperatorInfo] = useState({
    jobTitle: '', fullName: '', nationalId: '', mobile: '', birthDate: '',
  });
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);

  const [technicianGender, setTechnicianGender] = useState(null);

  const [letterFile, setLetterFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [addressId, setAddressId] = useState(null);
  const handleAddressChange = useCallback((id) => setAddressId(id ?? null), []);

  // سفارش نیمه‌کاره به‌صورت پیش‌نویس ذخیره می‌شود و از «سفارشات» قابل ادامه است.
  const draftData = useMemo(
    () => ({
      deliveryMode,
      deviceCounts,
      osCounts,
      softwareDeviceCounts,
      softwareItems,
      hardwareItems,
      procurementItems,
      equipmentStatus,
      criticalInfra,
      serviceLevel,
      visitFrequency,
      startDate,
      timeSlot,
      onceDate,
      operatorInfo,
      technicianGender,
      letterFile: letterFile
        ? { name: letterFile.name, uri: letterFile.uri, mimeType: letterFile.mimeType, size: letterFile.size }
        : null,
      addressId,
    }),
    [deliveryMode, deviceCounts, osCounts, softwareDeviceCounts, softwareItems, hardwareItems,
      procurementItems, equipmentStatus, criticalInfra, serviceLevel, visitFrequency, startDate,
      timeSlot, onceDate, operatorInfo, technicianGender, letterFile, addressId]
  );

  const draftHasContent = useMemo(
    () =>
      deliveryMode.length > 0 ||
      equipmentStatus.length > 0 ||
      [deviceCounts, osCounts, softwareDeviceCounts].some((map) => Object.values(map).some((n) => n > 0)) ||
      [softwareItems, hardwareItems].some((map) => Object.values(map).some((e) => e?.count > 0)) ||
      Object.values(procurementItems).some((e) => e?.new > 0 || e?.used > 0) ||
      Boolean(criticalInfra || serviceLevel || visitFrequency || startDate || onceDate || timeSlot) ||
      Object.values(operatorInfo).some((v) => String(v || '').trim()) ||
      Boolean(technicianGender || letterFile || addressId),
    [deliveryMode, equipmentStatus, deviceCounts, osCounts, softwareDeviceCounts, softwareItems,
      hardwareItems, procurementItems, criticalInfra, serviceLevel, visitFrequency, startDate,
      onceDate, timeSlot, operatorInfo, technicianGender, letterFile, addressId]
  );

  const restoreDraft = (saved) => {
    if (!saved || typeof saved !== 'object') return;
    if (Array.isArray(saved.deliveryMode)) setDeliveryMode(saved.deliveryMode);
    if (saved.deviceCounts) setDeviceCounts(saved.deviceCounts);
    if (saved.osCounts) setOsCounts(saved.osCounts);
    if (saved.softwareDeviceCounts) setSoftwareDeviceCounts(saved.softwareDeviceCounts);
    if (saved.softwareItems) setSoftwareItems(saved.softwareItems);
    if (saved.hardwareItems) setHardwareItems(saved.hardwareItems);
    if (saved.procurementItems) setProcurementItems(saved.procurementItems);
    if (Array.isArray(saved.equipmentStatus)) setEquipmentStatus(saved.equipmentStatus);
    setCriticalInfra(saved.criticalInfra ?? null);
    setServiceLevel(saved.serviceLevel ?? null);
    setVisitFrequency(saved.visitFrequency ?? null);
    setStartDate(saved.startDate || '');
    setTimeSlot(saved.timeSlot ?? null);
    setOnceDate(saved.onceDate || '');
    if (saved.operatorInfo) setOperatorInfo((prev) => ({ ...prev, ...saved.operatorInfo }));
    setTechnicianGender(saved.technicianGender ?? null);
    setLetterFile(saved.letterFile?.uri ? saved.letterFile : null);
    setAddressId(saved.addressId ?? null);
  };

  const { draftId, discardDraft } = useOrderDraft({
    source: DRAFT_SOURCE.COMPREHENSIVE,
    initialDraftId: route?.params?.draftId,
    meta: { title: L('انتخاب جامع - خدمات سازمانی') },
    data: draftData,
    hasContent: draftHasContent,
    onRestore: restoreDraft,
  });

  // روی دسکتاپ همیشه یک بخش باز است (مرحله‌ی جاری ویزارد)
  const selectSection = (id) => setExpanded(id);

  const changeDeviceCount = (id, delta) =>
    setDeviceCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const changeOsCount = (id, delta) =>
    setOsCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const changeSoftwareDeviceCount = (id, delta) =>
    setSoftwareDeviceCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const updateSoftwareItem = (id, patch) =>
    setSoftwareItems((prev) => ({ ...prev, [id]: { count: 0, desc: '', ...prev[id], ...patch } }));

  const updateHardwareItem = (id, patch) =>
    setHardwareItems((prev) => ({ ...prev, [id]: { count: 0, desc: '', ...prev[id], ...patch } }));

  const updateProcurementItem = (id, key, delta) =>
    setProcurementItems((prev) => {
      const current = prev[id] || { new: 0, used: 0, desc: '' };
      return { ...prev, [id]: { ...current, [key]: Math.max(0, current[key] + delta) } };
    });

  const updateProcurementDesc = (id, desc) =>
    setProcurementItems((prev) => ({ ...prev, [id]: { new: 0, used: 0, ...prev[id], desc } }));

  // «بازه زمانی/رزرو» شرطیه: اگر «کوتاه‌مدت/یکبار» جزو حالت‌های انتخاب‌شده باشد
  // (نحوه ارائه خدمات چندانتخابی است)، فقط تاریخ+ساعت نمایش داده می‌شود.
  const isOnceShort = deliveryMode.includes('once_short');

  const handleUploadLetter = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      setUploading(true);
      setLetterFile(result.assets[0]);
      setUploading(false);
    } catch (e) {
      setUploading(false);
      showToastOrAlert(L('خطا در بارگذاری فایل'));
    }
  };

  // اولین مشکلِ «اطلاعات اپراتور» را با پیامِ دقیق برمی‌گرداند (null یعنی مشکلی نیست).
  // قبلاً برای هر نوع خطا - حتی کد ملیِ پر ولی نامعتبر - فقط «اطلاعات اپراتور را کامل
  // کنید» نمایش داده می‌شد و کاربر نمی‌دانست کدام فیلد ایراد دارد.
  const getOperatorInfoError = () => {
    if (!operatorInfo.jobTitle.trim()) return L('عنوان شغلی اپراتور را وارد کنید.');
    if (!operatorInfo.fullName.trim()) return L('نام و نام خانوادگی اپراتور را وارد کنید.');
    // کد ملی اختیاری است، ولی اگر وارد شده باید معتبر باشد.
    if (operatorInfo.nationalId.trim()) {
      const { isValid, message } = validateMelicode(operatorInfo.nationalId);
      if (!isValid) return `${L('کد ملی اپراتور')}: ${message}`;
    }
    const { isValid, message } = validatePhone(operatorInfo.mobile);
    if (!isValid) return `${L('موبایل اپراتور')}: ${message}`;
    return null;
  };

  // دسکتاپ: توضیحی که کاربر زیر هر قلم نوشته (مثلاً «ماوس» زیر «لوازم جانبی»)
  // هم در خلاصه و توضیحات سفارش می‌آید.
  const descLine = (item, entry) =>
    (entry?.desc || '').trim() ? [{ label: `${L(item.title)} - ${L('توضیحات')}`, value: entry.desc.trim() }] : [];

  const softwareSummaryLines = useMemo(() => {
    const lines = [];
    // تعداد لپ‌تاپ/کیسِ «نصب سیستم عامل» هم باید در خلاصه بیاید - قبلاً فقط
    // سیستم‌عامل‌ها و نرم‌افزارها شمرده می‌شدند و انتخاب کاربر گم می‌شد.
    DEVICE_TYPES.forEach((device) => {
      if (deviceCounts[device.id] > 0) {
        lines.push({ label: L(device.title), value: deviceCounts[device.id] });
      }
    });
    OS_ITEMS.forEach((os) => {
      if (osCounts[os.id] > 0) lines.push({ label: L(os.title), value: osCounts[os.id] });
    });
    SOFTWARE_DEVICE_TYPES.forEach((device) => {
      if (softwareDeviceCounts[device.id] > 0) {
        lines.push({ label: L(device.title), value: softwareDeviceCounts[device.id] });
      }
    });
    SOFTWARE_ITEMS.forEach((item) => {
      const entry = softwareItems[item.id];
      if (entry?.count > 0) lines.push({ label: L(item.title), value: entry.count });
      lines.push(...descLine(item, entry));
    });
    return lines;
  }, [deviceCounts, osCounts, softwareDeviceCounts, softwareItems]);

  const hardwareSummaryLines = useMemo(() => {
    return HARDWARE_ITEMS.flatMap((item) => [
      ...(hardwareItems[item.id]?.count > 0 ? [{ label: L(item.title), value: hardwareItems[item.id].count }] : []),
      ...descLine(item, hardwareItems[item.id]),
    ]);
  }, [hardwareItems]);

  const procurementSummaryLines = useMemo(() => {
    const lines = [];
    PROCUREMENT_ITEMS.forEach((item) => {
      const entry = procurementItems[item.id];
      if (entry?.new > 0) lines.push({ label: `${L(item.title)} / ${L('آکبند')}`, value: entry.new });
      if (entry?.used > 0) lines.push({ label: `${L(item.title)} / ${L('کارکرده')}`, value: entry.used });
      lines.push(...descLine(item, entry));
    });
    return lines;
  }, [procurementItems]);

  const handleOrderAction = (action) => {
    // «انتخاب جامع» روی سرور ثبت نمی‌شود؛ رسید از همین state ساخته می‌شود.
    // این مسیر برند/مدل نمی‌پرسد، پس رسیدش «مشخصات محصول» ندارد.
    const preReceipt = () =>
      receiptFromComprehensive({
        deviceCounts,
        osCounts,
        softwareDeviceCounts,
        softwareItems,
        hardwareItems,
        procurementItems,
        operatorInfo,
        startDate,
        onceDate,
        timeSlot,
        ...receiptSources,
        // آدرسِ همین سفارش (بخش «آدرس‌های منتخب»).
        selectedAddressId: addressId ?? receiptSources.selectedAddressId,
        state: RECEIPT_STATE.PENDING,
      });

    if (action === 'cancel_order') {
      showAlert(L('لغو سفارش'), L('آیا از لغو سفارش مطمئن هستید؟'), [
        { text: L('انصراف'), style: 'cancel' },
        {
          text: L('لغو سفارش'),
          style: 'destructive',
          onPress: async () => {
            // لغو صریح توسط کاربر - تنها حالتی که پیش‌نویس بدون ثبت سفارش پاک می‌شود.
            await discardDraft();
            showToastOrAlert(L('سفارش لغو شد'));
            if (navigation.canGoBack()) navigation.goBack();
          },
        },
      ]);
      return;
    }
    if (action === 'submit_order') {
      if (addressId == null) {
        showToastOrAlert(`${L('آدرس‌های منتخب')} — ${L('لطفاً این مرحله را تکمیل کنید')}`);
        setExpanded('address');
        requestScrollTo('address');
        return;
      }
      const operatorError = getOperatorInfoError();
      if (operatorError) {
        showToastOrAlert(operatorError);
        setExpanded('operator_info');
        requestScrollTo('operator_info');
        return;
      }
      navigation.navigate('OrderSummaryScreen', {
        source: 'comprehensive',
        // «جامع سازمانی» در بک‌اند category_id ثابت ۳ دارد (طبق ORGANIZATION_ORDER_API.md)،
        // برخلاف «سیستماتیک» که هر کاشی زیرشاخه‌ی متفاوتی است.
        categoryId: 3,
        orderTitle: L('انتخاب جامع - خدمات سازمانی'),
        // هر سه بخش انتخاب‌شده در یک فهرست خلاصه‌ی واحد.
        summaryLines: [
          ...softwareSummaryLines,
          ...hardwareSummaryLines,
          ...procurementSummaryLines,
        ],
        schedule: { date: isOnceShort ? onceDate : startDate, slot: timeSlot },
        contact: { fullName: operatorInfo.fullName, mobile: operatorInfo.mobile },
        addressId,
        draftId,
        // پس از ثبت نهایی، OrderSummaryScreen همین رسید را با شماره‌ی سفارش
        // تکمیل و نمایش می‌دهد.
        receipt: preReceipt(),
      });
      return;
    }
    if (action === 'issue_receipt' || action === 'show_receipt') {
      navigation.navigate('OrderReceipt', { receipt: preReceipt() });
      return;
    }
  };

  const dir = useDir();
  const titleOf = (options, id) => L(options.find((opt) => opt.id === id)?.title || '');

  const scheduleDate = isOnceShort ? onceDate : startDate;
  const done = {
    delivery_mode: deliveryMode.length > 0,
    software_services: softwareSummaryLines.length > 0,
    hardware_services: hardwareSummaryLines.length > 0,
    procurement: procurementSummaryLines.length > 0,
    equipment_status: equipmentStatus.length > 0,
    critical_infra: Boolean(criticalInfra),
    service_level: Boolean(serviceLevel),
    time_range: Boolean(scheduleDate && timeSlot),
    address: addressId != null,
    operator_info: !getOperatorInfoError(),
    technician: Boolean(technicianGender),
    letter_upload: Boolean(letterFile),
    order_actions: false,
  };
  const required = { address: true, operator_info: true };

  // همان ترتیب JSX موبایل: «آدرس‌های منتخب» درست بعد از «بازه زمانی / رزرو»
  const ORDER = [
    'delivery_mode', 'software_services', 'hardware_services', 'procurement', 'equipment_status',
    'critical_infra', 'service_level', 'time_range', 'address', 'operator_info', 'technician',
    'letter_upload', 'order_actions',
  ];
  const steps = ORDER.map((id) => {
    const section = SEC.find((s) => s.id === id);
    return { id, title: section.title, hint: section.hint, icon: section.icon, done: done[id], required: required[id] };
  });
  const filledCount = steps.filter((step) => step.done).length;

  const summaryLines = [
    ...(deliveryMode.length ? [{ label: SEC[0].title, value: deliveryMode.map((id) => titleOf(DELIVERY_MODE_OPTIONS, id)).join('، ') }] : []),
    ...softwareSummaryLines,
    ...hardwareSummaryLines,
    ...procurementSummaryLines,
    ...(equipmentStatus.length ? [{ label: SEC[4].title, value: equipmentStatus.map((id) => titleOf(EQUIPMENT_STATUS_OPTIONS, id)).join('، ') }] : []),
    ...(criticalInfra ? [{ label: SEC[5].title, value: titleOf(CRITICAL_INFRA_OPTIONS, criticalInfra) }] : []),
    ...(serviceLevel ? [{ label: SEC[6].title, value: titleOf(SERVICE_LEVEL_OPTIONS, serviceLevel) }] : []),
    ...(!isOnceShort && visitFrequency ? [{ label: L('تعداد بازدید'), value: titleOf(VISIT_FREQUENCY_OPTIONS, visitFrequency) }] : []),
    ...(scheduleDate ? [{ label: isOnceShort ? L('تاریخ') : L('تاریخ شروع'), value: scheduleDate }] : []),
    ...(timeSlot ? [{ label: L('بازه ساعتی'), value: titleOf(TIME_SLOT_OPTIONS, timeSlot) }] : []),
    ...(operatorInfo.fullName.trim() ? [{ label: SEC[8].title, value: operatorInfo.fullName.trim() }] : []),
    ...(technicianGender ? [{ label: SEC[9].title, value: titleOf(TECHNICIAN_GENDER_OPTIONS, technicianGender) }] : []),
    ...(letterFile ? [{ label: SEC[10].title, value: letterFile.name }] : []),
  ];

  const renderBody = (id) => {
    switch (id) {
      case 'delivery_mode':
        return <SelectableOptions options={LO(DELIVERY_MODE_OPTIONS)} value={deliveryMode} onChange={setDeliveryMode} multi columns={2} />;

      case 'software_services':
        return (
          <>
            <SubSectionBanner title={L('نصب سیستم عامل')} />
            <Grid columns={2}>
              {DEVICE_TYPES.map((device) => (
                <DeviceCountRow
                  key={device.id}
                  title={L(device.title)}
                  image={device.image}
                  count={deviceCounts[device.id] || 0}
                  onIncrement={() => changeDeviceCount(device.id, 1)}
                  onDecrement={() => changeDeviceCount(device.id, -1)}
                />
              ))}
            </Grid>
            <Grid columns={5} style={styles.mt}>
              {OS_ITEMS.map((os) => (
                <DeviceCountTile
                  key={os.id}
                  width="100%"
                  title={L(os.title)}
                  image={os.image}
                  count={osCounts[os.id] || 0}
                  onIncrement={() => changeOsCount(os.id, 1)}
                  onDecrement={() => changeOsCount(os.id, -1)}
                />
              ))}
            </Grid>

            <SubSectionBanner title={L('نصب نرم‌افزارها')} style={styles.mtLarge} />
            <Grid columns={3}>
              {SOFTWARE_DEVICE_TYPES.map((device) => (
                <DeviceCountRow
                  key={device.id}
                  title={L(device.title)}
                  image={device.image}
                  count={softwareDeviceCounts[device.id] || 0}
                  onIncrement={() => changeSoftwareDeviceCount(device.id, 1)}
                  onDecrement={() => changeSoftwareDeviceCount(device.id, -1)}
                />
              ))}
            </Grid>
            <Grid columns={2} style={styles.mt}>
              {SOFTWARE_ITEMS.map((item) => {
                const entry = softwareItems[item.id] || { count: 0, desc: '' };
                return (
                  <CounterWithDescription
                    key={item.id}
                    title={L(item.title)}
                    count={entry.count}
                    desc={entry.desc}
                    onIncrement={() => updateSoftwareItem(item.id, { count: entry.count + 1 })}
                    onDecrement={() => updateSoftwareItem(item.id, { count: Math.max(0, entry.count - 1) })}
                    onDescChange={(text) => updateSoftwareItem(item.id, { desc: text })}
                  />
                );
              })}
            </Grid>
            <SummaryBox title={L('خدمات نرم‌افزاری')} lines={softwareSummaryLines} />
          </>
        );

      case 'hardware_services':
        return (
          <>
            <Grid columns={2}>
              {HARDWARE_ITEMS.map((item) => {
                const entry = hardwareItems[item.id] || { count: 0, desc: '' };
                return (
                  <HardwareCard
                    key={item.id}
                    image={item.image}
                    title={L(item.title)}
                    count={entry.count}
                    desc={entry.desc}
                    onIncrement={() => updateHardwareItem(item.id, { count: entry.count + 1 })}
                    onDecrement={() => updateHardwareItem(item.id, { count: Math.max(0, entry.count - 1) })}
                    onDescChange={(text) => updateHardwareItem(item.id, { desc: text })}
                  />
                );
              })}
            </Grid>
            <SummaryBox title={L('خدمات سخت‌افزاری')} lines={hardwareSummaryLines} />
          </>
        );

      case 'procurement':
        return (
          <>
            <Grid columns={2} minItemWidth={340}>
              {PROCUREMENT_ITEMS.map((item) => {
                const entry = procurementItems[item.id] || { new: 0, used: 0, desc: '' };
                return (
                  <ProcurementCard
                    key={item.id}
                    image={item.image}
                    title={L(item.title)}
                    newCount={entry.new}
                    usedCount={entry.used}
                    desc={entry.desc}
                    onNewInc={() => updateProcurementItem(item.id, 'new', 1)}
                    onNewDec={() => updateProcurementItem(item.id, 'new', -1)}
                    onUsedInc={() => updateProcurementItem(item.id, 'used', 1)}
                    onUsedDec={() => updateProcurementItem(item.id, 'used', -1)}
                    onDescChange={(text) => updateProcurementDesc(item.id, text)}
                  />
                );
              })}
            </Grid>
            <SummaryBox title={L('تامین تجهیزات / کالا')} lines={procurementSummaryLines} />
          </>
        );

      case 'equipment_status':
        return <SelectableOptions options={LO(EQUIPMENT_STATUS_OPTIONS)} value={equipmentStatus} onChange={setEquipmentStatus} multi columns={2} />;

      case 'critical_infra':
        return <SelectableOptions options={LO(CRITICAL_INFRA_OPTIONS)} value={criticalInfra} onChange={setCriticalInfra} columns={3} />;

      case 'service_level':
        return <SelectableOptions options={LO(SERVICE_LEVEL_OPTIONS)} value={serviceLevel} onChange={setServiceLevel} columns={3} />;

      case 'time_range':
        return (
          <>
            <SubSectionBanner title={L('تعداد بازدید')} />
            {isOnceShort ? (
              <Notice icon="lock-closed-outline">
                {L('چون «کوتاه مدت / یکبار» انتخاب شده، تعداد بازدید قفل است و فقط روز و بازه ساعتی مراجعه را انتخاب می‌کنید.')}
              </Notice>
            ) : null}
            <SelectableOptions
              options={LO(VISIT_FREQUENCY_OPTIONS)}
              value={isOnceShort ? null : visitFrequency}
              onChange={setVisitFrequency}
              columns={4}
              disabled={isOnceShort}
            />
            <SubSectionBanner title={isOnceShort ? L('روز و ساعت مراجعه') : L('تاریخ شروع')} style={styles.mtLarge} />
            {isOnceShort ? (
              <SchedulePicker
                date={onceDate}
                onChangeDate={setOnceDate}
                slot={timeSlot}
                onChangeSlot={setTimeSlot}
                slots={LO(TIME_SLOT_OPTIONS)}
              />
            ) : (
              <SchedulePicker
                date={startDate}
                onChangeDate={setStartDate}
                slot={timeSlot}
                onChangeSlot={setTimeSlot}
                slots={LO(TIME_SLOT_OPTIONS)}
                dateTitle={L('تاریخ شروع')}
              />
            )}
          </>
        );

      case 'address':
        return <SavedAddressPicker value={addressId} onChange={handleAddressChange} navigation={navigation} />;

      case 'operator_info':
        return (
          <>
            <Grid columns={2}>
              <OperatorField
                icon="briefcase-outline"
                label={L('عنوان شغلی اپراتور')}
                required
                value={operatorInfo.jobTitle}
                onChangeText={(t) => setOperatorInfo((p) => ({ ...p, jobTitle: t }))}
              />
              <OperatorField
                icon="person-outline"
                label={L('نام و نام خانوادگی اپراتور')}
                required
                value={operatorInfo.fullName}
                onChangeText={(t) => setOperatorInfo((p) => ({ ...p, fullName: t }))}
              />
              <OperatorField
                icon="card-outline"
                label={L('شماره ملی اپراتور')}
                keyboardType="number-pad"
                value={operatorInfo.nationalId}
                onChangeText={(t) => setOperatorInfo((p) => ({ ...p, nationalId: t }))}
              />
              <OperatorField
                icon="phone-portrait-outline"
                label={L('شماره تلفن موبایل اپراتور')}
                required
                keyboardType="phone-pad"
                value={operatorInfo.mobile}
                onChangeText={(t) => setOperatorInfo((p) => ({ ...p, mobile: t }))}
              />
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, dir.bold, dir.align]}>{L('تاریخ تولد (روز/ماه/سال)')}</Text>
                <Pressable
                  onPress={() => setShowBirthDatePicker(true)}
                  accessibilityRole="button"
                  style={({ hovered }) => [styles.fieldBox, dir.row, hovered && styles.fieldBoxHover]}
                >
                  <Ionicons name="calendar-outline" size={17} color={surface.faint} />
                  <Text style={[styles.fieldValue, dir.light, dir.align, !operatorInfo.birthDate && styles.placeholder]}>
                    {operatorInfo.birthDate || L('تاریخ تولد (روز/ماه/سال)')}
                  </Text>
                  <Ionicons name="chevron-down" size={15} color={surface.faint} />
                </Pressable>
              </View>
            </Grid>
            {(() => {
              const error = getOperatorInfoError();
              return error && (operatorInfo.jobTitle || operatorInfo.fullName || operatorInfo.mobile) ? (
                <Notice icon="alert-circle-outline" kind="warning">{error}</Notice>
              ) : null;
            })()}
            <DatePickerModal
              datePickerModal={showBirthDatePicker}
              setDatePickerModal={setShowBirthDatePicker}
              birthDate={operatorInfo.birthDate}
              setBirthDate={(d) => setOperatorInfo((p) => ({ ...p, birthDate: d }))}
            />
          </>
        );

      case 'technician':
        return (
          <SelectableOptions
            options={LO(TECHNICIAN_GENDER_OPTIONS)}
            value={technicianGender}
            onChange={setTechnicianGender}
            columns={2}
          />
        );

      case 'letter_upload':
        return (
          <Pressable
            onPress={handleUploadLetter}
            disabled={uploading}
            accessibilityRole="button"
            style={({ hovered }) => [styles.drop, hovered && styles.dropHover, letterFile && styles.dropDone]}
          >
            <View style={[styles.dropIcon, letterFile && styles.dropIconDone]}>
              <Ionicons
                name={letterFile ? 'document-attach' : 'cloud-upload-outline'}
                size={30}
                color={letterFile ? palette.success : palette.brandBright}
              />
            </View>
            <Text style={[styles.dropTitle, dir.bold]}>{letterFile ? letterFile.name : L('بارگزاری نامه (اختیاری)')}</Text>
            <Text style={[styles.dropHint, dir.light]}>PDF / JPG / PNG</Text>
          </Pressable>
        );

      case 'order_actions':
        return (
          <>
            <OrderActionButtons
              onIssueReceipt={() => handleOrderAction('issue_receipt')}
              onShowReceipt={() => handleOrderAction('show_receipt')}
              onSubmit={() => handleOrderAction('submit_order')}
              onCancel={() => handleOrderAction('cancel_order')}
            />
            <SummaryBox title={`${L('خلاصه سفارش')} - ${L('انتخاب جامع')}`} lines={summaryLines} />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={L('سازمانی / دولتی')} />
      <WizardLayout
        title={L('انتخاب جامع')}
        subtitle={L('سازمانی / دولتی')}
        image={require('@assets/jame.jpg')}
        steps={steps}
        currentId={expanded || ORDER[0]}
        onSelect={selectSection}
        filledCount={filledCount}
        summary={{ title: `${L('خلاصه سفارش')} - ${L('انتخاب جامع')}`, lines: summaryLines }}
      >
        {renderBody(expanded || ORDER[0])}
      </WizardLayout>
    </View>
  );
};

/**
 * Lays children out in equal columns — fewer when the step card is too
 * narrow for `columns` items of `minItemWidth` (small window, open sidebar).
 */
function Grid({ columns, minItemWidth = columns >= 4 ? 120 : 240, children, style }) {
  const dir = useDir();
  const gap = 12;
  const { width, onLayout } = useFitColumns(columns, minItemWidth, gap);
  return (
    <View style={[styles.grid, dir.row, { gap }, style]} onLayout={onLayout}>
      {React.Children.toArray(children).map((child, i) => (
        <View key={child.key ?? i} style={{ width }}>{child}</View>
      ))}
    </View>
  );
}

function OperatorField({ icon, label, required, ...input }) {
  const dir = useDir();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, dir.bold, dir.align]}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={[styles.fieldBox, dir.row, focused && styles.fieldBoxFocused]}>
        <Ionicons name={icon} size={17} color={focused ? palette.brandBright : surface.faint} />
        <TextInput
          {...input}
          placeholder={label}
          placeholderTextColor={surface.faint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.fieldInput, dir.light, dir.align]}
        />
      </View>
    </View>
  );
}

function Notice({ children, icon = 'information-circle-outline', kind = 'info' }) {
  const dir = useDir();
  const c = tone[kind] || tone.info;
  return (
    <View style={[styles.notice, dir.row, { backgroundColor: c.bg }]}>
      <Ionicons name={icon} size={17} color={c.fg} />
      <Text style={[styles.noticeText, dir.light, dir.align]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  grid: { flexWrap: 'wrap', alignItems: 'stretch' },
  mt: { marginTop: 12 },
  mtLarge: { marginTop: 26 },

  field: { gap: 7 },
  fieldLabel: { fontSize: 12.5, color: surface.muted },
  required: { color: palette.danger },
  fieldBox: {
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.borderStrong,
    backgroundColor: surface.card,
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: motion.fast,
  },
  fieldBoxHover: { borderColor: 'rgba(29, 95, 174, 0.4)', cursor: 'pointer' },
  fieldBoxFocused: { borderColor: palette.sky, boxShadow: elevation.focus },
  fieldInput: { flex: 1, minWidth: 0, height: 46, fontSize: 14, color: surface.title, outlineStyle: 'none' },
  fieldValue: { flex: 1, fontSize: 14, color: surface.title },
  placeholder: { color: surface.faint },

  notice: { alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: radii.md, marginVertical: 10 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 22, color: surface.title },

  drop: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 44,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(29, 95, 174, 0.3)',
    backgroundColor: 'rgba(79, 143, 224, 0.04)',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: motion.fast,
  },
  dropHover: { backgroundColor: 'rgba(79, 143, 224, 0.09)', borderColor: palette.brandBright },
  dropDone: { borderColor: 'rgba(31, 157, 85, 0.45)', backgroundColor: 'rgba(31, 157, 85, 0.05)' },
  dropIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.card,
    boxShadow: elevation.card,
    marginBottom: 4,
  },
  dropIconDone: { backgroundColor: 'rgba(31, 157, 85, 0.1)' },
  dropTitle: { fontSize: 14.5, color: surface.title },
  dropHint: { fontSize: 12, color: surface.faint },
});

export default ComprehensiveSelectionScreen;
