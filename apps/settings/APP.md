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
- `server/service/skills/list.js`：扫描项目和系统技能目录
- `ui/src/apps/settings/`：设置页前端，各 tab 独立组件

## API
- `GET /api/settings`：获取所有设置
- `GET /api/settings/skills`：读取技能列表
- `POST /api/settings`：批量更新设置（provider、apiUrl、apiKey、model、tool/context 相关项）

## 前端 Tab
- AccountTab：账户信息、密码修改、退出登录
- ModelTab：Provider / API URL / Key / 模型
- ToolTab：工具开关
- ContextTab：上下文轮数
- SkillTab：技能列表
- AboutTab：关于

## 数据表
- `settings`：key, value（键值对存储）

## 当前设置项
- `provider`
- `apiUrl`
- `apiKey`
- `model`
- `contextRounds`
- `enableToolResultTruncate`
- `toolResultMaxChars`
- `enableToolLoopLimit`
- `toolMaxRounds`
- `systemPrompt`
- `language`
