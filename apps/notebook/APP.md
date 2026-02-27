---
name: notebook
description: User-facing notebook app with independent API and DB module under `apps/notebook`; data stored in `apps_notes`.
---

# Notebook App
Summary: User-facing notebook app with independent API and DB module under `apps/notebook`; data stored in `apps_notes`.

## API
- `GET /api/apps/notebook/list`
- `POST /api/apps/notebook/create`
- `POST /api/apps/notebook/update`
- `POST /api/apps/notebook/delete`

## Files
- `apps/notebook/index.js`: app entry + API router
- `apps/notebook/db.js`: db init + CRUD
- `apps/notebook/api/*.js`: endpoint handlers
