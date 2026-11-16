import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { uri } from '@services/URL';
import { showAlert } from '@helpers/Common';
import { L } from '@org/orgI18n';
import { subscribeRealtime } from '../services/realtime/events';

export default function PendingOrderQuoteNotice({ navigation }) {
  const token = useSelector((state) => state.auth.token);
  const shownQuote = useRef(null);

  useEffect(() => {
    shownQuote.current = null;
    if (!token) return;

    const controller = new AbortController();
    const check = async () => {
      try {
        const { data } = await axios.get(`${uri}/orders/pending-estimate`, {
          signal: controller.signal,
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        const estimate = data?.data;
        if (controller.signal.aborted || !estimate?.quote_id || shownQuote.current === estimate.quote_id) return;
        shownQuote.current = estimate.quote_id;
        showAlert(
          L('پیش‌رسید برآورد سفارش'),
          L('برآورد هزینه سفارش شما آماده است.'),
          [
            { text: L('انصراف'), style: 'cancel' },
            { text: L('نمایش پیش‌رسید'), onPress: () => navigation.navigate('Details', { orderId: estimate.order_id }) },
          ]
        );
      } catch {
        // Checking for an estimate is optional when starting the app.
      }
    };

    check();
    const unsubscribe = subscribeRealtime((event) => {
      if (event.topics.some((topic) => topic === '*' || topic === 'orders')) check();
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      controller.abort();
      unsubscribe();
      subscription.remove();
    };
  }, [navigation, token]);

  return null;
}
