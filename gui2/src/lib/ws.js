// 单连接 /ws.cookie 鉴权;支持 type 维度多 handler.
import { ref } from 'vue';

const handlers = new Map();
let ws = null;
let pingTimer = null;
let pongTimer = null;
let reconnectTimer = null;
let reconnectBlocked = false;

export const wsStatus = ref('disconnected');

const wsUrl = () => {
  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  const base = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;
  return token ? `${base}?token=${token}` : base;
};

const scheduleReconnect = (delay = 3000) => {
  if (reconnectBlocked) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (wsStatus.value === 'disconnected') connect();
  }, delay);
};

export function connect() {
  reconnectBlocked = false;
  if (ws) { ws.onclose = null; ws.close(); }
  clearInterval(pingTimer);
  clearTimeout(pongTimer);
  clearTimeout(reconnectTimer);
  wsStatus.value = 'connecting';
  ws = new WebSocket(wsUrl());
  ws.onopen = () => {
    wsStatus.value = 'connected';
    emit('open');
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
        pongTimer = setTimeout(() => {
          wsStatus.value = 'disconnected';
          ws?.close();
        }, 5000);
      }
    }, 30000);
  };
  ws.onmessage = (e) => {
    let data;
    try { data = JSON.parse(e.data); } catch { return; }
    if (data.type === 'pong') { clearTimeout(pongTimer); return; }
    emit(data.type, data);
  };
  ws.onclose = (event) => {
    wsStatus.value = 'disconnected';
    clearInterval(pingTimer);
    clearTimeout(pongTimer);
    emit('close');
    if (event?.code === 1008) { reconnectBlocked = true; return; }
    scheduleReconnect();
  };
  ws.onerror = () => { wsStatus.value = 'disconnected'; };
}

export function disconnect() {
  reconnectBlocked = true;
  clearInterval(pingTimer);
  clearTimeout(pongTimer);
  clearTimeout(reconnectTimer);
  if (ws) { ws.onclose = null; ws.close(); }
  ws = null;
  wsStatus.value = 'disconnected';
}

export function send(data) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

export function on(type, fn) {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type).add(fn);
  return () => handlers.get(type)?.delete(fn);
}

function emit(type, data) {
  handlers.get(type)?.forEach((fn) => {
    try { fn(data); } catch (e) { console.error('[ws handler]', type, e); }
  });
}
