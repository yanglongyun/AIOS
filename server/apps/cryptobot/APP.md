---
name: cryptobot
description: 炒币机 - 基于 OKX 的自主交易应用。用户仅配置凭证与目标，系统周期性触发 AI 自主执行并记录任务总结。数据在 cryptobot_config、cryptobot_state、cryptobot_decisions、cryptobot_equity。
backend: server/apps/cryptobot
database: database/apps/cryptobot.db
---

# 炒币机

周期性触发 AI 任务，AI 基于目标完全自主决策与执行。  
Decision Log 只记录每轮任务总结，不记录固定 action/amount 字段。

API:
- GET `/apps/cryptobot/status`
- POST `/apps/cryptobot/exchange`
- POST `/apps/cryptobot/goal`
- POST `/apps/cryptobot/start`
- POST `/apps/cryptobot/stop`
- GET `/apps/cryptobot/equity?limit=300`
- GET `/apps/cryptobot/decisions?limit=50`
