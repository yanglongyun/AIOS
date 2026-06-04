---
name: ledger
description: 记账本应用，记录收入 / 支出流水，自动汇总收入、支出与结余。
backend: server/apps/ledger
frontend: gui/src/apps/ledger
database: database/apps/ledger.db
---

# ledger 记账本

- 定位：极简记账,收入/支出两类流水 + 自动汇总,跑在应用服务(:9503)上,数据完全隔离。
- 前端：`gui/src/apps/ledger/index.tsx`(React)
- 后端：`server/apps/ledger/index.ts`
- 数据：独立库 `database/apps/ledger.db`,只一张表 `entries`

## 数据模型

`entries` 表:

```
id           INTEGER  自增主键
type         TEXT     income | expense
amount       REAL     金额(正数)
category     TEXT     分类
note         TEXT     备注
occurred_on  TEXT     发生日期 YYYY-MM-DD,默认今天
created_at   DATETIME 创建时间
```

## API(全部走 /apps/ledger/entries)

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/apps/ledger/entries` | 列出流水 + 返回 summary `{income, expense, balance}` |
| POST | `/apps/ledger/entries` | 记一笔,body `{type, amount, category?, note?, occurredOn?}` |
| DELETE | `/apps/ledger/entries?id=N` | 删除 |
