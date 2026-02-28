---
name: notebook
description: User-facing notebook app; SQL is implemented in API handlers and routed by `apps/notebook/index.js`; data stored in `apps_notes`.
---

# Notebook App
Summary: User-facing notebook app; SQL is implemented in API handlers and routed by `apps/notebook/index.js`; data stored in `apps_notes`.

## API
- `GET /api/apps/notebook/list?q=&page=&pageSize=`
- `POST /api/apps/notebook/create`
- `POST /api/apps/notebook/update`
- `POST /api/apps/notebook/delete`
- `POST /api/apps/notebook/pin`

## Files
- `apps/notebook/index.js`: app entry + API router + schema init
- `apps/notebook/api/*.js`: endpoint handlers (SQL in handlers)
