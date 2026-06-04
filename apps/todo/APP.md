---
name: todo
description: 待办应用，添加 / 勾选完成 / 删除待办项，未完成项排在前面。
backend: server/apps/todo
frontend: gui/src/apps/todo
database: database/apps/todo.db
---

# todo 待办

- 定位：极简待办清单,跑在应用服务(:9503)上,数据完全隔离。
- 前端：`gui/src/apps/todo/index.tsx`(React)
- 后端：`server/apps/todo/index.ts`
- 数据：独立库 `database/apps/todo.db`,只一张表 `todos`

## 数据模型

`todos` 表:

```
id          INTEGER  自增主键
text        TEXT     待办内容
done        INTEGER  0/1 是否完成
created_at  DATETIME 创建时间
```

## API(全部走 /apps/todo/todos)

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/apps/todo/todos` | 列出(未完成在前) |
| POST | `/apps/todo/todos` | 新建,body `{text}` |
| PATCH | `/apps/todo/todos?id=N` | 更新,body `{text?, done?}` |
| DELETE | `/apps/todo/todos?id=N` | 删除 |
