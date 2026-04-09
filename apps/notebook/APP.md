---
name: notebook
description: 随心记 - 轻量笔记应用，支持创建、编辑、置顶、搜索、AI 同步。
backend: apps/notebook
frontend: ui/src/apps/notebook
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
- `POST /apps/notebook/optimize`：调用 AI 优化笔记（`content`, `prompt`, `taskTitle`）

## Service
- `listNotebook({ q, page, pageSize })`
- `createNotebook(body)`：创建笔记
- `updateNotebook(body)`
- `deleteNotebook(body)`
- `optimizeNotebook({ content, prompt, taskTitle, req })`

## Repository
- `listNotes({ keyword, page, pageSize })`
- `createNote({ content })`
- `updateNoteContent({ id, content })`
- `deleteNoteById(id)`
- `initNotebookDatabase()`

## 数据表
- `notes`
  - `id`
  - `content`
  - `created_at`
  - `updated_at`

## 权限边界
- 应用写操作要求登录态（由 apps 门禁控制）。
- API 层不直接操作 SQL，核心逻辑统一在 service/repository。
- AI 优化能力通过任务/模型链路完成，不在 notebook 应用内自行维护模型设置。
