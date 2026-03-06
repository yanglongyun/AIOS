import { createRouter, createWebHistory } from 'vue-router';
import { ensureAuth } from '../auth/session.js';
import { getSetupStatus } from '../auth/setup.js';
import ChatView from '../views/ChatView.vue';
import HistoryView from '../views/HistoryView.vue';
import LoginView from '../views/LoginView.vue';
import WelcomeView from '../views/WelcomeView.vue';
import NotebookView from '../views/apps/NotebookView.vue';
import SettingsView from '../views/SettingsView.vue';
import FinanceView from '../views/apps/FinanceView.vue';
import InboxView from '../views/apps/InboxView.vue';
import WeiboView from '../views/apps/WeiboView.vue';
import PlaygroundView from '../views/apps/PlaygroundView.vue';
import CommunityView from '../views/CommunityView.vue';
import NokiaView from '../views/apps/NokiaView.vue';
import DebateSimulatorView from '../views/apps/DebateSimulatorView.vue';
import TreasureView from '../views/apps/TreasureView.vue';
import CreateAppView from '../views/apps/CreateAppView.vue';
import BriefingView from '../views/apps/BriefingView.vue';
import DailycheckView from '../views/apps/DailycheckView.vue';
import CryptobotView from '../views/apps/CryptobotView.vue';
import StoryView from '../views/apps/StoryView.vue';
import BlackroomView from '../views/apps/BlackroomView.vue';
import FortuneView from '../views/apps/FortuneView.vue';
import BeachView from '../views/apps/BeachView.vue';
import PokerView from '../views/apps/PokerView.vue';
import TaskCreateView from '../views/TaskCreateView.vue';
import TaskDetailView from '../views/TaskDetailView.vue';
import TasksView from '../views/TasksView.vue';

const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/welcome', component: WelcomeView },
  { path: '/login', component: LoginView },
  { path: '/chat/:id?', component: ChatView },
  { path: '/tasks', component: TasksView },
  { path: '/tasks/create', component: TaskCreateView },
  { path: '/task/:id', component: TaskDetailView },
  { path: '/schedules', redirect: '/tasks' },
  { path: '/history', component: HistoryView },
  { path: '/apps/create', component: CreateAppView },
  { path: '/notebook', component: NotebookView },
  { path: '/finance', component: FinanceView },
  { path: '/inbox', component: InboxView },
  { path: '/weibo', component: WeiboView },
  { path: '/playground', component: PlaygroundView },
  { path: '/debate-simulator', component: DebateSimulatorView },
  { path: '/treasure', component: TreasureView },
  { path: '/nokia', component: NokiaView },
  { path: '/briefing', component: BriefingView },
  { path: '/dailycheck', component: DailycheckView },
  { path: '/cryptobot', component: CryptobotView },
  { path: '/story', component: StoryView },
  { path: '/blackroom', component: BlackroomView },
  { path: '/fortune', component: FortuneView },
  { path: '/beach', component: BeachView },
  { path: '/poker', component: PokerView },
  { path: '/community', component: CommunityView },
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
