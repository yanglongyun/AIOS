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
ui/src/apps/<appname>/protocol.js
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
  name: 'Reader',
  icon: '📚',
  iconClass: 'icon-reader',
  load: () => import('./apps/reader/index.vue')
}
```

If the app supports internal protocol calls, also add:

```js
protocol: () => import('./apps/reader/protocol.js')
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

## 8. Protocol rules

Internal app-to-app calls must go through the protocol layer.

Entry point:

```js
import { openProtocol } from '../system/protocol/index.js';
```

Payload format:

```js
await openProtocol({
  app: 'chat',
  action: 'open',
  data: {}
});
```

Rules:
- `app`: target app id
- `action`: action name
- `data`: structured payload

App-specific behavior belongs in that app's `protocol.js`, not in random components.

## 9. AI capability calls

Reuse shared AI helpers instead of rebuilding them inside every app.

Common choices:
- `agentTaskJson`
- `instantTaskJson`

## 10. After creating the app

Frontend changes:

```bash
cd ui && npm run build
```

Backend changes:
- do not kill processes manually
- use the system reload endpoints

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
- if needed, `ui/src/apps/<appname>/protocol.js`

In short:
- fixed structure
- fixed paths
- fixed registration points
- fixed protocol entry
