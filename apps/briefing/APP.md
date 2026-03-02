---
name: briefing
description: 专属早报 - 按用户关注主题生成每日新闻简报。支持配置、生成、历史查看。数据在 apps_briefing_config 和 apps_briefing_reports。
---

# 专属早报

输入关注方向（一段话描述），系统会用 AI 提取搜索关键词，抓取相关新闻线索并生成专属每日早报。

API:
- `GET /apps/briefing/config/get`
- `POST /apps/briefing/config/save`
- `POST /apps/briefing/report/generate`
- `GET /apps/briefing/report/list?page=1&pageSize=10`
- `GET /apps/briefing/report/detail?id=1`
