---
name: chat
description: 对话系统 - 多会话、流式回复、工具调用、附件上传，并支持前端协议入口。
backend: server/（api/chat.js, service/chat/, repository/chat/, chat/, agent/, llm/, prompt/）
frontend: ui/src/apps/chat
database: database/aios.db（chats, messages 表）
---

# 对话系统（chat）

## 当前结构
- `server/api/chat.js`：HTTP 路由入口，提供创建会话、列表、消息分页、重命名、删除。
- `server/service/chat/`：对话列表、消息分页、重命名、删除等业务层。
- `server/repository/chat/`：`chats` 与 `messages` 的数据库读写。
- `server/chat/`：WebSocket 对话运行时，负责消息流、工具调用事件和中止控制。
- `server/agent/`：Agent 执行器，负责任务编排与工具调用。
- `server/llm/`：模型调用层，处理流式与非流式输出。
- `server/prompt/`：提示词拼装。
- `ui/src/apps/chat/index.vue`：桌面版聊天界面。
- `ui/src/apps/chat/chatMobile.vue`：移动版聊天界面。
- `ui/src/apps/chat/History.vue`：会话历史侧栏。
- `ui/src/apps/chat/protocol.js`：聊天应用协议入口，统一处理“打开 chat 并附带意图”的调用。

## HTTP API
- `POST /api/chat/create`
  请求：`{ title, scene, meta }`
  返回：新建会话的 `conversationId`
- `GET /api/chat/list?scene=`
  返回：会话列表
- `GET /api/chat/messages?conversationId=&offset=&limit=`
  返回：分页消息
- `POST /api/chat/rename`
  请求：`{ conversationId, title }`
- `POST /api/chat/delete`
  请求：`{ conversationId }`

## WebSocket 消息
- `message`
  发送用户消息，随后收到 `delta`、`tool_call`、`tool_result`、`done`、`error`
- `abort`
  中止当前会话生成
- `delta`
  助手流式增量输出
- `tool_call`
  工具调用开始
- `tool_result`
  工具调用结果
- `done`
  当前轮完成
- `error`
  当前轮失败
- `aborted`
  当前轮被中止

## 前端协议入口
聊天应用已经支持独立协议文件：
- `ui/src/apps/chat/protocol.js`

当前支持的动作：
- `open`
  打开或聚焦 chat 窗口
- `open_new`
  打开 chat，并切到新对话
- `open_new_and_send`
  打开 chat，新建对话，并自动发送消息
- `load_conversation`
  打开 chat，并加载指定会话

系统层调用示例：

```js
await openProtocol({ app: 'chat', action: 'open' });

await openProtocol({ app: 'chat', action: 'open_new' });

await openProtocol({
  app: 'chat',
  action: 'open_new_and_send',
  data: { message: '帮我总结今天的更新' }
});

await openProtocol({
  app: 'chat',
  action: 'load_conversation',
  data: { conversationId: '123' }
});
```

## 前端行为要点
- 默认通过 `windowManager.open('chat', props)` 打开。
- 当收到 `protocolRequest` 时，`index.vue` 会按意图执行：
  新建对话、自动发送消息、或切换到指定 `conversationId`。
- 会话切换仍由路由 `/chat/:id` 驱动，协议层只是统一入口。

## 数据表
- `chats`
  - `id`
  - `conversation_id`
  - `title`
  - `description`
  - `scene`
  - `meta`
  - `created_at`
- `messages`
  - `id`
  - `conversation_id`
  - `message`
  - `meta`
  - `created_at`

## 当前边界
- chat 是系统核心应用，不走 `apps/` 子应用服务，而是直接挂在主 `server/` 上。
- 文件附件通过 `/api/files/upload` 上传到 `files/uploads/chat`。
- 会话历史、消息分页和 WebSocket 事件都依赖系统数据库 `database/aios.db`。
