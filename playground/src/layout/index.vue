<template>
  <img class="mx-auto" alt="Vue logo" src="@/assets/logo.png" />
  <router-view v-slot="{ Component }">
    <split-screen>
      <component :is="Component" />
      <template #placeholder>
        <!-- placehoder template -->
        <div class="h-full flex items-center justify-center">
          placehoder
        </div>
      </template>
    </split-screen>
  </router-view>
</template>

<script lang="ts">
import { SplitScreen } from "vue-split-screen"
export default defineComponent({
  name: "Layout",
  components: {
    SplitScreen,
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
