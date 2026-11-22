const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const appRepo=path.basename(path.resolve(__dirname,'..'));
const babelRepo=appRepo==='loop-electron'?'loop-customer-mobile':appRepo;
const babel=require(path.join(root,babelRepo,'node_modules/@babel/core'));
const i18next=require(path.join(root,babelRepo,'node_modules/i18next'));
for(const repo of [appRepo]) {
 test(repo+': JSX localization subscribes before early returns and preserves non-text props',()=>{
  const source=`export default function Screen({hidden}) {if(hidden)return null;return <Text testID="شناسه ثابت" title="راهنما">سلام{'جهان'}</Text>}`;
  const output=babel.transformSync(source,{filename:'Screen.jsx',configFile:false,babelrc:false,generatorOpts:{jsescOption:{minimal:true}},parserOpts:{plugins:['jsx']},plugins:[require(path.join(root,repo,'scripts/localize-ui-literals.cjs'))]}).code;
  assert.match(output,/useTranslation\(\)/); assert.ok(output.indexOf('useTranslation();')<output.indexOf('if (hidden)'));
  assert.match(output,/testID="شناسه ثابت"/);assert.match(output,/\.t\("سلام"/);assert.match(output,/\.t\("جهان"/);
 });
 test(repo+': Expo transform works for multiple translated exports in one module',()=>{
  const vm=require('node:vm');let hooks=0;
  const source='export function First(){return <Text>اول</Text>} export default function Second(){return <Text>دوم</Text>}';
  const output=babel.transformSync(source,{filename:'Screen.jsx',configFile:false,babelrc:false,presets:[require.resolve(path.join(root,babelRepo,'node_modules/babel-preset-expo'))],plugins:[require(path.join(root,repo,'scripts/localize-ui-literals.cjs'))]}).code;
  const exports={};vm.runInNewContext(output,{exports,Text:'Text',require(name){if(name==='react-i18next')return {useTranslation(){hooks++}};if(name==='i18next')return {t:key=>'translated '+key};if(name==='react/jsx-runtime')return {jsx:(tag,props)=>props};return require(name)}});
  assert.equal(exports.First().children,'translated اول');assert.equal(exports.default().children,'translated دوم');assert.equal(hooks,2);
 });
 test(repo+': localization hook stays outside useMemo callbacks',()=>{
  const output=babel.transformSync('export default function Screen(){const Body=useMemo(()=> <Text>سلام</Text>,[]);return Body}',{filename:'Screen.jsx',configFile:false,babelrc:false,parserOpts:{plugins:['jsx']},plugins:[require(path.join(root,repo,'scripts/localize-ui-literals.cjs'))]}).code;
  assert.equal((output.match(/useTranslation\(\)/g)||[]).length,1);assert.ok(output.indexOf('useTranslation();')<output.indexOf('const Body'));
 });
 test(repo+': text interpolation preserves whitespace and evaluates values once',()=>{
  const vm=require('node:vm');const calls=[];
  const source='export default function Screen({name,count}){return <Text>سلام {name} {`تعداد ${count} سفارش`}</Text>}';
  const output=babel.transformSync(source,{filename:'Screen.jsx',configFile:false,babelrc:false,presets:[require.resolve(path.join(root,babelRepo,'node_modules/babel-preset-expo'))],plugins:[require(path.join(root,repo,'scripts/localize-ui-literals.cjs'))]}).code;
  const exports={};vm.runInNewContext(output,{exports,Text:'Text',require(name){if(name==='react-i18next')return {useTranslation(){}};if(name==='i18next')return {t(key,params){calls.push([key,params]);return key==='سلام'?'Bonjour':params.value0+' commandes'}};if(name==='react/jsx-runtime')return {jsx:(tag,props)=>props,jsxs:(tag,props)=>props};return require(name)}});
  assert.equal(exports.default({name:'Ali',count:2}).children.join(''),'Bonjour Ali 2 commandes');assert.equal(calls[1][0],'تعداد {{value0}} سفارش');assert.equal(calls[1][1].value0,2);
 });
 test(repo+': standalone system alerts translate literals without adding React hooks or changing user input',()=>{
  const vm=require('node:vm');let captured;
  const output=babel.transformSync("export default function notify(message){showAlert('خطا',message)}",{filename:'notify.js',configFile:false,babelrc:false,presets:[require.resolve(path.join(root,babelRepo,'node_modules/babel-preset-expo'))],plugins:[require(path.join(root,repo,'scripts/localize-ui-literals.cjs'))]}).code;
  assert.doesNotMatch(output,/useTranslation/);const exports={};vm.runInNewContext(output,{exports,showAlert:(...args)=>{captured=args},require(name){if(name==='i18next')return {t:()=> 'Erreur'};return require(name)}});
  exports.default('متن واردشده کاربر');assert.deepEqual(captured,['Erreur','متن واردشده کاربر']);
 });
 test(repo+': public catalog subscription does not bypass private authorization',async()=>{
  const {createRealtimeClient}=require(path.join(root,repo==='loop-electron'?'loop-electron/renderer/mobile-overlay':repo,'services/realtime/client.js'));
  const sockets=[],requests=[],events=[];
  class Socket {constructor(){this.readyState=1;this.sent=[];sockets.push(this)}send(value){this.sent.push(JSON.parse(value))}close(){this.readyState=3}frame(event,data,channel){return this.onmessage({data:JSON.stringify({event,data:JSON.stringify(data),channel})})}}
  const client=createRealtimeClient({WebSocket:Socket,config:async()=>({enabled:true,host:'example.test',key:'public-key',scheme:'wss',port:443,channels:['localization','private-user.9']}),authUrl:'/auth',fetch:async(url,request)=>{requests.push(JSON.parse(request.body));return {ok:true,json:async()=>({auth:'signed-private-channel'})}},onEvent:event=>events.push(event)});
  try{
   client.start();await new Promise(resolve=>setImmediate(resolve)); const socket=sockets[0];
   await socket.frame('pusher:connection_established',{socket_id:'1.2',activity_timeout:30});
   assert.deepEqual(requests,[{socket_id:'1.2',channel_name:'private-user.9'}]);
   assert.deepEqual(socket.sent.filter(x=>x.event==='pusher:subscribe').map(x=>x.data),[{channel:'localization'},{channel:'private-user.9',auth:'signed-private-channel'}]);
   await socket.frame('data.changed',{topics:['localization'],revision:4},'localization');assert.equal(events.length,0);
   await socket.frame('pusher_internal:subscription_succeeded',{},'localization');
   await socket.frame('data.changed',{topics:['localization'],revision:4},'localization');assert.equal(events.at(-1).revision,4);
   await socket.frame('data.changed',{topics:['orders']},'private-user.OTHER');assert.equal(events.at(-1).revision,4);
  }finally{client.stop()}
 });
}
test('standard i18next flat/nested keys, pluralization, editable Persian and fallback',async()=>{
 const instance=i18next.createInstance();await instance.init({showSupportNotice:false,lng:'fr',fallbackLng:'fa',resources:{fa:{translation:{'orders.count_one':'{{count}} سفارش','orders.count_other':'{{count}} سفارش','Fallback':'فارسی ویرایش‌شده'}},fr:{translation:{'orders.count_one':'{{count}} commande','orders.count_other':'{{count}} commandes'}}}});
 assert.equal(instance.t('orders.count',{count:2}),'2 commandes');assert.equal(instance.t('Fallback'),'فارسی ویرایش‌شده');
 instance.addResourceBundle('fa','translation',{Fallback:'فارسی تازه'},true,true);assert.equal(instance.t('Fallback'),'فارسی تازه');
});
