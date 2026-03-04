---
name: redmill
description: 红磨坊 - 小红书风格自媒体创作台，AI 生成多页文案与配图。数据在 apps_redmill_projects, apps_redmill_pages。
---

# 红磨坊

输入主题，AI 生成小红书风格的多页图文内容，左侧编辑文案，右侧预览排版。

API:
- `POST /apps/redmill/create` - 输入主题，AI 生成内容大纲
- `GET /apps/redmill/detail?id=xxx` - 获取项目详情（含所有页面）
- `POST /apps/redmill/update` - 更新页面文案
- `GET /apps/redmill/list` - 项目列表
- `POST /apps/redmill/delete` - 删除项目
