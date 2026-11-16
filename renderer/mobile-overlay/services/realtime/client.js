(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LoopRealtime = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createRealtimeClient(options) {
    const Socket = options.WebSocket || globalThis.WebSocket;
    const fetcher = options.fetch || globalThis.fetch;
    let stopped = true;
    let socket = null;
    let generation = 0;
    let retries = 0;
    let reconnectTimer;
    let heartbeatTimer;
    let watchdogTimer;
    let controller;
    let subscriptions = new Set();

    const state = (value) => options.onState?.(value);
    const clearTimers = () => {
      clearTimeout(reconnectTimer);
      clearTimeout(heartbeatTimer);
      clearTimeout(watchdogTimer);
    };
    const send = (event, data) => {
      if (socket?.readyState === 1) socket.send(JSON.stringify({ event, data }));
    };
    const scheduleReconnect = () => {
      if (stopped || reconnectTimer) return;
      state('reconnecting');
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, Math.min(30000, 1000 * 2 ** Math.min(retries++, 5)) + Math.floor(Math.random() * 250));
    };
    const request = async (url, body) => {
      const headers = { Accept: 'application/json', ...(options.headers?.() || {}) };
      if (body) headers['Content-Type'] = 'application/json';
      const activeController = controller;
      const deadline = setTimeout(() => activeController.abort(), 10000);
      let response;
      try {
        response = await fetcher(url, {
          method: body ? 'POST' : 'GET', headers,
          ...(body ? { body: JSON.stringify(body) } : {}),
          credentials: options.credentials || 'omit',
          signal: activeController.signal,
        });
      } finally { clearTimeout(deadline); }
      if (!response.ok) {
        const error = new Error('Realtime authorization failed');
        error.status = response.status;
        throw error;
      }
      return response.json();
    };
    const connect = async () => {
      if (stopped) return;
      const current = ++generation;
      controller?.abort();
      controller = new AbortController();
      subscriptions = new Set();
      state('connecting');
      try {
        const config = typeof options.config === 'function' ? await options.config() : await request(options.configUrl);
        if (stopped || current !== generation) return;
        if (!config.enabled) { state('disabled'); return; }
        if (!config.key || !config.host || !['ws', 'wss'].includes(config.scheme)) throw new Error('Invalid realtime configuration');
        if (config.scheme === 'ws' && !['localhost', '127.0.0.1', '::1'].includes(config.host)) throw new Error('Realtime requires WSS');
        const connection = new Socket(
          config.scheme + '://' + config.host + ':' + config.port + '/app/' + encodeURIComponent(config.key)
          + '?protocol=7&client=loop&version=1.0&flash=false',
          [], options.socketOptions
        );
        socket = connection;
        watchdogTimer = setTimeout(() => connection.close(), 10000);
        let activityTimeout = 30000;
        const heartbeat = () => {
          clearTimeout(heartbeatTimer);
          heartbeatTimer = setTimeout(() => {
            send('pusher:ping', {});
            watchdogTimer = setTimeout(() => connection.close(), 10000);
          }, activityTimeout);
        };
        connection.onmessage = async ({ data }) => {
          if (stopped || current !== generation) return;
          try {
            const frame = JSON.parse(data);
            const payload = typeof frame.data === 'string' ? JSON.parse(frame.data) : frame.data;
            clearTimeout(watchdogTimer);
            heartbeat();
            if (frame.event === 'pusher:connection_established') {
              activityTimeout = Math.max(10000, Number(payload.activity_timeout || 30) * 1000);
              for (const channel of config.channels || []) {
                const auth = await request(options.authUrl, { socket_id: payload.socket_id, channel_name: channel });
                if (stopped || current !== generation) return;
                send('pusher:subscribe', { channel, auth: auth.auth });
              }
            } else if (frame.event === 'pusher_internal:subscription_succeeded') {
              subscriptions.add(frame.channel);
              retries = 0;
              state('connected');
              options.onEvent?.({ topics: ['*'], reconnect: true });
            } else if (frame.event === 'pusher:ping') {
              send('pusher:pong', {});
            } else if (frame.event === 'data.changed' && subscriptions.has(frame.channel)) {
              if (Array.isArray(payload?.topics)) options.onEvent?.(payload);
            } else if (frame.event === 'pusher:error') {
              connection.close();
            }
          } catch (error) {
            if (stopped || current !== generation) return;
            if (error.status === 401 || error.status === 403) {
              stop();
              state('unauthorized');
            } else connection.close();
          }
        };
        connection.onclose = () => {
          if (current !== generation) return;
          clearTimeout(heartbeatTimer);
          clearTimeout(watchdogTimer);
          socket = null;
          scheduleReconnect();
        };
        connection.onerror = () => connection.close();
      } catch (error) {
        if (stopped || current !== generation) return;
        if (error.status === 401 || error.status === 403) state('unauthorized');
        else scheduleReconnect();
      }
    };
    function stop() {
      stopped = true;
      generation++;
      clearTimers();
      reconnectTimer = null;
      controller?.abort();
      socket?.close();
      socket = null;
      state('disconnected');
    }
    return {
      start() { if (stopped) { stopped = false; connect(); } },
      stop,
      reconnect() { stop(); this.start(); },
    };
  }
  return { createRealtimeClient };
});
