# cryptobot

Crypto trading bot app for exchange connectivity, market/position views, and local trading-agent runs.

## Location

- Frontend: `gui/src/apps/cryptobot`
- Backend: `server/apps/cryptobot`
- Database: `database/apps/cryptobot.db`

## Notes

This app has its own backend and runtime. The backend owns configuration, market data, positions, decisions, and trading execution; the frontend displays market data, runtime status, positions, and decision logs.
