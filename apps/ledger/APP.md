---
name: ledger
title: 记账本
description: 收入/支出流水记录。支持一句话智能输入,解析预览后由用户确认记账。
backend: server/apps/ledger
database: data/apps/ledger.db (entries)
---

# 记账本

用于记录收入和支出流水。

智能输入只负责把自然语言解析成账目草稿,不会直接写入数据库。用户确认后才调用创建接口保存。

接口:
- GET /apps/ledger/entries -> { ok, entries, summary }
- POST /apps/ledger/entries { type, amount, category, note, occurredOn? }
- DELETE /apps/ledger/entries?id=...
- POST /apps/ledger/parse { text } -> { ok, entry }

字段:
- type: income 或 expense
- amount: 正数
- category: 餐饮、交通、购物、居住、娱乐、医疗、工资、其他
- note: 备注
- occurredOn: YYYY-MM-DD
