---
name: nokia
description: 老手机 - AI 驱动的复古手机模拟器。用户选择选项，AI 生成新的 HTML 界面。数据在 nokia_sessions。
---

# 老手机

复古手机互动游戏，AI 根据用户选择动态生成手机界面。

## API
- `GET /apps/nokia/progress` - 获取最近一次游戏进度
- `POST /apps/nokia/generation` - 生成新界面（参数：history, now, choices, next）

## 数据表
- `nokia_sessions` - 游戏会话记录（current_screen, screen_history, battery_level）
