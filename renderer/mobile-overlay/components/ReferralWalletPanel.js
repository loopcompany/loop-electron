import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import api from '@services/Api';
import useRealtimeRefresh from '@hooks/useRealtimeRefresh';

const digits = (value) => String(value).replace(/[۰-۹٠-٩]/g, (c) => String(c.charCodeAt(0) - (c <= '۹' && c >= '۰' ? 1776 : 1632)));
const money = (value) => Number(value || 0).toLocaleString('fa-IR') + ' تومان';

export default function ReferralWalletPanel() {
  const [summary, setSummary] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState('');
  const [sheba, setSheba] = useState('');
  const [method, setMethod] = useState('sheba');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const result = await api.get('/referral-agent/summary');
      const data = result.data.data;
      setSummary(data);
      if (data?.is_agent) {
        const [earned, requests] = await Promise.all([api.get('/referral-agent/commissions'), api.get('/referral-agent/withdrawals')]);
        setCommissions(earned.data.data || []);
        setWithdrawals(requests.data.data || []);
      }
      setError('');
    } catch { setError('دریافت اطلاعات پورسانت انجام نشد؛ دوباره تلاش کنید.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['wallet','account'], load);
  const withdraw = async () => {
    if (busy) return;
    const value = Number(digits(amount));
    if (!Number.isSafeInteger(value) || value <= 0) { setError('مبلغ صحیح را به تومان وارد کنید.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api.post('/referral-agent/withdrawals', { amount: value, method, sheba_number: digits(sheba || summary.sheba_number || '') });
      setMessage(result.data.message); setAmount(''); await load();
    } catch (e) { setError(e.response?.data?.message || 'ثبت درخواست انجام نشد.'); }
    finally { setBusy(false); }
  };
  if (summary && !summary.is_agent) return null;
  if (!summary && !error) return null;
  return <View style={styles.panel}>
    <Text style={styles.title}>کیف پول پورسانت مسئول خرید</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {message ? <Text accessibilityRole="alert" style={styles.text}>{message}</Text> : null}
    <TouchableOpacity accessibilityRole="button" onPress={load}><Text style={styles.link}>دریافت اطلاعات تازه</Text></TouchableOpacity>
    {summary?.is_agent && <>
      <Text style={styles.text}>قابل برداشت: {money(summary.available_balance)}</Text>
      <Text style={styles.text}>در انتظار تسویه و اختتام: {money(summary.pending_balance)}</Text>
      <Text style={styles.text}>حداقل برداشت شبا: {money(summary.min_withdraw_amount)}</Text>
      <Text style={styles.text}>پورسانت پس از تسویهٔ کامل و بسته‌شدن پرونده، قابل برداشت می‌شود.</Text>
      <View style={styles.row}>{[['sheba','برداشت به شبا'],['offset','انتقال به کیف پول لوپ']].map(([key,label]) =>
        <TouchableOpacity key={key} accessibilityRole="button" accessibilityState={{selected:method===key}} disabled={busy} style={[styles.button, method===key && styles.selected]} onPress={()=>setMethod(key)}><Text style={styles.text}>{label}</Text></TouchableOpacity>)}</View>
      <TextInput accessibilityLabel="مبلغ برداشت پورسانت به تومان" placeholder="مبلغ به تومان" placeholderTextColor="#a9b4c5" keyboardType="numeric" value={amount} onChangeText={setAmount} style={styles.input} editable={!busy} />
      {method==='sheba' && <TextInput accessibilityLabel="شماره شبا" placeholder={summary.sheba_number || 'IR شماره شبا'} placeholderTextColor="#a9b4c5" value={sheba} onChangeText={setSheba} style={styles.input} autoCapitalize="characters" editable={!busy} />}
      <TouchableOpacity accessibilityRole="button" style={styles.button} disabled={busy} onPress={withdraw}><Text style={styles.text}>{busy ? 'در حال ثبت…' : method==='sheba' ? 'ثبت درخواست برداشت' : 'انتقال پورسانت به کیف پول لوپ'}</Text></TouchableOpacity>
      <Text style={styles.title}>سوابق پورسانت</Text>
      {commissions.length===0 && <Text style={styles.text}>پورسانتی ثبت نشده است.</Text>}
      {commissions.slice(0,10).map(item=><View key={item.id} style={styles.history}><Text style={styles.text}>سفارش {item.order_id} · {money(item.commission_amount)} · {item.status_label}</Text>{!!item.calculation_note && <Text style={styles.text}>{item.calculation_note}</Text>}</View>)}
      <Text style={styles.title}>سوابق برداشت</Text>
      {withdrawals.slice(0,10).map(item=><Text key={item.id} style={styles.text}>{money(item.amount)} · {item.status_label}</Text>)}
    </>}
  </View>;
}

const styles=StyleSheet.create({
  panel:{width:'100%',padding:18,gap:12,borderRadius:14,borderWidth:1,borderColor:'#d9a940',backgroundColor:'#10213d',marginVertical:18},
  title:{fontFamily:'VazirBold',fontSize:17,color:'#ecc873',textAlign:'right'},
  text:{fontFamily:'Vazir',fontSize:13,color:'#fff',textAlign:'right',lineHeight:24},
  error:{fontFamily:'Vazir',color:'#ffb4ab',textAlign:'right'},link:{fontFamily:'Vazir',color:'#ecc873',textAlign:'right'},
  input:{fontFamily:'Vazir',color:'#fff',borderColor:'#7a8799',borderWidth:1,borderRadius:8,padding:12,textAlign:'right'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:10},button:{padding:12,borderRadius:8,borderWidth:1,borderColor:'#ecc873'},selected:{backgroundColor:'#6b592f'},history:{borderTopWidth:1,borderColor:'#7a8799',paddingTop:10},
});
