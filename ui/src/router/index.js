import { createRouter, createWebHistory } from 'vue-router';
import ChatView from '../views/ChatView.vue';
import NotebookView from '../views/apps/NotebookView.vue';
import SettingsView from '../views/SettingsView.vue';
import FilesView from '../views/apps/FilesView.vue';

const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/chat/:id?', component: ChatView },
  { path: '/history', redirect: '/chat' },
  { path: '/notebook', component: NotebookView },
  { path: '/files', component: FilesView },
  { path: '/settings', component: SettingsView }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
