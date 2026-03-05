# 创建脚本指南

## 目标

脚本是给 Agent 直接执行的能力，不是给前端直接调用的 API。

## 目录结构（硬规则）

每个应用的每个脚本必须使用独立目录，并包含 `SCRIPT.md`：

```
apps/{appname}/scripts/
└── {script_name}/
    ├── SCRIPT.md
    ├── index.sh      # 或 index.js（二选一）
    └── ...           # 脚本内部依赖文件（可选）
```

## SCRIPT.md 规范（必须）

```md
---
name: sync_positions
description: 同步持仓并写入 apps_cryptobot_positions
---

## 输入
- key: API key
- secret: API secret

## 输出
- JSON: { success: boolean, count: number }

## 副作用
- 写数据库表：apps_cryptobot_positions
- 读取文件：files/uploads/...

## 执行
- sh apps/cryptobot/scripts/sync_positions/index.sh

## 安全
- 禁止删除数据库文件
- 禁止写入应用目录外的任意路径
```

## 约定

- Agent 先读取 `SCRIPT.md` 再执行脚本。
- 执行入口固定 `index.sh` 或 `index.js`。
- 不允许无文档脚本（没有 `SCRIPT.md` 的脚本目录视为无效）。
- 脚本只做一件事，保持单一职责。
