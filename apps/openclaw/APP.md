---
name: openclaw
description: 🦞 OpenClaw 管理 — 管理本地 OpenClaw 实例的定时任务和对话
backend: apps/openclaw
database: 无（数据在 OpenClaw 侧）
---

# OpenClaw 管理（openclaw）

## 目录结构
- `api/`：HTTP handler
- `service/`：CLI 封装 + HTTP 转发
- `APP.md`：应用说明

## API
- `GET /apps/openclaw/status`：检测 OpenClaw 运行状态和版本
- `GET /apps/openclaw/cron/list`：定时任务列表
- `POST /apps/openclaw/cron/add`：创建定时任务（`name`, `schedule`, `prompt`）
- `POST /apps/openclaw/cron/run`：手动触发（`jobId`）
- `POST /apps/openclaw/cron/delete`：删除（`jobId`）
- `POST /apps/openclaw/chat`：转发对话到 OpenClaw Gateway

## 依赖
- 本机安装 OpenClaw CLI（`openclaw` 命令可用）
- OpenClaw Gateway 运行在 `localhost:18789`
