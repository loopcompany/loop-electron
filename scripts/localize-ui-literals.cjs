/** Translate legacy JSX copy and subscribe its component to catalog changes. */
module.exports = function({types:t}) {
 function translator(path,state) {
  let owner=path.isCallExpression()?null:path.findParent((p)=>{
   if(!p.isFunction())return false;
   let outer=p;
   while(outer.parentPath?.isCallExpression()) {
    const callee=outer.parentPath.node.callee;
    const wrapper=callee.type==='Identifier'?callee.name:callee.property?.name;
    if(!['memo','forwardRef'].includes(wrapper))return false;
    outer=outer.parentPath;
   }
   const name=p.node.id?.name || (outer.parentPath?.isVariableDeclarator()?outer.parentPath.node.id.name:null);
   return /^[A-Z]/.test(name||'') || outer.parentPath?.isExportDefaultDeclaration();
  });
  if(owner && !state.loopOwners.has(owner.node)) {
   state.loopOwners.add(owner.node);
   owner.ensureBlock();
   owner.get('body').unshiftContainer('body',t.expressionStatement(t.callExpression(t.memberExpression(t.callExpression(t.identifier('require'),[t.stringLiteral('react-i18next')]),t.identifier('useTranslation')),[])));
  }
  return t.callExpression(t.identifier('require'),[t.stringLiteral('i18next')]);
 }
 function expression(path,state,value) {
  return t.jsxExpressionContainer(t.callExpression(t.memberExpression(translator(path,state),t.identifier('t')),[t.stringLiteral(value),t.objectExpression([t.objectProperty(t.identifier('defaultValue'),t.stringLiteral(value))])]));
 }
 return {visitor:{
  Program:{enter(path,state){state.loopOwners=new WeakSet();state.loopSkip=/[\\/]node_modules[\\/]/.test(state.filename||'');}},
  JSXText(path,state){
   if(state.loopSkip || !/[\u0600-\u06ff]/.test(path.node.value))return;
   const cleaned=t.react.buildChildren({children:[path.node]})[0]?.value || '';
   const value=cleaned.trim();if(!value)return;
   const translated=expression(path,state,value);
   const start=cleaned.slice(0,cleaned.indexOf(value)),end=cleaned.slice(cleaned.indexOf(value)+value.length);
   if(start)translated.expression=t.binaryExpression('+',t.stringLiteral(start),translated.expression);
   if(end)translated.expression=t.binaryExpression('+',translated.expression,t.stringLiteral(end));
   path.replaceWith(translated);
  },
  JSXExpressionContainer(path,state){
   if(state.loopSkip)return;
   if(path.parentPath.isJSXAttribute() && !['title','label','hint','placeholder','accessibilityLabel','subTitle'].includes(path.parentPath.node.name.name))return;
   const node=path.node.expression;
   if(t.isStringLiteral(node) && /[\u0600-\u06ff]/.test(node.value)) {
    path.replaceWith(expression(path,state,node.value));
   } else if(t.isTemplateLiteral(node) && node.quasis.some((part)=>/[\u0600-\u06ff]/.test(part.value.cooked||part.value.raw))) {
    const key=node.quasis.map((part,index)=>(part.value.cooked||part.value.raw)+(index<node.expressions.length?'{{value'+index+'}}':'')).join('');
    const params=[t.objectProperty(t.identifier('defaultValue'),t.stringLiteral(key)),...node.expressions.map((value,index)=>t.objectProperty(t.identifier('value'+index),value))];
    path.replaceWith(t.jsxExpressionContainer(t.callExpression(t.memberExpression(translator(path,state),t.identifier('t')),[t.stringLiteral(key),t.objectExpression(params)])));
   } else if(t.isConditionalExpression(node) && t.isStringLiteral(node.consequent) && t.isStringLiteral(node.alternate) && [node.consequent,node.alternate].every((value)=>/[\u0600-\u06ff]/.test(value.value))) {
    path.replaceWith(t.jsxExpressionContainer(t.callExpression(t.memberExpression(translator(path,state),t.identifier('t')),[node])));
   }
  },
  CallExpression(path,state){
   if(state.loopSkip)return;
   const callee=path.node.callee;
   const name=t.isIdentifier(callee)?callee.name:(t.isMemberExpression(callee)&&['Alert','window'].includes(callee.object?.name)?callee.property?.name:null);
   if(!['showToastOrAlert','showAlert','alert'].includes(name))return;
   for(let index=0;index<Math.min(2,path.node.arguments.length);index++) {
    const value=path.node.arguments[index];
    if(t.isStringLiteral(value) && /[\u0600-\u06ff]/.test(value.value))path.node.arguments[index]=expression(path,state,value.value).expression;
   }
  },
  JSXAttribute(path,state){
   if(state.loopSkip || !['title','label','hint','placeholder','accessibilityLabel','subTitle'].includes(path.node.name.name) || !t.isStringLiteral(path.node.value) || !/[\u0600-\u06ff]/.test(path.node.value.value))return;
   path.node.value=expression(path,state,path.node.value.value);
  }
 }};
};
