/**
 * DESKTOP OVERRIDE of loop-customer-mobile/org/HardwareSelectionScreen.js
 *
 * «تامین قطعات / کالا» as a desktop form page (@desktop/FormKit), like the
 * other forms of the app: the category as icon choices, the used / sealed
 * quantities as steppers, the need and notes as fields, and a live summary
 * beside them. Same data flow as the mobile file: the same state and
 * defaults, «ثبت سفارش» opens `OrderSummaryScreen` (source 'hardware', title,
 * summary lines) — that screen submits the order — and «لغو سفارش» goes back.
 * The two «پیش رسید» buttons do nothing on the phone either, so they are left
 * out here.
 *
 * Desktop fix: the mobile file sends no category, address, date or time, so
 * OrderSummaryScreen always refused it («دسته‌بندی سفارش نامعتبر است») and the
 * API requires all four anyway. Here the form also asks for the delivery
 * address and day / time slot, and the order goes out under the organisation
 * «جامع» category (3), the backend category that covers equipment supply.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import ScreenHeaders from '@components/ScreenHeaders';
import SchedulePicker from '@components/SchedulePicker';
import SavedAddressPicker from '@components/SavedAddressPicker';
import { showToastOrAlert } from '@helpers/Common';
import { TIME_SLOT_OPTIONS } from './deviceCatalog';
import { L, LO } from './orgI18n';

import { DButton, formatNumber, useDir } from '@desktop/ui';
import { ChoiceGroup, Field, FieldGrid, FormPage, FormSection, TextField, TipsCard } from '@desktop/FormKit';
import { elevation, motion, onDark, palette, radii, surface } from '@desktop/desktopTheme';

const CATEGORY_ICONS = {
  'لپ تاپ': 'laptop-outline',
  'کیس': 'server-outline',
  'مانیتور': 'desktop-outline',
  'آل این وان': 'tv-outline',
  'هارد دیسک': 'save-outline',
  'پرینتر': 'print-outline',
  'لوازم جانبی': 'headset-outline',
};

const CONDITION_HINT = {
  fa: { 'کارکرده': 'دست‌دوم، سالم و تست‌شده', 'اکبند': 'نو و پلمب کارخانه' },
  en: { 'کارکرده': 'Second-hand, tested and working', 'اکبند': 'Brand new, factory sealed' },
};

const COPY = {
  fa: {
    subtitle: 'قطعه یا کالای مورد نیاز را انتخاب کنید، تعداد را مشخص کنید و سفارش را ثبت کنید؛ پیش‌فاکتور در مرحله‌ی بعد نمایش داده می‌شود.',
    badge: 'تامین از منابع معتبر',
    category: 'دسته‌بندی قطعه / کالا',
    categoryHint: 'کالای مورد نیاز از کدام دسته است؟',
    quantity: 'تعداد و وضعیت',
    quantityHint: 'تعداد کالای نو (اکبند) و کارکرده را جداگانه مشخص کنید',
    details: 'شرح نیاز',
    detailsHint: 'هرچه دقیق‌تر بنویسید، پیشنهاد مناسب‌تری دریافت می‌کنید',
    need: 'شرح کلی نیاز',
    needPlaceholder: 'مثلاً: لپ‌تاپ برای کار اداری، رم ۱۶ گیگ، SSD',
    notes: 'توضیحات',
    notesPlaceholder: 'برند، مدل، بودجه یا هر نکته‌ی دیگر…',
    delivery: 'زمان تحویل',
    deliveryHint: 'روز و بازه‌ی ساعتی مناسب برای تحویل کالا',
    address: 'آدرس تحویل',
    addressHint: 'کالا به کدام آدرس ارسال شود؟',
    needQuantity: 'حداقل یک کالا (نو یا کارکرده) انتخاب کنید.',
    needSchedule: 'روز و ساعت تحویل را انتخاب کنید.',
    needAddress: 'آدرس تحویل را انتخاب یا اضافه کنید.',
    submit: 'ثبت سفارش',
    cancel: 'لغو سفارش',
    actionsHint: 'با «ثبت سفارش» خلاصه و هزینه‌ی سفارش را می‌بینید و بعد تأیید می‌کنید.',
    summary: 'خلاصه‌ی سفارش',
    total: 'مجموع',
    items: 'عدد',
    none: 'هنوز تعدادی انتخاب نشده',
    steps: 'مراحل تامین کالا',
    stepItems: [
      'دسته و تعداد کالا را مشخص کنید',
      'خلاصه و هزینه را بررسی و سفارش را ثبت کنید',
      'کارشناس لوپ برای هماهنگی با شما تماس می‌گیرد',
      'کالا تحویل و در صورت نیاز نصب می‌شود',
    ],
  },
  en: {
    subtitle: 'Pick the part or goods you need, set the quantity and place the order; the quote shows on the next step.',
    badge: 'From trusted suppliers',
    category: 'Part / goods category',
    categoryHint: 'Which category is it in?',
    quantity: 'Quantity and condition',
    quantityHint: 'Set new (sealed) and used quantities separately',
    details: 'What you need',
    detailsHint: 'The more precise, the better the offer',
    need: 'General need',
    needPlaceholder: 'e.g. an office laptop, 16 GB RAM, SSD',
    notes: 'Notes',
    notesPlaceholder: 'Brand, model, budget or anything else…',
    delivery: 'Delivery time',
    deliveryHint: 'A day and time slot that suits you for delivery',
    address: 'Delivery address',
    addressHint: 'Where should the goods go?',
    needQuantity: 'Choose at least one item (new or used).',
    needSchedule: 'Choose a delivery day and time.',
    needAddress: 'Choose or add a delivery address.',
    submit: 'Place order',
    cancel: 'Cancel order',
    actionsHint: '“Place order” shows the summary and cost before you confirm.',
    summary: 'Order summary',
    total: 'Total',
    items: 'pcs',
    none: 'No quantity chosen yet',
    steps: 'How supply works',
    stepItems: [
      'Choose the category and quantity',
      'Review the summary and cost, then confirm',
      'A Loop expert calls you to arrange it',
      'The goods are delivered and, if needed, installed',
    ],
  },
};

const HardwareSelectionScreen = ({ navigation }) => {
  useTranslation();
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const [selectedCategory, setSelectedCategory] = useState('لپ تاپ');
  const [generalNeed, setGeneralNeed] = useState('');
  const [description, setDescription] = useState('');
  const [quantities, setQuantities] = useState({
    'کارکرده': 0,
    'اکبند': 2
  });
  const [deliveryDate, setDeliveryDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(null);
  const [addressId, setAddressId] = useState(null);

  const categories = [
    'لپ تاپ',
    'کیس',
    'مانیتور',
    'آل این وان',
    'هارد دیسک',
    'پرینتر',
    'لوازم جانبی'
  ];

  const handleQuantityChange = (item, increment) => {
    setQuantities(prev => ({
      ...prev,
      [item]: Math.max(0, prev[item] + increment)
    }));
  };

  const total = Object.values(quantities).reduce((sum, n) => sum + n, 0);

  const submitOrder = () => {
    const missing =
      (total <= 0 && copy.needQuantity) ||
      ((!deliveryDate || !timeSlot) && copy.needSchedule) ||
      (addressId == null && copy.needAddress);
    if (missing) {
      showToastOrAlert(missing);
      return;
    }
    navigation.navigate('OrderSummaryScreen', {
      source: 'hardware',
      categoryId: 3,
      schedule: { date: deliveryDate, slot: timeSlot },
      addressId,
      orderTitle: `سفارش خدمات سخت‌افزاری - ${selectedCategory}`,
      summaryLines: [
        { label: 'دسته‌بندی', value: selectedCategory },
        ...Object.entries(quantities)
          .filter(([, count]) => count > 0)
          .map(([condition, count]) => ({ label: condition, value: count })),
        ...(generalNeed.trim() ? [{ label: 'نیاز کلی', value: generalNeed }] : []),
        ...(description.trim() ? [{ label: 'توضیحات', value: description }] : []),
      ],
    });
  };

  const cancelOrder = () => {
    if (Platform.OS == 'web') {
      window.history.back()
    } else {
      navigation.goBack()
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={L('تامین قطعات / کالا')} />
      <FormPage
        hero={{
          icon: 'cube-outline',
          title: L('تامین قطعات / کالا'),
          subtitle: copy.subtitle,
          badges: [{ icon: 'shield-checkmark-outline', label: copy.badge }],
        }}
        actionsHint={copy.actionsHint}
        actions={
          <>
            <DButton title={copy.cancel} icon="close" variant="outline" size="lg" onPress={cancelOrder} />
            <DButton title={copy.submit} iconAfter={dir.rtl ? 'arrow-back' : 'arrow-forward'} variant="gold" size="lg" onPress={submitOrder} />
          </>
        }
        aside={
          <>
            <SummaryCard copy={copy} dir={dir} category={selectedCategory} quantities={quantities} total={total} />
            <TipsCard title={copy.steps} icon="git-network-outline" items={copy.stepItems} />
          </>
        }
      >
        <FormSection index={0} icon="grid-outline" title={copy.category} subtitle={copy.categoryHint}>
          <ChoiceGroup
            columns={4}
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categories.map((category) => ({
              value: category,
              label: L(category),
              icon: CATEGORY_ICONS[category],
            }))}
          />
        </FormSection>

        <FormSection index={1} icon="layers-outline" title={copy.quantity} subtitle={copy.quantityHint}>
          <View style={[styles.steppers, dir.row]}>
            {['اکبند', 'کارکرده'].map((condition) => (
              <Stepper
                key={condition}
                dir={dir}
                label={L(condition)}
                hint={CONDITION_HINT[dir.rtl ? 'fa' : 'en'][condition]}
                icon={condition === 'اکبند' ? 'sparkles-outline' : 'refresh-outline'}
                value={quantities[condition]}
                onIncrement={() => handleQuantityChange(condition, 1)}
                onDecrement={() => handleQuantityChange(condition, -1)}
              />
            ))}
          </View>
        </FormSection>

        <FormSection index={2} icon="document-text-outline" title={copy.details} subtitle={copy.detailsHint}>
          <FieldGrid>
            <Field label={copy.need} full>
              <TextField icon="create-outline" value={generalNeed} onChangeText={setGeneralNeed} placeholder={copy.needPlaceholder} />
            </Field>
            <Field label={copy.notes} full>
              <TextField multiline rows={4} value={description} onChangeText={setDescription} placeholder={copy.notesPlaceholder} />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection index={3} icon="calendar-outline" title={copy.delivery} subtitle={copy.deliveryHint}>
          <SchedulePicker
            date={deliveryDate}
            onChangeDate={setDeliveryDate}
            slot={timeSlot}
            onChangeSlot={setTimeSlot}
            slots={LO(TIME_SLOT_OPTIONS)}
          />
        </FormSection>

        <FormSection index={4} icon="location-outline" title={copy.address} subtitle={copy.addressHint}>
          <SavedAddressPicker value={addressId} onChange={(id) => setAddressId(id ?? null)} navigation={navigation} />
        </FormSection>
      </FormPage>
    </View>
  );
};

/** One condition's quantity: − value + */
function Stepper({ dir, label, hint, icon, value, onIncrement, onDecrement }) {
  return (
    <View style={[styles.stepper, value > 0 && styles.stepperOn]}>
      <View style={[styles.stepperHead, dir.row]}>
        <View style={[styles.stepperIcon, value > 0 && styles.stepperIconOn]}>
          <Ionicons name={icon} size={18} color={value > 0 ? palette.navy900 : surface.brandText} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.stepperLabel, dir.bold, dir.align]}>{label}</Text>
          <Text style={[styles.stepperHint, dir.light, dir.align]}>{hint}</Text>
        </View>
      </View>
      <View style={styles.stepperControls}>
        <StepButton icon="remove" onPress={onDecrement} disabled={value <= 0} label="-" />
        <Text style={[styles.stepperValue, dir.bold]}>{formatNumber(value, dir.lang)}</Text>
        <StepButton icon="add" onPress={onIncrement} label="+" primary />
      </View>
    </View>
  );
}

function StepButton({ icon, onPress, disabled, label, primary }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ hovered, pressed }) => [
        styles.stepButton,
        primary && styles.stepButtonPrimary,
        hovered && !disabled && styles.stepButtonHover,
        pressed && !disabled && styles.stepButtonPressed,
        disabled && styles.stepButtonDisabled,
      ]}
    >
      <Ionicons name={icon} size={20} color={primary ? palette.navy900 : surface.brandText} />
    </Pressable>
  );
}

/** Live summary of the choices, in the side column. */
function SummaryCard({ copy, dir, category, quantities, total }) {
  const lines = Object.entries(quantities).filter(([, n]) => n > 0);
  return (
    <View style={styles.summary}>
      <View style={styles.summaryStars} pointerEvents="none" />
      <View style={[styles.summaryHead, dir.row]}>
        <Ionicons name="receipt-outline" size={18} color={palette.gold} />
        <Text style={[styles.summaryTitle, dir.bold]}>{copy.summary}</Text>
      </View>
      <View style={[styles.summaryCategory, dir.row]}>
        <View style={styles.summaryCategoryIcon}>
          <Ionicons name={CATEGORY_ICONS[category] || 'cube-outline'} size={22} color={palette.gold} />
        </View>
        <Text style={[styles.summaryCategoryText, dir.bold, dir.align]}>{L(category)}</Text>
      </View>
      {lines.length ? (
        lines.map(([condition, n]) => (
          <View key={condition} style={[styles.summaryRow, dir.row]}>
            <Text style={[styles.summaryLabel, dir.light]}>{L(condition)}</Text>
            <Text style={[styles.summaryValue, dir.bold]}>{`${formatNumber(n, dir.lang)} ${copy.items}`}</Text>
          </View>
        ))
      ) : (
        <Text style={[styles.summaryLabel, dir.light, dir.align]}>{copy.none}</Text>
      )}
      <View style={[styles.summaryRow, styles.summaryTotal, dir.row]}>
        <Text style={[styles.summaryTotalLabel, dir.bold]}>{copy.total}</Text>
        <Text style={[styles.summaryTotalValue, dir.bold]}>{`${formatNumber(total, dir.lang)} ${copy.items}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1, minWidth: 0 },

  steppers: { gap: 14 },
  stepper: {
    flex: 1,
    minWidth: 0,
    gap: 14,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: surface.cardMuted,
    borderWidth: 1,
    borderColor: surface.border,
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: motion.base,
  },
  stepperOn: { borderColor: 'rgba(233, 179, 8, 0.55)', boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.12)' },
  stepperHead: { alignItems: 'center', gap: 12 },
  stepperIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.brandTint,
  },
  stepperIconOn: { backgroundColor: palette.gold },
  stepperLabel: { fontSize: 15, color: surface.title },
  stepperHint: { fontSize: 12, color: surface.faint, marginTop: 2 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' },
  stepperValue: { fontSize: 26, color: surface.title, minWidth: 60, textAlign: 'center' },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.borderStrong,
    cursor: 'pointer',
    transitionProperty: 'transform, background-color, box-shadow',
    transitionDuration: motion.fast,
  },
  stepButtonPrimary: { backgroundImage: 'linear-gradient(135deg, #ffe45c 0%, #ffd700 45%, #e9b308 100%)', borderColor: 'rgba(233, 179, 8, 0.8)' },
  stepButtonHover: { transform: 'translateY(-1px)', boxShadow: elevation.raised },
  stepButtonPressed: { transform: 'scale(0.95)' },
  stepButtonDisabled: { opacity: 0.4, cursor: 'default' },

  summary: {
    gap: 12,
    padding: 20,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: 'linear-gradient(160deg, #0f2f57 0%, #0a1f3b 55%, #06172d 100%)',
    boxShadow: elevation.raised,
  },
  summaryStars: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: 'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.7) 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.5) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 85% 70%, rgba(255,215,0,0.6) 50%, transparent 51%)',
  },
  summaryHead: { alignItems: 'center', gap: 8 },
  summaryTitle: { color: onDark.text, fontSize: 15 },
  summaryCategory: {
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryCategoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  summaryCategoryText: { flex: 1, color: onDark.text, fontSize: 16 },
  summaryRow: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  summaryLabel: { color: onDark.soft, fontSize: 13 },
  summaryValue: { color: onDark.text, fontSize: 14 },
  summaryTotal: { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  summaryTotalLabel: { color: onDark.soft, fontSize: 13.5 },
  summaryTotalValue: { color: palette.gold, fontSize: 18 },
});

export default HardwareSelectionScreen;
