---
name: frontend-design
description: AIOS 前端设计语言(v6)。灰白蓝、克制、留白;token 驱动配色、全局工具类、标准页面骨架、lucide-only 图标与移动端浮层规范。
---

# AIOS 前端设计语言(v6)

AIOS 是本机运行的 Web UI。视觉方向:**灰白蓝、克制、留白**。干净的浅灰底 + 白卡 + 一点蓝。不做拟物、不做暗色重质感、不做营销页。

## 颜色与 token

所有颜色一律走 `ui/src/style.css` 的 token,禁止硬编码色值:

- 页面底 `--color-bg` #f6f6f7;白卡 `--color-bg-elev`;墨色文字 `--color-ink` #1d1d20;次级 `--color-muted` / `--color-faint`;细线 `--color-line` / `--color-line-hi`。
- 强调蓝 `--color-accent` #3b82f6,浅蓝底 `--color-blue-bg`;状态色 `--color-good` 绿、`--color-bad` 红。
- 阴影用 `--shadow` 三档,不自造阴影。

## 全局工具类

- `.dot-grid` 点阵底纹(应用全幅背景)
- `.page` max-width 860px 居中内容容器
- `.soft-card` 大圆角白卡
- `.halo-focus` 聚焦光圈
- `.chip-card` 建议胶囊
- `.save-btn` 主按钮(扁平蓝)、`.text-input` 输入框

## 标准页面骨架

```html
<div class="absolute inset-0 overflow-y-auto dot-grid">
  <div class="page"> ... </div>
</div>
```

标准页面 = 点阵全幅背景 + 860px 居中 `.page` + 标题行(h2 17px/700 + 右侧动作)+ 白卡列表/表单(圆角 10-16px + 1px 细边线 + `--shadow`)。

## 禁令

- 禁止渐变、纹理、浮雕/内凹阴影、serif 字体。
- 禁止 emoji 当图标。**图标只用 lucide-vue-next**,按需 import 组件;应用图标在 `ui/src/apps.js` 注册表里声明为组件引用。
- 不引入组件库,不为单应用引入 store。

## 布局与外壳

- 系统只有全局顶栏(`ui/src/system/panel/TopBar.vue`):左侧为当前应用注册的动作 + 标题,右侧宫格按钮弹出应用面板(3 列网格)。顶栏以下一切归应用自管。
- 应用通过 `topTitle` / `topLeftAction`(`ui/src/system/shell.js`)与顶栏交互,`onUnmounted` 必须清理。
- 移动端:覆盖类面板用浮层 + 遮罩(参考 chat 历史侧栏的 `@media (max-width: 768px)`),不挤压内容;消息与长文本自动换行,不出横向滚动。

## 对话与工具调用

- 用户消息、AI 消息、工具调用要有明确视觉区分。
- 工具调用用单工具卡片呈现,每个工具独立一张,默认收起,展开后显示输入输出。组件 `ui/src/apps/chat/components/bubbles/ToolCall.vue`,可跨应用复用。

## 应用特色层

应用允许有自己的特色层(如记事本的马卡龙贴纸色板),但必须建立在 token 骨架之上、保持淡色系小清新,不破坏整体语言。加载、空态、错误态都要有。

## 参考文件

- `ui/src/style.css` — 设计 token 与全局工具类
- `ui/src/App.vue` — 外壳:全局顶栏 + 当前应用铺满
- `ui/src/system/panel/TopBar.vue` — 顶栏与应用面板
- `ui/src/apps/notepad/` — 最完整的应用样例(含特色层)
- `ui/src/apps/chat/components/bubbles/ToolCall.vue` — 单工具调用卡片
