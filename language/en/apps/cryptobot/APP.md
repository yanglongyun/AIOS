---
name: cryptobot
description: OKX trading app for goals, scheduled execution, decision logs, and equity history.
backend: server/apps/cryptobot
frontend: gui/src/apps/cryptobot
database: database/apps/cryptobot.db
---

# cryptobot

- Role: autonomous trading app that runs AI decisions on a schedule.
- Frontend: `gui/src/apps/cryptobot`
- Backend: `server/apps/cryptobot`
- Data: `database/apps/cryptobot.db`
- Entry points:
  - `/apps/cryptobot/status`
  - `/apps/cryptobot/exchange`
  - `/apps/cryptobot/goal`
  - `/apps/cryptobot/start`
  - `/apps/cryptobot/stop`
  - `/apps/cryptobot/equity`
  - `/apps/cryptobot/decisions`
