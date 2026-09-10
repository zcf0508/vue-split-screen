import type { PropType } from 'vue';
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
  Router,
} from 'vue-router';
import type { SplitRouteNode } from '../../model';
import type { SplitHistoryController } from '../../router';
import { computed, defineComponent, h, provide, reactive } from 'vue';
import {
  matchedRouteKey,
  routeLocationKey,
  routerKey,
  routerViewLocationKey,
  useRouter,
} from 'vue-router';
import { splitRouteNodeKey, splitRouterKey } from '../../router';

export const ScreenProxy = defineComponent({
  name: 'ScreenProxy',
  props: {
    route: {
      type: Object as PropType<RouteLocationNormalizedLoaded>,
      required: true,
    },
    node: {
      type: Object as PropType<SplitRouteNode>,
      required: true,
    },
    controller: {
      type: Object as PropType<SplitHistoryController>,
      required: true,
    },
  },
  setup(props, ctx) {
    const router = useRouter();
    const routeToDisplay = computed(() => props.route);

    const reactiveRoute = {
      fullPath: computed(() => routeToDisplay.value.fullPath),
      hash: computed(() => routeToDisplay.value.hash),
      matched: computed(() => routeToDisplay.value.matched),
      meta: computed(() => routeToDisplay.value.meta),
      name: computed(() => routeToDisplay.value.name),
      params: computed(() => routeToDisplay.value.params),
      path: computed(() => routeToDisplay.value.path),
      query: computed(() => routeToDisplay.value.query),
      redirectedFrom: computed(() => routeToDisplay.value.redirectedFrom),
    };

    provide(routeLocationKey, reactive(reactiveRoute));
    provide(routerViewLocationKey, routeToDisplay);
    provide(matchedRouteKey, computed(() => props.route.matched.at(-1)));

    const resolve = ((to: RouteLocationRaw, currentLocation?: RouteLocationNormalizedLoaded) => (
      router.resolve(to, currentLocation ?? props.route)
    )) as Router['resolve'];
    const paneRouter = {
      ...router,
      push: to => props.controller.navigate(props.node.id, 'push', to),
      replace: to => props.controller.navigate(props.node.id, 'replace', to),
      resolve,
    } satisfies typeof router;
    provide(routerKey, paneRouter);
    provide(splitRouterKey, paneRouter);
    provide(splitRouteNodeKey, computed(() => props.node));

    return () => h(
      'div',
      {
        'data-split-node': props.node.id,
        'data-split-route': props.node.fullPath,
        'style': 'min-width: 0; width: 0; flex: 1 1 0;',
      },
      ctx.slots,
    );
  },
});
