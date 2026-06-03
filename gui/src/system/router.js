import { createRouter, createWebHistory } from "vue-router";
import AppShell from "../views/AppShell.vue";

const routes = [
  { path: "/", redirect: "/app/chat" },
  { path: "/app/:id/:p1?/:p2?", component: AppShell },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export {
  router
};
