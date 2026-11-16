import useRealtimeRefresh from '../hooks/useRealtimeRefresh';
// RateListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  I18nManager,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NewStyles from '@styles/NewStyles';
import ScreenHeaders from '@components/ScreenHeaders';
import Footer from './Footer';
import { formatJalaaliDate } from '@helpers/Common';
import { themeColor0, themeColor4 } from '@theme/Color';
import letterRatesAPI from '@services/LetterRatesApi';
import { RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import FooterSpacer from '@components/FooterSpacer';



export default function RateListScreen({ route }) {
  useRealtimeRefresh(["catalog"], () => fetchLetterRates());

  const { t } = useTranslation();
  const params = route?.params;
  const [rates, setRates] = useState([]);
  const [unionRates, setUnionRates] = useState([]);
  const [loopRates, setLoopRates] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    fetchLetterRates();
  }, [refreshing]);

  const fetchLetterRates = async () => {
    try {
      const response = await letterRatesAPI.getLetterRates(params?.id);
      setRates(response);
    } catch (error) {
      console.error('Error fetching letter rates:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.rateRow, NewStyles.center]}>
      <Text style={[NewStyles.title10, { fontSize: 14 }]}>{item.title}</Text>
      <Text style={styles.rateText}>{item.amount}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={{ top: 'off', bottom: 'off' }} style={NewStyles.container}>
      <ScreenHeaders title={t('Rate List')} />

      <View style={[NewStyles.row, { flex: 1 }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleContainer}>
            <Text style={NewStyles.title4}>{params?.title}</Text>
          </View>
          <FlatList
            ListFooterComponent={<FooterSpacer />}
            showsVerticalScrollIndicator={false}
            data={rates}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true) }} />}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.container}
          />
        </View>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 100
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#005b9f',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  titleContainer: {
    backgroundColor: themeColor0.bgColor(1),
    padding: 10,
    ...NewStyles.border10,
    marginVertical: 10,
    marginHorizontal: 15
  },
  subTitle: {
    backgroundColor: '#007bff',
    color: '#fff',
    textAlign: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  rateRow: {
    backgroundColor: themeColor4.bgColor(1),
    padding: 15,
    marginBottom: 8,
    borderRadius: 10,
  },
  rateTitle: {
    ...NewStyles.text3,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  rateText: {
    ...NewStyles.text3,
    color: '#666',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  phone: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
