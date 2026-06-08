---
name: notepad
title: Notepad
description: Lightweight notes.
backend: server/apps/notepad
database: database/apps/notepad.db (notes)
---

# Notepad

Use this app to save text notes.

API:
- GET /apps/notepad/notes -> { ok, notes }
- POST /apps/notepad/notes { title, content }
- PATCH /apps/notepad/notes?id=... { title?, content? }
- DELETE /apps/notepad/notes?id=...
