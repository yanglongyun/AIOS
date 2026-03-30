<template>
  <div class="flex h-full flex-col items-center justify-center bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] font-['Georgia','PingFang_SC',serif]">
    <div class="w-full max-w-[480px] px-6">
      <CreateAppHero />
      <div class="mt-8 flex gap-2">
        <input
          v-model="prompt"
          class="flex-1 rounded-xl border border-[#d4c0a0] bg-[#fffdf8] px-4 py-2.5 text-sm text-[#4a3a28] placeholder-[#b0a090] outline-none focus:border-[#c8a060]"
          placeholder="__T_CREATEAPP_PLACEHOLDER__"
          @compositionstart="composing = true"
          @compositionend="composing = false"
          @keydown.enter="!composing && create()"
        />
        <button
          class="rounded-xl bg-[#5a3e28] px-5 py-2.5 text-sm text-[#f0e8d8] shadow-[0_2px_8px_rgba(90,62,40,0.3)] transition-opacity hover:opacity-90 disabled:opacity-40"
          :disabled="!prompt.trim()"
          @click="create"
        >
          __T_CREATEAPP_BUTTON__
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CreateAppHero from './CreateAppHero.vue';
import { windowManager } from '../../stores/windowManager.js';
const prompt = ref('');
const composing = ref(false);

const create = () => {
  if (!prompt.value.trim()) return;
  windowManager.open('chat', { pendingMessage: prompt.value.trim() });
  prompt.value = '';
};
</script>
