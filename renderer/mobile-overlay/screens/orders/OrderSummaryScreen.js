// screens/orders/OrderSummaryScreen.js
//
// پیش‌نمایش نهایی ثبت سفارش.
//
// این صفحه هیچ داده‌ی نمونه‌ای ندارد: همه‌ی مقادیر یا از route.params می‌آیند
// (صفحه‌ای که کاربر از آن «ثبت سفارش» را زده) یا از Redux خوانده می‌شوند.
// قرارداد پارامترها:
//   orderTitle    : string  - عنوان سفارش
//   summaryLines  : [{label, value}] - خلاصه‌ی واقعی انتخاب‌های کاربر
//   schedule      : {date, slot} - تاریخ (قالب DatePicker) و شناسه‌ی بازه‌ی ساعتی
//   contact       : {fullName, mobile} - اطلاعات تماس واردشده در همان فرم
//   price         : number|null - اگر مبلغ قطعی نیست null بماند تا «استعلام» نمایش داده شود

import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, ActivityIndicator, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import NewStyles from '@styles/NewStyles';
import CustomStatusBar from '@components/CustomStatusBar';
import ScreenTitle from '@components/ScreenTitle';
import axios from 'axios';
import { uri } from '@services/URL';
import { API_ENDPOINTS } from '@services/ApiEndpoints';
import { describePickerDate, formatDateForPicker, parsePickerDate, showToastOrAlert } from '@helpers/Common';
import { describeApiError } from '@utils/apiErrorHandler';
import { PROCUREMENT_ITEMS, TIME_SLOT_OPTIONS } from '@org/deviceCatalog';
import { colors } from '@theme/Color';
import { spacing } from '@theme/Spacing';
import { radius } from '@theme/Radius';
import { fontSize, getFontFamily } from '@theme/Typography';
import { createDirectionalStyles } from '@styles/directionalStyles';

const NOT_SET = 'ثبت نشده';

// آدرس ذخیره‌شده یا در حال ویرایش را به یک رشته‌ی خوانا تبدیل می‌کند.
const formatAddress = (entry) => {
  if (!entry) return '';
  const parts = [
    entry.city,
    entry.region,
    entry.address,
    entry.number ? `پلاک ${entry.number}` : '',
    entry.unit ? `واحد ${entry.unit}` : '',
  ];
  return parts.filter((part) => String(part || '').trim()).join('، ');
};

async function uploadAttachments(photos, letterFile, headers) {
  const attachments = [...photos.map((uri) => ({ uri })), ...(letterFile ? [letterFile] : [])];
  if (attachments.length === 0) return [];

  const formData = new FormData();
  for (const [index, attachment] of attachments.entries()) {
    const name = attachment.name || `order-photo-${index + 1}.jpg`;
    if (Platform.OS === 'web') {
      const file = attachment.file ?? await (await fetch(attachment.uri)).blob();
      formData.append('file[]', file, name);
    } else {
      formData.append('file[]', { uri: attachment.uri, name, type: attachment.mimeType || 'image/jpeg' });
    }
  }

  const { data } = await axios.post(`${uri}/orders/upload`, formData, { headers });
  const paths = Array.isArray(data.data) ? data.data : [data.data].filter(Boolean);
  if (paths.length !== attachments.length) throw new Error('ORDER_ATTACHMENT_UPLOAD_INCOMPLETE');
  return paths;
}

export default function OrderSummaryScreen({ navigation, route }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);

  const params = route?.params || {};
  const {
    orderTitle,
    categoryTitle,
    summaryLines = [],
    schedule,
    contact,
    price = null,
    currency = 'تومان',
  } = params;

  const user = useSelector((state) => state?.user?.data);
  const savedAddresses = useSelector((state) => state?.address?.data);
  const addressDraft = useSelector((state) => state?.address);
  const fallbackAddressId = useSelector((state) => state?.step?.addressId);
  const selectedAddressId = params.addressId ?? fallbackAddressId;
  const token = useSelector((state) => state.auth.token);
  const orgProfile = useSelector((state) => state?.organization?.profileData);

  // تاریخ و ساعت مراجعه از همان انتخابگری که کاربر پر کرده است.
  const scheduleDate = schedule?.date;
  const scheduleSlot = schedule?.slot;

  const visitDate = useMemo(() => {
    if (!scheduleDate) return NOT_SET;
    const described = describePickerDate(scheduleDate);
    return described ? `${described.weekday} ${described.dayLabel}` : scheduleDate;
  }, [scheduleDate]);

  const visitTime = useMemo(() => {
    if (!scheduleSlot) return NOT_SET;
    return TIME_SLOT_OPTIONS.find((opt) => opt.id === scheduleSlot)?.title || scheduleSlot;
  }, [scheduleSlot]);

  // آدرس: آدرس انتخاب‌شده‌ی سفارش، سپس آدرس در حال ویرایش، سپس آدرس سازمان.
  const address = useMemo(() => {
    const picked = Array.isArray(savedAddresses)
      ? savedAddresses.find((item) => String(item?.id) === String(selectedAddressId))
      : null;
    return (
      formatAddress(picked) ||
      formatAddress(addressDraft) ||
      orgProfile?.address ||
      NOT_SET
    );
  }, [savedAddresses, selectedAddressId, addressDraft, orgProfile?.address]);

  const phone =
    contact?.mobile ||
    user?.mobile ||
    user?.phone ||
    addressDraft?.mobile ||
    orgProfile?.phone ||
    NOT_SET;

  const orderType = orderTitle || categoryTitle || NOT_SET;
  const canSubmit = Boolean(params.categoryId && selectedAddressId && scheduleDate && scheduleSlot);

  const submitOrder = async () => {
    if (submitting.current) return;
    const categoryId = Number(params.categoryId);
    const date = formatDateForPicker(parsePickerDate(scheduleDate), false);
    const slot = TIME_SLOT_OPTIONS.find((option) => option.id === scheduleSlot);
    if (!token || !Number.isInteger(categoryId) || categoryId <= 0 || !selectedAddressId || !date || !slot) {
      showToastOrAlert('برای ثبت سفارش، دسته‌بندی، آدرس و زمان مراجعه باید مشخص باشند.');
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    try {
      const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
      const answers = params.answers || {};
      const photos = [...new Set(Object.values(answers).flatMap((value) => value?.photos || []))];
      const filePaths = await uploadAttachments(photos, params.letterFile, headers);
      const procurement = params.procurementItems || answers.procurement || {};
      const gender = params.technicianGender || answers.technician?.gender;
      const { data } = await axios.post(`${uri}${API_ENDPOINTS.ORDERS.CREATE}`, {
        address_id: selectedAddressId,
        category_id: categoryId,
        date,
        time: `${slot.start}-${slot.end}`,
        platform: Platform.OS,
        total_price: Number(price) || 0,
        description: summaryLines.map(({ label, value }) => `${label}: ${value}`).join('\n'),
        file_paths: filePaths,
        technician_gender: ['male', 'female'].includes(gender) ? gender : undefined,
        delivery_mode: params.deliveryMode,
        procurement_items: params.procurementSelection ? [params.procurementSelection] : PROCUREMENT_ITEMS.filter((item) => {
          const entry = procurement[item.id];
          return entry?.new > 0 || entry?.used > 0;
        }).map((item) => ({
          item_id: item.id,
          title: item.title,
          new_count: procurement[item.id].new || 0,
          used_count: procurement[item.id].used || 0,
          description: procurement[item.id].desc || undefined,
        })),
      }, { headers });
      if (!data?.success || !data.data?.order_id) throw new Error('ORDER_NOT_CREATED');
      showToastOrAlert(data.message || 'سفارش با موفقیت ثبت شد.');
      navigation.reset({ index: 0, routes: [{ name: 'OrdersScreen' }] });
    } catch (error) {
      showToastOrAlert(error.response ? describeApiError(error) : 'ثبت سفارش انجام نشد. لطفاً دوباره تلاش کنید.');
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={require('@assets/moon.jpg')}
      style={NewStyles.container}
      imageStyle={{ width: '100%', height: '100%' }}
    >
      <CustomStatusBar />
      <View style={{ padding: spacing.md }}>
        <ScreenTitle title={'پیش‌نمایش نهایی ثبت سفارش'} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={NewStyles.title10}>نوع سفارش:</Text>
          <Text style={NewStyles.text10}>{orderType}</Text>

          <Text style={NewStyles.title10}>تاریخ مراجعه:</Text>
          <Text style={NewStyles.text10}>{visitDate}</Text>

          <Text style={NewStyles.title10}>ساعت مراجعه:</Text>
          <Text style={NewStyles.text10}>{visitTime}</Text>

          <Text style={NewStyles.title10}>آدرس:</Text>
          <Text style={NewStyles.text10}>{address}</Text>

          <Text style={NewStyles.title10}>شماره تماس:</Text>
          <Text style={NewStyles.text10}>{phone}</Text>

          <Text style={NewStyles.title10}>هزینه:</Text>
          <Text style={[NewStyles.text11, styles.priceText]}>
            {price > 0
              ? `${price.toLocaleString('fa-IR')} ${currency}`
              : 'پس از بررسی کارشناس اعلام می‌شود'}
          </Text>

          <Text style={NewStyles.title10}>وضعیت سفارش:</Text>
          <Text style={NewStyles.text11}>{NOT_SET}</Text>
        </View>

        {/* خلاصه‌ی واقعی انتخاب‌های کاربر در فرم قبلی */}
        {summaryLines.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.summaryTitle}>جزئیات انتخاب‌های شما</Text>
            {summaryLines.map((line, idx) => (
              <View key={`${line.label}-${idx}`} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{line.label}</Text>
                <Text style={styles.summaryValue}>{line.value}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.editButton} onPress={() => navigation.goBack()}>
          <Text style={NewStyles.text4}>ویرایش اطلاعات</Text>
        </TouchableOpacity>

        {!params.previewOnly && <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || !canSubmit) && { opacity: 0.6 }]}
          onPress={submitOrder}
          disabled={isSubmitting || !canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.textInverse.color} />
          ) : (
            <Text style={NewStyles.text4}>ثبت نهایی سفارش</Text>
          )}
        </TouchableOpacity>}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = createDirectionalStyles((isRTL) => ({
  container: {
    padding: spacing.md,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface.bgColor(0.9),
    borderRadius: radius.md,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    width: '100%',
  },
  summaryTitle: {
    fontFamily: getFontFamily('bold', 'fa'),
    fontSize: fontSize.md,
    color: colors.textPrimary.color,
    marginBottom: spacing.sm,
    textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  summaryRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.bgColor(0.4),
  },
  summaryLabel: {
    flex: 1,
    fontFamily: getFontFamily('light', 'fa'),
    fontSize: fontSize.sm,
    color: colors.textSecondary.color,
    textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  summaryValue: {
    fontFamily: getFontFamily('bold', 'fa'),
    fontSize: fontSize.sm,
    color: colors.textPrimary.color,
    marginRight: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.warning.bgColor(1),
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: colors.success.bgColor(1),
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.xxxl,
    width: '100%',
    alignItems: 'center',
  },
  priceText: {
    color: colors.info.color,
  },
}));
