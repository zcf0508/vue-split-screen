<script setup lang="ts">
import HelloWorld from "@/components/HelloWorld.vue";

const router = useRouter()
async function go() {
  try{
    await router.push(`/some/${Math.random() * 100}`)
  }catch(e) {
    console.log(e)
  }
}

async function replace() {
  try{
    await router.replace(`/some/${Math.random() * 100}`)
  }catch(e) {
    console.log(e)
  }
}
</script>

<template>
  <div class="text-center">
    <HelloWorld msg="Hello World"></HelloWorld>
    <button @click="go" class="mr-8px">
      Go somewhere.
    </button>
    <button @click="replace">
      replace somewhere.
    </button>
  </div>
</template>

<style scoped>

</style>
