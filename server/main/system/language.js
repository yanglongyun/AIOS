import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { join } from "path";
const ROOT_DIR = join(import.meta.dirname, "..", "..", "..");
const LANGUAGE_DIR = join(ROOT_DIR, "language");
const UI_SRC_DIR = join(ROOT_DIR, "gui", "src");
const APPS_DIR = join(ROOT_DIR, "apps");
const MEMORY_DIR = join(ROOT_DIR, "memory");
const ALLOWED_LANGUAGES = /* @__PURE__ */ new Set(["zh", "en"]);
const listFiles = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listFiles(full));
      continue;
    }
    files.push(full);
  }
  return files;
};
const loadMessages = (lang) => {
  if (!ALLOWED_LANGUAGES.has(lang)) {
    throw new Error("Invalid language");
  }
  const langDir = join(LANGUAGE_DIR, lang, "gui");
  const stat = statSync(langDir);
  if (!stat.isDirectory()) {
    throw new Error(`Language directory not found: ${lang}`);
  }
  const messages = {};
  for (const file of listFiles(langDir)) {
    if (!file.endsWith(".json")) continue;
    Object.assign(messages, JSON.parse(readFileSync(file, "utf8")));
  }
  return messages;
};
const syncAppDocs = (lang) => {
  const sourceDir = join(LANGUAGE_DIR, lang, "apps");
  if (!existsSync(sourceDir)) return;
  rmSync(APPS_DIR, { recursive: true, force: true });
  cpSync(sourceDir, APPS_DIR, { recursive: true });
};
const syncMemoryDocs = (lang) => {
  const sourceDir = join(LANGUAGE_DIR, lang, "memory");
  if (!existsSync(sourceDir)) return;
  rmSync(MEMORY_DIR, { recursive: true, force: true });
  cpSync(sourceDir, MEMORY_DIR, { recursive: true });
};
const applyLanguage = (lang) => {
  const messages = loadMessages(lang);
  for (const file of listFiles(UI_SRC_DIR)) {
    if (!file.endsWith(".vue") && !file.endsWith(".ts") && !file.endsWith(".js")) continue;
    const content = readFileSync(file, "utf8");
    const replaced = content.replace(/__T_([A-Z0-9_]+)__/g, (match, rawKey) => {
      const key = rawKey.toLowerCase();
      if (!(key in messages)) {
        throw new Error(`Missing language key: ${key}`);
      }
      return messages[key];
    });
    if (replaced !== content) {
      writeFileSync(file, replaced, "utf8");
    }
  }
  syncAppDocs(lang);
  syncMemoryDocs(lang);
};
export {
  applyLanguage
};
