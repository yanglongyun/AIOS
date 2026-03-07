<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h1 class="m-0 text-xl font-bold text-[#4a3a28]">{{ t('app_sidebar_schedule') }}</h1>
        <div class="flex gap-2">
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-[#d4c8b8] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#7a6a58] transition hover:bg-[#f6ecde]"
            @click="loadSchedules"
          >
            {{ t('tasks_refresh') }}
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-[#c8a060] bg-[#f8f0e0] px-3 py-1.5 text-xs font-semibold text-[#7a5a28] transition hover:bg-[#f0e4c8]"
            @click="router.push('/tasks/create')"
          >
            {{ t('tasks_create') }}
          </button>
        </div>
      </div>

      <div v-if="error" class="mb-3 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div v-if="schedules.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-8 text-center text-xs text-[#a0907a]">
          {{ t('tasks_no_scheduled') }}
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="s in schedules"
            :key="s.id"
            class="rounded-lg border border-[#efe4d4] bg-[#fcfaf6] px-3 py-2.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <div class="text-[12px] font-semibold text-[#4a3a28]">{{ s.name }}</div>
                <div class="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#8a7a68]">{{ s.prompt }}</div>
              </div>
              <div class="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  class="cursor-pointer rounded border px-2 py-0.5 text-[10px] transition"
                  :class="s.enabled
                    ? 'border-[#c8d8c0] bg-[#f0f8ec] text-[#5a8a48] hover:bg-[#e0f0d8]'
                    : 'border-[#e0d8c8] bg-[#f8f4ec] text-[#a09080] hover:bg-[#f0e8d8]'"
                  @click="toggleSchedule(s)"
                >
                  {{ s.enabled ? t('tasks_enabled') : t('tasks_disabled') }}
                </button>
                <button
                  type="button"
                  class="cursor-pointer rounded border border-[#e8c8b8] bg-[#fdf5f0] px-2 py-0.5 text-[10px] text-[#c06040] transition hover:bg-[#f8e8e0]"
                  @click="removeSchedule(s.id)"
                >
                  {{ t('tasks_delete') }}
                </button>
              </div>
            </div>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <span class="rounded bg-[#f0e5d5] px-1.5 py-0.5 text-[10px] text-[#7a6a58]">{{ scheduleTypeLabel(s) }}</span>
              <span v-if="s.cron" class="rounded bg-[#eef0f8] px-1.5 py-0.5 font-mono text-[10px] text-[#5a6a8a]">{{ s.cron }}</span>
              <span v-if="s.run_at" class="text-[10px] text-[#7a6a58]">{{ s.run_at }}</span>
              <span v-if="s.creator && s.creator !== 'user'" class="rounded bg-[#f8f0e0] px-1.5 py-0.5 text-[10px] text-[#9a7a40]">{{ s.creator }}</span>
              <span v-if="s.last_run_at" class="ml-auto text-[10px] text-[#a0907a]">{{ t('tasks_last_run', { time: s.last_run_at.slice(0, 16) }) }}</span>
              <button v-if="s.last_task_id" type="button" class="cursor-pointer text-[10px] text-[#7a6a58] underline hover:text-[#4a3a28]" @click="openTask(s.last_task_id)">
                #{{ s.last_task_id }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '../i18n/index.js';
import { on } from '../ws.js';

const router = useRouter();
const { t } = useI18n();
const schedules = ref([]);
const error = ref('');

const scheduleTypeLabel = (s) => {
  if (s.cron) return t('tasks_type_repeat');
  if (s.run_at) return t('tasks_type_once');
  return t('tasks_type_queue');
};

const loadSchedules = async () => {
  error.value = '';
  try {
    const res = await fetch('/api/schedule');
    const data = await res.json().catch(() => []);
    schedules.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e.message || t('tasks_load_fail');
  }
};

const openTask = (id) => { if (id) router.push(`/task/${id}`); };

const toggleSchedule = async (s) => {
  try {
    await fetch('/api/schedule/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, enabled: s.enabled ? 0 : 1 })
    });
    await loadSchedules();
  } catch (e) {
    error.value = e.message;
  }
};

const removeSchedule = async (id) => {
  try {
    await fetch('/api/schedule/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadSchedules();
  } catch (e) {
    error.value = e.message;
  }
};

const unsubs = [];
onMounted(async () => {
  await loadSchedules();
  unsubs.push(on('schedules_changed', loadSchedules));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
