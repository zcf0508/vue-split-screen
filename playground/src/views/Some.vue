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

async function replace() {
  try{
    await router.replace(`/some/${Math.random() * 100}`)
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

    <div>
      <button @click="go" class="mr-8px">
        Go somewhere.
      </button>
  
      <button @click="replace">
        replace somewhere.
      </button>
    </div>
  </div>
</template>



<style scoped>

</style>
