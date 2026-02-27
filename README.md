# aios

> *Cogito, ergo sum.* — 我思故我在

一个极简的本地 AI Agent。核心原语只有一个：**shell**。

## 哲学

大多数 Agent 框架在做加法——更多工具、更多插件、更多抽象层。aios 反其道而行。

**一个工具：shell。** 搜索、编码、部署、数据处理——任何你在终端能做的事，AI 都能做。不需要为每个能力写一个 tool，shell 本身就是万能工具。

只保留 shell，意味着最小抽象和最高自由度。

## 快速开始

```bash
git clone https://github.com/valueriver/aios.git
cd aios
npm install
cp .env.example .env
```

```bash
npm run build   # 构建前端
npm start       # 启动系统（server + apps）
```

打开 http://localhost:3000 ，在设置页配置供应方、模型 Key、模型即可使用。

## 一键安装（服务器）

适用于 Ubuntu / Debian：

```bash
git clone https://github.com/valueriver/aios.git
cd aios
bash scripts/install.sh
```

可选参数（环境变量）：

```bash
REPO_URL=https://github.com/valueriver/aios.git \
APP_DIR=/opt/aios \
APP_NAME=aios \
DOMAIN=agent.example.com \
LOCAL_PORT=3000 \
APPS_PORT=3001 \
bash scripts/install.sh
```

服务管理：

```bash
systemctl status aios
systemctl restart aios
journalctl -u aios -f
```

## 运行架构

- `index.js` 是总入口，启动两个服务
- `server` 主服务（默认 `3000`）：聊天、WS、系统设置、记忆、UI 托管
- `apps` 应用服务（默认 `3001`）：应用 API（当前 notebook）
- 主服务会把 `/api/apps/*` 代理到应用服务，前端无需改请求路径

## 数据库

- 系统库：`aios.db`
  - `chats`
  - `messages`
  - `settings`
  - `memories`（AI 内建记忆，支持 `title/pin`）
- 应用库：`aios-apps.db`
  - `apps_notes`（用户记事本）

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LOCAL_PORT` | 主服务端口 | `3000` |
| `APPS_PORT` | 应用服务端口 | `3001` |

## 项目结构

```bash
index.js
apps/
  index.js                 # 应用服务入口（独立 HTTP 服务）
  db/
    client.js              # 应用数据库连接（aios-apps.db）
  utils/
    json.js
    readBody.js
  notebook/
    README.md              # 应用元信息（name/description）
    index.js               # notebook 应用入口
    db.js                  # notebook 数据访问
    api/
      list.js
      create.js
      update.js
      delete.js
server/
  index.js                 # 主服务入口
  system/
    http.js                # HTTP + 静态资源 + /api/apps 代理
    ws.js                  # WebSocket 服务
    event.js               # 会话事件处理
    apps.js                # 读取 apps/*/README.md 元信息
  db/
    client.js              # 系统数据库连接（aios.db）
    init.js                # 系统库初始化 + 默认提示词
  api/
    index.js
    chat/
    settings/
    memories/
  agent/
    chat.js                # Agent 循环
    llm.js                 # LLM 调用
    tools.js               # 工具定义（shell）
    runner.js              # shell 执行
    prompt.js              # 提示词构建（注入置顶记忆/应用目录）
ui/
  src/
    App.vue
    router/
      index.js
    views/
      ChatView.vue
      SettingsView.vue
      apps/
        NotebookView.vue
    ws.js
    components/
      Sidebar.vue
      chat/
        History.vue
      settings/
        ModelTab.vue
        InstructionTab.vue
        ConversationTab.vue
        MemoryTab.vue
        ContextTab.vue
        GeneralTab.vue
      apps/
        notebook/
          NotebookComposer.vue
          NotebookItem.vue
```

## 技术栈

- Vue 3 + Vite + Tailwind CSS v4
- Node.js + WebSocket + SQLite
- OpenAI Chat Completions 兼容格式（可接 OpenRouter/OpenAI）
