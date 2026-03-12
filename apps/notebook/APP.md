---
name: notebook
description: 随心记 - 轻量笔记应用，支持创建、编辑、置顶、搜索、AI 同步。
backend: apps/notebook
database: database/apps/notebook.db
---

# 随心记（notebook）

## 目录结构
- `api/`：HTTP handler
- `service/`：业务逻辑
- `repository/`：数据库读写
- `APP.md`：应用说明

## API
- `GET /apps/notebook/list?q=&page=&pageSize=`：列表（搜索+分页）
- `POST /apps/notebook/create`：创建（`content`, `syncToAi`）
- `POST /apps/notebook/update`：更新（`id`, `content`）
- `POST /apps/notebook/delete`：删除（`id`）
- `POST /apps/notebook/pin`：置顶（`id`, `pinned`）

## Service
- `listNotebook({ q, page, pageSize })`
- `createNotebook(body, req)`：创建并可选同步通知给 AI
- `updateNotebook(body)`
- `deleteNotebook(body)`
- `pinNotebook(body)`

## Repository
- `listNotes({ keyword, page, pageSize })`
- `createNote({ content })`
- `updateNoteContent({ id, content })`
- `deleteNoteById(id)`
- `setNotePinned({ id, pinned })`
- `initNotebookDatabase()`

## 数据表
- `notes`
  - `id`
  - `content`
  - `pinned`
  - `created_at`
  - `updated_at`

## 权限边界
- 应用写操作要求登录态（由 apps 门禁控制）。
- API 层不直接操作 SQL，核心逻辑统一在 service/repository。
