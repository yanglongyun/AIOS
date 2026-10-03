# AIOS

跑在你自己机器上的 AI 操作系统。装在一台服务器(或家里的电脑)上,用浏览器打开,
用对话让 AI 操作这台机器的文件、命令和应用。

## 内置应用

右上角 ⚏ 打开应用中心,像谷歌一样在应用之间切换:

| 应用 | 做什么 |
| --- | --- |
| 聊天 | 和 AI 对话。AI 能执行命令、读写文件、调用已安装应用的接口;长对话自动压缩上下文 |
| 文件 | 浏览、预览、编辑这台机器上的文件 |
| 状态 | CPU / 内存 / 磁盘、应用进程、AI 起的后台进程 |
| 设置 | 模型连接、助手指令、规则、技能、登录密码 |

## 应用机制

除了内置应用,其余能力都是「应用」:`~/.aios/apps/<id>/` 下的一个目录。

```
~/.aios/apps/<id>/
  manifest.json   是什么、怎么跑(run.command / args / health / mode)
  APP.md          给 AI 看的接口说明
  ...             任意语言、任意框架,监听 $PORT 即可
```

宿主负责扫描、按需拉起、健康检查、闲置回收。应用通过环境变量拿到
`PORT`、`APP_DATA_DIR`、`HOST_URL`、`APP_TOKEN`,可以用 `APP_TOKEN` 回调宿主(通知、调模型、派任务给 AI)。
在聊天里让 AI 帮你做一个应用,写完就出现在应用中心里。

服务器上要在浏览器里打开应用界面,需要给每个应用一个子域名:设置 `AIOS_APP_DOMAIN`。
没有域名时可以用 sslip.io,例如 IP 是 `47.236.196.138`:

```bash
AIOS_APP_DOMAIN=47-236-196-138.sslip.io
```

然后从 `http://47-236-196-138.sslip.io:9500` 打开 AIOS,应用在 `http://<id>.47-236-196-138.sslip.io:9500`。

## 模型

只接 OpenAI Responses API(`/v1/responses`)。在「设置 → 模型」里填接口地址、API Key、模型名,
例如 `https://api.openai.com/v1/responses`。不支持 Responses API 的服务商可以通过 OpenRouter 等中转接入。

## 安装

需要 Node.js 22.18 或更高版本。

```bash
git clone https://github.com/yanglongyun/AIOS.git && cd AIOS
npm install && npm run build
AIOS_PASSWORD='你的密码' npm start
```

浏览器打开 `http://<机器IP>:9500`。云服务器记得在安全组放行 9500 端口。

Linux 服务器可以用一键脚本(装 Node、构建、注册成开机自启的 systemd 服务):

```bash
curl -fsSL https://raw.githubusercontent.com/yanglongyun/AIOS/main/install.sh | sudo bash
```

### 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `AIOS_PORT` | `9500` | 端口 |
| `AIOS_HOST` | `0.0.0.0` | 监听地址 |
| `AIOS_HOME` | `~/.aios` | 数据目录(数据库、应用、技能) |
| `AIOS_PASSWORD` | — | 登录密码。不设时首次启动随机生成,打印在日志里并写入 `~/.aios/initial-password.txt` |
| `AIOS_APP_DOMAIN` | — | 应用子域名的根域名,见上文 |

## 开发

```bash
npm run dev   # 服务端(改动自动重启)
npm run ui    # 前端 Vite 开发服务器,代理到 9500
npm run typecheck && npm test
```

## 许可

MIT
