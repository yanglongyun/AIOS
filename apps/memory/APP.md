---
name: memory
description: 记忆应用，用于管理写给 AI 的长期上下文。记忆会按可见性注入主 AI 的 system prompt。
backend: server/main/api/memory
frontend: gui/src/apps/memory
database: database/aios.db (memories)
---

# 记忆

记忆是用户写给 AI 的长期上下文。它不是普通笔记；它会按可见性策略进入主 AI 的 system prompt。

## 位置

- 前端：`gui/src/apps/memory`
- 后端：`server/main/api/memory/`
- 数据库：`database/aios.db` 的 `memories` 表

## API

- `GET /api/memory/list`：列出所有记忆
- `GET /api/memory/get?id=<id>`：读取单条记忆
- `POST /api/memory/create`：创建记忆
- `POST /api/memory/update`：更新记忆
- `POST /api/memory/delete`：删除记忆

## 字段

```json
{
  "title": "偏好",
  "description": "用于快速识别这条记忆",
  "content": "希望 AI 长期记住的具体内容",
  "visibility": "full",
  "starred": false
}
```

`visibility` 有三档：

- `full`：标题、简介、正文全部注入。
- `summary`：只注入标题和简介。
- `count`：只让 AI 知道有这条记忆存在。

`starred` 只用于前端星标筛选，不改变 prompt 注入规则。
