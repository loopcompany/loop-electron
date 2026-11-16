import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Footer from '@screens/Footer';
import ScreenHeaders from '@components/ScreenHeaders';
import NewStyles from '@styles/NewStyles';
import { themeColor0, themeColor1, themeColor3 } from '@theme/Color';
import CustomStatusBar from '@components/CustomStatusBar';
import { useTranslation } from 'react-i18next';
import { langIsRTL } from '@helpers/Common';

export default function ChooseTechnicianScreen({ navigation }) {
  const { i18n } = useTranslation();
  const isRTL = langIsRTL(i18n.language);
  return (
    <View style={[NewStyles.container, { flex: 1, backgroundColor: '#d1e9ff' }]}>
      <CustomStatusBar />
      <ScreenHeaders
        title="سازمانی / دولتی"
        onPressLeft={() => {
          if (Platform.OS == 'web') {
            window.history.back()
          } else {
            navigation.goBack()
          }
        }}
        onPressRight={() => { }}
      />


      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20, paddingTop: 10 }}>
        <View style={{ width: '95%', alignSelf: 'center', marginBottom: 12 }}>
          <View style={{
            backgroundColor: '#1976d2',
            borderRadius: 12,
            paddingVertical: 14,
            marginBottom: 12,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3,
            shadowColor: '#1976d2',
            shadowOpacity: 0.3,
            shadowRadius: 4
          }}>
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              fontFamily: 'VazirBold',
              textAlign: 'center'
            }}>ادامه رزرو / مراجعه تکنسین</Text>
          </View>

          {/* زمان نگهداری و سرویس (بلند مدت) */}
          <View style={{
            backgroundColor: '#c8e6c9',
            borderRadius: 12,
            paddingVertical: 12,
            marginBottom: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#81c784',
            elevation: 2,
            shadowColor: '#4caf50',
            shadowOpacity: 0.3,
            shadowRadius: 4
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#2e7d32',
              fontFamily: 'VazirBold',
              textAlign: 'center'
            }}>زمان نگهداری و سرویس (بلند مدت)</Text>
          </View>

          {/* Price options grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 }}>
            <TouchableOpacity style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              width: '48%',
              marginBottom: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ddd'
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: '#333',
                fontFamily: 'VazirBold',
                textAlign: 'center'
              }}>۲۰ روزه ( ۱۵ ریز کرک)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              width: '48%',
              marginBottom: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ddd'
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: '#333',
                fontFamily: 'VazirBold',
                textAlign: 'center'
              }}>۱۲۰ روزه ( ۳۰ ریز کرک)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              width: '48%',
              marginBottom: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ddd'
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: '#333',
                fontFamily: 'VazirBold',
                textAlign: 'center'
              }}>یکسال ( هر یک ماه)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              width: '48%',
              marginBottom: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ddd'
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: '#333',
                fontFamily: 'VazirBold',
                textAlign: 'center'
              }}>۱۱۰ روزه ( ۳۰ ریز کرک)</Text>
            </TouchableOpacity>
          </View>

          {/* تاریخ شروع */}
          <View style={{
            backgroundColor: '#f5f5f5',
            borderRadius: 12,
            paddingVertical: 12,
            marginBottom: 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#ddd'
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#333',
              fontFamily: 'VazirBold',
              textAlign: 'center'
            }}>تاریخ شروع :</Text>
          </View>

          {/* Time slots for second section */}
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <TouchableOpacity style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#ddd',
              flex: 1,
              marginHorizontal: 2,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 13,
                fontFamily: 'VazirBold',
                color: '#333',
                textAlign: 'center'
              }}>۱۰ صبح به بعد</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#ddd',
              flex: 1,
              marginHorizontal: 2,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 13,
                fontFamily: 'VazirBold',
                color: '#333',
                textAlign: 'center'
              }}>۱۲ ظهر به بعد</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: '#ddd',
              flex: 1,
              marginHorizontal: 2,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 13,
                fontFamily: 'VazirBold',
                color: '#333',
                textAlign: 'center'
              }}>۱۴ الی ۱۷ عصر</Text>
            </TouchableOpacity>
          </View>

          {/* Separator line */}
          <View style={{
            height: 1,
            backgroundColor: '#666',
            marginVertical: 8,
            width: '100%'
          }} />

          {/* برگزاری نامه (اختیاری) - second section */}
          <View style={{
            backgroundColor: '#f5f5f5',
            borderRadius: 12,
            paddingVertical: 12,
            marginBottom: 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#ddd'
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#333',
              fontFamily: 'VazirBold',
              textAlign: 'center'
            }}>برگزاری نامه (اختیاری)</Text>
          </View>

          {/* Description text - second section */}
          <View style={{
            backgroundColor: '#f9f9f9',
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#e0e0e0'
          }}>
            <Text style={{
              fontSize: 11,
              color: '#666',
              fontFamily: 'VazirLight',
              textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr',
              lineHeight: 16
            }}>
              بین مراجعه داشتن / اطلاعات تکنیکی در درخواست قویت با تاسیسات، تیم و ایمنی هنده
              با مجموعه (پنل سازمانی / شرکت بلند مدت) برگزاری تصفیه
            </Text>
          </View>

          {/* انتخاب تکنسین */}
          <View style={{
            backgroundColor: '#1976d2',
            borderRadius: 12,
            paddingVertical: 14,
            marginBottom: 12,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 3,
            shadowColor: '#1976d2',
            shadowOpacity: 0.3,
            shadowRadius: 4
          }}>
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              fontFamily: 'VazirBold',
              textAlign: 'center'
            }}>انتخاب تکنسین</Text>
          </View>

          {/* Gender selection buttons */}
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <TouchableOpacity style={{
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: '#ddd',
              flex: 1,
              marginHorizontal: 4,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 16,
                fontFamily: 'VazirBold',
                color: '#333',
                textAlign: 'center'
              }}>آقا</Text>
            </TouchableOpacity>

            <TouchableOpacity disabled accessibilityState={{ disabled: true }} style={{ opacity: 0.45,
              backgroundColor: '#f5f5f5',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: '#ddd',
              flex: 1,
              marginHorizontal: 4,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 16,
                fontFamily: 'VazirBold',
                color: '#333',
                textAlign: 'center'
              }}>خانم (به‌زودی)</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

    </View>
  );
}