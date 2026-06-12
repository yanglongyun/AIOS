---
name: notepad
title: Notepad
description: Macaron sticky-note style notes. Folders, tags, pinning, card colors, and a built-in AI assistant (polish/condense/expand/title/format/free ask) whose output is written only after the user adopts it.
backend: server/apps/notepad
database: database/apps/notepad.db (notes, folders)
---

# Notepad

Use this app to save text notes. The list is a wall of macaron-colored sticky cards; the editor auto-saves (debounced ~450ms).

The AI assistant only processes content and returns a result; it never writes to the database directly (propose-adopt pattern). In ask mode, the output is appended to the end of the note by the frontend after the user clicks "Adopt", then saved via PATCH.

API:
- GET /apps/notepad/notes -> { ok, notes, folders }
- POST /apps/notepad/notes { title?, content?, folder?, tags?, pinned?, emoji?, color? } -> { ok, note }
- PATCH /apps/notepad/notes?id=... { title?, content?, folder?, tags?, pinned?, emoji?, color? } -> { ok, note }
- DELETE /apps/notepad/notes?id=... -> { ok }
- POST /apps/notepad/folders { name } -> { ok, folder, folders }
- POST /apps/notepad/polish { content, mode, prompt? } -> { ok, taskId, result: { mode, label, content } }

notes fields:
- title / content: text
- folder: folder name (string, empty by default; seed folders: Work, Life, Ideas)
- tags: array of strings (stored as JSON; also accepts strings like "#a b,c", split on #/comma/whitespace and deduplicated)
- pinned: boolean, pinned notes sort first
- emoji: card corner emoji (randomly assigned by the frontend on creation)
- color: card background color. 8-color macaron palette (PALETTE in ui/src/apps/notepad/lib/format.js: #fdf6e3 / #fbeef1 / #e8f5ec / #e8f1fa / #f1edfa / #fdf0e7 / #e6f4f3 / #ffffff). New notes get a random color; the editor has swatches to switch. Both create and PATCH accept color.

polish modes:
- polish / condense / expand / title (within 14 chars) / format (clean Markdown): send { content, mode }, returns the processed content. content is required (expand allows empty and produces an opening).
- ask (free prompt): send { mode: "ask", prompt, content }. prompt is required; content is the full current note, used only as context, may be empty. The AI produces a passage that can be appended directly to the end of the note; the frontend appends it after the user adopts it.

Note: the current editor UI only exposes the ask-mode input bar; the other modes are backend capabilities with no UI entry.
