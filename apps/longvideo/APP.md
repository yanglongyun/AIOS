---
name: longvideo
description: 视频工坊应用，用于生成超长解说视频的大纲、分段解说、图片、音频和拼接任务。
backend: server/apps/longvideo
frontend: gui/src/apps/longvideo
database: database/apps/longvideo.db
---

# 视频工坊

视频工坊用于制作中文长视频。它把项目描述拆成大纲、分段解说、图片提示词、音频任务、图片任务和最终拼接任务。

## 能力

- 创建视频项目。
- 用系统模型生成结构化大纲、分段解说词和每段图片提示词。
- 将分段送入火山引擎图片与语音生成队列。
- 在素材齐备后进入视频拼接队列。

火山引擎 Ark 图片接口和语音接口的授权信息保存在视频工坊数据库中，由应用内设置页写入。当前未配置或未授权时，素材会停留在 `pending_provider_config` 或 `blocked` 状态。

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/apps/longvideo/projects` | 列出项目 |
| GET | `/apps/longvideo/settings` | 获取素材生成设置 |
| POST | `/apps/longvideo/settings` | 保存素材生成设置 |
| GET | `/apps/longvideo/project?id=1` | 获取项目详情和分段 |
| POST | `/apps/longvideo/project` | 创建项目 |
| POST | `/apps/longvideo/project/generate-plan` | 生成大纲、解说和图片提示词 |
| POST | `/apps/longvideo/project/generate-assets` | 进入图片与音频生成 |
| POST | `/apps/longvideo/project/assemble` | 进入视频拼接 |

## 创建项目

```json
{
  "title": "AI 时代的操作系统",
  "prompt": "讲清楚 AI 如何重塑操作系统、应用和软件分发，整体采用纪录片式叙事，信息密度高，画面克制。"
}
```

## 状态

- `draft`: 只有项目定义。
- `planned`: 已生成大纲和分段。
- `asset_queue`: 素材生成队列已创建。
- `blocked`: 缺少外部 provider 配置或素材。
- `pending_provider_config`: 分段素材等待火山引擎配置。
