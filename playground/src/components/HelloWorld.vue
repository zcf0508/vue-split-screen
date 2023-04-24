<template>
  <p>
    <!--使用 router-link 组件进行导航 -->
    <!--通过传递 `to` 来指定链接 -->
    <!--`<router-link>` 将呈现一个带有正确 `href` 属性的 `<a>` 标签-->
    <router-link to="/home" class="inline-block mr-8">
      <div class="i-ri:home-2-line h-4 w-4 mr-2 align-text-bottom"></div>
      <span>Go to Home</span>
    </router-link>

    <router-link to="/about">
      <div class="i-ri:lightbulb-line h-4 w-4 mr-2 align-text-bottom"></div>
      <span>Go to About</span>
    </router-link>
  </p>
  <h1>{{ `${path} - ${msg}` }}</h1>

  <p>
    Recommended IDE setup:
    <a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
    +
    <a href="https://marketplace.visualstudio.com/items?itemName=octref.vetur" target="_blank"> Vetur </a>
    or
    <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
    (if using
    <code>&lt;script setup&gt;</code>)
  </p>

  <p>See <code>README.md</code> for more information.</p>

  <p>
    <a href="https://vitejs.dev/guide/features.html" target="_blank"> Vite Docs </a>
    |
    <a href="https://v3.vuejs.org/" target="_blank">Vue 3 Docs</a>
  </p>

  <button type="button" @click="plus">
    count is: {{ count }}
  </button>
  <p class="my-2">
    <label for="number_input">
      <input id="number_input" v-model="number" w:p="l-2" w:border="~ gray-100" w:appearance="none" w:outline="focus:none"
        type="number" />
    </label>
    <button w:m="l-2" w:p="x-2" w:bg="green-500" w:text="white" w:rounded="~" @click="add">
      ADD
    </button>
  </p>
  <p>
    Edit
    <code>components/HelloWorld.vue</code> to test hot module replacement.
  </p>
</template>

<script lang="ts">
export default defineComponent({
  name: "HelloWorld",
  props: {
    msg: {
      type: String,
      required: true,
    },
  },
  setup: () => {
    const data = reactive({
      number: 0,
    });
    const count = computed(() => counterStore.count);

    function plus() {
      counterStore.increment();
    }

    function add() {
      counterStore.add(Number(data.number));
    }

    const route = useRoute();


    return { ...toRefs(data), count, plus, add, path: route.path };
  },
});
</script>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}
</style>
