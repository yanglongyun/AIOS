// Connects the Chrome extension to the local browser-use skill service.
// Receives tool.call frames and returns tool.result frames.

import { WS_URL } from '../config.js';
import { runTool } from './tools/index.js';

let ws = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let reconnectDelay = 500;

export let lastConnectedAt = null;
export let lastDisconnectedAt = null;
export let lastError = null;

export function bridgeState() {
  const s = ws?.readyState;
  if (s === WebSocket.OPEN) return 'connected';
  if (s === WebSocket.CONNECTING) return 'connecting';
  return reconnectTimer ? 'reconnecting' : 'disconnected';
}

export function send(frame) {
  if (ws?.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(frame));
  return true;
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 1.6, 8000);
    connect();
  }, reconnectDelay);
}

export async function connect() {
  const url = `${String(WS_URL).replace(/\/$/, '')}/extension`;
  try { ws = new WebSocket(url); }
  catch (e) { lastError = e?.message || String(e); scheduleReconnect(); return; }

  ws.onopen = () => {
    reconnectDelay = 500;
    lastConnectedAt = new Date().toISOString();
    lastError = null;
    startHeartbeat();
  };
  ws.onmessage = (event) => handleFrame(event.data);
  ws.onclose = () => {
    lastDisconnectedAt = new Date().toISOString();
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    scheduleReconnect();
  };
  ws.onerror = () => {
    lastError = 'connection_error';
    try { ws?.close(); } catch {}
  };
}

export function reconnect() {
  try { ws?.close(); } catch {}
  reconnectDelay = 500;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  connect();
}

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => { send({ type: 'ping' }); }, 25_000);
}

async function handleFrame(raw) {
  let frame;
  try { frame = JSON.parse(String(raw)); }
  catch { return; }

  if (frame?.type === 'tool.call' && frame.id) {
    try {
      const result = await runTool(frame.tool || frame.name, frame.args || {});
      send({ id: frame.id, type: 'tool.result', ok: true, data: result });
    } catch (e) {
      send({ id: frame.id, type: 'tool.result', ok: false, error: e?.message || String(e) });
    }
  }
}
