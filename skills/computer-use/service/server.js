#!/usr/bin/env node
import http from 'node:http';
import { platform } from 'node:os';
import { detectDrivers } from './drivers.js';
import { toolSchemas } from './schemas.js';
import { callTool } from './tools.js';

const DEFAULT_PORT = 8766;

function parsePort(argv) {
  const index = argv.indexOf('--port');
  if (index >= 0 && argv[index + 1]) return Number(argv[index + 1]);
  return Number(process.env.COMPUTER_USE_PORT || DEFAULT_PORT);
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
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleCall(req, res) {
  const body = await readJson(req);
  const tool = String(body.tool || body.name || '');
  const args = body.args && typeof body.args === 'object' ? body.args : {};
  const data = await callTool(tool, args);
  sendJson(res, 200, { ok: true, data });
}

async function handleStatus(res) {
  sendJson(res, 200, {
    ok: true,
    service: 'computer-use',
    platform: platform(),
    ready: true,
    drivers: await detectDrivers(),
    tools: Object.keys(toolSchemas),
  });
}

const port = parsePort(process.argv);
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });
    const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/status')) return handleStatus(res);
    if (req.method === 'GET' && url.pathname === '/tools') return sendJson(res, 200, { ok: true, tools: toolSchemas });
    if (req.method === 'POST' && url.pathname === '/call') return handleCall(req, res);

    const toolMatch = url.pathname.match(/^\/tools\/([^/]+)$/);
    if (req.method === 'POST' && toolMatch) {
      const body = await readJson(req);
      const data = await callTool(decodeURIComponent(toolMatch[1]), body.args || body || {});
      return sendJson(res, 200, { ok: true, data });
    }

    sendJson(res, 404, { ok: false, error: 'not_found' });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error?.message || String(error) });
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`computer-use service listening on http://127.0.0.1:${port}\n`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
