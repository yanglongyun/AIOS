import { MessageCircle, Clock, FileText, CheckSquare, CreditCard, Settings } from 'lucide-vue-next';

// 一切皆应用:对话、任务、设置与普通应用同列,只是注册表的一行.
const apps = [
  { id: 'chat',     name: '对话',        icon: MessageCircle, load: () => import('./apps/chat/index.vue') },
  { id: 'tasks',    name: '任务',     icon: Clock, load: () => import('./apps/tasks/index.vue') },
  { id: 'notepad',  name: '记事本', icon: FileText, load: () => import('./apps/notepad/index.vue') },
  { id: 'todo',     name: '待办',     icon: CheckSquare, load: () => import('./apps/todo/index.vue') },
  { id: 'ledger',   name: '记账本',  icon: CreditCard, load: () => import('./apps/ledger/index.vue') },
  { id: 'settings', name: '设置',  icon: Settings, load: () => import('./apps/settings/index.vue') },
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export {
  apps,
  getApp
};
