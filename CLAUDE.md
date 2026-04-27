# CLAUDE.md

`AIOS/AGENTS.md` 是 **AIOS 运行态 agent 的系统提示词**，由 `server/main/prompt/index.js` 注入到模型上下文。它**不是**给开发协作者看的协作指南，请不要把它当成本仓库的工程约定来读。

如果你是开发协作者（包括 Claude Code、Codex 等),请阅读上一级目录的协作指南：

- `../AGENTS.md` —— Wandesk Workspace 协作指南（涵盖跨项目发布流程、打包、源码 / 运行副本边界等）

如果当前目录是 Wandesk 安装后的 `workspace` 根，那这里的内容就是用户机器上正在运行的 AIOS 工作副本——按用户任务直接修改即可，但不要破坏 `database/`、`files/`、`.aios/`、`.git/` 等用户状态，除非用户明确要求。
