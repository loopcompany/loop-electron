import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import OrderProcurementDetails from '@components/OrderProcurementDetails';

export default function OrderRequestDetails({ order, titleStyle, textStyle }) {
  const { t } = useTranslation();
  const fields = order?.order_details ?? [];
  if (!fields.length && !order?.des && !order?.procurement_items?.length) return null;

  return (
    <View style={{ gap: 10 }}>
      {fields.map((field) => (
        <View key={field.id} style={{ gap: 4 }}>
          <Text style={titleStyle}>{field.title}</Text>
          {(field.data ?? []).map((item) => {
            const option = item.field_detail;
            const title = item.type === 'input' ? option?.second_title || option?.title : option?.title;
            const showValue = item.type === 'input' || item.type === 'counter' || Number(option?.has_counter) > 0 || !title;
            return (
              <View key={item.id}>
                <Text style={textStyle}>{[title, showValue ? item.value : null].filter((part) => part != null && part !== '').join(' · ')}</Text>
                {!!item.user_descriptions && <Text style={textStyle}>{item.user_descriptions}</Text>}
              </View>
            );
          })}
        </View>
      ))}
      {!!order.des && (
        <View style={{ gap: 4 }}>
          <Text style={titleStyle}>{t('User description')}</Text>
          <Text style={textStyle}>{order.des}</Text>
        </View>
      )}
      <OrderProcurementDetails items={order.procurement_items} titleStyle={titleStyle} textStyle={textStyle} />
    </View>
  );
}
