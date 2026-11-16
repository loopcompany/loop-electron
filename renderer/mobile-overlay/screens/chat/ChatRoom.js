import useRealtimeRefresh from '../../hooks/useRealtimeRefresh';
import { View, TextInput, Pressable, ImageBackground, Platform, KeyboardAvoidingView, Text, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { createStyles } from '@styles/NewStyles';
import { uri } from '@services/URL';
import { handleError, showToastOrAlert } from '@helpers/Common';
import NewStyles from '@styles/NewStyles';
import { themeColor0, themeColor1, themeColor10, themeColor3, themeColor4, themeColor5, themeColor6 } from '@theme/Color';
import MessagesList from './MessagesList';
import ScreenHeaders from '@components/ScreenHeaders';

export default function ChatRoom({ route }) {
  useRealtimeRefresh(["chat", "orders"], () => { if (token && technicianId) return fetchData(); });

    const { t, i18n } = useTranslation();
    const NewStyles = useMemo(
        () => createStyles(i18n.language),
        [i18n.language]
    );
    // const styles = useMemo(()=> createLocalStyles(NewStyles), [NewStyles]);
    const technicianId = route?.params?.technicianId;
    const [message, setMessage] = useState('');
    const token = useSelector((state) => state?.auth?.token);
    const [refreshing, setRefreshing] = useState(true)
    const [loading, setLoading] = useState(false)

    const [data, setData] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(true);

    const fetchData = async () => {
        try {
            // دریافت پیام‌ها - GET با query parameter
            const response = await axios.get(
                `${uri}/chats/messages?technician_id=${technicianId}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // بررسی ساختار جدید response
            if (response.data?.success) {
                setData(response.data.messages || []);
                setIsChatOpen(response.data.is_chat_open !== false);
            } else {
                setData(response.data || []);
            }

            // علامت‌گذاری به عنوان خوانده شده - POST با body
            await axios.post(
                `${uri}/chats/mark-read`,
                { technician_id: technicianId },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            handleError(error, t)
        } finally {
            setRefreshing(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [refreshing]);

    const send = async () => {
        setLoading(true)
        try {
            const response = await axios.post(
                `${uri}/chats/send`,
                {
                    message,
                    technician_id: technicianId
                },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 201 || response.status === 200) {
                if (response.data?.success) {
                    fetchData();
                    setMessage('');
                }
            }
        } catch (error) {
            // بررسی خطای 403 - چت بسته شده
            if (error?.response?.status === 403) {
                const message = error?.response?.data?.message || t('Chat is closed. There is no active order.');
                showToastOrAlert(message);
                setIsChatOpen(false);
            } else {
                const message = error?.response ? t('An unexpected error occurred!') : t('Network error!');
                showToastOrAlert(message);
            }
        } finally {
            setLoading(false)
        }
    }

    // بررسی وضعیت بسته بودن چت
    const isClosed = !isChatOpen || data?.[0]?.is_closed == 1;

    // const insets = useSafeAreaInsets();

    return (
        <View style={[NewStyles.container, {
            // marginTop: insets.top,
            // marginBottom: insets.bottom * 3,
        }]}>
            <ScreenHeaders title={t('Message to Loop technician')} />
            <KeyboardAvoidingView behavior={'padding'} keyboardVerticalOffset={Platform.OS == 'ios' ? 90 : 0} style={{ flex: 1 }} >
                <MessagesList messages={data} refreshing={refreshing} onRefresh={() => { fetchData() }} />
                {!isClosed ?
                    <View style={[{ paddingBottom: Platform.OS === 'web' ? 100 : 70, borderTopColor: themeColor1.bgColor(1), borderTopWidth: 1, }]}>
                        <View style={[NewStyles.rowWrapper, { paddingRight: 10 }]}>
                            <View style={[NewStyles.rowWrapper, { paddingVertical: 5 }]}>
                                <Pressable style={[{ padding: 10, aspectRatio: 1, backgroundColor: themeColor0.bgColor(1), marginHorizontal: 2 }, NewStyles.center, NewStyles.border100]}
                                    disabled={loading}
                                    onPress={() => {
                                        if (message) {
                                            send()
                                        }
                                    }}>
                                    {!loading && <Ionicons name="paper-plane-outline" size={20} color={themeColor5.bgColor(1)} />}
                                    {loading && <ActivityIndicator color={themeColor5.bgColor(1)} size={20} />}
                                </Pressable>
                            </View>
                            <TextInput style={[{ flex: 1, marginHorizontal: 10 }, NewStyles.text10]} placeholderTextColor={themeColor10.bgColor(1)} placeholder={t('Write your message')} value={message} maxLength={800} onChangeText={(p) => { setMessage(p) }} multiline={true} />
                        </View>
                    </View>
                    :
                    <View style={[NewStyles.shadow, { paddingBottom: Platform.OS === 'web' ? 100 : 70 }]}>
                        <View style={[NewStyles.rowWrapper, { backgroundColor: themeColor3.bgColor(0.1), paddingRight: 10 }]}>
                            <View style={[NewStyles.rowWrapper, { paddingVertical: 5 }]}>
                                <View style={[{ padding: 10, aspectRatio: 1, backgroundColor: themeColor6.bgColor(1), marginHorizontal: 2 }, NewStyles.center, NewStyles.border100]}>
                                    <Ionicons name="close" size={20} color={themeColor4.bgColor(1)} />
                                </View>
                            </View>
                            <Text style={[{ flex: 1, marginHorizontal: 10 }, NewStyles.text10]}>{t('Message sending is not available.')}</Text>
                        </View>
                    </View>
                }
                {/* </ImageBackground> */}
            </KeyboardAvoidingView>
        </View>
    )
}
