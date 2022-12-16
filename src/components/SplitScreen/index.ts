import { h, VNode } from 'vue'
import { computed, watch, defineComponent, reactive, nextTick } from 'vue';
import {  useRoute } from 'vue-router'
import { SplitPlaceholder } from './SplitPlaceholder'
import { SplitScreenProxy } from './SplitScreenProxy'
import { ScreenProxy } from './ScreenProxy'

type SlotQueueItem = {
    router: string,
    slot?: VNode[]
}

export const SplitScreen = defineComponent({
    name: 'SplitScreen',
    props: {
        turnOn: {
            type: Boolean,
            default: () => true
        }
    },
    setup:(props, ctx)=>{
        const slotQueue = reactive([] as SlotQueueItem[]);

        const route = useRoute();
        
        slotQueue.push({
            router: route.path,
            slot: ctx.slots.default ? ctx.slots.default() : undefined
        })

        watch(
            () => route.path,
            (routePath) => {
                nextTick(()=>{
                    slotQueue.push({
                        router: routePath,
                        slot: ctx.slots.default ? ctx.slots.default() : undefined
                    })
                })
            }
        );
        
        return ()=>{
            const renderSlot = computed(() => {
                console.log(slotQueue)
                const lastSlot = slotQueue[slotQueue.length - 2];
                if(!props.turnOn) {
                    console.log(1)
                    return h(
                        ScreenProxy,
                        ctx.slots.default
                                ? ctx.slots.default()
                                : undefined
                    )
                } else {
                    if(lastSlot && lastSlot.slot) {
                        console.log(2)
                        return ()=>[
                            h(
                                ScreenProxy,
                                lastSlot.slot
                            ),
                            h(
                                ScreenProxy,
                                ctx.slots.default
                                        ? ctx.slots.default()
                                        : undefined
                            )
                        ]
                    } else {
                        console.log(3)
                        return ()=>[
                            h(
                                ScreenProxy,
                                ctx.slots.default
                                        ? ctx.slots.default()
                                        : undefined,
                            ),
                            h(
                                ScreenProxy,
                                h(SplitPlaceholder)
                            )
                        ]
                    }
                }
            })

            return h(
                SplitScreenProxy,
                renderSlot.value
            )
        }
    }
})

