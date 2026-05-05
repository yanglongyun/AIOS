import {
  MessageSquare,
  Terminal,
  Folder,
  Code,
  Loader,
  Activity,
  Store,
  Settings,
  Bitcoin,
  Hammer
} from 'lucide-vue-next';

const apps = [
  {
    id: 'chat',
    name: '__T_APP_CHAT__',
    icon: MessageSquare,
    group: 'top',
    load: () => import('./apps/chat/index.vue'),
    intent: () => import('./apps/chat/intent.js')
  },
  {
    id: 'terminal',
    name: '终端',
    icon: Terminal,
    group: 'apps',
    load: () => import('./apps/terminal/index.vue')
  },
  {
    id: 'files',
    name: '文件',
    icon: Folder,
    group: 'apps',
    load: () => import('./apps/files/index.vue')
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: Code,
    group: 'apps',
    load: () => import('./apps/claude-code/index.vue')
  },
  {
    id: 'tasks',
    name: '__T_APP_TASKS__',
    icon: Loader,
    group: 'top',
    load: () => import('./apps/tasks/index.vue')
  },
  {
    id: 'sysinfo',
    name: '系统状态',
    icon: Activity,
    group: 'apps',
    load: () => import('./apps/sysinfo/index.vue')
  },
  {
    id: 'cryptobot',
    name: '__T_APP_CRYPTOBOT__',
    icon: Bitcoin,
    group: 'apps',
    load: () => import('./apps/cryptobot/index.vue')
  },
  {
    id: 'workshop',
    name: '__T_APP_WORKSHOP__',
    icon: Hammer,
    group: 'apps',
    load: () => import('./apps/workshop/index.vue')
  },
  {
    id: 'base',
    name: '__T_APP_BASE__',
    icon: Store,
    group: 'apps',
    load: () => import('./apps/base/index.vue')
  },
  {
    id: 'settings',
    name: '__T_APP_SETTINGS__',
    icon: Settings,
    group: 'bottom',
    load: () => import('./apps/settings/index.vue')
  }
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export {
  apps,
  getApp
};
