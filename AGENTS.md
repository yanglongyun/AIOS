# AGENTS.md — AIOS 协作说明

给在本仓库里工作的 AI / 开发者看的约定。AIOS = 本地 AI 操作系统内核,**system | apps 双轴**。

- origin: `https://github.com/realuckyang/AIOS.git`
- ESM(`type: "module"`)、TypeScript 源码、`node:sqlite`、React + Vite + Tailwind v4。
- Node ≥ 22.5。

## 命令

```bash
npm run ui          # 起主服务(9502) + 应用服务(9503) + Vite 前端(5173,开发)
npm start            # 只起后端两个服务(index.ts)
npm run ui:build    # 构建前端到 ui/dist
npm run typecheck    # tsc --noEmit(覆盖 server/** 与 index.ts)
```

端口:主 `AGENT_PORT`(默认 9502)、应用 `AGENT_APPS_PORT`(默认 9503)、Vite 5173。

## 目录结构(两条对称轴)

```
server/
  system/        系统服务(内核)
    ai/          无状态执行器:agent loop(ai/index.ts)、runner、tools(单一 shell)
    ai/llm/      多 provider 流式:common + stream + parsers/{openai,deepseek,kimi,gemini}
    api/         路由入口(api/services/repository 三层对称)
    services/    chat / tasks / monitors / settings / prompt(分段拼 system prompt)
    repository/  SQLite 数据访问(主库 database/system.db)
    runtime/     http / ws / realtime(wakeConversation) / static / appsProxy
    index.ts     startServer
  apps/          应用服务(第二个服务)
    index.ts     startAppsServer:按 app.match(path) 分发
    registry.ts  已注册 app 的 loader 列表
    _shared/     createAppDb(每 app 独立库) + http 工具
    <id>/        每个 app 的后端,默认导出 { name, match, handleApi, initDb }
ui/src/
  system/        系统侧:components(外壳) / state / lib / views(5 个内置功能) / api.ts
  apps/          应用侧:<id>/index.tsx(默认导出 React 组件) + registry.ts + lib.ts
  App.tsx        路由:工作区路由 + #/app/:id + #/create-app
apps/<id>/APP.md 每个 app 的说明书(AI 读它来操作/重建)
database/        主库 system.db + apps/<id>.db(全部 gitignore)
dev/             文档 / 贡献 / demo / 行业资讯 / timeline(归档,勿动结构)
```

## 关键约定

- **新建一个 app**:参考现有 app 样板。五件套 = 后端(`server/apps/<id>`)+ 后端注册(`server/apps/registry.ts`)+ 前端(`ui/src/apps/<id>`)+ 前端注册(`ui/src/apps/registry.ts`,新图标改 MainNav 的 `appIconMap`)+ `apps/<id>/APP.md`。app 只碰自己的 `/apps/<id>/*` 与自己的库。
- **system prompt** 在 `server/system/services/prompt/` 分段拼:default / environment / model / tools / apps / chats。改提示词在这里。
- **监视器**是「对话间传递通道」:任务完成 → `publishMonitorEvent` → 投递 `[MONITOR]` 消息进目标会话 → `wakeConversation` 唤醒其 AI。后端保留、无独立 UI。
- **流式**:`ai/index.ts` 默认走 `callLlmStream` emit `delta` → WS `delta` → 前端流式气泡;`stream:false` 回退非流式。聊天 REST 对齐 `/api/chat/*`。
- 服务端 `.ts` 文件首行 `// @ts-nocheck`(`strict:false`);导入写 `.js` 后缀。

## 提交注意

- 本地数据库、`node_modules`、`ui/dist`、运行日志均已 gitignore;提交前查 `git status`,不要把运行态数据 / API Key(在 `database/` 里)提交。
