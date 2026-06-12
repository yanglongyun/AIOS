---
name: todo
title: 待办
description: 待办列表。今天/稍后分区、高优先级、截止日期、内嵌子任务;自然语言添加与 AI 行内分解子任务(分解结果直接写回)。
backend: server/apps/todo
database: database/apps/todo.db (todos)
---

# 待办

用于管理待办项。子任务以 JSON 内嵌在 todos.subtasks 字段里,不单独建表。

添加待办走自然语言:前端把输入先发 /parse 解析(失败时本地兜底解析),拿到 { text, due, priority, section } 后再 POST 创建。

行内分解:无子任务且未完成的任务行上有分解按钮,点击调 /decompose,返回的子任务直接 PATCH 写回该待办的 subtasks(直写模式,无确认步骤);全部子任务勾完会把整条待办置为完成。

接口:
- GET /apps/todo/todos -> { ok, todos }
- POST /apps/todo/todos { text, section?, priority?, subtasks?, due? } -> { ok, todo }
- PATCH /apps/todo/todos?id=... { text?, done?, section?, priority?, subtasks?, due? } -> { ok, todo }
- DELETE /apps/todo/todos?id=... -> { ok }
- POST /apps/todo/parse { text } -> { ok, taskId, result: { text, due, priority, section } }(自然语言解析,理解今天/明天/周X/X月X日/重要等)
- POST /apps/todo/decompose { text } -> { ok, taskId, subtasks: [{ id, text, done }] }(拆成 3-6 个子任务,id 为 UUID)
- POST /apps/todo/plan -> { ok, taskId, picks: [{ id, reason }], note }(从「稍后」未完成项里挑最多 3 件建议移到今天。保留接口,当前 UI 无入口)

字段:
- section: today 或 later
- priority: high 或空字符串
- due: YYYY-MM-DD 或空字符串
- done / doneAt: 完成态与完成时间(ISO 字符串)
- subtasks: [{ id, text, done }],id、text 必填
