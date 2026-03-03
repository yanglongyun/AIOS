---
name: dailycheck
description: 每日打卡 - 每天一条记录（提问/回答/回应），由 agent 结合历史信息持续追问。核心数据表为 apps_dailycheck_daily。
---

# 每日打卡

## 应用定义

这是一个「一天一条记录」的持续引导应用。  
每一天都围绕同一条 daily 记录完成三个动作：

1. 提问：agent 生成当天问题 `question`
2. 回答：用户提交回答 `answer`
3. 回应：agent 给出简短回应 `response`

同时，agent 会维护一个内部备注 `note`（仅 agent 可见，不展示给用户），用于记录：
- 对用户阶段目标的判断
- 当前阻碍/风险点
- 下一次提问策略

API:
- `GET /apps/dailycheck/today`
- `POST /apps/dailycheck/answer`
- `GET /apps/dailycheck/history?page=1&pageSize=10`
- `POST /apps/dailycheck/refresh`

## 数据模型

单表：`apps_dailycheck_daily`

- `id`
- `date`（`YYYY-MM-DD`，唯一）
- `question`
- `answer`
- `response`
- `note`（agent 内部备注）
- `created_at`
- `updated_at`

## AI 处理方式

dailycheck 不走纯 LLM 直出，而是走核心 agent task 流程。

### 1) 生成问题（提问阶段）

- dailycheck 向 `/api/task` 提交任务（`app: "dailycheck"`）
- agent 通过 `shell` 查询历史回答、近期对话摘要、相关应用数据
- agent 输出结构化 JSON：

```json
{ "question": "...", "note": "..." }
```

- 应用写入当天记录的 `question` 与 `note`

### 2) 用户回答（回答阶段）

- 用户提交 `answer`
- 更新当天记录

### 3) 生成回应（回应阶段）

- 再向 `/api/task` 提交任务
- agent 基于当天 `question + answer + 既有 note` 生成：

```json
{ "response": "...", "note": "..." }
```

- 更新当天记录的 `response` 与 `note`

## 约束

- 用户界面只展示：`question / answer / response`
- `note` 始终仅供 agent 内部使用
- 每天仅维护一条 daily 记录，不做多条并行问答
