---
name: story
description: 故事机 - 互动式章节故事应用，每轮固定 3 个选项并持续推进剧情。数据在 apps_story_sessions 和 apps_story_turns。
---

# 故事机

目标：持续推进互动故事，每轮固定输出 3 个选项，并维护“故事梗概 + 当前进度”。

接口：
- `GET /api/apps/story/list`
- `POST /api/apps/story/create`
- `GET /api/apps/story/history?sessionId=1`
- `POST /api/apps/story/generate`
- `POST /api/apps/story/reset`

约定：
- 每章由 AI 输出：`content`、`choices[3]`、`summary`、`progress`
- summary 为累计梗概；progress 为章节进度描述
