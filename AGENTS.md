# AIOS 工作约定

## 仓库角色

- `AIOS/` 是开发源头，只在这里改代码。
- `AIOS/` 不是运行源头，不在这里执行 `npm install`、`npm run dev`、`npm run build`、`npm start`。
- 运行源头固定是同级目录 `../AIOS-dev/aios`，由 `AIOS/scripts/dev.mjs` 统一创建、同步、烘焙并启动。

## 为什么这样约定

- `AIOS/package.json` 的 pre 钩子会执行 `node scripts/start.mjs`。
- `start.mjs` 会把语言占位符烘焙进源码。
- 如果直接在 `AIOS/` 里运行，源码会被批量改写，diff 会变脏，真实改动会被淹没。

## 标准工作流

1. 在 `AIOS/` 里改代码。
2. 在 `AIOS/` 里执行 `node scripts/dev.mjs`。
3. 脚本会把当前源码同步到 `../AIOS-dev/aios`。
4. 运行和烘焙都发生在 `../AIOS-dev/aios`。

## dev.mjs 用法

- `node scripts/dev.mjs`：默认 `zh`，同步后启动。
- `node scripts/dev.mjs en`：用英文运行。
- 脚本不会清理数据库、文件或 `.aios` 状态。
- 脚本不会执行 `npm install`，运行副本依赖需要提前准备好。

## 给 AI / Agent 的硬规则

- 改代码只改 `AIOS/`。
- 不要在 `AIOS/` 里运行任何会触发烘焙的 npm 脚本。
- 需要运行或验证时，只使用 `AIOS/scripts/dev.mjs`。
- 不要手动修改 `AIOS-dev/aios` 里的代码；它只是运行副本，不是源码。
