---
description: Full AIOS app creation and modification skeleton, API contract, database patterns, frontend registration, and reload flow
---

# App Creation Guide

This is the **single authoritative document** for AIOS app development. Read it in full before creating a new app. Do not write from habit, and do not copy the style of Express, Electron, or Fetch - AIOS has its own contract, and code that violates it will not run.

## 0. Runtime Environment Assumptions

Your current working directory is the **runtime workspace**. Every file here is the one currently used by the two Node services on ports 9500 and 9501. So:

- Changing a file means changing runtime code
- After a change, you **must** trigger reload (see Section 10), or Node's module cache will keep the new code from taking effect
- There is no "write in the source repo first, then sync to a runtime copy" model here - there is no two-codebase structure like that
- There is no `__T_*__` placeholder mechanism and no runtime language replacement. Write literal UI strings directly. Do not write `__T_XXX__`; nothing will replace it

## 1. Directory Structure

Each app is split into three layers:

```text
server/apps/<appname>/       # backend code
gui/src/apps/<appname>/      # frontend code
apps/<appname>/APP.md        # app documentation
```

In runtime, the `apps/` directory is for **markdown documentation only**. Do not put `.js` or `.vue` files there. Backend code always belongs in `server/apps/<appname>/`, and frontend code always belongs in `gui/src/apps/<appname>/`.

System-level apps such as `chat`, `settings`, and `tasks` are exceptions. Their backend lives in `server/main/`, `server/agent/`, `server/llm/`, and `server/prompt/`, not in `server/apps/`. Do not model a new app after them.

## 2. Backend Skeleton

At minimum, include these files:

```text
server/apps/<appname>/
├── index.js
├── api/index.js
├── service/<action>.js    # business logic
└── repository/
    ├── client.js          # database connection
    ├── init.js            # create tables
    └── <action>.js        # SQL operations
```

## 3. Backend Entry `index.js`

**Copy this skeleton as-is**:

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

Required fields: `name`, `match`, `handleApi`. Optional fields: `initDb`, `initRuntime`.

**Do not** use the `export default function` style, and do not use `export { default as ... }` named exports. Use the default object shape shown above.

## 4. Register in the Registry

Edit `server/apps/registry.js` and add the new app loader to the array:

```js
const appLoaders = [
  () => import("./notebook/index.js"),
  () => import("./finance/index.js"),
  () => import("./cryptobot/index.js"),
  () => import("./ghtrending/index.js"),
  () => import("./createapp/index.js"),
  () => import("./todo/index.js")   // new
];
export {
  appLoaders
};
```

After changing the registry, you **must** trigger reload (Section 10). Otherwise the `appLoaders` array still held in the 9501 process memory will be the old one, the new app will never be imported, and every `/apps/<appname>/*` request will return 404.

## 5. API Rules (The API Contract - This Is AIOS-Specific, Not Express or Fetch)

### 5.1 `handleApi` Function Signature

**Fixed signature. The parameter order cannot change**:

```js
const handleApi = async (req, res, path) => { ... };
```

- `req` is Node's native `http.IncomingMessage` (**not** a Fetch `Request`, and it does **not** have `.json()`)
- `res` is Node's native `http.ServerResponse`
- `path` is a string already extracted from the URL

### 5.2 Read the Body with `readBody(req)`

Do not call `req.json()` - that is Fetch API behavior and does not exist here. Use the built-in AIOS helper:

```js
import { readBody } from "../../../shared/http/readBody.js";

const body = await readBody(req);
// body is already a JSON.parse'd object
```

### 5.3 Read Query Strings with `new URL(req.url, ...)`

```js
const url = new URL(req.url, `http://${req.headers.host}`);
const id = Number(url.searchParams.get("id") || 0);
```

### 5.4 Write Responses with `json(res, data, status?)`

**Do not** return a `{ status, body }` object. That is Express-like style, and AIOS does not consume it. The handler must write to `res` itself:

```js
import { json } from "../../../shared/http/json.js";

return json(res, { ok: true, data });        // defaults to 200
return json(res, { error: "..." }, 400);     // explicit status code
```

`json()` calls `res.writeHead` and `res.end`, which closes the connection.

### 5.5 Return `false` on an Unmatched Path

If the handler does not recognize a path, `return false`. The upper layer of the apps server will turn that into a 404. Do not `return json(res, { error: "not found" }, 404)`, and do not throw.

### 5.6 URL Style

- All app APIs use `/apps/<appname>/<action>` with explicit paths, not dynamic route matching
- Query operations use `GET + query string`
- Mutation operations use `POST + JSON body`

### 5.7 Full `api/index.js` Skeleton

**Copy this structure as-is**. Only change the app name, action names, and service function names:

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

## 6. Database Rules

### 6.1 `repository/client.js`: Use the `createAppDb` Helper

**Never** create your own `new Database(...)`, **never** `import { app } from 'electron'` (AIOS is not Electron), and **never** build your own `userData` path. Use the built-in helper:

```js
import { createAppDb } from "../../app_shared/db/createAppDb.js";

const db = createAppDb("todo.db");

export { db };
```

`createAppDb` will:

- put the database file under `database/apps/<filename>`
- create the directory automatically
- enable WAL mode

It returns a better-sqlite3 instance. The API is **synchronous** (`db.prepare(...)`, `stmt.run(...)`, `stmt.get(...)`, `stmt.all(...)`), not promise-based.

### 6.2 `repository/init.js`: Create Tables

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

Hard rules:

- **Forbidden**: `ALTER TABLE`, `DROP TABLE`, `PRAGMA table_info`, version checks, or anything similar
- **Forbidden**: backfills, fallbacks, or compatibility branches for old data
- Each table's `CREATE TABLE` is the current and only shape. Keep only the final schema in code
- If you change the schema, delete and rebuild `database/apps/<app>.db`

### 6.3 Other `repository/<action>.js` Files: Concrete SQL

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

### 6.4 `service/<action>.js`: Business Layer

The service layer handles validation, assembly, and repository calls. By convention it returns **plain objects** only. Success returns data, failure returns `{ error, status? }`. Do not throw up to the handler.

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

## 7. Frontend Structure

```text
gui/src/apps/<appname>/
├── index.vue              # app entry: compose child components, own top-level state
└── components/            # extracted child components
    ├── Toolbar.vue
    ├── ItemCard.vue
    └── ...
```

**Component splitting is a hard rule**. Any structure that can stand on its own (toolbar, list item, sidebar, modal, settings panel, or a subview) should be split into an independent `.vue` file under `components/`.

- `index.vue` should only load data, own top-level state, compose child components, and forward cross-component events
- Child components should do one thing, taking props in and emitting events out
- Size guideline: keep `index.vue` within 200 lines

If the app needs to be opened by business actions from other apps, also add `gui/src/apps/<appname>/intent.js`.

### Style Rules: Tailwind First

The project uses Tailwind v4 (`@tailwindcss/vite` zero-config). All frontend styles should default to Tailwind utility classes. `<style scoped>` is the exception, not the norm.

**Write everything inline with Tailwind utilities**:

- layout, spacing, border radius, font sizes, flex and grid
- hover, disabled, focus, last-child, and other variants
- transition, opacity, transform
- `before:` and `after:` pseudo-elements (Tailwind v4 arbitrary variants are expressive enough)
- exact values with arbitrary values: `text-[9.5px]`, `rounded-[14px]`, `px-[18px]`, `tracking-[0.09em]`, `leading-[1.55]`

**Use inline `style` for brand colors**, not a global config palette:

```vue
<div
  class="rounded-[14px] border px-[18px] py-[11px]"
  style="background:#fbfaf7;border-color:rgba(92,67,50,0.14);color:#2a1f13"
>
```

**Use `<style scoped>` only in three cases**:

1. Custom `@keyframes` animations (spinner, loading animation, and so on)
2. Vue `<Transition>` class pairs (`.xxx-enter-active`, `.xxx-leave-to`)
3. `:deep()` overrides for third-party components or markdown-rendered HTML

**Forbidden**: creating custom classes such as `.my-card` or `.my-btn` and then writing padding, color, or hover rules in scoped CSS. That just duplicates what Tailwind already provides.

## 8. Frontend Registration

Edit `gui/src/apps.js` and add the app to the array:

```js
{
  id: "todo",
  name: "Todo",
  icon: "✅",
  desktopLoad: () => import("./apps/todo/index.vue"),
  intent: () => import("./apps/todo/intent.js"),
  defaultDesktopWindowSize: { w: 640, h: 720 }
}
```

Rules:

- `id` must match the app directory name
- `name` should be written as a literal display string (do not use `__T_*__` placeholders because runtime has no replacement mechanism)
- `icon` must be a single emoji
- `desktopLoad` is required
- `intent` is optional

## 9. Intent Rules

Business-semantic calls between apps should always go through intent.

```js
import { openIntent } from "../system/intent.js";

await openIntent({
  app: "chat",
  action: "open",
  data: {}
});
```

Rules:

- Put business-semantic actions into `intent.js`
- Pure window-open behavior can use window tools
- If state and business meaning are involved, do not bypass intent

## 10. Reload and Verification (Hard Rule)

**After changing code, you must call reload. This is mandatory, not optional advice.**

Ports 9500 and 9501 are two long-running Node processes. Their module trees are baked into memory at startup. Changing a `.js` file on disk does not update the old code already loaded in process memory. No reload means your change did not really take effect.

### 10.1 Typical Scenarios

**Only backend app code changed (`server/apps/<appname>/`, `registry.js`)**:

```bash
curl -X POST http://localhost:9500/api/system/reload/request \
  -H "Content-Type: application/json" \
  -d '{"build": false, "restartApps": true, "restartServer": false, "message": "add todo app"}'
```

**Only frontend changed (`gui/src/...`)**:

```bash
curl -X POST http://localhost:9500/api/system/reload/request \
  -H "Content-Type: application/json" \
  -d '{"build": true, "restartApps": false, "restartServer": false, "message": "todo frontend update"}'
```

**Both frontend and backend changed**: set both to `true`:

```bash
curl -X POST http://localhost:9500/api/system/reload/request \
  -H "Content-Type: application/json" \
  -d '{"build": true, "restartApps": true, "restartServer": false, "message": "add todo app"}'
```

Use `restartServer: true` only if you changed `server/main/`, `server/shared/`, `server/agent/`, `server/llm/`, or `server/prompt/`. That will restart the main service and interrupt running tasks. **When creating a new app, do not include `restartServer`.**

### 10.2 Flow

`/api/system/reload/request` -> the backend first probes whether a new process can start -> if it passes, the frontend shows a "Restart System" dialog -> the user confirms -> then the old process is killed and the new process starts.

If the preflight probe fails, it returns an error immediately and the current service is left untouched. So this endpoint is safe to call.

### 10.3 Preflight Only, No Switch

```bash
curl -X POST http://localhost:9500/api/system/reload/test \
  -H "Content-Type: application/json" \
  -d '{"restartApps": true}'
```

This runs the probe only. It does not show a dialog and does not switch processes. Use it when you are not sure whether the code can import successfully and want a self-check first.

### 10.4 Forbidden Patterns

- Declaring "done" after changing code without calling reload
- Calling `/api/system/reload` directly (the terminal endpoint), bypassing preflight and user confirmation
- Including `restartServer: true` while creating a new app

## 11. AI Calls

Reuse the system's existing AI wrappers whenever possible. Do not reinvent a new AI orchestration layer inside each app.

Common entry points:

- `agentTaskJson`
- `instantTaskJson`

## 12. Minimum Delivery Checklist

To create a new app, write **everything** in this order:

1. `server/apps/<appname>/index.js`
2. `server/apps/<appname>/repository/client.js`
3. `server/apps/<appname>/repository/init.js`
4. `server/apps/<appname>/repository/<action>.js` (create, list, update, delete, and so on)
5. `server/apps/<appname>/service/<action>.js`
6. `server/apps/<appname>/api/index.js`
7. Edit `server/apps/registry.js` and add the new app to `appLoaders`
8. `gui/src/apps/<appname>/index.vue` (at minimum this one; split subcomponents into `components/`)
9. Edit `gui/src/apps.js` and add the registration item (`name` should be a literal display string)
10. `apps/<appname>/APP.md` (short description)
11. Call `/api/system/reload/request` to trigger reload

Miss one step and the app is incomplete. Miss Step 7 and 9501 will never load the app. Miss Step 11 and the new code will never take effect.

## 13. Anti-Patterns (Recognize Them and Reject Them)

- ❌ `import { app } from 'electron'` - AIOS is not Electron
- ❌ `req.json()` - native Node http does not have this; use `readBody(req)`
- ❌ `return { status, body }` - the upper layer does not consume that shape; use `json(res, data, status)`
- ❌ `new Database(...)` in `repository/client.js` with a hand-built path - use `createAppDb("xxx.db")`
- ❌ `__T_APP_SIDEBAR_XXX__` placeholders - runtime has no language replacement, so write literal strings
- ❌ Express-style routers (`app.get(...)`, `app.post(...)`) - AIOS uses bare Node http
- ❌ throwing inside `handleApi` - use `return json(res, { error }, status)` or `return false`
- ❌ `handleApi(path, req, url)` - wrong parameter order; the correct order is `(req, res, path)`
- ❌ changing code and declaring it done without calling reload - the new code is not active, and the user will immediately see 404s or old behavior
