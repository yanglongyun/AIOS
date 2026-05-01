# CLAUDE.md

`AGENTS.md` 是给 Codex、Claude Code 等开发协作者读的项目指南,不是 iimos 运行态 AI 的系统提示词。运行态 AI 指令保存在数据库 `settings.systemPrompt`,由 `server/main/service/prompt/index.js` 组装进模型上下文。

如果你是开发协作者,几条要点:

- 当前目录就是 iimos 的运行态 workspace —— 你改的文件就是 `9501`(主)和 `9502`(apps)两个 Node 进程正在运行的那份
- 后端代码改完要触发 `POST /api/runtime/reload/request` 重新加载(参数语义见 `AGENTS.md` 的「重启服务」段),否则新代码不生效
- 根目录这三类是烘焙产物,**git 不会 track,`git clone` + `npm i` 后根目录还没有它们**;要改"出厂默认"请改 `language/<locale>/` 下的源:
  - `AGENTS.md`         ← `language/<locale>/AGENTS.md`
  - `CLAUDE.md`         ← `language/<locale>/CLAUDE.md`(本文件的源)
  - `apps/<name>/APP.md` ← `language/<locale>/apps/<name>/APP.md`
- iimos 运行态 AI 指令请通过设置应用「指令」页维护,不要通过改 `AGENTS.md` 影响运行态
- `database/`、`files/`、`.aios/`、`.git/` 是用户状态,除非明确要求否则不要动

## 鉴权

iimos 启用了密码鉴权:

- 首次启动浏览器访问会进入"设置密码"流程,设置完即登录
- 后续访问需要登录;cookie session 30 天滑动续期
- AI / curl 走 `Authorization: Bearer $IIMOS_API_TOKEN`(token 在 `auth.api_token` 表里,服务启动时自动注入到 agent runtime 的环境变量)
- **忘记密码** —— 单用户本地工具,没有找回流程,通过 SQL 强制重置:
  ```
  sqlite3 database/aios.db "DELETE FROM auth; DELETE FROM sessions;"
  ```
  下次启动回到首次设置流程。设置页"账户"tab 也展示了这条命令。
