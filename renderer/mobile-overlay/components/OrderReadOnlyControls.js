import React, { forwardRef } from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import { useOrderReadOnly } from '../contexts/OrderReadOnlyContext';
export const OrderTextInput=forwardRef((props,ref)=>{
  const readOnly=useOrderReadOnly();
  return <TextInput {...props} ref={ref} editable={!readOnly && props.editable!==false} />;
});
export function OrderTouchable(props) {
  const readOnly=useOrderReadOnly();
  return <TouchableOpacity {...props} disabled={readOnly || props.disabled} />;
}
