---
description: Current rules for creating and modifying apps in AIOS
---

# App Creation Guide

## 1. Current structure

Every app uses three layers:

```text
server/apps/<appname>/
gui/src/apps/<appname>/
language/<lang>/apps/<appname>/APP.md
```

Use this split consistently:
- `server/apps/` stores app backend code
- `gui/src/apps/` stores app frontend code
- `language/<lang>/apps/` stores app docs by language
- top-level `apps/` is generated during language apply and may be absent in the source repo

System-level apps are exceptions:
- `chat`
- `settings`
- `tasks`

These three still keep app docs under `language/<lang>/apps/`, but backend logic lives in:
- `server/main/`
- `server/agent/`
- `server/llm/`
- `server/prompt/`

## 2. Required files

Minimum backend:

```text
server/apps/<appname>/
├── index.js
├── api/index.js
├── service/
└── repository/
```

Minimum frontend:

```text
gui/src/apps/<appname>/
└── index.vue
```

Optional:

```text
gui/src/apps/<appname>/intent.js
```

Add `intent.js` only when the app must be opened or controlled by other apps through structured actions.

## 3. APP.md rules

Every app must have:

```yaml
---
name: reader
description: Short description
backend: server/apps/reader
frontend: gui/src/apps/reader
database: database/apps/reader.db
---
```

Source file location:

```text
language/<lang>/apps/reader/APP.md
```

Rules:
- `name` uses lowercase directory name
- `backend` must point to the real backend location
- `frontend` must point to the real frontend location
- if the app has no dedicated database, write `无`
- keep the body short; describe only role, paths, data, and entry points

## 4. Backend entry

`server/apps/<appname>/index.js` must export:

```js
export default {
  name: "reader",
  match: (path) => path.startsWith("/apps/reader/"),
  initDb,
  handleApi
};
```

Required:
- `name`
- `match`
- `handleApi`

Optional:
- `initDb`
- `initRuntime`

Register the app in:
- `server/apps/registry.js`

## 5. API rules

- app APIs use `/apps/<appname>/*`
- system APIs use `/api/*`
- use explicit paths, not dynamic route patterns
- use query params for lookup ids
- return `false` when `api/index.js` does not match the request

Example:

```js
if (path === "/apps/reader/detail" && req.method === "GET") {
  const id = Number(url.searchParams.get("id") || 0);
  ...
}

return false;
```

## 6. Database rules

- app databases live in `database/apps/*.db`
- shared system database is `database/aios.db`
- `repository/client.js` owns the connection
- `repository/init.js` owns schema creation
- keep schema simple; do not add migration machinery unless really necessary

## 7. Frontend registration

Register the app in:
- `gui/src/apps.js`

Example:

```js
{
  id: "reader",
  name: "__T_APP_SIDEBAR_READER__",
  icon: "📚",
  desktopLoad: () => import("./apps/reader/index.vue"),
  mobileLoad: () => import("./apps/reader/mobile.vue"),
  intent: () => import("./apps/reader/intent.js"),
  defaultDesktopWindowSize: { w: 900, h: 640 }
}
```

Rules:
- `id` must match the app directory
- `name` should use a translation key
- `desktopLoad` is required
- `mobileLoad` is optional
- `intent` is optional

## 8. Intent rules

Internal app-to-app actions go through the intent layer.

Entry:

```js
import { openIntent } from "../system/intent.js";
```

Payload:

```js
await openIntent({
  app: "chat",
  action: "open",
  data: {}
});
```

Rules:
- business meaning goes in `intent.js`
- pure window opening can stay in window helpers
- if the action carries state or domain meaning, use intent

## 9. AI calls

Prefer shared helpers instead of rebuilding AI orchestration inside each app.

Common choices:
- `agentTaskJson`
- `instantTaskJson`

## 10. Validation

Do not run or debug directly inside the main `AIOS/` repo.

Use `AIOS-dev`:
- `node scripts/refresh.mjs` for normal refresh with current data kept and Chinese applied
- `node scripts/restart.mjs` for a clean restart without preserving test data

## 11. Minimum delivery checklist

- `apps/<appname>/APP.md`
- `language/<lang>/apps/<appname>/APP.md`
- `server/apps/<appname>/index.js`
- `server/apps/<appname>/api/index.js`
- `server/apps/<appname>/service/*.js`
- `server/apps/<appname>/repository/client.js`
- `server/apps/<appname>/repository/init.js`
- registration in `server/apps/registry.js`
- `gui/src/apps/<appname>/index.vue`
- registration in `gui/src/apps.js`
- if needed, `gui/src/apps/<appname>/intent.js`
