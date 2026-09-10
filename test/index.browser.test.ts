import type { App, Component, ComponentPublicInstance } from 'vue';
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
  ref,
} from 'vue';
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  isNavigationFailure,
  NavigationFailureType,
  onBeforeRouteLeave,
  RouterView,
  useRoute,
  useRouter,
} from 'vue-router';
import { SplitScreen, useSplitRouter } from '../src';
import { createSplitHistoryController } from '../src/router';

const mountedApps: Array<{ app: App; root: HTMLElement }> = [];

interface LifecycleCounts {
  activated: number;
  deactivated: number;
  mounted: number;
  unmounted: number;
}

interface MountOptions {
  components?: Partial<Record<string, Component>>;
  trail?: Array<{ fullPath: string; id: string }>;
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
        h('button', {
          'data-action': 'query-only',
          'onClick': () => splitRouter.push({ query: { source: name } }),
        }, 'query only'),
      ]);
    },
  });
}

async function mountAt(
  path: string,
  maxInactivePages = 0,
  lifecycle?: Record<string, LifecycleCounts>,
  options: MountOptions = {},
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      ...['a', 'b', 'c', 'd'].map(name => ({
        path: `/${name}`,
        component: options.components?.[name] ?? page(name.toUpperCase(), lifecycle),
      })),
      { path: '/redirect', redirect: '/d?redirected=1' },
      { path: '/blocked', component: page('BLOCKED', lifecycle) },
    ],
  });
  router.beforeEach(to => to.path === '/blocked' ? false : undefined);
  const initialRoute = router.resolve(path);
  await router.push(options.trail
    ? {
        path: initialRoute.path,
        query: initialRoute.query,
        hash: initialRoute.hash,
        state: {
          __vueSplitScreen: {
            version: 1,
            trail: options.trail,
          },
        },
      }
    : path);
  await router.isReady();

  const root = document.createElement('div');
  document.body.append(root);
  const splitReverse = ref(false);
  const turnOn = ref(true);
  const app = createApp(defineComponent({
    setup: () => () => h(RouterView, null, {
      default: ({ Component: routeComponent }: { Component: Component }) => h(
        SplitScreen,
        { maxInactivePages, splitReverse: splitReverse.value, turnOn: turnOn.value },
        { default: () => h(routeComponent) },
      ),
    }),
  }));
  app.use(router);
  app.mount(root);
  mountedApps.push({ app, root });
  await nextTick();

  return { root, router, splitReverse, turnOn };
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
  it('restores the destination trail from real browser history state', async () => {
    const originalHref = window.location.href;
    const originalState = window.history.state;
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        ...['a', 'b', 'c'].map(name => ({ path: `/${name}`, component: page(name.toUpperCase()) })),
        { path: '/:pathMatch(.*)*', component: page('FALLBACK') },
      ],
    });

    try {
      await router.replace('/a');
      await router.isReady();
      let id = 0;
      const controller = createSplitHistoryController(
        router,
        () => String.fromCharCode(65 + id++),
      );
      await controller.navigate('A', 'push', '/b');
      await controller.navigate('B', 'push', '/c');

      const backFinished = new Promise<void>((resolve) => {
        const remove = router.afterEach((to) => {
          if (to.path === '/b') {
            remove();
            resolve();
          }
        });
      });
      router.back();
      await backFinished;

      expect(controller.trail.value.map(node => node.fullPath)).toEqual(['/a', '/b']);
      controller.dispose();
    }
    finally {
      router.options.history.destroy();
      window.history.replaceState(originalState, '', originalHref);
    }
  });

  it('associates a reconstructed companion guard with its own route record', async () => {
    let companionGuardCalls = 0;
    const GuardedA = defineComponent({
      setup() {
        onBeforeRouteLeave(() => {
          companionGuardCalls++;
          return false;
        });
        return () => h('section', { 'data-page': 'A', 'data-page-route': '/a' }, 'A');
      },
    });
    const { root } = await mountAt('/b', 0, undefined, {
      components: { a: GuardedA },
      trail: [
        { id: 'A', fullPath: '/a' },
        { id: 'B', fullPath: '/b' },
      ],
    });
    await expectPanes(root, ['/a', '/b']);

    click(root, '/b', 'replace-d');

    await expectPanes(root, ['/a', '/d']);
    expect(companionGuardCalls).toBe(0);
  });

  it('does not clear a newer repeated-route instance when evicting a companion', async () => {
    const RepeatedA = defineComponent({
      setup(_props, { expose }) {
        expose({ kind: 'repeated-a' });
        return () => h('section', { 'data-page': 'A' }, 'A');
      },
    });
    const { root, router, splitReverse, turnOn } = await mountAt('/a?source=new', 0, undefined, {
      components: { a: RepeatedA },
      trail: [
        { id: 'old-a', fullPath: '/a' },
        { id: 'new-a', fullPath: '/a?source=new' },
      ],
    });
    await expectPanes(root, ['/a', '/a?source=new']);
    const record = router.resolve('/a').matched.at(-1)!;
    const newerInstance = record.instances.default;
    expect(newerInstance).toBeTruthy();

    splitReverse.value = true;
    await nextTick();
    turnOn.value = false;
    await expectPanes(root, ['/a?source=new']);

    expect(record.instances.default).toBe(newerInstance);
  });

  it('passes the destination instance to beforeRouteEnter callbacks', async () => {
    let enteredInstance: ComponentPublicInstance | undefined;
    const EnteredB = defineComponent({
      beforeRouteEnter(_to, _from, next) {
        next((instance) => {
          enteredInstance = instance;
        });
      },
      setup: () => () => h('section', { 'data-page': 'B', 'data-page-route': '/b' }, 'B'),
    });
    const { root } = await mountAt('/a', 0, undefined, {
      components: { b: EnteredB },
    });

    click(root, '/a', 'push-b');

    await expectPanes(root, ['/a', '/b']);
    await expect.poll(() => (enteredInstance?.$el as HTMLElement | undefined)?.dataset.page).toBe('B');
  });

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

  it('resolves a query-only push against the companion pane', async () => {
    const { root, router } = await mountAt('/a');
    click(root, '/a', 'push-b');
    await expectPanes(root, ['/a', '/b']);

    click(root, '/a', 'query-only');

    await expectPanes(root, ['/a', '/a?source=A']);
    expect(router.currentRoute.value.fullPath).toBe('/a?source=A');
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

    const blockedFinished = new Promise((resolve) => {
      const remove = router.afterEach((to, _from, failure) => {
        if (to.path === '/blocked') {
          remove();
          resolve(failure);
        }
      });
    });
    click(root, '/d?redirected=1', 'blocked');

    const failure = await blockedFinished;
    expect(isNavigationFailure(failure, NavigationFailureType.aborted)).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe('/d?redirected=1');
    expect(paneRoutes(root)).toEqual(['/b', '/d?redirected=1']);
  });

  it('unmounts pages as soon as they become inactive by default', async () => {
    const lifecycle = {
      A: lifecycleCounts(),
      B: lifecycleCounts(),
      C: lifecycleCounts(),
      D: lifecycleCounts(),
    };
    const { root, router } = await mountAt('/a', 0, lifecycle);
    const aRecord = router.resolve('/a').matched.at(-1)!;
    click(root, '/a', 'push-b');
    await expectPanes(root, ['/a', '/b']);
    const aInstance = aRecord.instances.default;
    expect(aInstance).toBeTruthy();

    click(root, '/b', 'push-c');

    await expectPanes(root, ['/b', '/c']);
    expect(lifecycle.B).toMatchObject({ mounted: 1, unmounted: 0 });
    await expect.poll(() => lifecycle.A.unmounted).toBe(1);
    expect(aRecord.instances.default).toBeNull();
    expect(aRecord.instances.default).not.toBe(aInstance);
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
