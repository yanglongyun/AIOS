---
description: 创建应用前必读的基础约束与交付要求
globs:
---

# create-app

创建应用前先阅读目标应用的 `APP.md` 与当前系统架构（`ui/`、`apps/`、`server/`）。

## APP.md frontmatter

```yaml
---
name: reader                         # 小写，无空格
description: 📚 互动式阅读器          # emoji + 简短描述
backend: apps/reader                  # 后端目录
database: database/apps/reader.db     # 数据库路径
---
```

## 后端结构

```
apps/<appname>/
├── APP.md                    # 应用清单
├── index.js                  # 应用入口（必须）
├── api/
│   └── index.js              # HTTP 路由（必须）
├── service/
│   ├── list.js               # 一个文件一个操作
│   ├── create.js
│   └── generate.js           # AI 任务调用
└── repository/
    ├── client.js              # DB 连接（必须）
    ├── init.js                # DB 初始化（必须）
    ├── list.js
    └── create.js
```

### 应用入口 index.js

```js
import { handleReaderApi } from './api/index.js';
import { initReaderDatabase } from './repository/init.js';

export default {
  name: 'reader',
  match: (path) => path.startsWith('/apps/reader/'),
  initDb: initReaderDatabase,
  handleApi: handleReaderApi
};
```

必须字段：`name`、`match`、`handleApi`。可选：`initDb`、`initRuntime`。

### 注册到 apps/registry.js

```js
export const appLoaders = [
  () => import('./reader/index.js'),
  () => import('./newapp/index.js'),  // 新增一行
];
```

### API 路由 api/index.js

```js
import { readBody } from '../../../shared/http/readBody.js';
import { json } from '../../../shared/http/json.js';

export const handleReaderApi = async (req, res, path) => {
  if (path === '/apps/reader/list' && req.method === 'GET') {
    return json(res, list());
  }
  if (path === '/apps/reader/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, await create(body));
  }
  if (path === '/apps/reader/detail' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = Number(url.searchParams.get('id') || 0);
    return json(res, detail({ id }));
  }
  return false; // 未匹配返回 false → 404
};
```

规则：完整路径匹配，不用 `:id`，用查询参数 `?id=xxx`。

### Repository 数据库

```js
// repository/client.js
import { createAppDb } from '../../app_shared/db/createAppDb.js';
export const db = createAppDb('reader.db');

// repository/init.js
import { db } from './client.js';
export const initReaderDatabase = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS reader_sessions (...)`);
};
```

开发阶段直接删库重建，禁止 ALTER TABLE。

### AI 任务调用

```js
// agentTask — 后台异步，支持工具调用
import { agentTaskJson } from '../../app_shared/agentTask.js';
const result = await agentTaskJson({ app: 'reader', title: '任务标题', prompt: '提示词' });

// instantTask — 同步，适合结构化输出
import { instantTaskJson } from '../../app_shared/instantTask.js';
const result = await instantTaskJson({ app: 'reader', title: '标题', prompt: '提示词', schema: {...} });
```

## 前端结构

```
ui/src/
├── views/apps/<appname>/index.vue       # 主视图
├── components/apps/<appname>/*.vue      # 子组件
├── desktop/apps.js                       # 桌面图标注册
└── i18n/messages/
    ├── zh/views/apps/<appname>.js
    └── en/views/apps/<appname>.js
```

### 注册到桌面（desktop/apps.js）

```js
{ id: 'newapp', name: 'app_sidebar_newapp', icon: '🆕', iconClass: 'icon-newapp',
  load: () => import('../views/apps/newapp/index.vue'), defaultSize: { w: 800, h: 560 } },
```

应用以窗口方式打开，无需路由注册，无需侧边栏按钮。从其他应用打开本应用用 `windowManager.open('newapp')`。

### i18n 双语必须

zh 和 en 各一个文件，在对应 `index.js` 中导入汇总。缺失 key 直接 throw Error。

## 交付清单

### 后端
- `apps/<appname>/APP.md`
- `apps/<appname>/index.js`
- `apps/<appname>/api/index.js`
- `apps/<appname>/service/*.js`
- `apps/<appname>/repository/client.js`
- `apps/<appname>/repository/init.js`
- `apps/<appname>/repository/*.js`
- `apps/registry.js` 注册

### 前端
- `ui/src/views/apps/<appname>/index.vue`
- `ui/src/components/apps/<appname>/*.vue`
- `ui/src/desktop/apps.js` 注册桌面图标

### 国际化
- `ui/src/i18n/messages/zh/views/apps/<appname>.js`
- `ui/src/i18n/messages/en/views/apps/<appname>.js`
- zh/en `index.js` 导入

## 硬规则

- 禁止半成品：不得只做页面或只做接口
- 单一路径、无兜底、无 fallback
- 开发期不做数据兼容，直接删库重建
- API 成功返回 `{ success: true, ... }`，错误返回 `{ success: false, message: '具体原因' }` + HTTP 状态码
- 所有字符串输入 `.trim()`
- 函数命名：`handle{Module}Api`
- 路径规范：list / detail?id=xxx / create / update / delete
