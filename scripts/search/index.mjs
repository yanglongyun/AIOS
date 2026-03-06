#!/usr/bin/env node

const query = process.argv[2] || 'OpenAI';
const limitArg = Number(process.argv[3] || 5);
const limit = Number.isFinite(limitArg) && limitArg > 0 ? Math.min(limitArg, 20) : 5;
const enginesArg = process.argv.find((x) => x.startsWith('--engines=')) || '';
const timeoutArg = process.argv.find((x) => x.startsWith('--timeoutMs='));
const timeoutMs = timeoutArg ? Number(timeoutArg.split('=')[1]) : 8000;

function decodeXml(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function decodeDuckDuckGoRedirect(url) {
  if (!url) return '';
  const text = String(url);
  if (!text.includes('duckduckgo.com/l/?')) return text;
  try {
    const u = new URL(text, 'https://duckduckgo.com');
    const target = u.searchParams.get('uddg');
    return target ? decodeURIComponent(target) : text;
  } catch {
    return text;
  }
}

function decodeGoogleRedirect(url) {
  const text = String(url || '');
  if (!text) return '';
  if (!text.startsWith('/url?')) return text;
  try {
    const u = new URL(`https://www.google.com${text}`);
    const target = u.searchParams.get('q');
    return target ? decodeURIComponent(target) : text;
  } catch {
    return text;
  }
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (AIOS scripts/search)' },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function parseHtmlLinksByPattern(html, pattern, maxResults) {
  const out = [];
  const seen = new Set();
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const href = decodeXml(m[1] || '');
    const title = stripTags(m[2] || '');
    if (!title || !/^https?:\/\//i.test(href) || seen.has(href)) continue;
    seen.add(href);
    out.push({ title, url: href });
    if (out.length >= maxResults) break;
  }
  return out;
}

async function searchDuckDuckGoLite(q, maxResults, timeout) {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}`;
  const res = await fetchWithTimeout(url, timeout);
  if (!res.ok) throw new Error(`duck: HTTP ${res.status}`);
  const html = await res.text();

  const out = [];
  const seen = new Set();
  const anchorRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = anchorRegex.exec(html)) !== null) {
    const href = decodeDuckDuckGoRedirect(m[1]);
    const title = stripTags(m[2]);
    if (!title || !/^https?:\/\//i.test(href) || seen.has(href)) continue;
    seen.add(href);
    out.push({ title, url: href });
    if (out.length >= maxResults) break;
  }
  return out;
}

function parseBingRss(xml, maxResults) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const itemXml = m[1];
    const title = decodeXml(itemXml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
    const url = decodeXml(itemXml.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '');
    const snippet = decodeXml(itemXml.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '');
    if (!title || !/^https?:\/\//i.test(url)) continue;
    items.push({ title, url, snippet });
    if (items.length >= maxResults) break;
  }
  return items;
}

async function searchBingRss(q, maxResults, timeout) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(q)}&format=rss`;
  const res = await fetchWithTimeout(url, timeout);
  if (!res.ok) throw new Error(`bing: HTTP ${res.status}`);
  const xml = await res.text();
  return parseBingRss(xml, maxResults);
}

async function searchBaidu(q, maxResults, timeout) {
  const url = `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`;
  const res = await fetchWithTimeout(url, timeout);
  if (!res.ok) throw new Error(`baidu: HTTP ${res.status}`);
  const html = await res.text();
  const pattern = /<h3[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/gi;
  return parseHtmlLinksByPattern(html, pattern, maxResults);
}

async function searchSogou(q, maxResults, timeout) {
  const url = `https://www.sogou.com/web?query=${encodeURIComponent(q)}`;
  const res = await fetchWithTimeout(url, timeout);
  if (!res.ok) throw new Error(`sogou: HTTP ${res.status}`);
  const html = await res.text();
  const pattern = /<h3[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/gi;
  return parseHtmlLinksByPattern(html, pattern, maxResults);
}

async function searchYandex(q, maxResults, timeout) {
  const url = `https://yandex.com/search/?text=${encodeURIComponent(q)}`;
  const res = await fetchWithTimeout(url, timeout);
  if (!res.ok) throw new Error(`yandex: HTTP ${res.status}`);
  const html = await res.text();
  const pattern = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  return parseHtmlLinksByPattern(html, pattern, maxResults);
}

async function searchGoogle(q, maxResults, timeout) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=en`;
  const res = await fetchWithTimeout(url, timeout);
  if (!res.ok) throw new Error(`google: HTTP ${res.status}`);
  const html = await res.text();

  const out = [];
  const seen = new Set();
  const anchorRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = anchorRegex.exec(html)) !== null) {
    const rawHref = decodeXml(m[1] || '');
    const title = stripTags(m[2] || '');
    const decoded = decodeGoogleRedirect(rawHref);
    if (!title) continue;
    if (!/^https?:\/\//i.test(decoded)) continue;
    if (/google\./i.test(decoded)) continue;
    if (seen.has(decoded)) continue;
    seen.add(decoded);
    out.push({ title, url: decoded });
    if (out.length >= maxResults) break;
  }
  return out;
}

async function searchYou(q, maxResults, timeout) {
  const url = `https://you.com/search?q=${encodeURIComponent(q)}`;
  const res = await fetchWithTimeout(url, timeout);
  if (!res.ok) throw new Error(`you: HTTP ${res.status}`);
  const html = await res.text();

  const out = [];
  const seen = new Set();
  const anchorRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = anchorRegex.exec(html)) !== null) {
    const href = decodeXml(m[1] || '');
    const title = stripTags(m[2] || '');
    if (!title) continue;
    if (!/^https?:\/\//i.test(href)) continue;
    if (/you\.com/i.test(href)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ title, url: href });
    if (out.length >= maxResults) break;
  }
  return out;
}

const ENGINE_MAP = {
  duck: searchDuckDuckGoLite,
  bing: searchBingRss,
  google: searchGoogle,
  you: searchYou,
  baidu: searchBaidu,
  sogou: searchSogou,
  yandex: searchYandex
};

function parseEngineOrder() {
  if (!enginesArg) return ['duck', 'bing', 'google', 'you', 'baidu', 'sogou', 'yandex'];
  return enginesArg
    .slice('--engines='.length)
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

async function metaSearch(q, maxResults) {
  const order = parseEngineOrder();
  const attempts = [];

  for (const engineName of order) {
    const runner = ENGINE_MAP[engineName];
    if (!runner) {
      attempts.push({ engine: engineName, ok: false, error: 'engine not supported' });
      continue;
    }
    try {
      const results = await runner(q, maxResults, timeoutMs);
      if (results.length > 0) {
        attempts.push({ engine: engineName, ok: true, count: results.length });
        return { engine: engineName, results, attempts, fallbackUsed: engineName !== order[0] };
      }
      attempts.push({ engine: engineName, ok: false, error: 'no results' });
    } catch (err) {
      attempts.push({ engine: engineName, ok: false, error: err?.message || 'unknown error' });
    }
  }

  const e = new Error('all engines failed');
  e.attempts = attempts;
  throw e;
}

async function main() {
  try {
    const data = await metaSearch(query, limit);
    console.log(JSON.stringify({
      query,
      engine: data.engine,
      fallbackUsed: data.fallbackUsed,
      count: data.results.length,
      attempts: data.attempts,
      results: data.results
    }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({
      query,
      error: err?.message || 'unknown error',
      attempts: err?.attempts || []
    }, null, 2));
    process.exitCode = 1;
  }
}

main();
