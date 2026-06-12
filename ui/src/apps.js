import { MessageCircle, Clock, FileText, CheckSquare, CreditCard, Settings } from 'lucide-vue-next';

// 一切皆应用:对话、任务、设置与普通应用同列,只是注册表的一行.
const apps = [
  { id: 'chat',     name: '__T_APP_NAME_CHAT__',     icon: MessageCircle, load: () => import('./apps/chat/index.vue') },
  { id: 'tasks',    name: '__T_APP_NAME_TASKS__',    icon: Clock, load: () => import('./apps/tasks/index.vue') },
  { id: 'notepad',  name: '__T_APP_NAME_NOTEPAD__',  icon: FileText, load: () => import('./apps/notepad/index.vue') },
  { id: 'todo',     name: '__T_APP_NAME_TODO__',     icon: CheckSquare, load: () => import('./apps/todo/index.vue') },
  { id: 'ledger',   name: '__T_APP_NAME_LEDGER__',   icon: CreditCard, load: () => import('./apps/ledger/index.vue') },
  { id: 'settings', name: '__T_APP_NAME_SETTINGS__', icon: Settings, load: () => import('./apps/settings/index.vue') },
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export {
  apps,
  getApp
};
