import { OrderTextInput as TextInput } from '../../components/OrderReadOnlyControls';
import { StyleSheet, Text, View, } from 'react-native'
import React, { useState, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { createStyles } from '@styles/NewStyles';
import { uri } from '@services/URL' 
import { formatPrice, handleError, showToastOrAlert } from '@helpers/Common'
import { themeColor0, themeColor4, themeColor5, themeColor6, themeColor7 } from '@theme/Color'
import Button from '@components/Button'
import ConfirmationModal from '@components/ConfirmationModal'
import { useNavigation } from '@react-navigation/native'
import { fetchOrders } from '@slices/orderSlice'
import { fetchUser } from '@slices/userSlice'
import * as Linking from "expo-linking";

const OrderLoopSendSection = ({ data, orderId, onUpdate }) => {

    const dispatch = useDispatch()
    const navigation = useNavigation()
    const [loadingWallet, setLoadingWallet] = useState(false);
    const [loadingGateway, setLoadingGateway] = useState(false);
    const paymentSubscriptionRef = useRef(null);

    const user = useSelector((state) => state?.user?.data);
    const { t, i18n } = useTranslation();
    const NewStyles = useMemo(
        () => createStyles(i18n.language),
        [i18n.language]
    );
    const styles = useMemo(() => createLocalStyles(NewStyles), [NewStyles]);
    const lang = i18n.resolvedLanguage ?? i18n.language ?? 'en';
    const token = useSelector((state) => state?.auth?.token)
    const [userDescription, setUserDescription] = useState('')
    const [accepting, setAccepting] = useState(false)
    const [rejecting, setRejecting] = useState(false)
    const [acceptModal, setAcceptModal] = useState(false)
    const [rejectModal, setRejectModal] = useState(false)

    // چک کردن قفل بودن (تایید یا رد شده)
    const isLocked = data?.user_accept_date || data?.status == 3

    // تشخیص نوع تصمیم
    const isAccepted = data?.user_accept_date
    const isRejected = data?.status == 3

    // چک کردن پر بودن اطلاعات مورد نیاز
    const isInfoComplete = data?.duration && data?.loop_cost_estimate

    const handleAccept = async () => {
        setAcceptModal(false)
        setAccepting(true)
        try {
            const response = await axios.post(
                `${uri}/orders/${orderId}/decision`,
                {
                    decision: 'ok',
                    reason: userDescription || undefined
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept-Language': lang
                    }
                }
            )

            if (response.status == 200 && response.data?.success) {
                showToastOrAlert(response.data?.message || t('Order confirmed successfully'))
                if (onUpdate) onUpdate()
            }
        } catch (error) {
            const message = error?.response?.data?.message || t('Error confirming order')
            showToastOrAlert(message)
        } finally {
            setAccepting(false)
        }
    }

    const handleReject = async () => {
        setRejectModal(false)
        setRejecting(true)
        try {
            const response = await axios.post(
                `${uri}/orders/${orderId}/decision`,
                {
                    decision: 'no',
                    reason: userDescription || undefined
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept-Language': lang
                    }
                }
            )

            if (response.status == 200 && response.data?.success) {
                showToastOrAlert(response.data?.message || t('Order canceled successfully'))
                if (onUpdate) onUpdate()
            }
        } catch (error) {
            const message = error?.response?.data?.message || t('Error rejecting order')
            showToastOrAlert(message)
        } finally {
            setRejecting(false)
        }
    }

    const renderRow = (text1, text2, textStyle1, textStyle2) => (
        <View style={NewStyles.rowWrapper}>
            <Text style={[NewStyles.text, textStyle1]}>{text1}</Text>
            <Text style={[NewStyles.text10, textStyle2]}>{text2}</Text>
        </View>
    )

    const walletPayment = async () => {
        setLoadingWallet(true);
        try {
            const response = await axios.post(
                `${uri}/wallet/pay-order`,
                { orderId: orderId },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept-Language': lang
                    }
                }
            );

            if (response.status == 200 || response.status == 201) {
                showToastOrAlert(response?.data?.message || t("Payment completed successfully"));
                dispatch(fetchOrders(token));
                dispatch(fetchUser(token));
                handleAccept()
            }
        } catch (error) {
            console.log(error);
            
            handleError(error, t)
        } finally {
            setLoadingWallet(false);
        }
    };

    const redirectUrl = Linking.createURL("/?");

    const _addLinkingListener = () => {
        // Remove existing listener if any
        if (paymentSubscriptionRef.current) {
            paymentSubscriptionRef.current.remove();
        }

        paymentSubscriptionRef.current = Linking.addEventListener("url", ({ url }) => {
            const { queryParams } = Linking.parse(url);
            if (queryParams?.status == 'OK') {
                dispatch(fetchOrders(token));
                dispatch(fetchUser(token));
                showToastOrAlert(t("Payment completed successfully"));
                if (onUpdate) onUpdate()
                // Cleanup listener after handling
                if (paymentSubscriptionRef.current) {
                    paymentSubscriptionRef.current.remove();
                    paymentSubscriptionRef.current = null;
                }
            } else if (queryParams?.status == 'NOK') {
                showToastOrAlert(t("The payment encountered an error."));
                // Cleanup listener after handling
                if (paymentSubscriptionRef.current) {
                    paymentSubscriptionRef.current.remove();
                    paymentSubscriptionRef.current = null;
                }
            }
            setLoadingGateway(false);
        });
    };


    const gatewayPayment = async () => {
        setLoadingGateway(true);
        try {
            const response = await axios.post(
                `${uri}/orders/gateway-payment`,
                {
                    order_id: orderId,
                    linking_url: redirectUrl
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept-Language': lang
                    }
                }
            );

            if (response.status == 200 && response.data?.data?.payment_url) {
                _addLinkingListener();
                await Linking.openURL(response.data.data.payment_url);
            } else {
                showToastOrAlert(t("Error connecting to payment gateway"));
                setLoadingGateway(false);
            }
        } catch (error) {
            handleError(error, t)
        } finally {
            setLoadingGateway(false);
        }
    };


    return (
        <View style={[{ width: '90%', alignSelf: 'center', paddingBottom: 10 }, NewStyles.center]}>
            {/* توضیحات */}
            <View style={[styles.noticeBox, !isLocked && !isInfoComplete && { backgroundColor: themeColor5.bgColor(1) }]}>
                <Text style={[NewStyles.text10]}>
                    {isLocked
                        ? isAccepted
                            ? t('You have confirmed this request')
                            : t('You have rejected this request')
                        : isInfoComplete
                            ? t('Please review the information below and confirm or reject the dispatch request to Loop if you agree')
                            : t('Dear user, your product is being reviewed and diagnosed by Loop. Thank you for your patience.')}
                </Text>
            </View>

            {/* اطلاعات اعزام به لوپ */}
            {(data?.duration && data?.loop_cost_estimate) && <View style={[{ backgroundColor: themeColor4.bgColor(1), width: '100%', paddingVertical: 15, paddingHorizontal: '5%', gap: 10 }, NewStyles.border10]}>

                {/* مدت زمان تقریبی */}
                {data?.duration && (
                    <View style={{ gap: 5 }}>
                        <View style={[NewStyles.row, { gap: 5 }]}>
                            <Ionicons name="time-outline" size={20} color={themeColor0.bgColor(1)} />
                            <Text style={NewStyles.title}>{t('Approximate order completion time')}</Text>
                        </View>
                        <View style={[styles.itemWrapper, NewStyles.row, NewStyles.border10, { gap: 10 }]}>
                            <Ionicons name="ellipse" size={10} color={themeColor0.bgColor(0.5)} />
                            <Text style={[NewStyles.text10, { flex: 1 }]}>{data?.duration} {t('working days')}</Text>
                        </View>
                    </View>
                )}

                {/* هزینه تقریبی */}
                {data?.loop_cost_estimate && (
                    <View style={{ gap: 5 }}>
                        {user?.apple_check != 1 && <View style={[NewStyles.row, { gap: 5 }]}>
                            <Ionicons name="cash-outline" size={20} color={themeColor0.bgColor(1)} />
                            <Text style={NewStyles.title}>{t('Estimated cost announced by Loop')}</Text>
                        </View>}
                        <View style={[styles.itemWrapper, NewStyles.row, NewStyles.border10, { gap: 10 }]}>
                            <Ionicons name="ellipse" size={10} color={themeColor0.bgColor(0.5)} />
                            <Text style={[NewStyles.text10, { flex: 1 }]}>
                                {formatPrice(data?.loop_cost_estimate)} {t('Toman')}
                            </Text>
                        </View>
                    </View>
                )}
                {data?.prepayment && (
                    <View style={{ gap: 5 }}>
                        {user?.apple_check != 1 && <View style={[NewStyles.row, { gap: 5 }]}>
                            <Ionicons name={"documents-outline"} size={20} color={themeColor0.bgColor(1)} />
                            <Text style={NewStyles.title}>{t('Down payment amount')}</Text>
                        </View>}
                        <View style={[styles.itemWrapper, NewStyles.row, NewStyles.border10, { gap: 10 }]}>
                            <Ionicons name="ellipse" size={10} color={themeColor0.bgColor(0.5)} />
                            <Text style={[NewStyles.text10, { flex: 1 }]}>
                                {(formatPrice(((Number(data?.prepayment) * Number(data?.loop_cost_estimate)) / 100)))} {t('Toman')}
                            </Text>
                        </View>
                    </View>
                )}

                {/* توضیحات لوپ */}
                {data?.loop_description && (
                    <View style={{ gap: 5 }}>
                        <View style={[NewStyles.row, { gap: 5 }]}>
                            <Ionicons name="document-text-outline" size={20} color={themeColor0.bgColor(1)} />
                            <Text style={NewStyles.title}>{t('Loop description')}</Text>
                        </View>
                        <View style={[styles.itemWrapper, NewStyles.row, NewStyles.border10, { gap: 10 }]}>
                            <Ionicons name="ellipse" size={10} color={themeColor0.bgColor(0.5)} />
                            <Text style={[NewStyles.text10, { flex: 1 }]}>{data?.loop_description}</Text>
                        </View>
                    </View>
                )}
            </View>}

            {/* وضعیت تایید یا رد شده */}
            {isLocked ? (
                <View style={[styles.lockedBox, NewStyles.center, NewStyles.border10]}>
                    <Ionicons
                        name={isAccepted ? "checkmark-circle" : "close-circle"}
                        size={40}
                        color={isAccepted ? themeColor7.bgColor(1) : themeColor6.bgColor(1)}
                    />
                    <Text style={[NewStyles.title, {
                        color: isAccepted ? themeColor7.bgColor(1) : themeColor6.bgColor(1)
                    }]}>
                        {isAccepted ? t('Confirmed') : t('Rejected')}
                    </Text>
                    {data?.prepayment_payment_status == 1 && <Text style={[NewStyles.title, {
                        color: isAccepted ? themeColor7.bgColor(1) : themeColor6.bgColor(1)
                    }]}>
                        {t("Paid")}
                    </Text>}
                    {data?.user_cancellation_reason && (
                        <>
                            <Text style={[NewStyles.text10, { marginTop: 10 }]}>{isAccepted ? t('Your description:') : t('Your reason:')}</Text>
                            <Text style={[NewStyles.text10]}>{data?.user_cancellation_reason}</Text>
                        </>
                    )}
                </View>
            ) : isInfoComplete ? (
                <View style={{ width: '100%', marginTop: 15, gap: 10 }}>
                    {/* فیلد توضیحات کاربر */}
                    <View style={{ gap: 5 }}>
                        <Text style={NewStyles.text}>{t('Your description (optional)')}</Text>
                        <TextInput
                            style={[styles.textInput, NewStyles.border10]}
                            placeholder={t('Enter your description...')}
                            placeholderTextColor={themeColor0.bgColor(0.4)}
                            multiline
                            numberOfLines={4}
                            value={userDescription}
                            onChangeText={setUserDescription}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* دکمه‌های تایید و رد */}
                    <View style={[NewStyles.row, { gap: 10, maxWidth: 900, width: '100%', alignSelf: 'center' }]}>
                        <View style={[{ flex: 1 }, NewStyles.center]}>
                            <Button
                                title={t('Cancel Order')}
                                onPress={() => setRejectModal(true)}
                                loading={rejecting}
                                textStyle={{ fontSize: 12, color: themeColor4.bgColor(1) }}
                                style={{ backgroundColor: themeColor6.bgColor(1) }}
                            />
                        </View>
                        {!data?.prepayment && <View style={[{ flex: 1 }, NewStyles.center]}>
                            <Button
                                title={t('I accept')}
                                onPress={() => setAcceptModal(true)}
                                loading={accepting}
                                textStyle={{ fontSize: 12, color: themeColor4.bgColor(1) }}
                                style={{ backgroundColor: themeColor7.bgColor(1) }}
                            />
                        </View>}
                    </View>
                    {data?.prepayment &&
                        <>

                            <View style={[NewStyles.row, { gap: 10 }]}>
                                <View style={[{ flex: 1 }, NewStyles.center]}>
                                    <Button
                                        title={t("Deduct cost from wallet")}
                                        style={{ paddingHorizontal: 0, backgroundColor: themeColor7.bgColor(1) }}
                                        textStyle={{ fontSize: 12, color: themeColor4.bgColor(1) }}
                                        loading={loadingWallet}
                                        onPress={walletPayment}
                                    />
                                </View>
                                <View style={[{ flex: 1 }, NewStyles.center]}>
                                    <Button
                                        title={t("Charge wallet")}
                                        textStyle={{ fontSize: 12, color: themeColor4.bgColor(1) }}
                                        onPress={() => navigation.navigate('Increase')}
                                        style={{ backgroundColor: themeColor7.bgColor(1) }}
                                    />
                                </View>
                            </View>
                            <View style={[{ paddingBottom: 10 }, NewStyles.center]}>
                                {user?.apple_check != 1 &&
                                    <View style={[NewStyles.rowWrapper, { width: '100%' }]}>
                                        <Text style={NewStyles.text}>{t("Your wallet balance")}</Text>
                                        <Text style={NewStyles.text10}>{formatPrice(user?.wallet ?? 0)} {t("Tomans")}</Text>
                                    </View>
                                }

                                <Button
                                    title={t("Online payment")}
                                    style={{ paddingHorizontal: 0 }}
                                    textStyle={{ fontSize: 12, color: themeColor4.bgColor(1) }}
                                    loading={loadingGateway}
                                    onPress={gatewayPayment}
                                />
                            </View>

                        </>
                    }

                </View>
            ) : null}

            {/* Modal تایید */}
            <ConfirmationModal
                title={t('Confirm dispatch to Loop')}
                message={t('Do you accept the price and duration announced by Loop?')}
                action={handleAccept}
                confirmationModal={acceptModal}
                setConfirmationModal={setAcceptModal}
            />

            {/* Modal رد */}
            <ConfirmationModal
                title={t('Cancel Order')}
                message={t('Do you confirm the order cancellation and product return?')}
                action={handleReject}
                confirmationModal={rejectModal}
                setConfirmationModal={setRejectModal}
            />
        </View>
    )
}

export default OrderLoopSendSection

const createLocalStyles = (NewStyles) => StyleSheet.create({
    noticeBox: {
        backgroundColor: themeColor5.bgColor(1),
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
    textInput: {
        backgroundColor: themeColor4.bgColor(1),
        paddingHorizontal: 15,
        paddingVertical: 12,
        minHeight: 100,
        ...NewStyles.text10,
        color: themeColor0.bgColor(1), 
    },
})
