import type { Component, VNode } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { SplitRouteNode, SplitTrail } from '../../model';
import { cloneVNode, defineComponent, h, nextTick, onBeforeUnmount, shallowReactive, watch } from 'vue';
import { loadRouteLocation, useRoute, useRouter } from 'vue-router';
import { presentTrail } from '../../model';
import { createSplitHistoryController } from '../../router';
import { ScreenProxy } from './ScreenProxy';
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
  },
  setup: (props, ctx) => {
    const route = useRoute();
    const router = useRouter();
    const controller = createSplitHistoryController(router);
    const records = shallowReactive(new Map<string, PageRecord>());

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
        'data-split-screen': '',
        'style': `display: flex; width: 100%; flex-direction: ${props.splitReverse ? 'row-reverse' : 'row'};`,
      },
      (() => {
        const presentation = presentTrail(controller.trail.value);
        const nodes = props.turnOn && presentation.companion
          ? [presentation.companion, presentation.current]
          : [presentation.current];
        const panes = nodes.map((node) => {
          const record = records.get(node.id);
          return record
            ? h(
                ScreenProxy,
                {
                  key: node.id,
                  node,
                  route: record.route,
                  controller,
                },
                record.render,
              )
            : null;
        });

        if (props.turnOn && !presentation.companion) {
          panes.push(h(
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
