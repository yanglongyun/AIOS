---
name: 电脑操作
description: 通过本机 Computer Use 服务操作电脑；支持 shell/API 调用查看状态、截图、移动鼠标、点击、滚动、输入文本、按键和快捷键。
---

# 电脑操作

这个 skill 提供一个本机 HTTP 服务，让 AIOS 可以用统一 API 操作当前电脑。

## 启动服务

```bash
bash skills/computer-use/scripts/start-service.sh
```

默认监听：

```text
http://127.0.0.1:9521
```

## Shell 调用

```bash
bash skills/computer-use/scripts/computer-use.sh computer_status
bash skills/computer-use/scripts/computer-use.sh computer_screenshot '{"outputPath":"/tmp/computer-use.png"}'
bash skills/computer-use/scripts/computer-use.sh computer_mouse_move '{"x":500,"y":300}'
bash skills/computer-use/scripts/computer-use.sh computer_click '{"x":500,"y":300,"button":"left"}'
bash skills/computer-use/scripts/computer-use.sh computer_type '{"text":"hello"}'
bash skills/computer-use/scripts/computer-use.sh computer_key '{"key":"enter"}'
bash skills/computer-use/scripts/computer-use.sh computer_hotkey '{"keys":["command","l"]}'
bash skills/computer-use/scripts/computer-use.sh computer_scroll '{"direction":"down","amount":3}'
```

## HTTP API

```bash
curl -s http://127.0.0.1:9521/status
curl -s http://127.0.0.1:9521/tools
curl -s -X POST http://127.0.0.1:9521/call \
  -H 'Content-Type: application/json' \
  -d '{"tool":"computer_status","args":{}}'
```

## 自测

```bash
bash skills/computer-use/scripts/test-service.sh
```

自测会启动服务、读取状态、列出工具，并保存一张截图到 `/tmp/computer-use-test.png`。

## 工具

- `computer_status`
- `computer_screenshot`
- `computer_mouse_move`
- `computer_click`
- `computer_double_click`
- `computer_right_click`
- `computer_scroll`
- `computer_type`
- `computer_key`
- `computer_hotkey`

## 平台依赖

- macOS：
  - 截图使用系统 `screencapture`。
  - 键盘输入使用系统 `osascript` / System Events。
  - 鼠标移动、滚动优先使用 `cliclick`；未安装时，点击会尝试 System Events 的 `click at`。
- Linux：
  - 鼠标和键盘需要 `xdotool`。
  - 截图使用 `gnome-screenshot`、`scrot` 或 ImageMagick `import`。
- Windows：
  - 使用 PowerShell 调用系统 API。

首次执行截图、键盘或鼠标操作时，系统可能要求给 Terminal / Codex 授予屏幕录制或辅助功能权限。
