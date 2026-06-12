---
name: ledger
title: Ledger
description: Income/expense entries with monthly summary and budget. One-sentence smart recording is parsed by AI and written to the database directly (multiple entries, relative dates, category normalization); editing/deleting goes through clicking an entry row.
backend: server/apps/ledger
database: database/apps/ledger.db (entries, meta)
---

# Ledger

Use this app to record income and expense entries, viewed by month, with a monthly budget (stored in the meta table, default 3000).

Smart recording (/smart) is a direct-write flow: the AI parses natural language into one or more entries; the service strictly validates each one (type / positive amount / date format; categories outside the list are normalized to "Other"; relative dates are converted to concrete dates), writes valid entries to the database directly, and skips invalid ones with a count in the response. The manual "+ add entry" button has been removed; editing or deleting an entry is done by clicking the entry row to open the form sheet (EntrySheet).

API:
- GET /apps/ledger/entries?month=YYYY-MM -> { ok, entries, summary: { income, expense, balance } } (omit month for all entries)
- POST /apps/ledger/entries?month=... { type, amount, category, note?, occurredOn? } -> { ok, entry, summary }
- PATCH /apps/ledger/entries?id=...&month=... { type?, amount?, category?, note?, occurredOn? } -> { ok, entry, summary }
- DELETE /apps/ledger/entries?id=...&month=... -> { ok, summary }
- GET /apps/ledger/meta -> { ok, categories: [{ name, emoji, color }], budget }
- PUT /apps/ledger/budget { amount } -> { ok, budget } (positive number)
- POST /apps/ledger/smart { text } -> { ok, taskId, entries, skipped } (AI parses and writes directly; entries are the saved records, skipped is the number of invalid items dropped; entries is an empty array when nothing parses)
- POST /apps/ledger/parse { text } -> { ok, taskId, entry } (parses to a single draft without saving. Endpoint kept, currently no UI entry)

Fields:
- type: income or expense
- amount: positive number
- category: one of 餐饮, 交通, 购物, 居住, 娱乐, 医疗, 工资, 其他 (must be one of these)
- note: memo (smart merges the parsed name and memo into note)
- occurredOn: YYYY-MM-DD, defaults to today when omitted
