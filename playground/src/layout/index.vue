<template>
  <div class="w-full bg-blue-600 flex justify-center">
    <div class="container flex h-[60px] flex items-center justify-between px-[20px]">
      <div class="text-2xl font-bold text-light-50">
        {{ title }}
      </div>
      <div>
        <button 
          class="border-none px-4 py-2 rounded-md bg-light-50 text-blue-600 cursor-pointer"
          @click="retunOn = !retunOn"
        >
          {{ retunOn ? "turn off" : "turn on" }}
        </button>
      </div>
    </div>
  </div>
  <router-view v-slot="{ Component }">
    <SplitScreen :turn-on="retunOn">
      <component :is="Component" />
      <template #placeholder>
        <!-- placehoder template -->
        <div class="h-full flex flex-col items-center justify-center">
          <img src="@/assets/logo.png" alt="vue">
          <div>This is a SplitScreen placeholder.</div>
        </div>
      </template>
    </SplitScreen>
  </router-view>
  <div class="fixed bottom-0 w-full h-[60px] bg-white flex items-center">
    <div 
      class="flex-1 flex flex-col justify-center items-center" 
      @click="$router.push('/home')"
    >
      <i 
        class="i-material-symbols:home-outline-rounded text-2xl text-gray-600"
        :class="{'text-blue-600!':$route.path === '/home'}"
      ></i>
      <span class="text-[10px]" :class="{'text-blue-600':$route.path === '/home'}">Home</span>
    </div>
    <div 
      class="flex-1 flex flex-col justify-center items-center"
      @click="$router.push('/me')"
    >
      <i 
        class="i-material-symbols:person-2-outline-rounded text-2xl text-gray-600"
        :class="{'text-blue-600!':$route.path === '/me'}"
      ></i>
      <span class="text-[10px]" :class="{'text-blue-600':$route.path === '/me'}">Me</span>
    </div>
  </div>
</template>

<script lang="ts">
import { SplitScreen } from "vue-split-screen"
export default defineComponent({
  name: "Layout",
  components: {
    SplitScreen,
  },
  setup() {
    const retunOn = ref(false)

    const route = useRoute()

    const title = computed(()=>{
      return route.meta.title || "SplitScreen"
    })


    return {
      retunOn,
      title,
    }
  },
});
</script>

<style>
</style>
