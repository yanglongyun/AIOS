import { createRouter, createWebHistory } from 'vue-router';
import { ensureAuth } from '../auth/session.js';
import { getSetupStatus } from '../auth/setup.js';
import { windowManager } from '../stores/windowManager.js';
import LoginView from '../views/LoginView.vue';
import WelcomeView from '../views/WelcomeView.vue';
import MobileView from '../views/MobileView.vue';

const DesktopPlaceholder = { render: () => null };

const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const routes = [
  { path: '/', component: DesktopPlaceholder },
  { path: '/mobile', component: MobileView },
  { path: '/welcome', component: WelcomeView },
  { path: '/login', component: LoginView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// 路由 → 窗口映射
const routeMap = [
  { pattern: /^\/chat(?:\/(.+))?$/, appId: 'chat', props: m => m[1] ? { id: m[1] } : {} },
  { pattern: /^\/task\/(.+)$/, appId: 'task-detail', props: m => ({ id: m[1] }) },
  { pattern: /^\/tasks\/create$/, appId: 'task-create' },
  { pattern: /^\/tasks$/, appId: 'tasks' },
  { pattern: /^\/files$/, appId: 'files' },
  { pattern: /^\/skills$/, appId: 'skills' },
  { pattern: /^\/notebook/, appId: 'notebook' },
  { pattern: /^\/finance/, appId: 'finance' },
  { pattern: /^\/subscriber/, appId: 'subscriber' },
  { pattern: /^\/cryptobot/, appId: 'cryptobot' },
  { pattern: /^\/reader/, appId: 'reader' },
  { pattern: /^\/poker/, appId: 'poker' },
  { pattern: /^\/fortune/, appId: 'fortune' },
  { pattern: /^\/banana/, appId: 'banana' },
  { pattern: /^\/settings$/, appId: 'settings' },
  { pattern: /^\/apps\/create$/, appId: 'create-app' },
];

router.beforeEach(async (to) => {
  const setup = await getSetupStatus();
  if (!setup.initialized) {
    if (to.path !== '/welcome') return '/welcome';
    return true;
  }
  if (to.path === '/welcome') return '/login';

  if (to.path === '/login') {
    const ok = await ensureAuth();
    if (ok) return isMobile() ? '/mobile' : '/';
    return true;
  }

  const ok = await ensureAuth();
  if (!ok) return '/login';

  // 移动端自动跳转
  if (to.path === '/' && isMobile()) return '/mobile';

  // 桌面根路径直接通过
  if (to.path === '/') return true;

  // 拦截应用路由 → 打开窗口
  for (const rule of routeMap) {
    const match = to.path.match(rule.pattern);
    if (match) {
      windowManager.open(rule.appId, rule.props?.(match) || {});
      return '/';
    }
  }

  return true;
});
