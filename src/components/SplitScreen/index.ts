import { h, VNode } from "vue"
import { ref, computed, watch, defineComponent, reactive, nextTick, provide } from "vue";
import { RouteLocationNormalizedLoaded, RouteRecordRaw, useRoute, useRouter } from "vue-router"
import { SplitPlaceholder } from "./SplitPlaceholder"
import { SplitScreenProxy } from "./SplitScreenProxy"
import { ScreenProxy } from "./ScreenProxy"
import { useNavigationListener } from "../../hooks/useNavigationListener";
import { routerCallbackKey, rowRouterPushKey, rowRouterReplaceKey } from "../constants";

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
  },
  setup:(props, ctx)=>{
    const slotQueue = reactive([] as SlotQueueItem[]);

    const route = useRoute();
    
    const router = useRouter()

    slotQueue.push({
      routePath: route.path,
      route: JSON.parse(JSON.stringify(route)),
      slot: ctx.slots.default?.(),
    })
    const splitKey = ref(new Date().getTime())

    function pushRoute() {
      if(slotQueue.length > 0 && route.path === slotQueue[slotQueue.length - 1].routePath) return
      slotQueue.push({
        routePath: route.path,
        route: route,
        slot: ctx.slots.default?.(),
      })
    }

    function popRoute() {
      slotQueue.pop()
    }

    // TODO: something wrong here
    useNavigationListener(
      undefined,
      popRoute,
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

    watch(()=>slotQueue,()=>{
      splitKey.value = new Date().getTime()
    },{
      deep: true,
    })

    provide(rowRouterPushKey, router.push)
    provide(rowRouterReplaceKey, router.replace)
    
    const renderSlot = computed(() => {
      const lastSlot = slotQueue[slotQueue.length - 2];
      
      if(!props.turnOn) {
        return h(
          ScreenProxy,
          ctx.slots.default?.(),
        )
      } else {
        if(lastSlot && lastSlot.slot) {
          return ()=>[
            h(
              ScreenProxy,
              {
                key: `${splitKey.value}-left`,
                route: lastSlot.route,
              },
              lastSlot.slot,
            ),
            h(
              ScreenProxy,
              {
                key: `${splitKey.value}-right`,
              },
              ctx.slots.default?.(),
            ),
          ]
        } else {
          return ()=>[
            h(
              ScreenProxy,
              {
                key: `${splitKey.value}-left`,
              },
              ctx.slots.default?.(),
            ),
            ctx.slots.placeholder
              ? h(
                ScreenProxy,
                ctx.slots.placeholder(),
              )
              : h(
                ScreenProxy,
                h(SplitPlaceholder),
              ),
          ]
        }
      }
    })

    return ()=>{
      return h(
        SplitScreenProxy,
        renderSlot.value,
      )
    }
  },
})

