<script setup lang="ts">
const route = useRoute()
const id = computed(() => {
  return route.params.id
})

const router = useRouter()
async function go() {
  try{
    await router.push(`/some/${Math.random() * 100}`)
  }catch(e) {
    console.log(e)
  }
}
</script>

<template>
  <div class="h-screen flex flex-col items-center justify-center">
    <div class="mb-8">
      This is a test page. The id is {{ id }}.
    </div>

    <button @click="go">
      Go somewhere.
    </button>
  </div>
</template>



<style scoped>

</style>
