---
description: Minimal rules for creating a new app
---

# App Creation Guide

## 1. Required files

Backend:

```text
apps/<appname>/
├── APP.md
├── index.js
├── api/index.js
├── service/
└── repository/
```

Frontend:

```text
ui/src/apps/<appname>/
├── index.vue
└── ...
```

If the app must be callable from other apps, also add:

```text
ui/src/apps/<appname>/intent.js
```

## 2. APP.md is required

Every new app must include `APP.md` with this frontmatter:

```yaml
---
name: reader
description: Short description
backend: apps/reader
database: database/apps/reader.db
---
```

Rules:
- `name` must be lowercase, no spaces
- `backend` must match the real backend directory
- if there is no app database, use `无`

## 3. Backend entry format

`apps/<appname>/index.js` must include at least:

```js
export default {
  name: 'reader',
  match: (path) => path.startsWith('/apps/reader/'),
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
- `apps/registry.js`

## 4. API rules

- use full path matching
- do not use dynamic route segments
- use query params like `?id=123`
- return `false` when `api/index.js` does not match

Example:

```js
if (path === '/apps/reader/detail' && req.method === 'GET') {
  const id = Number(url.searchParams.get('id') || 0);
  ...
}

return false;
```

## 5. Database rules

- app databases live in `database/apps/*.db`
- `repository/client.js` creates the connection
- `repository/init.js` creates the schema
- during development, delete and recreate the db
- do not design a complex migration flow here

## 6. Frontend registration

Register the app in:
- `ui/src/apps.js`

Example:

```js
{
  id: 'reader',
  name: '__T_APP_SIDEBAR_READER__',
  icon: '📚',
  desktopLoad: () => import('./apps/reader/index.vue'),
  mobileLoad: () => import('./apps/reader/mobile.vue'),
  intent: () => import('./apps/reader/intent.js'),
  defaultDesktopWindowSize: { w: 900, h: 640 }
}
```

Rules:
- `id` must match the app directory
- `name` should use a translation key, not hardcoded text
- `desktopLoad` is the desktop entry component
- `mobileLoad` is optional
- `intent` is optional
- `defaultDesktopWindowSize` is optional but recommended

If the app supports system intent calls, also add:

```js
intent: () => import('./apps/reader/intent.js')
```

## 7. Frontend request paths

Use root paths:

- system API: `/api/*`
- app API: `/apps/*`

Do not write:

```js
fetch('/api/xxx')
fetch('/apps/xxx')
```

Use real endpoints:

```js
fetch('/api/xxx')
fetch('/apps/reader/list')
```

## 8. Intent rules

Internal app-to-app calls must go through the intent layer.

Entry point:

```js
import { openIntent } from '../system/intent.js';
```

Payload format:

```js
await openIntent({
  app: 'chat',
  action: 'open',
  data: {}
});
```

Rules:
- `app`: target app id
- `action`: action name
- `data`: structured payload

App-specific behavior belongs in that app's `intent.js`, not in random components.

Use `system/windows.js` only for pure window opening. If the call carries business meaning such as "open new chat" or "open task detail", it belongs in `intent.js`.

## 9. AI capability calls

Reuse shared AI helpers instead of rebuilding them inside every app.

Common choices:
- `agentTaskJson`
- `instantTaskJson`

## 10. After creating the app

Frontend checks:

```bash
cd /Users/woodchange/Desktop/aios/aios-dev/aios && npm run build
```

Run and verify from `aios-dev`, not directly from the main `AIOS` directory.

## 11. Minimum delivery checklist

- `apps/<appname>/APP.md`
- `apps/<appname>/index.js`
- `apps/<appname>/api/index.js`
- `apps/<appname>/service/*.js`
- `apps/<appname>/repository/client.js`
- `apps/<appname>/repository/init.js`
- app registered in `apps/registry.js`
- `ui/src/apps/<appname>/index.vue`
- app registered in `ui/src/apps.js`
- if needed, `ui/src/apps/<appname>/intent.js`

In short:
- fixed structure
- fixed paths
- fixed registration points
- fixed intent entry
