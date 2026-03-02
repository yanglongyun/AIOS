---
name: dailycheck
description: 每日打卡 - AI 每天生成问题，用户持续回答形成成长记录。支持今日问题、作答、历史与手动刷新。数据在 apps_dailycheck_questions 和 apps_dailycheck_answers。
---

# 每日打卡

每天自动生成一个 AI 提问，用户回答后形成连续的自我改进轨迹。

API:
- `GET /api/apps/dailycheck/today`
- `POST /api/apps/dailycheck/answer`
- `GET /api/apps/dailycheck/history?page=1&pageSize=10`
- `POST /api/apps/dailycheck/refresh`
