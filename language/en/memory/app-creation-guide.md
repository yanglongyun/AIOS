---
description: AIOS 新建和修改应用的完整骨架、API 契约、数据库写法、前端注册、重启流程
---

# 应用创建指导

这是 AIOS 应用开发的**唯一权威文档**。新建应用前必须完整读完。不要凭经验写，不要照搬 Express / Electron / Fetch 的风格——AIOS 有自己的契约，背离契约的代码一定跑不起来。

## 0. 运行环境前提

你当前的工作目录就是**运行态 workspace**。这里的每一个文件都是 9500/9501 两个 Node 服务正在跑的那份。所以：

- 改文件 = 改运行时代码
- 改完**必须**触发 reload（见第 10 节），否则 Node 的模块缓存让新代码完全不生效
- 不存在"先在源码仓库写，再同步到运行副本"这种事——没有那种两份代码的结构
- 不存在 `__T_*__` 占位符机制，也不存在运行时的语言替换。写文案**直接写中文字面量**，别写 `__T_XXX__`，写了也没人会替换

## 1. 目录结构

每个应用分成三层：

```text
server/apps/<appname>/       # 后端代码
gui/src/apps/<appname>/      # 前端代码
apps/<appname>/APP.md        # 应用说明文档
```

运行态里 `apps/` 目录**只放 markdown 说明文档**，不要往里写 `.js` 或 `.vue`。后端代码永远在 `server/apps/<appname>/`，前端代码永远在 `gui/src/apps/<appname>/`。

系统级应用 `chat` / `settings` / `tasks` 是特例，它们的后端在 `server/main/`、`server/agent/`、`server/llm/`、`server/prompt/` 里，不在 `server/apps/`。建新 app 不要学它们。

## 2. 后端骨架

最少包含这些文件：

```text
server/apps/<appname>/
├── index.js
├── api/index.js
├── service/<action>.js    # 业务逻辑
└── repository/
    ├── client.js          # 数据库连接
    ├── init.js            # 建表
    └── <action>.js        # SQL 操作
```

## 3. 后端入口 `index.js`

**原样抄这个骨架**：

```js
import { initDb } from "./repository/init.js";
import { handleApi } from "./api/index.js";

export default {
  name: "todo",
  match: (path) => path.startsWith("/apps/todo/"),
  initDb,
  handleApi
};
```

必需字段：`name`、`match`、`handleApi`。可选：`initDb`、`initRuntime`。

**不要**用 `export default function` 的风格，不要用 named export 里 `export { default as ... }`——就是上面这种 default object。

## 4. 注册到 registry

改 `server/apps/registry.js`，把新 app 的 loader 加进数组：

```js
const appLoaders = [
  () => import("./notebook/index.js"),
  () => import("./finance/index.js"),
  () => import("./cryptobot/index.js"),
  () => import("./ghtrending/index.js"),
  () => import("./createapp/index.js"),
  () => import("./todo/index.js")   // 新增
];
export {
  appLoaders
};
```

改完 registry 后**必须**调 reload（第 10 节），否则 9501 进程内存里的 `appLoaders` 还是旧数组，新 app 根本没被 import，任何 `/apps/<appname>/*` 请求都会 404。

## 5. API 规则（API 契约——这是 AIOS 自己的约定，和 Express/Fetch 无关）

### 5.1 `handleApi` 函数签名

**固定签名，顺序不能变**：

```js
const handleApi = async (req, res, path) => { ... };
```

- `req` 是 Node 原生 `http.IncomingMessage`（**不是** Fetch 的 Request，**没有** `.json()` 方法）
- `res` 是 Node 原生 `http.ServerResponse`
- `path` 是字符串，已经从 URL 里取好了

### 5.2 读 body：用 `readBody(req)`

不要调 `req.json()`——那是 Fetch API，这里没有。用 AIOS 内置的 helper：

```js
import { readBody } from "../../../shared/http/readBody.js";

const body = await readBody(req);
// body 是已经 JSON.parse 好的对象
```

### 5.3 读 query string：用 `new URL(req.url, ...)`

```js
const url = new URL(req.url, `http://${req.headers.host}`);
const id = Number(url.searchParams.get("id") || 0);
```

### 5.4 写响应：用 `json(res, data, status?)`

**不要** return `{ status, body }` 对象——那是 Express-like 的风格，AIOS 这里不接。handler 必须亲自往 `res` 里写：

```js
import { json } from "../../../shared/http/json.js";

return json(res, { ok: true, data });        // 默认 200
return json(res, { error: "..." }, 400);     // 指定状态码
```

`json()` 会调 `res.writeHead` + `res.end`，把连接关掉。

### 5.5 未命中路径返回 `false`

handler 不认识的路径就 `return false`——apps server 的上层会把它变成 404。不要 `return json(res, { error: "not found" }, 404)`，不要 throw。

### 5.6 URL 风格

- 应用 API 全部走 `/apps/<appname>/<action>`，路径写死，不做动态路由匹配
- 查询类走 `GET + query string`
- 变更类走 `POST + JSON body`

### 5.7 完整的 `api/index.js` 骨架

**原样抄这个结构**，改 app 名、action 名、service 函数名就行：

```js
import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { listTodos } from "../service/list.js";
import { createTodo } from "../service/create.js";
import { updateTodo } from "../service/update.js";
import { deleteTodo } from "../service/delete.js";

const handleApi = async (req, res, path) => {
  if (path === "/apps/todo/list" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const completed = url.searchParams.get("completed");
    return json(res, listTodos({
      completed: completed == null ? null : completed === "true"
    }));
  }

  if (path === "/apps/todo/create" && req.method === "POST") {
    const body = await readBody(req);
    const data = createTodo(body);
    if (data?.error) return json(res, { error: data.error }, data.status || 400);
    return json(res, data);
  }

  if (path === "/apps/todo/update" && req.method === "POST") {
    const body = await readBody(req);
    const data = updateTodo(body);
    if (data?.error) return json(res, { error: data.error }, data.status || 400);
    return json(res, data);
  }

  if (path === "/apps/todo/delete" && req.method === "POST") {
    const body = await readBody(req);
    const data = deleteTodo(body);
    if (data?.error) return json(res, { error: data.error }, data.status || 400);
    return json(res, data);
  }

  return false;
};

export { handleApi };
```

## 6. 数据库规则

### 6.1 `repository/client.js`：用 `createAppDb` helper

**绝对不要**自己 `new Database(...)`，**绝对不要** `import { app } from 'electron'`（AIOS 不是 Electron），**绝对不要**自己拼 `userData` 路径。用内置 helper：

```js
import { createAppDb } from "../../app_shared/db/createAppDb.js";

const db = createAppDb("todo.db");

export { db };
```

`createAppDb` 会：
- 把数据库文件放到 `database/apps/<filename>`
- 自动创建目录
- 打开 WAL 模式

返回一个 better-sqlite3 实例。**同步 API**（`db.prepare(...)` / `stmt.run(...)` / `stmt.get(...)` / `stmt.all(...)`），不是 Promise。

### 6.2 `repository/init.js`：建表

```js
import { db } from "./client.js";

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

export { initDb };
```

硬规则：
- **禁止** `ALTER TABLE` / `DROP TABLE` / `PRAGMA table_info` 检测 / 版本判断
- **禁止** backfill、fallback、兼容旧数据的条件分支
- 每张表的 `CREATE TABLE` 就是它当前且唯一的形状，代码只保留"最终形态"
- 改表结构就清 `database/apps/<app>.db` 重建

### 6.3 其他 `repository/<action>.js`：具体 SQL

```js
import { db } from "./client.js";

const createTodoRow = ({ title, description }) => {
  const stmt = db.prepare(`
    INSERT INTO todos (title, description) VALUES (?, ?)
    RETURNING id
  `);
  return stmt.get(title, description);
};

export { createTodoRow };
```

### 6.4 `service/<action>.js`：业务层

service 层做校验、组装、调用 repository。约定返回**纯对象**（成功就是数据，失败就是 `{ error, status? }`，不要 throw 给 handler）：

```js
import { createTodoRow } from "../repository/create.js";

const createTodo = ({ title = "", description = "" } = {}) => {
  const trimmedTitle = String(title).trim();
  if (!trimmedTitle) return { error: "title is required", status: 400 };
  const row = createTodoRow({ trimmedTitle, description: String(description).trim() });
  return { id: row.id, title: trimmedTitle, description };
};

export { createTodo };
```

## 7. 前端结构

```text
gui/src/apps/<appname>/
├── index.vue              # 应用主入口：组合子组件，持有顶层状态
└── components/            # 拆分出来的子组件
    ├── Toolbar.vue
    ├── ItemCard.vue
    └── ...
```

**组件拆分是硬规则**。凡是能独立成块的结构（工具条、列表项、侧边栏、弹层、设置面板、某个子视图），都拆到 `components/` 下作为独立的 `.vue` 文件。

- `index.vue` 只负责：加载数据、持有顶层状态、组合子组件、处理跨组件的事件中转
- 子组件职责单一，props-in / emit-out
- 参考规模：`index.vue` 控制在 200 行以内

如需被其他应用通过动作调用，再补 `gui/src/apps/<appname>/intent.js`。

### 样式规则：Tailwind 优先

项目用的是 Tailwind v4（`@tailwindcss/vite` 零配置），所有前端样式**默认走 Tailwind 工具类**。`<style scoped>` 块是例外，不是常规。

**全部用 Tailwind 工具类写 inline**：
- 布局、间距、圆角、字号、flex/grid
- hover / disabled / focus / last-child 等变体
- transition、opacity、transform
- `before:` / `after:` 伪元素（Tailwind v4 的 arbitrary variant 足够表达）
- 任意精确数值用 arbitrary value：`text-[9.5px]` / `rounded-[14px]` / `px-[18px]` / `tracking-[0.09em]` / `leading-[1.55]`

**品牌色走 inline `style` 属性**，不在全局 config 里加色板：

```vue
<div
  class="rounded-[14px] border px-[18px] py-[11px]"
  style="background:#fbfaf7;border-color:rgba(92,67,50,0.14);color:#2a1f13"
>
```

**`<style scoped>` 只在三种情况用**：
1. `@keyframes` 自定义关键帧动画（spinner、loading 动画等）
2. Vue `<Transition>` 约定的类对（`.xxx-enter-active` / `.xxx-leave-to`）
3. `:deep()` 穿透第三方组件或 markdown 渲染出的 HTML 结构

**禁止**：给元素起 `.my-card / .my-btn` 这种自定义 class 然后在 scoped CSS 里写 padding/color/hover——这是在重复 Tailwind 已经做过的事。

## 8. 前端注册

改 `gui/src/apps.js`，加进数组：

```js
{
  id: "todo",
  name: "待办",
  icon: "✅",
  desktopLoad: () => import("./apps/todo/index.vue"),
  intent: () => import("./apps/todo/intent.js"),
  defaultDesktopWindowSize: { w: 640, h: 720 }
}
```

规则：
- `id` 与应用目录一致
- `name` **直接写中文字面量**（不要 `__T_*__` 占位符，运行时没有替换机制）
- `icon` 单个 emoji
- `desktopLoad` 必须有
- `intent` 可选

## 9. Intent 规则

应用之间有业务语义的调用，统一走 intent。

```js
import { openIntent } from "../system/intent.js";

await openIntent({
  app: "chat",
  action: "open",
  data: {}
});
```

规则：
- 有业务语义的动作写进 `intent.js`
- 纯窗口打开可以走窗口工具
- 只要带状态和业务含义，就不要绕过 intent

## 10. 重启与验证（硬规则）

**改完代码必须调 reload，这是硬要求，不是可选建议**。

9500 和 9501 是两个长期运行的 Node 进程，它们的模块树在启动时就烘焙在内存里了。你在磁盘上改了 `.js` 文件，进程内存里的旧代码不会自动更新。不调 reload = 白改。

### 10.1 典型场景

**只改了后端 app 代码（`server/apps/<appname>/`、`registry.js`）**：

```bash
curl -X POST http://localhost:9500/api/system/reload/request \
  -H "Content-Type: application/json" \
  -d '{"build": false, "restartApps": true, "restartServer": false, "message": "新增 todo 应用"}'
```

**只改了前端（`gui/src/...`）**：

```bash
curl -X POST http://localhost:9500/api/system/reload/request \
  -H "Content-Type: application/json" \
  -d '{"build": true, "restartApps": false, "restartServer": false, "message": "todo 前端更新"}'
```

**前后端都改了**：两个 `true` 一起：

```bash
curl -X POST http://localhost:9500/api/system/reload/request \
  -H "Content-Type: application/json" \
  -d '{"build": true, "restartApps": true, "restartServer": false, "message": "新增 todo 应用"}'
```

`restartServer: true` 只在改了 `server/main/` / `server/shared/` / `server/agent/` / `server/llm/` / `server/prompt/` 时才带——这会重启主服务，中断正在跑的任务。**建 app 的场景绝对不要带 `restartServer`**。

### 10.2 流程

`/api/system/reload/request` → 后台先 probe 一个新进程确认能起来 → 通过后前端弹"重启系统"对话框 → 用户点确认 → 真正杀掉旧进程、启动新进程。

预检失败会直接报错，当前服务不受影响——所以这条接口是安全的，放心调。

### 10.3 只验证能不能起来、不切换

```bash
curl -X POST http://localhost:9500/api/system/reload/test \
  -H "Content-Type: application/json" \
  -d '{"restartApps": true}'
```

这只跑 probe，不弹对话框，不切换。适合你不确定代码能不能 import 成功的时候先自检。

### 10.4 禁止的做法

- 改完代码不调 reload 就告诉用户"做完了"
- 直接调 `/api/system/reload`（终态接口），绕过预检和用户确认
- 在建新 app 的场景里带 `restartServer: true`

## 11. AI 调用

优先复用系统已有封装，不要每个应用自己重造一套 AI 编排。

常见入口：
- `agentTaskJson`
- `instantTaskJson`

## 12. 最低交付清单

新建一个 app，**按这个顺序**写全部内容：

1. `server/apps/<appname>/index.js`
2. `server/apps/<appname>/repository/client.js`
3. `server/apps/<appname>/repository/init.js`
4. `server/apps/<appname>/repository/<action>.js`（create/list/update/delete 等）
5. `server/apps/<appname>/service/<action>.js`
6. `server/apps/<appname>/api/index.js`
7. 改 `server/apps/registry.js`，把新 app 加进 `appLoaders`
8. `gui/src/apps/<appname>/index.vue`（至少这一个；组件拆 `components/`）
9. 改 `gui/src/apps.js`，加注册项（`name` 写中文字面量）
10. `apps/<appname>/APP.md`（简短说明）
11. 调 `/api/system/reload/request` 触发重启

漏一步，app 就不完整。漏第 7 步，app 永远不会被 9501 加载。漏第 11 步，新代码永远不生效。

## 13. 反模式（遇到要认出来并拒绝）

- ❌ `import { app } from 'electron'` —— AIOS 不是 Electron
- ❌ `req.json()` —— Node 原生 http 没这个方法，用 `readBody(req)`
- ❌ `return { status, body }` —— 上层不消费这种结构，用 `json(res, data, status)`
- ❌ `new Database(...)` 在 `repository/client.js` 自己拼路径 —— 用 `createAppDb("xxx.db")`
- ❌ `__T_APP_SIDEBAR_XXX__` 占位符 —— 运行时没有语言替换机制，写中文字面量
- ❌ Express 风格的 router (`app.get(...)` / `app.post(...)`) —— AIOS 用的是裸 Node http
- ❌ 在 `handleApi` 里 throw —— 用 `return json(res, { error }, status)` 或 `return false`
- ❌ `handleApi(path, req, url)` —— 参数顺序错了，正确是 `(req, res, path)`
- ❌ 改完代码不调 reload 直接宣布完成 —— 新代码没生效，用户立刻会看到 404 或旧行为
