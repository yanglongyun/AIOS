# AIOS 后端三层架构说明

本文说明 AIOS 后端的标准三层架构：`api -> service -> repository`。

## 1. 架构目标

- `api`：只负责协议层（HTTP 入参校验、状态码、响应格式）。
- `service`：只负责业务规则（领域逻辑、流程编排、状态变更）。
- `repository`：只负责数据读写（SQL、持久化、查询封装）。

硬规则：
- 单向依赖：`api -> service -> repository`。
- `api` 不写 SQL。
- `service` 不直接操作 HTTP `req/res`。
- `repository` 不做业务分支判断。

## 2. 目录结构（主服务）

主服务位于 `server/`：

```text
server/
  api/          # HTTP 路由入口
  service/      # 业务逻辑
  repository/   # 数据访问
  system/       # 系统基础能力（http/ws/llm/dir）
  chat/         # 对话流程与提示词拼装
  agent/        # agent 执行相关逻辑
```

启动入口：
- `server/index.js` 负责初始化目录、数据库、WebSocket、任务调度器并监听 `9700`。

## 3. 目录结构（应用服务）

应用服务位于 `apps/`，每个应用独立三层：

```text
apps/<app>/
  api/
  service/
  repository/
  index.js
```

例如：
- `apps/notebook/index.js`：注册 `name/match/initDb/handleApi`
- `apps/index.js`：加载 `apps/registry.js` 中注册的应用，监听 `9701`

## 4. 请求流转（标准链路）

以任务创建为例（主服务）：

1. 入口：`server/api/task.js`
2. 业务：`server/service/task/create/instant.js` 或 `server/service/task/create/agent.js`
3. 数据：`server/repository/task/create.js`、`server/repository/task/schedule.js`

以笔记应用为例（应用服务）：

1. 入口：`apps/notebook/api/index.js`
2. 业务：`apps/notebook/service/*`
3. 数据：`apps/notebook/repository/*`

## 5. 各层职责边界（必须遵守）

### API 层

- 负责参数校验、鉴权结果处理、HTTP 状态码。
- 负责把 `service` 的结果序列化为 JSON 响应。
- 禁止写业务状态机逻辑。
- 禁止直接写 SQL。

### Service 层

- 负责业务规则、流程编排、错误语义。
- 通过调用 `repository` 完成持久化。
- 可调用 `system` 能力（如 ws 广播、llm 调用）完成业务流程。
- 禁止直接返回 HTTP 响应对象。

### Repository 层

- 负责单一数据源读写和 SQL 语句。
- 输入输出尽量保持稳定、可预测。
- 禁止耦合 HTTP 或 UI 概念。

## 6. 依赖关系与反模式

允许：
- `api -> service`
- `service -> repository`
- `service -> system`

不允许：
- `repository -> service`
- `repository -> api`
- `api -> repository`（绕过 service）
- 在 `api` 层堆叠大量业务分支

## 7. 新增接口的标准模板

1. 在 `api` 新增路由分支和参数校验。
2. 在 `service` 新增对应业务函数。
3. 在 `repository` 新增或复用读写函数。
4. 在 `api/index.js`（或应用 `index.js`）挂载入口。
5. 补充必要的错误码和错误信息，保持可诊断。

## 8. 与当前系统的关系

当前 AIOS 已按该三层模式组织主服务与应用服务：
- 主服务：`server/api`、`server/service`、`server/repository`
- 应用服务：`apps/*/api`、`apps/*/service`、`apps/*/repository`

后续重构与新增功能必须继续遵守该模式，避免层间职责回流。

