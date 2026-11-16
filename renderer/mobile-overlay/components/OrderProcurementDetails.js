import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function OrderProcurementDetails({ items, titleStyle, textStyle }) {
  const { t } = useTranslation();
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <View style={{ gap: 10 }}>
      <Text style={titleStyle}>{t('Requested goods and equipment')}</Text>
      {items.map((item, index) => {
        const title = typeof item === 'string' ? item : item?.title ?? item?.name ?? item?.item_id;
        const counts = [];
        if (Number(item?.new_count) > 0) counts.push(t('Requested new quantity', { quantity: item.new_count }));
        if (Number(item?.used_count) > 0) counts.push(t('Requested used quantity', { quantity: item.used_count }));
        const legacyCount = item?.quantity ?? item?.count;
        if (counts.length === 0 && legacyCount != null) counts.push(t('Requested quantity', { quantity: legacyCount }));

        return (
          <View key={index} style={{ gap: 4 }}>
            <Text style={textStyle}>{title || t('Requested goods and equipment')}</Text>
            {counts.length > 0 && <Text style={textStyle}>{counts.join(' / ')}</Text>}
            {!!item?.description && <Text style={textStyle}>{item.description}</Text>}
          </View>
        );
      })}
    </View>
  );
}
