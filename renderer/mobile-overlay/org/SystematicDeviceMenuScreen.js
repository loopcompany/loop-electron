// صفحه‌ی اقدامات یک دسته در مسیر «انتخاب سیستماتیک».
//
// بعد از انتخاب کاشی دستگاه (لپ تاپ، کیس، مانیتور، ...) در
// org/SystematicCategoryScreen.js، همین صفحه باز می‌شود و دقیقاً همان فهرست
// دکمه‌های آبی قبلی org/List.js را نشان می‌دهد - با همان رنگ، همان گردی گوشه و
// همان سایه. تنها تفاوت این است که «انتخاب جامع» اینجا نیست (به صفحه‌ی List
// منتقل شده) و دسته‌ی انتخاب‌شده به هر مقصد پاس داده می‌شود.
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import ScreenHeaders from '@components/ScreenHeaders';
import CustomStatusBar from '@components/CustomStatusBar';
import NewStyles from '@styles/NewStyles';
import { showToastOrAlert } from '@helpers/Common';
import { radius } from '@theme/Radius';
import { spacing } from '@theme/Spacing';
import { fontSize, getFontFamily } from '@theme/Typography';
import { L } from './orgI18n';
import FooterSpacer from '@components/FooterSpacer';

// رنگ‌های فهرست سازمانی قبلی. این دو مقدار در theme/Color.js نیستند و عمداً
// عیناً حفظ شده‌اند تا ظاهر صفحه با نسخه‌ی قبلی List.js یکی باشد.
const LEGACY_LIST_BG = '#d1e9ff';
const LEGACY_BUTTON_BG = '#1976d2';
const LEGACY_BUTTON_TEXT = '#fff';

// همان هشت آیتم قبلی، منهای «انتخاب جامع» که حالا ورودی جداگانه‌ی صفحه‌ی List است.
const MENU_ITEMS = [
  { id: 1, title: 'توافق نامه', screen: 'ContractScreen' },
  { id: 2, title: 'تامین قطعات / کالا', screen: 'HardwareSelectionScreen' },
  { id: 3, title: 'رزرو / مراجعه تکنسین', screen: 'TechnicianVisitScreen' },
  { id: 4, title: 'انتخاب تکنسین', screen: 'ChooseTechnicianScreen' },
  { id: 5, title: 'تخفیف پنل / کد تشویقی', screen: 'DiscountCodeScreen' },
  // صفحه‌ی «اطلاعات اپراتور» هنوز به‌صورت مستقل وجود ندارد و فقط به شکل یک بخش
  // داخل ComprehensiveSelectionScreen پیاده شده، بنابراین این دکمه فعلاً پیام
  // «به‌زودی» می‌دهد (مثل رفتار قبلی کاشی «ضایعات» در صفحه‌ی اصلی).
  { id: 6, title: 'اطلاعات اپراتور', screen: 'OperatorInfoScreen', comingSoon: true },
  { id: 7, title: 'نمایش / استعلام / ثبت سفارش', screen: 'OrderMenuScreen' },
];

const SystematicDeviceMenuScreen = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(i18n.language), [i18n.language]);

  const categoryId = route?.params?.categoryId;
  const categoryTitle = route?.params?.categoryTitle;

  const handleNavigation = (item) => {
    if (item.comingSoon) {
      showToastOrAlert(t('(Coming soon)'));
      return;
    }
    // دسته‌ی انتخاب‌شده همراه مقصد می‌رود تا صفحه‌ی بعدی بداند سفارش برای کدام
    // دستگاه ثبت می‌شود.
    navigation.navigate(item.screen, { categoryId, categoryTitle });
  };

  return (
    <View style={[NewStyles.container, styles.screen]}>
      <CustomStatusBar />
      <ScreenHeaders title={L(categoryTitle) || L('سازمانی / دولتی')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuWrapper}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNavigation(item)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{L(item.title)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FooterSpacer />
      </ScrollView>
    </View>
  );
};

const createStyles = (lang) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: LEGACY_LIST_BG,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: spacing.xl,
      paddingTop: spacing.sm,
    },
    menuWrapper: {
      width: '90%',
      alignSelf: 'center',
      marginBottom: spacing.xl,
    },
    button: {
      width: '100%',
      backgroundColor: LEGACY_BUTTON_BG,
      borderRadius: radius.md,
      paddingVertical: 15,
      marginBottom: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: LEGACY_BUTTON_BG,
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    buttonText: {
      color: LEGACY_BUTTON_TEXT,
      fontSize: fontSize.md,
      fontFamily: getFontFamily('bold', lang),
      textAlign: 'center',
    },
  });

export default SystematicDeviceMenuScreen;
