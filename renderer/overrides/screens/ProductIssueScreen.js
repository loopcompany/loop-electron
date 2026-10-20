/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/ProductIssueScreen.js
 *
 * Reporting a fault in a delivered service / product as a desktop form
 * (@desktop/FormKit), in the order the user thinks about it: find the order,
 * check what was filled in from it, describe the problem. The side column
 * explains what happens next.
 *
 * Same state, lookup, auto-fill, validation and request as the mobile file
 * (`faultReportAPI.create`, the same messages and error handling, the form
 * reset after success); the fields the order fills in stay read-only, as on
 * the phone.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeaders from '@components/ScreenHeaders';
import OrderDropdown from '@components/OrderDropdown';
import DatePickerModal from '@components/DatePickerModal';
import { formatDate, formatDateTime } from '@helpers/Common';
import { orderPaidAmount } from '@utils/orderPaidAmount';
import { findOrderByNumber, orderProductName } from '@utils/faultReportOrder';
import { faultReportAPI } from '@services/Api';
import { showToastOrAlert } from '@helpers/Common';

import { DButton, useDir } from '@desktop/ui';
import { AsideAction, Field, FieldGrid, FormPage, FormSection, TextField, TipsCard } from '@desktop/FormKit';
import { palette, radii, tone } from '@desktop/desktopTheme';

const COPY = {
  fa: {
    title: 'گزارش ایرادات سفارش / محصول',
    subtitle: 'لطفاً ایراد یا مغایرت مشاهده‌شده در سفارش یا محصول را شرح دهید تا موضوع بررسی و پیگیری شود.',
    submitted: 'گزارش ایرادات سفارش / محصول با موفقیت ثبت شد',
    submitError: 'خطا در ثبت گزارش ایرادات سفارش / محصول',
    find: 'انتخاب سفارش',
    findHint: 'شماره‌ی سفارش را جستجو کنید یا از فهرست سفارش‌هایتان انتخاب کنید',
    selected: (id) => `سفارش #${id} انتخاب شد — اطلاعاتش در بخش بعد پر شده است.`,
    info: 'اطلاعات سفارش',
    infoHint: 'از سفارش انتخاب‌شده پر می‌شود',
    problem: 'شرح ایراد',
    problemHint: 'لطفاً شرح ایراد را حداقل در ۱۰ نویسه و با جزئیات کامل وارد کنید تا درخواست شما سریع‌تر بررسی شود.',
    toman: 'تومان',
    actionsHint: 'پس از ثبت، نتیجه‌ی بررسی از طریق پیام‌ها به شما اطلاع داده می‌شود.',
    steps: 'مراحل رسیدگی',
    stepItems: ['سفارش مربوط را پیدا کنید', 'ایراد را با جزئیات شرح دهید', 'کارشناس لوپ بررسی و با شما تماس می‌گیرد'],
    help: 'نیاز به راهنمایی دارید؟',
    helpText: 'تیم پشتیبانی در ساعات کاری پاسخ‌گوی شماست.',
    helpButton: 'پیام به پشتیبانی',
    guarantee: 'تحت ضمانت لوپ',
  },
  en: {
    title: 'Order / Product Issue Report',
    subtitle: 'Please describe the issue or discrepancy you noticed in the order or product so it can be reviewed and followed up.',
    submitted: 'Your order / product issue report was submitted',
    submitError: 'Could not submit the order / product issue report',
    find: 'Find the order',
    findHint: 'Search the order number or pick it from your orders',
    selected: (id) => `Order #${id} selected — its details are filled in below.`,
    info: 'Order details',
    infoHint: 'Filled in from the selected order',
    problem: 'Describe the problem',
    problemHint: 'Please describe the issue in at least 10 characters and in full detail so your request can be reviewed faster.',
    toman: 'Toman',
    actionsHint: 'After submitting, you’ll hear back through Messages.',
    steps: 'How it works',
    stepItems: ['Find the order concerned', 'Describe the problem in detail', 'A Loop expert reviews it and contacts you'],
    help: 'Need help?',
    helpText: 'Support is here for you during business hours.',
    helpButton: 'Message support',
    guarantee: 'Covered by Loop',
  },
};

export default function ProductIssueScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const dir = useDir();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];
  const [form, setForm] = useState({
    name: '',
    orderDate: '',
    completeDate: '',
    orderNumber: '',
    techCode: '',
    amount: '',
    desc: '',
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // لیست سفارش‌ها را OrderDropdown بارگذاری می‌کند و به اینجا می‌دهد؛ جستجوی
  // شماره‌ی تایپ‌شده روی همین لیست انجام می‌شود.
  const [orders, setOrders] = useState([]);
  const [orderNumberInput, setOrderNumberInput] = useState('');
  // اگر سرور برای سفارش هیچ نامی برنگرداند، فیلد نام باید قابل‌ویرایش بماند؛
  // وگرنه فیلدی قفل و اجباری، ثبت گزارش را غیرممکن می‌کرد.
  const [nameAutoFilled, setNameAutoFilled] = useState(false);

  // Date picker states
  const [orderDatePickerVisible, setOrderDatePickerVisible] = useState(false);
  const [completeDatePickerVisible, setCompleteDatePickerVisible] = useState(false);

  const handleChange = (key, value) => {
    if (key === 'amount') {
      // Remove commas before setting the value
      value = value.replace(/,/g, '');
    }
    setForm({ ...form, [key]: value });
  };

  const handleOrderSelect = (item) => {
    setSelectedOrder(item);
    setOrderNumberInput(String(item.order_id));
    const productName = orderProductName(item);
    setNameAutoFilled(Boolean(productName));

    // همه‌ی فیلدها جز «توضیحات» از خودِ سفارش پر می‌شوند.
    // تاریخ‌های فرم همان قالب قبلی (فقط تاریخ) را برای سرور نگه می‌دارند؛
    // نمایش با تاریخ و ساعت از خودِ سفارش ساخته می‌شود.
    setForm(prev => ({
      ...prev,
      orderNumber: item.order_id.toString(),
      techCode: item.technician_referral_code || '',
      amount: orderPaidAmount(item),
      name: productName,
      orderDate: item.created_at ? formatDate(item.created_at) : '',
      completeDate: item.finished_at ? formatDate(item.finished_at) : '',
    }));
  };

  const handleOrderNumberLookup = () => {
    if (!orderNumberInput.trim()) {
      showToastOrAlert(t('Enter order number'));
      return;
    }
    const found = findOrderByNumber(orders, orderNumberInput);
    if (!found) {
      showToastOrAlert(t('No order was found with this number.'));
      return;
    }
    handleOrderSelect(found);
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedOrder) {
      showToastOrAlert(t('Please select an order'));
      return;
    }

    if (!form.name || form.name.trim().length < 3) {
      showToastOrAlert(t('Please enter product/service name (minimum 3 characters)'));
      return;
    }

    if (!form.desc || form.desc.trim().length < 10) {
      showToastOrAlert(t('Please enter description (minimum 10 characters)'));
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        order_id: selectedOrder.order_id,
        product_name: form.name,
        ordered_at: form.orderDate,
        delivered_at: form.completeDate,
        technician_code: form.techCode,
        paid_price: form.amount,
        description: form.desc,
      };

      console.log('Submitting fault report with payload:', payload);
      const response = await faultReportAPI.create(payload);

      if (response.success) {
        showToastOrAlert(response.message || copy.submitted);

        // Reset form
        setForm({
          name: '',
          orderDate: '',
          completeDate: '',
          orderNumber: '',
          techCode: '',
          amount: '',
          desc: '',
        });
        setSelectedOrder(null);
        setOrderNumberInput('');
        setNameAutoFilled(false);

        // Navigate back or to reports list
        // navigation.goBack();
      }
    } catch (error) {
      // Detailed error handling: surface server message, validation errors or fallback to generic
      console.error('Error submitting fault report:', error);
      const resp = error.response?.data;
      let errorMessage = copy.submitError;

      if (resp) {
        // Prefer the server message
        if (resp.message) {
          errorMessage = resp.message;
        } else if (resp.error_code) {
          errorMessage = resp.error_code;
        } else if (resp.errors && typeof resp.errors === 'object') {
          // Join first field's errors into a readable string
          const firstKey = Object.keys(resp.errors)[0];
          const errs = resp.errors[firstKey];
          if (Array.isArray(errs)) {
            errorMessage = errs.join('\n');
          } else {
            errorMessage = String(errs);
          }
        } else {
          // Fallback: stringify the whole response (dev only)
          try {
            errorMessage = JSON.stringify(resp);
          } catch (e) {
            errorMessage = t('Unknown server error');
          }
        }
        // Log status code and full response for debugging
        console.debug('Fault report API response status:', error.response?.status, resp);
      } else {
        // No response (network or other axios error)
        errorMessage = error.message || errorMessage;
      }

      showToastOrAlert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={copy.title} />
      <FormPage
        hero={{
          icon: 'construct-outline',
          title: copy.title,
          subtitle: copy.subtitle,
          badges: [{ icon: 'shield-checkmark-outline', label: copy.guarantee }],
        }}
        actionsHint={copy.actionsHint}
        actions={<DButton title={t('Submit')} icon="send" variant="gold" size="lg" onPress={handleSubmit} loading={isSubmitting} />}
        aside={
          <>
            <TipsCard title={copy.steps} icon="git-network-outline" items={copy.stepItems} />
            <AsideAction icon="headset-outline" title={copy.help} text={copy.helpText}>
              <DButton title={copy.helpButton} icon="chatbubbles-outline" variant="gold" block onPress={() => navigation.navigate('MessageScreen')} />
            </AsideAction>
          </>
        }
      >
        <FormSection index={0} icon="receipt-outline" title={copy.find} subtitle={copy.findHint}>
          <View style={[styles.lookup, dir.row]}>
            <View style={styles.flex}>
              <TextField
                icon="search-outline"
                placeholder={t('Enter order number')}
                value={orderNumberInput}
                onChangeText={setOrderNumberInput}
                onSubmitEditing={handleOrderNumberLookup}
                keyboardType="number-pad"
                returnKeyType="search"
              />
            </View>
            <DButton title={t('Find order')} icon="search" size="lg" onPress={handleOrderNumberLookup} />
          </View>
          <View style={[styles.or, dir.row]}>
            <View style={styles.orLine} />
            <Text style={[styles.orText, dir.light]}>{t('Or select from your orders')}</Text>
            <View style={styles.orLine} />
          </View>
          <OrderDropdown
            value={selectedOrder?.value}
            onChange={handleOrderSelect}
            onOrdersLoaded={setOrders}
            placeholder={t('Select Order Number')}
          />
          {!!selectedOrder && (
            <View style={[styles.selected, dir.row]}>
              <Ionicons name="checkmark-circle" size={18} color={palette.success} />
              <Text style={[styles.selectedText, dir.bold, dir.align]}>{copy.selected(selectedOrder.order_id)}</Text>
            </View>
          )}
        </FormSection>

        <FormSection index={1} icon="document-text-outline" title={copy.info} subtitle={copy.infoHint}>
          <FieldGrid>
            <Field label={t('Product / Service Name')} full>
              <TextField
                icon="cube-outline"
                placeholder={t('Product / Service Name')}
                editable={Boolean(selectedOrder) && !nameAutoFilled}
                value={form.name}
                onChangeText={(text) => handleChange('name', text)}
              />
            </Field>
            <Field label={t('Order Registration Date')}>
              <TextField icon="calendar-outline" editable={false} value={formatDateTime(selectedOrder?.created_at) || ''} placeholder={t('Order Registration Date')} />
            </Field>
            <Field label={t('Delivery / Completion Date')}>
              <TextField icon="calendar-number-outline" editable={false} value={formatDateTime(selectedOrder?.finished_at) || ''} placeholder={t('Delivery / Completion Date')} />
            </Field>
            <Field label={t('Technician Code')}>
              <TextField icon="person-outline" editable={false} value={form.techCode} placeholder={t('Technician Code')} />
            </Field>
            <Field label={t('Paid Amount')}>
              <TextField
                icon="cash-outline"
                unit={copy.toman}
                editable={false}
                keyboardType="numeric"
                value={form.amount?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                placeholder={t('Paid Amount')}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection index={2} icon="alert-circle-outline" title={copy.problem} subtitle={copy.problemHint}>
          <Field label={t('Description')} required full>
            <TextField
              icon="create-outline"
              multiline
              rows={6}
              placeholder={t('Description')}
              value={form.desc}
              onChangeText={(text) => handleChange('desc', text)}
            />
          </Field>
        </FormSection>
      </FormPage>

      <DatePickerModal
        datePickerModal={orderDatePickerVisible}
        setDatePickerModal={setOrderDatePickerVisible}
        birthDate={form.orderDate}
        setBirthDate={(date) => setForm(prev => ({ ...prev, orderDate: date }))}
      />

      <DatePickerModal
        datePickerModal={completeDatePickerVisible}
        setDatePickerModal={setCompleteDatePickerVisible}
        birthDate={form.completeDate}
        setBirthDate={(date) => setForm(prev => ({ ...prev, completeDate: date }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1, minWidth: 0 },
  lookup: { alignItems: 'flex-start', gap: 10 },
  or: { alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(127, 140, 160, 0.25)' },
  orText: { fontSize: 12.5, color: 'rgba(127, 140, 160, 1)' },
  selected: { alignItems: 'center', gap: 10, padding: 12, borderRadius: radii.md, backgroundColor: tone.success.bg },
  selectedText: { flex: 1, fontSize: 13, color: tone.success.fg },
});
