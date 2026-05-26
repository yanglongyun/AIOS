const modes = [
  { id: "readonly", name: "观察", sandbox: "read-only", approvalPolicy: "never" },
  { id: "workspace", name: "工作区", sandbox: "workspace-write", approvalPolicy: "never" },
  { id: "full", name: "托管", sandbox: "danger-full-access", approvalPolicy: "never" },
];

const tabs = [
  { id: "new", name: "新会话", icon: "add_comment" },
  { id: "history", name: "会话历史", icon: "history" },
  { id: "account", name: "账号", icon: "person" },
  { id: "models", name: "模型", icon: "neurology" },
  { id: "config", name: "配置", icon: "tune" },
  { id: "skills", name: "技能", icon: "auto_awesome" },
  { id: "mcp", name: "MCP", icon: "hub" },
  { id: "plugins", name: "插件", icon: "extension" },
  { id: "hooks", name: "Hooks", icon: "bolt" },
];

export { modes, tabs };
