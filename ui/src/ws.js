import { ref } from 'vue';

const handlers = new Map();
let ws = null;
let pingTimer = null;
let pongTimer = null;
let reconnectTimer = null;
let reconnectBlocked = false;

// 响应式状态
export const wsStatus = ref('disconnected'); // connected | disconnected | connecting

// 从 URL ?token=xxx 自动拼 WSS 地址
const getDefaultWsUrl = () => {
  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  const base = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;
  return token ? `${base}?token=${token}` : base;
};

export const wsUrl = ref(getDefaultWsUrl());

const scheduleReconnect = (delay = 3000) => {
  if (reconnectBlocked) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (wsStatus.value === 'disconnected') connect();
  }, delay);
};

export const connect = (url) => {
  if (url) {
    wsUrl.value = url;
  }

  reconnectBlocked = false;

  if (ws) {
    ws.onclose = null;
    ws.close();
  }

  clearInterval(pingTimer);
  clearTimeout(pongTimer);
  clearTimeout(reconnectTimer);
  wsStatus.value = 'connecting';

  ws = new WebSocket(wsUrl.value);

  ws.onopen = () => {
    wsStatus.value = 'connected';
    emit('open');
    // 每 30 秒发 ping
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
        // 5 秒内没 pong 就断开重连
        pongTimer = setTimeout(() => {
          wsStatus.value = 'disconnected';
          ws?.close();
        }, 5000);
      }
    }, 30000);
  };

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'pong') {
      clearTimeout(pongTimer);
      return;
    }
    emit(data.type, data);
  };

  ws.onclose = (event) => {
    wsStatus.value = 'disconnected';
    clearInterval(pingTimer);
    clearTimeout(pongTimer);
    emit('close');
    if (event?.code === 1008) {
      reconnectBlocked = true;
      return;
    }
    scheduleReconnect();
  };

  ws.onerror = () => {
    wsStatus.value = 'disconnected';
  };
};

export const disconnect = () => {
  reconnectBlocked = true;
  clearInterval(pingTimer);
  clearTimeout(pongTimer);
  clearTimeout(reconnectTimer);
  if (ws) {
    ws.onclose = null;
    ws.close();
  }
  ws = null;
  wsStatus.value = 'disconnected';
};

// 确保连接就绪，最多等 5 秒
export const ensureConnected = () => {
  if (ws?.readyState === WebSocket.OPEN) return Promise.resolve();
  if (wsStatus.value !== 'connecting') connect();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WebSocket 连接超时')), 5000);
    const unsub = on('open', () => {
      clearTimeout(timeout);
      unsub();
      resolve();
    });
  });
};

export const send = (data) => {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
};

export const on = (type, fn) => {
  if (!handlers.has(type)) handlers.set(type, []);
  handlers.get(type).push(fn);
  return () => {
    const list = handlers.get(type);
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  };
};

const emit = (type, data) => {
  handlers.get(type)?.forEach((fn) => fn(data));
};
