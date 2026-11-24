import useRealtimeRefresh from '../../hooks/useRealtimeRefresh';
// AddressScreen.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import ScreenHeaders from "@components/ScreenHeaders";
import NewStyles from "@styles/NewStyles";
import { themeColor1, themeColor4, themeColor0, themeColor3 } from "@theme/Color";
import { addressAPI } from "@services/Api";
import { showToastOrAlert, showAlert, langIsRTL } from "@helpers/Common";
import Button from "@components/Button";
import { createStyles } from '@styles/NewStyles';
import ShowMapDetailComponent from "@components/ShowMapDetailComponent";
import FooterSpacer from '@components/FooterSpacer';
import { spacing } from '@theme/Spacing';
export default function AddressScreen({ route, navigation }) {
  useRealtimeRefresh(["account"], () => fetchAddresses());
  const { t, i18n } = useTranslation();
  const isRTL = langIsRTL(i18n.language);
  const NewStyles = useMemo(
    () => createStyles(i18n.language),
    [i18n.language]
  );
  const styles = useMemo(() => createLocalStyles(NewStyles, isRTL), [NewStyles, isRTL]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Refresh when navigating back from Add New Address
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAddresses();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressAPI.getAll();

      if (response.success && response.data) {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      // Don't show alert on first load if no addresses
      if (addresses.length > 0) {
        showToastOrAlert(t('Error fetching addresses'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const handleDelete = (id) => {
    showAlert(
      t('Delete Address'),
      t('Are you sure you want to delete this address?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await addressAPI.delete(id);
              if (response.success) {
                showToastOrAlert(t('Address deleted successfully'));
                fetchAddresses();
              }
            } catch (error) {
              showToastOrAlert(t('Error deleting address'));
            }
          },
        },
      ]
    );
  };

  const renderAddressCard = ({ item }) => {
    return (
      <View style={[styles.addressCard, NewStyles.border10]}>
        <View style={[NewStyles.rowWrapper, styles.cardHeader]}>
          <Text style={[NewStyles.title10, { fontSize: 16 }]}>
            {item.title || t('Untitled')}
          </Text>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.iconBtn}
          >
            <Ionicons name="trash-outline" size={20} color="#d32f2f" />
          </TouchableOpacity>
        </View>

        <View style={[NewStyles.rowWrapper, styles.cardBody, Platform.OS != 'web' && { alignItems: 'flex-start' }]}>
          <View style={styles.cardContent}>
            {item.fname && item.lname && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={themeColor3.bgColor(1)} />
                <Text style={[NewStyles.text10, { marginRight: 8 }]}>
                  {item.fname} {item.lname}
                </Text>
              </View>
            )}

            {item.mobile && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={themeColor3.bgColor(1)} />
                <Text style={[NewStyles.text10, { marginRight: 8 }]}>
                  {item.mobile}
                </Text>
              </View>
            )}

            {item.telephone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={themeColor3.bgColor(1)} />
                <Text style={[NewStyles.text10, { marginRight: 8 }]}>
                  {item.telephone}
                </Text>
              </View>
            )}

            {item.city && item.region && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={themeColor3.bgColor(1)} />
                <Text style={[NewStyles.text10, { marginRight: 8 }]}>
                  {item.city} - {item.region}
                </Text>
              </View>
            )}

            {item.address && (
              <View style={styles.infoRow}>
                <Ionicons name="home-outline" size={16} color={themeColor3.bgColor(1)} />
                <Text style={[NewStyles.text10, { marginRight: 8, flex: 1 }]}>
                  {`${t("Number")} ${item?.number ?? ''} - ${t("Unit")} ${item?.unit ?? ''} - ${t("Floor")} ${item?.floor ?? ''} - ${item?.address}`}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.mapThumb, NewStyles.border100]}>
            <ShowMapDetailComponent
              latitude={item?.latitude}
              longitude={item?.longitude}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="location-outline" size={80} color={themeColor3.bgColor(1)} />
        <Text style={[NewStyles.text10, { marginTop: 20, fontSize: 16 }]}>
          {t('No addresses registered yet')}
        </Text>
        <Text style={[NewStyles.text10, { marginTop: 10, opacity: 0.7 }]}>
          {t('Add your first address with the button below')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={NewStyles.container} edges={{ top: 'off', bottom: 'additive' }}>
      <ScreenHeaders
        title={t('My Addresses')}
      />

      <View style={{ flex: 1 }}>
        {loading && addresses.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColor1.bgColor(1)} />
            <Text style={[NewStyles.text10, { marginTop: 10 }]}>{t('Loading...')}</Text>
          </View>
        ) : (
          <FlatList
            ListFooterComponent={<FooterSpacer />}
            data={addresses}
            renderItem={renderAddressCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              NewStyles.wrapper,
              addresses.length === 0 && { flex: 1 }
            ]}
            ListEmptyComponent={renderEmptyState}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            // نشانگر اسکرول روشن است (درخواست کارفرما ۱۴۰۵/۰۹/۰۲): نوار باریک و ظریف
            showsVerticalScrollIndicator
          />
        )}
      </View>

      <View style={styles.footer}>

        <Button title={t('Add New Address')} onPress={() => navigation.navigate('AddNewAddress')} />
      </View>
    </SafeAreaView>
  );
}

const createLocalStyles = (NewStyles, isRTL) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  addressCard: {
    backgroundColor: themeColor4.bgColor(1),
    padding: 15,
    marginBottom: 15,
    shadowColor: themeColor0.bgColor(1),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColor3.bgColor(0.2),
  },
  iconBtn: {
    padding: 5,
  },
  // «تغییرات اپ کاربر» بند ۳: نقشه از کادر بیرون می‌زد. ستونِ متن flex نداشت و
  // آدرسِ بلند آن را به اندازه‌ی کل کارت پهن می‌کرد و نقشه را بیرون هل می‌داد.
  cardBody: {
    gap: spacing.md,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  mapThumb: {
    width: 100,
    height: 100,
    flexShrink: 0,
    overflow: 'hidden',
    // روی وب لایه‌های Leaflet با z-index خودشان از overflow/borderRadius بیرون
    // می‌زنند؛ zIndex یک stacking context می‌سازد تا گوشه‌ی گرد آن‌ها را هم ببُرد.
    position: 'relative',
    zIndex: 0,
  },
  infoRow: {
    ...NewStyles.row
  },
  footer: {
    padding: 15,
    ...NewStyles.center,
    paddingBottom: 50

  },
  addBtn: {
    backgroundColor: themeColor1.bgColor(1),
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
});

