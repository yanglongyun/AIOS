<template>
  <div class="flex flex-1 items-center justify-center bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] font-['Georgia','PingFang_SC',serif]">
    <div class="max-w-[400px] px-6 py-10 text-center">
      <CreateAppHero />
      <CreateAppAction @open-chat="goChat" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import CreateAppHero from '../../../components/apps/createapp/CreateAppHero.vue';
import CreateAppAction from '../../../components/apps/createapp/CreateAppAction.vue';

const router = useRouter();

const goChat = () => {
  router.push('/chat');
};
</script>
