# AIOS 系统架构文档

## 1. 系统概览

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Tailwind CSS |
| 后端 | Node.js + better-sqlite3 |
| AI | OpenAI 兼容格式 API（流式 + 常规） |
| 通信 | WebSocket（ws 库） |

### 双服务架构

```
                ┌─────────────────────────────────────┐
                │           浏览器客户端                │
                │   Vue 3 + WebSocket + HTTP          │
                └──────────┬───────────┬──────────────┘
                           │           │
                      WebSocket     HTTP
                           │           │
                ┌──────────▼───────────▼──────────────┐
                │        主服务 :9700                   │
                │  ┌─────────────────────────────┐    │
                │  │ /ws    → WebSocket 消息处理   │    │
                │  │ /api/  → 核心 API            │    │
                │  │ /apps/ → 代理到 :9701         │    │
                │  │ /files/→ 文件服务             │    │
                │  │ /      → 静态资源 (ui/dist)   │    │
                │  └─────────────────────────────┘    │
                └──────────────────┬───────────────────┘
                                   │ HTTP 代理
                ┌──────────────────▼───────────────────┐
                │        Apps 服务 :9701                │
                │  ┌─────────────────────────────┐    │
                │  │ /apps/notebook/  → 笔记 API   │    │
                │  │ /apps/subscriber/→ 订阅 API   │    │
                │  │ /apps/cryptobot/ → 交易 API   │    │
                │  │ /apps/finance/   → 记账 API   │    │
                │  │ /apps/reader/    → 阅读 API   │    │
                │  │ /apps/fortune/   → 算卦 API   │    │
                │  │ /apps/poker/     → 扑克 API   │    │
                │  │ /apps/banana/    → 老手机 API  │    │
                │  └─────────────────────────────┘    │
                └──────────────────────────────────────┘
```

### 目录结构

```
AIOS/
├── server/                    # 主服务
│   ├── index.js               # 入口：启动 HTTP + WebSocket + 调度器
│   ├── system/                # 系统基础设施
│   │   ├── http.js            # HTTP 服务器 + 路由分发
│   │   ├── ws.js              # WebSocket 连接管理 + broadcast
│   │   ├── dir.js             # 系统目录初始化
│   │   ├── access.js          # 请求权限校验
│   │   └── llm/               # LLM 调用
│   │       ├── stream.js      # 流式调用（SSE 解析）
│   │       ├── regular.js     # 常规调用（一次性返回）
│   │       └── common.js      # 请求头构建
│   ├── api/                   # API 路由
│   │   ├── index.js           # 路由分发（/api/auth, /api/chat, /api/task ...）
│   │   ├── task.js            # 任务 CRUD + 调度管理
│   │   └── ...
│   ├── chat/                  # 聊天系统
│   │   ├── index.js           # WebSocket 消息处理 + 并发控制
│   │   └── prompt/            # System Prompt 构建
│   │       ├── index.js       # 分层拼接入口
│   │       ├── INSTRUCTION.md # 全局身份与硬规则
│   │       ├── apps.js        # 应用列表注入
│   │       ├── environment.js # 运行环境信息
│   │       ├── language.js    # 语言偏好
│   │       ├── memory.js      # 记忆索引
│   │       ├── model.js       # 模型信息
│   │       ├── tools.js       # 工具规则
│   │       ├── skills.js      # 技能列表
│   │       └── chats.js       # 会话上下文
│   ├── agent/                 # Agent 引擎
│   │   ├── handler.js         # chat() 主循环
│   │   ├── tools.js           # 工具定义
│   │   ├── runner.js          # 工具执行 + 结果截断
│   │   ├── functions.js       # 工具函数实现（shell）
│   │   └── utils.js           # normalizeAgentMessages 消息规范化
│   ├── repository/            # 数据访问层
│   │   ├── client.js          # better-sqlite3 实例
│   │   ├── init.js            # 主数据库 schema
│   │   ├── chat/              # 对话操作
│   │   ├── task/              # 任务操作
│   │   └── settings/          # 设置读写
│   └── service/               # 业务逻辑层
│       ├── task/
│       │   ├── create/
│       │   │   ├── agent.js   # Agent Task 执行
│       │   │   └── instant.js # Instant Task 执行
│       │   ├── execution.js   # 执行状态管理（Map）
│       │   ├── schedule/
│       │   │   ├── scheduler.js # 调度主循环（每分钟 tick）
│       │   │   └── cron.js    # Cron 表达式解析
│       │   └── ...
│       ├── chat/              # 对话业务
│       └── settings/          # 设置业务
├── apps/                      # 应用服务
│   ├── index.js               # Apps 服务入口
│   ├── registry.js            # 应用注册表（动态导入）
│   ├── app_shared/            # 应用共享函数
│   │   ├── agentTask.js       # agentTask() → POST /api/task/create/agent
│   │   └── instantTask.js     # instantTask() → POST /api/task/create/instant
│   └── <app>/                 # 各应用模块（详见 §9）
├── ui/                        # 前端
│   ├── src/
│   │   ├── main.js            # Vue 入口
│   │   ├── App.vue            # 根组件（导航 + 面板 + 路由视图）
│   │   ├── ws.js              # WebSocket 客户端（响应式）
│   │   ├── router/index.js    # 路由配置
│   │   ├── stores/            # 全局状态
│   │   │   ├── chatPanel.js   # 聊天面板控制
│   │   │   └── toast.js       # 消息提示
│   │   ├── components/        # 组件
│   │   │   ├── ChatPanel.vue  # 聊天面板
│   │   │   ├── TasksPanel.vue # 任务面板
│   │   │   ├── NavPanel.vue   # 侧边导航
│   │   │   └── apps/          # 各应用子组件
│   │   ├── views/             # 页面视图
│   │   │   ├── ChatView.vue   # 聊天主页
│   │   │   ├── apps/          # 各应用主视图
│   │   │   └── ...
│   │   └── i18n/              # 国际化
│   │       ├── index.js       # i18n 引擎
│   │       └── messages/      # zh/ + en/ 翻译文件
│   └── vite.config.js
├── database/                  # SQLite 数据库文件
│   ├── aios.db                # 主数据库
│   └── apps/                  # 各应用独立数据库
├── memory/                    # 记忆系统
│   └── index.md               # 记忆索引（注入到 System Prompt）
├── files/                     # 文件系统
│   ├── uploads/
│   ├── exports/
│   └── tmp/
└── skills/                    # 技能目录
    └── <skill>/SKILL.md
```

---

## 2. 启动与重启

### 启动流程

```bash
# 开发模式（并行启动三个进程）
npm run dev
# 等价于：node server/index.js & node apps/index.js & vite ui

# 生产模式
npm start          # 主服务 :9700
npm run start:apps # Apps 服务 :9701
```

### 初始化顺序（server/index.js）

```
1. initSystemDirs()       → 创建 files/、memory/ 等目录
2. initDatabase()         → 初始化主数据库 schema
3. setupWebSocket(server) → 建立 WebSocket 连接
4. startTaskScheduler()   → 启动任务调度器（每分钟 tick）
5. httpServer.listen(9700)→ 开始监听
```

### Apps 服务初始化顺序（apps/index.js）

```
1. loadRegisteredApps()   → 从 registry.js 动态导入所有应用模块
2. bootAppRuntimes()      → 遍历每个应用：
   ├─ initDbForApp(app)   → 初始化应用数据库
   └─ app.initRuntime()   → 启动应用运行时（如定时任务）
3. appsServer.listen(9701)→ 开始监听
```

### 热重载

AI 修改代码后，通过 API 请求重载：

```
POST /api/system/reload/request
```

主服务收到请求后执行前端编译并重启进程。

---

## 3. 后端架构

### HTTP 路由分层

```
请求进入
  │
  ├── /ws           → WebSocket 升级（ws.js 处理）
  ├── /api/*        → handleApiRequest() → 核心 API 路由
  │   ├── /api/auth/    → 认证（登录、注销）
  │   ├── /api/system/  → 系统信息（初始化状态、重载）
  │   ├── /api/chat/    → 对话 CRUD
  │   ├── /api/task     → 任务 CRUD + 调度管理
  │   ├── /api/settings → 设置读写
  │   ├── /api/files/   → 文件管理
  │   └── /api/skills   → 技能列表
  ├── /apps/*       → proxyAppsRequest() → HTTP 代理到 :9701
  ├── /files/*      → 文件直接提供（uploads/exports）
  └── /*            → 静态资源（ui/dist）
```

### 三层架构

```
API 层 (server/api/)
  │  接收 HTTP 请求，参数校验，调用 Service
  ▼
Service 层 (server/service/)
  │  业务逻辑，编排多个 Repository 操作
  ▼
Repository 层 (server/repository/)
     数据库访问，SQL 操作
```

### API 规范

- 一个文件一个端点
- 目录必须有 `index.js` 作为路由入口
- 完整路径匹配，不用路径参数（`:id`），用查询参数（`?id=xxx`）
- 路由函数命名：`handle{Module}Api`
- 路径规范：`list` / `detail?id=xxx` / `create` / `update` / `delete`

---

## 4. 数据库设计

### 主数据库（database/aios.db）

```sql
-- 对话
chats (conversation_id, title, description, created_at)

-- 消息（对话和任务共用）
messages (conversation_id, message JSON, meta JSON, created_at)
-- conversation_id 格式：对话 → UUID，任务 → task:UUID

-- 任务
tasks (
  id, conversation_id,
  app,            -- 任务来源应用
  title,          -- 任务标题（用于展示）
  mode,           -- 'instant' 或 'agent'
  prompt,         -- 完整提示词
  schema,         -- instant 任务的 JSON schema（可选）
  meta,           -- 附加元数据 JSON
  status,         -- pending / running / done / error / aborted
  response,       -- 最终返回值 JSON
  schedule_id,    -- 关联的调度 ID（可选）
  error_message,
  created_at, updated_at
)

-- 定时调度
schedules (id, name, prompt, cron, run_at, enabled, last_run_at, last_task_id)

-- 设置（键值对）
settings (key, value)

-- 用户与会话
users (id, username, password_hash)
sessions (id, user_id, token_hash, expires_at)
```

### 应用数据库

每个应用独立一个 SQLite 文件：

```
database/apps/
├── notebook.db      # notes 表
├── subscriber.db    # subscriber_profile + subscriber_daily
├── finance.db       # transactions 表
├── cryptobot.db     # config + decisions + trades
├── reader.db        # sessions + chapters
├── fortune.db       # divinations 表
├── poker.db         # games + economy
└── banana.db        # progress 表
```

### 开发阶段规则

- 只允许最终形态 schema，禁止增量迁移
- 禁止 `ALTER TABLE ADD COLUMN`、回填脚本、双写
- 结构变更时直接删库按最新 schema 重建

---

## 5. Agent 系统

Agent 系统是 AIOS 的核心引擎，负责 AI 与工具的交互循环。

### chat() 主循环

```
server/agent/handler.js

chat(messages, options) {
  round = 0
  while (round++ < maxRounds):
    │
    ├── callLlmStream(payload)  ← 流式调用 LLM
    │   └── SSE 解析，onDelta 回调流式文本
    │
    ├── 检查返回的 message.tool_calls
    │   │
    │   ├── 有 tool_calls:
    │   │   ├── send({ type: 'assistant_tool_calls', message })
    │   │   ├── runTools(toolCalls)   ← 并行执行工具
    │   │   ├── send({ type: 'tool_result', ... })  × N
    │   │   ├── 将 tool 结果追加到 messages
    │   │   └── 继续下一轮
    │   │
    │   └── 无 tool_calls:
    │       ├── send({ type: 'done', message })
    │       └── 退出循环，返回最终文本
}
```

### 工具系统

**工具定义**（server/agent/tools.js）：

```javascript
tools = [{
  name: 'shell',
  description: '执行 shell 命令',
  parameters: {
    command: { type: 'string', description: '要执行的命令' },
    reason: { type: 'string', description: '执行原因' }
  }
}]
```

当前只有一个 `shell` 工具，AI 通过它实现所有系统操作能力：文件读写、网络请求、数据库查询、代码执行等。

**工具执行**（server/agent/runner.js）：

- 所有 tool_calls 并行执行（`Promise.all`）
- 结果截断保护：超过上限（默认 12000 字符）时保留头 70% + 尾 30%，中间标记 `[truncated N chars]`

### 消息规范化

`normalizeAgentMessages(messages)` 确保消息序列符合 LLM API 要求：

```
第一步：标准化每条消息（验证 role、content、tool_calls）
第二步：收集所有 tool 消息到 Map<tool_call_id, message>
第三步：重建序列 — 每个 assistant+tool_calls 后紧跟对应 tool 回复
第四步：移除开头的孤立 tool 消息

如果某个 tool_call_id 的 tool 消息缺失，填充占位符：
  '工具调用未返回结果：可能因系统中断、服务重启、超时或其它未知原因...'
```

### LLM 调用方式

| 方式 | 文件 | 用途 | 特点 |
|------|------|------|------|
| 流式 | `llm/stream.js` | Agent Task、Chat | SSE 解析，支持 onDelta 回调和 abort |
| 常规 | `llm/regular.js` | Instant Task | 一次性返回，适合结构化输出 |

---

## 6. 任务系统

### 两种任务类型

#### Instant Task — 一次性结构化生成

```
创建入口：POST /api/task/create/instant
服务实现：server/service/task/create/instant.js

适用场景：
  - 笔记润色（notebook optimize）
  - 算卦解读（fortune divine）
  - 智能记账识别（finance smart parse）
  - 需要 JSON 结构化输出

特点：
  - 单次 callLlmRegular() 调用
  - 支持 JSON schema 验证
  - 不循环、不调用工具
  - 速度快

流程：
  1. 创建 task record（mode='instant'）
  2. 构建 payload（messages + response_format）
  3. callLlmRegular() → 单次调用
  4. 结果验证（schema 校验）
  5. updateTaskDone({ response })
```

#### Agent Task — 工具循环任务

```
创建入口：POST /api/task/create/agent
服务实现：server/service/task/create/agent.js

适用场景：
  - 订阅收报（subscriber refresh，需要搜索网页）
  - 阅读器章节生成（reader generate）
  - 需要 shell 工具执行复杂操作

特点：
  - chat() 循环执行
  - 支持 shell 工具调用
  - 逐条保存消息到数据库
  - 支持中途停止（AbortController）

流程：
  1. 创建 task record（mode='agent', status='pending'）
  2. registerTaskExecution(taskId, abortController)
  3. broadcast({ type: 'tasks_changed' })
  4. 构建 messages: [system, user]
  5. chat(messages, options) → Agent 循环
  6. 更新状态：done / error / aborted
  7. unregisterTaskExecution()
  8. broadcast()
```

### 任务状态流转

```
               ┌─ abort ──→ aborted
               │
pending ──→ running ──→ done
               │
               └─ error ──→ error
```

### 执行追踪

```javascript
// server/service/task/execution.js
runningTaskControllers: Map<taskId, AbortController>

registerTaskExecution(taskId, controller)  // 任务开始
unregisterTaskExecution(taskId)            // 任务完成
stopTaskExecution(taskId)                  // 主动中止 → controller.abort()
```

### 任务调度器

```
server/service/task/schedule/scheduler.js

startTaskScheduler() → setInterval(tick, 60_000)

每分钟 tick():
  1. 查询所有启用的调度计划（schedules 表）
  2. 遍历判断 shouldRunSchedule():
     ├── cron 类型：用 shouldRunCron() 匹配当前时间
     └── run_at 类型：一次性执行（到时间且未执行过）
  3. 满足条件时：
     ├── createAgentTask({ prompt: schedule.prompt })
     ├── 更新 schedule（last_run_at, last_task_id）
     └── 若为一次性（非 cron），自动 disable
  4. broadcast({ type: 'schedules_changed' })
```

Cron 表达式在本地时区计算（非 UTC），标准 5 字段格式：`分 时 日 月 周`。

---

## 7. Chat 系统

### WebSocket 通信

**连接建立**：

```
客户端 → ws://localhost:9700/ws?token=xxx
服务端 → 验证 token → 创建 session → 就绪
```

**消息类型**：

| 方向 | type | 说明 |
|------|------|------|
| 客户端→服务端 | `ping` | 心跳 |
| 客户端→服务端 | `message` | 用户消息（含 conversationId, content, attachments） |
| 客户端→服务端 | `abort` | 中止当前对话 |
| 服务端→客户端 | `pong` | 心跳回应 |
| 服务端→客户端 | `delta` | 流式文本增量 |
| 服务端→客户端 | `tool_call` | 工具调用通知 |
| 服务端→客户端 | `tool_result` | 工具执行结果 |
| 服务端→客户端 | `done` | 对话完成 |
| 服务端→客户端 | `error` | 错误 |
| 服务端→客户端 | `aborted` | 已中止 |
| 服务端→客户端 | `tasks_changed` | 任务列表变化（广播） |
| 服务端→客户端 | `schedules_changed` | 调度计划变化（广播） |

### 并发控制

同一 WebSocket 连接内，同时只允许一个 chat() 执行：

```javascript
// server/chat/index.js
let running = false;
let abortController = null;

handleMessage(data):
  // 如果上一轮还在执行
  if (running && abortController) {
    abortController.abort();          // 中止旧的
    await waitForRelease();           // 等待 running = false
  }

  running = true;
  abortController = new AbortController();

  try {
    await chat(messages, { signal: abortController.signal, ... });
  } finally {
    running = false;
    abortController = null;
  }
```

这个锁是 session 级别的，只影响当前 WebSocket 连接。任务系统（createAgentTask）使用完全独立的代码路径，不受此锁影响。

### System Prompt 分层构建

```
server/chat/prompt/index.js → buildSystemPrompt(conversationId)

拼接顺序：
┌──────────────────────────────────────────┐
│ 1. INSTRUCTION.md                        │  全局身份、回复风格、硬规则
│ 2. language                              │  回复语言偏好（zh/en）
│ 3. memory                                │  memory/index.md 记忆索引
│ 4. environment                           │  cwd、数据库位置、文件目录
│ 5. model                                 │  provider/model/apiUrl
│ 6. tools                                 │  工具截断、循环限制配置
│ 7. apps                                  │  扫描 apps/ 列出所有应用
│ 8. skills                                │  扫描 skills/ 列出可用技能
│ 9. chats                                 │  当前会话上下文约束
└──────────────────────────────────────────┘
```

---

## 8. 预置上下文机制

### System Prompt 动态注入

AI 的系统提示词不是静态文本，而是每次对话时根据当前环境动态构建的。包含：

- **身份定义**：AIOS 是本地运行的个人 AI 智能体
- **环境信息**：项目路径、数据库位置、文件目录
- **应用列表**：自动扫描 apps/ 目录中每个应用的 APP.md
- **记忆索引**：memory/index.md 的内容
- **可用技能**：skills/ 目录下的技能列表
- **工具限制**：截断字数、循环轮数上限

### 应用上下文注入

当用户在某个应用页面打开聊天面板时，第一条消息会自动注入当前应用上下文：

```javascript
// ChatPanel.vue
if (props.context && messages.length === 0) {
  content = `[当前正在使用: ${props.context}]\n\n${content}`;
}
```

`context` 由 App.vue 根据当前路由前缀映射：

```javascript
APP_CONTEXT_KEYS = {
  '/notebook':   'app_sidebar_notebook',   // → 翻译后的应用名
  '/finance':    'app_sidebar_finance',
  '/subscriber': 'app_sidebar_subscriber',
  // ...
}
```

### 记忆系统

```
memory/
└── index.md    ← 作为记忆索引注入到 System Prompt
```

AI 可以通过 shell 工具读写 memory/ 目录下的文件，实现长期记忆。只有 `index.md` 会被自动注入到系统提示词，其他文件需要 AI 主动读取。

---

## 9. 应用架构

### 应用注册

```javascript
// apps/registry.js
export default [
  () => import('./notebook/index.js'),
  () => import('./finance/index.js'),
  () => import('./subscriber/index.js'),
  () => import('./cryptobot/index.js'),
  () => import('./reader/index.js'),
  () => import('./fortune/index.js'),
  () => import('./poker/index.js'),
  () => import('./banana/index.js'),
];
```

每个应用必须导出：

```javascript
export default {
  name: 'app_name',
  match: (path) => path.startsWith('/apps/app_name'),
  handleApi: async (req, res, path) => { ... },
  initDb: () => { ... },           // 可选：初始化数据库
  initRuntime: () => { ... },      // 可选：启动运行时（定时任务等）
}
```

### 标准应用结构

```
apps/<app_name>/
├── index.js              # 应用导出（name, match, handleApi, initDb, initRuntime）
├── APP.md                # 应用元信息（name, description, backend, database）
├── api/
│   └── index.js          # API 路由处理器 handle{App}Api()
├── repository/
│   ├── client.js         # better-sqlite3 连接
│   ├── init.js           # 数据库 schema 定义
│   └── *.js              # 各数据操作函数
├── service/
│   └── *.js              # 业务逻辑函数
└── runtime/
    └── index.js          # 运行时（定时任务、后台进程等）
```

### 应用与 AI 交互

应用通过共享函数创建任务：

```javascript
// apps/app_shared/agentTask.js
export async function agentTask({ app, title, prompt, meta }) {
  const res = await fetch('http://localhost:9700/api/task/create/agent', {
    method: 'POST',
    body: JSON.stringify({ app, title, prompt, meta })
  });
  return res.json();
}

// apps/app_shared/instantTask.js
export async function instantTask({ app, title, prompt, schema, messages, tools }) {
  const res = await fetch('http://localhost:9700/api/task/create/instant', {
    method: 'POST',
    body: JSON.stringify({ app, title, prompt, schema, messages, tools })
  });
  return res.json();
}
```

### Prompt 构建模式

应用触发 AI 任务的标准流程：

```
1. 前端构建 prompt
   ├── 根据 locale 区分中英文
   ├── 包含任务指示和上下文数据
   └── 如需 JSON 输出，明确要求格式

2. 调用应用 API
   └── POST /apps/{app}/{endpoint}
       body: { prompt, taskTitle, ...数据 }

3. 应用 service 选择任务类型
   ├── 需要工具（搜索、文件操作）→ agentTask()
   └── 一次性文本/JSON 生成 → instantTask()

4. 任务系统执行
   ├── 创建 task record（可在任务中心查看）
   ├── 执行 LLM 调用
   └── 返回结果

5. 解析返回
   ├── JSON: parseJsonObject(response)
   └── 文本: 直接使用
```

---

## 10. 前端架构

### 路由系统

```javascript
// ui/src/router/index.js
核心路由：
/              → 重定向到 /chat
/chat/:id?     → ChatView（主聊天界面）
/tasks         → TasksView（任务列表）
/task/:id      → TaskDetailView（任务详情）
/settings      → SettingsView（系统设置）
/files         → FilesView（文件管理）
/skills        → SkillsView（技能列表）
/history       → HistoryView（对话历史）

应用路由：
/notebook      → NotebookView
/finance       → FinanceView
/subscriber    → SubscriberView
/cryptobot     → CryptobotView
/reader        → ReaderView
/fortune       → FortuneView
/poker         → PokerView
/banana        → BananaView

路由守卫：
  beforeEach → 检查初始化状态 + 认证
  /welcome → 仅在未初始化时显示
  /login → 仅在未认证时显示
```

### 页面布局

```
┌─────────────────────────────────────────────────┐
│ 顶部导航栏 (z-100)                               │
│  AIOS 标题 | 任务按钮(计数) | 聊天按钮            │
├─────┬───────────────────────────────────────────┤
│     │                                           │
│ 侧  │                                           │
│ 边  │          主内容区（RouterView）             │
│ 栏  │                                           │
│     │                                           │
│ z70 │                                           │
│     │                                           │
├─────┘                                           │
└─────────────────────────────────────────────────┘

浮层面板（右侧）：
┌──────────────────┐
│ ChatPanel (z-91)  │  或  TasksPanel (z-91)
│ 聊天浮层面板      │      任务浮层面板
│ 宽 w-80          │
│ 最高 70vh        │
└──────────────────┘

z-index 层级（从低到高）：
  侧边栏遮罩 z-60
  侧边栏     z-70
  面板遮罩   z-90
  面板内容   z-91
  顶部导航   z-100（始终最高）
```

### WebSocket 客户端

```javascript
// ui/src/ws.js
特性：
  - wsStatus: 'disconnected' | 'connecting' | 'connected'
  - 心跳：每 30 秒 ping，5 秒超时自动断开
  - 自动重连：断开 3 秒后重连
  - API：connect() / disconnect() / send(data) / on(type, fn)
  - ensureConnected()：确保连接就绪（最多等 5 秒）
```

### i18n 国际化

```javascript
// ui/src/i18n/index.js
特点：
  - 响应式 locale ref，支持动态切换
  - 自动识别浏览器语言
  - localStorage 持久化（'aios.locale'）
  - 严格模式：missing key 直接 throw Error，禁止 fallback
  - 支持参数替换：t('key', { n: 5 }) → '{n}' 替换为 '5'

文件组织：
  ui/src/i18n/messages/
  ├── zh/
  │   ├── index.js       # 合并导出
  │   ├── common.js      # 通用文案
  │   ├── framework.js   # 框架级文案
  │   └── views/
  │       ├── chat.js
  │       └── apps/
  │           └── *.js   # 每个应用一个文件
  └── en/               # 同样结构
```

---

## 11. 快捷消息系统

### 架构

```
应用 View 组件
  │
  │ onMounted: chatPanel.setQuickMessages([...])
  │ onUnmounted: chatPanel.setQuickMessages([])
  ▼
chatPanel Store (stores/chatPanel.js)
  │
  │ state: { quickMessages, pendingMessage, requestOpen }
  ▼
App.vue
  │
  │ watch requestOpen → 打开面板
  │ 传递 quickMessages + pendingMessage 作为 props
  ▼
ChatPanel.vue
  │
  ├── 空状态：展示快捷消息按钮
  ├── 点击按钮：sendQuick(msg) → 自动发送
  └── pendingMessage：onMounted 时自动发送
```

### Store API

```javascript
// stores/chatPanel.js
chatPanel.open(message)           // 触发打开面板 + 自动发送消息
chatPanel.setQuickMessages(arr)   // 注册快捷消息（最多 3 条）
chatPanel.clearPending()          // 清除待发送消息
```

### 应用注册示例

```javascript
// views/apps/notebook/index.vue
import { chatPanel } from '../../../stores/chatPanel.js';

onMounted(() => {
  chatPanel.setQuickMessages([
    t('notebook_chat_quick_1'),  // "帮我整理最近的笔记"
    t('notebook_chat_quick_2'),  // "给我一些写作灵感"
    t('notebook_chat_quick_3'),  // "帮我总结笔记要点"
  ]);
});
onUnmounted(() => chatPanel.setQuickMessages([]));
```

### 应用触发发送

```javascript
// 任何应用代码中
import { chatPanel } from '../../../stores/chatPanel.js';

// 打开聊天面板并自动发送指定消息
chatPanel.open('请帮我分析这份数据');
```

---

## 12. 完整数据流

### 用户聊天消息流

```
用户输入
  │
  ▼
ChatPanel / ChatView
  │ ws.send({ type: 'message', conversationId, content })
  ▼
server/system/ws.js → handleMessage(data)
  │
  ▼
server/chat/index.js
  ├── 并发控制（running flag）
  ├── 加载历史消息（getMessages, contextRounds 限制）
  ├── 构建 systemPrompt（buildSystemPrompt）
  ├── 保存用户消息（saveMessage）
  │
  ▼
server/agent/handler.js → chat()
  ├── callLlmStream() → 流式调用 LLM
  ├── 检测 tool_calls
  │   ├── Y: runTools() → 执行工具 → 保存消息 → 继续循环
  │   └── N: 返回最终文本
  │
  ▼ 流式回调
WebSocket 发送
  ├── { type: 'delta', delta }        × N（流式文本）
  ├── { type: 'tool_call', toolCall } （工具调用通知）
  ├── { type: 'tool_result', ... }    （工具结果）
  └── { type: 'done' }               （完成）
  │
  ▼
前端实时更新消息列表
```

### 应用任务流

```
应用前端
  │ 构建多语言 prompt + taskTitle
  │ POST /apps/{app}/{endpoint}
  ▼
apps/{app}/api/index.js
  │ 校验参数，调用 service
  ▼
apps/{app}/service/xxx.js
  │ agentTask() 或 instantTask()
  │ → POST http://localhost:9700/api/task/create/{type}
  ▼
server/api/task.js
  │ 路由到 createAgentTask() 或 createInstantTask()
  ▼
server/service/task/create/agent.js  或  instant.js
  │ 创建 task record
  │ 执行 LLM 调用
  │ 保存结果
  │ broadcast({ type: 'tasks_changed' })
  ▼
返回 { id, conversationId, response }
  │
  ▼
应用 service 解析结果
  │ parseJsonObject(response)
  ▼
应用前端展示结果
```

### 定时任务流

```
scheduler tick（每分钟）
  │
  ├── 查询启用的 schedules
  ├── 判断 cron/run_at 是否匹配
  │
  ▼ 匹配时
createAgentTask({ prompt: schedule.prompt })
  │ → 创建任务 → chat() 循环 → 保存结果
  │
  ▼
更新 schedule（last_run_at, last_task_id）
broadcast({ type: 'tasks_changed' })
broadcast({ type: 'schedules_changed' })
```
