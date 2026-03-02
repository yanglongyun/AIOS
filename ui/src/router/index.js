import { createRouter, createWebHistory } from 'vue-router';
import ChatView from '../views/ChatView.vue';
import HistoryView from '../views/HistoryView.vue';
import NotebookView from '../views/apps/NotebookView.vue';
import SettingsView from '../views/SettingsView.vue';
import FinanceView from '../views/apps/FinanceView.vue';
import InboxView from '../views/apps/InboxView.vue';
import PlaygroundView from '../views/apps/PlaygroundView.vue';
import CommunityView from '../views/CommunityView.vue';
import WriterpadView from '../views/apps/WriterpadView.vue';
import LovehouseView from '../views/apps/LovehouseView.vue';
import NokiaView from '../views/apps/NokiaView.vue';
import DebateSimulatorView from '../views/apps/DebateSimulatorView.vue';
import TreasureView from '../views/apps/TreasureView.vue';
import CreateAppView from '../views/apps/CreateAppView.vue';
import BriefingView from '../views/apps/BriefingView.vue';
import DailycheckView from '../views/apps/DailycheckView.vue';
import CryptobotView from '../views/apps/CryptobotView.vue';
import StoryView from '../views/apps/StoryView.vue';
import BlackroomView from '../views/apps/BlackroomView.vue';

const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/chat/:id?', component: ChatView },
  { path: '/history', component: HistoryView },
  { path: '/apps/create', component: CreateAppView },
  { path: '/notebook', component: NotebookView },
  { path: '/finance', component: FinanceView },
  { path: '/inbox', component: InboxView },
  { path: '/playground', component: PlaygroundView },
  { path: '/writerpad', component: WriterpadView },
  { path: '/debate-simulator', component: DebateSimulatorView },
  { path: '/treasure', component: TreasureView },
  { path: '/lovehouse', component: LovehouseView },
  { path: '/nokia', component: NokiaView },
  { path: '/briefing', component: BriefingView },
  { path: '/dailycheck', component: DailycheckView },
  { path: '/cryptobot', component: CryptobotView },
  { path: '/story', component: StoryView },
  { path: '/blackroom', component: BlackroomView },
  { path: '/community', component: CommunityView },
  { path: '/settings', component: SettingsView }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
