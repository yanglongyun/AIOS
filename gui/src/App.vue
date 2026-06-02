<template>
  <div v-if="!ready" class="h-[100dvh] w-screen bg-bg-elev"></div>
  <RouterView v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';

const ready = ref(false);
const router = useRouter();

onMounted(async () => {
  await router.isReady();
  ready.value = true;
});
</script>
