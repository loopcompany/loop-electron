import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { uri } from '@services/URL';
import { showAlert, showToastOrAlert } from '@helpers/Common';
import { L } from '@org/orgI18n';

export default function CustomerVisitDecisionCard({ orderId, workflow, onChanged }) {
  const token = useSelector((state) => state.auth?.token);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!workflow?.awaiting_visit_decision) return null;
  const submit = async (decision) => {
    if (busy) return;
    if (decision !== 'accept' && !note.trim()) { showToastOrAlert(L('علت درخواست را وارد کنید.')); return; }
    setBusy(true);
    try {
      const response = await axios.post(`${uri}/orders/${orderId}/visit/decision`, { decision, note: note.trim() || null }, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      showToastOrAlert(response.data.message); onChanged?.();
    } catch (error) { showToastOrAlert(error.response?.data?.message || L('ثبت تصمیم مراجعه ممکن نشد.')); }
    finally { setBusy(false); }
  };
  return <View style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#0ea5e9', gap: 10, backgroundColor: '#eaf6ff' }}>
    <Text style={{ fontFamily: 'VazirBold', textAlign: 'right' }}>{L('تأیید مراجعهٔ تکنسین پس از تأیید قیمت')}</Text>
    <Text style={{ fontFamily: 'VazirLight', textAlign: 'right' }}>{[workflow.visit_date, workflow.visit_time].filter(Boolean).join(' — ')}</Text>
    <TextInput value={note} onChangeText={setNote} multiline maxLength={1000} placeholder={L('توضیحات / علت هماهنگی مجدد یا لغو')}
      style={{ fontFamily: 'VazirLight', textAlign: 'right', minHeight: 70, borderWidth: 1, borderColor: '#94a3b8', borderRadius: 8, padding: 10 }} />
    {[
      ['accept', 'تأیید مراجعه', '#0369a1'], ['recoordinate', 'هماهنگی مجدد', '#b45309'], ['cancel', 'لغو سفارش', '#b91c1c'],
    ].map(([decision, label, color]) => <TouchableOpacity key={decision} disabled={busy} style={{ padding: 12, borderRadius: 8, backgroundColor: color, opacity: busy ? 0.5 : 1 }}
      onPress={() => decision === 'cancel' ? showAlert(L('لغو سفارش'), L('آیا از لغو سفارش مطمئن هستید؟'), [
        { text: L('انصراف'), style: 'cancel' }, { text: L('لغو سفارش'), style: 'destructive', onPress: () => submit(decision) },
      ]) : submit(decision)}>
      <Text style={{ color: '#fff', fontFamily: 'VazirBold', textAlign: 'center' }}>{L(label)}</Text>
    </TouchableOpacity>)}
  </View>;
}
