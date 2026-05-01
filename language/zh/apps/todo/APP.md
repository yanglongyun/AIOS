# todo

iimos 第一个用户级应用 —— 一个最简单的待办清单。

## 数据模型

`database/apps/todo.db` 里一张 `todos` 表:

```
id          INTEGER  自增主键
title       TEXT     标题(必填,<=500 字符)
done        0 / 1    是否完成
pinned      0 / 1    是否置顶
created_at  TEXT     创建时间
updated_at  TEXT     更新时间
```

## API(挂在 apps 进程,经由 main 反向代理对外)

| 方法 | 路径                    | 入参              | 返回 |
|------|-------------------------|-------------------|------|
| GET  | `/apps/todo/list`       | —                 | `{ items: Todo[] }` |
| POST | `/apps/todo/create`     | `{ title }`       | `{ item: Todo }` |
| POST | `/apps/todo/update`     | `{ id, title?, done?, pinned? }` | `{ item: Todo }` |
| POST | `/apps/todo/delete`     | `{ id }`          | `{ deleted: number }` |

排序规则:`pinned DESC, done ASC, id DESC` —— 置顶在前,未完成在前,新的在前。

## 在 iimos 里的位置

- 后端:`server/apps/todo/`(在 apps 进程,端口 9502)
- 前端:`gui/src/apps/todo/index.vue`,挂在 rail 的 nav 第 N 项
- 注册:`server/apps/registry.js` + `gui/src/apps.js` + `gui/src/stores/view.js` 三处

## 后续可扩展

这一版只做最小 CRUD。需要时再加:截止时间、标签、子任务、提醒、按日期分组、与 tasks 联动(让 AI 后台帮某条 todo 跑一段)。
