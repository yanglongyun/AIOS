---
name: 触发器
description: 把任务完成、失败或中止等未来事件投递回 AI 对话，并按需唤醒 AI 继续处理。
backend: /api/triggers
database: triggers
---

# 触发器

触发器服务于 AI 对话。它等待未来事件发生，把事件包装成内部消息写入目标会话，再唤醒 AI。
