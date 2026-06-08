---
name: app-development
description: AIOS 应用开发指导。说明主项目的应用结构、API 规则、数据库写法、前端放置与本机启动验证流程。
---

# 应用开发指导

你在 AIOS 主项目里工作。这是一个本机运行的 OSS 项目。可以改前端、改后端、建表、装包、重启服务、读写文件。目标是把代码放在正确层级里,保持清晰、可读、可维护。

## 工作目录

shell 默认 cwd 是 AIOS 项目根目录。常用路径:

- 后端应用: `server/apps/<appname>/`
- 前端应用: `ui/src/apps/<appname>/`
- 应用说明源: `language/<locale>/apps/<appname>/APP.md`
- 烘焙后的应用说明: `apps/<appname>/APP.md`
- `ui/dist/` 是 Vite 输出,不要直接编辑

## 服务端口

- 主服务: `http://127.0.0.1:9502`
- 应用服务: `http://127.0.0.1:9503`
- 前端开发服务: `http://127.0.0.1:5173`

主服务代理 `/apps/*` 到应用服务。开发时优先从前端访问,需要确认后端状态再 curl `/api/health` 和 `/apps/health`。

## 后端结构

```
server/apps/<appname>/
└── index.js              # 默认导出 { name, match, handleApi, initDb? }
```

基础应用保持轻量,可以先放在一个 `index.js` 里,但要把 DDL、查询、业务、HTTP 分发用清晰函数隔开。应用明显变复杂后,再按 `api/`、`service/`、`repository/` 拆分,不要提前制造空目录。

新应用需要注册:

- `server/apps/registry.js` 加载后端入口
- `ui/src/apps.js` 注册前端入口

验证注册:

```sh
curl http://127.0.0.1:9503/apps/health
```

## API 约定

- 路由: `/apps/<appname>/<action>`
- 查询用 GET,创建用 POST + JSON body,修改用 PATCH + JSON body,删除用 DELETE
- `readBody(req)` 读取 body
- `sendJson(res, statusCode, payload)` 返回 JSON
- 未命中的路由返回 `false`
- 用户请求协议错误返回 400;模型/服务内部错误不要伪装成 400

## 数据库

- 应用数据库使用 `createAppDb("<appname>.db")`
- 系统数据库不要混入应用表
- 轻量应用的 DDL 放在 app 后端入口里的 `initDb` / `createSchema` 函数
- 查询用专门函数封装,不要散在 HTTP 分支里

新表要干净定义。不要为了兼容旧设计把无用字段长期留在新结构里;不要在 app 初始化里写旧结构探测、自动迁移或自动 drop。

## 前端结构

```
ui/src/apps/<appname>/
├── index.vue
├── components/
├── views/
├── composables/
└── api.js
```

应用入口优先保持清晰。简单应用可以先是单文件;复杂后再拆 views / components / composables / api.js,不要为了形式拆空壳。

## 本机验证

常用命令:

```sh
npm run check
npm start
npm run ui
```

启动后确认:

```sh
curl http://127.0.0.1:9502/api/health
curl http://127.0.0.1:9503/apps/health
```

改后端需要重启对应服务。改前端时 Vite 会热更新,构建前再跑 `npm run build`。

## 系统应用

`chat`、`settings`、`tasks` 是系统能力,不放在 `server/apps/` 的普通应用目录下。修改它们前先看现有分层,保持命名和事件语义一致。
