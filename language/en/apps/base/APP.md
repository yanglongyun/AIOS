---
name: base
description: Base app for browsing the remote iimos app catalog, categories, versions, package status, and app metadata.
backend: none
frontend: gui/src/apps/base
database: none
---

# base

Base. A frontend-only app for inspecting the remote app catalog, categories, versions, package status, and app metadata.

## Location

- Frontend: `gui/src/apps/base`
- Backend: none
- Database: none

## Data Source

The frontend reads `https://iimos.ai/apps/catalog.json`.
