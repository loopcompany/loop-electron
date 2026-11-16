import { OrderTextInput as TextInput, OrderTouchable as TouchableOpacity } from '../../components/OrderReadOnlyControls';
import React, { useState } from 'react';
import { View, Text,   Image, ImageBackground, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenTitle from '@components/ScreenTitle';
import NewStyles from '@styles/NewStyles';
import CustomStatusBar from '@components/CustomStatusBar';
import { themeColor10, themeColor14 } from '@theme/Color';
import ScreenHeaders from '@components/ScreenHeaders';
import Footer from '@screens/Footer';
import { createDirectionalStyles } from '@styles/directionalStyles';

export default function DeviceOrderSummary({ navigation }) {
  const { t, i18n } = useTranslation();
  const [visibleSection, setVisibleSection] = useState(null);

  const toggleSection = (section) => {
    setVisibleSection((prev) => (prev === section ? null : section));
  };

  const sections = [
    { key: 'check', label: t('Review / Replacement / Receipt') },
    { key: 'techInfo', label: t('Technician information') },
    { key: 'progress', label: t('In Progress / Completion') },
    { key: 'loop', label: t('Send to Loop / Costs / Duration') },
    { key: 'followup', label: t('Follow-up / Return time') },
    { key: 'parts', label: t('Parts / Costs / Representative') },
    { key: 'payment', label: t('Pay cost') },
    { key: 'delivery', label: t('Receive product / Completion') },
    { key: 'invoice', label: t('Invoice') },
    { key: 'survey', label: t('Survey / Rating') },
  ];

  return (
    <ImageBackground source={require('@assets/moon.jpg')} style={NewStyles.container} imageStyle={{ width: '100%', height: '100%' }}>
      <CustomStatusBar />
      {/* <View style={{ padding: 10 }}>
        <ScreenTitle title={'سفارش‌های جاری من'} />
      </View> */}
      <ScreenHeaders title={t('My current orders')}/>
      <ScrollView contentContainerStyle={styles.container}>

        {sections.map((section) => (
          <FormSection
            key={section.key}
            label={section.label}
            visible={visibleSection === section.key}
            onPress={() => toggleSection(section.key)}
            sectionKey={section.key}
            t={t}
          />
        ))}

        <TouchableOpacity style={styles.sectionButton}>
          <Text style={styles.sectionButtonText}>{t('Back to home page')}</Text>
        </TouchableOpacity>
      </ScrollView>
      
    </ImageBackground>
  );
}

const FormSection = ({ label, visible, onPress, sectionKey, t }) => (
  <>
    <TouchableOpacity style={styles.sectionButton} onPress={onPress}>
      <Text style={NewStyles.text4}>{label}</Text>
    </TouchableOpacity>
    {visible && (
      <View style={styles.sectionContent}>

        {sectionKey === 'check' && (
          <>
            <View style={styles.noticeBox}>
              <Text style={NewStyles.text10}>
                {t('Dear user, your order is being reviewed by Loop. Thank you for your patience.')}
              </Text>
            </View>

            <View style={styles.whiteBox}>
              <Text style={NewStyles.text10}>{t('Loop comments')}</Text>
            </View>

            <Text style={NewStyles.text10}>{t('Technician visit date and time / Time replacement')}</Text>

            <View style={[styles.row, { marginTop: 10 }]}>
              <View style={styles.smallWhiteBox}>
                <Text style={NewStyles.text10}>۱۲ الی ۱۴</Text>
              </View>
              <View style={styles.smallWhiteBox}>
                <Text style={NewStyles.text10}>۱۴۰۳/۱۰/۱۱</Text>
              </View>
            </View>

            <View style={styles.centerBox}>
              <Text style={[NewStyles.text10]}>{t('Quote')}</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder={t('Do you have more details? Write:')}
                placeholderTextColor={themeColor10.bgColor(0.7)}
                multiline
                numberOfLines={4}
                verticalAlign='top'
                textAlignVertical='top'
                style={[NewStyles.text10, NewStyles.border10, NewStyles.text10]}
              />
            </View>


            <TouchableOpacity style={styles.submitButton}>
              <Text style={NewStyles.text4}>{t('Submit Order')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton}>
              <Text style={NewStyles.text10}>{t('Cancel Order')}</Text>
            </TouchableOpacity>
          </>
        )}


        {sectionKey === 'techInfo' && (
          <>
            <View style={styles.techImageCircle}>
              <Image
                source={require('@assets/technician.png')}
                style={styles.techImage}
              />
            </View>
            <Text style={[NewStyles.text10, { textAlign: 'center' }]}>{t('Akbar Emdadi')}</Text>
            <Text style={[NewStyles.text10, { textAlign: 'center' }]}>{t('Comprehensive Field Technician')}</Text>
            <View style={styles.dottedLine} />
            <View style={styles.techInfoRow}>
              <View style={styles.techInfoItem}>
                <Text style={[NewStyles.text10]}>{t('Technician Code')}</Text>
                <Text style={[NewStyles.text10]}>۲۱۶-۰۰۰۰-۱۵۴۲</Text>
              </View>
              <View style={styles.techInfoItem}>
                <Text style={[NewStyles.text10]}>{t('Start of activity')}</Text>
                <Text style={[NewStyles.text10]}>۱۴۰۳/۰۹/۲۰</Text>
              </View>
            </View>

            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.buttonWhite}>
                <Text style={[NewStyles.text10]}>{t('Call technician')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonWhite}>
                <Text style={[NewStyles.text10]}>{t('Message to technician')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonWhite}>
                <Text style={[NewStyles.text10]}>{t('Send to friends')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonWhite}>
                <Text style={[NewStyles.text10]}>{t('Scan QR code')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {sectionKey === 'progress' && (
          <>
            <View style={styles.noticeBox}>
              <Text style={[NewStyles.text10]}>
                {t('Dear user, if the technician\'s specifications do not match the registered information, please inform Loop support.')}
              </Text>
            </View>

            <TouchableOpacity style={styles.confirmButton}>
              <Text style={[NewStyles.text10]}>{t('Confirm technician presence')}</Text>
            </TouchableOpacity>

            <View style={styles.dottedLine}>
              <TouchableOpacity style={styles.grayButton}>
                <Text style={[NewStyles.text10]}>{t('Technician specifications are correct')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dottedLine}>
              <TouchableOpacity style={styles.grayButton}>
                <Text style={[NewStyles.text10]}>{t('Technician specifications are not correct')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.linkButton}>
              <Text style={[NewStyles.text10]}>{t('Terms and conditions for product dispatch')}</Text>
            </TouchableOpacity>
          </>
        )}

        {sectionKey === 'loop' && (
          <>
            <View style={styles.noticeBox}>
              <Text style={NewStyles.text10}>
                {t('Dear user, the product is being reviewed and diagnosed by the relevant expert. Thank you for your patience.')}
              </Text>
            </View>

            <View style={styles.whiteBox}>
              <Text style={NewStyles.text10}>{t('Loop expert comments')}</Text>
            </View>

            <View style={[styles.row, { alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.timeTitle}>{t('Approximate cost statement:')}</Text>
              </View>

              <View style={styles.smallWhiteBox}>
                <Text style={NewStyles.text10}>{t('Order receipt')}</Text>
              </View>

            </View>

            <View style={[styles.row, { alignItems: 'center', marginBottom: 10 }]}> 
              <Text style={styles.timeTitle}>{t('Approximate order completion time')}</Text>
              <View style={[styles.smallWhiteBox, { width: "40%" }]}>
                <Text style={NewStyles.text10}>{t('2 working days')}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder={t('Write request / comments:')}
                placeholderTextColor={themeColor10.bgColor(0.7)}
                multiline
                numberOfLines={3}
                style={[NewStyles.text10]}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.buttonBlue}>
                <Text style={[NewStyles.text4, { color: '#fff' }]}>{t('I accept')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonYellow}>
                <Text style={[NewStyles.text4, { color: '#000' }]}>{t('Cancel order / Return')}</Text>
              </TouchableOpacity>
            </View>


          </>
        )}

        {sectionKey === 'followup' && (
          <>
            <View style={styles.noticeBox}>
              <Text style={NewStyles.text10}>
                {t('Dear user, the product is in progress by the relevant expert. Thank you for your patience.')}
              </Text>
            </View>

            <TouchableOpacity style={[styles.buttonYellow, { marginBottom: 10 }]}> 
              <Text style={[NewStyles.text4]}>{t('Contact me at return time')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whiteBorderButton}>
              <Text style={[NewStyles.text10]}>{t('On what date will the product be returned?')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whiteBorderButton}>
              <Text style={[NewStyles.text10]}>{t('I\'m in a hurry, do it faster')}</Text>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder={t('Write request / comments:')}
                placeholderTextColor={themeColor10.bgColor(0.7)}
                multiline
                numberOfLines={3}
                style={[NewStyles.text10]}
              />
            </View>

            <View style={[styles.row, { marginTop: 8 }]}> 
              <View style={styles.smallWhiteBox}>
                <Text style={NewStyles.text10}>۱۴۰۳/۰۹/۲۸</Text>
              </View>
              <View style={styles.smallWhiteBox}>
                <Text style={NewStyles.text10}>۱۲ الی ۱۶</Text>
              </View>
            </View>
          </>
        )}

        {sectionKey === 'parts' && (
          <>
            <View style={styles.blueHeader}>
              <Text style={[NewStyles.text4, { color: '#fff' }]}>{t('Parts / Costs / Representative')}</Text>
            </View>

            <View style={{ height: 8 }} />

            <View style={styles.smallButtonsRow}>
              <TouchableOpacity style={{margin:10}}>
                <Text style={[NewStyles.text10]}>{t('Repair/Replacement/Other')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallWhiteBtn,{width:"50%"}]}>
                <Text style={[NewStyles.text10]}>{t('Deployed expert comments')}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 8 }} />

            <View style={NewStyles.rowWrapper}>
              <Text style={[NewStyles.text10]}>{t('Total amount:')}</Text>
              <View style={styles.amountBox}>
                <Text style={[NewStyles.text10]}>{t('Order receipt')}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder={t('Write request / comments :')}
                placeholderTextColor={themeColor10.bgColor(0.7)}
                multiline
                numberOfLines={3}
                textAlignVertical='top'
                style={[NewStyles.text10, { minHeight: 70 }]}
              />
            </View>

            <View style={{ marginBottom: 8 }}>
              <Text style={[NewStyles.text10]}>{t('Introduce representative to receive product: Mr. / Mrs.')}</Text>
            </View>

            <TextInput
              placeholder={t('Representative name')}
              placeholderTextColor={themeColor10.bgColor(0.7)}
              style={[NewStyles.textInput, NewStyles.border10, { marginBottom: 8 }]}
            />

            <View style={styles.phoneRow}>

              <TextInput
                placeholder="XXXXXXXX"
                placeholderTextColor={themeColor10.bgColor(0.7)}
                style={[NewStyles.textInput, NewStyles.border10, { flex: 1, marginRight: 8 }]}
                keyboardType='phone-pad'
              />
                            <View style={styles.phonePrefix}>
                <Text style={NewStyles.text10}>09</Text>
              </View>
            </View>
          </>
        )}

        {sectionKey === 'delivery' && (
          <>
            <View style={styles.centerBox}>
              <Text style={[NewStyles.text4, { color: '#003366' }]}>{t('Receive product / order')}</Text>
            </View>

            <TouchableOpacity style={[styles.buttonYellow, { marginBottom: 8 }]}> 
              <Text style={[NewStyles.text4]}>{t('I received the product with health test')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.buttonYellow, { marginBottom: 8 }]}> 
              <Text style={[NewStyles.text4]}>{t('I received the product without health test')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.buttonYellow, { marginBottom: 8 }]}> 
              <Text style={[NewStyles.text4]}>{t('I received the product but it has technical defects')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.buttonYellow, { marginBottom: 8 }]}> 
              <Text style={[NewStyles.text4]}>{t('The product was returned to Loop after the test')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.buttonYellow, { marginBottom: 10 }]}> 
              <Text style={[NewStyles.text4]}>{t('I received the product as per my request')}</Text>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder={t('Write request / comments :')}
                placeholderTextColor={themeColor10.bgColor(0.7)}
                multiline
                numberOfLines={3}
                style={[NewStyles.text10, { minHeight: 80 }]}
              />
            </View>
          </>
        )}

        {sectionKey === 'payment' && (
          <>
            <View style={styles.priceRow}>
              <Text style={[NewStyles.text10]}>{t('Total amount sum:')}</Text>
              <View style={styles.priceBox}>
                <Text style={[NewStyles.text10]}>۵٬۰۰۰٬۰۰۰ {t('Rial')}</Text>
              </View>
            </View>

            <View style={styles.walletButtons}>
              <TouchableOpacity style={styles.walletButton}>
                <Text style={[NewStyles.text4]}>{t('Deduct cost from wallet')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.walletButton}>
                <Text style={[NewStyles.text4]}>{t('Charge wallet')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.payButton}>
              <Text style={[NewStyles.text4]}>{t('Online payment')}</Text>
            </TouchableOpacity>
          </>
        )}


        {!['check', 'techInfo'].includes(sectionKey) && (
          <Text style={[NewStyles.text10, { textAlign: 'center' }]}> 

          </Text>
        )}
      </View>
    )}
  </>
);

const styles = createDirectionalStyles((isRTL) => ({
  background: { flex: 1 },
  container: { padding: 20, paddingBottom: 100 },
  headerBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },

  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#003366',
  },

  sectionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
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
  },

  noticeBox: {
    backgroundColor: themeColor14.bgColor(1),
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },

  whiteBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },

  row: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  smallWhiteBox: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
  },

  centerBox: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },

  timeTitle: {
    color: '#003366',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 10,
    textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr',
  },

  dottedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    borderStyle: 'dotted',
    marginVertical: 10,
    paddingBottom: 10,
  },

  whiteBorderButton: {
    backgroundColor: '#fff',
    borderColor: '#999',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
  },

  priceRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  priceBox: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#aaa',
  },

  walletButtons: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  walletButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },

  payButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  submitButton: {
    backgroundColor: '#007aff',
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: '#ffd700',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },

  buttonBlue: {
    backgroundColor: '#00771eff',
    paddingVertical: 12,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },

  buttonYellow: {
    backgroundColor: '#ffd700',
    paddingVertical: 12,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },

  /* parts-specific styles */
  blueHeader: {
    backgroundColor: '#0d47a1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 6,
  },

  smallButtonsRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },

  smallWhiteBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#999',
    marginLeft: 8,
  },

  inlineRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  amountBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#999',
  },

  phoneRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  phonePrefix: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#999',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 8,
  },

}));
