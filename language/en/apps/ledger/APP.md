---
name: ledger
title: Ledger
description: Income and expense entries.
backend: server/apps/ledger
database: database/apps/ledger.db (entries)
---

# Ledger

Use this app to save income and expense records.

API:
- GET /apps/ledger/entries -> { ok, entries, summary }
- POST /apps/ledger/entries { type, amount, category, note, occurredOn? }
- DELETE /apps/ledger/entries?id=...
