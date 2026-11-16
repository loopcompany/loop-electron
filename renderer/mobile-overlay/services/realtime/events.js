const listeners = new Set();

export function emitRealtimeChange(event) {
  for (const listener of listeners) listener(event);
}

export function subscribeRealtime(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
