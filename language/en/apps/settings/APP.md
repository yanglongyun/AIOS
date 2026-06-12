---
id: settings
title: Settings
description: System settings app. Configure model/API URL/key/context turns, view the system prompt and skill list, switch theme.
---

# Settings

Frontend-only app (ui/src/apps/settings/), no dedicated backend directory or database; data goes through the system service's /api/settings.

Five tabs:
- Model: model, apiUrl, apiKey, contextTurns (number); saving takes effect immediately
- Prompt: read-only view of the full system prompt currently sent to the model (promptPreview)
- Skills: read-only list of available skills (name + description)
- Theme: light / dark / follow system (frontend-only theme store, no API call)
- About: project info and links

API (system layer):
- GET /api/settings -> { ok, settings: { model, apiUrl, apiKey, contextTurns }, promptPreview, skills }
- POST /api/settings { model, apiUrl, apiKey, contextTurns } -> { ok }
