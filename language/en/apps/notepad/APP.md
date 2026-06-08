---
name: notepad
title: Notepad
description: Lightweight notes with AI polish, condense, and expand. Results are accepted by the user before writing.
backend: server/apps/notepad
database: database/apps/notepad.db (notes)
---

# Notepad

Use this app to save text notes.

AI polishing only processes the current draft and returns a result. It does not save directly; the user accepts the result before the frontend writes it into the editor.

API:
- GET /apps/notepad/notes -> { ok, notes }
- POST /apps/notepad/notes { title, content }
- PATCH /apps/notepad/notes?id=... { title?, content? }
- DELETE /apps/notepad/notes?id=...
- POST /apps/notepad/polish { content, mode } -> { ok, result }

Modes:
- polish
- condense
- expand
