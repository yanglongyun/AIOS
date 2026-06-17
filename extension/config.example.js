// browser-use 扩展配置 · 复制为 config.js 后按需修改
//
//   cp config.example.js config.js
//
// 默认指向本地 AGENT(server/index.js,端口 9500)。
// AGENT 不校验 token,任意非空字符串即可。

export const BASE_URL = 'http://127.0.0.1:9500';
export const WS_URL   = 'ws://127.0.0.1:9500';
export const TOKEN    = 'local';
