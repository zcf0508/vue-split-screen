import type { Component, VNode } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { SplitRouteNode, SplitTrail } from '../../model';
import { cloneVNode, defineComponent, h, nextTick, onBeforeUnmount, shallowReactive, shallowRef, watch } from 'vue';
import { loadRouteLocation, useRoute, useRouter } from 'vue-router';
import { presentTrail, selectRetainedPageIds } from '../../model';
import { createSplitHistoryController } from '../../router';
import { PageHost } from './PageHost';
import { SplitPlaceholder } from './SplitPlaceholder';

interface PageRecord {
  route: RouteLocationNormalizedLoaded;
  render: () => VNode[];
}

function routeProps(route: RouteLocationNormalizedLoaded): Record<string, unknown> | undefined {
  const matched = route.matched.at(-1);
  const config = matched?.props.default;
  if (config === true) {
    return route.params;
  }
  if (typeof config === 'function') {
    return config(route);
  }
  return config || undefined;
}

function renderRoute(route: RouteLocationNormalizedLoaded): VNode[] {
  const component = route.matched.at(-1)?.components?.default as Component | undefined;
  return component ? [h(component, routeProps(route))] : [];
}

export const SplitScreen = defineComponent({
  name: 'SplitScreen',
  props: {
    turnOn: {
      type: Boolean,
      default: () => true,
    },
    /**
     * By default, the left screen is the main screen and the right screen is the secondary screen.
     * Enabling this property will make the left screen the secondary screen and the right screen the main one.
     * This property is not enabled by default.
     */
    splitReverse: {
      type: Boolean,
      default: () => false,
    },
    maxInactivePages: {
      type: Number,
      default: () => 0,
      validator: (value: number) => Number.isInteger(value) && value >= 0,
    },
  },
  setup: (props, ctx) => {
    const route = useRoute();
    const router = useRouter();
    const controller = createSplitHistoryController(router);
    const records = shallowReactive(new Map<string, PageRecord>());
    const retainedIds = shallowRef<readonly string[]>([]);
    let recency: readonly string[] = [];

    function activeNodes(trail: SplitTrail): SplitRouteNode[] {
      const presentation = presentTrail(trail);
      return props.turnOn && presentation.companion
        ? [presentation.companion, presentation.current]
        : [presentation.current];
    }

    function captureCurrent(trail: SplitTrail) {
      const node = trail.at(-1)!;
      const template = (ctx.slots.default?.() ?? []).map(vnode => cloneVNode(vnode));
      const resolved = router.resolve(node.fullPath) as unknown as RouteLocationNormalizedLoaded;
      records.set(node.id, {
        route: resolved,
        render: () => template.map(vnode => cloneVNode(vnode)),
      });
    }

    async function ensureRecord(node: SplitRouteNode) {
      if (records.has(node.id)) {
        return;
      }
      const resolved = await loadRouteLocation(router.resolve(node.fullPath));
      if (!records.has(node.id)) {
        records.set(node.id, {
          route: resolved,
          render: () => renderRoute(resolved),
        });
      }
    }

    captureCurrent(controller.trail.value);

    watch(
      [controller.trail, () => props.turnOn, () => props.maxInactivePages],
      ([trail]) => {
        const active = activeNodes(trail);
        const selection = selectRetainedPageIds(
          trail,
          active.map(node => node.id),
          recency,
          props.maxInactivePages,
        );
        recency = selection.recency;
        retainedIds.value = selection.retained;

        const needed = new Set([...active.map(node => node.id), ...selection.retained]);
        void Promise.all(trail.filter(node => needed.has(node.id)).map(ensureRecord));
      },
      { immediate: true },
    );

    watch(
      [controller.trail, () => route.fullPath],
      async ([trail]) => {
        await nextTick();
        captureCurrent(trail);
        await Promise.all(trail.slice(-2).map(ensureRecord));
      },
      { flush: 'post' },
    );

    onBeforeUnmount(controller.dispose);

    return () => h(
      'div',
      {
        'data-split-retained': retainedIds.value.join(','),
        'data-split-screen': '',
        'style': `display: flex; width: 100%; flex-direction: ${props.splitReverse ? 'row-reverse' : 'row'};`,
      },
      (() => {
        const trail = controller.trail.value;
        const presentation = presentTrail(trail);
        const active = activeNodes(trail);
        const activeIds = new Set(active.map(node => node.id));
        const retained = retainedIds.value
          .map(id => trail.find(node => node.id === id))
          .filter((node): node is SplitRouteNode => node !== undefined && !activeIds.has(node.id));
        const panes = [...active, ...retained].map((node) => {
          const record = records.get(node.id);
          return record
            ? h(
                PageHost,
                {
                  key: node.id,
                  active: activeIds.has(node.id),
                  controller,
                  node,
                  renderPage: record.render,
                  route: record.route,
                },
              )
            : null;
        });

        if (props.turnOn && !presentation.companion) {
          panes.splice(active.length, 0, h(
            'div',
            {
              key: 'placeholder',
              style: 'min-width: 0; width: 0; flex: 1 1 0;',
            },
            ctx.slots.placeholder?.() ?? h(SplitPlaceholder),
          ));
        }
        return panes;
      })(),
    );
  },
});
