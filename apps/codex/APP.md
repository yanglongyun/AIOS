---
name: codex
description: Codex 运行器，用于连接本机 Codex app-server 并管理 Codex 会话。
frontend: gui/src/apps/codex
backend: server/apps/codex
database: none
---

# Codex 运行器

Codex 运行器是 AIOS 对本机 Codex app-server 的管理界面。它不保存业务数据，主要负责线程会话、运行指令和只读查看 Codex 运行环境。

## 边界

- Bridge 位于 `server/apps/codex/bridge/`，只负责连接 Codex app-server。
- API 位于 `server/apps/codex/api/`，路径为 `/apps/codex/*`。
- 前端位于 `gui/src/apps/codex/`，负责会话列表、聊天界面和只读信息面板。
- 不把 Codex bridge 放入 `server/main` 或 shared，也不让其他应用直接 import bridge 内部模块。

## 功能

1. 查看 Codex bridge 连接状态。
2. 启动本机 `codex app-server`。
3. 列出 Codex 线程。
4. 创建新线程并发送指令。
5. 运行 turn 并显示最终回复。
6. 查看账号、模型、配置、技能、MCP、插件和 hooks。
