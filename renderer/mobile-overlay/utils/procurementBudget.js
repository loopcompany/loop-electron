const one=['','یک','دو','سه','چهار','پنج','شش','هفت','هشت','نه'];
const teens=['ده','یازده','دوازده','سیزده','چهارده','پانزده','شانزده','هفده','هجده','نوزده'];
const tens=['','','بیست','سی','چهل','پنجاه','شصت','هفتاد','هشتاد','نود'];
const hundreds=['','صد','دویست','سیصد','چهارصد','پانصد','ششصد','هفتصد','هشتصد','نهصد'];
const scales=['','هزار','میلیون','میلیارد','تریلیون','کوادریلیون'];
export const normalizeBudget=(value)=>String(value??'').replace(/[۰-۹٠-٩]/g,(c)=>String('۰۱۲۳۴۵۶۷۸۹'.includes(c)?'۰۱۲۳۴۵۶۷۸۹'.indexOf(c):'٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[^0-9]/g,'').slice(0,16);
export function numberInPersianWords(value) {
 let n=Number(value); if(!Number.isSafeInteger(n)||n<0)return ''; if(n===0)return 'صفر';
 const groups=[];let index=0;
 while(n>0) {
  let chunk=n%1000;const words=[];
  if(chunk>=100){words.push(hundreds[Math.floor(chunk/100)]);chunk%=100;}
  if(chunk>=20){words.push(tens[Math.floor(chunk/10)]);chunk%=10;}
  if(chunk>=10)words.push(teens[chunk-10]);else if(chunk)words.push(one[chunk]);
  if(words.length)groups.unshift(words.join(' و ')+(scales[index]?' '+scales[index]:''));
  n=Math.floor(n/1000);index++;
 }
 return groups.join(' و ');
}
export function budgetInWords(rial) {
 const n=Number(normalizeBudget(rial));if(!Number.isSafeInteger(n))return 'مبلغ نامعتبر';
 const toman=Math.floor(n/10), remainder=n%10;
 return new Intl.NumberFormat('fa-IR',{maximumFractionDigits:1}).format(n/10)+' تومان — '+numberInPersianWords(toman)+' تومان'+(remainder?' و '+numberInPersianWords(remainder)+' ریال':'');
}
export const isValidBudget=(value)=>{const n=Number(normalizeBudget(value));return Number.isSafeInteger(n) && n>0 && n<=9007199254740990;};
export function procurementNeedsBudget(itemId,entry) {
 return ['case_standard','case_professional','mini_case','laptop'].includes(itemId) && (Number(entry?.new || 0)+Number(entry?.used || 0)>0) && (!isValidBudget(entry?.budgetRial) || (Number(entry?.used)>0 && !entry?.desc?.trim()));
}
