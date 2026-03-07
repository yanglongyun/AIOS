---
description: 开发经验记录 - 构建命令、环境问题等
---

## 构建命令

- 使用 `npm run build`，不是 `pnpm build`
- 项目默认包管理器是 pnpm，但 build 脚本已注册到 npm

## 问题排查

- 子页面无法滚动：检查 App.vue 是否有 `overflow-hidden`，可能是外部锁死了滚动
- 解决：在子页面加 `h-full overflow-y-auto`
