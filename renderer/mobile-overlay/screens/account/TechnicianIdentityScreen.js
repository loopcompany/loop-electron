import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeaders from '@components/ScreenHeaders';
import TechnicianQrCamera from '@components/TechnicianQrCamera';
import api from '@services/axiosConfig';
import NewStyles from '@styles/NewStyles';
import { colors } from '@theme/Color';
import { spacing } from '@theme/Spacing';
import { radius } from '@theme/Radius';

export default function TechnicianIdentityScreen() {
  const { t } = useTranslation();
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState !== 'background');
  const [busy, setBusy] = useState(false), [result, setResult] = useState(null);
  const scanning = useRef(false), alive = useRef(true);
  useEffect(() => { alive.current = true; const listener = AppState.addEventListener('change', (state) => setActive(state === 'active')); return () => { alive.current = false; listener.remove(); }; }, []);
  const verify = async (qr) => {
    if (scanning.current || !qr) return;
    scanning.current = true; setBusy(true);
    try {
      const response = await api.post('/technicians/identity/verify', { qr });
      if (alive.current) setResult(response.data?.verified ? response.data.data : { verified: false });
    } catch (error) { if (alive.current) setResult({ verified: false, networkError: error.response?.status !== 404 }); }
    finally { if (alive.current) setBusy(false); }
  };
  const close = () => { setResult(null); scanning.current = false; };
  return <SafeAreaView style={NewStyles.container}>
    <ScreenHeaders title={t('اسکن کارت تکنسین')} />
    <View style={styles.content}>
      <Text style={NewStyles.title4}>{t('QR روی کارت تکنسین را داخل دوربین بگیرید.')}</Text>
      {focused && active && !busy && !result && <TechnicianQrCamera onRead={verify} />}
      {busy && <ActivityIndicator />}
    </View>
    <Modal transparent visible={!!result} animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}><View style={styles.card}>
        {result?.verified ? <><Text style={styles.check}>✓</Text><Text style={NewStyles.title4}>{t('تکنسین تأییدشدهٔ لوپ')}</Text><Text style={NewStyles.title4}>{result.name}</Text><Text style={NewStyles.title4}>{result.personnel_code}</Text></>
          : <Text style={NewStyles.title4}>{result?.networkError ? t('بررسی هویت انجام نشد؛ اتصال اینترنت را بررسی کنید.') : t('این کارت معتبر نیست یا دسترسی تکنسین غیرفعال شده است.')}</Text>}
        <Pressable accessibilityRole="button" onPress={close} style={styles.close}><Text style={NewStyles.title4}>{t('بستن')}</Text></Pressable>
      </View></View>
    </Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg }, overlay: { flex: 1, backgroundColor: colors.primary.bgColor(0.8), padding: spacing.xl, justifyContent: 'center' },
  card: { backgroundColor: colors.primary.color, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  close: { padding: spacing.lg }, check: { color: colors.success.color, fontSize: 48 },
});
