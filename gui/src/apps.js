const apps = [
  {
    id: 'chat',
    name: '__T_APP_CHAT__',
    icon: 'forum',
    group: 'top',
    load: () => import('./apps/chat/index.vue'),
    intent: () => import('./apps/chat/intent.js')
  },
  {
    id: 'tasks',
    name: '__T_APP_TASKS__',
    icon: 'progress_activity',
    group: 'top',
    load: () => import('./apps/tasks/index.vue')
  },
  {
    id: 'todo',
    name: '__T_APP_TODO__',
    icon: 'checklist',
    group: 'apps',
    load: () => import('./apps/todo/index.vue')
  },
  {
    id: 'notebook',
    name: '__T_APP_NOTEBOOK__',
    icon: 'edit_note',
    group: 'apps',
    load: () => import('./apps/notebook/index.vue')
  },
  {
    id: 'finance',
    name: '__T_APP_FINANCE__',
    icon: 'payments',
    group: 'apps',
    load: () => import('./apps/finance/index.vue')
  },
  {
    id: 'cryptobot',
    name: '__T_APP_CRYPTOBOT__',
    icon: 'currency_bitcoin',
    group: 'apps',
    load: () => import('./apps/cryptobot/index.vue')
  },
  {
    id: 'store',
    name: '__T_APP_STORE__',
    icon: 'storefront',
    group: 'apps',
    load: () => import('./apps/store/index.vue')
  },
  {
    id: 'demo',
    name: '__T_APP_DEMO__',
    icon: 'deployed_code',
    group: 'apps',
    load: () => import('./apps/demo/index.vue')
  },
  {
    id: 'settings',
    name: '__T_APP_SETTINGS__',
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
