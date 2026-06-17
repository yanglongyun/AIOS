---
name: notepad
title: 记事本
description: 轻量笔记。支持智能润色、精简、扩写,结果由用户采纳后才写入笔记。
backend: server/apps/notepad
database: data/apps/notepad.db (notes)
---

# 记事本

用于保存文本笔记。

智能润色只处理当前草稿并返回结果,不会直接保存。用户点击采纳后,前端再把结果写入编辑框。

接口:
- GET /apps/notepad/notes -> { ok, notes }
- POST /apps/notepad/notes { title, content }
- PATCH /apps/notepad/notes?id=... { title?, content? }
- DELETE /apps/notepad/notes?id=...
- POST /apps/notepad/polish { content, mode } -> { ok, result }

智能模式:
- polish: 润色
- condense: 精简
- expand: 扩写
