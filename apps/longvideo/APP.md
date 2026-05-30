---
name: longvideo
description: 视频工坊应用，把项目描述拆成大纲与分段解说，调用阿里云百炼生成图片与语音并落盘，最后用 ffmpeg 真实拼接成 mp4。
backend: server/apps/longvideo
frontend: gui/src/apps/longvideo
database: database/apps/longvideo.db
---

# 视频工坊

视频工坊用于制作中文长视频。它把项目描述拆成大纲、分段解说、图片提示词，再调用阿里云百炼（DashScope）生成每段的图片与语音、落盘到本地，最后用 ffmpeg 逐段出片并拼接成最终 mp4。

## 能力

- 创建视频项目并用系统模型生成结构化大纲、分段解说词与每段图片提示词。
- 调用阿里云百炼生成图片与语音，结果下载到 `files/exports/longvideo/<projectId>/` 本地磁盘（不再依赖远端临时 URL）。
- 异步串行队列驱动素材生成与视频拼接，每段含自动重试；失败段落可在前端单独重试。
- 用 ffprobe 读取每段语音真实时长，ffmpeg 逐段（静图 + 音频）出片再 concat 拼接为 `final.mp4`。
- 前端实时轮询进度，展示每段图片缩略图、音频播放器与最终成片播放器。

阿里云百炼授权保存在本应用数据库，由应用内设置页写入；未配置时素材生成会以 `error` 返回并提示配置。

## 队列与重启

素材/拼接走进程内单 worker 串行队列（`service/queue.js`）。进程重启会丢失内存队列，`initRuntime` 会把残留的 `running`/`generating`/`rendering` 状态复位为 `error`，提示用户重试。

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/apps/longvideo/projects` | 列出项目 |
| GET | `/apps/longvideo/settings` | 获取素材生成设置 |
| POST | `/apps/longvideo/settings` | 保存素材生成设置 |
| POST | `/apps/longvideo/settings/test-image` | 测试图片生成连通性 |
| POST | `/apps/longvideo/settings/test-audio` | 测试语音生成连通性 |
| GET | `/apps/longvideo/project?id=1` | 获取项目详情和分段 |
| POST | `/apps/longvideo/project` | 创建项目 |
| POST | `/apps/longvideo/project/generate-plan` | 生成大纲、解说和图片提示词 |
| POST | `/apps/longvideo/project/generate-assets` | 入队生成图片与音频 |
| POST | `/apps/longvideo/segment/retry` | 重试单个失败段落（body: `{ segmentId }`） |
| POST | `/apps/longvideo/project/assemble` | 入队 ffmpeg 拼接出片 |

## 状态

项目级：`draft`（仅定义）→ `planned`（已规划）→ `generating`（素材生成中）→ `assets_ready`（素材就绪）→ `rendering`（拼接中）→ `done`（已出片）；任何阶段失败为 `error`，`error` 字段含原因。`progress` 为 0-100，`video_path` 为成片绝对路径。

段落级 `image_status` / `audio_status`：`idle` → `running` → `ready`，失败为 `error`。`audio_duration` 为 ffprobe 读出的真实秒数。

## 本地素材预览

图片、音频、成片都以绝对路径存库，前端通过主服务的 `/api/fs/read?path=<abs>` 预览与播放。
