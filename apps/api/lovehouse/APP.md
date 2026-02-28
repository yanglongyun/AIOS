---
name: lovehouse
description: 恋爱屋 - 沉浸式恋人聊天应用。上半区房间窗口（AI 场景），下半区粉笔黑板留言。数据在 apps_lovehouse_messages 和 apps_lovehouse_settings。
---

# 恋爱屋

沉浸式恋人聊天体验。房间窗口 + 粉笔黑板留言。

## API
- `GET /api/apps/lovehouse/messages?limit=50` - 获取聊天记录
- `POST /api/apps/lovehouse/chat` - 发消息，AI 回复
- `POST /api/apps/lovehouse/scene` - 切换场景

## 数据表
- `apps_lovehouse_messages` - 聊天消息
- `apps_lovehouse_settings` - 设置（当前场景等）
