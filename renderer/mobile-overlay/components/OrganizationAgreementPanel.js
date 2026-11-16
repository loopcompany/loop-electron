import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Linking, Platform, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { uri } from '@services/URL';
import { showToastOrAlert } from '@helpers/Common';
import useRealtimeRefresh from '@hooks/useRealtimeRefresh';
import { L } from '@org/orgI18n';

const MODES = { monthly_short: 'ماهانه', yearly_long: 'سالانه', project: 'پروژه‌ای' };
const STATUS = { 0: 'در انتظار بررسی', 1: 'پیش‌نویس ارسال شده', 2: 'درخواست رد شده', 3: 'توافق‌نامه نهایی', 4: 'نیازمند بررسی مجدد' };
const text = { fontFamily: 'VazirLight', textAlign: 'right', writingDirection: 'rtl', color: '#102d4c', flexShrink: 1 };

function Action({ label, onPress, disabled, secondary }) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
    style={{ padding: 12, borderRadius: 9, backgroundColor: secondary ? '#e2ecf5' : '#1269a5', opacity: disabled ? 0.4 : 1, maxWidth: '100%' }}>
    <Text style={[text, { textAlign: 'center', color: secondary ? '#102d4c' : '#fff' }]}>{L(label)}</Text>
  </TouchableOpacity>;
}

export default function OrganizationAgreementPanel({ deliveryModes = [], historyOnly = false, navigation }) {
  const token = useSelector((state) => state.auth?.token);
  const [data, setData] = useState({ requests: [], documents: {} });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [information, setInformation] = useState('');
  const [files, setFiles] = useState([]);
  const eligible = deliveryModes.filter((mode) => MODES[mode]);
  const active = data.requests.find((row) => ['0', '1'].includes(String(row.status)));
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const load = useCallback(async () => {
    if (!token) return;
    try { setData((await axios.get(`${uri}/organization/agreements`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })).data.data); }
    catch (error) { showToastOrAlert(error.response?.data?.message || L('خطا در دریافت سوابق توافق‌نامه')); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh(['contracts', 'catalog'], load);
  useEffect(() => { setInformation(active?.information || ''); setFiles([]); }, [active?.id]);
  const open = (url) => { if (url) Linking.openURL(url).catch(() => showToastOrAlert(L('باز کردن فایل ممکن نشد'))); };

  const create = async (modes, previous) => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await axios.post(`${uri}/organization/agreements`, { delivery_modes: modes, previous_request_id: previous }, { headers });
      showToastOrAlert(response.data.message); await load();
    } catch (error) { showToastOrAlert(Object.values(error.response?.data?.errors || {}).flat().join('\n') || error.response?.data?.message || L('ثبت درخواست ممکن نشد')); }
    finally { setBusy(false); }
  };
  const chooseFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    const selected = result.assets || [];
    if (selected.length > 5 || selected.reduce((sum, file) => sum + (file.size || 0), 0) > 20 * 1024 * 1024) {
      showToastOrAlert(L('حداکثر ۵ فایل با مجموع حجم ۲۰ مگابایت انتخاب کنید.')); return;
    }
    setFiles(selected);
  };
  const submitInformation = async () => {
    if (!active || busy) return;
    const form = new FormData();
    form.append('contract_request_id', String(active.id)); form.append('information', information);
    for (const file of files) {
      if (Platform.OS === 'web') form.append('files[]', file.file || await (await fetch(file.uri)).blob(), file.name);
      else form.append('files[]', { uri: file.uri, type: file.mimeType || 'application/pdf', name: file.name });
    }
    setBusy(true);
    try {
      const response = await axios.post(`${uri}/contracts/submit-information-for-request`, form, { headers });
      showToastOrAlert(response.data.message); setFiles([]); await load();
    } catch (error) { showToastOrAlert(error.response?.data?.message || L('ارسال اطلاعات ممکن نشد')); }
    finally { setBusy(false); }
  };

  return <View style={{ gap: 12, width: '100%', minWidth: 0 }}>
    <Text style={[text, { fontFamily: 'VazirBold', fontSize: 17 }]}>{L(historyOnly ? 'سوابق توافق‌نامه‌ها' : 'توافق‌نامه و مدارک سازمانی')}</Text>
    {loading && <ActivityIndicator />}
    <Action label="قوانین و شرایط قرارداد سازمانی / شرکتی" disabled={!data.documents.terms} secondary onPress={() => open(data.documents.terms)} />
    {!historyOnly && <>
      <Action label="دریافت فرم سنجش و ارزیابی" disabled={!eligible.length || !data.documents.assessment} secondary onPress={() => open(data.documents.assessment)} />
      <Action label="دریافت پیش‌نویس شرایط عمومی توافق‌نامه" disabled={!eligible.length || !data.documents.general_draft} secondary onPress={() => open(data.documents.general_draft)} />
      <Action label="درخواست توافق‌نامه" disabled={!eligible.length || !!active || busy} onPress={() => create(eligible, data.requests[0]?.id)} />
      {!eligible.length && <Text style={text}>{L('توافق‌نامه فقط برای خدمات ماهانه، سالانه و پروژه‌ای فعال است.')}</Text>}
    </>}
    {historyOnly && <Action label="درخواست جدید از انتخاب جامع" secondary onPress={() => navigation?.navigate('ComprehensiveSelectionScreen')} />}
    {!loading && !data.requests.length && <Text style={text}>{L('هنوز درخواست توافق‌نامه‌ای ثبت نشده است.')}</Text>}
    {data.requests.map((request) => <View key={request.id} style={{ gap: 9, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#a9c4dc', backgroundColor: '#fff' }}>
      <Text style={[text, { fontFamily: 'VazirBold' }]}>{L('توافق‌نامه')} #{request.id} — {L(STATUS[request.status] || 'در انتظار بررسی')}</Text>
      {!!request.delivery_modes?.length && <Text style={text}>{request.delivery_modes.map((mode) => L(MODES[mode] || mode)).join('، ')}</Text>}
      {!!request.reject_reason && <Text style={[text, { color: '#b91c1c' }]}>{request.reject_reason}</Text>}
      {request.id !== active?.id && !!request.information && <Text style={text}>{request.information}</Text>}
      {(request.gallery || []).map((file, index) => <Action key={file.id} secondary label={`${L('مشاهده پیوست')} ${index + 1}`} onPress={() => open(file.url)} />)}
      <Action label="نمایش / ذخیره پیش‌نویس توافق‌نامه" disabled={!request.draft_url} onPress={() => open(request.draft_url)} />
      <Action label="نمایش / ذخیره توافق‌نامه نهایی" disabled={!request.final_url} onPress={() => open(request.final_url)} />
      {!!request.draft_url && !request.final_url && <Text style={text}>{L('پس از مطالعه و چاپ، نسخهٔ فیزیکی مهر و امضاشده را با پیک یا حضوری به شرکت لوپ تحویل دهید. نسخهٔ نهایی پس از ارسال ادمین فعال می‌شود.')}</Text>}
      {request.id === active?.id && <>
        {!!request.need_docs && <Text style={text}>{request.need_docs}</Text>}
        <TextInput accessibilityLabel={L('اطلاعات و توضیحات درخواست')} placeholder={L('اطلاعات و توضیحات درخواست')} multiline maxLength={20000}
          value={information} onChangeText={setInformation} style={[text, { minHeight: 90, borderWidth: 1, borderColor: '#a9c4dc', padding: 10, borderRadius: 8, textAlignVertical: 'top' }]} />
        <Action label="بارگذاری نامه و اطلاعات جامع" secondary disabled={busy} onPress={chooseFiles} />
        {files.map((file, index) => <Text key={index} style={text}>{file.name}</Text>)}
        <Action label="ارسال اطلاعات و مدارک درخواست" disabled={busy || (!information.trim() && !files.length)} onPress={submitInformation} />
      </>}
      {!active && <Action label="درخواست مجدد" secondary disabled={busy} onPress={() => request.delivery_modes?.length ? create(request.delivery_modes, request.id) : navigation?.navigate('ComprehensiveSelectionScreen')} />}
    </View>)}
  </View>;
}
