import type { App, Component } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter, RouterView, useRoute, useRouter } from 'vue-router';
import { SplitScreen } from '../src';

const mountedApps: Array<{ app: App; root: HTMLElement }> = [];

function page(name: string): Component {
  return defineComponent({
    name: `${name}Page`,
    setup() {
      const route = useRoute();
      const router = useRouter();
      return () => h('section', { 'data-page': name, 'data-page-route': route.fullPath }, [
        h('button', {
          'data-action': 'push-d',
          'onClick': () => router.push('/d'),
        }, 'push D'),
        h('button', {
          'data-action': 'replace-d',
          'onClick': () => router.replace('/d'),
        }, 'replace D'),
        h('button', {
          'data-action': 'push-b',
          'onClick': () => router.push('/b'),
        }, 'push B'),
        h('button', {
          'data-action': 'push-c',
          'onClick': () => router.push('/c'),
        }, 'push C'),
      ]);
    },
  });
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['a', 'b', 'c', 'd'].map(name => ({
      path: `/${name}`,
      component: page(name.toUpperCase()),
    })),
  });
  await router.push(path);
  await router.isReady();

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(defineComponent({
    setup: () => () => h(RouterView, null, {
      default: ({ Component: routeComponent }: { Component: Component }) => h(
        SplitScreen,
        { turnOn: true },
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
});
