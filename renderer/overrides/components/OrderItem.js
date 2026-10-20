/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/OrderItem.js
 *
 * One order in the orders / canceled-orders lists, drawn as a desktop card
 * that sits in a grid: status at a glance in the header, a five-step progress
 * bar (registered → technician → on the way → in progress → done), the visit
 * time as a labelled row, the technician as a compact strip, and the actions
 * in the footer.
 *
 * The behaviour is the mobile file's: the same requests (cancel / start /
 * end), the same buttons for each status (`buttonConfig`), the same
 * confirmation and rating modals, and a press on the card opens Details.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { imageUri, uri } from '@services/URL';
import { fetchOrders } from '@slices/ordersSlice';
import { calculateDaysDifference, formatDate, showToastOrAlert } from '@helpers/Common';
import ConfirmationModal from '@components/ConfirmationModal';
import RateModal from '@components/RateModal';

import { DButton, IconTile, Pill, formatNumber, useDir } from '@desktop/ui';
import { elevation, motion, palette, radii, surface, tone } from '@desktop/desktopTheme';
import { animate } from '@desktop/globalStyles';
import { orderStatusMeta } from '@desktop/orderStatus';
import { CANCELLED_BY_LABEL_KEYS, cancelledByOf, isCancelledOrder } from '@services/orderStatus';

const STEPS = {
    fa: ['ثبت', 'تکنسین', 'در راه', 'انجام', 'تکمیل'],
    en: ['Placed', 'Technician', 'On the way', 'Working', 'Done'],
};

/** Where the order is: five segments filled up to the current step. */
function OrderProgress({ item, dir }) {
    const done = [
        true,
        !!item?.technician_id,
        !!item?.set_off_at || !!item?.arrived_at,
        !!item?.started_at,
        Number(item?.status) === 2,
    ];
    const reached = done.lastIndexOf(true);
    const labels = STEPS[dir.rtl ? 'fa' : 'en'];
    return (
        <View style={styles.progress}>
            <View style={[styles.progressBar, dir.row]}>
                {labels.map((label, i) => (
                    <View
                        key={label}
                        style={[
                            styles.progressSeg,
                            i <= reached && styles.progressSegOn,
                            i === reached && reached < labels.length - 1 && styles.progressSegCurrent,
                        ]}
                    />
                ))}
            </View>
            <View style={[styles.progressLabels, dir.row]}>
                {labels.map((label, i) => (
                    <Text
                        key={label}
                        style={[styles.progressLabel, i === reached ? dir.bold : dir.light, i <= reached && styles.progressLabelOn]}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                ))}
            </View>
        </View>
    );
}

export default function OrderItem({ item, navigation, user }) {

    const { t } = useTranslation();
    const dir = useDir();
    const dispatch = useDispatch();
    const token = useSelector((state) => state?.auth?.token);
    const [loading, setLoading] = useState(false);
    const [cancelModal, setCancelModal] = useState(false);
    const [startModal, setStartModal] = useState(false);
    const [endModal, setEndModal] = useState(false);
    const [rateModal, setRateModal] = useState(false);

    const cancel = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${uri}/orders/cancel`, { orderId: item?.id }, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } })
            if (response.status == 200) {
                dispatch(fetchOrders(token));
                navigation.navigate('CanceledOrdersScreen');
            }
        } catch (error) {
            const message = error?.response ? (error?.response?.status ? error?.response?.data?.message : t('An unexpected error occurred!')) : t('Network error!');
            showToastOrAlert(message);
        } finally {
            setLoading(false);
        }
    };

    const start = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${uri}/orders/start`, { orderId: item?.id }, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } })

            if (response.status == 200) {
                dispatch(fetchOrders(token))
            }
        } catch (error) {
            const message = error?.response ? (error?.response?.status ? error?.response?.data?.message : t('An unexpected error occurred!')) : t('Network error!');
            showToastOrAlert(message);
        } finally {
            setLoading(false);
        }
    };

    const end = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${uri}/orders/end`, { orderId: item?.id }, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } })
            if (response.status == 200) {
                dispatch(fetchOrders(token));
                navigation.navigate('OrdersScreen');
            }
        } catch (error) {
            const message = error?.response ? (error?.response?.status ? error?.response?.data?.message : t('An unexpected error occurred!')) : t('Network error!');
            showToastOrAlert(message);
        } finally {
            setLoading(false);
        }
    };

    const buttonConfig = useMemo(() => {
        const status = item?.status;
        if (status == 0) {
            return {
                text1: t('Pre-receipt'),
                text2: t('Cancel Order'),
                onPress1: () => navigation.navigate('OrderReceipt', { orderId: item?.id }),
                onPress2: () => setCancelModal(true),
            };
        }

        if (status == 2 && user?.apple_check != 1) {
            return {
                text1: t('Order Receipt'),
                onPress1: () => navigation.navigate('OrderReceipt', { orderId: item?.id }),
            };
        }
        if (status >= 3) {
            return {
                text1: ((item?.status == 4 && item?.technician_cancel_reason != 'اعلام حضور / لغو از سوی تکنسین') || (item?.status == 3 && item?.arrived_at)) ? t('Receipt') : '',
                onPress1: () => navigation.navigate('OrderReceipt', { orderId: item?.id }),
            };
        }
        return null;
    }, [item]);

    // لغوشده یعنی کد ۳ تا ۶ یا `cancelled_by` از سرور (services/orderStatus):
    // لیبل «ناموفق» و زیر شماره‌ی سفارش «لغو از سوی ...» — «تغییرات اپ کاربر» بند ۱.
    const isCanceled = isCancelledOrder(item);
    const cancelledBy = cancelledByOf(item);
    const statusMeta = orderStatusMeta(item, t);
    const meta = isCanceled
        ? { ...statusMeta, kind: 'danger', label: t('Order failed'), icon: statusMeta.group === 'canceled' ? statusMeta.icon : 'close-circle-outline' }
        : statusMeta;
    const visit = item?.is_urgent > 0
        ? t('Urgent Request')
        : formatDate(item?.date) + t(' at ') + item?.time?.split(':')?.slice(0, 2)?.join(':');
    const cancelReason = item?.status == 4
        ? item?.technician_cancel_reason
        : (item?.status == 3 && item?.user_cancellation_reason && item?.user_cancellation_date) ? item?.user_cancellation_reason : null;
    const technician = item?.technician;
    const orderNumber = formatNumber(item?.id, dir.lang).replace(/[,٬]/g, '');

    const infoRow = (icon, label, value, valueStyle) => (
        <View style={[styles.infoRow, dir.row]}>
            <View style={[styles.infoLabel, dir.row]}>
                <Ionicons name={icon} size={15} color={surface.faint} />
                <Text style={[styles.infoLabelText, dir.light, dir.align]}>{label}</Text>
            </View>
            <Text style={[styles.infoValue, dir.bold, valueStyle]} numberOfLines={1}>{value}</Text>
        </View>
    );

    return (
        <Pressable
            onPress={() => { navigation.navigate('Details', { orderId: item?.id }); }}
            style={({ hovered }) => [styles.card, animate('loop-fade-up', '320ms'), hovered && styles.cardHover]}
        >
            {({ hovered }) => (
                <>
                    <View style={[styles.accent, { backgroundColor: (tone[meta.kind] || tone.neutral).fg }]} />

                    {/* Header */}
                    <View style={[styles.header, dir.row]}>
                        <IconTile icon={meta.icon} kind={meta.kind} size={44} />
                        <View style={styles.headerText}>
                            <Text style={[styles.title, dir.bold, dir.align]} numberOfLines={1}>
                                {item?.category?.title}
                            </Text>
                            <Text style={[styles.subtitle, dir.light, dir.align]} numberOfLines={1}>
                                {t('Order ID: ')}{orderNumber}
                            </Text>
                            {!!cancelledBy && (
                                <Text style={[styles.cancelledBy, dir.bold, dir.align]} numberOfLines={1}>
                                    {t(CANCELLED_BY_LABEL_KEYS[cancelledBy])}
                                </Text>
                            )}
                        </View>
                        <Pill label={meta.label} kind={meta.kind} dot />
                    </View>

                    {!isCanceled && <OrderProgress item={item} dir={dir} />}

                    {/* Details */}
                    <View style={styles.info}>
                        {item?.status != 2 && infoRow(
                            item?.is_urgent > 0 ? 'flash-outline' : 'calendar-outline',
                            t('Technician Visit Time'),
                            visit,
                            item?.is_urgent > 0 && { color: palette.danger },
                        )}
                        {(item?.status == 2 && user?.apple_check != 1) && (
                            <View style={[styles.infoRow, dir.row]}>
                                <View style={[styles.infoLabel, dir.row]}>
                                    <Ionicons name="card-outline" size={15} color={surface.faint} />
                                    <Text style={[styles.infoLabelText, dir.light, dir.align]}>{t('Payment Status')}</Text>
                                </View>
                                <Pill
                                    size="sm"
                                    kind={item?.payment_status > 0 ? 'success' : 'danger'}
                                    icon={item?.payment_status > 0 ? 'checkmark' : 'alert'}
                                    label={item?.payment_status > 0 ? t('Paid') : t('Unpaid')}
                                />
                            </View>
                        )}
                    </View>

                    {/* Technician */}
                    {!!item?.technician_id && (
                        <View style={[styles.tech, dir.row]}>
                            <View>
                                {technician?.profile_photo_path ? (
                                    <Image style={styles.techPhoto} source={{ uri: `${imageUri}/${technician?.profile_photo_path}` }} />
                                ) : (
                                    <View style={[styles.techPhoto, styles.techInitial]}>
                                        <Text style={[styles.techInitialText, dir.bold]}>{technician?.name?.[0]}</Text>
                                    </View>
                                )}
                                <View style={styles.online} />
                            </View>
                            <View style={styles.techText}>
                                <Text style={[styles.techName, dir.bold, dir.align]} numberOfLines={1}>{technician?.name}</Text>
                                <Text style={[styles.techMeta, dir.light, dir.align]} numberOfLines={1}>
                                    {technician?.technician_type}
                                    {' · '}
                                    {calculateDaysDifference(technician?.created_at)}{t(' days experience')}
                                </Text>
                            </View>
                            <View style={[styles.rating, dir.row]}>
                                <Ionicons name="star" size={12} color="#f5b301" />
                                <Text style={[styles.ratingText, dir.bold]}>
                                    {formatNumber(Number(technician?.average_rating || 0).toFixed(1), dir.lang)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Why it was cancelled */}
                    {!!cancelReason && (
                        <View style={[styles.reason, dir.row]}>
                            <Ionicons name="information-circle" size={16} color={palette.danger} />
                            <Text style={[styles.reasonText, dir.light, dir.align]} numberOfLines={2}>
                                <Text style={dir.bold}>{t('Cancel reason')}: </Text>
                                {cancelReason}
                            </Text>
                        </View>
                    )}

                    <View style={styles.spacer} />

                    {/* Actions */}
                    <View style={[styles.footer, dir.row]}>
                        <View style={[styles.actions, dir.row]}>
                            {!!buttonConfig?.text1 && (
                                <DButton
                                    title={buttonConfig.text1}
                                    icon="document-text-outline"
                                    variant="soft"
                                    size="sm"
                                    loading={loading}
                                    onPress={buttonConfig.onPress1}
                                />
                            )}
                            {!!buttonConfig?.text2 && !isCanceled && (
                                <DButton
                                    title={buttonConfig.text2}
                                    icon="close-outline"
                                    variant="danger"
                                    size="sm"
                                    loading={loading}
                                    onPress={buttonConfig.onPress2}
                                />
                            )}
                        </View>
                        <View style={[styles.details, dir.row, hovered && styles.detailsOn]}>
                            <Text style={[styles.detailsText, dir.bold]}>{t('View Details')}</Text>
                            <Ionicons name={dir.forward} size={14} color={palette.brandBright} />
                        </View>
                    </View>

                    <RateModal rateModal={rateModal} setRateModal={setRateModal} orderId={item?.id} data={item?.user_rate} />
                    <ConfirmationModal title={t('Cancel Order')} message={t('Are you sure you want to cancel your order?')} action={() => cancel()} confirmationModal={cancelModal} setConfirmationModal={setCancelModal} />
                    <ConfirmationModal title={t('Start Order')} message={t('Do you confirm that the technician has started your order?')} action={() => start()} confirmationModal={startModal} setConfirmationModal={setStartModal} />
                    <ConfirmationModal title={t('End Order')} message={t('Do you confirm that the technician\'s work is finished?')} action={() => end()} confirmationModal={endModal} setConfirmationModal={setEndModal} />
                </>
            )}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: surface.card,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: surface.border,
        boxShadow: elevation.card,
        padding: 18,
        gap: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transitionProperty: 'transform, box-shadow, border-color',
        transitionDuration: motion.base,
        transitionTimingFunction: motion.ease,
    },
    cardHover: {
        transform: 'translateY(-3px)',
        boxShadow: elevation.raised,
        borderColor: 'rgba(29, 95, 174, 0.22)',
    },
    accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.85 },
    header: { alignItems: 'center', gap: 12 },
    headerText: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 15.5, color: surface.title },
    subtitle: { fontSize: 12, color: surface.faint },
    cancelledBy: { fontSize: 12, color: palette.danger },
    info: {
        gap: 2,
        borderRadius: radii.md,
        backgroundColor: surface.cardMuted,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    infoRow: { alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 36 },
    infoLabel: { alignItems: 'center', gap: 8 },
    infoLabelText: { fontSize: 12.5, color: surface.muted },
    infoValue: { fontSize: 13, color: surface.title, flexShrink: 1 },
    tech: {
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: surface.border,
    },
    techPhoto: { width: 42, height: 42, borderRadius: 21, backgroundColor: surface.sunken },
    techInitial: { alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(135deg, #134379 0%, #002b54 100%)' },
    techInitialText: { color: palette.white, fontSize: 16 },
    online: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: palette.success,
        borderWidth: 2,
        borderColor: surface.card,
    },
    techText: { flex: 1, minWidth: 0, gap: 2 },
    techName: { fontSize: 13.5, color: surface.title },
    techMeta: { fontSize: 11.5, color: surface.faint },
    rating: {
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        height: 26,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(245, 179, 1, 0.12)',
    },
    ratingText: { fontSize: 12, color: '#9a6b00' },
    reason: {
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        borderRadius: radii.md,
        backgroundColor: tone.danger.bg,
    },
    reasonText: { flex: 1, fontSize: 12.5, color: '#8c2b2b', lineHeight: 21 },
    spacer: { flex: 1 },
    progress: { gap: 6 },
    progressBar: { gap: 4 },
    progressSeg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: surface.sunken },
    progressSegOn: { backgroundColor: palette.success },
    progressSegCurrent: { backgroundImage: 'linear-gradient(90deg, #ffe45c 0%, #ffd700 50%, #e9b308 100%)' },
    progressLabels: { gap: 4 },
    progressLabel: { flex: 1, fontSize: 10.5, color: surface.faint, textAlign: 'center' },
    progressLabelOn: { color: surface.title },
    footer: {
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: surface.border,
        minHeight: 46,
    },
    actions: { alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    details: {
        alignItems: 'center',
        gap: 4,
        opacity: 0.7,
        transitionProperty: 'opacity',
        transitionDuration: motion.fast,
    },
    detailsOn: { opacity: 1 },
    detailsText: { fontSize: 12.5, color: palette.brandBright },
});
