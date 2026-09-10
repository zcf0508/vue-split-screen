import { defineComponent, h } from 'vue';

export const SplitPlaceholder = defineComponent({
  name: 'SplitPlaceholder',
  setup() {
    return () => h(
      'div',
      '空白页',
    );
  },
});
