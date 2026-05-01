# todo

AIOS 的「智能待办」—— 一条 todo 既可以让你手动勾掉,也可以一键交给 agent 去跑、或让 AI 拆成更小的子任务。

## 数据模型

`database/apps/todo.db` 里的 `todos` 表:

```
id          INTEGER  自增主键
parent_id   INTEGER  父待办 id(子任务用,空表示顶层)
title       TEXT     标题(必填,<=500 字符)
note        TEXT     备注/描述(给 AI 的额外上下文,默认空)
done        0 / 1    是否完成
pinned      0 / 1    是否置顶
task_id     INTEGER  最近一次/正在跑的 agent 任务 id(指向 aios.db.tasks)
task_status TEXT     缓存的任务状态 ''/pending/running/done/aborted/error
created_at  TEXT
updated_at  TEXT
```

子任务只有一层(parent 不能再嵌套孙子)。

## API

| 方法 | 路径                              | 入参                                       | 说明 |
|------|-----------------------------------|--------------------------------------------|------|
| GET  | `/apps/todo/list`                 | —                                          | 返回扁平数组,父在前、子紧跟 |
| POST | `/apps/todo/create`               | `{ title, parentId?, note? }`              | 新建,可指定 parentId 创建子任务 |
| POST | `/apps/todo/update`               | `{ id, title?, done?, pinned?, note? }`    | 更新用户字段 |
| POST | `/apps/todo/delete`               | `{ id }`                                   | 删除(连带子任务一起删) |
| POST | `/apps/todo/run`                  | `{ id }`                                   | 异步起一个 agent 任务,立刻返回,不阻塞 |
| POST | `/apps/todo/decompose`            | `{ id }`                                   | 用 instant 任务把它拆成 3-7 条子任务并写入 |
| POST | `/apps/todo/update-task-status`   | `{ id, taskStatus }`                       | 前端轮询到终态后回写缓存 |

## 与 agent task 的整合

- `run` 通过 `app_shared/agentTask.js#agentTaskStart` 调用 main 的 `/api/task/create/agent` 并把 `wait=false`,创建任务行后立刻返回 `taskId`,agent 在后台继续跑
- `decompose` 通过 `app_shared/instantTask.js#instantTaskJson` 走 `/api/task/create/instant`,带 schema 拿结构化 JSON,直接落库为子任务
- 前端按 ~3s 节奏轮询 `task_id` 非终态的待办,从 `/api/task/detail` 同步实时状态到 UI;终态写回 `task_status` 缓存
- 任何 todo 任务都会出现在 `tasks` 应用里,通过 `meta.todoId` 反查到出处

## 行为约定

- agent 完成后**不**自动把 todo 标记为 done,需要用户在抽屉里看完日志后手动确认
- 一条 todo 同时只允许一个进行中的 agent 任务
- 删除父待办会一起删除其子任务
- 子任务不支持再被「拆分」(防止层级膨胀)

## 在 AIOS 里的位置

- 前端:`gui/src/apps/todo/index.vue`,挂在 rail 的 `apps` 组
- 后端:`server/apps/todo/`(apps 进程,端口 9502)
- 注册:`server/apps/registry.js` + `gui/src/apps.js` + `gui/src/stores/view.js`
