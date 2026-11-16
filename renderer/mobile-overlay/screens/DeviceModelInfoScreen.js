import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ImageBackground, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Footer from './Footer';
import ScreenHeaders from '@components/ScreenHeaders';
import ScreenTitle from '@components/ScreenTitle';
import HintBadge from '@components/HintBadge';
import NewStyles from '@styles/NewStyles';
import { themeColor10 } from '@theme/Color';
import { createDirectionalStyles } from '@styles/directionalStyles';
import FooterSpacer from '@components/FooterSpacer';
export default function DeviceModelInfoScreen({ navigation, route }) {
  const category = route?.params?.category || 'لپ تاپ';
  const [visibleSection, setVisibleSection] = useState(null);
  const [techGender, setTechGender] = useState('آقا');
  const [timeSlot, setTimeSlot] = useState('10-12');

  const toggleSection = (section) => {
    setVisibleSection((prev) => (prev === section ? null : section));
  };

  const timeOptions = ['10-12', '12-14', '14-16', '16-18'];
  const genders = ['آقا', 'خانم'];

  return (
    <ImageBackground source={require('@assets/moon.jpg')} style={styles.background} imageStyle={{ width: '100%', height: '100%' }}>
  
        <ScreenHeaders
          title={category}
        />
        <ScrollView contentContainerStyle={styles.container} edges={['left', 'right']}>
          <ScreenTitle title={'بررسی دستگاه'} />

          {/* ✅ مدل دستگاه */}
          <FormSection
          
            label="مدل دستگاه / قطعه"
            style={NewStyles.text4}
            visible={visibleSection === 'model'}
            onPress={() => toggleSection('model')}
            yellowText="راهنمای محل دستگاه / قطعه:"
          >
            <TextInput
              placeholder="در صورتی که مدل دستگاه را نمی‌دانید آن را بنویسید"
              placeholderTextColor={themeColor10.bgColor(1)}
              style={[NewStyles.textInput, NewStyles.border10, NewStyles.text10, { fontSize: 13 }]}

            />
          </FormSection>

          {/* ✅ ایراد ظاهری */}
          <FormSection
            label="ایراد ظاهری"
            visible={visibleSection === 'issue'}
            onPress={() => toggleSection('issue')}
            yellowText="توضیح دهید ایراد چیست:"
          >
            <TextInput
              placeholder="مثلاً شکستگی یا خط روی صفحه"
              placeholderTextColor={themeColor10.bgColor(1)}
              style={[NewStyles.textInput, NewStyles.border10, NewStyles.text10, { fontSize: 13 }]}
            />
          </FormSection>
          {/* ✅وضعیت محصول */}
          <FormSection
            label="وضعیت محصول / دستگاه"
            visible={visibleSection === 'status'}
            onPress={() => toggleSection('status')}
            yellowText="راهنمای وضعیت محصول / دستگاه:"
          >
            <View style={styles.dottedBox}>
              <Text style={styles.dottedText}>...............................</Text>
            </View>

            <TouchableOpacity style={styles.uploadButton}>
              <Text style={NewStyles.text10}>بارگذاری عکس مربوط به سفارش</Text>
            </TouchableOpacity>

            <View style={styles.cameraBox}>
              <Image source={require('@assets/camera.png')} style={styles.cameraIcon} />
              <Text style={NewStyles.text10}>انتخاب از گالری و دوربین</Text>
            </View>
          </FormSection>


          {/* ✅ نرم‌افزار چاپگر (navigation) */}
          {/* <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => navigation.navigate('PrinterSoftwareScreen')}
          >
            <Text style={NewStyles.text4}>نرم‌افزار چاپگر</Text>
          </TouchableOpacity> */}

          {/* ✅ اطلاعات شخصی در هارد دیسک */}
          <FormSection
            label="اطلاعات شخصی در هارد دیسک"
            visible={visibleSection === 'disk'}
            onPress={() => toggleSection('disk')}
            yellowText="با اطلاعات شخصی چه شود؟"
          >
            <View style={styles.buttonRow}>
              <SelectableButton label="پاک شود" />
              <SelectableButton label="بکاپ بگیرند" />
              <SelectableButton label="دست نزنند" />
            </View>
          </FormSection>

          {/* ✅ لپ‌تاپ / مودم / امانت */}
          <FormSection
            label="لپ‌تاپ / مودم / پرینتر / امانت"
            visible={visibleSection === 'borrow'}
            onPress={() => toggleSection('borrow')}
            yellowText="آیا دستگاه امانت داده شده؟"
          >
            <View style={[NewStyles.row, { gap: 5 }]}>
              <SelectableButton label="داده شده" />
              <SelectableButton label="داده نمی‌شود" />
            </View>
          </FormSection>

          {/* ✅ تأمین قطعه → صفحه جدا */}
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => navigation.navigate('PartsSupplyScreen')}
          >
            <Text style={NewStyles.text4}>تأمین قطعه / کالا</Text>
          </TouchableOpacity>

          {/* ✅ رزرو مراجعه تکنسین */}
          <FormSection
            label="رزرو مراجعه تکنسین"
            visible={visibleSection === 'tech'}
            onPress={() => toggleSection('tech')}
            yellowText="زمان و اطلاعات مراجعه"
          >
            <View style={styles.timeRow}>
              {timeOptions.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  onPress={() => setTimeSlot(slot)}
                  style={[styles.timeButton, timeSlot === slot && styles.timeSelected]}
                >
                  <Text style={NewStyles.text10}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{gap:10}}>
              <TextInput
                style={[NewStyles.textInput, NewStyles.border10, NewStyles.text10, { fontSize: 13 }]}
                placeholder="تاریخ مراجعه (مثلاً ۱۴۰۳/۰۴/۱۵)"
                placeholderTextColor={themeColor10.bgColor(0.5)}
              />
              <TextInput
                style={[NewStyles.textInput, NewStyles.border10, NewStyles.text10, { fontSize: 13 }]}
                placeholder="آدرس مراجعه"
                placeholderTextColor={themeColor10.bgColor(0.5)}
              />
              <TextInput
                style={[NewStyles.textInput, NewStyles.border10, NewStyles.text10, { fontSize: 13 }]}
                placeholder="شماره تماس"
                placeholderTextColor={themeColor10.bgColor(0.5)}
              />
            </View>
          </FormSection>

          {/* ✅ انتخاب تکنسین (دکمه‌های آقا / خانم) */}
          <FormSection
            label="انتخاب تکنسین"
            visible={visibleSection === 'selectTech'}
            onPress={() => toggleSection('selectTech')}
            yellowText="جنسیت تکنسین"
          >
            <View style={styles.buttonRow}>
              {genders.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setTechGender(g)}
                  style={[
                    styles.genderButton,
                    techGender === g && styles.genderSelected,
                  ]}
                >
                  <Text style={[NewStyles.text10,{textAlign:'center'}]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormSection>

          {/* ✅ کد تشویقی */}
          <FormSection
            label="کد تشویقی"
            visible={visibleSection === 'discount'}
            onPress={() => toggleSection('discount')}
            yellowText="در صورت وجود، کد تشویقی وارد کنید"
          >
            <TextInput
              placeholder="کد تشویقی را وارد کنید"
              placeholderTextColor={themeColor10.bgColor(0.7)}
              style={[NewStyles.textInput, NewStyles.border10, NewStyles.text10, { fontSize: 13 }]}
            />
          </FormSection>

          {/* ✅ نمایش / ثبت / استعلام → navigation */}
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() =>
              navigation.replace('OrderSummaryScreen', {
                source: 'device_model',
                orderTitle: `بررسی دستگاه - ${category}`,
                // '10-12' را به شناسه‌ی بازه‌ی ساعتی مشترک تبدیل می‌کند.
                schedule: { slot: `slot_${timeSlot.replace('-', '_')}` },
                summaryLines: [
                  { label: 'دستگاه', value: category },
                  { label: 'جنسیت تکنسین', value: techGender },
                ],
              })
            }
          >
            <Text style={NewStyles.text4}>نمایش / استعلام / ثبت سفارش</Text>
          </TouchableOpacity>

          <FooterSpacer />
        </ScrollView>

   
      
    </ImageBackground>
  );
}

// 🔁 Reusable Section Component
const FormSection = ({ label, visible, onPress, children, yellowText }) => (
  <>
    <View style={styles.sectionButtonRow}>
      <TouchableOpacity style={styles.sectionButton} onPress={onPress}>
        <Text style={NewStyles.text4}>{label}</Text>
      </TouchableOpacity>
      <HintBadge hint={yellowText} title={label} style={styles.sectionHintBadge} />
    </View>
    {visible && (
      <View style={styles.sectionContent}>
        {children}
      </View>
    )}
  </>
);

// 🔁 Reusable Button
const SelectableButton = ({ label }) => (
  <TouchableOpacity style={styles.optionButton}>
    <Text style={NewStyles.text4}>{label}</Text>
  </TouchableOpacity>
);

const styles = createDirectionalStyles((isRTL) => ({
  background: { flex: 1 },
  container: {
    padding: 20,
    paddingBottom: 100,

  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#003366',
    color: '#00ffff',
    padding: 10,
    borderRadius: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  sectionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 12,
  },
  sectionHintBadge: {
    marginLeft: 10,
  },
  sectionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr',
  },
  sectionContent: {
    backgroundColor: '#fff8dc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr'
  },
  whiteInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    color: '#000',
    textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: '#1e88e5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginVertical: 4,
  },
  optionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  timeButton: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 10,
    margin: 5,
    backgroundColor: '#005b9f',
  },
  timeSelected: {
    backgroundColor: '#00ffff',
  },
  timeText: {
    color: '#000',
    fontWeight: 'bold',
  },
  genderButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    width: '48%',
  },
  genderSelected: {
    backgroundColor: '#2196f3',
  },
  genderText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
  },
  dottedBox: {
    backgroundColor: '#ffff99',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  dottedText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadText: {
    fontWeight: 'bold',
    color: '#000',
  },
  cameraBox: {
    alignItems: 'center',
    marginTop: 10,
  },
  cameraIcon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  cameraText: {
    marginTop: 6,
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },

}));
