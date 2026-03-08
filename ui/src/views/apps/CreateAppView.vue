<template>
  <div class="flex flex-1 items-center justify-center bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] font-['Georgia','PingFang_SC',serif]">
    <div class="max-w-[400px] px-6 py-10 text-center">
      <div class="mb-5 text-5xl">🚀</div>
      <h1 class="mb-3 text-[22px] font-bold text-[#5a4a38]">{{ t('createapp_title') }}</h1>
      <p class="mb-7 text-sm leading-6 text-[#a0907a]">{{ t('createapp_description') }}</p>
      <button @click="goChat" class="rounded-xl bg-[#5a3e28] px-7 py-2.5 text-sm text-[#f0e8d8] shadow-[0_2px_8px_rgba(90,62,40,0.3)] transition-opacity hover:opacity-90">{{ t('createapp_start_button') }}</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useI18n } from '../../i18n/index.js';

const router = useRouter();
const { t } = useI18n();

const goChat = () => {
  router.push('/chat');
};
</script>
