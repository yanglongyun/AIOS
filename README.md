<div align="center">

# AIOS

**AI 时代的操作系统**

让 AI 成为你的操作系统,打造更紧密贴近你需求的原生应用,统一的 AI 内核,让应用也能和 AI 对话。

[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-43853d.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg)](#-安装)
[![Discord](https://img.shields.io/discord/0?label=Discord&logo=discord&color=5865F2)](https://discord.gg/7YnDeKE8)
[![Stars](https://img.shields.io/github/stars/valueriver/AIOS?style=social)](https://github.com/valueriver/AIOS)

[简体中文](./README.md) · [English](./README_en.md)

<img src="https://iimos.ai/blog/iimos-screenshots/images/readme-overview.webp" alt="AIOS Screenshot" width="100%" />

</div>

---

## ✨ 它是什么

AIOS 是一个**完全本地运行**的 AI 工作台:

- 🗣 **对话即指令** — 用自然语言驱动你的电脑
- 🧩 **24 个内置应用** — 笔记、记账、终端、文件、Claude Code、订阅箱、地球、文明、辩论台……
- 🤖 **Agent 任务系统** — 应用可向系统下发 Task,AI 自主调度上下文与工具
- 🏠 **数据完全自有** — 所有对话、笔记、配置都存在本地 SQLite
- 🔌 **23+ 模型 Provider** — OpenAI / Claude / Gemini / DeepSeek / Kimi / Qwen / GLM …
- 🎨 **应用工坊** — 用 AI 生成你专属的应用,而不是被开发者定义

> 不是又一个 LLM 前端 —— 是一个内含应用工坊与 Agent 任务系统的本地操作系统。

---

## 📑 目录

- [安装](#-安装)
- [第一次使用](#-第一次使用)
- [支持的模型](#-支持的模型)
- [内置应用](#-内置应用)
- [架构](#-架构)
- [设计哲学](#-设计哲学)
- [开发与贡献](#-开发与贡献)
- [FAQ](#-faq)
- [License](#-license)

---

## 🚀 安装

### 系统要求

| 项 | 要求 |
|---|---|
| 操作系统 | macOS 12+ / 主流 Linux 发行版 / Windows 10 1809+ |
| Node.js | 20 或更高(脚本会自动安装) |
| 端口 | `9501`(主服务)、`9502`(应用服务)、`5173`(开发模式 Vite) |
| 磁盘 | ≥ 1 GB |

### 一键安装

> ⚠️ 一键脚本会通过包管理器安装 Node、git、rsync,然后克隆并构建 AIOS。建议先[查看脚本](https://github.com/valueriver/AIOS/blob/main/install-macos.sh)再执行。

**macOS**(自动装 Homebrew + Node@20)
```bash
curl -fsSL https://raw.githubusercontent.com/valueriver/AIOS/main/install-macos.sh | sh
```

**Linux**(apt / dnf / yum / apk / pacman + NodeSource)
```bash
curl -fsSL https://raw.githubusercontent.com/valueriver/AIOS/main/install-linux.sh | sh
```

**Windows**(需要 winget,Win10 1809+ / Win11 自带)
```powershell
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/valueriver/AIOS/main/install-windows.ps1 | iex"
```

### 手动安装

```bash
git clone https://github.com/valueriver/AIOS.git
cd AIOS
npm install
npm run build
npm run start:main &
npm run start:apps
```

### 卸载

默认安装目录是 `~/.aios`,直接删除即可:
```bash
rm -rf ~/.aios
```

---

## 🎬 第一次使用

1. 打开 `http://localhost:9501`
2. 设置一个访问密码(只在你本机使用)
3. 进入「设置 → 模型」,填入任意一个 Provider 的 API Key
4. 回到「Chat」开始对话,或打开「应用工坊」生成你的第一个应用

---

## 🧠 支持的模型

| 类别 | Provider |
|---|---|
| 主流 | OpenAI · Claude · Gemini · Mistral · xAI |
| 中国 | DeepSeek · Kimi · Qwen · GLM · Z.ai · Stepfun · Minimax · Doubao |
| 聚合 | OpenRouter · Together · Fireworks |
| Coding Plan | GLM-Coding · 阿里云百炼 · 火山方舟 · 腾讯混元 · 京东云 · Kimi-Coding |
| 自定义 | 任意 OpenAI 兼容接口 |

支持流式输出、Tool Calling、reasoning content。

---

## 📦 内置应用

<!-- TODO: 用一张应用网格截图替换下表,视觉冲击更强 -->

| 类别 | 应用 |
|---|---|
| 系统 | Chat · Tasks · Settings · 应用工坊 |
| 工作 | 笔记本 · 记账本 · 文件 · 终端 · Claude Code · 系统状态 |
| 信息 | 订阅箱 · GH 热榜 · Hacker News · RSS 阅读 |
| 实验 | 老手机 · 算一卦 · 虚拟伴侣 · 炸金花 · 藏宝阁 · 辩论台 · 地球 · 文明 · 炒币机 · 记忆 |

应用本身可以向系统下发 Task,让 AI 主动接管复杂逻辑,而不是只做一次性的 API 调用。

---

## 🏗 架构

```text
AIOS/
├── server/
│   ├── main/        # 主服务 :9501  HTTP / WS / Auth / Chat / Task / LLM
│   │   ├── api/     # 路由入口
│   │   ├── ai/      # Agent 执行循环 + 工具调用
│   │   ├── llm/     # Provider / Input / Requester / Output 管线
│   │   ├── service/ # Auth / Chat / Task / Prompt / Runtime / Settings
│   │   └── repository/  # SQLite 数据访问
│   └── apps/        # 应用服务 :9502  各 app 自带后端
├── gui/             # Vue 3 前端 (Vite, Pinia, Tailwind v4)
├── apps/            # 各 app 的 APP.md 与共享资源
├── language/        # 多语言资源
└── scripts/         # 启动 / 构建 / 修复脚本
```

**技术栈**:Node.js 20 · Vue 3 · Vite 7 · better-sqlite3 · Tailwind v4 · ws · node-pty · xterm.js

数据存放:本地单文件 SQLite (`database/aios.db`),完全可备份与迁移。

---

## 💡 设计哲学

> **未来不会流于无形,依然会留于物形。**

AIOS 相信四件事:

1. **对话**是新的人机交互范式 —— 简单、高效、自带上下文。
2. **界面**依然不可或缺 —— 形态即功能,聊天窗口装不下日历、账本、阅读器。
3. **每个人都该有专属软件** —— 当代码由 AI 生成,软件不再属于开发者,属于使用它的人。
4. **AI 与 App 双向调用** —— App 不只是 AI 的展示层,App 也能向底层 AI 下发 Task,让系统接管复杂逻辑。

完整版:[doc/理念阐述.md](./doc/理念阐述.md)

---

## 🛠 开发与贡献

```bash
# 开发模式(主服务 + 应用服务 + Vite dev)
npm run dev

# 仅启动后端
npm run start:main &
npm run start:apps

# 重置语言烘焙缓存
npm run lang:reset
```

欢迎提 Issue 和 PR。提交前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)(WIP)。

---

## ❓ FAQ

**Q: 端口 9501 / 9502 被占用怎么办?**
通过环境变量覆盖:`AIOS_SERVER_PORT=9601 AIOS_APPS_PORT=9602 ...`。

**Q: 忘记访问密码?**
删除 `database/aios.db` 中的 `auth` 表记录,或重置整个数据库后重新引导。

**Q: 数据存在哪里?**
默认 `~/.aios/app/database/aios.db`(一键安装)或仓库 `database/` 目录下(手动安装)。

**Q: `node-pty` 编译失败?**
脚本会自动尝试修复 (`scripts/fix-node-pty.js`),仍然失败请确认本机有 C++ 编译工具链。

**Q: 和 Open WebUI / LibreChat / LobeChat 有什么区别?**
那些项目主要是 LLM 聊天前端;AIOS 是带应用工坊和 Agent 任务系统的**本地操作系统**,Chat 只是其中一个入口。

---

## 📄 License

[ISC](./LICENSE) © valueriver

---

## 💬 社区

[![Discord](https://img.shields.io/badge/Discord-加入社区-5865F2?logo=discord&logoColor=white)](https://discord.gg/7YnDeKE8)

有任何想法、bug、应用工坊作品都欢迎来聊。
