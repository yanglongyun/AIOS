---
name: playground
description: 游乐园 - AI 生成 HTML 场景的创意工具。用户描述想法，AI 生成可交互的 HTML 页面。数据在 playground_versions。
---

# 游乐园

AI 生成 HTML 场景，用户描述想法即可得到可交互的页面。

## API
- `GET /api/apps/playground/list` - 获取场景列表
- `GET /api/apps/playground/latest` - 获取最新场景
- `GET /api/apps/playground/detail?id=xxx` - 获取场景详情
- `POST /api/apps/playground/create` - 创建场景（参数：prompt, html, name, suggestions）

## 数据表
- `playground_versions` - 场景版本（name, prompt, html, suggestions）
