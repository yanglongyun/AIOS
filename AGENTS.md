# AGENTS.md — AIOS 协作宪法

这份文档面向两类读者：**参与本仓库的开发者 / AI 编码代理**，以及**运行在用户机器上、通过 AIOS 创建和修改应用的 AI**。无论你是谁，改这个仓库之前先读完它——这里写的不是建议，是契约。

- origin: `https://github.com/realuckyang/AIOS.git`
- 技术栈：ESM JavaScript（`type: "module"`）、Vue 3 + Vite + Tailwind v4、`node:sqlite`、lucide-vue-next。
- 不使用 TypeScript / React / 组件库。Node >= 22.5。

## 核心理念：一切皆应用

AIOS 没有传统意义的"系统界面"。**对话、任务、设置都是应用**，与记事本、待办、记账本同列在同一张注册表里。系统层只持有两样东西：

1. **全局顶栏**（`ui/src/system/panel/TopBar.vue`）：左侧是当前应用注册的动作 + 标题，右侧宫格按钮弹出应用面板（3 列网格，点击切换应用）。
2. **外壳状态**（`ui/src/system/shell.js`）：当前应用、`openApp(id)`、hash 路由 `#/app/:id`。

顶栏以下的一切归应用自管。应用通过两个响应式状态与顶栏交互：

```js
import { topTitle, topLeftAction } from '@/system/shell.js';
topTitle.value = '当前会话标题';                                   // 改顶栏标题
topLeftAction.value = { icon: 'menu', title: '对话历史', fn: ... }; // 注册左侧动作('menu'/'back')
// onUnmounted 时必须清理: topLeftAction.value = null
```

## 命令与端口

```bash
npm start          # 烘焙 + 启动 system(:9502) + apps(:9503)
npm run dev        # 同 npm start
npm run ui         # Vite 前端开发服(:5173)
npm run build      # 烘焙 + 构建 ui/dist
npm run check      # 全量 JS 语法检查
npm run lang:apply # 强制重新烘焙
```

端口：system `AGENT_PORT`(默认 9502)、apps `AGENT_APPS_PORT`(默认 9503)。

## 目录结构

```text
server/
  system/              系统内核:ai / api / services / repository / ws / runtime
  apps/
    registry.js        后端应用注册表
    shared/            通用件:db.js(createAppDb) / http.js(readBody/sendJson/parseJson/badRequest)
    <id>/              每个应用一个目录,内部强制分层(见下)
ui/
  src/
    App.vue            外壳:全局顶栏 + 当前应用铺满
    apps.js            前端应用注册表
    system/            shell.js / panel/TopBar.vue / ws.js / components/
    apps/<id>/         每个应用一个目录(见下)
    style.css          设计 token 与全局工具类
language/zh|en/        烘焙文案源(server 提示词、APP.md、SKILL.md)
scripts/start.mjs      一次性烘焙脚本(挂在 predev/prebuild/prestart)
apps/  skills/         运行时 APP.md / SKILL.md(烘焙产物,勿手改)
database/              system.db + apps/<id>.db(gitignored)
dev/                   文档 / 贡献记录 / timeline(不参与运行)
```

## 应用契约

新应用必须同时满足前端、后端、文档三份契约。**不要发明新结构——抄一个现有应用（notepad 最全）。**

### 前端：`ui/src/apps/<id>/`

```text
index.vue       入口:持应用状态与动作,组装 views;保持轻薄
views/          屏幕级视图(ListView/EditorView/Detail/MainView...)
components/     应用内可复用小件(卡片/输入条/表单壳...)
lib/            api.js(端点函数) + format.js(纯函数:格式化/常量)
```

- HTTP 一律走 `@/system/http.js`（`request/getJson/postJson/patchJson/delJson/postForm`，约定后端 `{ok,...}`、`ok:false` 抛错）。lib/api.js 只 `export ... from '@/system/http.js'` + 声明本应用端点，**不要重抄 fetch 封装**。
- 注册：在 `ui/src/apps.js` 加一行 `{ id, name, icon, load }`——`icon` 是 **lucide-vue-next 组件引用**（不是 emoji、不是字符串），`load` 是 `() => import('./apps/<id>/index.vue')`。
- 应用根容器自管布局，标准页面骨架：

```html
<div class="absolute inset-0 overflow-y-auto dot-grid">
  <div class="page"><!-- max-width 860px 居中 --> ... </div>
</div>
```

- 状态传递用 props/emits/defineModel，不为单应用引入 store。

### 后端：`server/apps/<id>/`

```text
index.js        薄入口:仅导出 { name, match, handleApi, initDb }
api/index.js    HTTP 层:method/路径分发、参数校验,用 shared/http.js
service/index.js 业务层:领域规则 + 全部 AI 任务(createTask/waitTask/提示词只许出现在这层)
repository/index.js 数据层:建库(shared/db.js 的 createAppDb)、迁移、全部 SQL
```

- 依赖方向只许向下：index → api → service → repository。repository 不得 import service/api。
- 注册：`server/apps/registry.js` 加一行。
- 每应用独立 SQLite：`database/apps/<id>.db`，DDL 写在自己的 repository；**不许碰 system.db 或其他应用的库**。
- 接口统一挂 `/apps/<id>/*`；读用 GET，写用 POST/PATCH/DELETE + JSON body；协议错误返回明确 `400`，模型/内部错误不要伪装成用户错误。

### 文档：`language/<locale>/apps/<id>/APP.md`

每个应用必须有 APP.md（烘焙后镜像到根 `apps/<id>/APP.md`，运行时 AI 靠它了解应用能力）。frontmatter 写 name/title/description/backend/database，正文列全部接口与行为说明。改了接口必须同步改 APP.md。

## AI 集成模式

应用接入 AI 一律通过 system 的任务服务（`server/system/services/tasks`），在 service 层 `createTask({ taskName, detail })` 起任务，用 `server/apps/shared/ai.js` 的 `waitTask(taskId)` + `parseTaskJson()` 取结果（**不要重抄轮询逻辑**），提示词要求只输出 JSON。两种成熟交互模式，按场景选：

1. **提案-采纳**（内容创作类，如 notepad）：AI 产出结果先展示，用户点「采用」才写入。
2. **直接写库**（结构化录入类，如 ledger 智能记账、todo 行内分解）：AI 输出 JSON → service 严格校验（类型/数值/日期，非法条目跳过）→ 直接落库 → 界面即时反馈。

工具调用的展示契约：system 的工具定义里 `summary` 为必填参数（一句话、面向用户）；前端每个工具调用独立显示为单工具卡片，默认收起，展开后显示输入输出。组件在 `ui/src/apps/chat/components/bubbles/ToolCall.vue`，可跨应用复用（tasks 详情页即复用它）。

## 设计语言（v6）

灰白蓝、克制、留白。所有颜色一律走 `ui/src/style.css` 的 token，禁止硬编码色值：

- 页面 `--color-bg` #f6f6f7 / 白卡 `--color-bg-elev` / 墨 `--color-ink` #1d1d20 / 蓝 `--color-accent` #3b82f6 / 浅蓝底 `--color-blue-bg`、good 绿、bad 红、`--shadow` 三档。
- 全局工具类：`.dot-grid` 点阵底纹、`.soft-card` 大圆角白卡、`.halo-focus` 聚焦光圈、`.chip-card` 建议胶囊、`.save-btn`、`.text-input`。
- 标准页面 = 点阵全幅背景 + 860px 居中 `.page` + 标题行（h2 17px/700 + 右侧动作）+ 白卡列表/表单（圆角 10-16px + 1px 细边线 + `--shadow`）。
- 禁止：渐变、纹理、浮雕/内凹阴影、serif、emoji 当图标。
- **图标只用 lucide-vue-next**，按需 import 组件；应用图标在注册表声明。
- 移动端：覆盖类面板用浮层 + 遮罩（参考 chat 历史侧栏的 `@media (max-width: 768px)` 处理），不挤压内容。
- 应用允许有自己的特色层（如记事本的马卡龙贴纸色板），但必须建立在 token 骨架之上、保持淡色系小清新，不破坏整体语言。

## 语言与烘焙（不是 i18n）

核心原则：**仓库是源码态，烘焙发生在使用时**。仓库提交态的源码里，所有面向用户的文案都是 `__T_KEY__` 占位符；用户 clone 后首次 `npm start`，`scripts/start.mjs` 把所选语言的文案**就地烘焙进源码**——烘完即终态，运行态没有 key 查表、没有运行时词典，AI 阅读和修改代码时看到的就是最终的单语言文案。

- `scripts/start.mjs`（挂在 predev/prebuild/prestart，已烘焙时 <10ms 放行）做三件事：把源码里的 `__T_KEY__` 占位符替换成 `language/<locale>` 的文案；镜像 APP.md / SKILL.md 到运行时目录；写 `.aios/settings.json` 缓存标记。
- 文案源在 `language/<locale>/`，按域拆分（`ui/framework.json`、`ui/apps/<id>.json`、`server/system.json`、`apps/<id>/APP.md`、`skills/`），zh 与 en 必须严格同构。**不要建大杂烩文件**。
- 新增界面文案：源码里写 `__T_NEW_KEY__` 占位符，同时把 key 写进对应域的 zh + en 文件。带变量的文案词条里用 `{n}`，源码用 `` `__T_KEY__`.replace('{n}', ...) ``。
- 切语言：`AIOS_LANG=en npm run lang:apply`。
- **提交纪律**：烘焙是工作副本的事，**烘焙产物不要提交**——提交前确认改动是 token 态（本地已烘焙的文件提交前用 git 恢复或只挑文案源/逻辑改动提交）。
- 不 token 化的：注释、数据值（如与后端种子数据匹配的分类名）、接口路径、CSS。

## 提交纪律

- 提交前：`npm run check` + `npm run build` 必须通过。
- 不提交：数据库、日志、`node_modules`、`ui/dist`、`.aios`、运行时 `apps/`/`skills/` 烘焙产物、任何 API Key。
- 不把兼容迁移、兜底解析、假数据、演示应用塞进主链路。
- 行为变更与结构重构分开提交；纯重构必须行为零变化。
- commit message 用英文。
