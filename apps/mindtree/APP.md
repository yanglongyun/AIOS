---
name: mindtree
description: 心树 - 大纲编辑器，支持 AI 对话辅助展开节点。数据在 apps_mindtree_docs 和 apps_mindtree_messages。
---

# 心树

大纲编辑器，支持拖拽排序、AI 对话辅助展开内容。

## API
- `GET /api/apps/mindtree/get?id=xxx` - 获取大纲文档
- `POST /api/apps/mindtree/sync` - 同步大纲数据（参数：id, title, data）
- `POST /api/apps/mindtree/chat` - AI 对话（参数：outline_id, content）

## 数据表
- `apps_mindtree_docs` - 大纲文档（id, title, data）
- `apps_mindtree_messages` - AI 对话记录（outline_id, role, content）
