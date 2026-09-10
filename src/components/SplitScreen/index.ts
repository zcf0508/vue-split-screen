import type { Component, VNode } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { SplitRouteNode, SplitTrail } from '../../model';
import { defineComponent, h, onBeforeUnmount, shallowReactive, shallowRef, watch } from 'vue';
import { loadRouteLocation, useRouter } from 'vue-router';
import { presentTrail, selectRetainedPageIds } from '../../model';
import { createSplitHistoryController } from '../../router';
import { PageHost } from './PageHost';
import { SplitPlaceholder } from './SplitPlaceholder';

interface PageRecord {
  route: RouteLocationNormalizedLoaded;
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
  const matched = route.matched.at(-1);
  const component = matched?.components?.default as Component | undefined;
  if (!matched || !component) {
    return [];
  }

  return [h(component, {
    ...routeProps(route),
    onVnodeUnmounted: (vnode: VNode) => {
      const instance = vnode.component;
      const publicInstance = instance?.exposed ? instance.exposeProxy : instance?.proxy;
      if (instance?.isUnmounted && publicInstance && matched.instances.default === publicInstance) {
        matched.instances.default = null;
      }
    },
  })];
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
    const router = useRouter();
    const controller = createSplitHistoryController(router);
    const records = shallowReactive(new Map<string, PageRecord>());
    const retainedIds = shallowRef<readonly string[]>([]);
    let recency: readonly string[] = [];
    let neededIds = new Set<string>();
    let disposed = false;

    function activeNodes(trail: SplitTrail): SplitRouteNode[] {
      const presentation = presentTrail(trail);
      return props.turnOn && presentation.companion
        ? [presentation.companion, presentation.current]
        : [presentation.current];
    }

    function recordCurrent(trail: SplitTrail) {
      const node = trail.at(-1)!;
      const resolved = router.resolve(node.fullPath) as unknown as RouteLocationNormalizedLoaded;
      records.set(node.id, { route: resolved });
    }

    async function ensureRecord(node: SplitRouteNode) {
      if (records.has(node.id)) {
        return;
      }
      const resolved = await loadRouteLocation(router.resolve(node.fullPath));
      const stillPresent = controller.trail.value.some(
        candidate => candidate.id === node.id && candidate.fullPath === node.fullPath,
      );
      if (!disposed && neededIds.has(node.id) && stillPresent && !records.has(node.id)) {
        records.set(node.id, { route: resolved });
      }
    }

    recordCurrent(controller.trail.value);

    watch(
      [controller.trail, () => props.turnOn, () => props.maxInactivePages],
      ([trail]) => {
        recordCurrent(trail);
        const active = activeNodes(trail);
        const selection = selectRetainedPageIds(
          trail,
          active.map(node => node.id),
          recency,
          props.maxInactivePages,
        );
        recency = selection.recency;
        retainedIds.value = selection.retained;

        neededIds = new Set([...active.map(node => node.id), ...selection.retained]);
        for (const id of records.keys()) {
          if (!neededIds.has(id)) {
            records.delete(id);
          }
        }
        void Promise.all(trail.filter(node => neededIds.has(node.id)).map(ensureRecord));
      },
      { immediate: true },
    );

    onBeforeUnmount(() => {
      disposed = true;
      records.clear();
      controller.dispose();
    });

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
        const currentId = presentation.current.id;
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
                  renderPage: node.id === currentId
                    ? () => ctx.slots.default?.() ?? []
                    : () => renderRoute(record.route),
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
