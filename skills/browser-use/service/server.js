#!/usr/bin/env node
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { WebSocketServer } from 'ws';

const DEFAULT_PORT = 9522;
const DEFAULT_TIMEOUT_MS = 30_000;

const toolSchemas = {
  browser_status: {
    description: 'Get browser bridge status and active tab information.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  browser_open_tab: {
    description: 'Open a new Chrome tab in the background.',
    parameters: {
      type: 'object',
      properties: { url: { type: 'string' }, windowId: { type: 'number' } },
      required: ['url'],
      additionalProperties: false,
    },
  },
  browser_tabs: {
    description: 'List Chrome tabs.',
    parameters: {
      type: 'object',
      properties: { currentWindow: { type: 'boolean' }, active: { type: 'boolean' }, windowId: { type: 'number' } },
      additionalProperties: false,
    },
  },
  browser_activate_tab: {
    description: 'Bring a Chrome tab to focus.',
    parameters: { type: 'object', properties: { tabId: { type: 'number' } }, required: ['tabId'], additionalProperties: false },
  },
  browser_close_tab: {
    description: 'Close a Chrome tab.',
    parameters: { type: 'object', properties: { tabId: { type: 'number' } }, required: ['tabId'], additionalProperties: false },
  },
  browser_navigate: {
    description: 'Navigate a Chrome tab to a URL.',
    parameters: {
      type: 'object',
      properties: { tabId: { type: 'number' }, url: { type: 'string' } },
      required: ['url'],
      additionalProperties: false,
    },
  },
  browser_evaluate: {
    description: 'Run JavaScript in a Chrome tab with DevTools Runtime.evaluate.',
    parameters: {
      type: 'object',
      properties: { tabId: { type: 'number' }, script: { type: 'string' }, returnByValue: { type: 'boolean' } },
      required: ['script'],
      additionalProperties: false,
    },
  },
  browser_screenshot: {
    description: 'Capture the visible area of a Chrome tab.',
    parameters: {
      type: 'object',
      properties: {
        tabId: { type: 'number' },
        format: { type: 'string', enum: ['png', 'jpeg'] },
        quality: { type: 'number' },
        outputPath: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

const clients = new Set();
const pending = new Map();
let lastClient = null;

function parsePort(argv) {
  const index = argv.indexOf('--port');
  if (index >= 0 && argv[index + 1]) return Number(argv[index + 1]);
  return Number(process.env.BROWSER_USE_PORT || DEFAULT_PORT);
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw);
}

function currentClient() {
  if (lastClient?.readyState === 1) return lastClient;
  for (const client of clients) {
    if (client.readyState === 1) {
      lastClient = client;
      return client;
    }
  }
  return null;
}

async function callTool(tool, args = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  if (!toolSchemas[tool]) throw new Error(`unknown_tool: ${tool}`);
  const client = currentClient();
  if (!client) throw new Error('browser_extension_not_connected');

  const id = randomUUID();
  const message = { id, type: 'tool.call', tool, args };
  const result = await new Promise((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      rejectPromise(new Error(`tool_timeout: ${tool}`));
    }, timeoutMs);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolvePromise(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        rejectPromise(error);
      },
    });
    client.send(JSON.stringify(message));
  });

  if (tool === 'browser_screenshot' && result?.dataUrl && args?.outputPath) {
    return saveScreenshot(result, args.outputPath);
  }
  return result;
}

async function saveScreenshot(result, outputPath) {
  const match = String(result.dataUrl).match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) throw new Error('invalid_screenshot_data_url');
  const absPath = resolve(String(outputPath));
  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, Buffer.from(match[2], 'base64'));
  return {
    tabId: result.tabId,
    format: result.format,
    bytes: result.bytes,
    outputPath: absPath,
  };
}

async function handleCall(req, res) {
  const body = await readJson(req);
  const tool = String(body.tool || body.name || '');
  const args = body.args && typeof body.args === 'object' ? body.args : {};
  const timeoutMs = Number(body.timeoutMs || DEFAULT_TIMEOUT_MS);
  const data = await callTool(tool, args, timeoutMs);
  sendJson(res, 200, { ok: true, data });
}

function handleWsMessage(raw) {
  let frame;
  try {
    frame = JSON.parse(String(raw));
  } catch {
    return;
  }
  if (!frame?.id || frame.type !== 'tool.result') return;
  const waiter = pending.get(frame.id);
  if (!waiter) return;
  pending.delete(frame.id);
  if (frame.ok) waiter.resolve(frame.data);
  else waiter.reject(new Error(frame.error || 'tool_failed'));
}

const port = parsePort(process.argv);
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });
    const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/status')) {
      return sendJson(res, 200, {
        ok: true,
        service: 'browser-use',
        clients: clients.size,
        ready: !!currentClient(),
        tools: Object.keys(toolSchemas),
      });
    }

    if (req.method === 'GET' && url.pathname === '/tools') {
      return sendJson(res, 200, { ok: true, tools: toolSchemas });
    }

    if (req.method === 'POST' && url.pathname === '/call') {
      await handleCall(req, res);
      return;
    }

    const toolMatch = url.pathname.match(/^\/tools\/([^/]+)$/);
    if (req.method === 'POST' && toolMatch) {
      const body = await readJson(req);
      const data = await callTool(decodeURIComponent(toolMatch[1]), body.args || body || {}, Number(body.timeoutMs || DEFAULT_TIMEOUT_MS));
      return sendJson(res, 200, { ok: true, data });
    }

    sendJson(res, 404, { ok: false, error: 'not_found' });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error?.message || String(error) });
  }
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  if (url.pathname !== '/extension') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

wss.on('connection', (ws) => {
  clients.add(ws);
  lastClient = ws;
  ws.on('message', (raw) => handleWsMessage(raw));
  ws.on('close', () => {
    clients.delete(ws);
    if (lastClient === ws) lastClient = null;
  });
  ws.send(JSON.stringify({ type: 'hello', service: 'browser-use' }));
});

server.listen(port, '127.0.0.1', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  console.log(`Browser Use service: http://127.0.0.1:${port}`);
  console.log(`Chrome extension directory: ${resolve(here, '../extension')}`);
});
