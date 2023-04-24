import { h, defineComponent, provide, inject, computed, reactive } from "vue";
import type { Ref } from "vue";
import { RouteLocationNormalizedLoaded, RouteRecordRaw, routerViewLocationKey, routeLocationKey } from "vue-router"

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
      // @ts-expect-error: the key matches
      reactiveRoute[key] = computed(() => routeToDisplay.value[key])
    }

    provide(routeLocationKey, reactive(reactiveRoute))

    return ()=>{
      return h(
        "div",
        {
          style: "width: 100%; flex: 1;",
        },
        ctx.slots.default?.(),
      )
    }
  },
})
