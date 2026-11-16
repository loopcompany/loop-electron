import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { imageUri } from '@services/URL';
import { showToastOrAlert } from '@helpers/Common';

function attachmentUrl(path) {
  if (typeof path !== 'string' || !path.trim()) return null;
  const value = path.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//') || /^[a-z][\w+.-]*:/i.test(value)) return null;
  return `${imageUri}/${value.replace(/^\/+/, '').replace(/^storage\//i, '')}`;
}

export default function CustomerOrderAttachments({ order, titleStyle, textStyle }) {
  const { t } = useTranslation();
  const paths = [
    order?.image_path,
    ...(order?.order_galleries ?? []).map((file) => file?.image_path),
    order?.service_schedule_long_file,
    order?.service_schedule_short_file,
  ];
  const urls = [...new Set(paths.map(attachmentUrl).filter(Boolean))];
  if (!urls.length) return null;

  return (
    <View style={styles.section}>
      <Text style={titleStyle}>{t('Order attachments')}</Text>
      <View style={styles.files}>
        {urls.map((url, index) => {
          const label = t('Open order attachment', { number: index + 1 });
          const extension = /\.([a-z0-9]+)$/i.exec(url.split(/[?#]/)[0])?.[1];
          const image = !extension || /^(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(extension);
          return (
            <Pressable key={url} accessibilityRole="link" accessibilityLabel={label}
              onPress={() => Linking.openURL(url).catch(() => showToastOrAlert(t('Unable to open order attachment')))}>
              {image ? <Image source={{ uri: url }} style={styles.image} resizeMode="contain" /> : <Text style={textStyle}>{label}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  files: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  image: { width: 120, height: 120, borderRadius: 8 },
});
