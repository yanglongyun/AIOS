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
import PokerView from '../views/apps/PokerView.vue';
import DoodleView from '../views/apps/DoodleView.vue';
import RedmillView from '../views/apps/RedmillView.vue';
import TaskDetailView from '../views/TaskDetailView.vue';
import TasksView from '../views/TasksView.vue';

const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/welcome', component: WelcomeView },
  { path: '/login', component: LoginView },
  { path: '/chat/:id?', component: ChatView },
  { path: '/tasks', component: TasksView },
  { path: '/task/:id', component: TaskDetailView },
  { path: '/history', component: HistoryView },
  { path: '/apps/create', component: CreateAppView },
  { path: '/notebook', component: NotebookView },
  { path: '/finance', component: FinanceView },
  { path: '/inbox', component: InboxView },
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
  { path: '/poker', component: PokerView },
  { path: '/doodle', component: DoodleView },
  { path: '/redmill', component: RedmillView },
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
