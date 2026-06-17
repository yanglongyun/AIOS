const apps = [
  { id: 'todo', name: 'Todo', icon: '✅', load: () => import('./todo/index.vue') },
  { id: 'notepad', name: 'Notepad', icon: '📝', load: () => import('./notepad/index.vue') },
  { id: 'ledger', name: 'Ledger', icon: '💰', load: () => import('./ledger/index.vue') },
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export { apps, getApp };
