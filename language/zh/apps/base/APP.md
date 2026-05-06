---
name: base
description: 基地应用，用于查看 iimos 远端应用目录、分类、版本、包状态和应用元信息。
backend: none
frontend: gui/src/apps/base
database: none
---

# base

基地。纯前端应用，用于查看远端应用目录、分类、版本、包状态和应用元信息。

## 位置

- 前端：`gui/src/apps/base`
- 后端：无专属后端
- 数据库：无

## 数据来源

前端读取 `https://iimos.ai/apps/catalog.json`。
