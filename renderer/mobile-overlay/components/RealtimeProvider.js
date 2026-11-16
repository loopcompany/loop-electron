import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { uri } from '../services/URL';
import { fetchUser } from '../slices/userSlice';
import { fetchContacts } from '../slices/contactSlice';
import { fetchPdfDocs } from '../slices/pdfDocumentSlice';
import { fetchMinPrice } from '../slices/minPriceSlice';
import { createRealtimeClient } from '../services/realtime/client';
import { emitRealtimeChange } from '../services/realtime/events';

export default function RealtimeProvider({ children }) {
  const token = useSelector((state) => state.auth?.token);
  const dispatch = useDispatch();
  useEffect(() => {
    if (!token) return;
    let userRefresh;
    let catalogRefresh;
    const client = createRealtimeClient({
      configUrl: uri + '/realtime/config',
      socketOptions: Platform.OS === 'web' ? undefined : { headers: { Origin: uri.replace(/\/api\/?$/, '') } },
      authUrl: uri + '/realtime/auth',
      headers: () => ({ Authorization: 'Bearer ' + token }),
      onEvent: (event) => {
        emitRealtimeChange(event);
        if (event.topics.some((topic) => ['*', 'catalog'].includes(topic))) {
          clearTimeout(catalogRefresh);
          catalogRefresh = setTimeout(() => {
            dispatch(fetchContacts()); dispatch(fetchPdfDocs()); dispatch(fetchMinPrice());
          }, 100);
        }
        if (event.topics.some((topic) => ['*', 'account', 'wallet'].includes(topic))) {
          clearTimeout(userRefresh);
          userRefresh = setTimeout(() => dispatch(fetchUser(token)), 100);
        }
      },
    });
    if (AppState.currentState !== 'background') client.start();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') client.start();
      else if (state === 'background') client.stop();
    });
    return () => { clearTimeout(userRefresh); clearTimeout(catalogRefresh); subscription.remove(); client.stop(); };
  }, [token, dispatch]);
  return children;
}
