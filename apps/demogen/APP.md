---
name: demogen
description: Demo 生成器，用于围绕同一个功能生成多套可比较的 demo 方案与实现任务。
frontend: gui/src/apps/demogen
database: none
---

# Demo 生成器

Demo 生成器用于把一个功能需求拆成多套 demo 方向。它先生成结构化方案，再为每套方案并发启动独立 agent 任务。

## 流程

1. 用户输入功能描述、方案数量和约束。
2. 即时 JSON 任务生成多套 demo 方案。
3. 每套方案组合原始需求和方案上下文，启动一个后台 agent 任务。
4. agent 任务把产物写入 `files/exports/demogen/` 下的独立目录。

## 约定

- 方案生成必须使用 JSON 输出。
- demo 生成任务不共用上下文，避免方案之间互相污染。
- 每套 demo 都应该能独立打开或运行。
