import { OrderTextInput as TextInput, OrderTouchable as TouchableOpacity } from '../../components/OrderReadOnlyControls';
import { Text, View,  } from 'react-native'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import Ionicons from '@expo/vector-icons/Ionicons'
import jalaali from 'jalaali-js'
import moment from 'moment-jalaali'
import { useTranslation } from 'react-i18next'

import { uri } from '@services/URL'
import NewStyles from '@styles/NewStyles'
import { formatDate, showToastOrAlert } from '@helpers/Common'
import { themeColor0, themeColor1, themeColor3, themeColor4, themeColor5, themeColor7 } from '@theme/Color'
import Button from '@components/Button'
import ConfirmationModal from '@components/ConfirmationModal'
import i18n from 'i18next'
import { createDirectionalStyles } from '@styles/directionalStyles';
const OrderReturnTimeSection = ({ data, orderId, onUpdate }) => {
    const { t } = useTranslation()
    const token = useSelector((state) => state?.auth?.token)
    const [selectedOption, setSelectedOption] = useState(null)
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [customText, setCustomText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [confirmModal, setConfirmModal] = useState(false)
    const lang = i18n.resolvedLanguage ?? i18n.language ?? 'en';
    // گزینه‌های از پیش تعریف شده
    const options = [
        {
            id: 1,
            icon: 'call-outline',
            text: t("Contact me at the return time")
        },
        {
            id: 2,
            icon: 'calendar-outline',
            text: t("What date will the product be returned?")
        },
        {
            id: 3,
            icon: 'speedometer-outline',
            text: t("I'm in a hurry, please do it faster")
        }
    ]

    // چک کردن قفل بودن (ثبت شده)
    const isLocked = data?.user_return_followup_description

    const handleSubmit = async () => {
        setConfirmModal(false)
        setSubmitting(true)
        try {
            const requestText = showCustomInput ? customText : options.find(opt => opt.id == selectedOption)?.text

            const response = await axios.post(
                `${uri}/orders/${orderId}/return-followup`,
                {
                    description: requestText
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
                showToastOrAlert(response.data?.message || t("Follow-up request submitted successfully"))
                if (onUpdate) onUpdate()
            }
        } catch (error) {
            const message = error?.response?.data?.message || t("Error submitting follow-up request")
            showToastOrAlert(message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleOptionSelect = (optionId) => {
        if (!isLocked) {
            setSelectedOption(optionId)
            setShowCustomInput(false)
            setCustomText('')
        }
    }

    const handleCustomRequest = () => {
        if (!isLocked) {
            setShowCustomInput(true)
            setSelectedOption(null)
        }
    }

    const canSubmit = (selectedOption && !showCustomInput) || (showCustomInput && customText.trim().length > 0)

    // فرمت کردن تاریخ و زمان عودت
    const hasReturnDateTime = data?.return_date && data?.return_time
    const formattedReturnDate = hasReturnDateTime ? formatDate(data?.return_date) : null
    const formattedReturnTime = hasReturnDateTime ? data?.return_time?.split(':')?.slice(0, 2)?.join(':') : null

    return (
        <View style={[{ width: '90%', alignSelf: 'center', paddingBottom: 10 }, NewStyles.center]}>
            {/* توضیحات */}
            <View style={[styles.noticeBox]}>
                <Text style={[NewStyles.text10]}>
                    {isLocked
                        ? t("Your return time request has been submitted")
                        : t("Dear user, your product is being repaired at Loop. Please specify how you want to receive your product.")}
                </Text>
            </View>

            {/* نمایش تاریخ و زمان عودت */}
            {hasReturnDateTime && (
                <View style={[{ backgroundColor: themeColor4.bgColor(1), width: '100%', paddingVertical: 15, paddingHorizontal: '5%', gap: 10, marginBottom: 15 }, NewStyles.border10]}>
                    <View style={[{ backgroundColor: themeColor3.bgColor(0.2), padding: 10 }, NewStyles.border10, NewStyles.center]}>
                        <View style={[NewStyles.row, { gap: 5 }]}>
                            <Ionicons name="time-outline" size={20} color={themeColor0.bgColor(1)} />
                            <Text style={NewStyles.title}>{t("Product return date and time")}</Text>
                        </View>
                    </View>
                    <View style={NewStyles.rowWrapper}>
                        <Text style={[NewStyles.text]}>{t("Return date")}</Text>
                        <Text style={[NewStyles.text10]}>{formattedReturnDate}</Text>
                    </View>
                    <View style={NewStyles.rowWrapper}>
                        <Text style={[NewStyles.text]}>{t("Return time")}</Text>
                        <Text style={[NewStyles.text10]}>{formattedReturnTime}</Text>
                    </View>
                </View>
            )}

            {/* وضعیت ثبت شده */}
            {isLocked ? (
                <View style={[styles.lockedBox, NewStyles.center, NewStyles.border10]}>
                    <Ionicons
                        name="checkmark-circle"
                        size={40}
                        color={themeColor7.bgColor(1)}
                    />
                    <Text style={[NewStyles.title, { color: themeColor7.bgColor(1) }]}>
                        {t("Request submitted")}
                    </Text>
                    {data?.user_return_followup_description && (
                        <>
                            <Text style={[NewStyles.text10, { marginTop: 10 }]}>{t("Your request:")}</Text>
                            <View style={[styles.requestBox, NewStyles.border10]}>
                                <Text style={[NewStyles.text10]}>{data?.user_return_followup_description}</Text>
                            </View>
                        </>
                    )}
                </View>
            ) : (
                <View style={{ width: '100%', marginTop: 15, gap: 15 }}>
                    {/* گزینه‌های از پیش تعریف شده */}
                    <View style={{ gap: 10 }}>
                        <Text style={NewStyles.text}>{t("Select request:")}</Text>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionBox,
                                    NewStyles.border10,
                                    selectedOption == option.id && styles.optionBoxSelected
                                ]}
                                onPress={() => handleOptionSelect(option.id)}
                            >
                                <Ionicons
                                    name={option.icon}
                                    size={24}
                                    color={selectedOption == option.id ? themeColor0.bgColor(1) : themeColor0.bgColor(0.5)}
                                />
                                <Text style={[
                                    NewStyles.text10,
                                    { flex: 1 },
                                    selectedOption == option.id && { color: themeColor0.bgColor(1), fontFamily: 'VazirBold' }
                                ]}>
                                    {option.text}
                                </Text>

                            </TouchableOpacity>
                        ))}

                        {/* دکمه ثبت توضیح سفارشی */}
                        <TouchableOpacity
                            style={[
                                styles.optionBox,
                                NewStyles.border10,
                                showCustomInput && styles.optionBoxSelected
                            ]}
                            onPress={handleCustomRequest}
                        >
                            <Ionicons
                                name="create-outline"
                                size={24}
                                color={showCustomInput ? themeColor0.bgColor(1) : themeColor0.bgColor(0.5)}
                            />
                            <Text style={[
                                NewStyles.text10,
                                { flex: 1 },
                                showCustomInput && { color: themeColor0.bgColor(1), fontFamily: 'VazirBold' }
                            ]}>
                                {t("Submit custom description")}
                            </Text>

                        </TouchableOpacity>
                    </View>

                    {/* فیلد توضیحات سفارشی */}
                    {showCustomInput && (
                        <View style={{ gap: 5 }}>
                            <Text style={NewStyles.text}>{t("Enter your description:")}</Text>
                            <TextInput
                                style={[styles.textInput, NewStyles.border10]}
                                placeholder={t("Enter your return time details...")}
                                placeholderTextColor={themeColor0.bgColor(0.4)}
                                multiline
                                numberOfLines={4}
                                value={customText}
                                onChangeText={setCustomText}
                                textAlignVertical="top"
                            />
                        </View>
                    )}

                    {/* دکمه ثبت */}
                    {canSubmit && <Button
                        title={t("Submit Request")}
                        onPress={() => setConfirmModal(true)}
                        loading={submitting}
                        textStyle={NewStyles.text4}

                    />}

                    <Text style={[NewStyles.text10, { textAlign: 'center', color: themeColor0.bgColor(0.6) }]}>
                        {t("Your request will be sent to Loop support")}
                    </Text>
                </View>
            )}

            {/* Modal */}
            <ConfirmationModal
                title={t("Submit return time request")}
                message={t("Are you sure you want to submit this request?")}
                action={handleSubmit}
                confirmationModal={confirmModal}
                setConfirmationModal={setConfirmModal}
            />
        </View>
    )
}

export default OrderReturnTimeSection

const styles = createDirectionalStyles((isRTL) => ({
    noticeBox: {
        backgroundColor: themeColor1.bgColor(1),
        padding: 10,
        ...NewStyles.border10,
        marginBottom: 12,
        width: '100%',
    },
    optionBox: {
        backgroundColor: themeColor4.bgColor(1),
        paddingVertical: 15,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    optionBoxSelected: {
        backgroundColor: themeColor1.bgColor(1),

    },
    lockedBox: {
        backgroundColor: themeColor4.bgColor(1),
        padding: 20,
        marginTop: 15,
        width: '100%',
        gap: 10,
    },
    requestBox: {
        backgroundColor: themeColor5.bgColor(1),
        padding: 15,
        width: '100%',
    },
    textInput: {
        backgroundColor: themeColor4.bgColor(1),
        paddingHorizontal: 15,
        paddingVertical: 12,
        minHeight: 100,
        fontSize: 14,
        fontFamily: 'VazirLight',
        color: themeColor0.bgColor(1),
        textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr',
    },
}))
