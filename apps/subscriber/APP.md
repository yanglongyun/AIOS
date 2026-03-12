---
name: subscriber
description: 订阅机 - 按用户订阅主题生成每日简报。支持订阅主题、立即收报、历史查看。数据在 subscriber_profile 和 subscriber_daily。
---

# 订阅机

输入订阅主题（一段话描述），应用通过 task 机制请求主 Agent 自主搜索、整理并生成订阅内容。

API:
- `GET /apps/subscriber/today`
- `GET /apps/subscriber/history?page=1&pageSize=10`
- `POST /apps/subscriber/focus`
- `POST /apps/subscriber/refresh`
