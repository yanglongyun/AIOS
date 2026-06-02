---
name: demogen
description: Demo 生成器，围绕同一个功能生成多套可比较的单文件 HTML demo，支持并排对比与按方案迭代改稿。
backend: server/apps/demogen
frontend: gui/src/apps/demogen
database: database/apps/demogen.db
---

# Demo 生成器

Demo 生成器把一个功能需求拆成多套差异明显的 demo 方向，先生成结构化方案，再为每套方案并发启动独立 agent 任务，产出可直接在浏览器打开的单文件 HTML，并支持并排对比与逐套改稿。

## 流程

1. 用户输入功能描述、方案数量与约束。
2. 即时 JSON 任务生成多套方案（name / angle / highlights）。
3. 每套方案组合原始需求与方案上下文，启动一个后台 agent 任务，把单文件 `index.html` 写入 `files/exports/demogen/<feature>-<batch>/<plan>/`。
4. 任务结束后后端扫描产物目录定位入口 HTML，落库 `entry_path`，标记 `done`。
5. 前端通过 `/api/fs/read?path=<abs>` 用 iframe 预览；可在「并排对比」台横向比较多套已完成 demo，或对单套发起迭代改稿。

## 后端单一事实源

提示词与产物目录的计算都在 `server/apps/demogen/service/generate.js`，目录是单一事实源，避免前后端漂移。agent 被要求只产出单文件 HTML（内联 CSS/JS），保证 iframe 经 `fs/read` 预览时不会因相对路径失效。

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/apps/demogen/projects` | 列出项目 |
| GET/POST/PATCH/DELETE | `/apps/demogen/project` | 项目增删改查 |
| POST | `/apps/demogen/project/plan` | 生成多套方案 |
| POST | `/apps/demogen/project/build` | 生成全部 demo |
| POST | `/apps/demogen/work/build` | 生成/重建单套 demo |
| POST | `/apps/demogen/work/iterate` | 对单套 demo 迭代改稿 |
| POST | `/apps/demogen/work/resolve` | 任务结束后定位产物并落库状态 |
| DELETE | `/apps/demogen/work` | 删除单套 demo |

## 状态

- 作品：`idle`（待生成）→ `running`（生成中）→ `done`（完成，含 `entry_path`）；失败为 `error`，中止为 `aborted`。
- 约定：方案生成必须 JSON 输出；各 demo 任务不共用上下文，避免互相污染；每套 demo 都是可独立打开的单文件 HTML。
