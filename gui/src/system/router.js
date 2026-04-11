import { createRouter, createWebHistory } from "vue-router";
import { ensureAuth } from "../auth/session.js";
import { getSetupStatus } from "../auth/setup.js";
import LoginView from "../views/LoginView.vue";
import WelcomeView from "../views/WelcomeView.vue";
import MobileView from "../views/MobileView.vue";
import DesktopView from "../views/DesktopView.vue";

const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const routes = [
  { path: "/", component: DesktopView },
  { path: "/mobile", component: MobileView },
  { path: "/welcome", component: WelcomeView },
  { path: "/login", component: LoginView },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async (to) => {
  const setup = await getSetupStatus();
  if (setup.reachable && setup.initialized === false) {
    if (to.path !== "/welcome") return "/welcome";
    return true;
  }
  if (to.path === "/welcome") {
    if (!setup.reachable) return true;
    return "/login";
  }
  if (to.path === "/login") {
    const auth = await ensureAuth();
    if (!auth.reachable) return true;
    if (auth.authenticated) return isMobile() ? "/mobile" : "/";
    return true;
  }
  const auth = await ensureAuth();
  if (auth.reachable && !auth.authenticated) return "/login";
  if (to.path === "/" && isMobile()) return "/mobile";
  return true;
});

export {
  router
};
