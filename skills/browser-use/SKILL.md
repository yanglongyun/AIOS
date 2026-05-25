---
name: 浏览器操作
description: 通过本机 Browser Use 服务和 Chrome 插件操作浏览器；支持 shell/API 调用打开标签、列出标签、切换、关闭、导航、执行页面 JavaScript 和截图。
---

# 浏览器操作

这个 skill 由两部分组成：

- `extension/`：Chrome 插件，连接本机服务并执行 `chrome.*` 浏览器操作。
- `service/`：本机 HTTP/WebSocket 服务，对 shell 暴露 API。

## 启动服务

```bash
bash skills/browser-use/scripts/start-service.sh
```

默认监听：

```text
http://127.0.0.1:8765
```

## 加载插件

在 Chrome 打开 `chrome://extensions`，开启开发者模式，加载目录：

```text
/Users/woodchange/Desktop/AIOS/skills/browser-use/extension
```

插件会连接：

```text
ws://127.0.0.1:8765/extension
```

## Shell 调用

```bash
bash skills/browser-use/scripts/browser-use.sh browser_status
bash skills/browser-use/scripts/browser-use.sh browser_tabs '{"currentWindow":true}'
bash skills/browser-use/scripts/browser-use.sh browser_open_tab '{"url":"https://example.com"}'
bash skills/browser-use/scripts/browser-use.sh browser_navigate '{"url":"https://example.com"}'
bash skills/browser-use/scripts/browser-use.sh browser_evaluate '{"script":"return document.title"}'
```

截图保存到本地：

```bash
bash skills/browser-use/scripts/browser-use.sh browser_screenshot '{"format":"png","outputPath":"/tmp/browser-use.png"}'
```

## HTTP API

```bash
curl -s http://127.0.0.1:8765/status
curl -s http://127.0.0.1:8765/tools
curl -s -X POST http://127.0.0.1:8765/call \
  -H 'Content-Type: application/json' \
  -d '{"tool":"browser_tabs","args":{"currentWindow":true}}'
```

## 工具

- `browser_status`
- `browser_open_tab`
- `browser_tabs`
- `browser_activate_tab`
- `browser_close_tab`
- `browser_navigate`
- `browser_evaluate`
- `browser_screenshot`

`browser_evaluate` 使用 Chrome DevTools `Runtime.evaluate`，可以读写 DOM、点击元素、填表、触发事件和滚动页面。
