---
name: app-development
description: AIOS app development guide. Covers the latest contracts for frontend/backend/docs, layered structure, registries, per-app SQLite, the v6 design language, AI integration patterns, and a full step-by-step checklist for creating a new app.
---

# App Development Guide

You are working in the main AIOS project (runs locally; ESM JavaScript, Vue 3 + Vite + Tailwind v4, `node:sqlite`, lucide-vue-next; no TypeScript / React / component libraries). A new app must satisfy all three contracts: **frontend, backend, docs**. **Do not invent new structure — copy an existing app (notepad is the most complete).**

## Commands and Ports

```sh
npm start          # bake + start system(:9502) + apps(:9503)
npm run ui         # Vite frontend dev server(:5173)
npm run check      # full JS syntax check
npm run build      # bake + build ui/dist
```

The system server proxies `/apps/*` to the apps server. Health checks: `curl http://127.0.0.1:9502/api/health` and `curl http://127.0.0.1:9503/apps/health`.

## Frontend Contract: `ui/src/apps/<id>/`

```
index.vue       entry: holds app state and actions, composes views; keep it thin
views/          screen-level views (ListView/EditorView/MainView...)
components/     reusable in-app pieces (cards/input bars/form shells...)
lib/            api.js (fetch wrapper) + format.js (pure functions: formatting/constants)
```

- Register: add one line `{ id, name, icon, load }` to `ui/src/apps.js`. `icon` is a **lucide-vue-next component reference** (not an emoji, not a string); `load` is `() => import('./apps/<id>/index.vue')`.
- The app root container manages its own layout; the standard page skeleton:

```html
<div class="absolute inset-0 overflow-y-auto dot-grid">
  <div class="page"><!-- max-width 860px centered --> ... </div>
</div>
```

- Pass state with props/emits/defineModel; do not introduce a store for a single app.
- Top bar interaction: to change the title or register a left action, use `import { topTitle, topLeftAction } from '@/system/shell.js'`; you must clean up with `topLeftAction.value = null` in `onUnmounted`.

## Backend Contract: `server/apps/<id>/`

```
index.js            thin entry: exports only { name, match, handleApi, initDb }
api/index.js        HTTP layer: method/path dispatch, validation, uses shared/http.js
service/index.js    business layer: domain rules + all AI tasks (createTask/waitTask/prompts live only here)
repository/index.js data layer: DB setup (createAppDb from shared/db.js), migrations, all SQL
```

- Dependencies point downward only: index → api → service → repository. repository must not import service/api.
- Shared pieces: `createAppDb("<id>.db")` from `shared/db.js`; `readBody / sendJson / parseJson / badRequest` from `shared/http.js`.
- Register: add `() => import("./<id>/index.js")` to `appLoaders` in `server/apps/registry.js`.
- One SQLite per app: `database/apps/<id>.db`, DDL in the app's own repository; **never touch system.db or another app's database**.
- Endpoints mount under `/apps/<id>/*`; GET for reads, POST/PATCH/DELETE + JSON body for writes; return `false` for unmatched routes; protocol errors return an explicit `400`; do not disguise model/internal errors as user errors.

## Docs Contract: `language/<locale>/apps/<id>/APP.md`

Every app must have an APP.md (baked and mirrored to the root `apps/<id>/APP.md`; the runtime AI relies on it to understand the app). Frontmatter has name/title/description/backend/database; the body lists every endpoint and behavior. zh and en must be isomorphic and in sync. **Any API change must update APP.md.**

## AI Integration

Always go through the system task service: in the **service layer**, `createTask({ taskName, detail })` + poll `getTask(taskId)` until done (copy the waitTask pattern from an existing app); prompts must require JSON-only output. Two proven patterns, pick by scenario:

1. **Propose-adopt** (content creation, e.g. notepad): show the AI output first; write only after the user clicks "Adopt".
2. **Validate-then-direct-write** (structured entry, e.g. ledger smart recording, todo inline decomposition): AI outputs JSON → service strictly validates (types/numbers/dates, skip invalid items) → write to the database directly → immediate UI feedback.

`createTask` / prompts may only appear in the service layer; the api layer and frontend never touch them.

## Design Language (v6)

Gray-white-blue, restrained, generous whitespace. All colors go through tokens in `ui/src/style.css` (`--color-bg / --color-bg-elev / --color-ink / --color-accent / --color-blue-bg / good / bad / --shadow`); no hardcoded color values. Global utilities: `.dot-grid` dotted background, `.soft-card` large-radius white card, `.halo-focus`, `.chip-card`, `.save-btn`, `.text-input`. Standard page = full-bleed dot-grid background + 860px centered `.page` + title row (h2 17px/700 + right-side actions) + white card lists/forms (10-16px radius + 1px hairline border + `--shadow`).

Forbidden: gradients, textures, embossed/inset shadows, serif, emoji as icons. **Icons are lucide-vue-next only.** On mobile, overlay panels use a floating layer + scrim (see the chat history sidebar's `@media (max-width: 768px)`). Apps may have a signature layer (like notepad's macaron palette) but it must sit on the token skeleton and stay light and fresh.

## Full Checklist for Creating a New App

1. **Read the sample**: read through `server/apps/notepad/` and `ui/src/apps/notepad/` to confirm the layering and idioms.
2. **Build the backend**: `server/apps/<id>/{index.js,api/index.js,service/index.js,repository/index.js}`. repository creates tables via `createAppDb("<id>.db")`; api dispatches via shared/http.js; index.js exports only `{ name, match, handleApi, initDb }`.
3. **Register the backend**: add one line to `appLoaders` in `server/apps/registry.js`.
4. **Build the frontend**: `ui/src/apps/<id>/{index.vue,views/,components/,lib/api.js,lib/format.js}` with the standard page skeleton and v6 tokens.
5. **Register the frontend**: add one line to `ui/src/apps.js`, icon as a lucide component reference.
6. **Wire AI (if needed)**: createTask in the service layer; pick propose-adopt or validate-then-direct-write by scenario.
7. **Write APP.md**: `language/zh/apps/<id>/APP.md` and `language/en/apps/<id>/APP.md` — frontmatter + every endpoint + behavior, isomorphic across both languages.
8. **Verify**: `npm run check` passes; after `npm start`, curl `/apps/health` to confirm registration; walk through CRUD and AI flows in the UI; confirm `apps/<id>/APP.md` was baked and mirrored.

## System Apps

`chat`, `tasks`, and `settings` are system-capability apps (settings uses the system `/api/settings`, with no dedicated backend directory). Read their current layers before changing them, and keep naming and event semantics consistent.
