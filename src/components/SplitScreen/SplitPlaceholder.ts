import { h, defineComponent } from "vue";

export const SplitPlaceholder = defineComponent({
  name: "SplitPlaceholder",
  setup(props, ctx){
    return() => h(
      "div",
      "空白页",
    )
  },
})
