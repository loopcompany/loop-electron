/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/contact/ViolationReportScreen.js
 *
 * Reporting a violation as a desktop form (@desktop/FormKit): what happened
 * and who was involved, side by side, the description in full width, the
 * tracking list one click away in the side column. Quick chips fill the
 * "violation type" field with the common answers the placeholder lists.
 *
 * Same state, validation and request as the mobile file
 * (`violationReportAPI.submitReport`, the same required fields, messages and
 * Laravel error handling, the form reset after success).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenHeaders from '@components/ScreenHeaders';
import violationReportAPI from '@services/ViolationReportApi';
import { showToastOrAlert } from '@helpers/Common';
import DatePickerModal from '@components/DatePickerModal';

import { DButton } from '@desktop/ui';
import { AsideAction, Field, FieldGrid, FormPage, FormSection, QuickChips, SelectField, TextField, TipsCard } from '@desktop/FormKit';

const COPY = {
  fa: {
    subtitle: 'اگر از تکنسین، پشتیبانی یا یک تراکنش رضایت نداشتید، جزئیات را بنویسید؛ گزارش شما مستقیم به واحد نظارت لوپ می‌رسد.',
    what: 'چه اتفاقی افتاده؟',
    whatHint: 'نوع تخلف و طرف مربوط را مشخص کنید',
    detail: 'جزئیات و مبلغ',
    detailHint: 'تاریخ، مبلغ و شرح کامل ماجرا',
    chips: ['تکنسین', 'پشتیبانی لوپ', 'تراکنش'],
    actionsHint: 'فیلدهای ستاره‌دار الزامی‌اند. پس از ثبت، از بخش «پیگیری» وضعیت گزارش را ببینید.',
    toman: 'تومان',
    trackTitle: 'گزارش‌های قبلی',
    trackText: 'وضعیت رسیدگی به گزارش‌هایی که قبلاً ثبت کرده‌اید.',
    tips: 'برای رسیدگی سریع‌تر',
    tipItems: ['نام یا کد تکنسین را دقیق وارد کنید', 'تاریخ و مبلغ را مطابق رسید بنویسید', 'ماجرا را کوتاه و دقیق شرح دهید'],
    confidential: 'محرمانه',
    fast: 'رسیدگی در کمتر از ۷۲ ساعت',
  },
  en: {
    subtitle: 'Not happy with a technician, support or a transaction? Tell us — your report goes straight to Loop’s oversight team.',
    what: 'What happened?',
    whatHint: 'The kind of violation and who was involved',
    detail: 'Details and amount',
    detailHint: 'Date, amount and the full story',
    chips: ['Technician', 'Loop support', 'Transaction'],
    actionsHint: 'Starred fields are required. After submitting, follow up from “Tracking”.',
    toman: 'Toman',
    trackTitle: 'Your previous reports',
    trackText: 'See how the reports you filed are being handled.',
    tips: 'For a faster review',
    tipItems: ['Enter the technician’s name or code exactly', 'Use the date and amount on the receipt', 'Keep the description short and precise'],
    confidential: 'Confidential',
    fast: 'Reviewed within 72 hours',
  },
};

export default function ViolationReportScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];
  const [form, setForm] = useState({
    type: '',
    technician: '',
    date: '',
    amount: '',
    desc: '',
  });
  const [loading, setLoading] = useState(false);
  const [datePickerModal, setDatePickerModal] = useState(false);
  const handleChange = (field, value) => {
    setForm(prevForm => ({ ...prevForm, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.date || !form.amount || !form.desc || !form.type) {
      showToastOrAlert(t('Please enter violation type, date, amount and description'));
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        subject: form.type,
        name: form.technician,
        date: form.date,
        amount: form.amount,
        description: form.desc,
      };

      const response = await violationReportAPI.submitReport(reportData);

      if (response.status === 'success') {
        showToastOrAlert(response.message || t('Violation report registered successfully'));
        setForm({
          type: '',
          technician: '',
          date: '',
          amount: '',
          desc: '',
        });
      }
    } catch (error) {
      console.error('Violation report error:', error);

      let errorMessage = t('Error registering violation report');

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.errors) {
          const validationErrors = Object.values(errorData.errors).flat();
          errorMessage = validationErrors[0] || errorMessage;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      showToastOrAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t("Violation Report/Tracking")} />
      <FormPage
        hero={{
          icon: 'megaphone-outline',
          title: t("Violation Report/Tracking"),
          subtitle: copy.subtitle,
          badges: [
            { icon: 'lock-closed-outline', label: copy.confidential },
            { icon: 'time-outline', label: copy.fast },
          ],
        }}
        actionsHint={copy.actionsHint}
        actions={
          <>
            <DButton title={t('Submit')} icon="send" variant="gold" size="lg" loading={loading} disabled={loading} onPress={handleSubmit} />
            <DButton title={t('Tracking')} icon="search-outline" variant="outline" size="lg" onPress={() => navigation.navigate('ViolationReportsListScreen')} />
          </>
        }
        aside={
          <>
            <AsideAction icon="document-text-outline" title={copy.trackTitle} text={copy.trackText}>
              <DButton title={t('Tracking')} icon="search-outline" variant="gold" block onPress={() => navigation.navigate('ViolationReportsListScreen')} />
            </AsideAction>
            <TipsCard title={copy.tips} items={copy.tipItems} />
          </>
        }
      >
        <FormSection index={0} icon="alert-circle-outline" title={copy.what} subtitle={copy.whatHint}>
          <FieldGrid>
            <Field label={t('Violation Type')} required>
              <TextField
                icon="flag-outline"
                placeholder={t('From technician / Loop support / Transaction / Specify')}
                value={form.type}
                onChangeText={(text) => handleChange('type', text)}
              />
              <QuickChips options={copy.chips} value={form.type} onPick={(value) => handleChange('type', value)} />
            </Field>
            <Field label={t('Technician Name / Code')}>
              <TextField
                icon="person-outline"
                placeholder={t('Technician Name / Code')}
                value={form.technician}
                onChangeText={(text) => handleChange('technician', text)}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection index={1} icon="receipt-outline" title={copy.detail} subtitle={copy.detailHint}>
          <FieldGrid>
            <Field label={t('Registration Date')} required>
              <SelectField value={form.date} placeholder={t('Registration Date')} onPress={() => setDatePickerModal(true)} />
            </Field>
            <Field label={t('Transaction Amount')} required>
              <TextField
                icon="cash-outline"
                unit={copy.toman}
                placeholder={t('Transaction Amount')}
                keyboardType="numeric"
                value={form.amount?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                onChangeText={(text) => handleChange('amount', text?.replace(/,/g, ""))}
              />
            </Field>
            <Field label={t('Description')} required full>
              <TextField
                icon="create-outline"
                multiline
                rows={5}
                counter
                maxLength={191}
                placeholder={t('Description')}
                value={form.desc}
                onChangeText={(text) => handleChange('desc', text)}
              />
            </Field>
          </FieldGrid>
        </FormSection>
      </FormPage>

      <DatePickerModal
        datePickerModal={datePickerModal}
        setDatePickerModal={setDatePickerModal}
        birthDate={form.date}
        onDateChange={(date) => handleChange('date', date)}
        setBirthDate={(date) => handleChange('date', date)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
});
