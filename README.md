# AIOS

本地运行的 AI 系统。一个核心理念：应用里的 AI 能力统一走任务中心。

## 核心特性

- 本地双服务架构：`server` + `apps`
- 统一任务中心（Task Center）
- 两种任务模式：`instant` / `agent`
- 应用可独立演进，统一鉴权与任务追踪

## 快速开始

```bash
git clone https://github.com/valueriver/aios.git
cd aios
npm install
npm run build
npm start        # 主服务: 9700
npm run start:apps   # 应用服务: 9701
```

打开：`http://localhost:9700`

## 运行架构

- `server/`（9700）：聊天、任务中心、设置、鉴权、WebSocket、静态 UI
- `apps/`（9701）：各业务应用 API（notebook、finance、poker、dailycheck 等）

## AI 任务中心

应用侧 AI 调用统一通过：

- `POST /api/task/create/instant`
- `POST /api/task/create/agent`

任务记录统一进入任务中心，支持查看列表、详情、消息与停止。

### Instant 模式

一次性结构化生成，适合可直接返回结果的任务。

示例：

```http
POST /api/task/create/instant
Content-Type: application/json

{
  "app": "notebook",
  "title": "提取摘要",
  "prompt": "把下面内容压缩成 3 条要点...",
  "schema": { "required": ["summary"] }
}
```

### Agent 模式

可走工具与多步执行，适合复杂任务。

示例：

```http
POST /api/task/create/agent
Content-Type: application/json

{
  "app": "dailycheck",
  "title": "生成今日提问",
  "prompt": "基于历史记录生成今天的问题，输出 JSON"
}
```

## 目录结构

```text
server/
  api/
    task/
      create/
        instant.js
        agent.js
        index.js
  agent/
  db/
  system/

apps/
  app_shared/
  notebook/
  finance/
  poker/
  dailycheck/
  ...

shared/
  ai/
  auth/
  http/
  json/
  time/

ui/
```

## 开发命令

```bash
npm run dev        # server + apps + ui dev
npm run build      # 构建前端
npm start          # 启动主服务
npm run start:apps # 启动应用服务
```

## 说明

- 开发阶段不保留兼容迁移逻辑，数据库结构变化按重建处理。
- 文档与代码需保持同名与同链路一致。
