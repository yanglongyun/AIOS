<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h1 class="m-0 text-xl font-bold text-[#4a3a28]">{{ t('tasks_center') }}</h1>
        <button
          type="button"
          class="cursor-pointer rounded-lg border border-[#d4c8b8] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#7a6a58] transition hover:bg-[#f6ecde]"
          @click="loadAll"
        >
          {{ t('tasks_refresh') }}
        </button>
      </div>

      <div v-if="error" class="mb-3 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div v-if="allTasks.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-8 text-center text-xs text-[#a0907a]">
          {{ t('tasks_empty') }}
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="r in allTasks"
            :key="r.id"
            type="button"
            class="flex w-full cursor-pointer items-start gap-2.5 rounded-lg border border-[#efe4d4] bg-[#fcfaf6] px-3 py-2.5 text-left transition hover:bg-[#f8f1e7]"
            @click="openTask(r.id)"
          >
            <span class="mt-0.5 shrink-0 text-sm" :class="r.status === 'pending' ? 'animate-spin text-[#c8a060]' : r.status === 'done' ? 'text-[#7a9a6a]' : 'text-[#c07060]'">
              {{ r.status === 'pending' ? '◔' : r.status === 'done' ? '✓' : '✗' }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="line-clamp-1 text-[12px] font-semibold leading-relaxed text-[#4a3a28]">{{ r.title || t('tasks_unnamed') }}</div>
              <div class="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#5a4a38]">{{ r.response || r.prompt || '-' }}</div>
              <div class="mt-1 flex items-center gap-2 text-[10px] text-[#8a7860]">
                <span class="rounded bg-[#f0e5d5] px-1.5 py-0.5 text-[#7a6a58]">{{ r.app }}</span>
                <span>{{ r.created_at || '' }}</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '../i18n/index.js';
import { on } from '../ws.js';

const router = useRouter();
const { t } = useI18n();
const tasks = ref([]);
const error = ref('');

const runningTasks = computed(() => tasks.value.filter(t => t.status === 'pending'));
const historyTasks = computed(() => tasks.value.filter(t => t.status !== 'pending'));
const allTasks = computed(() => [...runningTasks.value, ...historyTasks.value]);

const loadTasks = async () => {
  const res = await fetch('/api/task?limit=200');
  const data = await res.json().catch(() => []);
  tasks.value = Array.isArray(data) ? data : [];
};

const loadAll = async () => {
  error.value = '';
  try {
    await loadTasks();
  } catch (e) {
    error.value = e.message || t('tasks_load_fail');
  }
};

const openTask = (id) => { if (id) router.push(`/task/${id}`); };

const unsubs = [];
onMounted(async () => {
  await loadAll();
  unsubs.push(on('tasks_changed', loadTasks));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
