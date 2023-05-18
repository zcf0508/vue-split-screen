import { h, defineComponent, provide, inject, computed, reactive, watchEffect } from "vue";
import type { PropType, Ref, ComputedRef } from "vue";
import { 
  RouteLocationNormalizedLoaded, 
  RouteRecordRaw, 
  routerViewLocationKey, 
  routeLocationKey, 
  routerKey, 
  useRouter, 
  useRoute,
  RouteLocationRaw, 
} from "vue-router"
import { routerCallbackKey, rowRouterPushKey, rowRouterReplaceKey } from "../constants";

const START_LOCATION_NORMALIZED: RouteLocationNormalizedLoaded = {
  path: "/",
  name: undefined,
  params: {},
  query: {},
  hash: "",
  fullPath: "/",
  matched: [],
  meta: {},
  redirectedFrom: undefined,
}

export const ScreenProxy = defineComponent({
  name: "ScreenProxy",
  props: {
    route: {
      type: Object as PropType<RouteLocationNormalizedLoaded | null>,
      default: () => null,
    },
  },
  setup(props, ctx){

    const injectedRoute = inject<Ref<RouteLocationNormalizedLoaded>>(routerViewLocationKey)!
    const routeToDisplay = computed<RouteLocationNormalizedLoaded>(
      () => props.route || injectedRoute.value,
    )

    const reactiveRoute = {} as {
      [k in keyof RouteLocationNormalizedLoaded]: ComputedRef<
        RouteLocationNormalizedLoaded[k]
      >
    }
    for (const key in START_LOCATION_NORMALIZED) {
      reactiveRoute[key] = computed(() => routeToDisplay.value[key])
    }

    provide(routeLocationKey, reactive(reactiveRoute))

    const router = useRouter()
    const routerCallback = inject<{
      routerPush: Function,
      routerReplace: Function,
    }>(routerCallbackKey)
    
    const rowRouterPush = inject<Function>(rowRouterPushKey)!
    const rowRouterReplace = inject<Function>(rowRouterReplaceKey)!

    const realRoute = useRoute();

    const pushProxy = new Proxy(rowRouterPush, {
      apply(target, thisArg, argArray:[to: RouteLocationRaw]) {
        const r = router.resolve(argArray[0])
        if(r.path !== realRoute.path){
          console.log("props.route", props.route)
          routerCallback?.routerPush(!!props.route)
        }
        return target.apply(thisArg, argArray)
      },
    })
    const replaceProxy = new Proxy(rowRouterReplace, {
      apply(target, thisArg, argArray:[to: RouteLocationRaw]) {
        const r = router.resolve(argArray[0])
        if(r.path !== realRoute.path){
          routerCallback?.routerReplace(!!props.route)
        }
        return target.apply(thisArg, argArray)
      },
    })

    provide(routerKey, {
      ...router,
      push: pushProxy,
      replace: replaceProxy,
    })

    return () => h(
      "div",
      {
        style: "width: 100%; flex: 1;",
      },
      ctx.slots,
    )
  },
})
