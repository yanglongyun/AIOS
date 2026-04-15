#!/usr/bin/env node

/**
 * setup.mjs
 *
 * AIOS 启动前置脚本。单文件负责：
 *
 *   1. 检查 .language-applied 标记文件
 *   2. 如果已经为请求的 locale 烘焙过，直接跳过（零开销放行）
 *   3. 否则把 language/<locale>/**\/*.json 的文案烘焙进源码：
 *      - 源码里 __T_<KEY_UPPER>__ 占位符被替换成真实文案
 *      - 支持双引号 / 单引号 / 反引号 / 裸文本四种上下文的正确转义
 *      - language/<locale>/apps/<app>/APP.md 覆盖到 server/apps/<app>/APP.md
 *   4. 在 projectRoot 下写 .language-applied 标记（内容为 locale）
 *
 * 本脚本自定位到 dirname($0)/..，可以跑在主仓 AIOS/ 或任何 AIOS/ 的副本里
 * （例如 AIOS-dev/aios、AIOS-wandesk-image/aios）。
 *
 * 用法:
 *   node scripts/setup.mjs                  # 默认 locale = zh，走缓存判断
 *   node scripts/setup.mjs en               # 指定 locale
 *   node scripts/setup.mjs --force          # 忽略缓存标记，强制重烘
 *   node scripts/setup.mjs en --force       # 组合
 *   AIOS_LANG=en node scripts/setup.mjs     # 通过环境变量指定 locale
 *
 * npm 生命周期:
 *   predev / prebuild / prestart / prestart:apps 都挂这个脚本
 *   已烘焙过的情况下耗时 < 10ms，可以无脑挂
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const marker = path.join(projectRoot, '.language-applied');

const rawArgs = process.argv.slice(2);
const force = rawArgs.includes('--force');
const locale = rawArgs.find((a) => !a.startsWith('--')) || process.env.AIOS_LANG || 'zh';

if (!force) {
  const current = fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8').trim() : null;
  if (current === locale) {
    console.log(`[setup] language '${locale}' already applied, skipping`);
    process.exit(0);
  }
  if (current && current !== locale) {
    console.log(`[setup] locale change detected: '${current}' -> '${locale}', re-applying`);
  } else {
    console.log(`[setup] first run, applying '${locale}'`);
  }
} else {
  console.log(`[setup] --force: re-applying '${locale}'`);
}

const langDir = path.join(projectRoot, 'language', locale);
if (!fs.existsSync(langDir)) {
  console.error(`[setup] language pack not found: ${langDir}`);
  process.exit(1);
}

const REPLACE_EXTS = new Set(['.js', '.mjs', '.ts', '.vue', '.json', '.md']);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'database', 'files', 'dist', 'language', 'scripts']);

const walk = (dir, visit, { exclude = false } = {}) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (exclude && EXCLUDE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), visit, { exclude });
    } else {
      visit(path.join(dir, entry.name));
    }
  }
};

const tokenMap = new Map();
walk(langDir, (file) => {
  if (!file.endsWith('.json')) return;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`[setup] invalid JSON: ${file}\n  ${err.message}`);
    process.exit(1);
  }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') continue;
    const token = `__T_${key.toUpperCase()}__`;
    if (tokenMap.has(token) && tokenMap.get(token) !== value) {
      console.warn(`[setup] duplicate token ${token} with different values (later wins)`);
    }
    tokenMap.set(token, value);
  }
});
console.log(`[setup] ${tokenMap.size} tokens loaded from ${path.relative(projectRoot, langDir)}`);

const sortedTokens = [...tokenMap.entries()].sort((a, b) => b[0].length - a[0].length);

const escapeForDoubleQuote = (s) => JSON.stringify(s).slice(1, -1);
const escapeForSingleQuote = (s) => s
  .replace(/\\/g, '\\\\')
  .replace(/'/g, "\\'")
  .replace(/\n/g, '\\n')
  .replace(/\r/g, '\\r')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');
const escapeForBacktick = (s) => s
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const replaceAllCounting = (src, needle, replacement) => {
  const parts = src.split(needle);
  return { src: parts.join(replacement), count: parts.length - 1 };
};

let replacedFiles = 0;
let replacedCount = 0;
walk(projectRoot, (file) => {
  const ext = path.extname(file);
  if (!REPLACE_EXTS.has(ext)) return;
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('__T_')) return;
  let fileReplacements = 0;
  for (const [token, value] of sortedTokens) {
    if (!src.includes(token)) continue;
    let out;
    out = replaceAllCounting(src, `"${token}"`, `"${escapeForDoubleQuote(value)}"`);
    src = out.src; fileReplacements += out.count;
    out = replaceAllCounting(src, `'${token}'`, `'${escapeForSingleQuote(value)}'`);
    src = out.src; fileReplacements += out.count;
    out = replaceAllCounting(src, `\`${token}\``, `\`${escapeForBacktick(value)}\``);
    src = out.src; fileReplacements += out.count;
    out = replaceAllCounting(src, token, value);
    src = out.src; fileReplacements += out.count;
  }
  if (fileReplacements > 0) {
    fs.writeFileSync(file, src);
    replacedFiles++;
    replacedCount += fileReplacements;
  }
}, { exclude: true });
console.log(`[setup] replaced ${replacedCount} tokens across ${replacedFiles} files`);

const langAppsDir = path.join(langDir, 'apps');
let mdCount = 0;
if (fs.existsSync(langAppsDir)) {
  for (const appName of fs.readdirSync(langAppsDir)) {
    const srcMd = path.join(langAppsDir, appName, 'APP.md');
    const dstMd = path.join(projectRoot, 'server', 'apps', appName, 'APP.md');
    if (fs.existsSync(srcMd) && fs.existsSync(path.dirname(dstMd))) {
      fs.copyFileSync(srcMd, dstMd);
      mdCount++;
    }
  }
}
console.log(`[setup] mirrored ${mdCount} app docs from language pack`);

let unresolvedCount = 0;
const unresolvedFiles = new Set();
walk(projectRoot, (file) => {
  const ext = path.extname(file);
  if (!REPLACE_EXTS.has(ext)) return;
  const src = fs.readFileSync(file, 'utf8');
  const matches = src.match(/__T_[A-Z0-9_]+__/g);
  if (matches) {
    unresolvedCount += matches.length;
    unresolvedFiles.add(path.relative(projectRoot, file));
  }
}, { exclude: true });
if (unresolvedCount > 0) {
  console.warn(`[setup] ${unresolvedCount} unresolved tokens in ${unresolvedFiles.size} files:`);
  for (const f of [...unresolvedFiles].slice(0, 10)) console.warn(`  - ${f}`);
  if (unresolvedFiles.size > 10) console.warn(`  ... and ${unresolvedFiles.size - 10} more`);
}

fs.writeFileSync(marker, locale + '\n');
console.log(`[setup] wrote .language-applied (${locale})`);
