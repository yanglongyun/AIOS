import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from '../api/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', '..', 'ui', 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
};

const APPS_PORT = 9701;

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const proxyAppsRequest = async (req, res, url) => {
  const target = `http://127.0.0.1:${APPS_PORT}${url.pathname}${url.search}`;
  const headers = { ...req.headers };
  // Strip hop-by-hop headers when proxying to fetch.
  delete headers.host;
  delete headers.connection;
  delete headers.upgrade;
  delete headers['proxy-connection'];
  delete headers['keep-alive'];
  delete headers['transfer-encoding'];
  delete headers.te;
  delete headers.trailer;

  const method = req.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await readRawBody(req) : undefined;

  const upstream = await fetch(target, {
    method,
    headers,
    body
  });

  const buf = Buffer.from(await upstream.arrayBuffer());
  const outHeaders = {};
  upstream.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'content-encoding') return;
    outHeaders[k] = v;
  });
  res.writeHead(upstream.status, outHeaders);
  res.end(buf);
};

export const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/apps/')) {
    try {
      await proxyAppsRequest(req, res, url);
    } catch (error) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: `Apps service unavailable: ${error.message}` }));
    }
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    await handleApiRequest(req, res, url);
    return;
  }

  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = join(PUBLIC_DIR, pathname);

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = pathname.slice(pathname.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(filePath));
    return;
  }

  // SPA history fallback: let vue-router handle /settings, /chat/*, /notebook, etc.
  const indexPath = join(PUBLIC_DIR, 'index.html');
  if (existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    res.end(readFileSync(indexPath));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});
