---
name: settings
description: System settings app for model, tools, context, account, and language.
backend: server/main/api/settings.js, server/main/service/settings, server/main/repository/settings
frontend: gui/src/apps/settings
database: database/aios.db (settings)
---

# settings

- Role: system-level settings app. It does not run under `server/apps/`; it is part of the main server.
- Frontend: `gui/src/apps/settings`
- Backend: `server/main/api/settings.js`, `server/main/service/settings/`, `server/main/repository/settings/`
- Data: `settings` in `database/aios.db`
- Entry points:
  - `GET /api/settings`
  - `GET /api/settings/skills`
  - `POST /api/settings`
