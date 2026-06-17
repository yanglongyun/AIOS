// AGENT 浏览器连接器 · Service Worker 入口
//   · WS bridge → ws.js(连本地 AGENT 的 /ws?client=extension)
//   · popup 通信 → popup-bridge.js
//   · 工具实现 → tools/*
//
// 连接地址在 ../config.js,默认指向本地 AGENT(ws://127.0.0.1:9500)。
// 常驻 worker,收到 AGENT 下发的 tool.call 后执行并回传结果。

import { connect } from './ws.js';
import './popup-bridge.js';

chrome.runtime.onInstalled.addListener(() => { connect(); });
chrome.runtime.onStartup.addListener(() => { connect(); });
connect();
