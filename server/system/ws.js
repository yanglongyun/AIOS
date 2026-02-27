import { WebSocketServer } from 'ws';
import { createSession } from './event.js';

export const setupWebSocket = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    const send = (msg) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
    };

    const { handleMessage } = createSession(send);

    ws.on('message', async (raw) => {
      let data;
      try { data = JSON.parse(raw); } catch { return; }
      await handleMessage(data);
    });
  });
};
