import useRealtimeRefresh from '../../hooks/useRealtimeRefresh';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { uri } from '@services/URL';
import { showToastOrAlert } from '@helpers/Common';
import NewStyles from '@styles/NewStyles';
import { themeColor0, themeColor5 } from '@theme/Color';
import GemTransactionItem from '@components/GemTransactionItem';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUser } from '@slices/userSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeaders from '@components/ScreenHeaders';
import i18n from 'i18next';
import FooterSpacer from '@components/FooterSpacer';
export default function GemTransactions() {
  useRealtimeRefresh(["wallet"], () => fetchData());

    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(true);
    const token = useSelector((state) => state?.auth?.token)
    const lang = i18n.resolvedLanguage ?? i18n.language ?? 'en';
    const [data, setData] = useState([]);
    const fetchData = async () => {
        try {
            const response = await axios.get(`${uri}/user/gem-transactions`, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept-Language': lang } })
            setData(response?.data);
        } catch (error) {
            const message = error?.response ? (error?.response?.status ? error?.response?.data?.message : t("An unexpected error occurred!")) : t("Network error!");
            showToastOrAlert(message);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
        dispatch(fetchUser(token))
    }, [refreshing]);

    return (
        <SafeAreaView edges={{ top: 'off', bottom: 'off' }} style={NewStyles.container}>
            <ScreenHeaders title={t("Lucky Wheel History")} />
            <FlatList
                ListFooterComponent={<FooterSpacer />}
                contentContainerStyle={[styles.contentContainerStyle, NewStyles.center]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl colors={[themeColor0.bgColor(1)]} progressBackgroundColor={themeColor5.bgColor(1)} refreshing={refreshing} onRefresh={() => { setRefreshing(true) }} />}
                data={data}
                keyExtractor={(item) => item?.id?.toString()}
                ListEmptyComponent={() => (
                    <View style={[NewStyles.center, { flex: 1, paddingTop: 50 }]}>
                        <Text style={[NewStyles.text10, { textAlign: 'center', opacity: 0.6, paddingHorizontal: 20, }]}>
                            {t("You have not spun the lucky wheel yet and have no points")}
                        </Text>
                    </View>
                )}
                renderItem={({ item }) => {
                    return (
                        <GemTransactionItem item={item} />
                    )
                }}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    contentContainerStyle: {
        gap: 10,
        paddingVertical: '5%',
        paddingBottom: 100
    },
})
