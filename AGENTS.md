# AIOS

AIOS 主系统源码目录。本地 AI 操作系统：内置 chat / tasks / notebook / terminal / files 等系统能力，再加上一套可扩展的 apps。

## 仓库边界

- 当前目录同时是开发源头、运行源头和本机使用源头；不要再维护 `AIOS-test` 运行副本。
- 当前目录是独立 git 仓库；提交、推送、回滚前必须在本目录核对 `git remote -v` 和 `git status`。
- 当前仓库维护两个同步远端：GitHub `https://github.com/realuckyang/AIOS.git` 作为 `origin`，Gitee `https://gitee.com/realuckyang/aios.git` 作为 `gitee`。发布时两边 `main` 必须指向同一个提交。
- 当前目录可能已有 `database/`、`files/`、`node_modules/` 等运行态/依赖残留；开发时仍按源码目录处理。
- `apps/` 是源码的一部分，保存应用给 AI 读取的产品文档和上下文，不要忽略、不要当运行态产物处理。
- Node 要求见 `package.json`（当前 `>=22.5`）。

## Git 要求

- 提交信息使用中文。
- 提交、推送前必须执行并核对 `git status`、`git remote -v`；不能只凭记忆判断当前仓库和远端。
- 提交前确认没有把 `database/`、`files/`、`node_modules/`、`gui/dist/`、密钥、token、本机配置或运行态数据纳入版本。
- 小改动可以只写一行标题；结构性、大范围或跨模块变更必须写完整 commit body。
- 重大提交格式：第一行是清晰标题；空一行后写详细正文，说明动机、主要变化、删除/新增的关键路径、影响范围和验证方式。
- 同一次提交里如果承接了前一次大改的补充修正，正文必须补充说明上下文，避免只留下过短标题。
- 推送时同时推送 `origin main` 和 `gitee main`，推送后用 `git log -1 --oneline --decorate` 或 `git status -sb` 确认两个远端指向同一提交。
- 已经推送的提交不要随意 `--amend` 或强推；确实需要改历史时先说明风险并得到确认。

## 运行态与数据库

- 本机直接在当前目录运行和使用 AIOS，`database/`、`files/`、`node_modules/` 是本机运行态，默认保留，不因为改代码随手删除。
- 数据库 DDL 必须保持干净：`server/main/repository/init.js` 和各 `server/apps/<app>/repository/init.js` 写当前最终 schema，不写旧字段兼容、不写临时迁移分支。
- 新用户以空数据库初始化，应得到干净、正确的当前版本 schema。
- 开发期如果 schema 方向不对，直接修正 DDL；是否清理本机已有数据要先判断风险，涉及删除本机数据库或运行文件时先说明并得到确认。

## 核心目录

- `server/main/api/`：HTTP/WS API 入口（auth、chat、memory、runtime、settings、task 等）。
- `server/main/ai/`：AI 执行、工具调用、agent 运行控制。
- `server/main/service/`、`server/main/repository/`：业务层与数据库访问层。
- `server/apps/`：有独立后端边界的应用。
- `gui/`：前端。
- `apps/<app>/APP.md`：应用给 AI 看的文档源。

## 代码结构

- 后端继续按 `api / service / repository / ai / apps` 分层，不把跨层逻辑塞进入口文件。
- `server/shared/` 只放真正跨 main/apps 通用的低层能力，例如 HTTP、JSON、时间、AI 响应解析等。应用后端之间共享的能力必须放在 `server/apps/_shared/`，不要新建 `server/shared/apps*` 这类夹层目录。
- 应用自己的运行桥、外部进程桥、协议适配器必须放在 `server/apps/<app>/bridge/` 或该应用自己的后端目录里，不要放进 `server/main/bridge/`。
- files、terminal 这类 websocket 应用也有自己的后端边界；属于它们的 ws、mime、id 等辅助逻辑放在各自应用目录，不因为代码短就抽到共享层。
- 供应商协议字段只能在对应 service 边界统一生成，不能散落在各业务调用方。业务层表达语义即可，例如任务需要结构化结果时使用 `responseFormat: "json"` 或 `createInstantJsonTask`，由 task service 统一翻译成模型接口需要的 `response_format: { type: "json_object" }`。
- 不要在多个调用点手写同一个底层协议参数。发现同类参数出现在两个以上业务文件时，先抽到统一入口或 helper，再让调用方使用语义化 API。
- 前端也必须模块化：页面只负责组装和状态流转，复杂 UI 拆到 `components/`，可复用逻辑拆到 `composables/` 或贴近业务的工具文件。
- 单个代码文件目标控制在 200-300 行。超过 300 行要优先拆分组件、组合式函数、常量或样式文件；不要把新增功能继续堆进大文件。
- 前端新页面和新组件必须默认考虑移动端：布局、表格/列表、弹窗、工具栏、按钮文字、输入区域都要在窄屏可用，不允许只按桌面宽度实现。
- 禁止设计或引入系统级顶栏、系统级侧栏、全局 Sidebar/Topbar 组件。每个应用必须自己开发和维护自己的顶部区域与侧边区域；可以复用基础按钮、图标、颜色、间距等低层样式，但不能把应用级布局抽成系统统一组件。
- 样式跟随系统整体风格。已有 Tailwind 和系统组件时优先复用，避免为单个页面制造孤立视觉体系。

## 端口

- 主服务 `9502` / apps 服务 `9503` / Vite `5173`。

## App 注册表

- 前端：`gui/src/apps.js`
- 后端：`server/apps/registry.js`
- 当前前端入口：chat、monitors、tasks、memory、terminal、files、sysinfo、cryptobot、demogen、codex、longvideo、settings。
- 当前后端 registry：sysinfo、cryptobot、longvideo、demogen、codex。新增/清理应用时要同时核对前端入口、后端 registry、应用文档。
- chat/tasks/settings/memory 等系统能力主要在 `server/main/`；普通应用后端优先放 `server/apps/<app>/`。

## 用户安装脚本

`install-macos.sh` / `install-linux.sh` / `install-windows.ps1`（面向最终用户，不是日常开发启动）：

- 把源码拉到用户安装目录，在用户安装目录里装依赖、构建和运行。
