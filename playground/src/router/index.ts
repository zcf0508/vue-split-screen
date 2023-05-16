import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";

export const routes = [
  {
    path: "/",
    component: () => import("@/layout/index.vue"),
    redirect: "/home",
    children: [
      {
        path: "/home",
        component: () => import("@/views/Home.vue"),
      },
      {
        path: "/some/:id",
        component: () => import("@/views/Some.vue"),
      },
      {
        path: "/me",
        component: () => import("@/views/Me.vue"),
      },
    ],
  },
] as RouteRecordRaw[];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
