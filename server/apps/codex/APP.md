---
name: codex
description: Codex 应用 - 把本地 codex CLI 包成 AIOS 对话式 app。
backend: server/apps/codex
frontend: gui/src/apps/codex
database: database/apps/codex.db
---

# Codex（codex）

把本地安装的 `codex` CLI 包成 AIOS 应用，每个会话绑定工作目录，并通过原生聊天 UI 展示 Codex JSON 事件。

## API
- `GET /apps/codex/status` - 检测 CLI 安装与版本
- `GET /apps/codex/conversations` - 会话列表
- `POST /apps/codex/conversations/create` - 新建会话
- `POST /apps/codex/conversations/delete` - 删除会话
- `GET /apps/codex/messages?conversationId=` - 消息历史
- `POST /apps/codex/send` - 发送消息，返回 `application/x-ndjson` 流
- `GET /apps/codex/history` - 读取 Codex 历史
- `GET /apps/codex/account` - 读取 Codex 账号信息
- `GET /apps/codex/settings` - 读取 Codex 设置
- `GET /apps/codex/mcp` - 读取 MCP 配置
- `GET /apps/codex/skills` - 读取 skills
- `GET /apps/codex/memory` - 读取 Codex memory
- `GET /apps/codex/projects` - 读取项目列表
- `GET /apps/codex/projects/dir` - 浏览项目目录
- `GET /apps/codex/projects/file` - 读取项目文件
- `POST /apps/codex/memory/save` - 保存 memory 文件
- `POST /apps/codex/settings/save` - 保存设置文件

## 流式协议
每行 JSON：`{ "type": "event", "payload": <translated-codex-event> }` / `{ "type": "done" }` / `{ "type": "error", "message": "..." }`

## 数据表
- `codex_conversations(id, session_id, cwd, permission_mode, title, message_count, created_at, updated_at)`
- `codex_events(id, conversation_id, event_type, payload_json, created_at)`

## 子进程调用
`codex exec --json --skip-git-repo-check`，根据会话权限模式追加 sandbox 和 approval 参数，prompt 从 stdin 喂入，cwd 指向当前选择的工作目录。

## 权限模式
- `workspaceWrite`
- `readOnly`
- `fullAuto`
- `neverAsk`
- `dangerFullAccess`
- `bypassPermissions`
