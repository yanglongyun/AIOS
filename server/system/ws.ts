import type { AnyRecord } from '../../shared/types.ts';
import { WebSocketServer } from 'ws';
import { WebSocket } from 'ws';
import { createSession } from '../chat/index.ts';
import { getAuthUser } from '../../shared/auth/guard.ts';

const clients = new Set<WebSocket>();

export const broadcast = (msg: AnyRecord) => {
  const payload = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
};

export const setupWebSocket = (httpServer: AnyRecord) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/aios/ws' });

  wss.on('connection', (ws, req) => {
    const user = getAuthUser(req);
    if (!user) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    clients.add(ws);
    const send = (msg: AnyRecord) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
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
