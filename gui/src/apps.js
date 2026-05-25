// app 注册.每个 app 给:id / 中文名 / Material 图标名 / 主题色 / 是否有内部侧栏 / 动态加载.
//
// hasDrawer:决定顶栏左上角 ☰ 按钮是否显示 + 内部侧栏是否启用.
// 没有侧栏的 app(纯单页内容)直接隐藏 ☰,顶栏左侧只剩 logo.
const apps = [
  {
    id: 'chat',
    name: '对话',
    icon: 'forum',
    color: '#34a853',
    hasDrawer: true,
    load: () => import('./apps/chat/index.vue')
  },
  {
    id: 'triggers',
    name: '触发器',
    icon: 'bolt',
    color: '#7c4dff',
    hasDrawer: false,
    load: () => import('./apps/triggers/index.vue')
  },
  {
    id: 'tasks',
    name: '任务',
    icon: 'task_alt',
    color: '#1a73e8',
    hasDrawer: true,
    load: () => import('./apps/tasks/index.vue')
  },
  {
    id: 'memory',
    name: '记忆',
    icon: 'psychology',
    color: '#8e6e3c',
    hasDrawer: false,
    load: () => import('./apps/memory/index.vue')
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
    id: 'sysinfo',
    name: '系统状态',
    icon: 'monitoring',
    color: '#9334e6',
    hasDrawer: false,
    load: () => import('./apps/sysinfo/index.vue')
  },
  {
    id: 'cryptobot',
    name: '炒币机',
    icon: 'currency_bitcoin',
    color: '#f9ab00',
    hasDrawer: false,
    load: () => import('./apps/cryptobot/index.vue')
  },
  {
    id: 'longvideo',
    name: '视频工坊',
    icon: 'movie',
    color: '#276ef1',
    hasDrawer: false,
    load: () => import('./apps/longvideo/index.vue')
  },
  {
    id: 'settings',
    name: '设置',
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
