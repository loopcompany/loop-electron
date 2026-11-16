import { View, Text, Pressable, TextInput, StyleSheet, ScrollView, ActivityIndicator, I18nManager, Image, SectionList, FlatList, Platform } from 'react-native';
import React, { useState, useMemo, useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStyles } from '@styles/NewStyles';
import { themeColor0, themeColor1, themeColor10, themeColor3, themeColor4, themeColor5, themeColor6, themeColor7, themeColor8 } from '@theme/Color';
import { formatDate, formatPrice, langIsRTL, showToastOrAlert } from '@helpers/Common';
import { describeApiError } from '@utils/apiErrorHandler';
import { emptySteps, selectTotalPrice } from '@slices/stepSlice';
import Button from '@components/Button';
import { imageUri, uri } from '@services/URL';
import { API_ENDPOINTS } from '@services/ApiEndpoints';
import { fetchOrders } from '@slices/orderSlice';
import { useDispatch, useSelector } from 'react-redux';
import { emptyCategory } from '@slices/categorySlice';
import ProgressBar from '@components/ProgressBar';
import { emptyAddress } from '@slices/addressSlice';
import Loader from '@components/Loader';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeaders from '@components/ScreenHeaders';
import HintBadge from '@components/HintBadge';
import { LinearGradient } from 'expo-linear-gradient';
import { useMenu } from '@contexts/MenuContext';
function Preview({ navigation }) {
    const dispatch = useDispatch();
    // فضای رزرو شده زیر محتوا تا دکمه ثبت نهایی زیر داک شناور پنهان نشود
    const { footerSpace } = useMenu();
    // const token = useSelector((state) => state?.auth?.token)
    const user = useSelector((state) => state?.user?.data)
    const { t, i18n } = useTranslation();
    const lang = i18n.resolvedLanguage ?? i18n.language ?? 'en';
    const NewStyles = useMemo(
        () => createStyles(i18n.language),
        [i18n.language]
    );
    const styles = useMemo(() => createLocalStyles(NewStyles), [NewStyles]);
    const [loading, setLoading] = useState(false);
    const submitting = useRef(false);
    const [pending, setPending] = useState(false);
    const userType = useSelector(state => state.auth?.userType)
    const token = useSelector((state) => state?.auth?.token);

    const calculatedPrice = useSelector(selectTotalPrice);
    const totalPrice = calculatedPrice?.total
    const showPrice = calculatedPrice?.showPrice
    const category = useSelector(state => state.category?.data);
    const steps = useSelector(state => state.step);

    const isUrgent = steps?.isUrgent;
    const date = steps?.date;
    const time = steps?.time;
    const des = steps?.des;
    const imagePath = steps?.imagePath;
    const files = steps?.files;
    const addressId = steps?.addressId;

    const femaleCount = steps?.femaleCount;
    const maleCount = steps?.maleCount;
    const unspecifiedCount = steps?.unspecifiedCount;

    const [discountCode, setDiscountCode] = useState(null);
    const [discountPercent, setDiscountPercent] = useState(null);

    const address = useSelector(state => state.address?.data)?.find(item => item?.id == addressId);
    
    const isFixed = (Number(category?.is_fixed) > 0 && totalPrice > 0) ? 1 : 0;
    console.log(showPrice);

    /**
     * تبدیل ساختار service_schedule از Redux به فرمت API
     * فقط برای کاربران سازمانی که مرحله service_schedule دارند
     */
    const buildServiceSchedulePayload = () => {

        // پیدا کردن مرحله service_schedule
        const serviceScheduleStep = steps?.data?.find(stepArray =>
            stepArray?.some(item => item?.type === 'service_schedule')
        );
        if (!serviceScheduleStep) {
            return null;
        }

        const serviceScheduleItem = serviceScheduleStep.find(item => item?.type === 'service_schedule');

        if (!serviceScheduleItem?.field_details) {
            return null;
        }


        // پیدا کردن فیلد main_selection
        const mainField = serviceScheduleItem.field_details.find(f => f.id === 'main_selection');
        const selectedOption = mainField?.options?.find(opt => opt.value > 0);

        if (!selectedOption) {
            return null;
        }

        const type = selectedOption.id; // 'long_term' or 'short_term' 

        // پیدا کردن فیلدهای مربوط به نوع انتخاب شده
        const conditionalFields = serviceScheduleItem.field_details.filter(
            f => f.conditional_on === type
        );


        const payload = { type };
        const branchData = {};
        const missingFields = [];

        conditionalFields.forEach(field => {

            if (field.type === 'radioButton' && field.options) {

                const selectedOpt = field.options.find(opt => opt.value > 0);

                if (selectedOpt) {

                    // duration
                    if (field.id.includes('duration')) {
                        branchData.duration = selectedOpt.id;
                    }

                    // time
                    else if (field.id.includes('time')) {
                        branchData.time = selectedOpt.title;
                    }

                } else {
                    missingFields.push(field.title || field.id);
                }
            }

            else if (field.type === 'date') {

                if (field.value) {
                    branchData.date = field.value;
                } else {
                    missingFields.push('تاریخ');
                }

            }

            else if (field.type === 'file') {

                if (field.value) {
                    branchData.file = field.value;
                }

            }

        });

        if (type === 'long_term') {
            payload.long_term = branchData;
        } else if (type === 'short_term') {
            payload.short_term = branchData;
        }

        return payload;
    };

    const submitOrder = async () => {
        if (submitting.current) return;
        submitting.current = true;
        setLoading(true);
        try {

            // دریافت account_type کاربر

            const accountType = userType;
            // بررسی وجود مرحله service_schedule در steps
            const hasServiceScheduleStep = steps?.data?.some(stepArray =>
                stepArray?.some(item => item?.type === 'service_schedule')
            );

            // ساخت payload اصلی
            const payload = {
                address_id: addressId,
                category_id: category?.id,
                total_price: totalPrice,
                date: date,
                time: time,
                is_urgent: isUrgent,
                is_fixed: isFixed,
                female_count: femaleCount,
                male_count: maleCount,
                unspecified_count: unspecifiedCount,
                steps: steps?.data,
                file_paths: files,
                platform: Platform.OS
            };

            // اضافه کردن فیلدهای اختیاری
            if (des) payload.description = des;
            if (imagePath) payload.image_path = imagePath;
            if (files?.length > 0) payload.file_paths = files;
            if (discountCode) payload.discount_code = discountCode;
            // اضافه کردن service_schedule فقط اگر:
            // 1. کاربر سازمانی باشد
            // 2. مرحله service_schedule در steps موجود باشد
            if ((accountType === 'organization' || accountType === 'company' || accountType === 'g_organization' || accountType === 's_g_organization') && hasServiceScheduleStep) {
                const serviceSchedule = buildServiceSchedulePayload();

                if (serviceSchedule) {
                    payload.service_schedule = serviceSchedule;
                } else {
                    showToastOrAlert('لطفاً فیلدهای زمان نگهداری و سرویس را تکمیل کنید.');
                    setLoading(false);
                    return;
                }
            } else if (accountType === 'individual') {

            } else {
            }

            // Route صحیح: POST /api/orders/ (با / در انتها) — services/ApiEndpoints.js
            const response = await axios.post(`${uri}${API_ENDPOINTS.ORDERS.CREATE}`, payload, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // 📥 لاگ کردن پاسخ کامل از API 

            if (response.data?.success && response.data.data?.order_id) {
                showToastOrAlert(response?.data?.message);
                dispatch(fetchOrders(token));
                dispatch(emptySteps());
                dispatch(emptyCategory());
                dispatch(emptyAddress());
                navigation.reset({ index: 0, routes: [{ name: 'OrdersScreen' }] });
            }
        } catch (error) {
            const message = describeApiError(error, t);
            showToastOrAlert(message);
        } finally {
            submitting.current = false;
            setLoading(false);
        }
    };

    const checkDiscount = async () => {
        if (!discountCode?.trim()) {
            showToastOrAlert(t("Please enter a discount code!"));
            return
        }
        setPending(true);
        try {
            const response = await axios.post(`${uri}/discounts/check`, { categoryId: category?.id, discountCode }, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept-Language': lang } })
            if (response?.status == 200) {
                setDiscountPercent(response?.data?.discount_code_percent)
                showToastOrAlert(response?.data?.message)
            }
        } catch (error) {
            const message = describeApiError(error, t);
            showToastOrAlert(message);
        } finally {
            setPending(false);
        }
    };
    const organTime = buildServiceSchedulePayload();
    const renderRow = (text1, text2, textStyle1, textStyle2) => (
        <View style={NewStyles.rowWrapper}>
            <Text style={[NewStyles.text, textStyle1]}>{text1}</Text>
            <Text style={[NewStyles.text10, textStyle2]}>{text2}</Text>
        </View>
    );
    const serviceDate =
        organTime?.short_term?.date ||
        organTime?.long_term?.date;

    const serviceTime =
        organTime?.short_term?.time ||
        organTime?.long_term?.time;
    const minPrice = useSelector(state => state.minPrice?.data)
    if (loading) { return (<Loader />) };

    return (
        <SafeAreaView edges={{ top: 'off', bottom: 'additive' }} style={NewStyles.container}>
            <ScreenHeaders
                title={t("Preview")}
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20, backgroundColor: themeColor4.bgColor(1), width: '95%', alignSelf: 'center', borderRadius: 20, maxWidth: 800, marginTop: 20 }}>
                <View style={[NewStyles.seperator, { gap: 10, paddingTop: '5%' }]}>
                    <View style={[]}>
                        {user?.apple_check == 0 &&
                            <View
                                style={[NewStyles.center, {
                                    backgroundColor: themeColor0.bgColor(1),
                                    paddingVertical: 10,
                                    ...NewStyles.border10
                                }]}

                            >
                                <View style={[NewStyles.row, { gap: 10 }]}>
                                    <Image
                                        source={require('@assets/images/price.png')}
                                        style={{ height: 60, width: 60, resizeMode: 'contain' }}
                                    />
                                    <Text style={NewStyles.title4}> {isFixed == 1 ? t('Loop Fixed Amount') : t('Loop Base Amount')} </Text>
                                </View>
                            </View>
                        }
                        <Pressable style={[NewStyles.shadow, NewStyles.border100, NewStyles.whiteButton, NewStyles.row, { gap: 5 , alignSelf:'center'}]} >
                            <Ionicons name="cash-outline" size={24} color={themeColor0.bgColor(1)} />
                            <Text style={NewStyles.text}>{(totalPrice > 0 && showPrice) ? `${formatPrice(totalPrice)}${t(' Toman')}` : t('Needs Review')}</Text>
                        </Pressable>
                    </View>

                    <LinearGradient colors={[themeColor4.bgColor(1), themeColor3.bgColor(1)]} style={[{ alignSelf: 'center', backgroundColor: themeColor3.bgColor(1), paddingHorizontal: 40, paddingVertical: 10, borderWidth: 1, borderColor: themeColor4.bgColor(1), gap: 5, maxWidth: '100%' }, NewStyles.border10, NewStyles.row]}>
                        <Ionicons
                            name={'help-circle-outline'}
                            size={20}
                            color={themeColor10.bgColor(1)}
                        />
                        <Text style={[NewStyles.text10, { textAlign: 'center', fontSize: 11 }]}>{t('Dear user, your order information will be finalized after review by Loop technicians and specialized evaluations.')}</Text>
                    </LinearGradient>
                </View>
                {user?.apple_check == 0 && <View style={[NewStyles.seperator, { gap: 10, paddingTop: '5%' }]}>

                    <View
                        style={[NewStyles.center, {
                            backgroundColor: themeColor0.bgColor(1),
                            paddingVertical: 10,
                            ...NewStyles.border10
                        }]}

                    >
                        <View style={[NewStyles.row, { gap: 10 }]}>
                            <Image
                                source={require('@assets/images/discount.png')}
                                style={{ height: 60, width: 60, resizeMode: 'contain' }}
                            />
                            <Text style={NewStyles.title4}> {t('Discount Code')} </Text>
                        </View>
                    </View>

                    {/* <LinearGradient colors={[themeColor4.bgColor(1), themeColor3.bgColor(1)]} style={[{ alignSelf: 'center', backgroundColor: themeColor3.bgColor(1), paddingHorizontal: 40, paddingVertical: 10, borderWidth: 1, borderColor: themeColor4.bgColor(1), gap: 5, maxWidth: '100%' }, NewStyles.border10, NewStyles.row]}>
                        <Ionicons
                            name={'help-circle-outline'}
                            size={20}
                            color={themeColor10.bgColor(1)}
                        />
                        <Text style={[NewStyles.text10, { textAlign: 'center', fontSize:11 }]}>{t("Dear user, to receive a discount code, you can visit the promotions section and participate in Loop's lucky wheel every week!")}</Text>
                    </LinearGradient> */}
                    <View style={[{ backgroundColor: themeColor3.bgColor(0.2), }, NewStyles.row, NewStyles.border10]}>
                        <View
                            style={[
                                {
                                    gap: 5, flex: 2, minHeight: 50,
                                    paddingHorizontal: '5%',
                                },
                                NewStyles.row
                            ]}
                        >
                            <Ionicons name={'ticket-outline'} size={20} color={themeColor0.bgColor(1)} />
                            <TextInput style={[styles.textInput, NewStyles.text10, { flex: 1, textAlign: langIsRTL(lang) ? 'right' : 'left', writingDirection: langIsRTL(lang) ? 'rtl' : 'ltr' }]} keyboardType='default' placeholder={t('Enter your discount code.')} placeholderTextColor={themeColor3.bgColor(1)} value={discountCode} onChangeText={(text) => { setDiscountCode(text) }} />
                        </View>
                        <Pressable
                            style={[
                                { gap: 5, flex: 1, backgroundColor: themeColor0.bgColor(1), height: 50 },
                                NewStyles.border10,
                                NewStyles.center
                            ]}
                            onPress={() => checkDiscount()}>
                            {!pending && <Text style={[NewStyles.text4, { fontSize: 12 }]}>{t('Check Code')}</Text>}
                            {pending && <ActivityIndicator color={themeColor4.bgColor(1)} size='small' />}
                        </Pressable>
                    </View>
                </View>}
                <View style={[NewStyles.seperator, { gap: 10, padding: '5%' }]}>
                    <View style={[{ width: '100%', padding: '5%', backgroundColor: themeColor3.bgColor(0.2) }, NewStyles.border10, NewStyles.center]}>
                        <View style={[NewStyles.row, { gap: 5 }]}>
                            <Text style={NewStyles.title}>{t('Order Preview')}</Text>
                            <Ionicons name="newspaper-outline" size={24} color={themeColor0.bgColor(1)} />
                        </View>
                        <Text style={NewStyles.text3}>{category?.title}</Text>
                    </View>
                    {renderRow(t('Technician Visit Time'), isUrgent > 0
                        ? t('Urgent Request')
                        : formatDate(serviceDate || date) +
                        t(' at ') +
                        (serviceTime || time), NewStyles.text, isUrgent > 0 && NewStyles.title6)}
                    {maleCount + femaleCount + unspecifiedCount > 0 &&
                        renderRow(
                            t('Technician Gender'),
                            (() => {
                                const total = maleCount + femaleCount + unspecifiedCount;
                                if (total === 0) return t('Not Specified');
                                let details = [];
                                if (maleCount > 0) details.push(t('Male Technician'));
                                if (femaleCount > 0) details.push(t('Female Technician'));

                                return (details.length > 0 ? ` ${details.join(' ')}` : '');
                            })()
                        )
                    }

                    {renderRow(t('Address'), '')}
                    {renderRow(address?.full_name + ' - ' + address?.city + ' - ' + t("Region") + ' ' + address?.region + ' - ' + t("Number") + ' ' + address?.number + ' - ' + t("Unit") + ' ' + address?.unit + ' - ' + t("Floor") + ' ' + address?.floor + ' - ' + address?.address, '', NewStyles.text10)}
                    {discountPercent && renderRow(t('Your Final Discount Percentage'), discountPercent + t(' percent'), NewStyles.text10)}
                </View>

                {steps?.data?.map((previewItem, index) => (
                    <View key={`section_${index}`}>
                        {
                            Platform.OS != 'web' ?

                                <FlatList
                                    style={{ paddingTop: 5 }}
                                    showsVerticalScrollIndicator={false} scrollEnabled={false}
                                    data={previewItem?.filter(x => (x?.type == 'checkbox' || x?.type == 'radioButton' || x?.type == 'counter' || x?.type == 'input'))}
                                    keyExtractor={(item) => item?.id?.toString()}
                                    renderItem={({ item }) => {
                                        const is_package = item?.is_package
                                        return (
                                            <View>
                                                <View style={[NewStyles.row, { gap: 5, paddingHorizontal: '5%' }]}>
                                                    <Text style={[NewStyles.title, { flex: 1 }]}>{item?.title}</Text>
                                                </View>
                                                <FlatList
                                                    style={{ paddingHorizontal: '5%', padding: 20 }}
                                                    scrollEnabled={false}
                                                    showsVerticalScrollIndicator={false}
                                                    data={item?.field_details}
                                                    keyExtractor={(item) => item?.id?.toString()}
                                                    renderItem={({ item }) => {
                                                        if (!item?.value || item?.value <= 0) return null;
                                                        else
                                                            return (
                                                                (item?.value || item?.value > 0) ?
                                                                    <View style={[styles.itemWrapper, NewStyles.border10, is_package == 1 && styles.package]}>
                                                                        <View style={[is_package != 1 && NewStyles.rowWrapper]}>
                                                                            <View style={[NewStyles.rowWrapper, { justifyContent: 'flex-end', flex: 2, gap: 5 }, is_package == 1 && { alignItems: 'flex-start' }]}>
                                                                                {is_package != 1 && <Ionicons name={'ellipse'} size={10} color={themeColor0.bgColor(0.5)} />}
                                                                                {item?.type == 'input' ? <Text style={[NewStyles.text10, { flex: 1 }]}>{item?.second_title}</Text> : <Text style={[NewStyles.text10, { flex: 1 }]}>{item?.title}</Text>}
                                                                            </View>
                                                                            {(item?.has_counter >= 1 && item?.type != 'input') && <Text style={[NewStyles.text10, { flex: 1, textAlign: 'auto' }]}>{item?.value}</Text>}
                                                                        </View>
                                                                        {(item?.has_counter >= 1 && item?.type == 'input') && <Text style={[NewStyles.text10, { flex: 1 }]}>{item?.value}</Text>}
                                                                        {
                                                                            item?.user_descriptions &&
                                                                            <View style={{}}>
                                                                                <View style={[NewStyles.row]}>
                                                                                    <Text style={[NewStyles.text, { flex: 1 }]}>توضیحات </Text>
                                                                                </View>
                                                                                <View style={[NewStyles.textInput, NewStyles.row, NewStyles.border10, { gap: 5, paddingVertical: 0, backgroundColor: themeColor4.bgColor(1), borderWidth: 2, borderColor: themeColor8.bgColor(1), borderStyle: 'dotted', minHeight: 45 }]}>

                                                                                    <Text style={NewStyles.text10}>{item?.user_descriptions}</Text>
                                                                                </View>
                                                                            </View>
                                                                        }
                                                                    </View>
                                                                    :
                                                                    null
                                                            )
                                                    }}
                                                />
                                            </View>
                                        );
                                    }}
                                />

                                :

                                <View style={{ paddingTop: 5 }}>

                                    {
                                        previewItem?.filter(x => (x?.type == 'checkbox' || x?.type == 'radioButton' || x?.type == 'counter' || x?.type == 'input'))?.map((item, index) => {
                                            const is_package = item?.is_package
                                            return (
                                                <View key={index}>
                                                    <View style={[NewStyles.row, { gap: 5, paddingHorizontal: '5%' }]}>
                                                        <Text style={[NewStyles.title, { flex: 1 }]}>{item?.title}</Text>
                                                    </View>

                                                    <View style={{ paddingHorizontal: '5%', padding: 20 }}>

                                                        {
                                                            item?.field_details?.map((item, index) => {
                                                                if (!item?.value || item?.value <= 0) return null;
                                                                else
                                                                    return (
                                                                        (item?.value || item?.value > 0) ?
                                                                            <View style={[styles.itemWrapper, NewStyles.border10, is_package == 1 && styles.package]} key={index}>
                                                                                <View style={[is_package != 1 && NewStyles.rowWrapper]}>
                                                                                    <View style={[NewStyles.rowWrapper, { justifyContent: 'flex-end', flex: 2, gap: 5 }, is_package == 1 && { alignItems: 'flex-start' }]}>
                                                                                        {is_package != 1 && <Ionicons name={'ellipse'} size={10} color={themeColor0.bgColor(0.5)} />}
                                                                                        {item?.type == 'input' ? <Text style={[NewStyles.text10, { flex: 1 }]}>{item?.second_title}</Text> : <Text style={[NewStyles.text10, { flex: 1 }]}>{item?.title}</Text>}
                                                                                    </View>
                                                                                    {(item?.has_counter >= 1 && item?.type != 'input') && <Text style={[NewStyles.text10, { flex: 1, textAlign: 'auto' }]}>{item?.value}</Text>}
                                                                                </View>
                                                                                {(item?.has_counter >= 1 && item?.type == 'input') && <Text style={[NewStyles.text10, { flex: 1 }]}>{item?.value}</Text>}
                                                                            </View>
                                                                            :
                                                                            null
                                                                    )
                                                            })
                                                        }
                                                    </View>
                                                </View>
                                            );
                                        })
                                    }

                                </View>
                        }

                    </View>
                ))}

                {des && <View style={{ paddingHorizontal: '5%', gap: 10 }}>
                    <View style={[NewStyles.row, { gap: 5 }]}>
                        <Ionicons name={'create-outline'} size={24} color={themeColor0.bgColor(1)} />
                        <Text style={NewStyles.title}>{t('User Description')}</Text>
                    </View>
                    <View style={[styles.itemWrapper, NewStyles.row, NewStyles.border10, { gap: 10 }]}>
                        <Ionicons name={'ellipse'} size={10} color={themeColor0.bgColor(0.5)} />
                        <Text style={[NewStyles.text10, { flex: 1 }]}>{des}</Text>
                    </View>
                </View>}
                {imagePath && <Image style={[{ height: 250, margin: '5%', resizeMode: 'contain' }, NewStyles.border10]} source={{ uri: `${imageUri}/${imagePath}` }} />}
                <View style={{ width: '90%', alignSelf: 'center', marginVertical: 10, alignItems: 'flex-end' }}>
                    <HintBadge
                        hint={t("Dear Loop, the total receipt is more than {{price}} tomans, you are a guest of Loop (travel and examination expenses are covered)", { price: formatPrice(minPrice?.price) })}
                        title={t('Preview')}
                    />
                </View>
            </ScrollView>
            <View style={[NewStyles.row, NewStyles.nav, { backgroundColor: 'transparent', marginBottom: footerSpace }]}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Button title={t('Final Order Submission')} textStyle={{ color: themeColor4.bgColor(1) }} style={{ backgroundColor: themeColor7.bgColor(1) }} loading={loading} onPress={() => submitOrder()} />
                </View>
            </View>
        </SafeAreaView>
    )
}

const createLocalStyles = (NewStyles) => StyleSheet.create({
    textInput: {
        width: '100%',
        height: 50,
        backgroundColor: 'transparent',
    },
    urgentLabel: {
        backgroundColor: themeColor6.bgColor(1),
        padding: 5
    },
    itemWrapper: {
        paddingVertical: '5%',
        paddingHorizontal: '5%',
        minHeight: 50,
        gap: 10,
        marginBottom: 1
    },
    package: {
        backgroundColor: themeColor1.bgColor(1),
        padding: 15,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: themeColor10.bgColor(1)
    },
    valueContainer: {
        borderWidth: 1,
        borderColor: themeColor0.bgColor(1),
        height: 40,
        width: 40,
        ...NewStyles.border5,
        ...NewStyles.center
    },
})

// محافظت از صفحه ثبت سفارش - نیاز به تایید کامل برای کاربران سازمانی
export default Preview