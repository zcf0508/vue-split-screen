# vue-split-screen

[![NPM version](https://img.shields.io/npm/v/vue-split-screen?color=a1b858&label=)](https://www.npmjs.com/package/vue-split-screen)

This library is used to create a split-screen effect of the page, so that the page on the folding mobile has a better experience.

## usage

```vue
<template>
  <router-view v-slot="{ Component }">
    <split-screen :turn-on="turnOn" :split-reverse="reverse">
      <component :is="Component" />
      <template #placeholder>
        <!-- placehoder template -->
      </template>
    </split-screen>
  </router-view>
</template>

<script setup>
import { SplitScreen } from "vue-split-screen"

const turnOn = ref(true)

/**
 * @description: Whether to reverse the split screen
 */
const reverse = ref(false)

</script>
```

## License

[MIT](./LICENSE) License © 2022 [Huali](https://github.com/zcf0508)
