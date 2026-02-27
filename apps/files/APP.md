---
name: files
description: Local file manager app for browsing and previewing files on the host machine; no database, pure filesystem access via Node.js fs module.
---

# Files App

Summary: Local file manager for browsing directories and previewing text files on the host machine.

## API
- `GET /api/apps/files/list?path=/some/dir` — list directory contents
- `GET /api/apps/files/read?path=/some/file.txt` — read text file content
- `GET /api/apps/files/info?path=/some/file` — get file stat info

## Files
- `apps/files/index.js`: app entry + API router
- `apps/files/api/list.js`: listFiles, readFile, getFileInfo handlers
