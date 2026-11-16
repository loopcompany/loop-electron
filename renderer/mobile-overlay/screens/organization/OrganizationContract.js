import React from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeaders from '@components/ScreenHeaders';
import OrganizationAgreementPanel from '@components/OrganizationAgreementPanel';
import { useMenu } from '@contexts/MenuContext';
import { L } from '@org/orgI18n';

export default function OrganizationContract({ navigation }) {
  const { footerSpace } = useMenu();
  return <SafeAreaView edges={{ top: 'off', bottom: 'additive' }} style={{ flex: 1, backgroundColor: '#d1e9ff' }}>
    <ScreenHeaders title={L('سوابق توافق‌نامه‌ها')} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 14, paddingBottom: (footerSpace || 60) + 24 }}>
        <OrganizationAgreementPanel historyOnly navigation={navigation} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
