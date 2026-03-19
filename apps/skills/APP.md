---
name: skills
description: 技能管理 - 浏览和管理 AI 可用的技能（Markdown 技能文件）。
backend: server/（api/skills.js, service/skills/）
frontend: ui/src/apps/skills
database: 无（读取 skills/ 目录下的 .md 文件）
---

# 技能管理（skills）

## 代码分布（尚未完全拆分）
- `server/api/skills.js`：HTTP 路由入口
- `server/service/skills/list.js`：扫描 skills/ 目录

## API
- `GET /api/skills`：技能列表

## 存储
- 技能文件存储在项目根目录 `skills/` 下
- 每个 `.md` 文件是一个技能定义
