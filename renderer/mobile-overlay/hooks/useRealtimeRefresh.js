import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { subscribeRealtime } from '../services/realtime/events';

export function useRealtimeEvent(topics, refresh, enabled = true) {
  const callback = useRef(refresh);
  callback.current = refresh;
  const topicKey = topics.join(',');
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer;
    let running = false;
    let pending = false;
    const run = async () => {
      timer = null;
      if (stopped) return;
      if (running) { pending = true; return; }
      running = true;
      try { await callback.current(); } catch { /* The screen handles its request errors. */ }
      finally {
        running = false;
        if (pending && !stopped) { pending = false; timer = setTimeout(run, 80); }
      }
    };
    const unsubscribe = subscribeRealtime((event) => {
      if (!event.topics?.some((topic) => topic === '*' || topicKey.split(',').includes(topic))) return;
      if (!timer) timer = setTimeout(run, 80);
    });
    return () => { stopped = true; clearTimeout(timer); unsubscribe(); };
  }, [topicKey, enabled]);
}

export default function useRealtimeRefresh(topics, refresh, enabled = true) {
  const focused = useIsFocused();
  useRealtimeEvent(topics, refresh, enabled && focused);
}
