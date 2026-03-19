# AIOS 系统架构

## 技术栈
- 前端：Vue 3 + Vite + Tailwind CSS
- 后端：Node.js + better-sqlite3
- AI：OpenAI 兼容格式 API（流式 + 常规）
- 通信：WebSocket（ws 库）

## 双服务架构
- 主服务 :9700 — 系统 API（/api/）、WebSocket（/ws）、静态资源、代理 /apps/ 到 :9701
- Apps 服务 :9701 — 自带后端的应用 API（/apps/notebook/、/apps/finance/...）

## 项目目录

```
AIOS/
├── server/          系统内核
│   ├── system/      基础设施（http.js, ws.js, dir.js）
│   ├── api/         系统 API 路由（chat, task, settings, skills, auth, system）
│   ├── chat/        聊天运行时（WS 消息处理 + 并发控制）
│   ├── agent/       Agent 引擎（chat 循环 + 工具执行）
│   ├── llm/         LLM 调用（stream + regular）
│   ├── prompt/      System Prompt 分层构建
│   ├── task/        任务运行时（执行 + 调度）
│   ├── service/     系统业务逻辑
│   └── repository/  数据访问层
│
├── apps/            所有应用（统一平等）
│   ├── index.js     Apps 服务入口
│   ├── registry.js  应用注册表
│   ├── app_shared/  共享函数（agentTask, instantTask）
│   ├── notebook/    自带后端（api/ + service/ + repository/ + APP.md）
│   ├── finance/     自带后端
│   ├── files/       自带后端（api/ + service/，无数据库）
│   ├── chat/        使用系统后端（仅 APP.md）
│   ├── tasks/       使用系统后端（仅 APP.md）
│   ├── settings/    使用系统后端（仅 APP.md）
│   ├── skills/      使用系统后端（仅 APP.md）
│   └── ...          其它应用
│
├── ui/src/          前端
│   ├── App.vue      根组件（纯路由分发）
│   ├── router.js    路由（/, /mobile, /login, /welcome）
│   ├── apps.js      应用注册表（桌面+移动端共用）
│   ├── ws.js        WebSocket 客户端
│   ├── views/       路由直接渲染（4个）
│   │   ├── DesktopView.vue   桌面（窗口管理器+任务栏+壁纸）
│   │   ├── MobileView.vue    移动端（应用网格+二级导航）
│   │   ├── LoginView.vue     登录
│   │   └── WelcomeView.vue   初始化向导
│   ├── apps/        所有应用前端
│   │   ├── chat/    index.vue + History + MobileChatView/Panel
│   │   ├── tasks/   index.vue + create.vue + detail.vue
│   │   ├── settings/ index.vue + Tab 组件
│   │   └── ...
│   ├── components/  框架级共享组件
│   │   ├── ChatPanel.vue        窗口内聊天小面板
│   │   ├── desktop/             Window, Taskbar, Desktop, LauncherPanel...
│   │   └── mobile/              TopBar, AppGrid, UserMenu
│   ├── stores/      全局状态（windowManager, chatPanel, toast）
│   └── i18n/        国际化
│
├── shared/          前后端共享工具
├── database/        SQLite（aios.db + apps/*.db）
├── memory/          记忆系统（注入到 System Prompt）
├── files/           文件存储
├── skills/          技能目录
└── deploy/          部署配置
```

## 应用架构

应用统一在 apps/，两种后端模式：
1. **自带后端**：完整 api/ + service/ + repository/，独立数据库，走 /apps/xxx/
2. **使用系统后端**：后端在 server/，走 /api/xxx/，apps/ 下仅 APP.md

每个自带后端应用导出：
```js
export default {
  name, match, handleApi, initDb?, initRuntime?
}
```

应用通过 `agentTask()` / `instantTask()` 调用系统 AI 能力。

## 前端路由

所有应用路径（/chat, /tasks, /notebook...）被路由守卫拦截 → `windowManager.open()` → 重定向回 /。
手机访问自动跳 /mobile。

## 桌面端
DesktopView 组装：Desktop + Window×N + Taskbar + ContextMenu + WallpaperPicker。
窗口全屏高度 `calc(100vh - 46px)` 不遮挡任务栏。
窗口标题栏有聊天按钮 → 右上角 ChatPanel 小面板。

## 移动端
MobileView 组装：TopBar + AppGrid + UserMenu。
provide('mobileNav') 支持子应用二级导航（返回按钮+动态标题）。

## 数据库

主数据库 database/aios.db：
- chats, messages（对话和任务共用）, tasks, schedules, settings, users, sessions

应用数据库 database/apps/*.db：
- 各应用独立

## Agent 系统
chat() 循环：callLlmStream → 检查 tool_calls → runTools → 继续循环。
当前唯一工具：shell。结果超限截断（头70%+尾30%）。

## System Prompt
分层构建：INSTRUCTION.md → language → memory → environment → model → tools → apps → skills → chats

## 任务系统
- Instant Task：单次 LLM 调用，结构化输出
- Agent Task：chat() 循环，支持工具
- 调度器：每分钟 tick，cron/run_at 匹配触发

## WebSocket
C→S：message, abort
S→C：delta, tool_call, tool_result, done, error, tasks_changed
同一连接同时只允许一个 chat() 执行。
