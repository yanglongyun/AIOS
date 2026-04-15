import { createRouter, createWebHistory } from "vue-router";
import { getSetupStatus } from "./setup.js";
import WelcomeView from "../views/WelcomeView.vue";
import DesktopView from "../views/DesktopView.vue";

const routes = [
  { path: "/", component: DesktopView },
  { path: "/welcome", component: WelcomeView },
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
    return "/";
  }
  return true;
});

export {
  router
};
