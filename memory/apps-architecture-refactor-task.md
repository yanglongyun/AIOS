# Apps 架构改造任务文档（基础专业版 v1）

## 目标
统一 `apps/*` 的基础结构，先做到清晰、稳定、可扩展；不引入过多复杂度，不做兼容层。

## 当前统一标准（v1）
每个 app 统一采用以下目录：

- `api/`：HTTP 入口与协议处理
- `service/`：业务逻辑与用例编排
- `repository/`：数据库读写
- `runtime/`（可选）：定时任务、后台循环
- `APP.md`：应用文档（API/Service/表结构/权限边界）

核心原则：

1. API 不直接写 SQL。
2. Service 不依赖 `req/res`。
3. Repository 只做数据访问，不写业务策略。
4. Runtime（如有）只调用 Service，不调用本 app HTTP API。

## 明确约束（本次定稿）

1. 不要 `service/index.js` 聚合导出。
2. 不要 `repository/index.js` 聚合导出。
3. 哪个文件需要哪个函数，就直接导入对应文件。
4. 不做旧路径兼容，不保留过渡别名。

说明：这样依赖关系最直接，后续排错和 AI 自动改代码也更稳定。

## 分层职责

### API 层
负责：
- 路由匹配
- 参数解析与基础校验
- 权限门禁
- 调用 Service 并返回 HTTP 响应

禁止：
- 业务规则判断
- 直接操作数据库

### Service 层
负责：
- 核心业务规则
- 跨 repository 协调
- 错误模型与返回结构约定

禁止：
- 直接处理 HTTP 细节
- 直接读写 `req/res`

### Repository 层
负责：
- SQL 查询/写入
- 表结构对应的数据访问函数

禁止：
- 业务流程判断
- HTTP 语义耦合

### Runtime 层（可选）
负责：
- 自动运行循环
- 定时执行
- 运行状态维护

要求：
- 通过 Service 执行业务动作

## 初始化与迁移策略（保持简单）
当前阶段继续使用 `repository/init.js` 作为数据库初始化入口（建表 + 必要 seed）。

暂不强制全量引入 `migrations/`。后续若某 app 结构频繁演进，再单独升级为 migration 机制。

## APP.md 最低要求
每个 app 的 `APP.md` 至少包含：

1. 目录结构说明
2. API 列表（路径/方法/参数）
3. Service 函数清单
4. Repository 函数与数据表
5. 权限边界
6. Runtime 说明（如有）

## 迁移执行步骤（单 app）

1. 建立 `api/service/repository` 目录并拆分代码。
2. API 改为只调 Service。
3. Service 改为只调 Repository。
4. 删除聚合导出（`service/index.js`、`repository/index.js`）。
5. 校验入口可加载（`api/index.js`、`apps/registry.js`）。
6. 更新 `APP.md`。

## 验收标准（v1）

### 结构验收
- 存在 `api/ service/ repository/ APP.md`。
- `runtime/` 仅在需要后台任务时存在。

### 代码验收
- API 层无 SQL。
- Service 层无 `req/res` 依赖。
- Repository 层无业务流程判断。
- 无 `service/index.js`、`repository/index.js` 聚合导出依赖。

### 运行验收
- `import('./apps/<name>/api/index.js')` 可通过。
- `import('./apps/registry.js')` 可通过。
- 改造后行为不退化。

## 后续升级点（暂缓）
- migration 机制（`migrations/` + `schema_migrations`）
- 统一错误码体系
- schema/dto 校验层
- infra/integrations 目录沉淀

当前策略：先把 v1 在所有 app 跑通，再逐项升级，避免一次性复杂化。
