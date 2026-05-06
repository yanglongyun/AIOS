// app 注册.每个 app 给:id / 中文名 / Material 图标名 / 主题色 / 是否有内部侧栏 / 动态加载.
//
// hasDrawer:决定顶栏左上角 ☰ 按钮是否显示 + 内部侧栏是否启用.
// 没有侧栏的 app(纯单页内容)直接隐藏 ☰,顶栏左侧只剩 logo.
const apps = [
  {
    id: 'chat',
    name: '__T_APP_CHAT__',
    icon: 'forum',
    color: '#34a853',
    hasDrawer: true,
    load: () => import('./apps/chat/index.vue'),
    intent: () => import('./apps/chat/intent.js')
  },
  {
    id: 'tasks',
    name: '__T_APP_TASKS__',
    icon: 'task_alt',
    color: '#1a73e8',
    hasDrawer: true,
    load: () => import('./apps/tasks/index.vue')
  },
  {
    id: 'terminal',
    name: '终端',
    icon: 'terminal',
    color: '#202124',
    hasDrawer: true,
    load: () => import('./apps/terminal/index.vue')
  },
  {
    id: 'files',
    name: '文件',
    icon: 'folder',
    color: '#fbbc04',
    hasDrawer: true,
    load: () => import('./apps/files/index.vue')
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: 'code',
    color: '#d97757',
    hasDrawer: true,
    load: () => import('./apps/claude-code/index.vue')
  },
  {
    id: 'sysinfo',
    name: '系统状态',
    icon: 'monitoring',
    color: '#9334e6',
    hasDrawer: false,
    load: () => import('./apps/sysinfo/index.vue')
  },
  {
    id: 'cryptobot',
    name: '__T_APP_CRYPTOBOT__',
    icon: 'currency_bitcoin',
    color: '#f9ab00',
    hasDrawer: false,
    load: () => import('./apps/cryptobot/index.vue')
  },
  {
    id: 'workshop',
    name: '__T_APP_WORKSHOP__',
    icon: 'storefront',
    color: '#0f9d58',
    hasDrawer: false,
    load: () => import('./apps/workshop/index.vue')
  },
  {
    id: 'base',
    name: '__T_APP_BASE__',
    icon: 'apartment',
    color: '#0b8043',
    hasDrawer: false,
    load: () => import('./apps/base/index.vue')
  },
  {
    id: 'settings',
    name: '__T_APP_SETTINGS__',
    icon: 'settings',
    color: '#5f6368',
    hasDrawer: false,
    load: () => import('./apps/settings/index.vue')
  }
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export {
  apps,
  getApp
};
