<script lang="ts">
export default defineComponent({
  name: 'App',
});
</script>

<template>
  <router-view></router-view>
</template>

<style>
:root {
  --animate-duration: 0.75s !important;
}

html {
  background: #f5f5f5;
}

body {
  margin: 0;
}
</style>
