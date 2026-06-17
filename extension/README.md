# browser-use 连接器(Chrome 扩展)

AGENT 浏览器控制的执行端。通过 WebSocket 接入本地 AGENT,接收 AI 下发的 `tool.call` 在真实浏览器里执行,把结果回传。

```
AI(对话) → AGENT 后端(hub) --WS--> 本扩展(执行) → Chrome 标签页
```

## 装上并连接

1. 启动 AGENT 后端:`npm run server`(默认 `http://127.0.0.1:9500`)。
2. 打开 Chrome → `chrome://extensions` → 右上角开「开发者模式」→「加载已解压的扩展程序」→ 选本目录 `extension`。
3. 默认配置(`config.js`)已指向本地 AGENT,装好即自动连接。打开 AGENT 的「控制」页,Browser 应显示 **Online**。

> 要连别的地址(如远端 AGENT),点扩展图标在 popup 里填 `WS_URL` / `TOKEN`,或改 `config.js`。AGENT 不校验 token,任意非空值即可。

## 暴露的能力(tools)

| tool | 说明 |
|---|---|
| `browser_open` | 打开网址(新标签,前台),等加载完成 |
| `browser_read` | 读取当前页可见文本 |
| `browser_click` | 按 CSS 选择器或文本点击 |
| `browser_fill` | 往输入框填值 |
| `browser_screenshot` | 截取当前页 |
| `browser_tabs` / `browser_navigate` / `browser_evaluate` | 标签列表 / 导航 / 执行 JS(备用) |

AI 通过 `POST http://127.0.0.1:9500/api/controls/browser/call`(body: `{ tool, args }`)调用,详见 AGENT 系统提示词里的「控制」一节。

## 协议

```
AGENT → 扩展：{ type: "tool.call", id, name, args }
扩展 → AGENT：{ id, type: "tool.result", result }  /  { id, type: "tool.error", error }
心跳：扩展每 25s 发 { type: "ping" },AGENT 回 { type: "pong" }
```

连接地址:`ws://127.0.0.1:9500/ws?client=extension&token=<token>`。

## 文件

- `manifest.json` —— MV3 清单(CSP 已放行 `ws://127.0.0.1:9500`)
- `config.js` —— 连接默认值(本地开箱即用);`config.example.js` 是模板
- `src/ws.js` —— WS 连接 / 心跳 / 重连
- `src/tools/` —— 各浏览器工具实现(CDP + chrome API)
- `popup.*` —— 状态与配置面板
