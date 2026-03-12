---
name: cryptobot
description: 炒币机 - 基于 OKX 的自动交易应用，支持配置交易参数、启动停止、收益曲线和决策记录。数据在 cryptobot_config、cryptobot_state、cryptobot_decisions、cryptobot_equity。
backend: apps/cryptobot
database: database/apps/cryptobot.db
---

# 炒币机

周期性自动执行策略交易，不是每次交易都请求 LLM。  
LLM 只在策略刷新周期触发，用于更新策略代码。

API:
- GET `/apps/cryptobot/status`
- POST `/apps/cryptobot/exchange`
- POST `/apps/cryptobot/directive`
- POST `/apps/cryptobot/start`
- POST `/apps/cryptobot/stop`
- GET `/apps/cryptobot/equity?limit=300`
- GET `/apps/cryptobot/decisions?limit=50`
