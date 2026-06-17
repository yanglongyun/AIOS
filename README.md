<div align="center">

# AIOS

### AI 时代的个人操作系统框架

开源 · 本地优先 · 一切皆应用 · AI 原生

<br />

[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.5-43853d.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg)](#快速开始)
[![Discord](https://img.shields.io/badge/Discord-加入社区-5865F2?logo=discord&logoColor=white)](https://discord.gg/YfCbV3m9Q)
[![Stars](https://img.shields.io/github/stars/realuckyang/AIOS?style=social)](https://github.com/realuckyang/AIOS)

[简体中文](./README.md) · [English](./README_en.md)

<!-- 截图位:框架化 UI 定稿后更新 -->
<img src="https://iimos.ai/blog/iimos-screenshots/images/readme-overview.webp" alt="AIOS Screenshot" width="100%" />

</div>

---

AIOS 是一个开源框架,用最小的系统约定承载你和 AI 一起构建的全栈应用:每个应用有自己的前端、后端和独立数据库,全部数据留在本地,AI 既能替你写应用,也能被应用当作服务调用。

## 核心理念:一切皆应用

AIOS 没有传统意义的"系统界面"。**对话、任务、设置都是应用**,与记事本、待办、记账本同列在同一张注册表里。系统层只持有两样东西:

1. **全局顶栏**:左侧是当前应用注册的动作与标题,右侧宫格按钮弹出应用面板,点击即切换应用。
2. **外壳状态**:当前应用与 hash 路由(`#/app/:id`)。

顶栏以下的一切归应用自管——布局、风格、交互完全自定义。系统把"系统"缩到最小,把自由最大化地让给应用。

由此带来三个结果:

- **对话不特殊**。chat 只是默认启动的一个应用,内核(Agent 循环、任务、记忆)与界面彻底解耦,你可以不用我们的对话界面,只用内核。
- **设置也走标准契约**。自己的后端、自己的库、自己的 APP.md,内核不为它开后门。
- **框架三句话讲完**:内核服务 + 应用契约 + 一个顶栏/面板。

## 快速开始

要求:Node.js >= 22.5。

```bash
git clone https://github.com/realuckyang/AIOS.git
cd AIOS
npm install
npm start
```

打开 **`http://localhost:9502`**,进「设置」填一个任意 OpenAI 兼容接口的 API Key,即可开始使用。

前端开发热更新:`npm run ui`(Vite,`http://localhost:5173`)。端口可通过 `AGENT_PORT`(默认 9502)与 `AGENT_APPS_PORT`(默认 9503)调整。

## 写一个应用

一个应用 = 前端目录 + 后端分层 + 一份 APP.md。不要发明新结构,抄一个现有应用(notepad 最全)。

**前端** `ui/src/apps/<id>/`:

```text
index.vue       入口:持应用状态与动作,组装 views
views/          屏幕级视图
components/     应用内可复用小件
lib/            api.js(fetch 封装) + format.js(纯函数)
```

在 `ui/src/apps.js` 注册一行 `{ id, name, icon, load }`(icon 用 lucide-vue-next 组件引用)。

**后端** `server/apps/<id>/`,依赖方向只许向下:

```text
index.js     → api/index.js → service/index.js → repository/index.js
薄入口          HTTP 分发        业务 + AI 任务      建库/迁移/全部 SQL
```

每应用独立 SQLite(`database/apps/<id>.db`),接口统一挂 `/apps/<id>/*`,在 `server/apps/registry.js` 注册。

**文档** `language/<locale>/apps/<id>/APP.md`:frontmatter 写 name/title/description/backend/database,正文列全部接口——运行时 AI 靠它了解应用能力,改接口必须同步改它。

完整契约见 [AGENTS.md](./AGENTS.md)。

## AI 集成模式

应用接入 AI 一律通过系统任务服务,在 service 层 `createTask + waitTask`,提示词只许出现在这一层。两种成熟交互模式:

1. **提案-采纳**(内容创作类):AI 产出先展示,用户点「采用」才写入——如记事本的 AI 续写。
2. **智能直写**(结构化录入类):AI 输出 JSON → service 严格校验 → 直接落库——如记账本一句话记账、待办的行内分解。

## 烘焙哲学(不是 i18n)

**启动时一次性烘焙,烘完即终态。** 运行态与源码都是单语言,没有 key 查表、没有运行时词典——AI 阅读和修改代码时看到的就是最终文案。语言源在 `language/zh|en/`,zh 与 en 同构;切语言用 `AIOS_LANG=en npm run lang:apply`。

## 内置应用

| 应用 | 一句话 |
|---|---|
| 对话 | 与 AI 对话,也是创建新应用的入口 |
| 任务 | 查看 AI 任务的进度、中间产出与结果 |
| 记事本 | 笔记,内置提案-采纳式 AI 续写 |
| 待办 | 任务清单,支持 AI 行内分解 |
| 记账本 | 收支记录,支持一句话智能记账 |
| 设置 | 模型供应商与系统配置 |

## 支持的模型

| 类别 | Provider |
|---|---|
| 主流 | OpenAI · Claude · Gemini · Mistral · xAI |
| 中国 | DeepSeek · Kimi · Qwen · GLM · Z.ai · Stepfun · Minimax · Doubao |
| 聚合 | OpenRouter · Together · Fireworks |
| Coding Plan | GLM-Coding · 阿里云百炼 · 火山方舟 · 腾讯混元 · 京东云 · Kimi-Coding |
| 自定义 | 任意 OpenAI 兼容接口 |

流式输出、Tool Calling、reasoning content 在各家上都通。

## 生态

| 项目 | 定位 |
|---|---|
| **AIOS**(本仓库) | 本地 Node 版,框架本体 |
| [AIOS-android](https://github.com/realuckyang/AIOS-android) | 移动运行时,同一内核装进手机 |
| [wandesk](https://github.com/Sider-ai/wandesk) | 桌面语义版 |
| 云端版 | Cloudflare 原生多租户版本,筹备中 |

## 贡献

开发契约见 [AGENTS.md](./AGENTS.md),提交规范与贡献记录见 [dev/contributions](./dev/contributions/)。欢迎 Issue 与 PR。

仓库双远端同步维护:

- GitHub: `https://github.com/realuckyang/AIOS.git`
- Gitee: `https://gitee.com/realuckyang/aios.git`

## 社区

[![Discord](https://img.shields.io/badge/Discord-加入社区-5865F2?logo=discord&logoColor=white)](https://discord.gg/YfCbV3m9Q)
[![Issues](https://img.shields.io/badge/反馈-GitHub%20Issues-181717?logo=github&logoColor=white)](https://github.com/realuckyang/AIOS/issues)

进一步阅读:[AIOS——AI 时代的操作系统](https://iimos.ai/blog/aios-open-source-launch) · [完整哲学版](https://iimos.ai/philosophy) · [更多文章](https://iimos.ai/blog)

## License

[ISC](./LICENSE) © realuckyang
