<template>
  <div class="flex flex-1 items-center justify-center bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] font-['Georgia','PingFang_SC',serif]">
    <div class="max-w-[400px] px-6 py-10 text-center">
      <div class="mb-5 text-5xl">🚀</div>
      <h1 class="mb-3 text-[22px] font-bold text-[#5a4a38]">创建新应用</h1>
      <p class="mb-7 text-sm leading-6 text-[#a0907a]">在对话中描述你想要的应用，AI 会帮你构建。</p>
      <button @click="goChat" class="rounded-xl bg-[#5a3e28] px-7 py-2.5 text-sm text-[#f0e8d8] shadow-[0_2px_8px_rgba(90,62,40,0.3)] transition-opacity hover:opacity-90">开始创建</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goChat = () => {
  router.push({ path: '/chat', query: { new: String(Date.now()) } });
};
</script>
