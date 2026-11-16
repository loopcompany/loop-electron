import useRealtimeRefresh from '../../hooks/useRealtimeRefresh';
import { FlatList, View } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { showToastOrAlert } from '@helpers/Common';
import { getUserCodes, selectList, getCodeState } from '@services/DiscountApi';
import NewStyles from '@styles/NewStyles';
import { useSelector } from 'react-redux';
import UserDiscountItem from './UserDiscountItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeaders from '@components/ScreenHeaders';
import BlankScreen from '@components/BlankScreen';
import { createStyles } from '@styles/NewStyles';
import FooterSpacer from '@components/FooterSpacer';
export default function UserDiscounts({ navigation }) {
  useRealtimeRefresh(["wallet", "catalog"], () => fetchData());

    const { t, i18n } = useTranslation();
    const NewStyles = useMemo(
        () => createStyles(i18n.language),
        [i18n.language]
    );
    // const styles = useMemo(()=> createLocalStyles(NewStyles), [NewStyles]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(true);
    const token = useSelector((state) => state?.auth?.token)
    const [data, setData] = useState([]);

    const fetchData = async () => {
        const result = await getUserCodes(token);

        if (result.ok) {
            // این اندپوینت خود مجموعه را برمی‌گرداند نه پاکت `{success,data}`؛
            // `selectList` هر دو شکل را می‌پذیرد تا FlatList هیچ‌وقت آرایه نگیرد.
            //
            // کدهای قابل استفاده بالا می‌آیند: یک کد منقضی یا تمام‌شده نباید
            // بالای فهرست بنشیند و کد معتبر را از دید کاربر پایین ببرد.
            const codes = selectList(result.data);
            const rank = { usable: 0, used_up: 1, expired: 2 };
            setData([...codes].sort((a, b) => rank[getCodeState(a)] - rank[getCodeState(b)]));
        } else {
            showToastOrAlert(result.message || t('An unexpected error occurred!'));
        }

        setRefreshing(false);
        setLoading(false);
    };
    useEffect(() => {
        fetchData();
    }, [refreshing]);

    return (
        <SafeAreaView edges={{ top: 'off', bottom: 'off' }} style={NewStyles.container}>
            <ScreenHeaders title={t("Received Prizes")} />
            <FlatList
                ListFooterComponent={<FooterSpacer />}
                contentContainerStyle={[NewStyles.center, { gap: 10, paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
                data={data}
                ListEmptyComponent={() => {
                    return (
                        <BlankScreen />
                    )
                }}
                keyExtractor={(item) => item.id?.toString()}
                renderItem={({ item }) => {
                    return (
                        <UserDiscountItem item={item} navigation={navigation} />
                    )
                }}
            />
        </SafeAreaView>
    )
}