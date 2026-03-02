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
├── index.js                        # apps 服务入口 + 路由分发
├── app_shared/
│   └── utils/
│       ├── json.js                 # JSON 响应工具
│       └── readBody.js             # 请求体解析工具
└── {appname}/
    ├── index.js                    # 应用入口 + 路由注册
    ├── db.js                       # 应用独立数据库连接 + 建表初始化
    ├── APP.md                      # 应用说明（必须）
    ├── api/                        # 一个文件一个 API
    │   ├── list.js
    │   ├── create.js
    │   ├── update.js
    │   └── delete.js
    └── scripts/                    # 可选：供 Agent 直接执行
        └── *.sh / *.js
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

- 路径：`/api/apps/{appname}/{action}`
- 列表：`GET /api/apps/{appname}/list`
- 详情：`GET /api/apps/{appname}/detail?id=xxx`
- 创建：`POST /api/apps/{appname}/create`
- 更新：`POST /api/apps/{appname}/update`
- 删除：`POST /api/apps/{appname}/delete`

## 应用注册到 apps 服务

在 `apps/index.js` 中注册新应用：

```js
// 1. 导入
import { handleTodoApi, initTodoDatabase } from './todo/index.js';

// 2. 路由分发（在 createServer 回调中）
if (path.startsWith('/api/apps/todo/')) {
  const handled = await handleTodoApi(req, res, path);
  if (handled !== false) return;
}

// 3. 初始化数据库
initTodoDatabase();
```

## Agent 协作规范

每个应用都应具备：
- `APP.md`：说明目标、边界、数据结构、可执行脚本
- `scripts/`（可选）：供 Agent 执行，不直接给前端调用
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
import { json } from '../app_shared/utils/json.js';
import { readBody } from '../app_shared/utils/readBody.js';
import { initTodoDatabase } from './db.js';

export { initTodoDatabase };

export async function handleTodoApi(req, res, path) {
  if (path === '/api/apps/todo/list' && req.method === 'GET') {
    const items = db.prepare('SELECT * FROM apps_todo_items ORDER BY created_at DESC').all();
    return json(res, { success: true, data: items });
  }
  if (path === '/api/apps/todo/create' && req.method === 'POST') {
    const { content } = await readBody(req);
    db.prepare('INSERT INTO apps_todo_items (content) VALUES (?)').run(content);
    return json(res, { success: true });
  }
  if (path === '/api/apps/todo/update' && req.method === 'POST') {
    const { id, done } = await readBody(req);
    db.prepare('UPDATE apps_todo_items SET done = ? WHERE id = ?').run(done, id);
    return json(res, { success: true });
  }
  if (path === '/api/apps/todo/delete' && req.method === 'POST') {
    const { id } = await readBody(req);
    db.prepare('DELETE FROM apps_todo_items WHERE id = ?').run(id);
    return json(res, { success: true });
  }
  return false;
}
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
description: Todo list app. API under /api/apps/todo/, data in todo.db table apps_todo_items.
---
```

## 注意事项

- 应用共享能力统一放在 `apps/app_shared/`
- 每个应用必须有 `APP.md`
- 每个应用必须有自己的 `db.js`，不要复用共享 DB 连接文件
- 每个 API 一个文件
- 建表始终用 `CREATE TABLE IF NOT EXISTS`
- 开发阶段不做兼容分支，按当前规范直接演进
