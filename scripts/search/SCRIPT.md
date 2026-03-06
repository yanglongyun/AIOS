---
name: search
description: 多搜索引擎统一检索（失败自动轮换，全部失败则返回错误详情）。
visibility: true
usage: node scripts/search/index.mjs "OpenAI API" 5 --engines=duck,bing,google,you,baidu,sogou,yandex --timeoutMs=8000
---

## 输入
- `query`：搜索关键词（可选，默认 `OpenAI`）
- `limit`：结果数量（可选，默认 `5`，最大 `20`）
- `--engines=`：引擎顺序（可选，默认 `duck,bing,google,you,baidu,sogou,yandex`）
- `--timeoutMs=`：单引擎超时毫秒（可选，默认 `8000`）

## 输出
- 标准输出（stdout）返回 JSON：
  - 成功：包含命中引擎、是否触发 fallback、结果列表
  - 失败：包含每个引擎尝试的错误详情

## 执行
- `node scripts/search/index.mjs "OpenAI API" 5`
- `node scripts/search/index.mjs "OpenAI API" 5 --engines=google,you,duck,bing --timeoutMs=10000`

## 安全
- 只做 HTTP GET 抓取公开搜索页面/RSS
- 不写数据库，不修改业务文件
