/**
 * DESKTOP OVERRIDE of loop-customer-mobile/org/SystematicDeviceScreen.js
 *
 * The steps of a systematic order. On a phone they are one long accordion
 * over the moon artwork; on the desktop they are a wizard
 * (@desktop/WizardLayout): a stepper down one side, the current step in a
 * large card with Previous / Next, and the order summary kept live beside it.
 *
 * Everything else is the mobile file: the flow definition, which steps are
 * visible, when a step counts as filled, the summary lines, drafts, the
 * receipt, validation of required steps and the four order actions. The
 * step bodies are rendered by the same OrgSelectionKit components, with
 * more columns where a desktop has the room.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
// صفحه‌ی مراحل هر دسته در مسیر «انتخاب سیستماتیک».
//
// طرح تحویلی برای هر دسته (لپ تاپ، مانیتور، کیس، ...) یک فهرست مرحله‌ای دارد؛
// این صفحه همان فهرست را از org/systematicFlows.js می‌خواند و با همان کیت رابط
// کاربری «انتخاب جامع» (components/OrgSelectionKit.js) رندر می‌کند تا دو مسیر
// دقیقاً یک ظاهر داشته باشند.

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeaders from '@components/ScreenHeaders';
import SchedulePicker from '@components/SchedulePicker';
import SavedAddressPicker from '@components/SavedAddressPicker';
import {
  SelectableOptions,
  BrandGrid,
  IconOptionGrid,
  HardwareCard,
  ProcurementCard,
  DescriptionInput,
  PhotoNoteInput,
  SummaryBox,
  OrderActionButtons,
} from '@components/OrgSelectionKit';
import {
  HARDWARE_ITEMS,
  OS_ITEMS,
  PROCUREMENT_ITEMS,
  TECHNICIAN_GENDER_OPTIONS,
  TIME_SLOT_OPTIONS,
} from './deviceCatalog';
import { getCategory, getFlow, getVisibleFlow } from './systematicFlows';
import NewStyles from '@styles/NewStyles';
import { themeColor10, colors } from '@theme/Color';
import { spacing } from '@theme/Spacing';
import { radius } from '@theme/Radius';
import { fontSize } from '@theme/Typography';
import { describePickerDate, showAlert, showToastOrAlert } from '@helpers/Common';
import { L, LO } from './orgI18n';
import { RECEIPT_STATE, receiptFromSystematic } from '@services/receipt';
import useReceiptSources from '@hooks/useReceiptSources';
import useOrderDraft from '@hooks/useOrderDraft';
import { DRAFT_SOURCE } from '@services/orderDrafts';
import { formatAddressEntry } from '@services/receipt/receiptCustomer';

import WizardLayout from '@desktop/WizardLayout';
import { EmptyState } from '@desktop/ui';

const itemsByIds = (source, ids) =>
  (ids ? source.filter((item) => ids.includes(item.id)) : source);

const titleOf = (options, id) => options.find((opt) => opt.id === id)?.title || id;

const filledFieldValues = (step, value) =>
  (step.fields || []).map((field) => (value?.[field.id] || '').trim()).filter(Boolean);

// آیا این مرحله پر شده است؟ - هم برای تیک سبز کنار شماره‌ی مرحله و هم برای
// اعتبارسنجی مراحلی که required هستند استفاده می‌شود.
const isStepFilled = (step, value) => {
  switch (step.type) {
    case 'brands':
      return Boolean(value?.brand || (value?.other || '').trim());
    case 'fields':
      // مرحله‌هایی مثل «مشخصات کیس» همه‌ی فیلدهایشان اختیاری است؛ هر فیلدی پر
      // شود مرحله کامل حساب می‌شود.
      return filledFieldValues(step, value).length > 0;
    case 'osGrid':
      return Boolean(value);
    case 'options': {
      const hasSelection = step.multi ? Boolean(value?.selected?.length) : Boolean(value?.selected);
      const hasExtra = step.extra ? Boolean(value?.[step.extra.id]) : false;
      const hasPhotos = step.photo ? Boolean(value?.photos?.length) : false;
      // «اینچ دقیق» / «حجم هارد»: نوشتن مقدار دقیق جای انتخاب گزینه را می‌گیرد.
      const hasNote = step.noteSatisfies ? Boolean((value?.note || '').trim()) : false;
      return hasSelection || hasExtra || hasPhotos || hasNote;
    }
    case 'checklist':
      return Boolean(value?.selected?.length || (value?.note || '').trim());
    case 'note':
      return Boolean((value?.note || '').trim());
    case 'photo':
      return Boolean(value?.photos?.length || (value?.note || '').trim());
    case 'procurement':
      return Object.values(value || {}).some((entry) => entry.new > 0 || entry.used > 0 || (entry.desc || '').trim());
    case 'hardwareCounters':
      return Object.values(value || {}).some((entry) => entry.count > 0 || (entry.desc || '').trim());
    case 'schedule':
      return Boolean(value?.date && value?.slot);
    case 'technician':
      return Boolean(value?.gender);
    case 'address':
      return value?.addressId != null;
    default:
      return false;
  }
};

const SystematicDeviceScreen = ({ navigation, route }) => {
  useTranslation(); // subscribe to runtime language switches so L()/LO() re-evaluate
  // دسکتاپ: هر بار فقط یک مرحله در کارت اصلی نمایش داده می‌شود، پس نیازی به
  // اسکرول به مرحله نیست؛ کارت خودش با هر مرحله‌ی تازه به بالا برمی‌گردد.
  const requestScrollTo = () => {};
  const categoryId = route?.params?.categoryId;
  const category = getCategory(categoryId);
  const allSteps = getFlow(categoryId);

  // برای «وضعیت کاربری» و «مشخصات کاربر» روی پیش‌رسید. آدرس و تلفن ثابت از
  // آدرس‌های ذخیره‌شده و - در نبودشان - از پروفایلِ سازمان می‌آید؛
  // `organization.profileData` هیچ‌جای اپ پر نمی‌شود و به‌تنهایی رسید را
  // «نامشخص» می‌کرد.
  const receiptSources = useReceiptSources();

  const [answers, setAnswers] = useState({});
  const [expanded, setExpanded] = useState(allSteps[0]?.id || null);
  // بعضی مراحل به پاسخ مرحله‌ی دیگری وابسته‌اند (پرینتر ↔ دستگاه کپی)؛ شماره‌گذاری،
  // شمارش «مرحله تکمیل شده»، خلاصه و رسید همه فقط روی مراحل نمایان حساب می‌شوند.
  const steps = useMemo(() => getVisibleFlow(categoryId, answers), [categoryId, answers]);

  const setAnswer = (stepId, patch) =>
    setAnswers((prev) => ({ ...prev, [stepId]: { ...prev[stepId], ...patch } }));

  // روی دسکتاپ همیشه یک مرحله باز است (مرحله‌ی جاری ویزارد)
  const selectStep = (id) => setExpanded(id);

  const filledCount = useMemo(
    () => steps.filter((step) => isStepFilled(step, answers[step.id])).length,
    [steps, answers]
  );

  // خلاصه‌ی انتخاب‌ها - در بخش «نمایش / استعلام / ثبت سفارش» نمایش داده می‌شود.
  const summaryLines = useMemo(() => {
    const lines = [];
    steps.forEach((step) => {
      const value = answers[step.id];
      if (!isStepFilled(step, value)) return;
      switch (step.type) {
        case 'brands':
          lines.push({ label: L(step.title), value: value.brand ? titleOf(LO(step.brands), value.brand) : value.other });
          break;
        case 'fields':
          lines.push({ label: L(step.title), value: filledFieldValues(step, value).join(' / ') });
          break;
        case 'osGrid':
          lines.push({ label: L(step.title), value: titleOf(LO(OS_ITEMS), value) });
          break;
        case 'options': {
          const hasSelection = step.multi ? Boolean(value.selected?.length) : Boolean(value.selected);
          // دسکتاپ: چندانتخابی‌ها با نام گزینه‌ها (هر کدام یک خط، برای توضیحات
          // سفارش و تطبیق نرخ)، نه با تعدادشان.
          if (hasSelection) {
            (step.multi ? value.selected : [value.selected]).forEach((id) =>
              lines.push({ label: L(step.title), value: titleOf(LO(step.options), id) })
            );
          }
          if (step.extra && value[step.extra.id]) {
            lines.push({ label: L(step.extra.title), value: titleOf(LO(step.extra.options), value[step.extra.id]) });
          }
          if (step.photo && value.photos?.length) {
            lines.push({ label: `${L(step.title)} - ${L('عکس')}`, value: value.photos.length });
          }
          if ((value.note || '').trim()) {
            lines.push({ label: L(step.title), value: value.note.trim() });
          }
          break;
        }
        case 'checklist':
          (value.selected || []).forEach((id) =>
            lines.push({ label: L(step.title), value: titleOf(LO(step.options), id) })
          );
          if ((value.note || '').trim()) {
            lines.push({ label: `${L(step.title)} - ${L('توضیحات')}`, value: value.note.trim() });
          }
          break;
        case 'note':
          lines.push({ label: L(step.title), value: value.note });
          break;
        case 'photo':
          if (value.photos?.length) {
            lines.push({ label: `${L(step.title)} - ${L('عکس')}`, value: value.photos.length });
          }
          if ((value.note || '').trim()) {
            lines.push({ label: L(step.title), value: value.note });
          }
          break;
        case 'procurement':
          Object.entries(value).forEach(([itemId, entry]) => {
            if (entry.new > 0) lines.push({ label: `${titleOf(LO(PROCUREMENT_ITEMS), itemId)} / ${L('آکبند')}`, value: entry.new });
            if (entry.used > 0) lines.push({ label: `${titleOf(LO(PROCUREMENT_ITEMS), itemId)} / ${L('کارکرده')}`, value: entry.used });
            // دسکتاپ: توضیح هر قلم (مثلاً «ماوس» زیر «لوازم جانبی») هم در خلاصه می‌آید
            if ((entry.desc || '').trim()) {
              lines.push({ label: `${titleOf(LO(PROCUREMENT_ITEMS), itemId)} - ${L('توضیحات')}`, value: entry.desc.trim() });
            }
          });
          break;
        case 'hardwareCounters':
          Object.entries(value).forEach(([itemId, entry]) => {
            if (entry.count > 0) lines.push({ label: titleOf(LO(HARDWARE_ITEMS), itemId), value: entry.count });
            if ((entry.desc || '').trim()) {
              lines.push({ label: `${titleOf(LO(HARDWARE_ITEMS), itemId)} - ${L('توضیحات')}`, value: entry.desc.trim() });
            }
          });
          break;
        case 'technician':
          lines.push({ label: L(step.title), value: titleOf(LO(TECHNICIAN_GENDER_OPTIONS), value.gender) });
          break;
        case 'schedule': {
          const described = describePickerDate(value.date);
          lines.push({
            label: L('تاریخ مراجعه'),
            value: described ? `${described.weekday} ${described.dayLabel}` : value.date,
          });
          lines.push({ label: L('بازه ساعتی'), value: titleOf(LO(TIME_SLOT_OPTIONS), value.slot) });
          break;
        }
        case 'address': {
          const picked = (receiptSources.addresses || []).find(
            (item) => String(item?.id) === String(value.addressId)
          );
          if (picked) {
            lines.push({ label: L('آدرس'), value: formatAddressEntry(picked) || picked.title || '-' });
          }
          break;
        }
        default:
          break;
      }
    });
    return lines;
  }, [steps, answers, receiptSources.addresses]);

  // سفارش نیمه‌کاره به‌صورت پیش‌نویس ذخیره می‌شود و از «سفارشات» قابل ادامه است؛
  // یک خطا یا مرحله‌ی ناقص دیگر همه‌ی انتخاب‌ها را پاک نمی‌کند.
  const { draftId, discardDraft } = useOrderDraft({
    source: DRAFT_SOURCE.SYSTEMATIC,
    initialDraftId: route?.params?.draftId,
    meta: {
      categoryId,
      categoryTitle: route?.params?.categoryTitle ?? category?.title ?? null,
      backendCategoryId: route?.params?.backendCategoryId ?? null,
      title: category?.title ? `${L('انتخاب سیستماتیک')} - ${L(category.title)}` : L('انتخاب سیستماتیک'),
    },
    data: answers,
    hasContent: filledCount > 0,
    onRestore: (saved) => {
      if (saved && typeof saved === 'object') setAnswers(saved);
    },
  });

  const selectedAddressId = answers.address?.addressId ?? null;
  const handleAddressChange = useCallback(
    (addressId) => setAnswers((prev) => ({ ...prev, address: { addressId: addressId ?? null } })),
    []
  );

  const firstMissingStep = () =>
    steps.find((step) => step.required && !isStepFilled(step, answers[step.id]));

  const handleOrderAction = (action) => {
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

    const missing = firstMissingStep();
    if (action === 'submit_order' || action === 'issue_receipt') {
      if (missing) {
        showToastOrAlert(`${L(missing.title)} — ${L('لطفاً این مرحله را تکمیل کنید')}`);
        setExpanded(missing.id);
        requestScrollTo(missing.id);
        return;
      }
    }

    // این مسیر سفارش را روی سرور ثبت نمی‌کند، پس رسید کاملاً از همین answers
    // ساخته می‌شود و به‌صورت پارامتر پاس داده می‌شود (orderId ندارد).
    const preReceipt = () =>
      receiptFromSystematic({
        categoryId,
        answers,
        ...receiptSources,
        // آدرسِ همین سفارش (مرحله‌ی «آدرس‌های منتخب»)، نه آدرسِ مسیر عادی.
        selectedAddressId: selectedAddressId ?? receiptSources.selectedAddressId,
        state: RECEIPT_STATE.PENDING,
      });

    if (action === 'submit_order') {
      // مرحله‌ی «بازه زمانی / رزرو» تاریخ و ساعت مراجعه را نگه می‌دارد.
      const scheduleStep = steps.find((step) => step.type === 'schedule');
      navigation.navigate('OrderSummaryScreen', {
        source: 'systematic',
        // categoryId اینجا کلید محلی مسیر است ('laptop'...)؛ category_id واقعی
        // بک‌اند در backendCategoryId از صفحه‌ی کاشی‌ها رسیده است.
        categoryId: route?.params?.backendCategoryId ?? null,
        categoryTitle: category?.title,
        orderTitle: category?.title ? `${L('انتخاب سیستماتیک')} - ${L(category.title)}` : undefined,
        summaryLines,
        schedule: scheduleStep ? answers[scheduleStep.id] : null,
        answers,
        // آدرس انتخاب‌شده در مرحله‌ی «آدرس‌های منتخب» - همان که با سفارش ثبت می‌شود.
        addressId: selectedAddressId,
        // پس از ثبت موفق روی سرور، OrderSummaryScreen همین پیش‌نویس را پاک می‌کند.
        draftId,
        // پس از ثبت نهایی، OrderSummaryScreen همین رسید را با شماره‌ی سفارش
        // تکمیل و نمایش می‌دهد.
        receipt: preReceipt(),
      });
      return;
    }
    if (action === 'issue_receipt' || action === 'show_receipt') {
      navigation.navigate('OrderReceipt', { receipt: preReceipt() });
    }
  };

  if (!category || allSteps.length === 0) {
    return (
      <View style={styles.screen}>
        <ScreenHeaders title={L('انتخاب سیستماتیک')} />
        <View style={styles.emptyWrap}>
          <EmptyState icon="alert-circle-outline" title={L('مراحل این دسته هنوز تعریف نشده است.')} />
        </View>
      </View>
    );
  }

  const renderStepBody = (step) => {
    const value = answers[step.id];

    switch (step.type) {
      case 'brands':
        return (
          <>
            <BrandGrid
              columns={6}
              brands={LO(step.brands)}
              value={value?.brand || null}
              onChange={(brand) => setAnswer(step.id, { brand })}
            />
            <DescriptionInput
              value={value?.other || ''}
              onChangeText={(other) => setAnswer(step.id, { other })}
              placeholder={L('برند دیگر (اگر در فهرست بالا نیست)')}
            />
          </>
        );

      case 'fields':
        return (
          <>
            {step.fields.map((field) => (
              <TextInput
                key={field.id}
                value={value?.[field.id] || ''}
                onChangeText={(text) => setAnswer(step.id, { [field.id]: text })}
                placeholder={L(field.placeholder)}
                placeholderTextColor={themeColor10.bgColor(0.4)}
                keyboardType={field.keyboardType}
                style={[NewStyles.textInput, NewStyles.border10, { marginBottom: spacing.sm }]}
              />
            ))}
          </>
        );

      case 'osGrid':
        return (
          <IconOptionGrid
            columns={5}
            options={LO(OS_ITEMS)}
            value={value || null}
            onChange={(os) => setAnswers((prev) => ({ ...prev, [step.id]: os }))}
          />
        );

      case 'options':
        return (
          <>
            <SelectableOptions
              options={LO(step.options)}
              value={step.multi ? value?.selected || [] : value?.selected || null}
              onChange={(selected) => setAnswer(step.id, { selected })}
              multi={step.multi}
              columns={Math.max(step.columns || 2, 3)}
            />
            {step.extra ? (
              <>
                <Text style={styles.subLabel}>{L(step.extra.title)}</Text>
                <SelectableOptions
                  options={LO(step.extra.options)}
                  value={value?.[step.extra.id] || null}
                  onChange={(selected) => setAnswer(step.id, { [step.extra.id]: selected })}
                  columns={Math.max(step.extra.columns || 2, 3)}
                />
              </>
            ) : null}
            {step.photo ? (
              <PhotoNoteInput
                photos={value?.photos || []}
                note={value?.note || ''}
                onChangePhotos={(photos) => setAnswer(step.id, { photos })}
                onChangeNote={(note) => setAnswer(step.id, { note })}
                notePlaceholder={L(step.notePlaceholder)}
              />
            ) : step.note ? (
              <DescriptionInput
                value={value?.note || ''}
                onChangeText={(note) => setAnswer(step.id, { note })}
                placeholder={L(step.notePlaceholder)}
              />
            ) : null}
          </>
        );

      case 'checklist':
        return (
          <>
            <SelectableOptions
              options={LO(step.options)}
              value={value?.selected || []}
              onChange={(selected) => setAnswer(step.id, { selected })}
              multi
              columns={Math.max(step.columns || 2, 3)}
            />
            <DescriptionInput
              value={value?.note || ''}
              onChangeText={(note) => setAnswer(step.id, { note })}
              placeholder={L('درخواست دیگری دارید بنویسید...')}
            />
          </>
        );

      case 'hardwareCounters':
        return itemsByIds(HARDWARE_ITEMS, step.itemIds).map((item) => {
          const entry = value?.[item.id] || { count: 0, desc: '' };
          return (
            <HardwareCard
              key={item.id}
              image={item.image}
              title={L(item.title)}
              count={entry.count}
              desc={entry.desc}
              onIncrement={() => setAnswer(step.id, { [item.id]: { ...entry, count: entry.count + 1 } })}
              onDecrement={() => setAnswer(step.id, { [item.id]: { ...entry, count: Math.max(0, entry.count - 1) } })}
              onDescChange={(desc) => setAnswer(step.id, { [item.id]: { ...entry, desc } })}
            />
          );
        });

      case 'procurement':
        return itemsByIds(PROCUREMENT_ITEMS, step.itemIds).map((item) => {
          const entry = value?.[item.id] || { new: 0, used: 0, desc: '' };
          const patch = (changes) => setAnswer(step.id, { [item.id]: { ...entry, ...changes } });
          return (
            <ProcurementCard
              key={item.id}
              image={item.image}
              title={L(item.title)}
              newCount={entry.new}
              usedCount={entry.used}
              desc={entry.desc}
              onNewInc={() => patch({ new: entry.new + 1 })}
              onNewDec={() => patch({ new: Math.max(0, entry.new - 1) })}
              onUsedInc={() => patch({ used: entry.used + 1 })}
              onUsedDec={() => patch({ used: Math.max(0, entry.used - 1) })}
              onDescChange={(desc) => patch({ desc })}
            />
          );
        });

      case 'note':
        return (
          <DescriptionInput
            value={value?.note || ''}
            onChangeText={(note) => setAnswer(step.id, { note })}
            placeholder={L(step.notePlaceholder) || L('توضیحات...')}
          />
        );

      case 'photo':
        return (
          <PhotoNoteInput
            photos={value?.photos || []}
            note={value?.note || ''}
            onChangePhotos={(photos) => setAnswer(step.id, { photos })}
            onChangeNote={(note) => setAnswer(step.id, { note })}
            notePlaceholder={L(step.notePlaceholder)}
          />
        );

      case 'technician':
        return (
          <SelectableOptions
            options={LO(TECHNICIAN_GENDER_OPTIONS)}
            value={value?.gender || null}
            onChange={(gender) => setAnswer(step.id, { gender })}
            columns={2}
          />
        );

      case 'comingSoon':
        return (
          <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <Ionicons name="time-outline" size={28} color={themeColor10.bgColor(0.4)} />
            <Text style={{ fontFamily: 'VazirBold', fontSize: 14, color: themeColor10.bgColor(0.5), marginTop: spacing.sm }}>
              {L('به زودی')}
            </Text>
          </View>
        );

      case 'schedule':
        return (
          <>
            <SchedulePicker
              date={value?.date || ''}
              onChangeDate={(date) => setAnswer(step.id, { date })}
              slot={value?.slot || null}
              onChangeSlot={(slot) => setAnswer(step.id, { slot })}
              slots={LO(TIME_SLOT_OPTIONS)}
            />
            <DescriptionInput
              value={value?.note || ''}
              onChangeText={(note) => setAnswer(step.id, { note })}
              placeholder={L('توضیح درباره زمان مراجعه (اختیاری)')}
            />
          </>
        );

      case 'address':
        return (
          <SavedAddressPicker
            value={selectedAddressId}
            onChange={handleAddressChange}
            navigation={navigation}
          />
        );

      case 'orderActions':
        return (
          <>
            <OrderActionButtons
              onIssueReceipt={() => handleOrderAction('issue_receipt')}
              onShowReceipt={() => handleOrderAction('show_receipt')}
              onSubmit={() => handleOrderAction('submit_order')}
              onCancel={() => handleOrderAction('cancel_order')}
            />
            <SummaryBox title={`${L('خلاصه سفارش')} - ${L(category.title)}`} lines={summaryLines} />
          </>
        );

      default:
        return null;
    }
  };

  const currentStep = steps.find((step) => step.id === expanded) || steps[0];

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={L(category.title)} />
      <WizardLayout
        title={L(category.title)}
        subtitle={L('انتخاب سیستماتیک')}
        image={category.image}
        steps={steps.map((step) => ({
          id: step.id,
          title: L(step.title),
          hint: L(step.hint),
          icon: step.icon,
          required: step.required,
          done: isStepFilled(step, answers[step.id]),
        }))}
        currentId={currentStep?.id}
        onSelect={selectStep}
        filledCount={filledCount}
        summary={{ title: `${L('خلاصه سفارش')} - ${L(category.title)}`, lines: summaryLines }}
      >
        {currentStep ? renderStepBody(currentStep) : null}
      </WizardLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subLabel: {
    fontFamily: 'VazirBold',
    fontSize: fontSize.xs,
    color: colors.textSecondary.color,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});

export default SystematicDeviceScreen;
