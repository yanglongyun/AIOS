---
name: notepad
title: 记事本
description: 马卡龙贴纸风笔记。支持文件夹、标签、置顶、卡片配色,内置 AI 助手(润色/精简/扩写/起标题/排版/自由提问),结果由用户采纳后才写入。
backend: server/apps/notepad
database: database/apps/notepad.db (notes, folders)
---

# 记事本

用于保存文本笔记。列表是马卡龙色贴纸卡片墙,编辑器自动保存(防抖约 450ms)。

AI 助手只处理内容并返回结果,不直接写库(提案-采纳模式)。ask 模式的产出在用户点「采用」后由前端追加到笔记末尾,再走 PATCH 保存。

接口:
- GET /apps/notepad/notes -> { ok, notes, folders }
- POST /apps/notepad/notes { title?, content?, folder?, tags?, pinned?, emoji?, color? } -> { ok, note }
- PATCH /apps/notepad/notes?id=... { title?, content?, folder?, tags?, pinned?, emoji?, color? } -> { ok, note }
- DELETE /apps/notepad/notes?id=... -> { ok }
- POST /apps/notepad/folders { name } -> { ok, folder, folders }
- POST /apps/notepad/polish { content, mode, prompt? } -> { ok, taskId, result: { mode, label, content } }

notes 字段:
- title / content: 文本
- folder: 文件夹名(字符串,默认空;初始种子文件夹:工作、生活、灵感)
- tags: 字符串数组(库内存 JSON;也接受 "#a b,c" 这类字符串,自动按 #/逗号/空白拆分并去重)
- pinned: 布尔,置顶(列表置顶优先排序)
- emoji: 卡片角标 emoji(前端新建时随机)
- color: 卡片底色。8 色马卡龙色板(ui/src/apps/notepad/lib/format.js 的 PALETTE:#fdf6e3 / #fbeef1 / #e8f5ec / #e8f1fa / #f1edfa / #fdf0e7 / #e6f4f3 / #ffffff)。新建笔记随机取一色,编辑器内有色板可切换;创建和 PATCH 均可带 color。

polish 的 mode:
- polish 润色 / condense 精简 / expand 扩写 / title 起标题(14 字内) / format 整理成 Markdown:传 { content, mode },返回处理后内容。content 必填(expand 允许为空,会给出开头)。
- ask 自由提问:传 { mode: "ask", prompt, content }。prompt 必填;content 是当前笔记全文,仅作上下文,可为空。AI 产出一段可直接追加到笔记末尾的内容,前端「采用」后追加写入。

说明:当前编辑器 UI 只暴露 ask 模式输入条;其余模式是后端可用能力,无 UI 入口。
