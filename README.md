# AIOS

> *Cogito, ergo sum.* — 我思故我在

你的 AI，你的系统。

AIOS 是一个运行在本地的开源 AI 系统。它能控制你的计算机、创建属于你的应用、记住你的一切——越用越懂你。

## 哲学

大多数 AI 产品在做加法——更多工具、更多插件、更多抽象层。AIOS 反其道而行。

**一个工具：shell。** 搜索、编码、部署、读写文件、操作数据库——任何你在终端能做的事，AI 都能做。不需要 MCP，不需要插件体系，shell 本身就是万能工具。有了 shell，你就有了一切。

**对话不能取代图形界面。** 你不会用对话来记账，不会用对话管理待办。未来不会流于无形，依然留于物形。AIOS 左侧不是无用的对话历史，而是一个个有形的应用——由 AI 按照你的意图构建，体现着你的需求、习惯和偏好。

**共生，而非使用。** AI 了解你的应用、你的数据、你的偏好。你在改造它，它也在积累经验。这不是一个工具，是一个与你共生的系统。

## 快速开始

```bash
git clone https://github.com/valueriver/aios.git
cd aios
npm install
npm run build
npm start              # 主服务，端口 9700
node apps/index.js     # 应用服务，端口 9701
```

打开 http://localhost:9700，在设置页配置 API Key 和模型即可使用。

### CLI

```bash
npm install -g .
aios    # 在终端直接与 AI 对话
aios start  # 启动主服务(9700)和应用服务(9701)
aios stop   # 停止主服务和应用服务
```

CLI 会自动检测并拉起本地服务。

### 一键安装（服务器）

```bash
git clone https://github.com/valueriver/aios.git
cd aios
bash install.sh
```

## 运行架构

两个独立进程，可分别启停：

| 服务 | 端口 | 职责 |
|------|------|------|
| `server/` | 9700 | 聊天、WebSocket、LLM 网关、设置、UI 托管 |
| `apps/` | 9701 | 各应用的 API |

应用若需调用大模型，统一走主服务网关，无需自行配置 Key：

```
POST http://localhost:9700/api/llm/chat
{ "messages": [...] }
```

## 内置应用

当前内置：

- **记事本** — 笔记记录与整理
- **记账本** — 收支记录

## 项目结构

```
server/          # 主服务（9700）
  agent/         # Agent 循环、LLM 调用、shell 执行
  api/           # chat / settings / llm 网关
  system/        # HTTP、WebSocket、事件处理
  db/

apps/            # 应用服务（9701）
  notebook/
  finance/

ui/src/
  App.vue        # 顶部栏 + NavPanel + RouterView
  components/NavPanel.vue
  views/

cli/aios.js      # 命令行入口
database/        # SQLite 数据库
memory/         # AI 知识库
```

## 技术栈

- Vue 3 + Vite + Tailwind CSS v4
- Node.js + WebSocket + SQLite
- OpenAI Chat Completions 兼容格式（支持 OpenRouter / OpenAI / 任意兼容供应方）
