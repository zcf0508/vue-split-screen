import { h, VNode } from "vue"
import { computed, watch, defineComponent, reactive, nextTick } from "vue";
import { RouteLocationNormalizedLoaded, RouteRecordRaw, useRoute, useRouter } from "vue-router"
import { SplitPlaceholder } from "./SplitPlaceholder"
import { SplitScreenProxy } from "./SplitScreenProxy"
import { ScreenProxy } from "./ScreenProxy"

type SlotQueueItem = {
  routePath: string,
  route: RouteLocationNormalizedLoaded,
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

    watch(
      () => route.path,
      (val) => {
        nextTick(()=>{
          slotQueue.push({
            routePath: val,
            route: route,
            slot: ctx.slots.default?.(),
          })
        })
      },
    );
        
    return ()=>{
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
                  route: lastSlot.route,
                },
                lastSlot.slot,
              ),
              h(
                ScreenProxy,
                ctx.slots.default?.(),
              ),
            ]
          } else {
            return ()=>[
              h(
                ScreenProxy,
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

      return h(
        SplitScreenProxy,
        renderSlot.value,
      )
    }
  },
})

