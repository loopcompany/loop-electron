import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import api from '@services/axiosConfig';
import { uri } from '@services/URL';
import { showToastOrAlert } from '@helpers/Common';
import { budgetInWords, normalizeBudget, isValidBudget } from '@utils/procurementBudget';
const titles = { 'کیس معمولی':'case_standard', 'کیس حرفه‌ای':'case_professional', 'مینی کیس':'mini_case', 'لپ تاپ':'laptop' };
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const n=Math.floor(Math.random()*16);return (c==='x'?n:(n&3)|8).toString(16); });
export default function ProcurementConsultationActions({ itemId, title, newCount=0, usedCount=0, desc='', budgetRial='', onBudgetChange }) {
 const [busy,setBusy]=useState(false);
 const token=useSelector((state)=>state.auth?.token);
 const attempt=useRef(null);
 const id=itemId || titles[title];
 if (!['case_standard','case_professional','mini_case','laptop'].includes(id)) return null;
 const submit=async()=>{
  const budget=normalizeBudget(budgetRial);
  if (!token) { showToastOrAlert('ابتدا وارد حساب کاربری شوید.'); return; }
  if (!isValidBudget(budget) || !desc.trim() || newCount+usedCount<=0) {
   showToastOrAlert('لطفاً تعداد، توضیحات و محدوده هزینه را با دقت مشخص کنید.'); return;
  }
  const payload={item_id:id,new_count:newCount,used_count:usedCount,description:desc.trim(),budget_rial:budget};
  const fingerprint=JSON.stringify(payload);
  if (attempt.current?.fingerprint!==fingerprint) attempt.current={fingerprint,id:uuid()};
  if(busy)return;
  setBusy(true);
  try {
   const response=await api.post(uri+'/procurement-consultations',{...payload,client_request_id:attempt.current.id},{headers:{Authorization:'Bearer '+token}});
   showToastOrAlert(response.data?.message || 'درخواست مشاوره شما ثبت شد.');
  } catch(error) {
   const errors=error.response?.data?.errors;
   showToastOrAlert(errors?Object.values(errors).flat().join('\n'):(error.response?.data?.message || 'ثبت درخواست انجام نشد. دوباره تلاش کنید.'));
  } finally { setBusy(false); }
 };
 return <View style={{gap:8,marginTop:8}}>
  <TextInput accessibilityLabel="محدوده هزینه مورد نظر شما (ریال)" placeholder="محدوده هزینه مورد نظر شما * (ریال)"
   value={String(budgetRial || '')} onChangeText={(value)=>onBudgetChange?.(normalizeBudget(value))} keyboardType="number-pad"
   style={{borderWidth:1,borderColor:'#7c98b8',borderRadius:8,padding:12,color:'#eff6ff',backgroundColor:'#17334f',textAlign:'right'}} />
  {!!budgetRial && <Text style={{color:'#ffd65a',textAlign:'right'}}>{budgetInWords(budgetRial)}</Text>}
  <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={{backgroundColor:'#075897',padding:12,borderRadius:8,opacity:busy?0.6:1}}>
   <Text style={{color:'#fff',textAlign:'center',fontWeight:'bold'}}>{busy?'در حال ثبت…':'درخواست مشاوره تأمین محصول / کالا'}</Text>
  </Pressable>
 </View>;
}
