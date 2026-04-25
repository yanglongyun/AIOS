import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
const APPS_ROOT = join(process.cwd(), "apps");
const parseReadme = (filePath) => {
  if (!existsSync(filePath)) return null;
  const text = readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  let fmName = "";
  let fmDescription = "";
  let fmBackend = "";
  let fmDatabase = "";
  if (lines[0]?.trim() === "---") {
    let i = 1;
    for (; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "---") break;
      if (line.startsWith("name:")) fmName = line.replace(/^name:\s*/, "").trim();
      if (line.startsWith("description:")) fmDescription = line.replace(/^description:\s*/, "").trim();
      if (line.startsWith("backend:")) fmBackend = line.replace(/^backend:\s*/, "").trim();
      if (line.startsWith("database:")) fmDatabase = line.replace(/^database:\s*/, "").trim();
    }
  }
  if (!fmName && !fmDescription && !fmBackend && !fmDatabase) return null;
  return {
    title: fmName,
    summary: fmDescription,
    backend: fmBackend,
    database: fmDatabase
  };
};
const resolveAppsRoot = (locale = "zh") => {
  const requested = join(APPS_ROOT, locale || "zh");
  if (existsSync(requested)) return requested;
  const zh = join(APPS_ROOT, "zh");
  if (existsSync(zh)) return zh;
  const en = join(APPS_ROOT, "en");
  if (existsSync(en)) return en;
  return null;
};
const apps = (locale = "zh") => {
  const root = resolveAppsRoot(locale);
  if (!root) {
    return `

## 应用目录
你可以帮助用户构建应用、使用应用、管理应用。`;
  }
  const list = [];
  for (const name of readdirSync(root)) {
    const dir = join(root, name);
    let isDir = false;
    try {
      isDir = statSync(dir).isDirectory();
    } catch {
      isDir = false;
    }
    if (!isDir) continue;
    const meta = parseReadme(join(dir, "APP.md"));
    if (!meta) continue;
    list.push({
      id: name,
      title: meta.title || name,
      summary: meta.summary || "",
      backend: meta.backend || "",
      database: meta.database || ""
    });
  }
  list.sort((a, b) => a.id.localeCompare(b.id));
  if (!Array.isArray(list) || list.length === 0) {
    return `

## 应用目录
你可以帮助用户构建应用、使用应用、管理应用。`;
  }
  const lines = list.map((app, i) => {
    const summary = app.summary ? ` - ${app.summary}` : "";
    const backend = app.backend ? ` | backend: ${app.backend}` : "";
    const database = app.database ? ` | database: ${app.database}` : "";
    return `${i + 1}. ${app.id} | ${app.title}${summary}${backend}${database}`;
  });
  return `

## 应用目录
你可以帮助用户构建应用、使用应用、管理应用。
应用说明文档位于 \`apps/${locale}/<appname>/APP.md\`。
${lines.join("\n")}`;
};
export {
  apps
};
