import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Pressable, ScrollView, Text, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import i18n from 'i18next';
import { uri } from '@services/URL';
import { setLanguage } from '@slices/languageSlice';
import { createRealtimeClient } from '@services/realtime/client';
import { setLanguageMetadata } from '@services/localizationRegistry';
const defaults=[{code:'fa',native_name:'فارسی',direction:'rtl'},{code:'en',native_name:'English',direction:'ltr'}];
const Context=createContext({languages:defaults,openLanguagePicker:()=>{},selectLanguage:()=>{}});
export const useLocalization=()=>useContext(Context);
export default function LocalizationProvider({ children, app='customer' }) {
 const dispatch=useDispatch();
 const [languages,setLanguages]=useState(defaults);
 const [visible,setVisible]=useState(false);
 const [language,setCurrentLanguage]=useState(i18n.language || 'fa');
 const [revision,setRevision]=useState(0);
 const base=useRef(Object.fromEntries(['fa','en'].map((lng)=>[lng,JSON.parse(JSON.stringify(i18n.getResourceBundle(lng,'translation') || {}))])));
 const generation=useRef(0),locale=useRef(i18n.language || 'fa'),alive=useRef(true),latest=useRef(null);
 const apply=useCallback(async(data,selected)=>{
  if(!alive.current)return;
  i18n.options.nsSeparator=false;
  const available=Array.isArray(data.languages)&&data.languages.length?data.languages:defaults;
  const next=available.some((entry)=>entry.code===selected)?selected:'fa';
  setLanguageMetadata(available);setLanguages(available);
  for(const [lng,bundles] of Object.entries(data.resources||{})) {
   i18n.removeResourceBundle(lng,'translation');
   i18n.addResourceBundle(lng,'translation',{...(base.current[lng]||{}),...(bundles.translation||{})},true,true);
  }
  locale.current=next;setCurrentLanguage(next);setRevision(data.revision||0);
  await i18n.changeLanguage(next);
  dispatch(setLanguage(next));
  AsyncStorage.setItem('language',next).catch(()=>{});
 },[dispatch]);
 const load=useCallback(async(selected=locale.current)=>{
  const request=++generation.current;
  const response=await fetch(uri+'/localization/bootstrap?app='+encodeURIComponent(app)+'&locale='+encodeURIComponent(selected));
  if(!response.ok)throw new Error('Localization unavailable');
  const data=await response.json();
  if(request!==generation.current || !alive.current)return data;
  latest.current=data;
  await apply(data,data.locale || selected);
  AsyncStorage.setItem('localization-cache-'+app,JSON.stringify(data)).catch(()=>{});
  return data;
 },[app,apply]);
 const selectLanguage=useCallback(async(code)=>{
  setVisible(false);
  try {await load(code);}catch {locale.current=code;setCurrentLanguage(code);await i18n.changeLanguage(code);dispatch(setLanguage(code));}
  AsyncStorage.setItem('language',locale.current).catch(()=>{});
 },[load,dispatch]);
 useEffect(()=>{
  alive.current=true;let client;
  (async()=>{
   const saved=await AsyncStorage.getItem('language').catch(()=>null);if(saved)locale.current=saved;
   const cached=await AsyncStorage.getItem('localization-cache-'+app).catch(()=>null);
   if(cached){try{const data=JSON.parse(cached);if(data.locale===locale.current)await apply(data,locale.current);}catch{}}
   try {await load(locale.current);}catch{}
   if(!alive.current)return;
   client=createRealtimeClient({
    config:async()=>{const data=await load(locale.current);return data.realtime || {enabled:false};},
    socketOptions:Platform.OS==='web'?undefined:{headers:{Origin:uri.replace(/\/api\/?$/,'')}},
    onEvent:(event)=>{if(event.reconnect || event.topics?.includes('localization'))load(locale.current).catch(()=>{});},
   });
   if(AppState.currentState!=='background')client.start();
  })().catch(()=>{});
  const subscription=AppState.addEventListener('change',(state)=>{
   if(state==='active'){load(locale.current).catch(()=>{});client?.start();}
   else if(state==='background')client?.stop();
  });
  return()=>{alive.current=false;generation.current++;subscription.remove();client?.stop();};
 },[app,apply,load]);
 return <Context.Provider value={{languages,language,revision,selectLanguage,openLanguagePicker:()=>setVisible(true)}}>
  {children}
  <Modal transparent visible={visible} animationType="fade" onRequestClose={()=>setVisible(false)}>
   <Pressable onPress={()=>setVisible(false)} style={{flex:1,backgroundColor:'rgba(0,0,0,0.6)',justifyContent:'center',alignItems:'center',padding:24}}>
    <Pressable style={{width:'100%',maxWidth:420,maxHeight:'75%',backgroundColor:'#10283e',borderRadius:16,padding:18}} onPress={()=>{}}>
     <Text style={{color:'#f2cb4d',fontWeight:'bold',fontSize:20,textAlign:'center',marginBottom:12}}>{i18n.t('زبان / Language')}</Text>
     <ScrollView>{languages.map((entry)=><Pressable key={entry.code} accessibilityRole="button" onPress={()=>selectLanguage(entry.code)} style={{padding:14,borderBottomWidth:1,borderBottomColor:'#3d5872'}}>
      <Text style={{color:entry.code===language?'#ffd95d':'#fff',textAlign:entry.direction==='rtl'?'right':'left'}}>{entry.native_name} — {entry.code.toUpperCase()}{entry.code===language?' ✓':''}</Text>
     </Pressable>)}</ScrollView>
     <Pressable accessibilityLabel="بستن انتخاب زبان" onPress={()=>setVisible(false)} style={{padding:14}}><Text style={{color:'#fff',textAlign:'center'}}>×</Text></Pressable>
    </Pressable>
   </Pressable>
  </Modal>
 </Context.Provider>;
}
export function LanguageSelector(){
 const {languages,language,openLanguagePicker}=useLocalization();
 const selected=languages.find((entry)=>entry.code===language);
 return <Pressable accessibilityRole="button" accessibilityLabel="انتخاب زبان / Language" onPress={openLanguagePicker} style={{padding:10}}><Text style={{color:'#fff',fontWeight:'bold'}}>{(selected?.code || language || 'fa').toUpperCase()} ▾</Text></Pressable>;
}
