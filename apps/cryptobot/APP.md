---
name: cryptobot
description: 炒币机 - 基于 OKX 的自动交易应用，支持配置交易参数、启动停止、收益曲线和决策记录。数据在 apps_cryptobot_config、apps_cryptobot_state、apps_cryptobot_decisions、apps_cryptobot_equity。
---

# 炒币机

周期性自动执行策略交易，不是每次交易都请求 LLM。  
LLM 只在策略刷新周期触发，用于更新策略代码。

API:
- GET `/api/apps/cryptobot/status`
- POST `/api/apps/cryptobot/exchange`
- POST `/api/apps/cryptobot/directive`
- POST `/api/apps/cryptobot/start`
- POST `/api/apps/cryptobot/stop`
- GET `/api/apps/cryptobot/equity?limit=300`
- GET `/api/apps/cryptobot/decisions?limit=50`
