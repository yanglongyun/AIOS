<div align="center">

# AIOS

### 让 AI 成为你的操作系统。

一个本地运行的 AI 操作系统内核: 对话、任务、应用和技能都在本机完成。

</div>

---

## 这是什么

AIOS 不是传统管理硬件的 OS,而是一个本地 Agent 系统:

- **system**: 对话、任务、设置、WebSocket、LLM、工具调用和系统数据库。
- **apps**: 每个应用有自己的后端接口和独立 SQLite 数据库,统一挂在 `/apps/<id>/*`。
- **ui**: Vue + JS 前端,包含对话、应用、任务和设置。
- **language**: 出厂语言包。启动前烘焙成运行时文案、APP.md 和 SKILL.md。

核心原则是干净、本地、可被 AI 修改。代码使用 JavaScript 和 Vue,不再使用 TypeScript / React。

---

## 架构

```text
server/
  system/        系统服务: chat / tasks / settings / ai / ws / repository
  apps/          应用服务: notepad / todo / ledger + registry
ui/
  src/           Vue 前端
language/
  zh|en/
    ui/          前端 token
    server/      后端与提示词 token
    apps/        APP.md 源
    skills/      SKILL.md 源
scripts/
  start.mjs      烘焙 language/<locale> 到运行时
  run.mjs        同时启动 system + apps
```

运行时生成目录:

```text
apps/            由 language/<locale>/apps 烘焙生成
skills/          由 language/<locale>/skills 烘焙生成
.aios/           记录当前已烘焙 locale
database/        SQLite 数据
ui/dist/         Vite 构建产物
```

这些运行时目录不作为源码维护。

---

## 安装与运行

环境: Node.js >= 22.5,需要内置 `node:sqlite`。

```bash
git clone https://github.com/realuckyang/AIOS.git
cd AIOS
npm install

npm start      # 启动 system(:9502) + apps(:9503)
npm run ui     # 另开终端启动 Vite(:5173)
```

打开:

```text
http://127.0.0.1:5173/
```

常用脚本:

```bash
npm run build       # 烘焙语言包并构建 ui/dist
npm run lang:apply  # 强制按当前语言重新烘焙
npm run check       # JS 语法检查
```

语言选择:

```bash
AIOS_LANG=en npm start
AIOS_LANG=zh npm start
```

默认语言是 `zh`。

---

## 烘焙机制

`scripts/start.mjs` 会在 `prestart` / `prebuild` / `predev` 阶段执行:

1. 读取 `language/<locale>/**/*.json`。
2. 把源码里的 token 占位符替换成当前语言文案。
3. 把 `language/<locale>/apps/<id>/APP.md` 镜像到 `apps/<id>/APP.md`。
4. 把 `language/<locale>/skills/<id>/SKILL.md` 镜像到 `skills/<id>/SKILL.md`。
5. 写入 `.aios/settings.json` 记录当前 locale。

切换语言时重新运行 `AIOS_LANG=<locale> npm run lang:apply`。

---

## API

| 资源 | 路径 |
|---|---|
| 心跳 | `GET /api/health` |
| 实时事件 | `WS /ws` |
| 对话 | `/api/chat/list` · `/api/chat/create` · `/api/chat/messages` · `/api/chat/rename` · `/api/chat/delete` |
| 任务 | `GET / POST / PATCH /api/tasks` |
| 设置 | `/api/settings` · `/api/settings/models` |
| 文件 | `/api/fs/*` |
| 应用 | `/apps/<id>/*` |

---

## 技术栈

Node.js · JavaScript · Vue 3 · Pinia · Vite · Tailwind v4 · `node:sqlite` · ws · OpenAI-compatible streaming LLM.

## License

[MIT](./LICENSE)
