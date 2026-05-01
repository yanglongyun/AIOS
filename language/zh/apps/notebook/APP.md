# notebook

本地记事本应用，用于记录轻量文本笔记。

## 数据模型

`database/apps/notebook.db` 中的 `notes` 表:

```
id          INTEGER  自增主键
title       TEXT     标题
content     TEXT     正文
pinned      0 / 1    是否置顶
created_at  TEXT     创建时间
updated_at  TEXT     更新时间
```

## API

| 方法 | 路径 | 入参 |
|------|------|------|
| GET | `/apps/notebook/list` | - |
| POST | `/apps/notebook/create` | `{ title, content? }` |
| POST | `/apps/notebook/update` | `{ id, title?, content?, pinned? }` |
| POST | `/apps/notebook/delete` | `{ id }` |
