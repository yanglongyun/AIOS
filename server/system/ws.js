import { WebSocketServer } from 'ws';
import { createSession } from '../chat/session.js';
import { getAuthUser } from '../../shared/auth/guard.js';

const clients = new Set();
const isLoopback = (req) => {
  const ip = String(req?.socket?.remoteAddress || '');
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

const isLocalCliBypass = (req) => {
  return String(req?.headers?.['x-aios-cli'] || '') === '1' && isLoopback(req);
};

export const broadcast = (msg) => {
  const payload = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
};

export const setupWebSocket = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const user = getAuthUser(req);
    if (!user && !isLocalCliBypass(req)) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    clients.add(ws);
    const send = (msg) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
    };

    const { handleMessage } = createSession(send);

    ws.on('message', async (raw) => {
      let data;
      try { data = JSON.parse(raw); } catch { return; }
      await handleMessage(data);
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });
};
