import { OrderTouchable as TouchableOpacity } from '../../components/OrderReadOnlyControls';
// screens/OrderTrackingScreen.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  ScrollView,
  ImageBackground,
} from 'react-native';
import NewStyles from '@styles/NewStyles';
import CustomStatusBar from '@components/CustomStatusBar';
import ScreenHeaders from '@components/ScreenHeaders';
import { themeColor0, themeColor4 } from '@theme/Color';

export default function OrderTrackingScreen({ navigation, route }) {
  // دریافت اطلاعات سفارش از route params.
  // اگر پارامتری نبود، به جای داده‌ی نمونه، جای خالی نمایش داده می‌شود.
  const orderData = {
    orderNumber: '—',
    userId: '—',
    phone: '—',
    date: '—',
    ...(route?.params?.orderData || {}),
  };

  const handleGoToOrders = () => {
    // به لیست سفارشات برو و stack را پاک کن
    navigation.reset({
      index: 0,
      routes: [{ name: 'OrdersScreen' }],
    });
  };

  const handleNewOrder = () => {
    // به لیست برو برای ثبت سفارش جدید و stack را پاک کن
    navigation.reset({
      index: 0,
      routes: [{ name: 'List' }],
    });
  };

  const handleBackPress = () => {
    // به لیست برو و stack را پاک کن
    navigation.reset({
      index: 0,
      routes: [{ name: 'List' }],
    });
  };
  return (
    <ImageBackground
      source={require('@assets/moon.jpg')}
      style={NewStyles.container}
      imageStyle={{ width: '100%', height: '100%' }}
    >
      <CustomStatusBar backgroundColor={themeColor4.bgColor(1)} />
      <ScreenHeaders 
        title="شماره پیگیری ثبت سفارش"
        onBackPress={handleBackPress}
      />
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.card}>
          <Text style={NewStyles.text10}>کاربر گرامی</Text>
          <Text style={NewStyles.text10}>ضمن تشکر از اعتماد شما</Text>
          <Text style={NewStyles.text10}>سفارش شما</Text>
          <Text style={[NewStyles.text10, styles.highlight]}>
            شماره سفارش: {orderData.orderNumber}
          </Text>
          <Text style={NewStyles.text10}>
            کد کاربری: {orderData.userId}
          </Text>
          <Text style={NewStyles.text10}>
            و شماره تماس: {orderData.phone}
          </Text>
          <Text style={NewStyles.text10}>
            در تاریخ {orderData.date} ثبت و در دست بررسی می‌باشد.
          </Text>
          <Text style={NewStyles.text10}>
            شما می‌توانید مراحل سفارش خود را در بخش پیگیری سفارش‌های جاری در اپلیکیشن لوپ پیگیری کنید.
          </Text>
          <Text style={NewStyles.text10}>
            اطمینان به شما داده می‌شود سفارش شما با نهایت دقت انجام می‌گیرد.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.greenButton}
          onPress={handleGoToOrders}
        >
          <Text style={NewStyles.text4}>پیگیری سفارش های جاری</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.blueButton}
          onPress={handleNewOrder}
        >
          <Text style={NewStyles.text4}>ثبت سفارش جدید</Text>
        </TouchableOpacity>
      </ScrollView>
      
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  highlight: {
    fontWeight: 'bold',
    color: themeColor0.bgColor(1),
  },
  greenButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  blueButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    marginBottom: 30,
    alignItems: 'center',
  },
});
