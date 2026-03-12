import { createRouter, createWebHistory } from 'vue-router';
import { ensureAuth } from '../auth/session.js';
import { getSetupStatus } from '../auth/setup.js';
import ChatView from '../views/ChatView.vue';
import HistoryView from '../views/HistoryView.vue';
import LoginView from '../views/LoginView.vue';
import WelcomeView from '../views/WelcomeView.vue';
import NotebookView from '../views/apps/notebook/index.vue';
import SettingsView from '../views/SettingsView.vue';
import FinanceView from '../views/apps/finance/index.vue';
import BananaView from '../views/apps/banana/index.vue';
import CreateAppView from '../views/apps/createapp/index.vue';
import SubscriberView from '../views/apps/subscriber/index.vue';
import CryptobotView from '../views/apps/cryptobot/index.vue';
import ReaderView from '../views/apps/reader/index.vue';
import FortuneView from '../views/apps/fortune/index.vue';
import PokerView from '../views/apps/poker/index.vue';
import TaskDetailView from '../views/TaskDetailView.vue';
import FilesView from '../views/FilesView.vue';
import SkillsView from '../views/SkillsView.vue';
import TasksView from '../views/TasksView.vue';

const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/welcome', component: WelcomeView },
  { path: '/login', component: LoginView },
  { path: '/chat/:id?', component: ChatView },
  { path: '/files', component: FilesView },
  { path: '/skills', component: SkillsView },
  { path: '/tasks', component: TasksView },
  { path: '/task/:id', component: TaskDetailView },
  { path: '/history', component: HistoryView },
  { path: '/apps/create', component: CreateAppView },
  { path: '/notebook', component: NotebookView },
  { path: '/finance', component: FinanceView },
  { path: '/banana', component: BananaView },
  { path: '/subscriber', component: SubscriberView },
  { path: '/cryptobot', component: CryptobotView },
  { path: '/reader', component: ReaderView },
  { path: '/fortune', component: FortuneView },
  { path: '/poker', component: PokerView },
  { path: '/settings', component: SettingsView }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const setup = await getSetupStatus();
  if (!setup.initialized) {
    if (to.path !== '/welcome') return '/welcome';
    return true;
  }
  if (to.path === '/welcome') return '/login';

  if (to.path === '/login') {
    const ok = await ensureAuth();
    if (ok) return '/chat';
    return true;
  }
  const ok = await ensureAuth();
  if (!ok) return '/login';
  return true;
});
