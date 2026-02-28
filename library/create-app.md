# 创建应用指南

## 概述

AIOS 的应用运行在独立的 apps 服务（端口 9701）上，与核心 server（端口 9700）完全隔离。每个应用是 `apps/` 目录下的一个子目录，有自己的 API、数据库表、前端页面。

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

- 应用页面根容器统一使用：`class="p-6 w-full max-w-4xl mx-auto h-full overflow-y-auto"`
- 不要只写 `max-w-4xl mx-auto`，必须包含 `w-full`，避免在某些布局下内容区域按内容宽度收缩

## 目录结构

每个应用遵循以下结构：

```
apps/
└── {appname}/
    ├── index.js        # 入口 + 路由注册
    ├── db.js           # 数据库初始化 + CRUD
    ├── APP.md          # 应用说明（必须）
    └── api/
        ├── list.js
        ├── create.js
        ├── update.js
        └── delete.js
```

## 数据库

所有应用共用 `apps.db`（SQLite），通过 `apps/db/client.js` 获取连接：

```js
import { db } from '../db/client.js';
```

表命名规范：`{appname}_{table}`，例如 `notebook_notes`、`todo_items`。

建表在 `db.js` 的 `initDatabase()` 函数中完成，使用 `CREATE TABLE IF NOT EXISTS`。

## API 规范

- 路径：`/api/apps/{appname}/{action}`
- 列表：`GET /api/apps/{appname}/list`
- 详情：`GET /api/apps/{appname}/detail?id=xxx`
- 创建：`POST /api/apps/{appname}/create`
- 更新：`POST /api/apps/{appname}/update`
- 删除：`POST /api/apps/{appname}/delete`

## 注册到 apps 服务

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

## 注册到导航面板

在 `ui/src/components/NavPanel.vue` 中添加应用入口，在 `ui/src/router/index.js` 注册路由，应用页面放在 `ui/src/views/apps/` 目录下。

## 移动端适配

- 布局用 flex/grid，避免固定宽度
- 触摸目标不小于 44px（按钮用 `h-10 w-10` 或以上）
- 文字最小 `text-sm`
- 列表/表格在小屏用卡片堆叠替代横向布局
- 用 Tailwind 响应式前缀（`md:`, `sm:`）处理断点差异

## 主题适配规范

- 应用页面样式必须同时提供浅色/深色样式，统一使用 Tailwind 的 `dark:` 变体（例如 `bg-white dark:bg-neutral-800`）
- 不要在应用页面里额外实现主题状态管理逻辑；主题切换由全局设置驱动，组件只负责写 `dark:` 类
- 文本、边框、背景、hover 态都要成对提供浅色/深色样式，避免只改背景不改文字导致可读性问题

## 完整示例：Todo 应用

### `apps/todo/db.js`
```js
import { db } from '../db/client.js';

export function initTodoDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS todo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function getTodos() {
  return db.prepare('SELECT * FROM todo_items ORDER BY created_at DESC').all();
}

export function createTodo(content) {
  return db.prepare('INSERT INTO todo_items (content) VALUES (?)').run(content);
}

export function updateTodo(id, done) {
  return db.prepare('UPDATE todo_items SET done = ? WHERE id = ?').run(done, id);
}

export function deleteTodo(id) {
  return db.prepare('DELETE FROM todo_items WHERE id = ?').run(id);
}
```

### `apps/todo/index.js`
```js
import { json } from '../utils/json.js';
import { readBody } from '../utils/readBody.js';
import { initTodoDatabase, getTodos, createTodo, updateTodo, deleteTodo } from './db.js';

export { initTodoDatabase };

export async function handleTodoApi(req, res, path) {
  if (path === '/api/apps/todo/list' && req.method === 'GET') {
    return json(res, { success: true, data: getTodos() });
  }
  if (path === '/api/apps/todo/create' && req.method === 'POST') {
    const { content } = await readBody(req);
    createTodo(content);
    return json(res, { success: true });
  }
  if (path === '/api/apps/todo/update' && req.method === 'POST') {
    const { id, done } = await readBody(req);
    updateTodo(id, done);
    return json(res, { success: true });
  }
  if (path === '/api/apps/todo/delete' && req.method === 'POST') {
    const { id } = await readBody(req);
    deleteTodo(id);
    return json(res, { success: true });
  }
  return false;
}
```

### `apps/todo/APP.md`
```
---
name: todo
description: Todo list app. API under /api/apps/todo/, data in apps.db table todo_items.
---
```

## 注意事项

- 不要动 `apps/db/client.js` 和 `apps/utils/`
- 不要修改 `server/` 目录
- 建表始终用 `CREATE TABLE IF NOT EXISTS`
- 每个应用必须有 `APP.md`，首行写 name 和 description
