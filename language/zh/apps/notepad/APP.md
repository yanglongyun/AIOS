---
name: notepad
title: 记事本
description: 轻量笔记。适合保存文本和接收智能润色结果。
backend: server/apps/notepad
database: database/apps/notepad.db (notes)
---

# 记事本

用于保存文本笔记。

接口:
- GET /apps/notepad/notes -> { ok, notes }
- POST /apps/notepad/notes { title, content }
- PATCH /apps/notepad/notes?id=... { title?, content? }
- DELETE /apps/notepad/notes?id=...
