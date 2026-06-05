---
name: notepad
description: 记事本应用，创建 / 编辑 / 删除纯文本笔记，按更新时间倒序排列。
backend: server/apps/notepad
frontend: ui/src/apps/notepad
database: database/apps/notepad.db
---

# notepad 记事本

- 定位：最简单的纯文本笔记应用，跑在应用服务(:9503)上，数据完全隔离。
- 前端：`ui/src/apps/notepad/index.tsx`(React)
- 后端：`server/apps/notepad/index.ts`
- 数据：独立库 `database/apps/notepad.db`,只一张表 `notes`

## 数据模型

`notes` 表:

```
id          INTEGER  自增主键
title       TEXT     标题
content     TEXT     正文
created_at  DATETIME 创建时间
updated_at  DATETIME 最后更新时间
```

## API(全部走 /apps/notepad/notes)

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/apps/notepad/notes` | 列出所有笔记(更新时间倒序) |
| POST | `/apps/notepad/notes` | 新建,body `{title, content}` |
| PATCH | `/apps/notepad/notes?id=N` | 更新,body `{title?, content?}` |
| DELETE | `/apps/notepad/notes?id=N` | 删除 |
