import { h, VNode } from "vue"
import { computed, watch, defineComponent, reactive, nextTick } from "vue";
import {  useRoute } from "vue-router"
import { SplitPlaceholder } from "./SplitPlaceholder"
import { SplitScreenProxy } from "./SplitScreenProxy"
import { ScreenProxy } from "./ScreenProxy"

type SlotQueueItem = {
    router: string,
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
        
    slotQueue.push({
      router: route.path,
      slot: ctx.slots.default ? ctx.slots.default() : undefined,
    })

    watch(
      () => route.path,
      (routePath) => {
        nextTick(()=>{
          slotQueue.push({
            router: routePath,
            slot: ctx.slots.default ? ctx.slots.default() : undefined,
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
            ctx.slots.default
              ? ctx.slots.default()
              : undefined,
          )
        } else {
          if(lastSlot && lastSlot.slot) {
            return ()=>[
              h(
                ScreenProxy,
                lastSlot.slot,
              ),
              h(
                ScreenProxy,
                ctx.slots.default
                  ? ctx.slots.default()
                  : undefined,
              ),
            ]
          } else {
            return ()=>[
              h(
                ScreenProxy,
                ctx.slots.default
                  ? ctx.slots.default()
                  : undefined,
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

