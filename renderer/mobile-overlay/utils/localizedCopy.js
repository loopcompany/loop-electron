/** Resolve legacy bilingual copy through the editable i18next catalog. */
import i18n from 'i18next';
export default function localizedCopy(base,english,language=i18n.language) {
 if(typeof base==='string')return /[\u0600-\u06ff]/.test(base) ? i18n.t(base,{lng:language,defaultValue:language==='en' && typeof english==='string'?english:base}) : base;
 if(Array.isArray(base))return base.map((value,index)=>localizedCopy(value,english?.[index],language));
 if(base && typeof base==='object')return Object.fromEntries(Object.entries(base).map(([key,value])=>[key,localizedCopy(value,english?.[key],language)]));
 return base;
}
