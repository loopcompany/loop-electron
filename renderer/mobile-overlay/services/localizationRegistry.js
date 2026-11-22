let languages=new Map([['fa','rtl'],['en','ltr']]);
export function setLanguageMetadata(entries){languages=new Map(entries.map((entry)=>[entry.code,entry.direction]));}
export function languageDirection(code){if(languages.has(code))return languages.get(code);return ['fa','ar','he','ur','ps','ckb'].includes(String(code||'').toLowerCase().split('-')[0])?'rtl':'ltr';}
