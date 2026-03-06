---
name: notebook
description: 随心记 - 轻量笔记应用，支持创建、编辑、置顶、搜索、AI 优化。数据在 apps_notes。
---

# 随心记

轻量笔记应用，支持 AI 优化文字、置顶、搜索、分页。

## API
- `GET /apps/notebook/list?q=&page=&pageSize=` - 笔记列表（搜索+分页）
- `POST /apps/notebook/create` - 创建笔记（参数：content, syncToAi）
- `POST /apps/notebook/update` - 更新笔记（参数：id, content）
- `POST /apps/notebook/delete` - 删除笔记（参数：id）
- `POST /apps/notebook/pin` - 置顶/取消置顶（参数：id, pinned）

## 数据表
- `apps_notes` - 笔记（content, pinned, created_at, updated_at）
