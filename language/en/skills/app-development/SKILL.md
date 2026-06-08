---
name: app-development
description: AIOS app development guide. Covers the main OSS project structure, API rules, database layout, frontend placement, and local verification flow.
---

# App Development Guide

You are working in the main AIOS project. This is a local OSS runtime. You can edit frontend code, backend code, schemas, packages, services, and files. Keep changes in the right layer and keep the code readable.

## Working Directory

The shell cwd is the AIOS project root. Common paths:

- Backend app: `server/apps/<appname>/`
- Frontend app: `ui/src/apps/<appname>/`
- App doc source: `language/<locale>/apps/<appname>/APP.md`
- Baked app doc: `apps/<appname>/APP.md`
- `ui/dist/` is Vite output; do not edit it directly

## Ports

- Main server: `http://127.0.0.1:9502`
- Apps server: `http://127.0.0.1:9503`
- Frontend dev server: `http://127.0.0.1:5173`

The main server proxies `/apps/*` to the apps server. During development, use the frontend first, then curl `/api/health` and `/apps/health` when you need backend confirmation.

## Backend Layout

```
server/apps/<appname>/
└── index.js              # default export { name, match, handleApi, initDb? }
```

Keep basic apps lightweight. A small app can stay in one `index.js` as long as schema, queries, business behavior, and HTTP dispatch are separated into clear functions. Split into `api/`, `service/`, and `repository/` only when the app becomes large enough to need it; do not create empty layers early.

New apps must be registered in:

- `server/apps/registry.js` for the backend entry
- `ui/src/apps.js` for the frontend entry

Verify registration:

```sh
curl http://127.0.0.1:9503/apps/health
```

## API Rules

- Route: `/apps/<appname>/<action>`
- GET for reads, POST + JSON body for creation, PATCH + JSON body for updates, DELETE for deletion
- Use `readBody(req)` for request bodies
- Use `sendJson(res, statusCode, payload)` for JSON responses
- Return `false` for unmatched routes
- User request protocol errors return 400; model or internal service errors must not be disguised as 400

## Database

- App databases use `createAppDb("<appname>.db")`
- Do not mix app tables into the system database
- For lightweight apps, put DDL in the app backend entry's `initDb` / `createSchema` function
- Keep queries in dedicated functions instead of scattering SQL inside HTTP branches

Define new schemas cleanly. Do not keep dead compatibility fields in a new clean schema; do not put old-schema detection, automatic migrations, or automatic drops in app initialization.

## Frontend Layout

```
ui/src/apps/<appname>/
├── index.vue
├── components/
├── views/
├── composables/
└── api.js
```

Keep the app entry clear. Simple apps can start as a single file; split into views / components / composables / api.js when complexity justifies it, not as empty scaffolding.

## Local Verification

Common commands:

```sh
npm run check
npm start
npm run ui
```

After startup:

```sh
curl http://127.0.0.1:9502/api/health
curl http://127.0.0.1:9503/apps/health
```

Backend changes need the relevant service restarted. Frontend changes hot-reload through Vite; run `npm run build` before shipping.

## System Apps

`chat`, `settings`, and `tasks` are system capabilities, not ordinary apps under `server/apps/`. Read their current layers before changing them, and keep naming and event semantics consistent.
