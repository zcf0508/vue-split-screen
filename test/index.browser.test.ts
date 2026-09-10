import type { App, Component } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
} from 'vue';
import { createMemoryHistory, createRouter, RouterView, useRoute, useRouter } from 'vue-router';
import { SplitScreen, useSplitRouter } from '../src';

const mountedApps: Array<{ app: App; root: HTMLElement }> = [];

interface LifecycleCounts {
  activated: number;
  deactivated: number;
  mounted: number;
  unmounted: number;
}

function page(name: string, lifecycle?: Record<string, LifecycleCounts>): Component {
  return defineComponent({
    name: `${name}Page`,
    setup() {
      const route = useRoute();
      const router = useRouter();
      const splitRouter = useSplitRouter();
      const counts = lifecycle?.[name];
      if (counts) {
        onActivated(() => counts.activated++);
        onDeactivated(() => counts.deactivated++);
        onMounted(() => counts.mounted++);
        onUnmounted(() => counts.unmounted++);
      }
      return () => h('section', { 'data-page': name, 'data-page-route': route.fullPath }, [
        h('button', {
          'data-action': 'push-d',
          'onClick': () => splitRouter.push('/d'),
        }, 'push D'),
        h('button', {
          'data-action': 'replace-d',
          'onClick': () => router.replace('/d'),
        }, 'replace D'),
        h('button', {
          'data-action': 'push-b',
          'onClick': () => splitRouter.push('/b'),
        }, 'push B'),
        h('button', {
          'data-action': 'push-c',
          'onClick': () => splitRouter.push('/c'),
        }, 'push C'),
        h('button', {
          'data-action': 'redirect',
          'onClick': () => splitRouter.push('/redirect'),
        }, 'redirect'),
        h('button', {
          'data-action': 'blocked',
          'onClick': () => splitRouter.push('/blocked'),
        }, 'blocked'),
      ]);
    },
  });
}

async function mountAt(
  path: string,
  maxInactivePages = 0,
  lifecycle?: Record<string, LifecycleCounts>,
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      ...['a', 'b', 'c', 'd'].map(name => ({
        path: `/${name}`,
        component: page(name.toUpperCase(), lifecycle),
      })),
      { path: '/redirect', redirect: '/d?redirected=1' },
      { path: '/blocked', component: page('BLOCKED', lifecycle) },
    ],
  });
  router.beforeEach(to => to.path === '/blocked' ? false : undefined);
  await router.push(path);
  await router.isReady();

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(defineComponent({
    setup: () => () => h(RouterView, null, {
      default: ({ Component: routeComponent }: { Component: Component }) => h(
        SplitScreen,
        { maxInactivePages, turnOn: true },
        { default: () => h(routeComponent) },
      ),
    }),
  }));
  app.use(router);
  app.mount(root);
  mountedApps.push({ app, root });
  await nextTick();

  return { root, router };
}

function paneRoutes(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>('[data-split-route]')]
    .map(element => element.dataset.splitRoute!);
}

function click(root: HTMLElement, route: string, action: string) {
  const button = root.querySelector<HTMLButtonElement>(
    `[data-split-route="${route}"] [data-action="${action}"]`,
  );
  expect(button).not.toBeNull();
  button!.click();
}

async function expectPanes(root: HTMLElement, expected: string[]) {
  await expect.poll(() => paneRoutes(root)).toEqual(expected);
}

function lifecycleCounts(): LifecycleCounts {
  return { activated: 0, deactivated: 0, mounted: 0, unmounted: 0 };
}

afterEach(() => {
  for (const { app, root } of mountedApps.splice(0)) {
    app.unmount();
    root.remove();
  }
});

describe('split-screen browser navigation', () => {
  it('branches a push from the companion pane', async () => {
    const { root, router } = await mountAt('/a');
    click(root, '/a', 'push-b');
    await expectPanes(root, ['/a', '/b']);
    click(root, '/b', 'push-c');
    await expectPanes(root, ['/b', '/c']);

    click(root, '/b', 'push-d');

    await expectPanes(root, ['/b', '/d']);
    expect(router.currentRoute.value.fullPath).toBe('/d');
    expect(root.querySelector('[data-split-route="/b"] [data-page-route="/b"]')).not.toBeNull();
  });

  it('replaces the companion pane and drops its descendants', async () => {
    const { root } = await mountAt('/a');
    click(root, '/a', 'push-b');
    await expectPanes(root, ['/a', '/b']);
    click(root, '/b', 'push-c');
    await expectPanes(root, ['/b', '/c']);

    click(root, '/b', 'replace-d');

    await expectPanes(root, ['/a', '/d']);
  });

  it('restores exact trails through browser back and forward', async () => {
    const { root, router } = await mountAt('/a');
    click(root, '/a', 'push-b');
    await expectPanes(root, ['/a', '/b']);
    click(root, '/b', 'push-c');
    await expectPanes(root, ['/b', '/c']);

    router.back();
    await expectPanes(root, ['/a', '/b']);
    router.forward();
    await expectPanes(root, ['/b', '/c']);
  });

  it('commits redirect destinations and ignores aborted navigation', async () => {
    const { root, router } = await mountAt('/a');
    click(root, '/a', 'push-b');
    await expectPanes(root, ['/a', '/b']);

    click(root, '/b', 'redirect');

    await expectPanes(root, ['/b', '/d?redirected=1']);
    expect(router.currentRoute.value.fullPath).toBe('/d?redirected=1');

    click(root, '/d?redirected=1', 'blocked');

    await expect.poll(() => router.currentRoute.value.fullPath).toBe('/d?redirected=1');
    expect(paneRoutes(root)).toEqual(['/b', '/d?redirected=1']);
  });

  it('unmounts pages as soon as they become inactive by default', async () => {
    const lifecycle = {
      A: lifecycleCounts(),
      B: lifecycleCounts(),
      C: lifecycleCounts(),
      D: lifecycleCounts(),
    };
    const { root } = await mountAt('/a', 0, lifecycle);
    click(root, '/a', 'push-b');
    await expectPanes(root, ['/a', '/b']);

    click(root, '/b', 'push-c');

    await expectPanes(root, ['/b', '/c']);
    await expect.poll(() => lifecycle.A.unmounted).toBe(1);
    expect(root.querySelector('[data-split-screen]')?.getAttribute('data-split-retained')).toBe('');
  });

  it('deactivates retained pages, evicts by LRU, and activates cache hits', async () => {
    const lifecycle = {
      A: lifecycleCounts(),
      B: lifecycleCounts(),
      C: lifecycleCounts(),
      D: lifecycleCounts(),
    };
    const { root, router } = await mountAt('/a', 1, lifecycle);
    click(root, '/a', 'push-b');
    await expectPanes(root, ['/a', '/b']);
    click(root, '/b', 'push-c');
    await expectPanes(root, ['/b', '/c']);
    await expect.poll(() => lifecycle.A).toMatchObject({ deactivated: 1, unmounted: 0 });
    const bNodeId = root.querySelector<HTMLElement>('[data-split-route="/b"]')?.dataset.splitNode;

    click(root, '/c', 'push-d');

    await expectPanes(root, ['/c', '/d']);
    await expect.poll(() => lifecycle.A.unmounted).toBe(1);
    expect(lifecycle.B).toMatchObject({ deactivated: 1, unmounted: 0 });
    expect(root.querySelector('[data-split-screen]')?.getAttribute('data-split-retained')).toBe(
      bNodeId,
    );

    router.back();

    await expectPanes(root, ['/b', '/c']);
    await expect.poll(() => lifecycle.B.activated).toBe(2);
    expect(lifecycle.B.mounted).toBe(1);
  });
});
