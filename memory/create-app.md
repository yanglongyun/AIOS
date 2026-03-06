# 创建应用指南（当前实现）

## 概述

AIOS 应用运行在独立的 apps 服务（`9701`），核心 server 在 `9700`。  
apps 服务负责：
- 统一鉴权拦截（通过 `access(..., 'apps')`）
- 应用模块懒加载
- 按注册表分发 API
- 启动带 `serviceStart` 的后台应用服务

## 新增应用完整流程

1. 在 `apps/{appname}/` 创建后端模块（`index.js` + `db.js` + `api/`）。
2. 在 `apps/registry.js` 增加注册项。
3. 在 `ui/src/views/apps/` 新建页面组件（`{AppName}View.vue`）。
4. 在 `ui/src/router/index.js` 注册前端路由。
5. 在 `ui/src/components/NavPanel.vue` 增加侧栏入口按钮。
6. 可选：创建 `apps/{appname}/APP.md` 记录应用说明。

## 目录结构（推荐）

```text
apps/
├── index.js                        # apps 服务入口（鉴权 + 懒加载 + 分发 + service 启动）
├── registry.js                     # 应用注册表
├── app_shared/
│   ├── db/createAppDb.js           # 应用 DB 工厂（database/apps/*.db）
│   ├── utils/json.js               # JSON 响应
│   ├── utils/readBody.js           # 请求体读取
│   ├── agentTask.js                # 调 /api/task/create/agent
│   └── instantTask.js              # 调 /api/task/create/instant
└── {appname}/
    ├── index.js                    # 应用 API 总入口（手写 path + method 分发）
    ├── db.js                       # 建表与数据访问
    ├── APP.md                      # 应用说明（建议；新应用应补齐）
    ├── api/
    │   ├── list.js
    │   ├── create.js
    │   └── ...
    └── runtime/                    # 可选，应用后台运行逻辑（轮询/状态机/任务执行）
        ├── index.js
        └── *.js
```

说明：
- 现在没有 `apps/api/` 总目录。
- `api/index.js` 不是必须；多数应用直接在 `index.js` 里导入具体 handler。
- 脚本体系已独立在项目根目录 `scripts/`，不放在应用目录。

## 注册规范（关键）

`apps/registry.js` 每个应用一项：

```js
{
  name: 'todo',
  match: (path) => path.startsWith('/apps/todo/'),
  load: () => import('./todo/index.js'),
  apiHandler: 'handleTodoApi',
  dbInit: ['initTodoDatabase'],
  serviceStart: ['initTodoRuntime'] // 可选
}
```

要求：
- `load` 路径相对 `apps/registry.js`。
- `apiHandler`、`dbInit`、`serviceStart` 名称需与应用导出函数一致。
- 未命中路由时，应用 handler 返回 `false`，由 apps 服务统一返回 404。

## API 规范（当前实现）

- 统一前缀：`/apps/{appname}/...`
- 方法与路径由应用自定义，不强制 CRUD 固定命名。
- 常见约定：
  - 列表：`GET /apps/{appname}/list`
  - 创建：`POST /apps/{appname}/create`
  - 更新：`POST /apps/{appname}/update`
  - 删除：`POST /apps/{appname}/delete`

## 数据库规范

推荐在 `db.js` 用 `createAppDb`：

```js
import { createAppDb } from '../app_shared/db/createAppDb.js';

export const db = createAppDb('todo.db');

export function initTodoDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_todo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}
```

规范：
- 每个应用独立 DB 文件，位于 `database/apps/`。
- 表名建议加前缀：`apps_{appname}_...`。
- 建表统一使用 `CREATE TABLE IF NOT EXISTS`。

## Agent 协作

可通过 `apps/app_shared` 的封装调用任务接口：
- `agentTask(...)` / `agentTaskJson(...)`
- `instantTask(...)` / `instantTaskJson(...)`

推荐原则：
- UI 只通过 API 读写数据。
- API 负责鉴权后的编排与边界控制。
- 需要模型推理时由 API 调任务接口，不在前端直连。

## Instant JSON 约束（必须）

调用 `POST /api/task/create/instant` 且启用 `schema`（或 `response_format: { type: 'json_object' }`）时：
- `prompt` 或 `messages` 必须出现 `JSON/json` 字样
- 必须明确要求“只输出 JSON，不要额外文本”

推荐写法：
- system: `只输出 JSON：{"field":"..."}`
- prompt: `按 schema 输出 JSON`

## 前端接入规范

- 新应用页面放在 `ui/src/views/apps/`。
- 路由在 `ui/src/router/index.js` 手动注册。
- 侧边栏入口在 `ui/src/components/NavPanel.vue` 手动添加。
- 页面根容器建议使用：`w-full max-w-4xl mx-auto h-full overflow-y-auto`。

## 示例（与当前代码风格一致）

### `apps/todo/index.js`

```js
import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initTodoDatabase } from './db.js';
import { listHandler } from './api/list.js';
import { createHandler } from './api/create.js';

export { initTodoDatabase };

export const handleTodoApi = async (req, res, path) => {
  if (path === '/apps/todo/list' && req.method === 'GET') {
    return json(res, listHandler());
  }

  if (path === '/apps/todo/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, createHandler(body));
  }

  return false;
};
```

### `apps/todo/APP.md`

```md
---
name: todo
description: 待办应用，API 前缀 /apps/todo/
---
```

## 注意事项

- `apps/index.js` 已统一处理 CORS 与鉴权，不要在每个应用重复实现同层逻辑。
- apps 健康检查为：`GET /apps/health`。
- 正式演进需明确兼容策略：涉及目录、路由、API 字段或数据结构调整时，先提供兼容层与迁移路径，再逐步移除旧实现。
- 变更管理必须使用 Git：按功能拆分提交，提交信息写清“改动内容 + 影响范围 + 回滚方式”，数据库相关改动必须单独提交，便于审计与回退。
- 数据库是高风险资产：执行 schema 变更或批量写入前必须先备份（至少保留变更前快照），并提供可验证的回滚步骤。
- 面向用户必须说明风险点：涉及数据迁移、字段变更、历史数据重算、性能抖动、停机窗口时，需在发布前给出影响说明、缓解措施和应急预案。
