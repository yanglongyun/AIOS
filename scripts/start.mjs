#!/usr/bin/env node

/**
 * start.mjs
 *
 * AIOS 启动前置脚本。单文件负责：
 *
 *   1. 检查 .aios/settings.json 标记文件的 locale 字段
 *   2. 如果已经为请求的 locale 烘焙过，直接跳过（零开销放行）
 *   3. 否则把 language/<locale>/**\/*.json 的文案烘焙进源码：
 *      - 源码里 __T_<KEY_UPPER>__ 占位符被替换成真实文案
 *      - 支持双引号 / 单引号 / 反引号 / 裸文本四种上下文的正确转义
 *      - language/<locale>/apps/<app>/APP.md 烘焙到 apps/<app>/APP.md(根,无 lang 层)
 *      - language/<locale>/AGENTS.md 烘焙到根 AGENTS.md
 *      - language/<locale>/CLAUDE.md 烘焙到根 CLAUDE.md
 *      所有烘焙目标都是 runtime,gitignored;`git clone`+`npm i` 后根目录无任何这些产物,
 *      首次跑 npm start/build/dev 才生成;AI 在日常对话里改 runtime 那份。
 *   4. 在 projectRoot 下写 .aios/settings.json（locale + appliedAt）
 *
 * 本脚本自定位到 dirname($0)/..，可以跑在主仓 AIOS/ 或任何 AIOS/ 的副本里
 * （例如 AIOS-run/AIOS、AIOS-wandesk-image/aios）。
 *
 * 用法:
 *   node scripts/start.mjs                  # 默认 locale = zh，走缓存判断
 *   node scripts/start.mjs en               # 指定 locale
 *   node scripts/start.mjs --force          # 忽略缓存标记，强制重烘
 *   node scripts/start.mjs en --force       # 组合
 *   AIOS_LANG=en node scripts/start.mjs     # 通过环境变量指定 locale
 *   AIOS_ALLOW_SOURCE_BAKE=1 node scripts/start.mjs
 *                                           # 明确允许在 git 源仓烘焙（高风险）
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
const settingsDir = path.join(projectRoot, '.aios');
const settingsFile = path.join(settingsDir, 'settings.json');
const sourceBakeAllowed = process.env.AIOS_ALLOW_SOURCE_BAKE === '1';

if (!sourceBakeAllowed && fs.existsSync(path.join(projectRoot, '.git'))) {
  console.error('[start] Refusing to bake language into a git source checkout.');
  console.error('[start] Use AIOS-run/scripts/r1.mjs, r2.mjs, or r3.mjs to run a baked runtime copy.');
  console.error('[start] If you really need this in the source checkout, set AIOS_ALLOW_SOURCE_BAKE=1 explicitly.');
  process.exit(1);
}

const readSettings = () => {
  if (!fs.existsSync(settingsFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  } catch {
    return null;
  }
};

const writeSettings = (patch) => {
  const current = readSettings() || {};
  const next = { ...current, ...patch };
  fs.mkdirSync(settingsDir, { recursive: true });
  fs.writeFileSync(settingsFile, JSON.stringify(next, null, 2) + '\n');
};

const rawArgs = process.argv.slice(2);
const force = rawArgs.includes('--force');
const locale = rawArgs.find((a) => !a.startsWith('--')) || process.env.AIOS_LANG || 'zh';

if (!force) {
  const current = readSettings()?.locale || null;
  if (current === locale) {
    process.exit(0);
  }
  if (current && current !== locale) {
    console.log(`[start] locale change detected: '${current}' -> '${locale}', re-applying`);
  } else {
    console.log(`[start] first run, applying '${locale}'`);
  }
} else {
  console.log(`[start] --force: re-applying '${locale}'`);
}

const langDir = path.join(projectRoot, 'language', locale);
if (!fs.existsSync(langDir)) {
  console.error(`[start] language pack not found: ${langDir}`);
  process.exit(1);
}

const REPLACE_EXTS = new Set(['.js', '.mjs', '.ts', '.vue', '.json', '.md']);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', '.aios', 'database', 'files', 'dist', 'language', 'scripts']);

const walk = (dir, visit, { exclude = false, root = dir } = {}) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (exclude && dir === root && EXCLUDE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), visit, { exclude, root });
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
    console.error(`[start] invalid JSON: ${file}\n  ${err.message}`);
    process.exit(1);
  }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') continue;
    const token = `__T_${key.toUpperCase()}__`;
    if (tokenMap.has(token) && tokenMap.get(token) !== value) {
      console.warn(`[start] duplicate token ${token} with different values (later wins)`);
    }
    tokenMap.set(token, value);
  }
});
console.log(`[start] ${tokenMap.size} tokens loaded from ${path.relative(projectRoot, langDir)}`);

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
console.log(`[start] replaced ${replacedCount} tokens across ${replacedFiles} files`);

// Bake APP.md from source (`language/<locale>/apps/<name>/APP.md`, committed)
// into runtime (`apps/<name>/APP.md`, gitignored, no <lang> layer — only the
// current locale's content). AI edits the runtime copy; the source is only used
// by start.mjs on first install / locale switch / lang:reset.
const appsSrcRoot = path.join(langDir, 'apps');
const appsDstRoot = path.join(projectRoot, 'apps');
let mdCount = 0;
if (fs.existsSync(appsSrcRoot)) {
  for (const appName of fs.readdirSync(appsSrcRoot)) {
    const srcMd = path.join(appsSrcRoot, appName, 'APP.md');
    if (!fs.existsSync(srcMd)) continue;
    const dstDir = path.join(appsDstRoot, appName);
    fs.mkdirSync(dstDir, { recursive: true });
    fs.copyFileSync(srcMd, path.join(dstDir, 'APP.md'));
    mdCount++;
  }
}
console.log(`[start] mirrored ${mdCount} app docs to apps/`);

// Bake the runtime root-level locale-picked artifacts:
//   AGENTS.md  — system prompt (read fresh by prompt/index.js on every chat)
//   CLAUDE.md  — orientation for external dev collaborators (Claude Code / Codex)
// Sources live in language/<locale>/<NAME>.md; both are gitignored at the root.
for (const name of ['AGENTS.md', 'CLAUDE.md']) {
  const src = path.join(projectRoot, 'language', locale, name);
  const dst = path.join(projectRoot, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`[start] mirrored ${name} from language/${locale}`);
  } else {
    console.warn(`[start] missing language/${locale}/${name}, root ${name} left untouched`);
  }
}

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
  console.warn(`[start] ${unresolvedCount} unresolved tokens in ${unresolvedFiles.size} files:`);
  for (const f of [...unresolvedFiles].slice(0, 10)) console.warn(`  - ${f}`);
  if (unresolvedFiles.size > 10) console.warn(`  ... and ${unresolvedFiles.size - 10} more`);
}

writeSettings({ locale, appliedAt: new Date().toISOString() });
console.log(`[start] wrote .aios/settings.json (locale=${locale})`);
