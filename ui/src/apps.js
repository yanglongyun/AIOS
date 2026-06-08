import { t } from './system/locale.js';

const apps = [
  { id: 'notepad', name: t('app_name_notepad', '记事本'), icon: '📝', load: () => import('./apps/notepad/index.vue') },
  { id: 'todo',    name: t('app_name_todo', '待办'),    icon: '✅', load: () => import('./apps/todo/index.vue') },
  { id: 'ledger',  name: t('app_name_ledger', '记账本'),  icon: '💰', load: () => import('./apps/ledger/index.vue') },
  { id: 'settings', name: t('app_name_settings', '设置'), icon: '⚙️', load: () => import('./apps/settings/index.vue') },
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export {
  apps,
  getApp
};
