const apps = [
  {
    id: 'chat',
    name: '__T_APP_SIDEBAR_CHAT__',
    icon: '\u{1F4AC}',
    desktopLoad: () => import('./apps/chat/index.vue'),
    intent: () => import('./apps/chat/intent.js'),
    defaultDesktopWindowSize: { w: 900, h: 640 }
  },
  {
    id: 'tasks',
    name: '__T_APP_SIDEBAR_TASKS__',
    icon: '⚡',
    desktopLoad: () => import('./apps/tasks/index.vue'),
    intent: () => import('./apps/tasks/intent.js'),
    defaultDesktopWindowSize: { w: 700, h: 500 }
  },
  {
    id: 'memory',
    name: '__T_APP_SIDEBAR_MEMORY__',
    icon: '💭',
    desktopLoad: () => import('./apps/memory/index.vue'),
    defaultDesktopWindowSize: { w: 600, h: 500 }
  },
  {
    id: 'files',
    name: '__T_APP_SIDEBAR_FILES__',
    icon: '\u{1F5C2}',
    desktopLoad: () => import('./apps/files/index.vue'),
    defaultDesktopWindowSize: { w: 500, h: 360 }
  },
  {
    id: 'notebook',
    name: '__T_APP_SIDEBAR_NOTEBOOK__',
    icon: '\u{1F4D3}',
    desktopLoad: () => import('./apps/notebook/index.vue'),
    defaultDesktopWindowSize: { w: 850, h: 600 }
  },
  {
    id: 'finance',
    name: '__T_APP_SIDEBAR_FINANCE__',
    icon: '💰',
    desktopLoad: () => import('./apps/finance/index.vue'),
    defaultDesktopWindowSize: { w: 980, h: 720 }
  },
  {
    id: 'cryptobot',
    name: '__T_APP_SIDEBAR_CRYPTOBOT__',
    icon: '\u{1F916}',
    desktopLoad: () => import('./apps/cryptobot/index.vue'),
    defaultDesktopWindowSize: { w: 980, h: 720 }
  },
  {
    id: 'ghtrending',
    name: '__T_APP_SIDEBAR_GHTRENDING__',
    icon: '\u{1F4A1}',
    desktopLoad: () => import('./apps/ghtrending/index.vue'),
    defaultDesktopWindowSize: { w: 960, h: 720 }
  },
  {
    id: 'createapp',
    name: '__T_APP_SIDEBAR_CREATE_APP__',
    icon: '\u{1FA84}',
    desktopLoad: () => import('./apps/createapp/index.vue'),
    intent: () => import('./apps/createapp/intent.js'),
    defaultDesktopWindowSize: { w: 720, h: 640 }
  },
  {
    id: 'claude-code',
    name: '__T_APP_SIDEBAR_CLAUDE_CODE__',
    icon: '\u{1F9E0}',
    desktopLoad: () => import('./apps/claude-code/index.vue'),
    defaultDesktopWindowSize: { w: 1100, h: 720 }
  },
  {
    id: 'codex',
    name: '__T_APP_SIDEBAR_CODEX__',
    icon: '\u{1F4BB}',
    desktopLoad: () => import('./apps/codex/index.vue'),
    defaultDesktopWindowSize: { w: 1100, h: 720 }
  },
  {
    id: 'settings',
    name: '__T_APP_SIDEBAR_SETTINGS__',
    icon: '⚙️',
    desktopLoad: () => import('./apps/settings/index.vue'),
    intent: () => import('./apps/settings/intent.js'),
    defaultDesktopWindowSize: { w: 750, h: 520 }
  }
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export {
  apps,
  getApp
};
