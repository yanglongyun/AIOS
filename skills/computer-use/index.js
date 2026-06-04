#!/usr/bin/env node
// AGENT 电脑连接器
//   · 维持到 AGENT worker 的 WebSocket(client=desktop)
//   · 收到 tool.call → 调本机 callTool → 回 tool.result / tool.error
//
// 配置在 config.js

import { WebSocket } from 'ws';
import { callTool } from './src/tools.js';
import { WS_URL, TOKEN } from './config.js';

if (!TOKEN) {
  console.error('config.js 里 TOKEN 是空的');
  console.error('请复制 config.example.js 为 config.js 后填写连接凭证');
  process.exit(1);
}
if (!WS_URL || WS_URL.includes('your-agent-host.example.com')) {
  console.error('config.js 里 WS_URL 没设');
  process.exit(1);
}

let ws = null;
let reconnectTimer = null;
let reconnectDelay = 500;
let heartbeatTimer = null;

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 1.6, 10_000);
    connect();
  }, reconnectDelay);
}

function connect() {
  const url = `${WS_URL}/ws?token=${encodeURIComponent(TOKEN)}&client=desktop`;
  console.log(`[bridge] connecting → ${WS_URL}/ws?...&client=desktop`);

  try { ws = new WebSocket(url); }
  catch (e) { console.error('[bridge] new WebSocket throw:', e?.message ?? e); scheduleReconnect(); return; }

  ws.on('open', () => {
    console.log('[bridge] open · 等待 AI 调用');
    reconnectDelay = 500;
    startHeartbeat();
  });

  ws.on('message', async (data) => {
    let frame;
    try { frame = JSON.parse(data.toString()); }
    catch { return; }

    if (frame?.type === 'tool.call' && frame.id) {
      console.log(`[bridge] tool.call ${frame.name}`);
      try {
        const result = await callTool(frame.name, frame.args || {});
        send({ id: frame.id, type: 'tool.result', result });
      } catch (e) {
        console.error(`[bridge] tool error ${frame.name}:`, e?.message);
        send({ id: frame.id, type: 'tool.error', error: e?.message || String(e) });
      }
    }
  });

  ws.on('close', () => {
    console.warn('[bridge] close · 重连中');
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    ws = null;
    scheduleReconnect();
  });

  ws.on('error', (e) => {
    console.error('[bridge] error:', e?.message ?? e);
    try { ws?.close(); } catch {}
  });
}

function send(frame) {
  if (ws?.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(frame));
  return true;
}

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    send({ type: 'ping' });
  }, 25_000);
}

process.on('SIGINT', () => {
  console.log('\n[bridge] shutting down');
  try { ws?.close(); } catch {}
  process.exit(0);
});

connect();
