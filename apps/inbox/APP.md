---
name: inbox
description: 收件箱 - 接收外部留言的应用。支持公开提交页面和后台管理。数据在 inbox_messages。
---

# 收件箱

接收外部留言，支持公开提交页和后台管理。

## API
- `GET /apps/inbox/list?read=all|0|1` - 获取留言列表
- `POST /apps/inbox/submit` - 提交留言（参数：name, email, content）
- `POST /apps/inbox/read` - 标记已读（参数：id）
- `POST /apps/inbox/delete` - 删除留言（参数：id）
- `GET /inbox/submit` - 公开提交页面（HTML）

## 数据表
- `inbox_messages` - 留言（name, email, content, source_ip, is_read）
