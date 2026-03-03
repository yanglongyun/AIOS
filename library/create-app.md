# 创建应用指南

## 概述

AIOS 的应用运行在独立的 apps 服务（端口 9701）上，与核心 server（端口 9700）隔离。

**AIOS App 定义：**
- 具备传统应用能力：UI + API + DB
- 具备 Agent 原生能力：`APP.md` + `scripts/`（可选）+ 任务/通知协作

## 界面结构

```
顶部栏（全宽固定）
├── 汉堡菜单（控制左侧导航面板）
└── AIOS 标题

左侧导航面板 NavPanel（ui/src/components/NavPanel.vue）
├── 聊天
└── 应用列表
    ├── 已有应用...
    └── 新应用注册到这里
```

新增应用后，需要：
1. 在 `ui/src/components/NavPanel.vue` 添加导航入口
2. 在 `ui/src/views/apps/` 创建页面组件
3. 在 `ui/src/router/index.js` 注册路由

## 页面容器标准

- 应用页面根容器统一使用：`class="w-full max-w-4xl mx-auto h-full overflow-y-auto"`
- 不要只写 `max-w-4xl mx-auto`，必须包含 `w-full`，避免内容区域按内容宽度收缩

## 层级（z-index）规范

- 顶部全局栏（App Header）最高层：建议 `z-[80]`
- 左侧导航面板（Sidebar）次高：建议 `z-[70]`
- 侧边栏遮罩层（仅移动端）低于侧边栏：建议 `z-[60]`
- 应用内部浮层必须低于全局栏和侧边栏：建议 `z-10` 到 `z-30`

## 目录结构（新规范）

```
apps/
├── index.js                        # apps 服务入口（service 启动 + API 懒加载分发）
├── registry.js                     # 应用总注册表（api + db + service）
├── app_shared/
│   └── utils/
│       ├── json.js                 # JSON 响应工具
│       └── readBody.js             # 请求体解析工具
└── {appname}/
    ├── index.js                    # 应用入口（导出 init/handle/start）
    ├── db.js                       # 应用独立数据库连接 + 建表初始化
    ├── APP.md                      # 应用说明（必须）
    ├── api/
    │   ├── index.js                # 分发到 group
    │   └── {group}/
    │       ├── index.js            # 分发到 action
    │       ├── list.js
    │       ├── create.js
    │       └── ...
    └── service/                    # 可选：后台任务（定时器/轮询）
        ├── index.js
        └── *.js
```

## 数据库

每个应用使用独立数据库文件（SQLite）：

```js
// apps/{appname}/db.js
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, '{appname}.db'));
db.pragma('journal_mode = WAL');
```

表命名建议：`apps_{appname}_{table}`。

建表在应用 `db.js` 的 `init...Database()` 中完成，始终使用 `CREATE TABLE IF NOT EXISTS`。

## API 规范

- 路径：`/apps/{appname}/{action}`
- 列表：`GET /apps/{appname}/list`
- 详情：`GET /apps/{appname}/detail?id=xxx`
- 创建：`POST /apps/{appname}/create`
- 更新：`POST /apps/{appname}/update`
- 删除：`POST /apps/{appname}/delete`

## 注册规范（关键）

1) `apps/registry.js` 统一注册每个应用的 API/DB/Service：

```js
{
  name: 'todo',
  match: (path) => path.startsWith('/apps/todo/'),
  load: () => import('../todo/index.js'),
  apiHandler: 'handleTodoApi',
  dbInit: ['initTodoDatabase'],
  serviceStart: ['startTodoService'] // 可选
}
```

2) `apps/index.js` 只做：
- 启动时 `bootServices()`
- 请求时按 `registry` 懒加载并分发

## Agent 协作规范

每个应用都应具备：
- `APP.md`：说明目标、边界、数据结构、可执行脚本
- `scripts/`：供 Agent 执行，不直接给前端调用。脚本创建规范见 `library/create-script.md`
- 应用可发起：
  - `ask`：向 Agent 请求分析/决策
  - `task`：启动后台任务（异步）
  - `notify`：写入事件通知（异步）

推荐原则：
- UI 读 DB
- Agent 跑脚本改 DB
- API 做编排与权限边界

## 主题适配规范

- 应用页面样式必须同时提供浅色/深色样式，统一使用 Tailwind `dark:` 变体
- 不要在应用页面里额外实现主题状态管理逻辑；主题切换由全局设置驱动
- 文本、边框、背景、hover 态都要成对提供浅色/深色样式

## 完整示例：Todo 应用

### `apps/todo/index.js`

```js
import { initTodoDatabase } from './db.js';
import { handleTodoApiRoute } from './api/index.js';
import { json } from '../app_shared/utils/json.js';
import { readBody } from '../app_shared/utils/readBody.js';

export { initTodoDatabase };

export async function handleTodoApi(req, res, path) {
  const result = await handleTodoApiRoute({ req, path, readBody });
  if (result === false) return false;
  return json(res, result.data, result.status || 200);
}
```

### `apps/todo/api/index.js`

```js
import { handleItemApi } from './item/index.js';

export const handleTodoApiRoute = async (ctx) => {
  const result = await handleItemApi(ctx);
  if (result !== false) return result;
  return false;
};
```

### `apps/todo/db.js`

```js
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'todo.db'));
db.pragma('journal_mode = WAL');

export function initTodoDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_todo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
```

### `apps/todo/APP.md`

```
---
name: todo
description: Todo list app. API under /apps/todo/, data in todo.db table apps_todo_items.
---
```

## 注意事项

- 应用共享能力统一放在 `apps/app_shared/`
- 每个应用必须有 `APP.md`
- 每个应用必须有自己的 `db.js`，不要复用共享 DB 连接文件
- 每层 api 目录都必须有 `index.js` 路由入口
- action 文件一个文件一个 API
- `registry.js` 中 `serviceStart` 只启动服务，不做 DB 初始化
- 建表始终用 `CREATE TABLE IF NOT EXISTS`
- 开发阶段不做兼容分支，按当前规范直接演进
