<template>
  <div class="fixed inset-0 z-[90]" @click.self="$emit('close')">
    <div class="absolute right-4 top-12 z-[91] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-[#3a2010] bg-[#2e2014] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div class="flex items-center justify-between border-b border-[#4a3828] px-4 py-2.5">
        <span class="text-sm font-bold text-[#e8d0a8]">{{ t('tasks_title') }}</span>
        <span class="text-[10px] text-[#8a7860]">{{ t('tasks_recent') }}</span>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-if="tasks.length === 0" class="px-4 py-8 text-center text-xs text-[#6a5840]">{{ t('tasks_empty') }}</div>
        <button
          v-for="r in tasks"
          :key="r.id"
          type="button"
          class="block w-full cursor-pointer border-b border-[#3a2818] px-4 py-2.5 text-left transition-colors hover:bg-[#3a2a1c] last:border-b-0"
          @click="openTask(r.id)"
        >
          <div class="flex items-center gap-2">
            <span class="rounded bg-[#4a3828] px-1.5 py-0.5 text-[10px] text-[#c8a060]">{{ r.app }}</span>
            <span :class="r.status === 'done' ? 'text-[#7a9a6a]' : r.status === 'error' ? 'text-[#c07060]' : 'text-[#c8a060]'" class="text-[10px]">{{ r.status }}</span>
            <span class="ml-auto text-[10px] text-[#6a5840]">{{ formatTime(r.created_at) }}</span>
          </div>
          <div class="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#b8a080]">{{ r.response || r.prompt?.slice(0, 80) }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useI18n } from '../i18n/index.js';

const router = useRouter();
const { t } = useI18n();
defineProps({
  tasks: { type: Array, default: () => [] }
});

const emit = defineEmits(['close']);

const openTask = async (id) => {
  if (!id) return;
  emit('close');
  await router.push(`/task/${id}`);
};

const formatTime = (t) => {
  if (!t) return '';
  return String(t).slice(11, 16);
};
</script>
