import { h, VNode } from "vue"
import { ref, computed, watch, defineComponent, reactive, nextTick, provide, unref } from "vue";
import { RouteLocationNormalizedLoaded, RouteRecordRaw, useRoute, useRouter } from "vue-router"
import { SplitPlaceholder } from "./SplitPlaceholder"
import { SplitScreenProxy } from "./SplitScreenProxy"
import { ScreenProxy } from "./ScreenProxy"
import { useNavigationListener } from "../../hooks/useNavigationListener";
import { routerCallbackKey, rowRouterPushKey, rowRouterReplaceKey } from "../constants";
import { cloneRoute } from "./utils";

type SlotQueueItem = {
  routePath: string
  route: RouteLocationNormalizedLoaded
  slot?: VNode[]
}

export const SplitScreen = defineComponent({
  name: "SplitScreen",
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
  setup:(props, ctx)=>{
    const slotQueue = ref([] as SlotQueueItem[]);

    const route = useRoute();
    
    const router = useRouter()

    slotQueue.value.push({
      routePath: route.path,
      route: cloneRoute(route),
      slot: ctx.slots.default?.(),
    })
    const splitKey = ref(new Date().getTime())

    function pushRoute() {
      if(slotQueue.value.length > 0 && route.path === slotQueue.value[slotQueue.value.length - 1].routePath) return
      slotQueue.value.push({
        routePath: route.path,
        route: cloneRoute(route),
        slot: ctx.slots.default?.(),
      })
    }

    function popRoute() {
      slotQueue.value.pop()
    }

    // TODO: something wrong here
    useNavigationListener(
      undefined,
      () => {
        popRoute()
        popRoute()
      },
    )

    provide(routerCallbackKey, {
      pushRoute,
      popRoute,
    })

    watch(
      () => route.path,
      (val) => {
        nextTick(()=>{
          pushRoute()
        })
      },
    );

    watch(()=>slotQueue.value,()=>{
      // console.log(1111, unref(slotQueue.value))
      splitKey.value = new Date().getTime()
    },{
      deep: true,
    })

    provide(rowRouterPushKey, router.push)
    provide(rowRouterReplaceKey, router.replace)
    
    const renderSlot = computed(() => {
      // console.log(slotQueue.value)
      const lastSlot = slotQueue.value[slotQueue.value.length - 2];
      
      if(!props.turnOn) {
        return () => h(
          ScreenProxy,
          { key: splitKey.value },
          ctx.slots,
        )
      } else {
        if(lastSlot && lastSlot.slot) {
          return () => [
            h(
              ScreenProxy,
              {
                key: `${splitKey.value}-left`,
                route: lastSlot.route,
              },
              {
                default: () => lastSlot.slot,
              },
            ),
            h(
              ScreenProxy,
              {
                key: `${splitKey.value}-right`,
              },
              ctx.slots,
            ),
          ]
        } else {
          return () => [
            h(
              ScreenProxy,
              {
                key: `${splitKey.value}-left`,
              },
              ctx.slots,
            ),
            ctx.slots.placeholder
              ? h(
                ScreenProxy,
                {
                  key: "placeholder",
                },
                ctx.slots.placeholder,
              )
              : h(
                ScreenProxy,
                {
                  key: "placeholder",
                },
                h(SplitPlaceholder),
              ),
          ]
        }
      }
    })

    return () => h(
      SplitScreenProxy,
      {
        splitReverse: props.splitReverse,
      },
      renderSlot.value,
    )
  },
})

