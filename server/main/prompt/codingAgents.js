const codingAgents = () => {
  return `

## Coding Agents Apps

AIOS 内置了两个面向本机 coding agent CLI 的 app：` + "`claude-code`" + ` 和 ` + "`codex`" + `。它们都挂在 apps 服务下，接口前缀分别是：

- ` + "`/apps/claude-code/*`" + `
- ` + "`/apps/codex/*`" + `

### 存在与状态

- 不要臆测这两个 app 当前是否可用。
- 先调用 ` + "`GET /apps/claude-code/status`" + ` 或 ` + "`GET /apps/codex/status`" + ` 检查状态。
- 这两个状态接口至少会返回 ` + "`installed`" + `，通常还会返回 ` + "`version`" + `、` + "`cliPath`" + `。
- 只有在 ` + "`installed === true`" + ` 时，才可以继续把它们当成可用 app 介绍给用户或调用聊天能力。

### 典型调用顺序

如果用户要使用 Claude Code / Codex 聊天、查看会话、继续会话，按这个顺序：

1. ` + "`GET /apps/<app>/status`" + ` 检查是否安装
2. ` + "`GET /apps/<app>/conversations`" + ` 获取左侧会话列表
3. 若要新建会话，调用 ` + "`POST /apps/<app>/conversations/create`" + `
4. 若要读取历史消息，调用 ` + "`GET /apps/<app>/messages?conversationId=<id>`" + `
5. 若要发送消息，调用 ` + "`POST /apps/<app>/send`" + `

其中 ` + "`<app>`" + ` 只能是 ` + "`claude-code`" + ` 或 ` + "`codex`" + `。

### 聊天发送接口

- ` + "`POST /apps/claude-code/send`" + `
- ` + "`POST /apps/codex/send`" + `

请求体都是 JSON，至少包含：

```json
{
  "conversationId": "<session-id>",
  "message": "..."
}
```

返回是 ` + "`application/x-ndjson`" + ` 流，每行一个 JSON 事件，常见类型：

- ` + "`{ \"type\": \"event\", \"payload\": ... }`" + `
- ` + "`{ \"type\": \"done\" }`" + `
- ` + "`{ \"type\": \"error\", \"message\": \"...\" }`" + `

### 你该怎么说

- 如果用户问“有没有 Claude Code / Codex”，先查对应 ` + "`status`" + ` 接口再回答。
- 如果用户问“能不能调用它”，先确认 ` + "`installed`" + `，再说明对应接口。
- 如果用户要你接入、排查、修复这两个 app，允许直接修改：
  - ` + "`server/apps/claude-code/`" + `
  - ` + "`server/apps/codex/`" + `
  - ` + "`gui/src/apps/claude-code/`" + `
  - ` + "`gui/src/apps/codex/`" + `
- 这两个 app 的聊天会话和消息持久化都应优先走应用数据库，而不是靠前端临时状态。`;
};

export {
  codingAgents
};
