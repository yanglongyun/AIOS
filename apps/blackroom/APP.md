---
name: blackroom
description: 小黑屋 - 用户表达不满与情绪发泄的应用，支持提交批评和投掷大便 emoji。数据在 apps_blackroom_records。
---

# 小黑屋

当用户对 AI 不满意时，可以在这里提交批评内容，也可以点击大便 emoji 表达情绪。
应用会通过 task 机制将不满反馈交给 Agent 处理（例如更新记忆、调整行为），并记录处理回复。

API:
- `GET /apps/blackroom/list?page=1&pageSize=10`
- `POST /apps/blackroom/submit`
