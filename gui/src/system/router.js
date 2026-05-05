import { createRouter, createWebHistory } from "vue-router";
import AppShell from "../views/AppShell.vue";
import LoginView from "../views/LoginView.vue";
import * as api from "../utils/api.js";

const routes = [
  { path: "/", redirect: "/app/chat" },
  { path: "/login", name: "login", component: LoginView, meta: { public: true } },
  { path: "/app/:id/:p1?/:p2?", component: AppShell },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// === 鉴权守卫 ===
// 每次进入需鉴权路由前查一次 /api/auth/state.SQL 单行查询很便宜,
// 不做缓存避免登录/登出后状态滞后.
router.beforeEach(async (to) => {
  if (to.meta?.public) return true;
  let s;
  try {
    s = await api.get("/api/auth/state");
  } catch {
    s = { configured: false, authenticated: false };
  }
  if (!s.authenticated) return { name: "login", replace: true };
  return true;
});

// 任何 401 → 立即跳登录
api.setOn401(() => {
  if (router.currentRoute.value.name !== "login") {
    router.replace({ name: "login" });
  }
});

export {
  router
};
