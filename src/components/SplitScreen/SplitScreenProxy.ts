import { h, defineComponent } from "vue";

export const SplitScreenProxy = defineComponent({
  name: "SplitScreenProxy",
  props: {
    splitReverse: {
      type: Boolean,
      default: () => false,
    },
  },
  setup(props, ctx){
    return () => h(
      "div",
      {
        style: `display: flex; flex-direction: ${props.splitReverse ? "row-reverse" : "row"};`,
      },
      ctx.slots,
    )
  },
})
