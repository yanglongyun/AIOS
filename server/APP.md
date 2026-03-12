---
name: server
description: AIOS server 核心后端。统一采用 api/service/repository 分层，runtime 模块用于后台循环与调度。
---

# Server 架构说明（v1）

## 目录标准
- `api/`：HTTP handler，仅做协议层处理。
- `service/`：业务逻辑层。
- `repository/`：数据库读写层。
- `scheduler/`、`agent/`、`chat/`：运行时模块，业务访问应优先经过 service。
- `APP.md`：本文件。

## 分层规则
1. API 不直接写 SQL。
2. Service 不依赖 `req/res`。
3. Repository 只做数据访问，不写业务策略。
4. 不使用 `service/index.js`、`repository/index.js` 聚合导出，全部按文件直连导入。

## 当前迁移状态
已迁移到 `api -> service -> repository`：
- `settings`
- `schedule`
- `task`（list/detail/messages/stop）

待迁移（仍含 API 直连 DB）：
- `chat`
- `setup`
- `files`（视复杂度）

## 运行与初始化
- 启动入口：`server/index.js`
- 数据库初始化：`server/repository/init.js`
- 调度入口：`server/scheduler/index.js`

## 后续执行顺序建议
1. `task create`（agent/instant 执行链路）
2. `chat`（消息与会话）
3. `setup`
4. 其余模块分批迁移
