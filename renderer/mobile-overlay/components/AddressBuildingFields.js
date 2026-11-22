import React from 'react';
import { View, Text, TextInput } from 'react-native';
export default function AddressBuildingFields({ kind='home', value={}, onChange }) {
 const label=kind==='home'?'منزل':'محل کار';
 return <View style={{gap:8,marginVertical:10}}><Text style={{color:'#c8a84e',textAlign:'right'}}>جزئیات آدرس {label}</Text><View style={{flexDirection:'row',gap:8}}>
  {['number','unit','floor'].map((key,index)=><View key={key} style={{flex:1}}><Text style={{color:'#b7c9db',textAlign:'right'}}>{['پلاک','واحد','طبقه'][index]}</Text>
   <TextInput accessibilityLabel={['پلاک','واحد','طبقه'][index]+' '+label} keyboardType="number-pad" value={String(value[kind+'_'+key] ?? '')}
    onChangeText={(text)=>onChange(kind+'_'+key,text.replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[^0-9]/g,''))}
    style={{borderWidth:1,borderColor:'#71849b',borderRadius:8,padding:10,color:'#e9f1ff',backgroundColor:'#17334f',textAlign:'right'}} /></View>)}
 </View></View>;
}
