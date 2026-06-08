---
name: ledger
title: Ledger
description: Income and expense entries with natural-language parsing and confirm-before-save.
backend: server/apps/ledger
database: database/apps/ledger.db (entries)
---

# Ledger

Use this app to save income and expense records.

Smart input parses natural language into a draft entry only. It does not write to the database until the user confirms.

API:
- GET /apps/ledger/entries -> { ok, entries, summary }
- POST /apps/ledger/entries { type, amount, category, note, occurredOn? }
- DELETE /apps/ledger/entries?id=...
- POST /apps/ledger/parse { text } -> { ok, entry }
