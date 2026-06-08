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
├── index.js              # default export { name, match, handleApi, initDb? }
├── api/
│   ├── index.js          # route dispatch only
│   └── <action>.js       # one endpoint per file
├── service/              # business logic
│   └── <action>.js
└── repository/           # SQLite queries
    ├── init.js           # schema
    └── <action>.js
```

Keep responsibilities separate: api handles HTTP, service handles business behavior, repository handles database access. Do not put SQL in api files, and do not put business policy in repository files.

New apps must be registered in:

- `server/apps/registry.js` for the backend entry
- `ui/src/apps.js` for the frontend entry

Verify registration:

```sh
curl http://127.0.0.1:9503/apps/registry
```

## API Rules

- Route: `/apps/<appname>/<action>`
- GET for reads, POST + JSON body for changes
- Use `readBody(req)` for request bodies
- Use `json(res, data, status?)` for JSON responses
- Return `false` for unmatched routes

## Database

- App databases use `createAppDb("<appname>.db")`
- Do not mix app tables into the system database
- Put DDL in `repository/init.js`
- Split queries by action
- Convert `info.lastInsertRowid` with `Number(...)` before returning

Define new schemas cleanly. When changing existing data structures, first decide whether rebuilding the database is allowed; only write migrations when old data must be preserved. Do not keep dead compatibility fields in a new clean schema.

## Frontend Layout

```
ui/src/apps/<appname>/
├── index.vue
├── components/
├── views/
├── composables/
└── api.js
```

Keep the app entry thin. Views, components, requests, and stateful logic should live in their own files. Do not grow a whole app into one large `.vue` file.

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
