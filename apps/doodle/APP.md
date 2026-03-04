---
name: doodle
description: 涂鸦板 - 上传图片后用鼠标圈定区域，让 AI 精准修改指定位置。数据在 apps_doodle_works。
---

# 涂鸦板

上传图片，用矩形选框圈定区域，输入修改指令，AI 返回编辑后的图片。

API:
- `POST /apps/doodle/upload` - 上传原始图片
- `POST /apps/doodle/edit` - 提交圈选区域和指令，AI 编辑图片
- `GET /apps/doodle/list` - 作品列表
- `GET /apps/doodle/image?id=xxx` - 获取图片
