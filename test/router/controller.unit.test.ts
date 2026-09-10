import type { Component } from 'vue';
import type { Router, RouteRecordRaw } from 'vue-router';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createSplitHistoryController } from '../../src/router';

const Page: Component = { render: () => null };
const routes: RouteRecordRaw[] = [
  { path: '/a', component: Page },
  { path: '/b', component: Page },
  { path: '/c', component: Page },
  { path: '/d', component: Page },
  { path: '/blocked', component: Page },
  { path: '/redirect', redirect: '/d' },
];

async function setup(): Promise<{ controller: ReturnType<typeof createSplitHistoryController>; router: Router }> {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push('/a');
  await router.isReady();
  let id = 0;
  const controller = createSplitHistoryController(router, () => String.fromCharCode(65 + id++));
  return { controller, router };
}

describe('split history controller', () => {
  it('applies current and companion push semantics', async () => {
    const { controller } = await setup();
    await controller.navigate('A', 'push', '/b');
    await controller.navigate('B', 'push', '/c');

    expect(controller.trail.value).toEqual([
      { id: 'A', fullPath: '/a' },
      { id: 'B', fullPath: '/b' },
      { id: 'C', fullPath: '/c' },
    ]);

    await controller.navigate('B', 'push', '/d');
    expect(controller.trail.value).toEqual([
      { id: 'A', fullPath: '/a' },
      { id: 'B', fullPath: '/b' },
      { id: 'D', fullPath: '/d' },
    ]);
  });

  it('applies replace from the current and companion nodes', async () => {
    const { controller } = await setup();
    await controller.navigate('A', 'push', '/b');
    await controller.navigate('B', 'push', '/c');
    await controller.navigate('C', 'replace', '/d');
    expect(controller.trail.value.map(node => node.fullPath)).toEqual(['/a', '/b', '/d']);

    await controller.navigate('B', 'replace', '/c');
    expect(controller.trail.value.map(node => node.fullPath)).toEqual(['/a', '/c']);
  });

  it('stores the final route after a redirect', async () => {
    const { controller } = await setup();
    await controller.navigate('A', 'push', '/redirect');

    expect(controller.trail.value.map(node => node.fullPath)).toEqual(['/a', '/d']);
  });

  it('does not change the trail when navigation is aborted', async () => {
    const { controller, router } = await setup();
    router.beforeEach(to => to.path === '/blocked' ? false : undefined);

    await controller.navigate('A', 'push', '/blocked');
    expect(controller.trail.value).toEqual([{ id: 'A', fullPath: '/a' }]);
  });

  it('restores the exact destination trail on back and forward', async () => {
    const { controller, router } = await setup();
    await controller.navigate('A', 'push', '/b');
    await controller.navigate('B', 'push', '/c');

    const backFinished = new Promise<void>((resolve) => {
      const remove = router.afterEach(() => {
        remove();
        resolve();
      });
    });
    router.back();
    await backFinished;
    expect(controller.trail.value.map(node => node.fullPath)).toEqual(['/a', '/b']);

    const forwardFinished = new Promise<void>((resolve) => {
      const remove = router.afterEach(() => {
        remove();
        resolve();
      });
    });
    router.forward();
    await forwardFinished;
    expect(controller.trail.value.map(node => node.fullPath)).toEqual(['/a', '/b', '/c']);
  });
});
