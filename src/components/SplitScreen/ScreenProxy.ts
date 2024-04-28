import { h, defineComponent, provide, inject, computed, reactive, onMounted, onUnmounted } from "vue";
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
import { getRealRouteKey, routerCallbackKey, rowRouterPushKey, rowRouterReplaceKey } from "../constants";

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
    left: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, ctx){
    const getRealRoute = inject<() => RouteLocationNormalizedLoaded>(getRealRouteKey)!

    const injectedRoute = inject<Ref<RouteLocationNormalizedLoaded>>(routerViewLocationKey)!
    const routeToDisplay = computed<RouteLocationNormalizedLoaded>(
      () => props.route || injectedRoute.value,
    )

    const reactiveRouteRef = computed(()=>{
      const reactiveRoute = {} as {
        [k in keyof RouteLocationNormalizedLoaded]: ComputedRef<
          RouteLocationNormalizedLoaded[k]
        >
      }
      for (const key in START_LOCATION_NORMALIZED) {
        reactiveRoute[key] = computed(() => routeToDisplay.value[key])
      }
      return reactiveRoute
    })

    provide(routeLocationKey, reactive(reactiveRouteRef.value))

    const router = useRouter()
    const routerCallback = inject<{
      routerPush: Function,
      routerReplace: Function,
    }>(routerCallbackKey)
    
    const rowRouterPush = inject<Function>(rowRouterPushKey)!
    const rowRouterReplace = inject<Function>(rowRouterReplaceKey)!


    const pushProxy = new Proxy(rowRouterPush, {
      apply(target, thisArg, argArray:[to: RouteLocationRaw]) {
        const realRoute = getRealRoute()
        const r = router.resolve(argArray[0])
        if(r.path !== realRoute.path){
          routerCallback?.routerPush(props.left)
        }
        return target.apply(thisArg, argArray)
      },
    })
    const replaceProxy = new Proxy(rowRouterReplace, {
      apply(target, thisArg, argArray:[to: RouteLocationRaw]) {
        const realRoute = getRealRoute()
        const r = router.resolve(argArray[0])
        if(r.path !== realRoute.path){
          routerCallback?.routerReplace(props.left)
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
