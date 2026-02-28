import { createRouter, createWebHistory } from 'vue-router';
import ChatView from '../views/ChatView.vue';
import NotebookView from '../views/apps/NotebookView.vue';
import SettingsView from '../views/SettingsView.vue';
import FinanceView from '../views/apps/FinanceView.vue';
import InboxView from '../views/apps/InboxView.vue';
import PlaygroundView from '../views/apps/PlaygroundView.vue';

const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/chat/:id?', component: ChatView },
  { path: '/history', redirect: '/chat' },
  { path: '/notebook', component: NotebookView },
  { path: '/finance', component: FinanceView },
  { path: '/inbox', component: InboxView },
  { path: '/playground', component: PlaygroundView },
  { path: '/settings', component: SettingsView }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
