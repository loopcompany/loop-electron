import React, { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Button from '@components/Button';
import NewStyles from '@styles/NewStyles';
import { spacing } from '@theme/Spacing';
import { uri } from '@services/URL';
import { showAlert, showToastOrAlert } from '@helpers/Common';
import { describeApiError } from '@utils/apiErrorHandler';
import { L } from '@org/orgI18n';
import OrderRequestDetails from '@components/OrderRequestDetails';

export default function OrderQuoteCard({ orderId, order, quote, readOnly, onChanged }) {
  const token = useSelector((state) => state.auth.token);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  if (!quote?.id) return null;

  const sendDecision = async (decision) => {
    if (!token || inFlight.current || readOnly || quote.status !== 'sent') return;
    if (decision === 'reject' && !note.trim()) {
      showToastOrAlert(L('دلیل درخواست بازنگری را وارد کنید.'));
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const endpoint = decision === 'cancel' ? '/orders/cancel' : `/orders/${orderId}/quote/decision`;
      const body = decision === 'cancel' ? { orderId } : { quote_id: quote.id, decision, note: note.trim() || undefined };
      const { data } = await axios.post(`${uri}${endpoint}`, body, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!data?.success) throw new Error(data?.message || L('ثبت تصمیم انجام نشد.'));
      setNote('');
      onChanged();
    } catch (error) {
      showToastOrAlert(error.response ? describeApiError(error) : L('ثبت تصمیم انجام نشد.'));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={[NewStyles.border10, { margin: spacing.md, padding: spacing.md, gap: spacing.sm }]}>
      <Text style={NewStyles.title}>{L('پیش‌رسید برآورد سفارش')}</Text>
      <Text style={NewStyles.text}>{Number(quote.total).toLocaleString()} {L('تومان')}</Text>
      {!!quote.description && <Text style={NewStyles.text}>{quote.description}</Text>}
      {!!quote.parts_description && <Text style={NewStyles.text}>{quote.parts_description}</Text>}
      {!!quote.status_label && <Text style={NewStyles.text}>{quote.status_label}</Text>}
      <OrderRequestDetails order={order} titleStyle={NewStyles.title} textStyle={NewStyles.text} />
      {!readOnly && quote.status === 'sent' && (
        <>
          <Button title={L('ثبت سفارش')} onPress={() => sendDecision('accept')} disabled={busy} />
          <TextInput
            style={[NewStyles.textInput, NewStyles.text]}
            value={note}
            onChangeText={setNote}
            placeholder={L('دلیل درخواست بازنگری')}
            multiline
            maxLength={1000}
            editable={!busy}
          />
          <Button title={L('درخواست بازنگری هزینه‌ها')} onPress={() => sendDecision('reject')} disabled={busy} />
          <Button title={L('لغو سفارش')} disabled={busy} onPress={() => showAlert(
            L('لغو سفارش'),
            L('آیا از لغو سفارش مطمئن هستید؟'),
            [{ text: L('انصراف'), style: 'cancel' }, { text: L('لغو سفارش'), style: 'destructive', onPress: () => sendDecision('cancel') }]
          )} />
        </>
      )}
    </View>
  );
}
