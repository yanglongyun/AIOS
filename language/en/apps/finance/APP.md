# finance

Local ledger app for income and expense records.

## Location

- Frontend: `gui/src/apps/finance`
- Backend: `server/apps/finance`
- Database: `database/apps/finance.db`

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/apps/finance/list?month=YYYY-MM` | Read monthly records and summary |
| POST | `/apps/finance/create` | Create an income/expense record |
| POST | `/apps/finance/update` | Update a record |
| POST | `/apps/finance/delete` | Delete a record |
