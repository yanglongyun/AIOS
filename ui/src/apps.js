const appRegistry = [
  // 核心
  {
    id: "chat",
    name: "__T_APP_SIDEBAR_CHAT__",
    icon: "\u{1F4AC}",
    iconClass: "icon-chat",
    load: () => import("./apps/chat/index.vue"),
    protocol: () => import("./apps/chat/protocol.js"),
    mobileLoad: () => import("./apps/chat/chatMobile.vue"),
    defaultSize: { w: 900, h: 640 }
  },
  {
    id: "tasks",
    name: "__T_APP_SIDEBAR_TASKS__",
    icon: "✅",
    iconClass: "icon-tasks",
    load: () => import("./apps/tasks/index.vue"),
    defaultSize: { w: 700, h: 500 }
  },
  {
    id: "files",
    name: "__T_APP_SIDEBAR_FILES__",
    icon: "\u{1F4C1}",
    iconClass: "icon-files",
    load: () => import("./apps/files/index.vue"),
    defaultSize: { w: 750, h: 520 }
  },
  // 应用
  {
    id: "notebook",
    name: "__T_APP_SIDEBAR_NOTEBOOK__",
    icon: "\u{1F4D3}",
    iconClass: "icon-notebook",
    load: () => import("./apps/notebook/index.vue"),
    defaultSize: { w: 850, h: 600 }
  },
  // 工具
  {
    id: "settings",
    name: "__T_APP_SIDEBAR_SETTINGS__",
    icon: "⚙️",
    iconClass: "icon-settings",
    load: () => import("./apps/settings/index.vue"),
    defaultSize: { w: 750, h: 520 }
  },
  // 隐藏（不在桌面显示，程序内导航打开）
  {
    id: "task-detail",
    name: "__T_APP_SIDEBAR_TASKS__",
    icon: "✅",
    iconClass: "icon-tasks",
    load: () => import("./apps/tasks/detail.vue"),
    hidden: true,
    defaultSize: { w: 800, h: 560 }
  },
  {
    id: "task-create",
    name: "__T_APP_SIDEBAR_TASKS__",
    icon: "✅",
    iconClass: "icon-tasks",
    load: () => import("./apps/tasks/create.vue"),
    hidden: true,
    defaultSize: { w: 700, h: 500 }
  }
];
export {
  appRegistry
};
