# AIOS

本地运行的个人 AI 操作系统。集成对话、任务中心和多款拟物风格应用。

## 快速开始

```bash
git clone https://github.com/valueriver/aios.git
cd aios
npm install
npm run build
npm start          # 主服务: 9700
npm run start:apps # 应用服务: 9701
```

打开：`http://localhost:9700`

## 架构

双服务 + 统一任务中心：

- `server/`（9700）— 对话、任务中心、设置、鉴权、WebSocket、静态 UI
- `apps/`（9701）— 各业务应用独立 API，通过注册表自动加载

应用内 AI 能力统一走任务中心，不直接调用 AI API。

## 应用列表

| 应用 | 路径 | 说明 |
|------|------|------|
| 📝 记事本 | `/notebook` | 软木板 + 夹板拟物风格，12 种随机纸张纹理 |
| 💰 记账本 | `/finance` | 银行存折拟物风格，按月翻页，行内印字录入 |
| 📻 订阅机 | `/subscriber` | AI 聚合新闻订阅 |
| 📈 炒币机 | `/cryptobot` | 加密货币自动交易 |
| 📬 收件箱 | `/inbox` | 消息收件箱 |
| 📚 读小说 | `/story` | 在线小说阅读器 |
| 🃏 炸金花 | `/poker` | 经典扑克牌游戏 |
| 🔮 算一卦 | `/fortune` | AI 占卜 |
| 📱 老手机 | `/nokia` | 复古诺基亚手机模拟器 |

## AI 任务中心

应用侧 AI 调用统一通过：

- `POST /api/task/create/instant` — 一次性结构化生成
- `POST /api/task/create/agent` — 多步工具调用

任务记录统一进入任务中心，支持列表、详情、消息查看与停止。

## 目录结构

```
server/          主服务
  api/           核心 API（对话/任务/设置/鉴权）
  agent/         AI Agent 执行器
  db/            数据库（better-sqlite3）
  system/        HTTP + WebSocket

apps/            应用服务
  registry.js    应用注册表
  notebook/      记事本
  finance/       记账本
  subscriber/    订阅机
  cryptobot/     炒币机
  inbox/         收件箱
  story/         读小说
  poker/         炸金花
  fortune/       算一卦
  nokia/         老手机

shared/          公共模块（AI/鉴权/HTTP/JSON/时间）
ui/              Vue 3 + Vite + Tailwind CSS 前端
```

## 技术栈

- **前端**：Vue 3 + Vite + Tailwind CSS
- **后端**：Node.js + better-sqlite3
- **AI**：Claude API（OpenAI 兼容格式）
- **架构**：三层分离（api → service → repository）

## 开发命令

```bash
npm run dev          # server + apps + ui 同时启动
npm run build        # 构建前端
npm start            # 启动主服务
npm run start:apps   # 启动应用服务
```
