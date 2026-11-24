import React, { useEffect, useRef, useState } from 'react';
import { AppState, Modal, NativeEventEmitter, NativeModules, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { uri } from '@services/URL';
import { createRealtimeClient } from '@services/realtime/client';
import { colors } from '@theme/Color';
import { spacing as space } from '@theme/Spacing';
import { fontSize } from '@theme/Typography';
import { radius } from '@theme/Radius';
import NewStyles from '@styles/NewStyles';

/** Startup/foreground/release events only. No periodic HTTP polling or silent installation. */
export default function AppUpdateProvider({ children, app = 'customer' }) {
  const { t } = useTranslation();
  const [release, setRelease] = useState(null), [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('available'), [progress, setProgress] = useState(0);
  const native = Platform.OS === 'android' ? NativeModules.LoopUpdates : null;
  const desktop = Platform.OS === 'web' && typeof window !== 'undefined' ? window.loopDesktop?.updates : null;
  const state = useRef('available'), dismissed = useRef(null), alive = useRef(true), checking = useRef(false);
  const updateState = (value) => { state.current = value; if (alive.current) setStatus(value); };

  useEffect(() => {
    if (!native && !desktop) return undefined;
    alive.current = true;
    let client;
    const apply = (data) => {
      if (!alive.current || ['downloading', 'ready', 'permission'].includes(state.current)) return data;
      if (data.available && data.release?.id !== dismissed.current) { setRelease(data.release); setVisible(true); }
      else if (!data.available) { setVisible(false); setRelease(null); }
      return data;
    };
    const check = async () => {
      if (checking.current) return null;
      checking.current = true;
      try {
        if (desktop) return apply(await desktop.check());
        const query = `app=${encodeURIComponent(app)}&platform=android&version_code=${native.versionCode || 0}`;
        const response = await fetch(uri + '/app-updates/check?' + query);
        if (!response.ok) throw Error('Update check unavailable');
        return apply(await response.json());
      } finally { checking.current = false; }
    };
    check().then((initial) => {
      if (!alive.current || !initial?.realtime?.enabled) return;
      client = createRealtimeClient({ config: async () => initial.realtime,
        socketOptions: Platform.OS === 'web' ? undefined : { headers: { Origin: uri.replace(/\/api\/?$/, '') } },
        onEvent: (event) => { if (event.reconnect || event.topics?.includes('app-updates')) check().catch(() => {}); },
      });
      if (AppState.currentState !== 'background') client.start();
    }).catch(() => {});
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') { check().catch(() => {}); client?.start(); }
      else if (next === 'background') client?.stop();
    });
    const receive = (value) => {
      if (!alive.current) return;
      if (typeof value === 'number') setProgress(value);
      else { if (value.progress !== undefined) setProgress(value.progress); if (value.status) updateState(value.status); }
    };
    const subscription = native ? new NativeEventEmitter(native).addListener('LoopUpdateProgress', receive) : null;
    const unsubscribe = desktop?.subscribe(receive);
    return () => { alive.current = false; appState.remove(); subscription?.remove(); unsubscribe?.(); client?.stop(); };
  }, [app, native, desktop]);

  const download = async () => {
    updateState('downloading'); setProgress(0);
    try { if (desktop) await desktop.download(); else await native.downloadUpdate(release); updateState('ready'); if (alive.current) setVisible(true); }
    catch { updateState('error'); }
  };
  const install = async () => {
    try { const result = desktop ? await desktop.install() : await native.installUpdate(); if (result === 'permission_required') updateState('permission'); }
    catch { updateState('error'); }
  };
  const close = () => { dismissed.current = release?.id; setVisible(false); };
  const button = (label, onPress) => <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{label}</Text></Pressable>;
  return <>
    {children}
    <Modal visible={visible && !!release} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}><View style={styles.card}>
        <Text style={[NewStyles.title4, styles.title]}>{t('نسخهٔ جدید لوپ آماده است')}</Text>
        <Text style={styles.text}>{t('نسخه')} {release?.version}</Text>
        {!!release?.notes && <ScrollView style={styles.notes}><Text style={styles.text}>{release.notes}</Text></ScrollView>}
        {status === 'downloading' && <Text style={styles.text}>{t('در حال دانلود')} {progress}%</Text>}
        {status === 'error' && <Text style={styles.text}>{t('بروزرسانی انجام نشد. اتصال اینترنت و فضای خالی را بررسی و دوباره تلاش کنید.')}</Text>}
        {status === 'permission' && <Text style={styles.text}>{t('برای نصب بروزرسانی، اجازهٔ نصب از این برنامه را در تنظیمات اندروید فعال کنید و سپس به لوپ برگردید.')}</Text>}
        {['available', 'error'].includes(status) && button(t('دانلود بروزرسانی'), download)}
        {status === 'ready' && button(t('نصب نسخهٔ جدید'), install)}
        {status === 'permission' && <>{button(t('باز کردن تنظیمات نصب'), () => native.openInstallSettings().catch(() => updateState('error')))}{button(t('اجازه را فعال کردم؛ نصب'), install)}</>}
        {button(t('بعداً'), close)}
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, padding: space.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.bgColor(0.75) },
  card: { width: '100%', maxWidth: 460, maxHeight: '80%', padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.primary.color, gap: space.md },
  title: { color: colors.white.color, textAlign: 'center' }, text: { color: colors.white.color, fontSize: fontSize.md, textAlign: 'center' },
  notes: { maxHeight: 180 }, button: { padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.white.color },
  buttonText: { color: colors.white.color, textAlign: 'center', fontSize: fontSize.md },
});
