---
name: ledger
title: 记账本
description: 收入/支出流水与月度汇总、预算。一句话智能记账由 AI 解析后直接落库(支持多条、相对日期、分类归一);编辑/删除走点击流水行打开的表单。
backend: server/apps/ledger
database: database/apps/ledger.db (entries, meta)
---

# 记账本

用于记录收入和支出流水,按月查看,带月预算(存 meta 表,默认 3000)。

智能记账(/smart)是直写模式:AI 把自然语言解析成一条或多条账目,service 逐条严格校验(type/正数金额/日期格式;分类不在表内归为「其他」;相对日期换算成具体日期),合法条目直接写库,非法条目跳过并计数返回。手工「+记一笔」入口已移除;编辑或删除一条流水是点击流水行打开表单(EntrySheet)操作。

接口:
- GET /apps/ledger/entries?month=YYYY-MM -> { ok, entries, summary: { income, expense, balance } }(month 省略则返回全部)
- POST /apps/ledger/entries?month=... { type, amount, category, note?, occurredOn? } -> { ok, entry, summary }
- PATCH /apps/ledger/entries?id=...&month=... { type?, amount?, category?, note?, occurredOn? } -> { ok, entry, summary }
- DELETE /apps/ledger/entries?id=...&month=... -> { ok, summary }
- GET /apps/ledger/meta -> { ok, categories: [{ name, emoji, color }], budget }
- PUT /apps/ledger/budget { amount } -> { ok, budget }(正数)
- POST /apps/ledger/smart { text } -> { ok, taskId, entries, skipped }(AI 解析并直接写库;entries 是已落库账目,skipped 是被跳过的非法条数;解析不出账目时 entries 为空数组)
- POST /apps/ledger/parse { text } -> { ok, taskId, entry }(只解析成单条草稿不写库。保留接口,当前 UI 无入口)

字段:
- type: income 或 expense
- amount: 正数
- category: 餐饮、交通、购物、居住、娱乐、医疗、工资、其他(必须是其一)
- note: 备注(smart 会把解析出的名称与备注合并写入)
- occurredOn: YYYY-MM-DD,省略时取当天
