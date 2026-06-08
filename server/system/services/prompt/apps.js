// @ts-nocheck
// 把已安装应用的 APP.md 摘要注入 system prompt,让 AI 知道有哪些 app、
// 各自的后端/前端/独立库在哪,从而能直接读库、调 /apps/<id>/* 操作它们。
import fs from "fs";
import path from "path";

const APPS_ROOT = path.join(process.cwd(), "apps");

const parseAppMd = (file) => {
  if (!fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const meta = { name: "", description: "", backend: "", frontend: "", database: "" };
  if (lines[0]?.trim() === "---") {
    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (line === "---") break;
      for (const key of Object.keys(meta)) {
        if (line.startsWith(`${key}:`)) meta[key] = line.slice(key.length + 1).trim();
      }
    }
  }
  return meta.name || meta.description ? meta : null;
};

const apps = () => {
  const head =
    "\n\n## 应用目录\n你可以帮用户使用 / 操作 / 新建应用。每个 app 自带后端 + 独立 SQLite 库,只通过 `/apps/<id>/*` 暴露;需要时可直接 sqlite3 只读查库或 curl 调它的接口。新建应用时参考现有 app 的后端、前端、APP.md 与注册表结构。";

  if (!fs.existsSync(APPS_ROOT)) return head;

  const list = fs.readdirSync(APPS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => parseAppMd(path.join(APPS_ROOT, entry.name, "APP.md")))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!list.length) return head;

  const items = list.map((app, i) => {
    const desc = app.description ? ` — ${app.description}` : "";
    const backend = app.backend ? ` | backend: ${app.backend}` : "";
    const db = app.database ? ` | db: ${app.database}` : "";
    return `${i + 1}. ${app.name}${desc}${backend}${db}`;
  });

  return `${head}\n${items.join("\n")}`;
};

export { apps };
