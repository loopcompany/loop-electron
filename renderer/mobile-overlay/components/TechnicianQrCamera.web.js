import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import NewStyles from '@styles/NewStyles';

export default function TechnicianQrCamera({ onRead }) {
  const { t } = useTranslation();
  const video = useRef(null), stream = useRef(null), timer = useRef(null), alive = useRef(true);
  const [message, setMessage] = useState(''), [value, setValue] = useState('');
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(timer.current); stream.current?.getTracks().forEach((track) => track.stop()); }; }, []);
  const start = async () => {
    if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) { setMessage(t('این مرورگر اسکن دوربین را پشتیبانی نمی‌کند؛ از اپ اندروید یا نشانی QR استفاده کنید.')); return; }
    try {
      stream.current?.getTracks().forEach((track) => track.stop());
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (!alive.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media; video.current.srcObject = media; await video.current.play();
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const scan = async () => {
        if (!alive.current) return;
        try { const results = await detector.detect(video.current); if (results[0]?.rawValue) onRead(results[0].rawValue); } catch { /* The camera may still be preparing its first frame. */ }
        if (alive.current) timer.current = setTimeout(scan, 250);
      };
      scan();
    } catch { if (alive.current) setMessage(t('دسترسی به دوربین فراهم نشد.')); }
  };
  return <View style={{ flex: 1 }}>
    <video ref={video} playsInline muted style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain' }} />
    <Pressable accessibilityRole="button" onPress={start}><Text style={NewStyles.title4}>{t('شروع اسکن دوربین')}</Text></Pressable>
    {!!message && <Text style={NewStyles.title4}>{message}</Text>}
    <TextInput accessibilityLabel={t('نشانی QR کارت تکنسین')} placeholder={t('نشانی QR کارت تکنسین')} value={value} onChangeText={setValue} style={[NewStyles.textInput, NewStyles.text10]} autoCapitalize="none" />
    <Pressable accessibilityRole="button" onPress={() => value.trim() && onRead(value.trim())}><Text style={NewStyles.title4}>{t('بررسی کارت')}</Text></Pressable>
  </View>;
}
