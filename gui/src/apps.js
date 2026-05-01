const apps = [
  {
    id: 'chat',
    name: '对话',
    icon: 'forum',
    group: 'top',
    load: () => import('./apps/chat/index.vue'),
    intent: () => import('./apps/chat/intent.js')
  },
  {
    id: 'tasks',
    name: '任务',
    icon: 'progress_activity',
    group: 'top',
    load: () => import('./apps/tasks/index.vue')
  },
  {
    id: 'todo',
    name: '待办',
    icon: 'checklist',
    group: 'apps',
    load: () => import('./apps/todo/index.vue')
  },
  {
    id: 'notebook',
    name: '记事本',
    icon: 'edit_note',
    group: 'apps',
    load: () => import('./apps/notebook/index.vue')
  },
  {
    id: 'finance',
    name: '记账本',
    icon: 'payments',
    group: 'apps',
    load: () => import('./apps/finance/index.vue')
  },
  {
    id: 'cryptobot',
    name: '炒币机',
    icon: 'currency_bitcoin',
    group: 'apps',
    load: () => import('./apps/cryptobot/index.vue')
  },
  {
    id: 'store',
    name: '应用工坊',
    icon: 'storefront',
    group: 'apps',
    load: () => import('./apps/store/index.vue')
  },
  {
    id: 'settings',
    name: '设置',
    icon: 'settings',
    group: 'bottom',
    load: () => import('./apps/settings/index.vue')
  }
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export {
  apps,
  getApp
};
