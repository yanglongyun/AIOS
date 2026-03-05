<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 class="m-0 text-xl font-bold text-[#4a3a28]">调度任务</h1>
          <p class="mt-0.5 text-xs text-[#a0907a]">管理定时、循环和排队中的任务</p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-[#d4c8b8] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#7a6a58] transition hover:bg-[#f6ecde]"
            @click="load"
          >
            刷新
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-[#c8a060] bg-[#f8f0e0] px-3 py-1.5 text-xs font-semibold text-[#7a5a28] transition hover:bg-[#f0e4c8]"
            @click="$router.push('/tasks/create')"
          >
            + 创建
          </button>
        </div>
      </div>

      <div v-if="error" class="mb-3 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div v-if="schedules.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-8 text-center text-xs text-[#a0907a]">
          暂无调度任务
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
                  @click="toggle(s)"
                >
                  {{ s.enabled ? '启用' : '停用' }}
                </button>
                <button
                  type="button"
                  class="cursor-pointer rounded border border-[#e8c8b8] bg-[#fdf5f0] px-2 py-0.5 text-[10px] text-[#c06040] transition hover:bg-[#f8e8e0]"
                  @click="remove(s.id)"
                >
                  删除
                </button>
              </div>
            </div>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <span class="rounded bg-[#f0e5d5] px-1.5 py-0.5 text-[10px] text-[#7a6a58]">{{ typeLabel(s) }}</span>
              <span v-if="s.cron" class="rounded bg-[#eef0f8] px-1.5 py-0.5 font-mono text-[10px] text-[#5a6a8a]">{{ s.cron }}</span>
              <span v-if="s.run_at" class="text-[10px] text-[#7a6a58]">{{ s.run_at }}</span>
              <span v-if="s.creator && s.creator !== 'user'" class="rounded bg-[#f8f0e0] px-1.5 py-0.5 text-[10px] text-[#9a7a40]">{{ s.creator }}</span>
              <span v-if="s.last_run_at" class="ml-auto text-[10px] text-[#a0907a]">上次：{{ s.last_run_at.slice(0, 16) }}</span>
              <span v-if="s.last_task_id" class="text-[10px] text-[#7a6a58]">
                <button type="button" class="cursor-pointer underline hover:text-[#4a3a28]" @click="$router.push(`/task/${s.last_task_id}`)">
                  #{{ s.last_task_id }}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { on } from '../ws.js';

const schedules = ref([]);
const error = ref('');

const typeLabel = (s) => {
  if (s.cron) return '循环';
  if (s.run_at) return '定时';
  return '排队';
};

const load = async () => {
  error.value = '';
  try {
    const res = await fetch('/api/schedule');
    const data = await res.json().catch(() => []);
    schedules.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e.message || '加载失败';
  }
};

const toggle = async (s) => {
  try {
    await fetch('/api/schedule/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, enabled: s.enabled ? 0 : 1 })
    });
    await load();
  } catch (e) {
    error.value = e.message;
  }
};

const remove = async (id) => {
  try {
    await fetch('/api/schedule/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await load();
  } catch (e) {
    error.value = e.message;
  }
};

const unsubs = [];
onMounted(async () => {
  await load();
  unsubs.push(on('schedules_changed', load));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
