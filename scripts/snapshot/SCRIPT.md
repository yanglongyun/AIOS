---
name: snapshot
description: 采集 AIOS 运行环境快照并输出到 files/downloads/snapshots。
---

## 输入
- 无

## 输出
- 标准输出（stdout）中的运行快照文本

## 副作用
- 读取本地端口健康检查、日志、数据库文件信息

## 执行
- `sh scripts/snapshot/index.sh`

## 安全
- 只读采集，不修改业务数据库内容
- 不写入项目目录
