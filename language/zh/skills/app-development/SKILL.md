---
name: app-development
description: AIOS 应用开发指导。按最新契约说明前端/后端/文档三份契约、分层结构、注册表、独立 SQLite、v6 设计语言与 AI 集成模式,并给出创建新应用的完整步骤清单。
---

# 应用开发指导

你在 AIOS 主项目里工作(本机运行,ESM JavaScript、Vue 3 + Vite + Tailwind v4、`node:sqlite`、lucide-vue-next;不用 TypeScript / React / 组件库)。新应用必须同时满足**前端、后端、文档**三份契约。**不要发明新结构——抄一个现有应用(notepad 最全)。**

## 命令与端口

```sh
npm start          # 烘焙 + 启动 system(:9502) + apps(:9503)
npm run ui         # Vite 前端开发服(:5173)
npm run check      # 全量 JS 语法检查
npm run build      # 烘焙 + 构建 ui/dist
```

system 服务代理 `/apps/*` 到 apps 服务。健康检查:`curl http://127.0.0.1:9502/api/health` 与 `curl http://127.0.0.1:9503/apps/health`。

## 前端契约:`ui/src/apps/<id>/`

```
index.vue       入口:持应用状态与动作,组装 views;保持轻薄
views/          屏幕级视图(ListView/EditorView/MainView...)
components/     应用内可复用小件(卡片/输入条/表单壳...)
lib/            api.js(fetch 封装) + format.js(纯函数:格式化/常量)
```

- 注册:在 `ui/src/apps.js` 加一行 `{ id, name, icon, load }`。`icon` 是 **lucide-vue-next 组件引用**(不是 emoji、不是字符串),`load` 是 `() => import('./apps/<id>/index.vue')`。
- 应用根容器自管布局,标准页面骨架:

```html
<div class="absolute inset-0 overflow-y-auto dot-grid">
  <div class="page"><!-- max-width 860px 居中 --> ... </div>
</div>
```

- 状态传递用 props/emits/defineModel,不为单应用引入 store。
- 顶栏交互:需要改标题或注册左侧动作时用 `import { topTitle, topLeftAction } from '@/system/shell.js'`,`onUnmounted` 时必须清理 `topLeftAction.value = null`。

## 后端契约:`server/apps/<id>/`

```
index.js            薄入口:仅导出 { name, match, handleApi, initDb }
api/index.js        HTTP 层:method/路径分发、参数校验,用 shared/http.js
service/index.js    业务层:领域规则 + 全部 AI 任务(createTask/waitTask/提示词只许出现在这层)
repository/index.js 数据层:建库(shared/db.js 的 createAppDb)、迁移、全部 SQL
```

- 依赖方向只许向下:index → api → service → repository。repository 不得 import service/api。
- 通用件:`shared/db.js` 的 `createAppDb("<id>.db")`;`shared/http.js` 的 `readBody / sendJson / parseJson / badRequest`。
- 注册:`server/apps/registry.js` 的 `appLoaders` 加一行 `() => import("./<id>/index.js")`。
- 每应用独立 SQLite:`database/apps/<id>.db`,DDL 写在自己的 repository;**不许碰 system.db 或其他应用的库**。
- 接口统一挂 `/apps/<id>/*`;读用 GET,写用 POST/PATCH/DELETE + JSON body;未命中路由返回 `false`;协议错误返回明确 `400`,模型/内部错误不要伪装成用户错误。

## 文档契约:`language/<locale>/apps/<id>/APP.md`

每个应用必须有 APP.md(烘焙后镜像到根 `apps/<id>/APP.md`,运行时 AI 靠它了解应用能力)。frontmatter 写 name/title/description/backend/database,正文列全部接口与行为说明。zh 与 en 必须同构同步。**改了接口必须同步改 APP.md。**

## AI 集成

一律通过 system 的任务服务,在 **service 层** `createTask({ taskName, detail })` + 轮询 `getTask(taskId)` 等待完成(waitTask 写法抄现有应用),提示词要求只输出 JSON。两种成熟模式按场景选:

1. **提案-采纳**(内容创作类,如 notepad):AI 产出先展示,用户点「采用」才写入。
2. **校验后直写库**(结构化录入类,如 ledger 智能记账、todo 行内分解):AI 输出 JSON → service 严格校验(类型/数值/日期,非法条目跳过)→ 直接落库 → 界面即时反馈。

`createTask` / 提示词只许出现在 service 层,api 层和前端不碰。

## 设计语言(v6)

灰白蓝、克制、留白。颜色一律走 `ui/src/style.css` 的 token(`--color-bg / --color-bg-elev / --color-ink / --color-accent / --color-blue-bg / good / bad / --shadow`),禁止硬编码色值。全局工具类:`.dot-grid` 点阵底纹、`.soft-card` 大圆角白卡、`.halo-focus`、`.chip-card`、`.save-btn`、`.text-input`。标准页面 = 点阵全幅背景 + 860px 居中 `.page` + 标题行(h2 17px/700 + 右侧动作)+ 白卡列表/表单(圆角 10-16px + 1px 细边线 + `--shadow`)。

禁止:渐变、纹理、浮雕/内凹阴影、serif、emoji 当图标。**图标只用 lucide-vue-next。**移动端覆盖类面板用浮层 + 遮罩(参考 chat 历史侧栏的 `@media (max-width: 768px)`)。应用可有特色层(如记事本马卡龙色板),但必须建立在 token 骨架之上、保持淡色系小清新。

## 创建一个新应用的完整步骤清单

1. **读样例**:通读 `server/apps/notepad/` 与 `ui/src/apps/notepad/`,确认分层与写法。
2. **建后端**:`server/apps/<id>/{index.js,api/index.js,service/index.js,repository/index.js}`。repository 用 `createAppDb("<id>.db")` 建表;api 用 shared/http.js 分发;index.js 只导出 `{ name, match, handleApi, initDb }`。
3. **注册后端**:`server/apps/registry.js` 的 `appLoaders` 加一行。
4. **建前端**:`ui/src/apps/<id>/{index.vue,views/,components/,lib/api.js,lib/format.js}`,用标准页面骨架与 v6 token。
5. **注册前端**:`ui/src/apps.js` 加一行,icon 用 lucide 组件引用。
6. **接 AI(如需要)**:在 service 层 createTask,按场景选提案-采纳或校验后直写库。
7. **写 APP.md**:`language/zh/apps/<id>/APP.md` 与 `language/en/apps/<id>/APP.md`,frontmatter + 全部接口 + 行为说明,两语言同构。
8. **验证**:`npm run check` 通过;`npm start` 后 curl `/apps/health` 确认注册;在 UI 里走一遍增删改查与 AI 流程;确认 `apps/<id>/APP.md` 已被烘焙镜像。

## 系统应用

`chat`、`tasks`、`settings` 是系统能力应用(settings 走 system 的 `/api/settings`,无独立后端目录)。修改它们前先看现有分层,保持命名和事件语义一致。
