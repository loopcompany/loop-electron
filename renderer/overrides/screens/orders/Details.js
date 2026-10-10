/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/orders/Details.js
 *
 * The order page as a desktop dashboard: a header with the order number,
 * category, status and payment; the order's journey as one clickable line
 * (registered → technician → in progress → payment → receive → review); every
 * stage as a card (open / locked, the same rules and messages as the phone's
 * accordions); and beside them the costs with the way to pay, the assigned
 * technician and support.
 *
 * Same data flow as the mobile file: the logic of `Details` (state, the
 * /orders/detail, report, verify-technician, final / in-place description
 * requests, wallet and gateway payment, refresh on focus) is copied
 * unchanged; the stage sections (OrderReviewSection, OrderLoopSendSection…)
 * are the mobile components, shown inside the cards. Only the render differs.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { View, Text, Image, Pressable, StyleSheet, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import * as Linking from "expo-linking";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { imageUri, uri } from '@services/URL';
import { formatDate, formatDateTime, formatPrice, showToastOrAlert } from '@helpers/Common';
import { describePayment } from '@services/paymentMethods';
import Loader from '@components/Loader';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeaders from '@components/ScreenHeaders';
import TechnicianDetailsComponent from '@components/TechnicianDetailsComponent';
import OrderExtraServices from './OrderExtraServices';
import OrderReviewSection from './OrderReviewSection';
import OrderReviewRatingSection from './OrderReviewRatingSection';
import OrderLoopDispatchSection from './OrderLoopDispatchSection';
import OrderLoopSendSection from './OrderLoopSendSection';
import OrderReturnTimeSection from './OrderReturnTimeSection';
import { fetchUser } from '@slices/userSlice';
import { fetchOrders } from '@slices/orderSlice';
import { payOrderViaGateway, describeWalletError } from '@services/WalletApi';
import { fetchWalletBalance, payOrderWithWallet, seedBalance, selectWalletBalance } from '@slices/walletSlice';
import { createStyles } from '@styles/NewStyles';
import { createPaymentRedirectUrl, openPaymentGateway } from '@utils/paymentGateway';
import ShowMapDetailComponent from '@components/ShowMapDetailComponent';

import { DButton, Pill, useDir } from '@desktop/ui';
import { AsideAction, ChoiceGroup, Field, TextField } from '@desktop/FormKit';
import { dashboardStyles } from '@desktop/DashboardParts';
import { elevation, gradients, motion, onDark, palette, radii, surface, tone } from '@desktop/desktopTheme';
import { animate } from '@desktop/globalStyles';
import { orderStatusMeta } from '@desktop/orderStatus';

const COPY = {
    fa: {
        orderNo: 'سفارش',
        refresh: 'به‌روزرسانی',
        receipt: 'رسید سفارش',
        preReceipt: 'پیش‌رسید',
        jRegistered: 'ثبت سفارش',
        jTechnician: 'تخصیص تکنسین',
        jProcess: 'انجام کار',
        jPayment: 'پرداخت',
        jReceive: 'تحویل',
        jRating: 'ثبت نظر',
        open: 'فعال',
        locked: 'هنوز فعال نشده',
        services: 'خدمات و انتخاب‌ها',
        gallery: 'تصاویر',
        costs: 'هزینه‌ی سفارش',
        basePrice: 'هزینه‌ی خدمات',
        discount: 'تخفیف',
        goPay: 'پرداخت هزینه',
        payLater: 'پرداخت پس از شروع کار تکنسین فعال می‌شود.',
        yourTechnician: 'تکنسین سفارش',
        help: 'سوالی درباره‌ی این سفارش دارید؟',
        helpText: 'تیم پشتیبانی لوپ در همه‌ی مراحل همراه شماست.',
        helpButton: 'پیام به پشتیبانی',
    },
    en: {
        orderNo: 'Order',
        refresh: 'Refresh',
        receipt: 'Order receipt',
        preReceipt: 'Pre-receipt',
        jRegistered: 'Registered',
        jTechnician: 'Technician',
        jProcess: 'In progress',
        jPayment: 'Payment',
        jReceive: 'Delivery',
        jRating: 'Review',
        open: 'Open',
        locked: 'Not open yet',
        services: 'Services and choices',
        gallery: 'Photos',
        costs: 'Order cost',
        basePrice: 'Service cost',
        discount: 'Discount',
        goPay: 'Pay now',
        payLater: 'Payment opens once the technician starts the work.',
        yourTechnician: 'Your technician',
        help: 'A question about this order?',
        helpText: 'Loop support is with you at every step.',
        helpButton: 'Message support',
    },
};

/** One stage of the order: a card with a header that opens it, or says it is locked. */
function StageCard({ dir, copy, icon, title, active, open, onPress, children }) {
    const isOpen = !!open;
    return (
        <View style={[ds.stage, isOpen && ds.stageOpen, !active && ds.stageLocked]}>
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen, disabled: !active }}
                style={({ hovered }) => [ds.stageHead, dir.row, hovered && ds.stageHeadHover]}
            >
                <View style={[ds.stageIcon, active && ds.stageIconOn]}>
                    <Ionicons name={active ? icon : 'lock-closed-outline'} size={18} color={active ? palette.navy900 : surface.faint} />
                </View>
                <Text style={[ds.stageTitle, dir.bold, dir.align, !active && ds.stageTitleLocked]} numberOfLines={1}>{title}</Text>
                <Pill size="sm" label={active ? copy.open : copy.locked} kind={active ? 'success' : 'neutral'} dot={!!active} style={ds.center} />
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={surface.faint} />
            </Pressable>
            {isOpen && <View style={[ds.stageBody, animate('loop-fade-in', '200ms')]}>{children}</View>}
        </View>
    );
}

function Fact({ dir, icon, label, value, danger, children }) {
    return (
        <View style={ds.fact}>
            <View style={[ds.factHead, dir.row]}>
                <Ionicons name={icon} size={15} color={danger ? palette.danger : surface.faint} />
                <Text style={[ds.factLabel, dir.light, dir.align]} numberOfLines={1}>{label}</Text>
            </View>
            {children || <Text style={[ds.factValue, dir.bold, dir.align, danger && { color: palette.danger }]}>{value}</Text>}
        </View>
    );
}

function BlockTitle({ dir, icon, title }) {
    return (
        <View style={[ds.blockTitle, dir.row]}>
            <Ionicons name={icon} size={16} color={surface.brandText} />
            <Text style={[ds.blockTitleText, dir.bold, dir.align]}>{title}</Text>
        </View>
    );
}

function Notice({ dir, kind = 'info', icon, title, children }) {
    const c = tone[kind] || tone.neutral;
    return (
        <View style={[ds.notice, dir.row, { backgroundColor: c.bg }]}>
            <Ionicons name={icon} size={18} color={c.fg} style={ds.noticeIcon} />
            <View style={ds.flex}>
                {!!title && <Text style={[ds.noticeTitle, dir.bold, dir.align, { color: c.fg }]}>{title}</Text>}
                {children != null && children !== '' && <Text style={[ds.noticeText, dir.light, dir.align]}>{children}</Text>}
            </View>
        </View>
    );
}

function Thumb({ uri: src, large }) {
    return (
        <Pressable onPress={() => Linking.openURL(src)} style={({ hovered }) => [ds.thumb, large && ds.thumbLarge, hovered && ds.thumbHover]}>
            <Image source={{ uri: src }} style={ds.thumbImage} resizeMode="cover" />
        </Pressable>
    );
}

function SummaryRow({ dir, label, value, good }) {
    return (
        <View style={[ds.summaryRow, dir.row]}>
            <Text style={[ds.summaryLabel, dir.light]}>{label}</Text>
            <Text style={[ds.summaryValue, dir.bold, good && { color: '#7ee2a8' }]}>{value}</Text>
        </View>
    );
}

function Details({ route, navigation }) {

    const { t, i18n } = useTranslation();
    const NewStyles = useMemo(
        () => createStyles(i18n.language),
        [i18n.language]
    );
    const lang = i18n.resolvedLanguage ?? i18n.language ?? 'en';

    const dispatch = useDispatch();
    const orderId = route?.params?.orderId;
    const token = useSelector((state) => state?.auth?.token)
    const user = useSelector((state) => state?.user?.data)
    // موجودی از walletSlice، نه از snapshot پروفایل — بعد از هر پرداخت تازه می‌شود.
    const walletBalance = useSelector(selectWalletBalance)

    const [refreshing, setRefreshing] = useState(true)
    // دسکتاپ: جزئیات سفارش از ابتدا باز است
    const [showDetails, setShowDetails] = useState(true);
    const [showReview, setShowReview] = useState(false);
    const [showTechnician, setShowTechnician] = useState(false);
    const [showProcess, setShowProcess] = useState(false);
    const [showLoopDispatch, setShowLoopDispatch] = useState(false);
    const [showDoneInPlace, setShowDoneInPlace] = useState(false);
    const [hasReport, setHasReport] = useState(false);
    const [showLoopSend, setShowLoopSend] = useState(false);
    const [showReturnTime, setShowReturnTime] = useState(false);
    const [showMorePrices, setShowMorePrices] = useState(false);
    // Payment & receive stages
    const [showPayment, setShowPayment] = useState(false);
    const [loadingWallet, setLoadingWallet] = useState(false);
    const [loadingGateway, setLoadingGateway] = useState(false);
    const [showReceive, setShowReceive] = useState(false);
    const [showShipment, setShowShipment] = useState(false);
    const [selectedReceiveOption, setSelectedReceiveOption] = useState(null);
    const [showCustomReceive, setShowCustomReceive] = useState(false);
    const [customReceiveText, setCustomReceiveText] = useState('');
    const [userInPlaceDescription, setUserInPlaceDescription] = useState('');
    const [submittingReceive, setSubmittingReceive] = useState(false);
    const [submittingInPlace, setSubmittingInPlace] = useState(false);
    const [showReviewRating, setShowReviewRating] = useState(false);
    const [isTechnicianVerified, setIsTechnicianVerified] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const [data, setData] = useState([]);
    const paymentSessionRef = useRef(null);

    // چک کردن وضعیت گزارش بعد از لود شدن داده‌ها
    useEffect(() => {
        if (orderId && token) {
            checkReportStatus();
        }
    }, [orderId, token, refreshing]);

    // Cleanup payment listener on unmount
    useEffect(() => {
        return () => {
            paymentSessionRef.current?.close();
            paymentSessionRef.current = null;
        };
    }, []);

    const checkReportStatus = async () => {
        try {
            const response = await axios.get(
                `${uri}/order-reports/by-order/${orderId}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept-Language': lang
                    }
                }
            );

            if (response.status == 200 && response.data?.success && response.data?.data?.report) {
                setHasReport(true);
            } else {
                setHasReport(false);
            }
        } catch (error) {
            setHasReport(false);
        }
    };

    const fetchData = async () => {
        try {
            const response = await axios.post(`${uri}/orders/detail`, { orderId }, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept-Language': lang } })
            if (response.status == 200) {
                setData(response?.data)
                setIsTechnicianVerified(response?.data?.is_technician_verified);
            }
        } catch (error) {
            const message = error?.response ? (error?.response?.status ? error?.response?.data?.message : t("An unexpected error occurred!")) : t("Network error!");
            showToastOrAlert(message);
        } finally {
            setRefreshing(false);
        }
    };

    const handleVerifyTechnician = async () => {
        if (!isTechnicianVerified || (isTechnicianVerified != '1' && isTechnicianVerified != '2')) {
            showToastOrAlert(t("Please select one of the options"));
            return;
        }

        setVerifying(true);
        try {
            const response = await axios.post(
                `${uri}/orders/verify-technician`,
                {
                    orderId: orderId,
                    verification_status: parseInt(isTechnicianVerified)
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept-Language': lang
                    }
                }
            );

            if (response.status == 200) {
                showToastOrAlert(response?.data?.message || t("Identity verification completed successfully"));
                // بروزرسانی داده‌ها
                setRefreshing(true);
            }
        } catch (error) {
            const message = error?.response ? (error?.response?.status ? error?.response?.data?.message : t("An unexpected error occurred!")) : t("Network error!");
            showToastOrAlert(message);
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmitReceive = async () => {
        // بررسی انتخاب گزینه یا ثبت توضیحات
        if (!selectedReceiveOption && !showCustomReceive) {
            showToastOrAlert(t("Please select one of the options"));
            return;
        }

        if (showCustomReceive && !customReceiveText.trim()) {
            showToastOrAlert(t("Please enter the description"));
            return;
        }

        // تعریف متن‌های مربوط به هر گزینه
        const optionTexts = {
            1: t("I received the product with health test"),
            2: t("I received the product without health test"),
            3: t("I received the product but it has technical defects"),
            4: t("The product was returned to Loop after the test"),
            5: t("I received the product as per my request")
        };

        const description = showCustomReceive ? customReceiveText.trim() : optionTexts[selectedReceiveOption];

        setSubmittingReceive(true);
        try {
            const response = await axios.post(
                `${uri}/orders/${orderId}/final-description`,
                { description },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept-Language': lang
                    }
                }
            );

            if (response.status == 200) {
                showToastOrAlert(response?.data?.message || t("Final description successfully submitted"));
                // بروزرسانی داده‌ها
                setRefreshing(true);
            }
        } catch (error) {
            const message = error?.response ? (error?.response?.status ? error?.response?.data?.message : t("An unexpected error occurred!")) : t("Network error!");
            showToastOrAlert(message);
        } finally {
            setSubmittingReceive(false);
        }
    };
    const handleSubmitInPlace = async () => {

        setSubmittingInPlace(true);
        try {
            const response = await axios.post(
                `${uri}/orders/${orderId}/in-place-description`,
                { user_in_place_description: userInPlaceDescription },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept-Language': lang
                    }
                }
            );

            if (response.status == 200) {
                showToastOrAlert(response?.data?.message || t("Final description successfully submitted"));
                // بروزرسانی داده‌ها
                setRefreshing(true);
            }
        } catch (error) {
            const message = error?.response ? (error?.response?.status ? error?.response?.data?.message : t("An unexpected error occurred!")) : t("Network error!");
            showToastOrAlert(message);
        } finally {
            setSubmittingInPlace(false);
            dispatch(fetchOrders(token));
        }
    };

    const walletPayment = async () => {
        setLoadingWallet(true);

        // مبلغ را سرور حساب می‌کند (تخفیف و تخفیف معرف هم لحاظ می‌شود) و
        // موجودی جدید را در `remaining_balance` برمی‌گرداند، پس نیازی به
        // درخواست دوم برای خواندن موجودی نیست.
        const action = await dispatch(payOrderWithWallet({ token, orderId }));
        setLoadingWallet(false);

        if (payOrderWithWallet.fulfilled.match(action)) {
            showToastOrAlert(t("Payment completed successfully"));
            dispatch(fetchOrders(token));
            dispatch(fetchUser(token));
            setRefreshing(true);
            return;
        }

        // خطاهای مستندشده (موجودی کافی نیست، قبلاً پرداخت شده، ...) با
        // error_code می‌آیند و باید پیام مشخص خودشان را داشته باشند.
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
            showToastOrAlert(t("Payment completed successfully"));
        } else if (status === 'NOK') {
            showToastOrAlert(t("The payment encountered an error."));
        }
        setLoadingGateway(false);
    };

    const gatewayPayment = async () => {
        setLoadingGateway(true);

        const result = await payOrderViaGateway(token, { orderId, linkingUrl: redirectUrl });
        const paymentUrl = result.data?.payment_url;

        if (!result.ok || !paymentUrl) {
            showToastOrAlert(result.message || t("Error connecting to payment gateway"));
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
            showToastOrAlert(t("Error connecting to payment gateway"));
            setLoadingGateway(false);
        }
    };

    useFocusEffect(useCallback(
        () => {
            fetchData();
            dispatch(fetchUser(token));
            // موجودی تازه، چون کاربر ممکن است از صفحه‌ی شارژ برگشته باشد.
            dispatch(seedBalance(user?.wallet));
            if (token) dispatch(fetchWalletBalance(token));
        }, [refreshing]
    ));

    const totalDiscountedPrice = useMemo(() => {
        const basePrice = Number(data?.technician_price ?? data?.pakar_price);
        if (data?.prepayment && data?.prepayment_payment_status == 1) {

            const prepaid = Number(data?.loop_cost_estimate) * Number(data?.prepayment) / 100;
            return Number(basePrice) + Number(data?.extra_price) - Number(data?.discount_price) - prepaid;
        } else {

            return Number(basePrice) + Number(data?.extra_price) - Number(data?.discount_price);
        }
    }, [data]);

    const totalPrice = useMemo(() => {
        const basePrice = Number(data?.technician_price ?? data?.pakar_price);
        return Number(basePrice) + Number(data?.extra_price);
    }, [data]);

    // استفاده از useCallback برای جلوگیری از re-render غیرضروری
    const renderRow = useCallback((text1, text2, textStyle1, textStyle2) => (
        <View style={NewStyles.rowWrapper}>
            <Text style={[NewStyles.text, textStyle1]}>{text1}</Text>
            <Text style={[NewStyles.text10, textStyle2]}>{text2}</Text>
        </View>
    ), []);
    const minPrice = useSelector(state => state.minPrice?.data)
    // desktop: direction, copy and the scroll positions of the stage cards
    const dir = useDir();
    const copy = COPY[dir.rtl ? 'fa' : 'en'];
    const scrollRef = useRef(null);
    const stageY = useRef({});
    if (data.length <= 0) { return <Loader /> }
    const paymentInfo = describePayment(data);

    // ---- desktop presentation -------------------------------------------
    const meta = orderStatusMeta(data, t);
    const showPrices = user?.apple_check == 0;
    const orderNumber = String(data?.id ?? '');
    const visitText = data?.is_urgent > 0
        ? t("Urgent request")
        : formatDate(data?.date) + ' ' + t("hour") + ' ' + data?.time?.split(':')?.slice(0, 2)?.join(':');
    const genderText = (() => {
        const male = Number(data.male_count) || 0;
        const female = Number(data.female_count) || 0;
        const unspecified = Number(data.unspecified_count) || 0;
        const total = male + female + unspecified;
        if (total === 0) return t("Not specified");
        let details = [];
        if (male > 0) details.push(t("Male"));
        if (female > 0) details.push(t("Female"));
        return (details.length > 0 ? `${details.join(' ')}` : '');
    })();
    const payable = totalDiscountedPrice < Number(minPrice?.price) ? totalDiscountedPrice + 200000 : totalDiscountedPrice;
    const basePrice = Number(data?.technician_price ?? data?.pakar_price) || 0;

    // the same "is this stage open yet" rules as the mobile accordions
    const reviewActive = (data?.status != 3 && data?.status != 5 && data?.status != 6) || data?.user_cancellation_date;
    const processActive = (data?.status == 1 || data?.status == 2 || isTechnicianVerified != '0') && data?.technician;
    const loopSendActive = (data?.send_to_loop || (data?.loop_cost_estimate && data?.duration));
    const pricesActive = data?.status >= 1 && data?.technician && data?.extra_price > 0;
    const paymentActive = (data?.started_at || data?.status == 2 || (data?.done_in_place && data?.technician_price > 0));
    const shipmentActive = data?.payment_status == 1 && data?.shipment_status;
    const receiveActive = data?.payment_status == 1;
    const reviewRatingActive = (data?.status == 2 && data?.finished_at && data?.payment_status == 1) || data?.shipment_status;

    const openStage = (key, setOpen) => {
        setOpen(true);
        requestAnimationFrame(() => {
            const y = stageY.current[key];
            if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
        });
    };
    const stageLayout = (key) => (e) => { stageY.current[key] = e.nativeEvent.layout.y; };

    // the order's journey at a glance
    const journey = [
        { key: 'details', icon: 'document-text', label: copy.jRegistered, done: true, onPress: () => openStage('details', setShowDetails) },
        { key: 'technician', icon: 'person', label: copy.jTechnician, done: !!data?.technician, onPress: () => data?.technician ? openStage('technician', setShowTechnician) : showToastOrAlert(t("No technician has been assigned to your order yet.")) },
        { key: 'process', icon: 'construct', label: copy.jProcess, done: !!data?.started_at || data?.status == 2, current: processActive && !data?.started_at && data?.status != 2, onPress: () => processActive ? openStage('process', setShowProcess) : showToastOrAlert(t("Your order has not reached the execution stage.")) },
        ...(showPrices ? [{ key: 'payment', icon: 'card', label: copy.jPayment, done: data?.payment_status == 1, current: paymentActive && data?.payment_status != 1, onPress: () => paymentActive ? openStage('payment', setShowPayment) : showToastOrAlert(t("You do not currently have access to this section.")) }] : []),
        { key: 'receive', icon: 'cube', label: copy.jReceive, done: !!data?.user_final_description, current: receiveActive && !data?.user_final_description, onPress: () => receiveActive ? openStage('receive', setShowReceive) : showToastOrAlert(t("Please complete the payment first.")) },
        { key: 'rating', icon: 'star', label: copy.jRating, done: false, current: !!reviewRatingActive, onPress: () => (data?.status == 2 && data?.finished_at) ? openStage('rating', setShowReviewRating) : showToastOrAlert(t("This section will be activated after order completion.")) },
    ];
    const currentIndex = Math.max(0, journey.reduce((last, step, i) => (step.done || step.current ? i : last), 0));

    const receiveOptions = [
        { value: 1, label: t("I received the product with health test") },
        { value: 2, label: t("I received the product without health test") },
        { value: 3, label: t("I received the product but it has technical defects") },
        { value: 4, label: t("The product was returned to Loop after the test") },
        { value: 5, label: t("I received the product as per my request") },
        { value: 'custom', label: t("Submit description"), icon: 'create-outline' },
    ];

    return (
        <View style={dashboardStyles.screen}>
            <ScreenHeaders title={t("Current order")} />
            <ScrollView ref={scrollRef} style={dashboardStyles.scroll} contentContainerStyle={dashboardStyles.scrollContent}>
                <View style={dashboardStyles.page}>

                    {/* ---------- Header ---------- */}
                    <View style={[ds.hero, dir.row, animate('loop-fade-up', '340ms')]}>
                        <View style={ds.heroStars} pointerEvents="none" />
                        <View style={[ds.heroIcon, { borderColor: (tone[meta.kind] || tone.neutral).fg }]}>
                            <Ionicons name={meta.icon} size={30} color={palette.gold} />
                        </View>
                        <View style={ds.flex}>
                            <Text style={[ds.heroEyebrow, dir.light, dir.align]}>
                                {copy.orderNo} <Text style={[ds.heroNumber, dir.bold]}>#{orderNumber}</Text>
                            </Text>
                            <Text style={[ds.heroTitle, dir.bold, dir.align]} numberOfLines={1}>{data?.category?.title}</Text>
                            <View style={[ds.heroPills, dir.row]}>
                                <Pill label={meta.label} kind={meta.kind} dot />
                                {showPrices && (
                                    <Pill
                                        label={data?.payment_status > 0 ? t("Paid") : t("Not paid")}
                                        kind={data?.payment_status > 0 ? 'success' : 'warning'}
                                        icon={data?.payment_status > 0 ? 'checkmark' : 'card-outline'}
                                    />
                                )}
                                {data?.is_urgent > 0 && <Pill label={t("Urgent request")} kind="danger" icon="flash" />}
                            </View>
                        </View>
                        <View style={[ds.heroActions, dir.row]}>
                            <DButton title={copy.refresh} icon="refresh" variant="glass" loading={refreshing} onPress={() => setRefreshing(true)} />
                            {(data?.status == 0 || (data?.status == 2 && user?.apple_check != 1)) && (
                                <DButton
                                    title={data?.status == 0 ? copy.preReceipt : copy.receipt}
                                    icon="receipt-outline"
                                    variant="gold"
                                    onPress={() => navigation.navigate('OrderReceipt', { orderId: data?.id })}
                                />
                            )}
                        </View>
                    </View>

                    {/* ---------- Journey ---------- */}
                    <View style={[ds.journey, dir.row, animate('loop-fade-up', '340ms', '60ms')]}>
                        {journey.map((step, i) => {
                            const state = step.done ? 'done' : step.current ? 'current' : 'todo';
                            return (
                                <React.Fragment key={step.key}>
                                    {i > 0 && <View style={[ds.journeyLine, i <= currentIndex && ds.journeyLineOn]} />}
                                    <Pressable
                                        onPress={step.onPress}
                                        accessibilityRole="button"
                                        accessibilityLabel={step.label}
                                        style={({ hovered }) => [ds.journeyStep, hovered && ds.journeyStepHover]}
                                    >
                                        <View style={[ds.journeyDot, state === 'done' && ds.journeyDotDone, state === 'current' && ds.journeyDotCurrent]}>
                                            <Ionicons
                                                name={state === 'done' ? 'checkmark' : step.icon}
                                                size={16}
                                                color={state === 'todo' ? surface.faint : state === 'done' ? palette.white : palette.navy900}
                                            />
                                        </View>
                                        <Text style={[ds.journeyLabel, state !== 'todo' ? dir.bold : dir.light, state === 'todo' && ds.journeyLabelTodo]} numberOfLines={1}>
                                            {step.label}
                                        </Text>
                                    </Pressable>
                                </React.Fragment>
                            );
                        })}
                    </View>

                    <View style={[dashboardStyles.columns, dir.row]}>
                        {/* ---------- Stages ---------- */}
                        <View style={ds.main}>
                            <View onLayout={stageLayout('details')}>
                                <StageCard dir={dir} copy={copy} icon="document-text-outline" title={t("Order details")} active open={showDetails} onPress={() => setShowDetails(!showDetails)}>
                                    <View style={[ds.facts, dir.row]}>
                                        <Fact dir={dir} icon={data?.is_urgent > 0 ? 'flash-outline' : 'calendar-outline'} label={t("Technician visit time")} value={visitText} danger={data?.is_urgent > 0} />
                                        <Fact dir={dir} icon="time-outline" label={t("Order registration time")} value={formatDateTime(data?.created_at)} />
                                        {Number(data?.category?.has_gender) > 0 && <Fact dir={dir} icon="people-outline" label={t("Technician gender")} value={genderText} />}
                                        {user?.apple_check == 1 ? null : (
                                            <Fact dir={dir} icon="card-outline" label={t("Payment status")}>
                                                <Pill size="sm" label={data?.payment_status > 0 ? t("Paid") : t("Not paid")} kind={data?.payment_status > 0 ? 'success' : 'warning'} />
                                            </Fact>
                                        )}
                                    </View>

                                    {/* What was ordered */}
                                    {(data?.order_details || []).length > 0 && (
                                        <View style={ds.block}>
                                            <BlockTitle dir={dir} icon="list-outline" title={copy.services} />
                                            {(data?.order_details || []).map((section, si) => (
                                                <View key={`${section?.title}-${si}`} style={[ds.serviceGroup, section?.is_package == 1 && ds.servicePackage]}>
                                                    <View style={[ds.serviceHead, dir.row]}>
                                                        {section?.is_package == 1 && <Ionicons name="gift-outline" size={15} color={palette.goldDeep} />}
                                                        <Text style={[ds.serviceTitle, dir.bold, dir.align]}>{section?.title}</Text>
                                                    </View>
                                                    {(section?.data || []).map((item, ii) => (
                                                        <View key={`${item?.id}-${ii}`} style={ds.serviceItem}>
                                                            <View style={[ds.serviceRow, dir.row]}>
                                                                <View style={ds.serviceBullet} />
                                                                <Text style={[ds.serviceText, dir.light, dir.align]}>
                                                                    {item?.type == 'input' ? item?.field_detail?.second_title : item?.field_detail?.title}
                                                                </Text>
                                                                {item?.field_detail?.has_counter >= 1 && !!item?.value && (
                                                                    <Text style={[ds.serviceValue, dir.bold]}>{item?.value}</Text>
                                                                )}
                                                            </View>
                                                            {!!item?.user_descriptions && (
                                                                <Text style={[ds.serviceNote, dir.light, dir.align]}>
                                                                    <Text style={dir.bold}>{t("Description")}: </Text>{item?.user_descriptions}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    ))}
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {!!data?.des && (
                                        <View style={ds.block}>
                                            <BlockTitle dir={dir} icon="create-outline" title={t("User description")} />
                                            <View style={[ds.quote, dir.rtl ? ds.quoteRtl : ds.quoteLtr]}>
                                                <Text style={[ds.quoteText, dir.light, dir.align]}>{data?.des}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {(!!data?.image_path || data?.order_galleries?.length > 0) && (
                                        <View style={ds.block}>
                                            <BlockTitle dir={dir} icon="images-outline" title={copy.gallery} />
                                            <View style={[ds.gallery, dir.row]}>
                                                {!!data?.image_path && (
                                                    <Thumb uri={`${imageUri}/${data?.image_path}`} large />
                                                )}
                                                {(data?.order_galleries || []).map((item, i) => (
                                                    <Thumb key={`${item?.image_path}-${i}`} uri={`${imageUri}/${item?.image_path}`} />
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Where */}
                                    <View style={ds.block}>
                                        <BlockTitle dir={dir} icon="location-outline" title={t("Order location")} />
                                        <View style={[ds.address, dir.row]}>
                                            <View style={ds.addressIcon}>
                                                <Ionicons name="home-outline" size={18} color={surface.brandText} />
                                            </View>
                                            <View style={ds.flex}>
                                                <Text style={[ds.addressText, dir.bold, dir.align]}>
                                                    {data?.user_address?.city + ' - ' + t("Region") + ' ' + data?.user_address?.region + ' - ' + data?.user_address?.address}
                                                </Text>
                                                <Text style={[ds.addressMeta, dir.light, dir.align]}>
                                                    {t("Number") + ' ' + data?.user_address?.number + ' · ' + t("Unit") + ' ' + data?.user_address?.unit + ' · ' + t("Floor") + ' ' + data?.user_address?.floor}
                                                </Text>
                                                <Text style={[ds.addressMeta, dir.light, dir.align]}>
                                                    {data?.user_address?.fname + ' ' + data?.user_address?.lname + ' · ' + data?.user_address?.telephone}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={ds.map}>
                                            <ShowMapDetailComponent latitude={data?.user_address?.latitude} longitude={data?.user_address?.longitude} />
                                        </View>
                                    </View>
                                </StageCard>
                            </View>

                            {/* مرحله بررسی / جایگزین / */}
                            <StageCard
                                dir={dir} copy={copy} icon="search-outline"
                                title={t("Review / Replacement / Receipt")}
                                active={reviewActive}
                                open={showReview && reviewActive}
                                onPress={() => {
                                    if ((data?.status != 3 && data?.status != 5 && data?.status != 6) || data?.user_cancellation_date) {
                                        setShowReview(!showReview)
                                    } else if (data?.status == 3) {
                                        showToastOrAlert(t("You have canceled the order"))
                                    }
                                    else {
                                        showToastOrAlert(t("This stage is not activated yet."))
                                    }
                                }}
                            >
                                <OrderReviewSection data={data} navigation={navigation} orderId={orderId} onUpdate={() => setRefreshing(true)} />
                            </StageCard>

                            <View onLayout={stageLayout('technician')}>
                                <StageCard
                                    dir={dir} copy={copy} icon="person-outline"
                                    title={t("Technician information")}
                                    active={!!data?.technician}
                                    open={showTechnician && !!data?.technician}
                                    onPress={() => {
                                        if (data?.technician) {
                                            setShowTechnician(!showTechnician)
                                        } else {
                                            showToastOrAlert(t("No technician has been assigned to your order yet."))
                                        }
                                    }}
                                >
                                    <TechnicianDetailsComponent navigation={navigation} data={data} renderRow={renderRow} />
                                    {/* علت لغو توسط متخصص */}
                                    {data?.technician_cancel_reason && (
                                        <Notice dir={dir} kind="danger" icon="close-circle-outline" title={t("Reason for order cancellation by technician")}>
                                            {data?.technician_cancel_reason}
                                        </Notice>
                                    )}
                                </StageCard>
                            </View>

                            <View onLayout={stageLayout('process')}>
                                <StageCard
                                    dir={dir} copy={copy} icon="construct-outline"
                                    title={t("In progress")}
                                    active={processActive}
                                    open={showProcess}
                                    onPress={() => {
                                        if ((data?.status == 1 || data?.status == 2 || isTechnicianVerified != '0') && data?.technician) {
                                            setShowProcess(!showProcess)
                                        } else if (data?.status == 0) {
                                            showToastOrAlert(t("Your order has not reached the execution stage."))
                                        } else {
                                            showToastOrAlert(t("Your order has been canceled."))
                                        }
                                    }}
                                >
                                    {(data?.set_off_at && !data?.arrived_at) && (
                                        <Notice dir={dir} kind="info" icon="car-outline">{t("The Loop technician is heading to your order location. Please contact the technician if needed.")}</Notice>
                                    )}
                                    {(!data?.set_off_at) && (
                                        <Notice dir={dir} kind="info" icon="hourglass-outline">{t("Dear user, your order is being reviewed by Loop technician. Thank you for your patience.")}</Notice>
                                    )}
                                    {data?.arrived_at && (
                                        <Notice dir={dir} kind="warning" icon="shield-checkmark-outline">{t("Dear user, if the technician's specifications do not match the registered information, please inform Loop support.")}</Notice>
                                    )}
                                    {data?.arrived_at && (
                                        <View style={ds.block}>
                                            <BlockTitle dir={dir} icon="id-card-outline" title={t("Confirm technician presence")} />
                                            {data?.is_technician_verified != '0' ? (
                                                <Pill
                                                    kind={isTechnicianVerified == '1' ? 'success' : 'danger'}
                                                    icon={isTechnicianVerified == '1' ? 'checkmark' : 'alert'}
                                                    label={isTechnicianVerified == '1' ? t("Technician specifications are correct") : t("Technician specifications are not correct")}
                                                />
                                            ) : (
                                                <>
                                                    <ChoiceGroup
                                                        columns={2}
                                                        value={isTechnicianVerified == '1' || isTechnicianVerified == '2' ? String(isTechnicianVerified) : null}
                                                        onChange={(v) => setIsTechnicianVerified(v)}
                                                        options={[
                                                            { value: '1', label: t("Technician specifications are correct"), icon: 'checkmark-circle-outline' },
                                                            { value: '2', label: t("Technician specifications are not correct"), icon: 'close-circle-outline' },
                                                        ]}
                                                    />
                                                    {((isTechnicianVerified == '1' || isTechnicianVerified == '2') && data?.is_technician_verified == '0') && (
                                                        <View style={[ds.actionsRow, dir.row]}>
                                                            <DButton title={t("Final submit")} icon="checkmark-done" variant="gold" loading={verifying} onPress={handleVerifyTechnician} />
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </View>
                                    )}
                                </StageCard>
                            </View>

                            {/* مشخصات / اطلاعات محصول */}
                            {data?.done_in_place && data?.admin_in_place_description && (
                                <StageCard dir={dir} copy={copy} icon="home-outline" title={t("Done at your place")} active open={showDoneInPlace} onPress={() => setShowDoneInPlace(!showDoneInPlace)}>
                                    <Notice dir={dir} kind="success" icon="checkmark-circle" title={data?.admin_in_place_description}>
                                        {t("Done at:")} {formatDateTime(data.done_in_place)}
                                    </Notice>
                                    <Field label={t("Description")} full>
                                        <TextField
                                            multiline
                                            rows={3}
                                            placeholder={t("Enter your description...")}
                                            value={userInPlaceDescription}
                                            onChangeText={setUserInPlaceDescription}
                                            editable={!data?.user_in_place_description}
                                            maxLength={191}
                                        />
                                    </Field>
                                    {!data?.user_in_place_description && (
                                        <View style={[ds.actionsRow, dir.row]}>
                                            <DButton title={t("Confirm")} icon="checkmark" variant="gold" loading={submittingInPlace} onPress={handleSubmitInPlace} />
                                        </View>
                                    )}
                                </StageCard>
                            )}

                            <StageCard
                                dir={dir} copy={copy} icon="hardware-chip-outline"
                                title={t("Specifications / Product information")}
                                active={hasReport}
                                open={showLoopDispatch}
                                onPress={() => {
                                    if (hasReport) {
                                        setShowLoopDispatch(!showLoopDispatch)
                                    } else {
                                        showToastOrAlert(t("Product information has not been registered by technician yet."))
                                    }
                                }}
                            >
                                <OrderLoopDispatchSection orderId={orderId} onUpdate={() => setRefreshing(true)} onReportStatusChange={(status) => setHasReport(status)} />
                            </StageCard>

                            {/* اعزام به لوپ / هزینه ها / مدت زمان */}
                            <StageCard
                                dir={dir} copy={copy} icon="paper-plane-outline"
                                title={t("Send to Loop / Costs / Duration")}
                                active={loopSendActive}
                                open={showLoopSend && loopSendActive}
                                onPress={() => {
                                    if ((data?.send_to_loop || (data?.loop_cost_estimate && data?.duration))) {
                                        setShowLoopSend(!showLoopSend)
                                    } else {
                                        showToastOrAlert(t("The request to send to Loop has not been registered yet."))
                                    }
                                }}
                            >
                                <OrderLoopSendSection data={data} orderId={orderId} onUpdate={() => setRefreshing(true)} />
                            </StageCard>

                            {/* زمان عودت - فقط اگر user_cancellation_date پر باشه */}
                            {data?.user_cancellation_date && (
                                <StageCard dir={dir} copy={copy} icon="return-down-back-outline" title={t("Return time")} active open={showReturnTime} onPress={() => setShowReturnTime(!showReturnTime)}>
                                    <OrderReturnTimeSection data={data} orderId={orderId} onUpdate={() => setRefreshing(true)} />
                                </StageCard>
                            )}
                            {data?.returned_at && (
                                <Notice dir={dir} kind="success" icon="checkmark-done-circle">{t("Product successfully returned")}</Notice>
                            )}

                            {user?.apple_check == 0 && (
                                <StageCard
                                    dir={dir} copy={copy} icon="pricetags-outline"
                                    title={t("Parts / Costs")}
                                    active={pricesActive}
                                    open={showMorePrices}
                                    onPress={() => {
                                        if (data?.status >= 1 && data?.technician && data?.extra_price > 0) {
                                            setShowMorePrices(!showMorePrices)
                                        } else {
                                            showToastOrAlert(t("No additional costs have been registered for this order."))
                                        }
                                    }}
                                >
                                    <OrderExtraServices orderId={orderId} navigation={navigation} />
                                </StageCard>
                            )}

                            {/* مرحله پرداخت هزینه */}
                            {user?.apple_check == 0 && (
                                <View onLayout={stageLayout('payment')}>
                                    <StageCard
                                        dir={dir} copy={copy} icon="card-outline"
                                        title={t("Payment")}
                                        active={paymentActive}
                                        open={showPayment && paymentActive}
                                        onPress={() => {
                                            if (data?.started_at || data?.status == 2 || (data?.done_in_place && data?.technician_price > 0)) {
                                                setShowPayment(!showPayment)
                                            } else {
                                                showToastOrAlert(t("You do not currently have access to this section."))
                                            }
                                        }}
                                    >
                                        {/* روش و کانال پرداخت؛ فقط وقتی سرور `payment_method` را بفرستد. */}
                                        {paymentInfo && (
                                            <Notice dir={dir} kind="info" icon="information-circle-outline" title={`${t("Payment method")}: ${paymentInfo.label}`}>
                                                {paymentInfo.remainingAmount != null ? `${t("Remaining amount")}: ${formatPrice(paymentInfo.remainingAmount)} ${t("Tomans")}` : null}
                                            </Notice>
                                        )}
                                        <View style={[ds.payRow, dir.row]}>
                                            <Text style={[ds.payLabel, dir.bold]}>{t("Payable amount")}</Text>
                                            <Text style={[ds.payValue, dir.bold]}>{formatPrice(payable)} <Text style={ds.payUnit}>{t("Tomans")}</Text></Text>
                                        </View>
                                        {totalDiscountedPrice < Number(minPrice?.price) && (
                                            <View style={[ds.payRowMuted, dir.row]}>
                                                <Text style={[ds.payMuted, dir.light]}>{t("Travel and tuition fees")}</Text>
                                                <Text style={[ds.payMuted, dir.bold]}>{formatPrice(200000)} {t("Tomans")}</Text>
                                            </View>
                                        )}
                                        <View style={[ds.payRowMuted, dir.row]}>
                                            <Text style={[ds.payMuted, dir.light]}>{t("Your wallet balance")}</Text>
                                            <Text style={[ds.payMuted, dir.bold]}>{formatPrice(walletBalance)} {t("Tomans")}</Text>
                                        </View>
                                        {data?.payment_status == 0 ? (
                                            <View style={[ds.payActions, dir.row]}>
                                                <DButton title={t("Online payment")} icon="globe-outline" variant="gold" size="lg" loading={loadingGateway} onPress={gatewayPayment} />
                                                <DButton title={t("Deduct cost from wallet")} icon="wallet-outline" variant="primary" size="lg" loading={loadingWallet} onPress={walletPayment} />
                                                <DButton title={t("Charge wallet")} icon="add-circle-outline" variant="outline" size="lg" onPress={() => navigation.navigate('Increase')} />
                                            </View>
                                        ) : (
                                            <Notice dir={dir} kind="success" icon="checkmark-circle">{t("Paid")}</Notice>
                                        )}
                                    </StageCard>
                                </View>
                            )}

                            <StageCard
                                dir={dir} copy={copy} icon="bus-outline"
                                title={t("Product dispatch status to the user's location")}
                                active={shipmentActive}
                                open={showShipment}
                                onPress={() => {
                                    if (data?.payment_status == 1 && data?.shipment_status) {
                                        setShowShipment(!showShipment)
                                    } else {
                                        showToastOrAlert(t('The product dispatch status is not specified.'))
                                    }
                                }}
                            >
                                <Notice dir={dir} kind="info" icon="bus-outline">{data?.shipment_status}</Notice>
                                {data?.shipment_status_descriptions && (
                                    <Notice dir={dir} kind="neutral" icon="chatbox-ellipses-outline" title={t('Loop description')}>{data?.shipment_status_descriptions}</Notice>
                                )}
                            </StageCard>

                            {/* مرحله دریافت سفارش - فعال بعد از پرداخت */}
                            <View onLayout={stageLayout('receive')}>
                                <StageCard
                                    dir={dir} copy={copy} icon="cube-outline"
                                    title={t("Receive product / order")}
                                    active={receiveActive}
                                    open={showReceive && receiveActive}
                                    onPress={() => {
                                        if (data?.payment_status == 1) {
                                            setShowReceive(!showReceive)
                                        } else {
                                            showToastOrAlert(t("Please complete the payment first."))
                                        }
                                    }}
                                >
                                    {data?.user_final_description ? (
                                        <Notice dir={dir} kind="success" icon="checkmark-circle" title={t("Submitted description")}>{data?.user_final_description}</Notice>
                                    ) : (
                                        <>
                                            <Text style={[ds.prompt, dir.bold, dir.align]}>{t("Please select one of the receiving statuses")}:</Text>
                                            <ChoiceGroup
                                                columns={2}
                                                value={showCustomReceive ? 'custom' : selectedReceiveOption}
                                                onChange={(v) => {
                                                    if (v === 'custom') {
                                                        setShowCustomReceive(true); setSelectedReceiveOption(null);
                                                    } else {
                                                        setSelectedReceiveOption(v); setShowCustomReceive(false); setCustomReceiveText('');
                                                    }
                                                }}
                                                options={receiveOptions}
                                            />
                                            {showCustomReceive && (
                                                <Field label={t("Description")} full>
                                                    <TextField multiline rows={3} placeholder={t("Enter your description...")} value={customReceiveText} onChangeText={setCustomReceiveText} />
                                                </Field>
                                            )}
                                            <View style={[ds.actionsRow, dir.row]}>
                                                <DButton title={t("Submit receive status")} icon="checkmark-done" variant="gold" loading={submittingReceive} onPress={handleSubmitReceive} />
                                            </View>
                                        </>
                                    )}
                                </StageCard>
                            </View>

                            {/* مرحله ثبت نظر - فعال بعد از تکمیل سفارش (status=2 و finished_at) */}
                            <View onLayout={stageLayout('rating')}>
                                <StageCard
                                    dir={dir} copy={copy} icon="star-outline"
                                    title={t("Submit review")}
                                    active={reviewRatingActive}
                                    open={showReviewRating && reviewRatingActive}
                                    onPress={() => {
                                        if (data?.status == 2 && data?.finished_at) {
                                            setShowReviewRating(!showReviewRating)
                                        } else {
                                            showToastOrAlert(t("This section will be activated after order completion."))
                                        }
                                    }}
                                >
                                    <OrderReviewRatingSection orderId={orderId} technicianId={data?.technician?.id} orderStatus={data?.status} finishedAt={data?.finished_at} />
                                </StageCard>
                            </View>
                        </View>

                        {/* ---------- Side ---------- */}
                        <View style={ds.side}>
                            {showPrices && (
                                <View style={[ds.summary, animate('loop-fade-up', '340ms', '120ms')]}>
                                    <View style={ds.heroStars} pointerEvents="none" />
                                    <View style={[ds.summaryHead, dir.row]}>
                                        <Ionicons name="receipt-outline" size={18} color={palette.gold} />
                                        <Text style={[ds.summaryTitle, dir.bold]}>{copy.costs}</Text>
                                    </View>
                                    <SummaryRow dir={dir} label={copy.basePrice} value={`${formatPrice(basePrice)} ${t("Tomans")}`} />
                                    {Number(data?.extra_price) > 0 && <SummaryRow dir={dir} label={t("Parts / Costs")} value={`+ ${formatPrice(Number(data?.extra_price))} ${t("Tomans")}`} />}
                                    {Number(data?.discount_price) > 0 && <SummaryRow dir={dir} label={copy.discount} value={`− ${formatPrice(Number(data?.discount_price))} ${t("Tomans")}`} good />}
                                    {totalDiscountedPrice < Number(minPrice?.price) && <SummaryRow dir={dir} label={t("Travel and tuition fees")} value={`+ ${formatPrice(200000)} ${t("Tomans")}`} />}
                                    <View style={[ds.summaryTotal, dir.row]}>
                                        <Text style={[ds.summaryTotalLabel, dir.bold]}>{t("Payable amount")}</Text>
                                        <Text style={[ds.summaryTotalValue, dir.bold]}>{formatPrice(payable)}</Text>
                                    </View>
                                    <Text style={[ds.summaryUnit, dir.light, dir.align]}>{t("Tomans")} · {t("Your wallet balance")}: {formatPrice(walletBalance)}</Text>
                                    {data?.payment_status == 1 ? (
                                        <Pill label={t("Paid")} kind="success" icon="checkmark-circle" />
                                    ) : paymentActive ? (
                                        <DButton title={copy.goPay} icon="card" variant="gold" block onPress={() => openStage('payment', setShowPayment)} />
                                    ) : (
                                        <Text style={[ds.summaryNote, dir.light, dir.align]}>{copy.payLater}</Text>
                                    )}
                                </View>
                            )}

                            {!!data?.technician && (
                                <Pressable onPress={() => openStage('technician', setShowTechnician)} style={({ hovered }) => [ds.techCard, dir.row, hovered && ds.techCardHover]}>
                                    {data?.technician?.profile_photo_path ? (
                                        <Image style={ds.techPhoto} source={{ uri: `${imageUri}/${data?.technician?.profile_photo_path}` }} />
                                    ) : (
                                        <View style={[ds.techPhoto, ds.techInitial]}>
                                            <Text style={[ds.techInitialText, dir.bold]}>{data?.technician?.name?.[0]}</Text>
                                        </View>
                                    )}
                                    <View style={ds.flex}>
                                        <Text style={[ds.techLabel, dir.light, dir.align]}>{copy.yourTechnician}</Text>
                                        <Text style={[ds.techName, dir.bold, dir.align]} numberOfLines={1}>{data?.technician?.name}</Text>
                                        {!!data?.technician?.technician_type && <Text style={[ds.techLabel, dir.light, dir.align]} numberOfLines={1}>{data?.technician?.technician_type}</Text>}
                                    </View>
                                    <View style={[ds.rating, dir.row]}>
                                        <Ionicons name="star" size={12} color="#f5b301" />
                                        <Text style={[ds.ratingText, dir.bold]}>{Number(data?.technician?.average_rating || 0).toFixed(1)}</Text>
                                    </View>
                                </Pressable>
                            )}

                            <AsideAction icon="headset-outline" title={copy.help} text={copy.helpText}>
                                <DButton title={copy.helpButton} icon="chatbubbles-outline" variant="gold" block onPress={() => navigation.navigate('MessageScreen')} />
                            </AsideAction>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const ds = StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    center: { alignSelf: 'center' },

    hero: {
        alignItems: 'center',
        gap: 18,
        padding: 24,
        borderRadius: radii.xl,
        overflow: 'hidden',
        backgroundImage: gradients.hero,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        boxShadow: elevation.floating,
    },
    heroStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
        borderWidth: 1.5,
        boxShadow: '0 0 30px rgba(79, 143, 224, 0.35)',
    },
    heroEyebrow: { color: onDark.soft, fontSize: 13 },
    heroNumber: { color: palette.gold, fontSize: 14, letterSpacing: 0.5 },
    heroTitle: { color: onDark.text, fontSize: 24, lineHeight: 38 },
    heroPills: { gap: 8, flexWrap: 'wrap', marginTop: 4 },
    heroActions: { gap: 10, alignItems: 'center' },

    journey: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: radii.lg,
        backgroundColor: surface.card,
        borderWidth: 1,
        borderColor: surface.border,
        boxShadow: elevation.card,
    },
    journeyStep: {
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: radii.md,
        cursor: 'pointer',
        transitionProperty: 'background-color',
        transitionDuration: motion.fast,
    },
    journeyStepHover: { backgroundColor: surface.hover },
    journeyDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: surface.sunken,
        borderWidth: 1,
        borderColor: surface.borderStrong,
    },
    journeyDotDone: { backgroundColor: palette.success, borderColor: palette.success },
    journeyDotCurrent: {
        backgroundImage: gradients.gold,
        borderColor: 'rgba(233, 179, 8, 0.9)',
        boxShadow: '0 0 0 5px rgba(255, 215, 0, 0.18)',
    },
    journeyLabel: { fontSize: 12.5, color: surface.title },
    journeyLabelTodo: { color: surface.faint },
    journeyLine: { flex: 1, height: 2, minWidth: 16, marginBottom: 26, borderRadius: 1, backgroundColor: surface.borderStrong },
    journeyLineOn: { backgroundColor: palette.success },

    main: { flex: 1, minWidth: 0, gap: 12 },
    side: { width: 360, flexShrink: 0, gap: 16 },

    stage: {
        borderRadius: radii.lg,
        backgroundColor: surface.card,
        borderWidth: 1,
        borderColor: surface.border,
        boxShadow: elevation.card,
        overflow: 'hidden',
        transitionProperty: 'border-color, box-shadow',
        transitionDuration: motion.base,
    },
    stageOpen: { borderColor: 'rgba(233, 179, 8, 0.45)', boxShadow: elevation.raised },
    stageLocked: { backgroundColor: surface.cardMuted },
    stageHead: {
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 18,
        minHeight: 62,
        cursor: 'pointer',
        transitionProperty: 'background-color',
        transitionDuration: motion.fast,
    },
    stageHeadHover: { backgroundColor: surface.hover },
    stageIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: surface.sunken,
    },
    stageIconOn: { backgroundImage: gradients.gold },
    stageTitle: { flex: 1, fontSize: 15, color: surface.title },
    stageTitleLocked: { color: surface.faint },
    stageBody: { gap: 16, paddingHorizontal: 18, paddingBottom: 20, paddingTop: 4, borderTopWidth: 1, borderTopColor: surface.border },

    facts: { flexWrap: 'wrap', gap: 10, paddingTop: 14 },
    fact: {
        flexGrow: 1,
        flexBasis: 200,
        gap: 6,
        padding: 14,
        borderRadius: radii.md,
        backgroundColor: surface.cardMuted,
        borderWidth: 1,
        borderColor: surface.border,
    },
    factHead: { alignItems: 'center', gap: 6 },
    factLabel: { fontSize: 12, color: surface.faint },
    factValue: { fontSize: 14, color: surface.title, lineHeight: 22 },

    block: { gap: 10 },
    blockTitle: { alignItems: 'center', gap: 8 },
    blockTitleText: { fontSize: 14, color: surface.title },

    serviceGroup: {
        gap: 6,
        padding: 14,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: surface.border,
    },
    servicePackage: { backgroundColor: 'rgba(255, 215, 0, 0.07)', borderColor: 'rgba(233, 179, 8, 0.35)' },
    serviceHead: { alignItems: 'center', gap: 6, marginBottom: 2 },
    serviceTitle: { flex: 1, fontSize: 13.5, color: surface.brandText },
    serviceItem: { gap: 4 },
    serviceRow: { alignItems: 'center', gap: 10, minHeight: 26 },
    serviceBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.gold },
    serviceText: { flex: 1, fontSize: 13.5, color: surface.text, lineHeight: 22 },
    serviceValue: {
        minWidth: 28,
        paddingHorizontal: 8,
        height: 24,
        lineHeight: 24,
        textAlign: 'center',
        borderRadius: radii.pill,
        fontSize: 12,
        color: surface.brandText,
        backgroundColor: surface.brandTint,
    },
    serviceNote: {
        fontSize: 12.5,
        color: surface.muted,
        lineHeight: 21,
        padding: 10,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: surface.borderStrong,
    },

    quote: { padding: 14, borderRadius: radii.md, backgroundColor: surface.cardMuted },
    quoteRtl: { borderRightWidth: 3, borderRightColor: palette.gold },
    quoteLtr: { borderLeftWidth: 3, borderLeftColor: palette.gold },
    quoteText: { fontSize: 13.5, color: surface.text, lineHeight: 24 },

    gallery: { flexWrap: 'wrap', gap: 10 },
    thumb: {
        width: 110,
        height: 110,
        borderRadius: radii.md,
        overflow: 'hidden',
        backgroundColor: surface.sunken,
        cursor: 'zoom-in',
        transitionProperty: 'transform, box-shadow',
        transitionDuration: motion.fast,
    },
    thumbLarge: { width: 230 },
    thumbHover: { transform: 'translateY(-2px)', boxShadow: elevation.raised },
    thumbImage: { width: '100%', height: '100%' },

    address: {
        alignItems: 'flex-start',
        gap: 12,
        padding: 14,
        borderRadius: radii.md,
        backgroundColor: surface.cardMuted,
    },
    addressIcon: {
        width: 36,
        height: 36,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: surface.brandTint,
    },
    addressText: { fontSize: 13.5, color: surface.title, lineHeight: 23 },
    addressMeta: { fontSize: 12.5, color: surface.muted, lineHeight: 21 },
    map: { height: 240, borderRadius: radii.md, overflow: 'hidden', borderWidth: 1, borderColor: surface.border },

    notice: { alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: radii.md },
    noticeIcon: { marginTop: 2 },
    noticeTitle: { fontSize: 13.5, lineHeight: 22 },
    noticeText: { fontSize: 13, color: surface.text, lineHeight: 23 },

    prompt: { fontSize: 13.5, color: surface.title },
    actionsRow: { gap: 10, justifyContent: 'flex-end' },

    payRow: {
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: radii.md,
        backgroundColor: surface.brandTint,
    },
    payLabel: { fontSize: 14, color: surface.title },
    payValue: { fontSize: 20, color: surface.brandText },
    payUnit: { fontSize: 12, color: surface.faint },
    payRowMuted: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
    payMuted: { fontSize: 13, color: surface.muted },
    payActions: { gap: 10, flexWrap: 'wrap', paddingTop: 4 },

    summary: {
        gap: 10,
        padding: 20,
        borderRadius: radii.xl,
        overflow: 'hidden',
        backgroundImage: gradients.hero,
        boxShadow: elevation.floating,
    },
    summaryHead: { alignItems: 'center', gap: 8, marginBottom: 4 },
    summaryTitle: { color: onDark.text, fontSize: 15 },
    summaryRow: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    summaryLabel: { color: onDark.soft, fontSize: 13 },
    summaryValue: { color: onDark.text, fontSize: 13.5 },
    summaryTotal: {
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingTop: 12,
        marginTop: 2,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.12)',
    },
    summaryTotalLabel: { color: onDark.soft, fontSize: 13.5 },
    summaryTotalValue: { color: palette.gold, fontSize: 26 },
    summaryUnit: { color: onDark.muted, fontSize: 12, marginTop: -4 },
    summaryNote: { color: onDark.muted, fontSize: 12.5, lineHeight: 21 },

    techCard: {
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: radii.lg,
        backgroundColor: surface.card,
        borderWidth: 1,
        borderColor: surface.border,
        boxShadow: elevation.card,
        cursor: 'pointer',
        transitionProperty: 'transform, box-shadow',
        transitionDuration: motion.fast,
    },
    techCardHover: { transform: 'translateY(-2px)', boxShadow: elevation.raised },
    techPhoto: { width: 48, height: 48, borderRadius: 24, backgroundColor: surface.sunken },
    techInitial: { alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(135deg, #134379 0%, #002b54 100%)' },
    techInitialText: { color: palette.white, fontSize: 18 },
    techLabel: { fontSize: 12, color: surface.faint },
    techName: { fontSize: 15, color: surface.title },
    rating: {
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        height: 26,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(245, 179, 1, 0.12)',
    },
    ratingText: { fontSize: 12, color: '#9a6b00' },
});

// محافظت از صفحه جزئیات سفارش - نیاز به تایید کامل
export default Details;
