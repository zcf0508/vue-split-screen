import { createRouter, createWebHashHistory } from 'vue-router';
import DemoPage from '@/views/DemoPage.vue';

const pageRoutes = [
  { path: '/a', title: 'Page A', accent: 'oklch(72% 0.14 75deg)' },
  { path: '/b', title: 'Page B', accent: 'oklch(66% 0.14 38deg)' },
  { path: '/c', title: 'Page C', accent: 'oklch(68% 0.09 115deg)' },
  { path: '/d', title: 'Page D', accent: 'oklch(65% 0.07 235deg)' },
].map(page => ({
  path: page.path,
  component: DemoPage,
  props: page,
}));

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/a' },
    ...pageRoutes,
    { path: '/redirect', redirect: '/d?redirected=1' },
    { path: '/blocked', component: DemoPage, props: { path: '/blocked', title: 'Blocked', accent: 'oklch(60% 0.16 28deg)' } },
  ],
});

router.beforeEach((to) => {
  if (to.path === '/blocked') {
    return false;
  }
});

export default router;
