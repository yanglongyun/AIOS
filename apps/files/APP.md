---
name: files
description: 文件管理 - 上传、浏览、下载、删除文件，无独立数据库。
backend: apps/files（由 server/api/index.js 直接挂载）
frontend: ui/src/apps/files
database: 无（直接操作 files/ 目录）
---

# 文件管理（files）

## 目录结构
- `api/`：HTTP handler
- `service/`：文件操作逻辑
- `APP.md`：应用说明

## API
- `POST /api/files/upload`：上传文件（`name`, `data`, `dir`）
- `GET /api/files/list?dir=`：列出目录内容
- `POST /api/files/delete`：删除文件（`path`）
- `GET /api/files/download?path=`：下载文件

## Service
- `upload({ name, data, dir })`：Base64 解码写入文件
- `list(dir)`：列出目录下文件和子目录
- `remove(path)`：删除指定文件
- `download(res, path)`：流式返回文件内容

## 存储
- 文件存储在项目根目录 `files/` 下
- `safePath()` 确保路径不越界

## 当前边界
- files 是核心能力，虽然代码放在 `apps/files/`，但实际由主服务 `server/api/index.js` 直接接入。
- 不走独立 `apps` 子应用服务，也没有独立 SQLite 数据库。
