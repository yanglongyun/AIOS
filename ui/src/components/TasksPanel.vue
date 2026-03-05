<template>
  <div class="fixed inset-0 z-[90]" @click.self="$emit('close')">
    <div class="absolute right-4 top-12 z-[91] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-[#3a2010] bg-[#2e2014] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div class="flex items-center justify-between border-b border-[#4a3828] px-4 py-2.5">
        <span class="text-sm font-bold text-[#e8d0a8]">{{ t('tasks_title') }}</span>
        <button
          type="button"
          class="cursor-pointer rounded bg-[#4a3828] px-2 py-1 text-[10px] text-[#c8a060] transition-colors hover:bg-[#5a4838]"
          @click="createTask"
        >
          {{ t('tasks_create') }}
        </button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-if="previewTasks.length === 0" class="px-4 py-8 text-center text-xs text-[#6a5840]">{{ t('tasks_empty') }}</div>
        <button
          v-for="r in previewTasks"
          :key="r.id"
          type="button"
          class="flex w-full cursor-pointer items-start gap-2.5 border-b border-[#3a2818] px-4 py-2.5 text-left transition-colors hover:bg-[#3a2a1c] last:border-b-0"
          @click="openTask(r.id)"
        >
          <span class="mt-0.5 shrink-0 text-sm" :class="r.status === 'done' ? 'text-[#7a9a6a]' : r.status === 'error' || r.status === 'aborted' ? 'text-[#c07060]' : 'animate-spin text-[#c8a060]'">
            {{ r.status === 'done' ? '✓' : r.status === 'error' || r.status === 'aborted' ? '✗' : '◔' }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="line-clamp-1 text-[11px] font-semibold leading-relaxed text-[#d8c8a8]">{{ r.title || t('tasks_unnamed') }}</div>
            <div class="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#b8a080]">{{ r.response || r.prompt?.slice(0, 80) }}</div>
            <div class="mt-1 text-[10px] text-[#6a5840]">{{ formatTime(r.created_at) }}</div>
          </div>
        </button>
      </div>
      <button
        type="button"
        class="block w-full cursor-pointer border-t border-[#4a3828] px-4 py-2.5 text-center text-[11px] text-[#8a7860] transition-colors hover:bg-[#3a2a1c] hover:text-[#c8a060]"
        @click="openAllTasks"
      >
        {{ t('tasks_view_all') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '../i18n/index.js';

const router = useRouter();
const { t } = useI18n();
const props = defineProps({
  tasks: { type: Array, default: () => [] }
});

const emit = defineEmits(['close']);
const previewTasks = computed(() => (Array.isArray(props.tasks) ? props.tasks.slice(0, 5) : []));

const openTask = async (id) => {
  if (!id) return;
  emit('close');
  await router.push(`/task/${id}`);
};

const openAllTasks = async () => {
  emit('close');
  await router.push('/tasks');
};

const createTask = async () => {
  emit('close');
  await router.push('/tasks/create');
};

const formatTime = (t) => {
  if (!t) return '';
  return String(t).slice(11, 16);
};
</script>
