import useRealtimeRefresh from '../../hooks/useRealtimeRefresh';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios';
import * as Linking from "expo-linking";
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from '@expo/vector-icons/Ionicons';
import NewStyles from '@styles/NewStyles';
import { themeColor0, themeColor1, themeColor3, themeColor4, themeColor5, themeColor6, themeColor7, } from '@theme/Color';
import { formatDateTime, formatPrice, showToastOrAlert } from '@helpers/Common';
import Button from '@components/Button';
import { imageUri, mainUri, uri } from '@services/URL';
import { fetchUser } from '@slices/userSlice';
import { fetchOrders } from '@slices/orderSlice';
import { payOrderViaGateway, describeWalletError } from '@services/WalletApi';
import { fetchWalletBalance, payOrderWithWallet, seedBalance, selectWalletBalance } from '@slices/walletSlice';

import Loader from '@components/Loader';
import { useTranslation } from 'react-i18next';
import ScreenHeaders from '@components/ScreenHeaders';
import HintBadge from '@components/HintBadge';
import OrderRequestDetails from '@components/OrderRequestDetails';
import { createStyles } from '@styles/NewStyles';
import { useMenu } from '@contexts/MenuContext';
import { createPaymentRedirectUrl, openPaymentGateway } from '@utils/paymentGateway';
import { useHomeRoute } from '@navigation/homeRoute';
function Invoice({ route, navigation }) {
    // «خانه» برای مشتری «انتخاب سیستماتیک» و برای سازمان List است (navigation/homeRoute.js).
    const homeRoute = useHomeRoute();
  useRealtimeRefresh(["orders", "wallet"], async () => { if (orderId && token) { await fetchData(); await fetchExtraServices(); } });

    const dispatch = useDispatch()
    const { t, i18n } = useTranslation();
    // فضای رزرو شده زیر محتوا تا دکمه‌های پرداخت زیر داک شناور پنهان نشوند
    const { footerSpace } = useMenu();
    const NewStyles = useMemo(
        () => createStyles(i18n.language),
        [i18n.language]
    );
    //    const styles = useMemo(()=> createLocalStyles(NewStyles), [NewStyles]);
    const orderId = route?.params?.orderId;
    const token = useSelector((state) => state?.auth?.token)
    const user = useSelector((state) => state?.user?.data)
    // موجودی از walletSlice می‌آید و بعد از هر پرداخت تازه می‌شود.
    const walletBalance = useSelector(selectWalletBalance)
    const [refreshing, setRefreshing] = useState(true)
    const [loading1, setLoading1] = useState(false)
    const [loading2, setLoading2] = useState(false)
    const [extraServices, setExtraServices] = useState([])
    const [data, setData] = useState([]);
    const [loadingGateway, setLoadingGateway] = useState(false);
    const paymentSessionRef = useRef(null);
    const lang = i18n.resolvedLanguage ?? i18n.language ?? 'en';
    const fetchData = async () => {
        try {
            const response = await axios.post(`${uri}/orders/detail`, { orderId }, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept-Language': lang } })
            if (response.status == 200) {
                setData(response?.data)
            }
        } catch (error) {
            const message = error?.response ? (error?.response?.status ? error?.response?.data?.message : t('An unexpected error occurred!')) : t('Network error!');
            showToastOrAlert(message);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchExtraServices = async () => {
        try {
            const response = await axios.post(
                `${uri}/orders/extra-services`,
                { order_id: orderId },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept-Language': lang
                    }
                }
            )

            if (response.status == 200 && response.data?.success) {
                setExtraServices(response.data?.data?.extra_services || [])
            }
        } catch (error) {
            setExtraServices([])
        }
    }

    // بستن نشستِ پرداخت هنگام unmount تا شنونده‌ی لینک باقی نماند.
    useEffect(() => {
        return () => {
            paymentSessionRef.current?.close();
            paymentSessionRef.current = null;
        };
    }, []);

    useEffect(() => {
        fetchData();
        fetchExtraServices();
        dispatch(fetchUser(token))
        // موجودی پروفایل فقط مقدار اولیه است؛ عدد معتبر از /wallet/balance می‌آید.
        dispatch(seedBalance(user?.wallet))
        if (token) dispatch(fetchWalletBalance(token))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshing]);

    const totalDiscountedPrice = useMemo(() => {
        const basePrice = Number(data?.technician_price ?? data?.pakar_price);


        return Number(basePrice) + Number(data?.extra_price) - Number(data?.discount_price);

    }, [data]);

    const totalPrice = useMemo(() => {
        const basePrice = Number(data?.technician_price ?? data?.pakar_price);
        return Number(basePrice) + Number(data?.extra_price);
    }, [data]);

    const renderRow = (text1, text2, textStyle1, textStyle2) => (
        <View style={NewStyles.rowWrapper}>
            <Text style={[NewStyles.text, textStyle1]}>{text1}</Text>
            <Text style={[NewStyles.text10, textStyle2]}>{text2}</Text>
        </View>
    );

    const walletPayment = async () => {
        setLoading1(true);

        // قبلاً فقط 201 موفق شمرده می‌شد و هر پاسخ دیگری بی‌صدا رد می‌شد —
        // کاربر نه پیام موفقیت می‌دید و نه پیام خطا. حالا هر دو شاخه پیام دارند.
        const action = await dispatch(payOrderWithWallet({ token, orderId }));
        setLoading1(false);

        if (payOrderWithWallet.fulfilled.match(action)) {
            showToastOrAlert(t('Payment completed successfully'));
            dispatch(fetchOrders(token));
            dispatch(fetchUser(token));
            setRefreshing(true);
            return;
        }

        showToastOrAlert(describeWalletError(action.payload, t));
    };

    const redirectUrl = createPaymentRedirectUrl();

    // بازگشت از درگاه. `null` یعنی کاربر بدون نتیجه برگشت.
    const handlePaymentResult = (status) => {
        if (status === 'OK') {
            dispatch(fetchOrders(token));
            dispatch(fetchUser(token));
            dispatch(fetchWalletBalance(token));
            setRefreshing(true);
            showToastOrAlert(t('Payment completed successfully'));
        } else if (status === 'NOK') {
            showToastOrAlert(t('Payment failed.'));
        }
        setLoadingGateway(false);
    };

    const gatewayPayment = async () => {
        setLoadingGateway(true);

        const result = await payOrderViaGateway(token, { orderId, linkingUrl: redirectUrl });
        const paymentUrl = result.data?.payment_url;

        if (!result.ok || !paymentUrl) {
            showToastOrAlert(result.message || t('Error connecting to payment gateway'));
            setLoadingGateway(false);
            return;
        }

        // مرورگر درون‌برنامه‌ای: اپ زنده می‌ماند و بعد از پرداخت همین صفحه
        // ادامه پیدا می‌کند، به‌جای اینکه برنامه از اسپلش دوباره شروع شود.
        paymentSessionRef.current = openPaymentGateway({
            paymentUrl,
            redirectUrl,
            onResult: handlePaymentResult,
        });

        if (!(await paymentSessionRef.current.opened)) {
            showToastOrAlert(t('Error connecting to payment gateway'));
            setLoadingGateway(false);
        }
    };
    const minPrice = useSelector(state => state.minPrice?.data)
    if (data.length <= 0) { return <Loader /> };

    return (
        <View style={NewStyles.container}>
            <ScreenHeaders title={t('Order Invoice')} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 10, paddingBottom: 100 }} refreshControl={<RefreshControl colors={[themeColor0.bgColor(1)]} progressBackgroundColor={themeColor5.bgColor(1)} refreshing={refreshing} onRefresh={() => setRefreshing(true)} />}>
                <View style={{ backgroundColor: themeColor4.bgColor(1), ...NewStyles.border10, paddingBottom: 10 }}>
                    <View style={[NewStyles.seperator, { gap: 10, padding: '5%', borderBottomWidth: 0 }]}>
                        <View style={[{ width: '100%', padding: '5%', }, NewStyles.border10, NewStyles.center]}>
                            <View style={[NewStyles.row, { gap: 5 }]}>
                                <Image
                                    source={{ uri: `${imageUri}/userfolder/reciept.png` }}
                                    style={{ height: 40, width: 40, }}
                                />
                                <Text style={NewStyles.title}>{t('Order Invoice')}: {data?.id}</Text>
                            </View>
                            <Text style={NewStyles.text3}>{data?.category?.title}</Text>
                        </View>

                        {renderRow(t('Order registration time'), formatDateTime(data?.created_at))}
                        <View style={NewStyles.rowWrapper}>
                            <Text style={[NewStyles.text]}>{t('Payment status')}</Text>
                            <View style={[{ backgroundColor: data?.payment_status > 0 ? themeColor7.bgColor(1) : themeColor6.bgColor(1), paddingHorizontal: 5, paddingVertical: 1 }, NewStyles.border10]}>
                                <Text style={NewStyles.text4}>{data?.payment_status > 0 ? t('Paid') : t('Unpaid')}</Text>
                            </View>
                        </View>

                        {renderRow((Number(data?.is_fixed) == 1) ? t('Loop Fixed Amount') : t('Estimated cost by Loop'), data?.pakar_price > 0 ? `${formatPrice(data?.pakar_price)}` + ' ' + t('Toman') : t('Needs review'))}
                        {(data?.technician_price > 0 && Number(data?.is_fixed) == 0) && renderRow(t('Initial Calculated Cost'), data?.technician_price ? `${formatPrice(data?.technician_price)}` + ' ' + t('Toman') : '0 ' + t('Toman'))}
                        {(data?.extra_price > 0) && renderRow(t('Extra parts cost'), data?.extra_price ? `${formatPrice(data?.extra_price)}` + ' ' + t('Toman') : '0 ' + t('Toman'))}
                        {(data?.discount_price > 0) && renderRow(t('Your discount amount'), data?.discount_price ? `${formatPrice(data?.discount_price)}` + ' ' + t('Toman') : '0 ' + t('Toman'))}
                        {(totalPrice > totalDiscountedPrice > 0) && renderRow(t('Final amount without discount'), `${formatPrice(totalPrice)}` + ' ' + t('Toman'), NewStyles.text, [NewStyles.text10, { textDecorationLine: 'line-through' }])}
                        {(data?.status > 0 && data?.technician_price) && renderRow(t('Payable amount'), formatPrice(totalDiscountedPrice > minPrice?.price ? totalDiscountedPrice : (totalDiscountedPrice + 200000)) + ' ' + t('Toman'))}
                        {
                            ((data?.status > 0 && data?.technician_price && totalDiscountedPrice < minPrice?.price) || (data?.status == 4 && data?.technician_cancel_reason != 'اعلام حضور / لغو از سوی تکنسین') || (data?.status == 3 && data?.arrived_at)) &&
                            renderRow(t('Travel and tuition fees'), formatPrice('200000') + ' ' + t('Toman'))
                        }
                        {renderRow(`${t('Your wallet balance')}:`, formatPrice(walletBalance) + ' ' + t('Toman'))}
                        <OrderRequestDetails order={data} titleStyle={NewStyles.title} textStyle={NewStyles.text10} />

                        {/* Extra Services Display */}
                        {extraServices.length > 0 && (
                            <>
                                <View style={{ borderTopWidth: 1, borderTopColor: themeColor5.bgColor(1), marginVertical: 15, paddingTop: 15 }}>
                                    <View style={[NewStyles.row, { gap: 5, marginBottom: 10 }]}>
                                        <Ionicons name="cash-outline" size={20} color={themeColor0.bgColor(1)} />
                                        <Text style={NewStyles.title}>{t('Extra Costs')}</Text>
                                    </View>
                                    {extraServices.map((item, index) => (
                                        <View key={index} style={{ marginBottom: 8 }}>
                                            <View style={NewStyles.rowWrapper}>
                                                <View style={[NewStyles.row, { gap: 5, flex: 1 }]}>
                                                    <Ionicons name="ellipse" size={8} color={themeColor0.bgColor(0.5)} />
                                                    <Text style={[NewStyles.text10, { flex: 1 }]}>{item?.title ?? item?.extra_service?.title}</Text>
                                                </View>
                                                <Text style={[NewStyles.text10]}>
                                                    {formatPrice(item?.price)} {t('Toman')}
                                                </Text>
                                            </View>
                                            {item?.extra_service?.des && (
                                                <Text style={[NewStyles.text10, { color: themeColor0.bgColor(0.5), fontSize: 12, paddingRight: 15 }]}>
                                                    {item?.extra_service?.des}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                    <View style={{ borderTopWidth: 1, borderTopColor: themeColor5.bgColor(1), marginTop: 10, paddingTop: 10 }}>
                                        {renderRow(t('Total Extra Costs:'), `${formatPrice(extraServices.reduce((sum, item) => sum + Number(item?.price || 0), 0))} ${t('Toman')}`, NewStyles.title, NewStyles.title)}
                                    </View>
                                </View>
                            </>
                        )}

                    </View>
                    <View style={{ width: '90%', alignSelf: 'center', marginVertical: 10, alignItems: 'flex-end' }}>
                        <HintBadge
                            hint={t("Dear Loop, the total receipt is more than {{price}} tomans, you are a guest of Loop (travel and examination expenses are covered)", { price: formatPrice(minPrice?.price) })}
                            title={t('Invoice')}
                        />
                    </View>
                    <Text style={NewStyles.title7}>{t('Thank you for your trust:')}</Text>
                    <Text style={NewStyles.title7}>{t('With Loop, we are with you forever.')}</Text>
                    <View style={{ paddingHorizontal: '5%', alignItems: 'center' }}>
                        <TouchableOpacity style={{ padding: 10 }} onPress={() => {
                            navigation.navigate(homeRoute)
                        }}>
                            <Text style={NewStyles.title}> {t("Reorder")} </Text>
                        </TouchableOpacity>
                        <Button title={t('Save Invoice')} style={{ backgroundColor: themeColor7.bgColor(1) }} textStyle={{ color: themeColor4.bgColor(1) }} onPress={() => { Linking.openURL(`${mainUri}/reciept/${orderId}`) }} />
                    </View>

                </View>
            </ScrollView>

            {(data?.started_at || ((data?.status == 4 && data?.technician_cancel_reason != 'اعلام حضور / لغو از سوی تکنسین') || (data?.status == 3 && data?.arrived_at))) && <View style={[NewStyles.row, NewStyles.nav, { backgroundColor: themeColor4.bgColor(0), gap: 10, maxWidth: 900, width: '100%', alignSelf: 'center', marginBottom: footerSpace }]}>
                {data?.payment_status > 0 ?
                    <View style={[{ flex: 1 }, NewStyles.center]}>

                        <Button title={t('Paid')} backgroundColor={themeColor7.bgColor(1)} />
                    </View>
                    :
                    <>
                        <View style={[{ flex: 1 }, NewStyles.center]}>
                            <Button title={t('Wallet payment')} textStyle={[{ fontSize: 14, color: themeColor4.bgColor(1) },]} style={{ paddingHorizontal: 0, backgroundColor: themeColor7.bgColor(1) }} loading={loading1} onPress={() => walletPayment()} />
                        </View>
                        <View style={[{ flex: 1 }, NewStyles.center]}>
                            <Button title={t('Gateway payment')} textStyle={[{ fontSize: 14, color: themeColor4.bgColor(1) },]} style={{ paddingHorizontal: 0 }} loading={loadingGateway} onPress={() => gatewayPayment()} />
                        </View>
                    </>
                }
            </View>}

        </View>
    )
}

// محافظت از صفحه فاکتور سفارش - نیاز به تایید کامل
export default Invoice;
