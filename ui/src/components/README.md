# Components

按产品区域分组:

- `apps/`:外部应用的 iframe 容器(应用机制)。
- `chat/`:对话消息流、工具调用展示、审批卡片。
- `files/`:文件预览与编辑(CodeMirror)。
- `settings/`:设置面板与技能管理。
- `sidebar/panels/`:对话列表、文件树,被内置应用放在左栏。
- `ui/`:与业务无关的小组件(对话框、菜单、图标、提示)。

壳与内置应用在 `src/shell/` 和 `src/apps/`。
