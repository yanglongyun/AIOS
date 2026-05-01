# iimos 开发协作者指南

这份文档给 Codex、Claude Code 等开发协作者阅读。它不是 iimos 运行态 AI 的系统提示词。

AI 运行态指令保存在数据库 `settings.systemPrompt` 中，由设置应用的「指令」页查看和编辑；后端通过 `server/main/service/prompt/` 组装给 Chat 和 Tasks 共用。

## 基础定位

- 你有 shell 能力,可以直接操作本机
- 遇到问题先想办法解决,不要先说做不到
- 选择路径时,以直接、可靠、可验证为准

## 互动要求

- 说话自然,简洁直接
- 不要空话,不要过度解释

## 运行环境(重要)

你当前的工作目录**就是运行态 workspace**。没有"源码仓库 / 运行副本"两份代码,也不存在什么"回到主仓库"这种事 —— 你改的文件就是 `9501` 和 `9502` 两个服务正在运行的那份,改完之后触发 reload 就立刻生效。

目录长这样:

- `gui/` — 前端源码(改完要 `build`)
- `gui/dist/` — 前端 build 产物
- `server/main/` — 主系统(平台能力,通过 API 暴露给所有应用调用)
- `server/apps/` — 有专属后端的应用,每个应用一个目录
- `server/shared/` — 后端共享代码
- `apps/<appname>/APP.md` — 当前 locale 烘焙后的应用文档(runtime,gitignored;源在 `language/<locale>/apps/<appname>/APP.md`)
- `language/` — 多语言源资产(AGENTS.md / CLAUDE.md / 应用文档 / UI 文案;改这里要改源,运行态由烘焙生成)
- `database/` — SQLite 文件
- `files/` — 工作文件

## 应用模型

iimos 没有"系统级应用 vs 用户级应用"的区分 —— **所有 nav 上能进的入口都是应用,平级**。差别只在后端:

- **走平台 API**:Chat / Tasks / Settings 是核心应用,直接消费 `server/main/` 暴露的 API 和 ws
- **有专属后端**:Todo 这种,在 `server/apps/<name>/` 写自己的表 + 路由
- **纯前端**:暂无,以后可能有(比如本地小工具类)

平台能力(可以被所有应用 curl 调用):

| 能力 | 入口 |
|--|--|
| 对话 / Agent | `/api/chat/*` + `/ws` |
| 任务 | `POST /api/task/create/instant` `POST /api/task/create/agent` `GET /api/task` |
| 设置 | `/api/settings` |
| 运行态 | `/api/runtime/*` |

## 应用开发

新建或修改应用前:

1. 先遵守本提示词里的应用开发规则
2. 参考现有应用时读 `apps/<appname>/APP.md`(runtime 烘焙产物)和对应的 `server/apps/<appname>/`、`gui/src/apps/<appname>/`;**写应用文档要改源** `language/<locale>/apps/<appname>/APP.md`
3. 应用注册三处:`server/apps/registry.js`(若有后端) + `gui/src/apps.js` + `gui/src/stores/view.js`(rail nav,见下方分组规则)

### 侧边栏分组(架构约定)

`gui/src/stores/view.js` 暴露 `navGroups`,把 rail 划分为三个语义不同的区:

- `navGroups.top` —— 顶部固定区,只放 Chat 和 Tasks(核心操作入口,永不滚动)
- `navGroups.apps` —— 中间应用区,带 "应用" 标题,**新建的应用都加在这里**;内容多到溢出会自动滚条
- `navGroups.bottom` —— 底部固定区,只放 Settings;主题切换由 AppDrawer 单独渲染

主题切换由 AppDrawer 单独渲染在 bottom 之上,**不属于任何 navGroup**。

新加应用 = 在 `navGroups.apps` 数组追加一项 `{ path, label, msi }`。**不要往 top / bottom 加** —— 它们承载的是已经定型的核心入口,加新东西破坏分组语义。

## 应用操控

- 允许通过 API、server 代码、service/repository、SQL、shell 脚本等方式操作应用
- 允许直接调用 `/api/*` 和 `/apps/*`
- 长期行为变更优先落到代码层,不做只靠临时命令的补丁

### 调用受鉴权保护的接口

`/api/*`、`/apps/*`、`/files/*`、`/ws*` 全部受鉴权保护。你作为本机进程,有专属 API token,通过环境变量 `IIMOS_API_TOKEN` 注入(由服务启动时从数据库读出)。

**调用方式:始终使用变量名,不要把真值粘进命令:**

```
curl -H "Authorization: Bearer $IIMOS_API_TOKEN" http://localhost:9501/api/settings
```

不要做这些:

- 不要 `echo $IIMOS_API_TOKEN`、`env | grep TOKEN` 把值打到对话里
- 不要把 token 真值复制粘贴到任何命令
- 不要把 token 写进文件、记忆、日志、提交信息

系统在写库 / 推送给前端 / 写日志前会做 token redaction(把真值替换回字面量 `$IIMOS_API_TOKEN`),但这是兜底,不是免责符。

## 任务中心

统一入口:
- `POST /api/task/create/instant`
- `POST /api/task/create/agent`

任务标题要清晰,方便任务中心展示。

## 核心机制边界

记忆、时间线、技能、独立 context 注入都不是当前 AIOS 核心机制。不要新增 `/api/settings/memory/*`、`/api/settings/timeline/*`、`/api/settings/skills` 依赖;提示词由 `server/main/service/prompt/` 组装,供 Chat 和 Tasks 共用。

## 目录规范

- 临时文件放 `files/tmp/`
- 应用专属文件放对应应用目录
- 根目录不要散落临时文件

## 安全规则

执行不可撤销操作前,必须先告知用户并得到明确同意。

高风险操作包括:
- `rm -rf`
- `drop table`
- `git reset --hard`
- 卸载软件
- 格式化

额外规则:
- `database/` 不能直接删除
- 改数据库前先备份,并说明备份位置
- `server/` 是核心区域,非必要不要动;要动时先说明风险

## 指令维护

- `AGENTS.md` 是开发协作者指南,不是运行态 AI 提示词
- 运行态 AI 指令保存在 `database/aios.db` 的 `settings.systemPrompt` 中
- 用户要改 AI 指令时,优先通过设置应用「指令」页修改
- 修改 `AGENTS.md` 只影响 Codex / Claude Code 等开发协作者的项目说明

## 多模态

如果当前模型支持多模态,可以使用标准 OpenAI Chat Completions 格式发起图片理解请求。

## 重启服务(硬规则)

**所有后端代码改动必须通过 reload 请求触发重启,否则新代码不生效。**

`9501`(主服务)和 `9502`(apps 服务)这两个 Node 进程在启动时就把模块树烘焙在内存里了。你改了磁盘上的 `.js` 文件,**进程内存里的旧代码不会自动更新** —— Node 的 ESM 模块缓存不会因为文件变化重载。不重启 = 白改。

**改完立刻调用:**

```bash
curl -X POST http://localhost:9501/api/runtime/reload/request \
  -H "Content-Type: application/json" \
  -d '{"build": false, "restartApps": true, "restartServer": false, "message": "新增 todo 应用"}'
```

参数语义:

- `build: true` → 改了 `gui/` 下的任何 `.vue` / `.ts` / `.js` / `.css` / Tailwind 相关文件
- `restartApps: true` → 改了 `server/apps/` 下的任何后端文件(**包括 `registry.js`**)
- `restartServer: true` → 改了 `server/main/`、`server/shared/`

多个同时改就多个同时 `true`。

**流程**:`/api/runtime/reload/request` 先做后台预检(probe 一个新进程确认能起来),通过之后前端弹"重启系统"对话框让用户确认,用户点确认才真正切换服务。预检失败会直接报错,当前服务不受影响 —— 所以这条接口是安全的。

**只做预检、不切换**,用:

```bash
curl -X POST http://localhost:9501/api/runtime/reload/test \
  -H "Content-Type: application/json" \
  -d '{"restartApps": true}'
```

**禁止的做法**:

- 改完代码不调 reload 就告诉用户"做完了" —— 新代码根本没生效,用户访问会 404 或看到旧行为
- 直接调 `/api/runtime/reload`(终态接口)绕过预检和用户确认
- 在用户没明确要求"立刻切换"时擅自 `restartServer: true` —— 主服务重启会中断正在跑的任务
