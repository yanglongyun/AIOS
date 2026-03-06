# 创建脚本指南

## 目标

脚本是给 Agent 直接执行的能力，不是给前端直接调用的 API。

## 目录结构（硬规则）

每个脚本必须使用独立目录，并包含 `SCRIPT.md`：

```
scripts/
└── {script_name}/
    ├── SCRIPT.md
    ├── index.mjs     # 或 index.js / index.sh（三选一）
    └── ...           # 脚本内部依赖文件（可选）
```

## SCRIPT.md 规范（必须）

```md
---
name: sync_positions
description: 同步持仓并写入 apps_cryptobot_positions
visibility: true
usage: node scripts/sync_positions/index.mjs --dry-run
---
```

## 约定

- `SCRIPT.md` 前置元数据必须包含 4 个字段：
  - `name`
  - `description`
  - `visibility`（`true` / `false`）
  - `usage`（完整执行方式）
- Agent 先读取 `SCRIPT.md` 再执行脚本。
- `visibility: true` 的脚本会注入系统提示词；`false` 不注入。
- 执行入口为 `index.mjs` / `index.js` / `index.sh` 任一即可。
- 不允许无文档脚本（没有 `SCRIPT.md` 的脚本目录视为无效）。
- 脚本只做一件事，保持单一职责。
