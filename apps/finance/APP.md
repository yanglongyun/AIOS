---
name: finance
description: 记账本 - 收入/支出记录应用。
backend: apps/finance
database: database/apps/finance.db
---

# 记账本（finance）

## 目录结构
- `api/`：HTTP handler
- `service/`：业务逻辑
- `repository/`：数据库读写
- `APP.md`：应用说明

## API
- `GET /apps/finance/list`：获取交易列表
- `POST /apps/finance/create`：新增交易（`type`, `amount`, `note`）
- `POST /apps/finance/delete`：删除交易（`id`）

## Service
- `listFinance()`：返回交易列表
- `createFinance(body)`：校验并创建交易
- `deleteFinance(body)`：校验并删除交易

## Repository
- `listTransactions()`
- `createTransaction({ type, amount, note })`
- `deleteTransactionById(id)`
- `initFinanceDatabase()`

## 数据表
- `finance_transactions`
  - `id`
  - `type` (`income` | `expense`)
  - `amount`
  - `note`
  - `date`

## 权限边界
- 该应用不暴露公开写接口，走 apps 登录门禁。
- API 层仅做路由与参数接收，核心规则在 service 层。
