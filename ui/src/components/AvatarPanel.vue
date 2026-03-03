<template>
  <div class="fixed inset-0 z-[90]" @click.self="$emit('close')">
    <div class="absolute right-4 top-12 z-[91] w-56 rounded-lg border border-[#3a2010] bg-[#2e2014] p-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div class="text-[52px] leading-none">{{ avatarEmoji }}</div>
      <div class="mt-2 text-xs tracking-[0.08em] text-[#d4c0a0]">{{ avatarName || 'AIOS' }}</div>
      <div class="mt-3 space-y-2 text-left">
        <label class="flex items-center justify-between rounded border border-white/10 px-2.5 py-1.5 text-xs text-[#d4c0a0]">
          <span>表情</span>
          <input type="checkbox" :checked="enableAvatarEmoji" @change="$emit('toggle-emoji', $event.target.checked)" />
        </label>
        <label class="flex items-center justify-between rounded border border-white/10 px-2.5 py-1.5 text-xs text-[#d4c0a0]">
          <span>发声</span>
          <input type="checkbox" :checked="enableAvatarSound" @change="$emit('toggle-sound', $event.target.checked)" />
        </label>
      </div>
      <div class="mt-2">
        <button type="button" class="cursor-pointer rounded border border-white/10 px-2.5 py-1 text-[11px] text-[#d4c0a0] hover:bg-white/10" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../i18n/index.js';

const { t } = useI18n();

defineProps({
  avatarEmoji: { type: String, default: '🙂' },
  avatarName: { type: String, default: 'AIOS' },
  enableAvatarEmoji: { type: Boolean, default: true },
  enableAvatarSound: { type: Boolean, default: false }
});

defineEmits(['close', 'toggle-emoji', 'toggle-sound']);
</script>
