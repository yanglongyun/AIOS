---
name: briefing
description: 专属早报 - 按用户关注主题生成每日简报。支持关注方向、今日刷新、历史查看。数据在 apps_briefing_profile 和 apps_briefing_daily。
---

# 专属早报

输入关注方向（一段话描述），应用通过 task 机制请求主 Agent 自主搜索、整理并生成今日早报。

API:
- `GET /apps/briefing/today`
- `GET /apps/briefing/history?page=1&pageSize=10`
- `POST /apps/briefing/focus`
- `POST /apps/briefing/refresh`
