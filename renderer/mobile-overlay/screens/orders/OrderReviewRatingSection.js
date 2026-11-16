import { OrderTextInput as TextInput, OrderTouchable as TouchableOpacity } from '../../components/OrderReadOnlyControls';
// OrderReviewRatingSection.js - ثبت نظر و امتیاز
import React, { useState, useEffect,useMemo } from 'react';
import {
  View,
  Text,
  
  
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { createStyles } from '@styles/NewStyles';
import NewStyles from '@styles/NewStyles';
import { themeColor0, themeColor1, themeColor3, themeColor4, themeColor7 } from '@theme/Color';
import Button from '@components/Button';
import { uri } from '@services/URL';
import { showToastOrAlert, langIsRTL } from '@helpers/Common';
import apiClient from '@services/Api';
import { submitReview, checkReviewForOrder } from '@services/ReviewApi';

export default function OrderReviewRatingSection({ orderId, technicianId, orderStatus, finishedAt, reviewDismissedAt }) {
  const { t, i18n } = useTranslation();
  const isRTL = langIsRTL(i18n.language);
  const NewStyles = useMemo(
    () => createStyles(i18n.language),
    [i18n.language]
  );
    const styles = useMemo(()=> createLocalStyles(NewStyles, isRTL), [NewStyles, isRTL]);
  const [dismissed,setDismissed]=useState(Boolean(reviewDismissedAt));
  const [dismissing,setDismissing]=useState(false);
  const [scores, setScores] = useState({
    application: '',
    technician: '',
    support: '',
  });
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasReview, setHasReview] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const token = useSelector(state => state.auth.token);

  // بررسی شرایط فعال بودن: status=2 و finished_at پر باشد
  const isEnabled = orderStatus == 2 && finishedAt;

  useEffect(() => {
    if (isEnabled && orderId) {
      checkExistingReview();
    }
  }, [isEnabled, orderId]);

  const checkExistingReview = async () => {
    setLoading(true);
    try {
      // استفاده از service برای چک کردن نظر قبلی
      const existingReview = await checkReviewForOrder(token, orderId);
      
      if (existingReview) {
        setHasReview(true);
        setReviewData(existingReview);
      }
    } catch (error) {
      console.log('Error checking review:', error);
    } finally {
      setLoading(false);
    }
  };

  const setRating = (key, value) => {
    setScores({ ...scores, [key]: value });
  };

  const convertRatingToNumber = (rating) => {
    const ratingMap = {
      'Good': 5,
      'Average': 3,
      'Poor': 1
    };
    return ratingMap[rating] || 3;
  };

  const handleSubmit = async () => {
    // بررسی انتخاب همه امتیازات
    if (!scores.application || !scores.technician || !scores.support) {
      showToastOrAlert(t('Please select all ratings'));
      return;
    }

    setSubmitLoading(true);
    try {
      const reviewPayload = {
        technician_id: technicianId,
        order_id: orderId,
        application_rate: convertRatingToNumber(scores.application),
        technician_rate: convertRatingToNumber(scores.technician),
        support_rate: convertRatingToNumber(scores.support),
      };

      // فقط اگر توضیحات وجود داشت اضافه کن
      if (description.trim()) {
        reviewPayload.description = description.trim();
      }

      console.log('Submitting review:', reviewPayload);

      // استفاده از service
      const response = await submitReview(reviewPayload, token);

      if (response?.success) {
        showToastOrAlert(response?.message || t('Your review has been submitted successfully!'));
        setHasReview(true);
        setReviewData(response?.data?.review);
      }
    } catch (error) {
      console.error('Review submission error:', error);
      const message = error?.response?.data?.message || t('Error submitting review');
      showToastOrAlert(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const dismiss = async () => {
    if (dismissing || submitLoading) return;
    setDismissing(true);
    try { await apiClient.post('/reviews/dismiss',{order_id:orderId}); setDismissed(true); }
    catch (error) { showToastOrAlert(error.response?.data?.message || 'ثبت صرف‌نظر انجام نشد.'); }
    finally { setDismissing(false); }
  };

  const convertNumberToRating = (number) => {
    if (number >= 4) return t('Good');
    if (number >= 2) return t('Average');
    return t('Poor');
  };

  // اگر شرایط فعال شدن وجود نداشت
  if (!isEnabled) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={themeColor1.bgColor(1)} />
        <Text style={[NewStyles.text10, { marginTop: 10 }]}>{t('Loading...')}</Text>
      </View>
    );
  }

  if (dismissed && !hasReview) return (
    <View style={styles.container}>
      <Text style={NewStyles.text10}>نظر و امتیاز اختیاری است؛ از ثبت نظر برای این پرونده صرف‌نظر کرده‌اید.</Text>
      <TouchableOpacity onPress={()=>setDismissed(false)}><Text style={NewStyles.title10}>ثبت نظر در صورت تمایل</Text></TouchableOpacity>
    </View>
  );

  // اگر قبلاً نظر ثبت شده
  if (hasReview && reviewData) {
    return (
      <View style={styles.container}>
        <View style={styles.reviewedContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={50} color={themeColor7.bgColor(1)} />
          <Text style={[NewStyles.title10, { marginTop: 10, textAlign: 'center' }]}>
            {t('You have already submitted your review')}
          </Text>

          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={NewStyles.text10}>{t('Application rating:')}</Text>
              <Text style={[NewStyles.text10, { color: themeColor0.bgColor(1) }]}>
                {convertNumberToRating(reviewData.application_rate)}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={NewStyles.text10}>{t('Technician rating:')}</Text>
              <Text style={[NewStyles.text10, { color: themeColor0.bgColor(1) }]}>
                {convertNumberToRating(reviewData.technician_rate)}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={NewStyles.text10}>{t('Support rating:')}</Text>
              <Text style={[NewStyles.text10, { color: themeColor0.bgColor(1) }]}>
                {convertNumberToRating(reviewData.support_rate)}
              </Text>
            </View>

            {reviewData.description && (
              <View style={styles.descriptionContainer}>
                <Text style={NewStyles.text10}>{t('Your review:')}</Text>
                <Text style={[NewStyles.text10, { marginTop: 5, opacity: 0.8 }]}>
                  {reviewData.description}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  // فرم ثبت نظر
  return (
    <View style={styles.container}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="صرف‌نظر از نظر و امتیاز این پرونده" disabled={dismissing || submitLoading} onPress={dismiss} style={{alignSelf:'flex-start',padding:12}}>
        <Text style={NewStyles.title10}>×  نمی‌خواهم نظر بدهم</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[NewStyles.text10, { textAlign: 'center', marginBottom: 15 }]}>
          {t('Dear user, please submit your review about this order.')}
        </Text>

        {/* اپلیکیشن لوپ */}
        <View style={styles.categoryContainer}>
          <Text style={NewStyles.title10}>{t('Loop Application')}</Text>
        </View>
        <View style={styles.rateRow}>
          {['Good', 'Average', 'Poor'].map((label) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.rateButton,
                scores.application === label && styles.activeButton,
              ]}
              onPress={() => setRating('application', label)}
            >
              <Text style={NewStyles.text10}>{t(label)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* تکنسین لوپ */}
        <View style={styles.categoryContainer}>
          <Text style={NewStyles.title10}>{t('Loop Technician')}</Text>
        </View>
        <View style={styles.rateRow}>
          {['Good', 'Average', 'Poor'].map((label) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.rateButton,
                scores.technician === label && styles.activeButton,
              ]}
              onPress={() => setRating('technician', label)}
            >
              <Text style={NewStyles.text10}>{t(label)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* پشتیبانی لوپ */}
        <View style={styles.categoryContainer}>
          <Text style={NewStyles.title10}>{t('Loop Support')}</Text>
        </View>
        <View style={styles.rateRow}>
          {['Good', 'Average', 'Poor'].map((label) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.rateButton,
                scores.support === label && styles.activeButton,
              ]}
              onPress={() => setRating('support', label)}
            >
              <Text style={NewStyles.text10}>{t(label)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* توضیح بیشتر */}
        <Text style={[NewStyles.text10, { marginTop: 10, marginBottom: 6 }]}>
          {t('Have more details? Write them:')}
        </Text>
        <TextInput
          placeholder={t('Description (optional)...')}
          style={styles.commentInput}
          multiline
          value={description}
          onChangeText={setDescription}
          maxLength={1000}
        />
      </View>

      <View style={{ marginTop: 15, width:'100%', alignItems:'center' }}>
        <Button
          title={submitLoading ? t('Submitting...') : t('Submit Review')}
          onPress={handleSubmit}
          disabled={submitLoading || !scores.application || !scores.technician || !scores.support}
          loading={submitLoading}
        />
      </View>
    </View>
  );
}

const createLocalStyles = (NewStyles, isRTL) => StyleSheet.create({
  container: {
    paddingHorizontal: '5%',
    gap: 12,
  },
  section: {
    marginBottom: 10,
  },
  categoryContainer: {
    backgroundColor: themeColor1.bgColor(1),
    ...NewStyles.border10,
    padding: 10,
    marginVertical: 10,
    ...NewStyles.center,
  },
  rateRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rateButton: {
    backgroundColor: themeColor3.bgColor(0.3),
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: themeColor1.bgColor(1),
  },
  commentInput: {
    ...NewStyles.textInput,
    backgroundColor: themeColor4.bgColor(1),
    height: 100,
    ...NewStyles.border10,
    padding: 10,
    textAlignVertical: 'top',
    ...NewStyles.text10,
  },
  loadingContainer: {
    paddingHorizontal: '5%',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewedContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    width: '100%',
    backgroundColor: themeColor4.bgColor(1),
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
  },
  resultRow: {
    ...NewStyles.rowWrapper,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: themeColor3.bgColor(0.1),
  },
  descriptionContainer: {
    paddingTop: 10,
  },
});
