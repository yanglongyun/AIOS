---
name: chat
description: Chat app with multi-session conversation, streaming replies, tool calls, and attachments.
backend: server/main/api/chat.js, server/main/chat, server/agent, server/llm, server/prompt
frontend: gui/src/apps/chat
database: database/aios.db (chats, messages)
---

# chat

- Role: core system chat app. It does not run under `server/apps/`; it is part of the main server.
- Frontend: `gui/src/apps/chat`
- Backend: `server/main/api/chat.js`, `server/main/chat/`, `server/agent/`, `server/llm/`, `server/prompt/`
- Data: `chats` and `messages` in `database/aios.db`
- Entry points:
  - HTTP: `/api/chat/*`
  - WebSocket: streaming chat session
  - Protocol: `gui/src/apps/chat/protocol.js`
- Attachments: `/api/files/upload`, stored under `files/uploads/chat`
