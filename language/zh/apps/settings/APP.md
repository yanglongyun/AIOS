---
id: settings
title: 设置
description: 系统设置应用。配置模型/API 地址/Key/上下文轮数,查看系统提示词与技能列表,切换主题。
---

# 设置

纯前端应用(ui/src/apps/settings/),无独立后端目录与数据库,数据走 system 服务的 /api/settings。

五个标签页:
- 模型:model、apiUrl、apiKey、contextTurns(上下文轮数,数字),保存即生效
- 提示词:只读展示当前发给模型的完整系统提示词(promptPreview)
- 技能:只读展示系统当前可用技能(name + description)
- 主题:浅色/深色/跟随系统(纯前端 theme store,不走接口)
- 关于:项目信息与链接

接口(system 层):
- GET /api/settings -> { ok, settings: { model, apiUrl, apiKey, contextTurns }, promptPreview, skills }
- POST /api/settings { model, apiUrl, apiKey, contextTurns } -> { ok }
