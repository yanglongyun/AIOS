---
description: AIOS 当前应用创建与修改规范
---

# 应用创建指导

## 1. 当前结构

每个应用分成三层：

```text
server/apps/<appname>/
gui/src/apps/<appname>/
language/<lang>/apps/<appname>/APP.md
```

统一约定：
- `server/apps/` 放应用后端
- `gui/src/apps/` 放应用前端
- `language/<lang>/apps/` 放应用说明文档
- 顶层 `apps/` 不是源码目录，只在语言应用阶段生成

系统级应用例外：
- `chat`
- `settings`
- `tasks`

这三个应用的说明文档仍放在 `language/<lang>/apps/`，但后端逻辑位于：
- `server/main/`
- `server/agent/`
- `server/llm/`
- `server/prompt/`

## 2. 必要文件

后端最少包含：

```text
server/apps/<appname>/
├── index.js
├── api/index.js
├── service/
└── repository/
```

前端最少包含：

```text
gui/src/apps/<appname>/
└── index.vue
```

如需被其他应用通过动作调用，再补：

```text
gui/src/apps/<appname>/intent.js
```

## 3. APP.md 规则

每个应用都要有：

```yaml
---
name: reader
description: 简短说明
backend: server/apps/reader
frontend: gui/src/apps/reader
database: database/apps/reader.db
---
```

源文件位置：

```text
language/<lang>/apps/reader/APP.md
```

规则：
- `name` 使用小写目录名
- `backend` 必须指向真实后端目录
- `frontend` 必须指向真实前端目录
- 如果没有独立数据库，写 `无`
- 正文保持简短，只写定位、路径、数据和入口

## 4. 后端入口

`server/apps/<appname>/index.js` 至少导出：

```js
export default {
  name: "reader",
  match: (path) => path.startsWith("/apps/reader/"),
  initDb,
  handleApi
};
```

必需项：
- `name`
- `match`
- `handleApi`

可选项：
- `initDb`
- `initRuntime`

注册位置：
- `server/apps/registry.js`

## 5. API 规则

- 应用 API 使用 `/apps/<appname>/*`
- 系统 API 使用 `/api/*`
- 路径写死，不做动态路由匹配
- 查询类参数走 query
- `api/index.js` 未命中时返回 `false`

示例：

```js
if (path === "/apps/reader/detail" && req.method === "GET") {
  const id = Number(url.searchParams.get("id") || 0);
  ...
}

return false;
```

## 6. 数据库规则

- 应用数据库位于 `database/apps/*.db`
- 系统共用数据库是 `database/aios.db`
- `repository/client.js` 负责连接
- `repository/init.js` 负责建表
- 结构保持简单，不要先上迁移系统

## 7. 前端注册

注册位置：
- `gui/src/apps.js`

示例：

```js
{
  id: "reader",
  name: "__T_APP_SIDEBAR_READER__",
  icon: "📚",
  desktopLoad: () => import("./apps/reader/index.vue"),
  mobileLoad: () => import("./apps/reader/mobile.vue"),
  intent: () => import("./apps/reader/intent.js"),
  defaultDesktopWindowSize: { w: 900, h: 640 }
}
```

规则：
- `id` 与应用目录一致
- `name` 优先使用语言 key
- `desktopLoad` 必须有
- `mobileLoad` 可选
- `intent` 可选

## 8. Intent 规则

应用之间有业务语义的调用，统一走 intent。

入口：

```js
import { openIntent } from "../system/intent.js";
```

载荷：

```js
await openIntent({
  app: "chat",
  action: "open",
  data: {}
});
```

规则：
- 有业务语义的动作写进 `intent.js`
- 纯窗口打开可以走窗口工具
- 只要带状态和业务含义，就不要绕过 intent

## 9. AI 调用

优先复用系统已有封装，不要每个应用自己重造一套 AI 编排。

常见入口：
- `agentTaskJson`
- `instantTaskJson`

## 10. 验证方式

不要在主仓库 `AIOS/` 里直接运行和调试。

统一在 `AIOS-dev` 验证：
- `node scripts/refresh.mjs`：保留当前测试数据，并自动应用中文
- `node scripts/restart.mjs`：清空测试数据，从零开始

## 11. 最低交付清单

- `language/<lang>/apps/<appname>/APP.md`
- `server/apps/<appname>/index.js`
- `server/apps/<appname>/api/index.js`
- `server/apps/<appname>/service/*.js`
- `server/apps/<appname>/repository/client.js`
- `server/apps/<appname>/repository/init.js`
- 在 `server/apps/registry.js` 中注册
- `gui/src/apps/<appname>/index.vue`
- 在 `gui/src/apps.js` 中注册
- 如有需要，补 `gui/src/apps/<appname>/intent.js`
