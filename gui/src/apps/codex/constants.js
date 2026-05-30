const modes = [
  { id: "readonly", name: "观察", icon: "visibility", sandbox: "read-only", approvalPolicy: "never", desc: "只读" },
  { id: "workspace", name: "工作区", icon: "edit", sandbox: "workspace-write", approvalPolicy: "never", desc: "可写工作区" },
  { id: "full", name: "托管", icon: "bolt", sandbox: "danger-full-access", approvalPolicy: "never", desc: "完全访问" },
];

const envPanels = [
  { id: "account", name: "账号", icon: "person" },
  { id: "models", name: "模型", icon: "neurology" },
  { id: "config", name: "配置", icon: "tune" },
  { id: "permissions", name: "权限", icon: "shield" },
  { id: "skills", name: "技能", icon: "auto_awesome" },
  { id: "mcp", name: "MCP", icon: "hub" },
  { id: "plugins", name: "插件", icon: "extension" },
  { id: "hooks", name: "Hooks", icon: "bolt" },
  { id: "apps", name: "应用", icon: "apps" },
];

export { modes, envPanels };
