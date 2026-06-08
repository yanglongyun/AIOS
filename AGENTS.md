# AGENTS.md — AIOS 协作说明

给在本仓库里工作的 AI / 开发者看的约定。AIOS = 本地 AI 操作系统内核,按 **system / apps / ui / language** 组织。

- origin: `https://github.com/realuckyang/AIOS.git`
- ESM(`type: "module"`)、JavaScript 源码、Vue + Vite + Tailwind v4、`node:sqlite`。
- 不使用 TypeScript / React。
- Node >= 22.5。

## 命令

```bash
npm start          # 启动 system(:9502) + apps(:9503)
npm run dev        # 同 npm start
npm run ui         # 启动 Vite 前端(:5173)
npm run build      # 烘焙语言包并构建 ui/dist
npm run check      # JS 语法检查
npm run lang:apply # 强制按当前语言重新烘焙
```

端口:

- system: `AGENT_PORT` / `AIOS_MAIN_PORT`,默认 `9502`
- apps: `AGENT_APPS_PORT` / `AIOS_APPS_PORT`,默认 `9503`
- Vite: 默认 `5173`

## 目录结构

```text
server/
  system/        系统服务:api / services / repository / ai / ws / runtime
  apps/          应用服务:notepad / todo / ledger + registry
ui/
  src/
    apps/        应用前端:<id>/index.vue
    system/      系统外壳、任务视图、应用列表等
    App.vue      前端入口视图
language/
  zh|en/
    ui/          前端 token
    server/      后端与提示词 token
    apps/        APP.md 源
    skills/      SKILL.md 源
scripts/
  start.mjs      烘焙 language/<locale> 到运行时
  run.mjs        同时启动 system + apps
apps/            运行时 APP.md,由 language/<locale>/apps 烘焙生成
skills/          运行时 SKILL.md,由 language/<locale>/skills 烘焙生成
database/        system.db + apps/<id>.db,全部 gitignored
dev/             文档 / 贡献 / demos / test / timeline
```

运行时目录 `apps/`、`skills/`、`.aios/`、`database/`、`ui/dist/` 不作为源码维护。

## 应用约定

- 每个 app 有自己的后端目录 `server/apps/<id>/`、自己的 SQLite 库 `database/apps/<id>.db`、自己的前端 `ui/src/apps/<id>/index.vue`。
- 应用只通过 `/apps/<id>/*` 暴露接口,不直接写 system 数据库。
- 注册后端 app:修改 `server/apps/registry.js`。
- 注册前端 app:修改 `ui/src/apps.js`。
- APP 说明源文件在 `language/<locale>/apps/<id>/APP.md`,启动/构建时烘焙到 `apps/<id>/APP.md`。
- 当前基础应用:
  - `notepad`:笔记保存 + 智能润色/精简/扩写,结果由用户采纳后写入。
  - `todo`:今天/以后分区、高优先级、智能拆解子任务。
  - `ledger`:一句话智能输入,解析预览后确认记账。

## 系统约定

- 对话、任务、设置、文件、LLM、WebSocket 归 `server/system/`。
- 主库在 `database/system.db`,DDL 在 `server/system/repository/db.js`。
- 应用库在 `database/apps/<id>.db`,DDL 在各 app 后端里。
- WebSocket 事件走 `server/system/ws/`,按 `type` 分发。
- 模型供应商列表在 `server/system/ai/llm/models.js`。
- 提示词在 `server/system/services/prompt/` 分段拼接。

## 语言与烘焙

- 源文案只维护 `language/<locale>/...`。
- `scripts/start.mjs` 会:
  - 替换源码里的 `__T_*__` token。
  - 镜像 `language/<locale>/apps/*/APP.md` 到 `apps/`。
  - 镜像 `language/<locale>/skills/*/SKILL.md` 到 `skills/`。
  - 写 `.aios/settings.json` 记录当前 locale。
- 切换语言:

```bash
AIOS_LANG=en npm run lang:apply
AIOS_LANG=zh npm run lang:apply
```

## 提交注意

- 提交前运行 `npm run check` 和 `npm run build`。
- 不提交数据库、运行日志、`node_modules`、`ui/dist`、`.aios`、API Key。
- 不把兼容迁移、兜底解析、假数据、demo app 塞进主链路。
- 协议错误用明确 `400`;模型/服务内部错误不要伪装成用户请求错误。
