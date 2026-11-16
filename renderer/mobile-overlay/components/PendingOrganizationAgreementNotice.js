import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { uri } from '@services/URL';
import { showAlert } from '@helpers/Common';
import { L } from '@org/orgI18n';
import { subscribeRealtime } from '../services/realtime/events';

export default function PendingOrganizationAgreementNotice({ navigation }) {
  const token = useSelector((state) => state.auth?.token);
  const user = useSelector((state) => state.user?.data);
  useEffect(() => {
    if (!token || !user?.id || !user.account_type || user.account_type === 'individual') return;
    const controller = new AbortController();
    let timer;
    let current;
    const check = async () => {
      try {
        const response = await axios.get(`${uri}/organization/agreements`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: controller.signal });
        const record = response.data.data.requests.find((item) => item.final_url || item.draft_url);
        if (!record || controller.signal.aborted) return;
        const key = `loop-agreement-notice:${user.id}:${record.id}:${record.final_url ? record.final_published_at || record.final_url : record.draft_published_at || record.draft_url}`;
        if (current === key || await AsyncStorage.getItem(key)) return;
        current = key;
        if (controller.signal.aborted) return;
        await AsyncStorage.setItem(key, 'shown');
        showAlert(L('توافق‌نامهٔ جدید برای شما ارسال شده است'),
          L(record.final_url ? 'نسخهٔ نهایی توافق‌نامه برای مشاهده و ذخیره آماده است.' : 'توافق‌نامهٔ همکاری را بررسی و چاپ کنید و نسخهٔ فیزیکی مهر و امضاشده را برای شرکت لوپ ارسال نمایید.'), [
            { text: L('بعداً'), style: 'cancel' },
            { text: L('مشاهده توافق‌نامه'), onPress: () => navigation.navigate('OrganizationContract') },
          ]);
      } catch { /* The notice is retried on the next connection or foreground event. */ }
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(check, 120); };
    schedule();
    const unsubscribe = subscribeRealtime((event) => { if (event.topics.some((topic) => topic === '*' || topic === 'contracts')) schedule(); });
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') schedule(); });
    return () => { controller.abort(); clearTimeout(timer); unsubscribe(); subscription.remove(); };
  }, [token, user?.id, user?.account_type, navigation]);
  return null;
}
