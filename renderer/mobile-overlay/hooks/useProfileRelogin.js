/** First profile completion requires a fresh authenticated session. */
import { useNavigation } from '@react-navigation/native';
import useLogout from '@hooks/useLogout';
import { showToastOrAlert } from '@helpers/Common';
export default function useProfileRelogin(accountType='individual') {
 const navigation=useNavigation();const {logout}=useLogout();
 return async(response)=>{
  if(!response?.requires_relogin)return false;
  showToastOrAlert(response.message || 'اطلاعات تکمیل شد. لطفاً دوباره وارد حساب شوید.');
  try{await logout();navigation.reset({index:0,routes:[{name:accountType==='organization'?'Login':'LoginScreen'}]});}
  catch{showToastOrAlert('اطلاعات ذخیره شد. برای ثبت سفارش از حساب خارج شوید و دوباره وارد شوید.');}
  return true;
 };
}
