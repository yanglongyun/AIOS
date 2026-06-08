---
name: ledger
title: 记账本
description: 收入/支出流水记录。适合把自然语言消费或收入整理成结构化账目。
backend: server/apps/ledger
database: database/apps/ledger.db (entries)
---

# 记账本

用于记录收入和支出流水。

接口:
- GET /apps/ledger/entries -> { ok, entries, summary }
- POST /apps/ledger/entries { type, amount, category, note, occurredOn? }
- DELETE /apps/ledger/entries?id=...

字段:
- type: income 或 expense
- amount: 正数
- category: 分类
- note: 备注
- occurredOn: YYYY-MM-DD
