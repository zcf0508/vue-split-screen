import { h, defineComponent } from "vue";

export const SplitScreenProxy = defineComponent({
  name: "SplitScreenProxy",
  setup(props, ctx){
    return () => h(
      "div",
      {
        style: "display: flex; flex-direction: row;",
      },
      ctx.slots,
    )
  },
})
