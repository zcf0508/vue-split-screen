import type { PropType, Ref } from 'vue';
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
  Router,
} from 'vue-router';
import { computed, defineComponent, h, inject, provide, reactive } from 'vue';
import {
  routeLocationKey,
  routerKey,
  routerViewLocationKey,
  useRouter,
} from 'vue-router';
import { getRealRouteKey, routerCallbackKey, rowRouterPushKey, rowRouterReplaceKey } from '../constants';

export const ScreenProxy = defineComponent({
  name: 'ScreenProxy',
  props: {
    route: {
      type: Object as PropType<RouteLocationNormalizedLoaded | null>,
      default: () => null,
    },
    left: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, ctx) {
    const getRealRoute = inject<() => RouteLocationNormalizedLoaded>(getRealRouteKey)!;

    const injectedRoute = inject<Ref<RouteLocationNormalizedLoaded>>(routerViewLocationKey)!;
    const routeToDisplay = computed<RouteLocationNormalizedLoaded>(
      () => props.route || injectedRoute.value,
    );

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

    const router = useRouter();
    const routerCallback = inject<{
      routerPush: (left: boolean) => void;
      routerReplace: (left: boolean) => void;
    }>(routerCallbackKey);

    const rowRouterPush = inject<Router['push']>(rowRouterPushKey)!;
    const rowRouterReplace = inject<Router['replace']>(rowRouterReplaceKey)!;

    const pushProxy = new Proxy(rowRouterPush, {
      apply(target, thisArg, argArray: [to: RouteLocationRaw]) {
        const realRoute = getRealRoute();
        const r = router.resolve(argArray[0]);
        if (r.path !== realRoute.path) {
          routerCallback?.routerPush(props.left);
        }
        return target.apply(thisArg, argArray);
      },
    });
    const replaceProxy = new Proxy(rowRouterReplace, {
      apply(target, thisArg, argArray: [to: RouteLocationRaw]) {
        const realRoute = getRealRoute();
        const r = router.resolve(argArray[0]);
        if (r.path !== realRoute.path) {
          routerCallback?.routerReplace(props.left);
        }
        return target.apply(thisArg, argArray);
      },
    });

    provide(routerKey, {
      ...router,
      push: pushProxy,
      replace: replaceProxy,
    });

    return () => h(
      'div',
      {
        style: 'width: 100%; flex: 1;',
      },
      ctx.slots,
    );
  },
});
