import useRealtimeRefresh from '../../hooks/useRealtimeRefresh';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View, Modal, ActivityIndicator, ToastAndroid, Platform } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import moment from 'moment-jalaali';
import { createStyles } from '@styles/NewStyles';
import NewStyles from '@styles/NewStyles';
import { themeColor0, themeColor1, themeColor4, themeColor5, themeColor14 } from '@theme/Color';
import { imageUri } from '@services/URL';
import OfferItem from './OfferItem';
import { useTranslation } from 'react-i18next';
import Filters from '@components/Filters';
import DiscountItem from './DiscountItem';
import Loader from '@components/Loader';
import { SafeAreaView } from 'react-native-safe-area-context';
import LuckyWheel from '@components/LuckyWheel';
import WinnerModal from '@components/WinnerModal';
import { getGemActions, spinWheel, canPlayWheel } from '@services/GemApi';
import { getOffers, getCategories, getPlans, selectList } from '@services/DiscountApi';
import { showToastOrAlert } from '@helpers/Common';
import ScreenHeaders from '@components/ScreenHeaders';
import { langIsRTL } from '@helpers/Common';
import FooterSpacer from '@components/FooterSpacer';
export default function Club({ navigation }) {
  useRealtimeRefresh(["wallet", "catalog"], () => fetchData());

  const { t, i18n } = useTranslation();
  const NewStyles = useMemo(
    () => createStyles(i18n.language),
    [i18n.language]
  );
  const isRtl = langIsRTL(i18n.language)
  // const styles = useMemo(()=> createLocalStyles(NewStyles), [NewStyles]);
  const token = useSelector(state => state.auth.token);

  const [refreshing, setRefreshing] = useState(true);
  const [loading, setLoading] = useState(true);

  const [activeIndex, setActiveIndex] = useState(0);

  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState([]);

  // حالت‌های گردونه شانس
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [userGems, setUserGems] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [nextPlayDate, setNextPlayDate] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [loadingWheel, setLoadingWheel] = useState(false);

  // تابع نمایش پیام

  // بررسی امکان شرکت در گردونه
  const checkCanPlay = async () => {
    if (!token) return;
    try {
      const response = await canPlayWheel(token);
      setCanSpin(response.data.can_play);
      setNextPlayDate(response.data.next_available_date);
    } catch (error) {
      console.log('Error checking can play:', error);
    }
  };

  // دریافت لیست جوایز از سرور
  const fetchPrizes = async () => {
    if (!token) return;
    try {
      const response = await getGemActions(token);
      if (response.success && response.data.actions) {
        // تبدیل به فرمت مورد نیاز کامپوننت
        const formattedPrizes = response.data.actions.map(action => ({
          id: action.id,
          label: action.name,
          points: action.gems,
          action_key: action.action_key,
        }));
        setPrizes(formattedPrizes);
      }
    } catch (error) {
      console.log('Error fetching prizes:', error);
      // فقط اگر خطای واقعی باشه پیام بده
      if (error.response && error.response.status !== 401) {
        showToastOrAlert(t('Error fetching wheel information'));
      }
    }
  };

  // مدیریت چرخش گردونه
  const handleSpinWheel = async () => {
    if (!canSpin) {
      showToastOrAlert(t('You have already participated this week. Please try again next week.'));
      return;
    }

    setSpinning(true);

    try {
      // فراخوانی API
      const response = await spinWheel(token);

      if (response.success) {
        // تاخیر برای نمایش انیمیشن چرخش
        setTimeout(() => {
          setWonPrize(response.data.won_action);
          setUserGems(response.data.total_gems);
          setSpinning(false);
          setCanSpin(false);

          // نمایش مودال برنده بعد از 500ms
          setTimeout(() => {
            setShowWinnerModal(true);
          }, 500);
        }, 4000);
      }
    } catch (error) {
      setSpinning(false);

      if (error.response) {
        const errorCode = error.response.data?.error_code;

        if (errorCode === 'ALREADY_PLAYED_THIS_WEEK') {
          showToastOrAlert(error.response.data.message);
          setCanSpin(false);
          if (error.response.data.data?.can_play_again_after) {
            setNextPlayDate(error.response.data.data.can_play_again_after);
          }
        } else if (errorCode === 'NO_ACTIVE_ACTIONS') {
          showToastOrAlert(t('No rewards available at the moment.'));
        } else {
          showToastOrAlert(error.response.data.message || t('Error participating in the wheel'));
        }
      } else {
        showToastOrAlert(t('Network error! Please check your internet connection.'));
      }
    }
  };

  // باز کردن مودال گردونه
  const handleOpenWheel = async () => {
    if (!token) {
      showToastOrAlert(t('Please log in first'));
      return;
    }

    setShowWheelModal(true);
    setLoadingWheel(true);

    try {
      // دریافت اطلاعات جوایز و وضعیت
      await Promise.all([
        fetchPrizes(),
        checkCanPlay(),
      ]);
    } catch (error) {
      console.log('Error loading wheel data:', error);
    } finally {
      setLoadingWheel(false);
    }
  };

  // بستن مودال برنده
  const handleCloseWinner = () => {
    setShowWinnerModal(false);
    setShowWheelModal(false);
    setWonPrize(null);
  };
  const fetchData = async () => {
    const [offersResult, categoriesResult, plansResult] = await Promise.all([
      getOffers(token),
      getCategories(token),
      getPlans(token),
    ]);

    // این سه اندپوینت مجموعه را مستقیم برمی‌گردانند. `selectList` تضمین می‌کند
    // که همیشه آرایه بگیریم — قبلاً یک پاسخ غیرآرایه‌ای، spread را می‌ترکاند و
    // کل صفحه سفید می‌شد.
    setOffers(selectList(offersResult.data));

    const allCategory = { id: '0', title: t('All') };
    setCategories([allCategory, ...selectList(categoriesResult.data)]);

    setData(selectList(plansResult.data));

    // یک خطا نباید بقیه‌ی صفحه را هم خالی نشان بدهد: هرچه آمد را نمایش می‌دهیم
    // و فقط یک بار به کاربر اطلاع می‌دهیم.
    const failed = [offersResult, categoriesResult, plansResult].find((r) => !r.ok);
    if (failed) {
      showToastOrAlert(failed.message || t('An unexpected error occurred!'));
    }

    setRefreshing(false);
    setLoading(false);
  };
  useEffect(() => {
    fetchData();
  }, [refreshing]);

  if (loading) return <Loader />;

  return (
    <SafeAreaView edges={{ top: 'off', bottom: 'off' }} style={[NewStyles.container, {backgroundColor: themeColor4.bgColor(1)}]}>
      <ScreenHeaders title={t("Promotional Plans")} />
      <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl colors={[themeColor0.bgColor(1)]} progressBackgroundColor={themeColor5.bgColor(1)} refreshing={refreshing} onRefresh={() => { setRefreshing(true) }} />}>
        <View style={[NewStyles.rowWrapper, { paddingHorizontal: '5%' }]}>
          <View style={NewStyles.rowWrapper}>
            <Pressable style={[NewStyles.shadow, NewStyles.border100, NewStyles.whiteButton]} onPress={() => navigation.navigate('GemTransactions')}>
              <Text style={NewStyles.text}>{t('Your Wheel History')}</Text>
            </Pressable>
            {/* <Pressable style={[NewStyles.shadow, NewStyles.border100, NewStyles.whiteButton]} onPress={() => navigation.navigate('UserDiscounts')}>
              <Text style={NewStyles.text}>{t('Received Prizes')}</Text>
            </Pressable > */}
          </View>
        </View>
        {/* دکمه گردونه شانس */}
        <Pressable
          style={[NewStyles.border10, NewStyles.spacing, {
            alignSelf: 'center',
            width: '90%',
            backgroundColor: themeColor4.bgColor(1),
            justifyContent: 'center',
            alignItems: 'center', 
          }]}
          onPress={handleOpenWheel}
        >
          <Image
            source={{ uri: `${imageUri}/userfolder/gift.png` }}
            style={{ height: 100, width: 100 }}
          />
          <Text style={[NewStyles.title10, { marginTop: 10 }]}>{t('Lucky Wheel')}</Text>
          <Text style={[NewStyles.text10, { opacity: 0.7 }]}>{t('Spin to earn points!')}</Text>
          {userGems > 0 && (
            <Text style={[NewStyles.title, { marginTop: 5, }]}>
              {t('Your Points:')} {userGems} 💎
            </Text>
          )}
        </Pressable>

        <View style={{ paddingHorizontal: '5%' }}>
          <Text style={[NewStyles.title10]}>{t("This Week's Offers")}</Text>
        </View>
        <View>
          <FlatList
            contentContainerStyle={{ paddingHorizontal: '5%' }}
            horizontal inverted showsHorizontalScrollIndicator={false}
            data={offers}
            keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => <OfferItem item={item} navigation={navigation} />}
          />
        </View>
        <View style={[NewStyles.strip, NewStyles.center, { backgroundColor: themeColor1.bgColor(1) }]}>
          <Text style={NewStyles.title}>{t('Promotional Plans')}</Text>
        </View>
        <Filters data={categories} activeIndex={activeIndex} setActiveIndex={setActiveIndex} isRtl={isRtl} />
        <FlatList
          ListFooterComponent={<FooterSpacer />}
          contentContainerStyle={NewStyles.center} scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          data={activeIndex ? data.filter(item => item?.category_id == categories?.[activeIndex]?.id) : data}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => {
            return (
              <DiscountItem item={item} navigation={navigation} />
            )
          }}
        />
        <FooterSpacer />
      </ScrollView>

      {/* مودال گردونه شانس */}
      <Modal
        visible={showWheelModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWheelModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
          <View style={{
            backgroundColor: '#fff',
            marginHorizontal: 20,
            borderRadius: 20,
            padding: 20,
            maxHeight: '90%'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Pressable onPress={() => setShowWheelModal(false)}>
                <Ionicons name="close" size={30} color="#333" />
              </Pressable>
              <Text style={NewStyles.title10}>{t('Weekly Lucky Wheel 🎰')}</Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingWheel ? (
                <View style={{ paddingVertical: 100, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={themeColor1.bgColor(1)} />
                  <Text style={[NewStyles.text10, { marginTop: 15 }]}>{t('Loading...')}</Text>
                </View>
              ) : prizes.length > 0 ? (
                <>
                  <LuckyWheel
                    prizes={prizes}
                    onSpinStart={handleSpinWheel}
                    spinning={spinning}
                    disabled={!canSpin}
                  />

                  {!canSpin && !spinning && nextPlayDate && (
                    <View style={{
                      marginTop: 20,
                      padding: 15,
                      backgroundColor: themeColor14.bgColor(1),
                      borderRadius: 10,
                      alignItems: 'center'
                    }}>
                      <Text style={[NewStyles.text10, { textAlign: 'center', color: themeColor0.color }]}>
                        {t('You have participated this week! 🎉')}
                      </Text>
                      <Text style={[NewStyles.text10, { textAlign: 'center', marginTop: 5, fontSize: 12, color: themeColor0.color }]}>
                        {t('Next participation:')} {moment(nextPlayDate).format('jYYYY/jMM/jDD')}
                      </Text>
                    </View>
                  )}

                  {userGems > 0 && (
                    <View style={{
                      marginTop: 15,
                      padding: 15,
                      backgroundColor: themeColor1.bgColor(0.1),
                      borderRadius: 10,
                      alignItems: 'center'
                    }}>
                      <Text style={[NewStyles.title10, { color: themeColor1.bgColor(1) }]}>
                        {t('Your Total Points:')} {userGems} 💎
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={{ paddingVertical: 50, alignItems: 'center' }}>
                  <Text style={[NewStyles.text10, { textAlign: 'center' }]}>
                    {t('No prizes available at the moment')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* مودال برنده شدن */}
      {wonPrize && (
        <WinnerModal
          visible={showWinnerModal}
          onClose={handleCloseWinner}
          prize={wonPrize}
          totalGems={userGems}
        />
      )}
    </SafeAreaView>
  )
}