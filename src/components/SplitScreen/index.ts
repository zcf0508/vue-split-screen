import { h, onMounted, VNode } from "vue"
import { ref, computed, watch, defineComponent, reactive, nextTick, provide, unref } from "vue";
import { RouteLocationNormalizedLoaded, RouteRecordRaw, useRoute, useRouter } from "vue-router"
import { SplitPlaceholder } from "./SplitPlaceholder"
import { SplitScreenProxy } from "./SplitScreenProxy"
import { ScreenProxy } from "./ScreenProxy"
import { useNavigationListener } from "../../hooks/useNavigationListener";
import { getRealRouteKey, routerCallbackKey, rowRouterPushKey, rowRouterReplaceKey } from "../constants";
import { cloneRoute } from "./utils";

type SplitSlot = {
  route: RouteLocationNormalizedLoaded
  slot?: VNode[]
}

type SplitSlots = [SplitSlot] | [SplitSlot, SplitSlot]

type SlotQueueItem = {
  routePath: string
  splitSlots: SplitSlots
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
    const splitKey = ref(new Date().getTime())

    const slotQueue = ref([] as SlotQueueItem[]);
    const queueIdx = ref(-1)

    const route = useRoute();
    const router = useRouter()

    const leftFlag = ref(false)
    const pushFlag = ref(true)

    function queuePush(left: boolean) {
      const slots = [] as unknown as SplitSlots
      const current = unref(slotQueue.value[queueIdx.value])
      if (current && current.splitSlots.length === 2) {
        if(left) {
          slots.push(current.splitSlots[0])
        } else {
          slots.push(current.splitSlots[1])
        }
      } else if(current) {
        slots.push(current.splitSlots[0])
      }
      slots.push({
        route: cloneRoute(route),
        slot: ctx.slots.default?.(),
      })

      slotQueue.value.splice(queueIdx.value + 1, slotQueue.value.length - queueIdx.value - 1, {
        routePath: route.path,
        splitSlots: slots,
      })

      queueIdx.value  = slotQueue.value.length - 1
      leftFlag.value = false
      pushFlag.value = true
    }

    function queueReplace(left: boolean) {
      const slots = [] as unknown as SplitSlots
      const current = slotQueue.value[queueIdx.value]
      // console.log({
      //   current, 
      //   left,
      // })
      if (current) {
        if(!left) {
          slots.push(current.splitSlots[0])
        }
      }
      slots.push({
        route: cloneRoute(route),
        slot: ctx.slots.default?.(),
      })

      slotQueue.value.splice(queueIdx.value, slotQueue.value.length - queueIdx.value, {
        routePath: route.path,
        splitSlots: slots,
      })

      queueIdx.value  = slotQueue.value.length - 1
      leftFlag.value = false
      pushFlag.value = true
    }

    const navigationFlag = ref(false)
    useNavigationListener(() => {
      queueIdx.value += 1
      navigationFlag.value = true
      if(queueIdx.value >= slotQueue.value.length - 1) {
        queueIdx.value = slotQueue.value.length - 1
      }
    }, () => {
      queueIdx.value -= 1
      navigationFlag.value = true
      if(queueIdx.value < 0) {
        queueIdx.value = 0
      }
    })

    onMounted(()=>{
      queuePush(true)
    })

    function routerPush(left: boolean) {
      leftFlag.value = left
      pushFlag.value = true
    }
    function routerReplace(left: boolean) {
      // console.log({
      //   left,
      // })
      leftFlag.value = left
      pushFlag.value = false
    }

    provide(routerCallbackKey, {
      routerPush,
      routerReplace,
    })

    watch(() => route.path, () => {
      setTimeout(()=>{
        // console.log(222, [
        //   navigationFlag.value,
        //   pushFlag.value,
        //   leftFlag.value,
        // ])
        if(!navigationFlag.value) {
          if(pushFlag.value) {
            queuePush(leftFlag.value)
          } else {
            queueReplace(leftFlag.value)
          }
        }
        navigationFlag.value = false
      }, 0)
    })

    provide(getRealRouteKey, () => {
      // console.log("getRealRoute")
      return cloneRoute(route)
    })
    
    watch(() => [slotQueue.value, queueIdx.value], () => {
      // console.log(1111, {
      //   slotQueue: slotQueue.value,
      //   queueIdx: queueIdx.value,
      // })
      splitKey.value = new Date().getTime()
    },{
      deep: true,
    })

    provide(rowRouterPushKey, router.push)
    provide(rowRouterReplaceKey, router.replace)
    
    const renderSlot = computed(() => {
      // console.log(slotQueue.value)
      // console.log(queueIdx.value)
      const currentSlot = slotQueue.value[queueIdx.value];
      
      if(!props.turnOn) {
        return () => h(
          ScreenProxy,
          { key: splitKey.value },
          ctx.slots,
        )
      } else {
        if(currentSlot && currentSlot.splitSlots.length === 2) {
          return () => [
            h(
              ScreenProxy,
              {
                key: `${splitKey.value}-left`,
                route: currentSlot.splitSlots[0].route,
              },
              {
                default: () => currentSlot.splitSlots[0].slot,
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

