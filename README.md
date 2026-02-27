# AIOS

> 以对话为中心的个人 AI 操作系统

AIOS 是一个运行在本地的个人 AI 智能助理。它不只是一个聊天机器人——它可以通过 shell 控制你的计算机，并由 AI 创建、管理专属于你的图形界面应用，让 AI 真正成为你的个人操作系统。

## 设计哲学

**一个工具：shell。** 搜索、编码、部署、读写文件、操作数据库——任何你在终端能做的事，AI 都能做。没有 MCP，没有插件体系，没有多工具抽象，shell 本身就是万能工具。

**对话 + 图形界面。** 对话是最自然的交互方式，但它不能替代图形界面。你不会用对话来记账，不会用对话来管理待办。AIOS 的左侧不是对话历史的堆砌，而是一个个有形的应用——由 AI 按照你的意图构建，为你服务。

**越用越懂你。** AI 了解你的应用、你的数据、你的偏好。你在改造它，它也在积累经验。

## 快速开始

```bash
git clone https://github.com/valueriver/aios.git
cd aios
npm install
npm run build   # 构建前端
npm start       # 启动主服务（端口 9700）
node apps/index.js  # 启动应用服务（端口 9701）
```

打开 http://localhost:9700，在设置页配置模型供应方、API Key 和模型即可使用。

### CLI 使用

```bash
npm install -g .
aios          # 在终端直接与 AI 对话
```

CLI 会自动检测并拉起本地服务，无需手动启动。

## 运行架构

两个独立进程，可分别启停：

| 服务 | 端口 | 职责 |
|------|------|------|
| 主服务 `server/` | 9700 | 聊天、WebSocket、LLM 网关、设置、UI 托管 |
| 应用服务 `apps/` | 9701 | 各应用的 API（记事本、记账、智能列表等） |

主服务把 `/api/apps/*` 代理到应用服务，前端无需关心跨端口问题。

应用若需要调用大模型，统一走主服务的 LLM 网关：

```
POST http://localhost:9700/api/llm/chat
{ "messages": [...] }
```

## 界面结构

```
┌─────────────────────────────────────────────────┐
│  ☰  AIOS                          （顶部栏）     │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  聊天    │                                      │
│  ──────  │         内容区（RouterView）          │
│  应用    │                                      │
│  智能列表│                                      │
│  记事本  │                                      │
│  记账本  │                                      │
│          │                                      │
│  ⚙ 设置  │                                      │
└──────────┴──────────────────────────────────────┘
  NavPanel    （移动端：汉堡菜单展开/收起）
```

## 内置应用

| 应用 | 说明 |
|------|------|
| 智能列表 | AI 辅助的任务清单 |
| 记事本 | 支持 AI 编辑的笔记 |
| 记账本 | 收支记录与统计 |
| 文件管理器 | 本地文件浏览 |
| 大纲 | 树形结构笔记 |

AI 可以在对话中为你创建新应用，并自动注册到导航面板。

## 项目结构

```
apps/                        # 应用服务（端口 9701）
  index.js                   # 应用服务入口
  db/client.js               # 应用数据库连接
  utils/
  notebook/                  # 记事本应用
  smartlist/                 # 智能列表
  finance/                   # 记账本
  files/                     # 文件管理器
  outline/                   # 大纲

server/                      # 主服务（端口 9700）
  index.js
  system/
    http.js                  # HTTP + 静态资源 + 代理
    ws.js                    # WebSocket
    event.js                 # 会话事件处理（含 AbortController）
    apps.js                  # 读取应用元信息
  db/
    client.js
    init.js
  api/
    chat/                    # 对话 CRUD
    settings/                # 设置
    llm/                     # LLM 网关（供应用调用）
  agent/
    chat.js                  # Agent 主循环
    llm.js                   # LLM 调用
    tools.js                 # 工具定义（shell）
    runner.js                # shell 执行
    prompt.js                # 提示词构建

cli/
  aios.js                    # 命令行入口

ui/src/
  App.vue                    # 顶部栏 + NavPanel + RouterView
  components/
    NavPanel.vue             # 左侧导航面板
    chat/History.vue
    settings/
    apps/
  views/
    ChatView.vue
    SettingsView.vue
    apps/

database/                    # SQLite 数据库文件
library/                     # AI 知识库（overview.md、create-app.md 等）
```

## 数据库

- `database/aios.db`：系统库（chats、messages、settings）
- `database/aios-apps.db`：应用库（各应用数据表）

## 技术栈

- **前端**：Vue 3 + Vite + Tailwind CSS v4
- **后端**：Node.js + WebSocket (ws) + SQLite (better-sqlite3)
- **AI**：OpenAI Chat Completions 兼容格式（可接 OpenRouter / OpenAI / 任意兼容供应方）
