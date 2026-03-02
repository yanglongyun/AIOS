# 炒币机

周期性自动执行策略交易，不是每次交易都请求 LLM。
LLM 只在策略刷新周期触发，用于更新策略代码。

API:
- GET `/api/apps/cryptobot/status`
- POST `/api/apps/cryptobot/config`
- POST `/api/apps/cryptobot/start`
- POST `/api/apps/cryptobot/stop`
- POST `/api/apps/cryptobot/run-once`
- POST `/api/apps/cryptobot/refresh-strategy`
- GET `/api/apps/cryptobot/equity?limit=300`
- GET `/api/apps/cryptobot/trades?page=1&pageSize=20`
- GET `/api/apps/cryptobot/logs?limit=100`
