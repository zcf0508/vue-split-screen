import { h, defineComponent } from "vue";

export const ScreenProxy = defineComponent({
  name: "ScreenProxy",
  setup(props, ctx){
    return ()=>{
      return h(
        "div",
        {
          style: "width: 100%; flex: 1;",
        },
        ctx.slots.default
          ? ctx.slots.default()
          : undefined,
      )
    }
  },
})
