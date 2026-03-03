<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 class="m-0 text-xl font-bold text-[#4a3a28]">{{ t('tasks_view_all_title') }}</h1>
          <p class="mt-0.5 text-xs text-[#a0907a]">{{ t('tasks_view_all_desc') }}</p>
        </div>
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-[#d4c8b8] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#7a6a58] transition hover:bg-[#f6ecde]"
          @click="loadTasks"
        >
          {{ t('tasks_refresh') }}
        </button>
      </div>

      <div v-if="error" class="mb-3 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div v-if="tasks.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-8 text-center text-xs text-[#a0907a]">
          {{ t('tasks_empty') }}
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="r in tasks"
            :key="r.id"
            type="button"
            class="block w-full cursor-pointer rounded-lg border border-[#efe4d4] bg-[#fcfaf6] px-3 py-2.5 text-left transition hover:bg-[#f8f1e7]"
            @click="openTask(r.id)"
          >
            <div class="flex items-center gap-2">
              <span class="rounded bg-[#f0e5d5] px-1.5 py-0.5 text-[10px] text-[#7a6a58]">{{ r.app }}</span>
              <span :class="statusClass(r.status)" class="text-[10px]">{{ r.status }}</span>
              <span class="ml-auto text-[10px] text-[#8a7860]">{{ r.created_at || '' }}</span>
            </div>
            <div class="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#5a4a38]">{{ r.response || r.prompt || '-' }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '../i18n/index.js';

const { t } = useI18n();
const router = useRouter();
const tasks = ref([]);
const error = ref('');

const statusClass = (status) => {
  if (status === 'done') return 'text-[#4a8a38]';
  if (status === 'error' || status === 'aborted') return 'text-[#b04030]';
  return 'text-[#9a7a30]';
};

const loadTasks = async () => {
  error.value = '';
  try {
    const res = await fetch('/api/task?limit=200');
    const data = await res.json().catch(() => []);
    tasks.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e?.message || '加载失败';
  }
};

const openTask = async (id) => {
  if (!id) return;
  await router.push(`/task/${id}`);
};

onMounted(loadTasks);
</script>
