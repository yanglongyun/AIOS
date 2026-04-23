import { createRouter, createWebHistory } from "vue-router";
import { getSetupStatus } from "./setup.js";
import DesktopView from "../views/DesktopView.vue";

const routes = [
  { path: "/", component: DesktopView },
  { path: "/welcome", component: () => import("../views/WelcomeView.vue") },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async (to) => {
  const setup = await getSetupStatus();
  if (!setup.reachable) return true;
  const welcomed = setup.initialized || setup.welcomeSkipped;
  if (!welcomed && to.path !== "/welcome") return "/welcome";
  if (welcomed && to.path === "/welcome") return "/";
  return true;
});

export {
  router
};
