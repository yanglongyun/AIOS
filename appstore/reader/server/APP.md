---
name: reader
description: 阅读器 - 互动式章节故事应用，每轮固定 3 个选项并持续推进剧情。数据在 reader_sessions 和 reader_chapters。
backend: apps/reader
database: database/apps/reader.db
---

# 阅读器

目标：持续推进互动故事，每轮固定输出 3 个选项，并维护“故事梗概 + 当前进度”。

接口：
- `GET /apps/reader/list`
- `POST /apps/reader/create`
- `GET /apps/reader/history?sessionId=1`
- `POST /apps/reader/generate`
- `POST /apps/reader/reset`

约定：
- 每章由 AI 输出：`content`、`choices[3]`、`summary`、`progress`
- summary 为累计梗概；progress 为章节进度描述
