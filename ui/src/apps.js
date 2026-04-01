const appRegistry = [
  // 核心
  {
    id: "chat",
    name: "__T_APP_SIDEBAR_CHAT__",
    icon: "\u{1F4AC}",
    iconClass: "icon-chat",
    load: () => import("./apps/chat/index.vue"),
    mobileLoad: () => import("./apps/chat/MobileChatView.vue"),
    sideChat: false,
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
  {
    id: "finance",
    name: "__T_APP_SIDEBAR_FINANCE__",
    icon: "\u{1F4B0}",
    iconClass: "icon-finance",
    load: () => import("./apps/finance/index.vue"),
    defaultSize: { w: 800, h: 560 }
  },
  {
    id: "subscriber",
    name: "__T_APP_SIDEBAR_SUBSCRIBER__",
    icon: "\u{1F4FB}",
    iconClass: "icon-subscriber",
    load: () => import("./apps/subscriber/index.vue"),
    defaultSize: { w: 800, h: 560 }
  },
  {
    id: "cryptobot",
    name: "__T_APP_SIDEBAR_CRYPTOBOT__",
    icon: "\u{1F4C8}",
    iconClass: "icon-cryptobot",
    load: () => import("./apps/cryptobot/index.vue"),
    defaultSize: { w: 900, h: 600 }
  },
  {
    id: "reader",
    name: "__T_APP_SIDEBAR_READER__",
    icon: "\u{1F4D6}",
    iconClass: "icon-reader",
    load: () => import("./apps/reader/index.vue"),
    defaultSize: { w: 800, h: 600 }
  },
  {
    id: "poker",
    name: "__T_APP_SIDEBAR_POKER__",
    icon: "\u{1F0CF}",
    iconClass: "icon-poker",
    load: () => import("./apps/poker/index.vue"),
    defaultSize: { w: 900, h: 700 }
  },
  {
    id: "fortune",
    name: "__T_APP_SIDEBAR_FORTUNE__",
    icon: "\u{1F52E}",
    iconClass: "icon-fortune",
    load: () => import("./apps/fortune/index.vue"),
    defaultSize: { w: 700, h: 560 }
  },
  {
    id: "banana",
    name: "__T_APP_SIDEBAR_BANANA__",
    icon: "\u{1F4F1}",
    iconClass: "icon-banana",
    load: () => import("./apps/banana/index.vue"),
    defaultSize: { w: 420, h: 700 }
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
  {
    id: "create-app",
    name: "__T_APP_SIDEBAR_CREATE_APP__",
    icon: "➕",
    iconClass: "icon-create",
    load: () => import("./apps/createapp/index.vue"),
    defaultSize: { w: 700, h: 500 }
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
