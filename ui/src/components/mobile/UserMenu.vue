<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[9000]" @click="$emit('close')">
      <div
        class="absolute w-[150px] overflow-hidden rounded-[12px] border border-[#e0d0b8] bg-[rgba(255,252,248,0.99)] shadow-[0_8px_24px_rgba(90,62,40,0.18)]"
        :style="style"
        @click.stop
      >
        <div class="border-b border-[#f0e4d0] px-3.5 py-2.5">
          <p class="truncate text-[11px] text-[#9a8870]">{{ username || '...' }}</p>
        </div>
        <button
          class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#3a2a18] transition-colors active:bg-[rgba(200,160,96,0.1)]"
          @click="$emit('restart')"
        >
          <RotateCcw class="h-[14px] w-[14px] text-[#7a6a58]" />
          重启系统
        </button>
        <button
          class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#c04040] transition-colors active:bg-[rgba(200,80,50,0.06)]"
          @click="$emit('logout')"
        >
          <LogOut class="h-[14px] w-[14px]" />
          退出登录
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { LogOut, RotateCcw } from 'lucide-vue-next';

defineProps({
  visible: { type: Boolean, default: false },
  username: { type: String, default: '' },
  style: { type: Object, default: () => ({}) }
});
defineEmits(['close', 'restart', 'logout']);
</script>
