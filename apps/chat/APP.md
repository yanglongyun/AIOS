---
name: chat
description: 对话系统 - 多会话并发、场景上下文、流式响应、工具调用、附件。
backend: server/（api/chat.js, service/chat/, repository/chat/, chat/, agent/, llm/, prompt/）
frontend: ui/src/apps/chat
database: database/aios.db（conversations, messages 表）
---

# 对话系统（chat）

## 代码分布（尚未完全拆分）
- `server/api/chat.js`：HTTP 路由入口
- `server/service/chat/`：业务逻辑（list, messages, rename, delete）
- `server/repository/chat/`：数据库读写
- `server/chat/`：WebSocket 运行时（消息调度、会话管理）
- `server/agent/`：AI Agent 执行器（工具调用、函数执行）
- `server/llm/`：大模型调用（stream, regular）
- `server/prompt/`：提示词组装

## API
- `POST /api/chat/create`：创建会话（`title`, `scene`）
- `GET /api/chat/list?scene=`：会话列表
- `GET /api/chat/messages?conversationId=&offset=&limit=`：消息分页
- `POST /api/chat/rename`：重命名（`conversationId`, `title`）
- `POST /api/chat/delete`：删除会话（`conversationId`）

## WebSocket 消息
- `message`：发送消息 → `delta`/`tool_call`/`tool_result`/`done`/`error`
- `abort`：中止当前对话

## 数据表
- `conversations`：id, conversation_id, title, scene, created_at, updated_at
- `messages`：id, conversation_id, role, content, tool_calls, _meta, created_at
