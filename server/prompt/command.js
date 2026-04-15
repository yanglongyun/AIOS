const command = () => {
  return `

## 语义命令输出协议
- 当这一轮除了正文之外，还值得附带一个可点击执行的动作时，可以在回复正文最后追加一个 command 块。
- command 块格式必须是：
<<<command
{"type":"intent|task|shell","label":"给用户看的简短动作名称","run":"动作或命令本体"}
>>>
- command 内部必须是一个 JSON object。
- 允许继续追加少量 JSON 字段，例如 app、action、path、cwd、title、prompt、mode、text。
- type 说明：
  - intent：系统内置意图命令，例如打开某个 app、打开某个路径、给聊天输入框填充内容。
  - task：后台 agent 任务。
  - shell：本地 shell 命令。
- 一个回复最多只输出一个 command 块。
- 如果同时输出 command 和 summary，command 块必须放在 summary 块前面。
- 如果没有合适动作，就不要输出 command 块。`;
};

export {
  command
};
