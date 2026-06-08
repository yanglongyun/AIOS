const apps = [
  { id: 'notepad', name: '记事本', icon: '📝', load: () => import('./apps/notepad/index.vue') },
  { id: 'todo',    name: '待办',    icon: '✅', load: () => import('./apps/todo/index.vue') },
  { id: 'ledger',  name: '记账本',  icon: '💰', load: () => import('./apps/ledger/index.vue') },
  { id: 'settings', name: '设置', icon: '⚙️', load: () => import('./apps/settings/index.vue') },
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export {
  apps,
  getApp
};
