import { createRouter, createWebHistory } from 'vue-router';
import { apps } from './apps.js';

const routes = [
  { path: '/', redirect: '/app/chat' },
  ...apps.map((app) => ({
    path: `/app/${app.id}`,
    component: () => app.load()
  })),
  { path: '/:pathMatch(.*)*', redirect: '/app/chat' }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
