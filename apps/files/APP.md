---
name: files
description: 文件管理 - 上传、浏览、下载、删除文件，无独立数据库。
backend: apps/files
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
