---
name: createapp
description: App builder that creates and edits apps through conversation.
backend: server/apps/createapp
frontend: gui/src/apps/createapp
database: database/apps/createapp.db
---

# createapp

- Role: developer-facing app generation and modification tool.
- Frontend: `gui/src/apps/createapp`
- Backend: `server/apps/createapp`
- Data: `database/apps/createapp.db`
- Entry points: `/apps/createapp/*`
- Rules:
  - use `/api/system/reload/request` after code changes
  - use `/api/system/reload/test` for preflight only
