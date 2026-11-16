import { OrderTouchable as TouchableOpacity } from '../../components/OrderReadOnlyControls';
import { StyleSheet, Text, View,  ActivityIndicator, Linking } from 'react-native'
import React, { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { createStyles } from '@styles/NewStyles';
import { mainUri, uri } from '@services/URL'
import NewStyles from '@styles/NewStyles'
import { formatDate, showToastOrAlert } from '@helpers/Common'
import { themeColor0, themeColor1, themeColor4, themeColor5, themeColor6, themeColor7 } from '@theme/Color'
import ConfirmationModal from '@components/ConfirmationModal'
import Button from '@components/Button'

const OrderReviewSection = ({ data, orderId, onUpdate, navigation }) => {
  const user = useSelector((state) => state?.user);
 
  const { t, i18n } = useTranslation();
  const NewStyles = useMemo(
    () => createStyles(i18n.language),
    [i18n.language]
  );
  const styles = useMemo(() => createLocalStyles(NewStyles), [NewStyles]);
  const token = useSelector((state) => state?.auth?.token)
  const [loadingAccept, setLoadingAccept] = useState(false)
  const [loadingCancel, setLoadingCancel] = useState(false)
  const [acceptModal, setAcceptModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const lang = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  // تایید سفارش
  const handleAcceptOrder = async () => {
    setLoadingAccept(true)
    try {
      const response = await axios.post(
        `${uri}/orders/${orderId}/initial-accept`,
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept-Language': lang
          }
        }
      )

      if (response.status == 200) {
        showToastOrAlert(response?.data?.message || t('Order confirmed successfully'))
        // بروزرسانی داده‌ها
        if (onUpdate) onUpdate()
      }
    } catch (error) {
      const message = error?.response?.data?.message || t('Error confirming order')
      showToastOrAlert(message)
    } finally {
      setLoadingAccept(false)
    }
  }

  // لغو سفارش
  const handleCancelOrder = async () => {
    setLoadingCancel(true)
    try {
      const response = await axios.post(
        `${uri}/orders/cancel`,
        { orderId: orderId },
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept-Language': lang
          }
        }
      )

      if (response.status == 200) {
        showToastOrAlert(response?.data?.message || t('Order canceled successfully'))
        // بروزرسانی داده‌ها
        if (onUpdate) onUpdate()
      }
    } catch (error) {
      const message = error?.response?.data?.message || t('Error canceling order')
      showToastOrAlert(message)
    } finally {
      setLoadingCancel(false)
    }
  }

  const renderRow = (text1, text2, textStyle1, textStyle2) => (
    <View style={NewStyles.rowWrapper}>
      <Text style={[NewStyles.text, textStyle1]}>{text1}</Text>
      <Text style={[NewStyles.text10, textStyle2]}>{text2}</Text>
    </View>
  )

  // چک کردن قفل بودن
  const isLocked = data?.user_initial_accept

  return (
    <View style={[{ width: '90%', alignSelf: 'center', paddingBottom: 10 }, NewStyles.center]}>
      {/* توضیحات */}
      <View style={styles.noticeBox}>
        <Text style={[NewStyles.text10, { textAlign: 'center' }]}>
          {t('Dear user, your request is being reviewed by our expert. Thank you for your patience.')}
        </Text>
      </View>


      {/* اطلاعات سفارش */}
      <View style={[{ backgroundColor: themeColor4.bgColor(1), width: '100%', paddingVertical: 15, paddingHorizontal: '5%', gap: 10 }, NewStyles.border10]}>

        {/* توضیحات کارشناس */}
        {data?.technician_des && (
          <View style={{ gap: 5 }}>
            <View style={[NewStyles.row, { gap: 5 }]}>
              <Ionicons name="create-outline" size={20} color={themeColor0.bgColor(1)} />
              <Text style={NewStyles.title}>{t('Loop expert comments')}</Text>
            </View>
            <View style={[styles.itemWrapper, NewStyles.row, NewStyles.border10, { gap: 10 }]}>
              <Ionicons name="ellipse" size={10} color={themeColor0.bgColor(0.5)} />
              <Text style={[NewStyles.text10, { flex: 1 }]}>{data?.technician_des}</Text>
            </View>
          </View>
        )}

        {/* تاریخ و ساعت مراجعه */}
        {renderRow(
          t('Technician Visit Time'),
          data?.is_urgent > 0
            ? t('Urgent Request')
            : formatDate(data?.date) + t(' at ') + data?.time?.split(':')?.slice(0, 2)?.join(':'),
          NewStyles.text,
          data?.is_urgent > 0 && NewStyles.title6
        )}
      </View>
      {user?.data?.apple_check == 0
        && <View style={[{ width: '100%', gap: 10, maxWidth: 900 }, NewStyles.row]}>
          <View style={[{ flex: 1, }, NewStyles.center]}>
            <Button title={t('Quote')} onPress={() => { navigation.navigate('Invoice', { orderId: orderId }) }} />
          </View>
          <View style={[{ flex: 1 }, NewStyles.center]}>
            <Button title={t('Save Invoice')} style={{ backgroundColor: themeColor7.bgColor(1) }} textStyle={{ color: themeColor4.bgColor(1) }} onPress={() => { Linking.openURL(`${mainUri}/reciept/${orderId}`) }} />
          </View>
        </View>}
      {/* دکمه‌های عملیات - فقط در صورت وجود توضیحات کارشناس */}
      {(data?.technician_des || data?.is_time_changed == 1) && (
        isLocked ? (
          <View style={[styles.lockedBox, NewStyles.center, NewStyles.border10]}>
            <Ionicons name="checkmark-circle" size={40} color={themeColor0.bgColor(1)} />
            <Text style={[NewStyles.title, { color: themeColor0.bgColor(1) }]}>
              {t('Order confirmed')}
            </Text>
            <Text style={[NewStyles.text10]}>
              {t('You confirmed this order on {{date}}', { date: formatDate(data?.user_initial_accept) })}
            </Text>
          </View>
        ) : (
          <View style={[NewStyles.row, { width: '100%', gap: 10, marginTop: 15, maxWidth: 900, }]}>
            <View style={[{ flex: 1 }, NewStyles.center]}>
              <Button
                title={t('Confirm Order')}
                onPress={() => setAcceptModal(true)}
                loading={loadingAccept}
                textStyle={[{ color: themeColor4.bgColor(1) }]}
                style={{ backgroundColor: themeColor7.bgColor(1) }}
              />
            </View>
            <View style={[{ flex: 1 }, NewStyles.center]}>
              <Button
                title={t('Cancel Order')}
                onPress={() => setCancelModal(true)}
                loading={loadingCancel}
                textStyle={{ color: themeColor4.bgColor(1) }}
                style={{ backgroundColor: themeColor6.bgColor(1) }}
              />
            </View>
          </View>
        )
      )}

      {/* Modals */}
      <ConfirmationModal
        title={t('Confirm Order')}
        message={t('Are you sure you want to confirm this order?')}
        action={handleAcceptOrder}
        confirmationModal={acceptModal}
        setConfirmationModal={setAcceptModal}
      />

      <ConfirmationModal
        title={t('Cancel Order')}
        message={t('Are you sure you want to cancel your order?')}
        action={handleCancelOrder}
        confirmationModal={cancelModal}
        setConfirmationModal={setCancelModal}
      />
    </View>
  )
}

export default OrderReviewSection

const createLocalStyles = (NewStyles) => StyleSheet.create({
  noticeBox: {
    backgroundColor: themeColor1.bgColor(1),
    padding: 10,
    ...NewStyles.border10,
    marginBottom: 12,
    width: '100%',
  },
  itemWrapper: {
    backgroundColor: themeColor5.bgColor(1),
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  lockedBox: {
    backgroundColor: themeColor4.bgColor(1),
    padding: 20,
    marginTop: 15,
    width: '100%',
    gap: 10,
  },
})
