---
name: settings
description: 系统设置 - API 配置、模型选择、工具开关、上下文管理、账户。
backend: server/（api/settings.js, service/settings/, repository/settings/）
frontend: ui/src/apps/settings
database: database/aios.db（settings 表）
---

# 系统设置（settings）

## 代码分布（尚未完全拆分）
- `server/api/settings.js`：HTTP 路由入口
- `server/service/settings/`：业务逻辑（get, update）
- `server/repository/settings/`：数据库读写（get, save）

## API
- `GET /api/settings`：获取所有设置
- `POST /api/settings`：更新设置（`key`, `value`）

## 前端 Tab
- GeneralTab：语言
- ModelTab：API URL / Key / 模型
- ToolTab：工具开关
- ContextTab：上下文管理
- AccountTab：修改密码

## 数据表
- `settings`：key, value（键值对存储）
