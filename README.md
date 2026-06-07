<div align="center">

# AIOS

### 让 AI 成为你的操作系统。

一个本地运行的 AI 操作系统内核:**应用即入口,对话是应用之一**。
干净的 system / apps 双轴架构,跑在你自己的机器上。

</div>

---

## 🧭 这是什么

AIOS 不是传统管理硬件的 OS,而是**产生应用、使用应用、管理应用**的地方。

- **系统(system)**:一个本地 Agent 内核 —— 大脑(可流式、多 provider 的模型)+ 一个 `shell` 工具 + SQLite 持久化,接口收口到 HTTP + WebSocket。
- **应用(apps)**:每个 app 自带后端 + 独立 SQLite 库,彼此隔离,只通过 `/apps/<id>/*` 暴露。应用不是装出来的,是你在对话里**让 AI 用 shell 现场建出来的**。

> 关于「为什么是 OS」「理念是什么」,见 [`dev/doc/`](./dev/doc) 下的长文。

---

## 🧱 架构(双服务 · system | apps 两条对称轴)

```
主服务  :9502   系统内核 — chat / tasks / settings + ai + 订阅 + 托管 GUI
应用服务 :9503   应用后端 — 每个 app 自带后端 + 独立库

server/                      ui/src/
  system/   系统服务            system/   系统侧(外壳 + 内置功能 + 状态 + api)
    ai/     无状态执行器          components/ state/ lib/ views/ api.ts
    ai/llm/ 多 provider 流式      apps/     应用侧
    api/ services/ repository/   apps/     notepad / todo / ledger + registry
    runtime/ + index.ts
  apps/     应用服务
    _shared/ notepad/ todo/ ledger/
apps/         各 app 的 APP.md(AI 读它来操作/重建应用)
database/     SQLite(主库 system.db + apps/<id>.db,各自独立)
```

- 同进程启动两个服务;开发模式 Vite 代理 `/api → 9502`、`/apps → 9503`,生产模式主服务反代 `/apps`。

---

## ✨ 能做什么

- 💬 **流式多 provider 对话** —— 任意 **OpenAI 兼容**接口,逐字流式。OpenAI / DeepSeek / Kimi / Qwen / GLM / OpenRouter 等原生兼容(DeepSeek/Kimi 思维链自动收集);Gemini / Claude 走各自的 OpenAI 兼容端点或网关。
- 🛠 **一个 `shell` 工具** —— 模型用真实命令解决问题,`tool_calls` ↔ `tool_results` 自动闭环。
- 🧩 **应用(apps)** —— 内置记事本 / 待办 / 记账本三个样板;每个独立后端 + 独立库 + 前端 + `APP.md`。
- 🌱 **创建应用** —— 侧边栏品牌区 `+` → 描述需求 → AI 参考现有样板用 shell 把全栈应用写进系统。
- 📋 **后台任务 + 订阅** —— 起异步任务;任务完成后订阅把结果回传到目标对话。
- ⚙️ **设置** —— `/api/settings` 管理模型接入与 system prompt。
- 💾 **数据 100% 本地** —— 全部落在本机 SQLite,断网可用。

---

## 🚀 安装与运行

环境:Node.js ≥ 22.5(用到内置 `node:sqlite`)。

```bash
git clone https://github.com/realuckyang/AIOS.git   # 或 git clone git@gitee.com:realuckyang/aios.git
cd AIOS
npm install

npm start           # 起后端两个服务(主 9502 / 应用 9503)
npm run ui          # 另开终端起 Vite 前端(开发模式)
```

> 仓库同步两个远端:GitHub `realuckyang/AIOS` 与 Gitee `realuckyang/aios`,`main` 指向同一提交。

打开 **http://127.0.0.1:5173/**,进「设置 → 模型接入」填好 API URL / Key / 模型(可选 Provider),回到「对话」即可。

其它脚本:

```bash
npm run server       # 同 npm start,只起后端两个服务(主 9502 / 应用 9503)
npm run ui           # 只起 Vite 前端(5173)
npm run ui:build    # 构建前端到 ui/dist(生产由主服务托管)
npm run typecheck    # tsc --noEmit
```

---

## 📡 API

| 资源 | 方法 + 路径 |
|---|---|
| 心跳 | `GET /health` |
| 实时事件 | `WS /ws`(`start` / `message` / `tool_calls` / `tool_results` / `done` / `aborted` / `error`) |
| 对话 | `/api/chat/list` · `/api/chat/create` · `/api/chat/messages` · `/api/chat/rename` · `/api/chat/delete` |
| 任务 | `GET / POST / PATCH /api/tasks` |
| 设置 | `/api/settings` · `/api/settings/models` |
| 应用(独立服务) | `/apps/<id>/*`(如 `/apps/notepad/notes`) |

---

## 对话与订阅

一段对话连同它的上下文,本身就是一个可被调度的 agent。订阅是任务和对话之间的回传关系:一个对话派出的后台任务在独立 chat 里运行,完成后其结果按订阅投回目标对话。

因此触发并不只来自用户输入,也可以来自任务完成后的结果回传。沿这条路往下,是让模型主动发起任务,再把结构化结果带回当前对话继续处理。

---

## 🛠 技术栈

Node.js 22+ · TypeScript · React 19 · Vite · Tailwind v4 · `node:sqlite` · ws · 单一 `shell` 工具 · 流式多 provider LLM。

## 📜 License

[MIT](./LICENSE)
