import { dirname, resolve } from "path";
import { existsSync, readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";

// 烘焙后的系统级提示文档放在项目根 /system/*.md
// 由 scripts/start.mjs 从 language/<locale>/system/ 拷过来。
// 这些文档是"系统永远告诉 AI 的事"(例如 AIOS 应用开发约定)。
// 不是单条消息附带的应用上下文 —— 那个走 buildSystemPrompt 的 appContext 参数。

const __dirname = dirname(fileURLToPath(import.meta.url));
const systemDir = resolve(__dirname, "..", "..", "..", "..", "system");

let cache = null;

const loadSystemDocs = () => {
  if (cache !== null) return cache;
  if (!existsSync(systemDir)) {
    cache = "";
    return cache;
  }
  const files = readdirSync(systemDir).filter((name) => name.endsWith(".md")).sort();
  if (!files.length) {
    cache = "";
    return cache;
  }
  const parts = [];
  for (const name of files) {
    const content = readFileSync(resolve(systemDir, name), "utf8").trim();
    if (content) parts.push(content);
  }
  cache = parts.join("\n\n---\n\n");
  return cache;
};

const systemDocs = () => {
  const content = loadSystemDocs();
  return content ? `\n\n${content}` : "";
};

export {
  systemDocs
};
