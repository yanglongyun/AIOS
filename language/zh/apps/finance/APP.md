# finance

本地记账本应用，用于记录收入和支出。

## 位置

- 前端：`gui/src/apps/finance`
- 后端：`server/apps/finance`
- 数据库：`database/apps/finance.db`

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/apps/finance/list?month=YYYY-MM` | 按月读取记录和汇总 |
| POST | `/apps/finance/create` | 新增收入/支出 |
| POST | `/apps/finance/update` | 更新记录 |
| POST | `/apps/finance/delete` | 删除记录 |
