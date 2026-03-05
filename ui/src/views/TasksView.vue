<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h1 class="m-0 text-xl font-bold text-[#4a3a28]">任务中心</h1>
        <div class="flex gap-2">
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-[#d4c8b8] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#7a6a58] transition hover:bg-[#f6ecde]"
            @click="loadAll"
          >
            刷新
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-[#c8a060] bg-[#f8f0e0] px-3 py-1.5 text-xs font-semibold text-[#7a5a28] transition hover:bg-[#f0e4c8]"
            @click="router.push('/tasks/create')"
          >
            + 创建
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-4 flex gap-1 rounded-lg bg-[#efe4d4] p-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs transition"
          :class="activeTab === tab.key
            ? 'bg-[#fffdf8] font-semibold text-[#4a3a28] shadow-sm'
            : 'text-[#8a7a68] hover:text-[#5a4a38]'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="ml-1 text-[10px] opacity-60">{{ tab.count }}</span>
        </button>
      </div>

      <div v-if="error" class="mb-3 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <!-- 未来任务 -->
      <div v-if="activeTab === 'scheduled'" class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div v-if="schedules.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-8 text-center text-xs text-[#a0907a]">
          暂无未来任务
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
                  {{ s.enabled ? '启用' : '停用' }}
                </button>
                <button
                  type="button"
                  class="cursor-pointer rounded border border-[#e8c8b8] bg-[#fdf5f0] px-2 py-0.5 text-[10px] text-[#c06040] transition hover:bg-[#f8e8e0]"
                  @click="removeSchedule(s.id)"
                >
                  删除
                </button>
              </div>
            </div>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <span class="rounded bg-[#f0e5d5] px-1.5 py-0.5 text-[10px] text-[#7a6a58]">{{ scheduleTypeLabel(s) }}</span>
              <span v-if="s.cron" class="rounded bg-[#eef0f8] px-1.5 py-0.5 font-mono text-[10px] text-[#5a6a8a]">{{ s.cron }}</span>
              <span v-if="s.run_at" class="text-[10px] text-[#7a6a58]">{{ s.run_at }}</span>
              <span v-if="s.creator && s.creator !== 'user'" class="rounded bg-[#f8f0e0] px-1.5 py-0.5 text-[10px] text-[#9a7a40]">{{ s.creator }}</span>
              <span v-if="s.last_run_at" class="ml-auto text-[10px] text-[#a0907a]">上次：{{ s.last_run_at.slice(0, 16) }}</span>
              <button v-if="s.last_task_id" type="button" class="cursor-pointer text-[10px] text-[#7a6a58] underline hover:text-[#4a3a28]" @click="openTask(s.last_task_id)">
                #{{ s.last_task_id }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 进行中 -->
      <div v-if="activeTab === 'running'" class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div v-if="runningTasks.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-8 text-center text-xs text-[#a0907a]">
          暂无进行中的任务
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="r in runningTasks"
            :key="r.id"
            type="button"
            class="flex w-full cursor-pointer items-start gap-2.5 rounded-lg border border-[#efe4d4] bg-[#fcfaf6] px-3 py-2.5 text-left transition hover:bg-[#f8f1e7]"
            @click="openTask(r.id)"
          >
            <span class="mt-0.5 shrink-0 animate-spin text-sm text-[#c8a060]">◔</span>
            <div class="min-w-0 flex-1">
              <div class="line-clamp-1 text-[12px] font-semibold leading-relaxed text-[#4a3a28]">{{ r.title || '未命名任务' }}</div>
              <div class="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#5a4a38]">{{ r.prompt || '-' }}</div>
              <div class="mt-1 flex items-center gap-2 text-[10px] text-[#8a7860]">
                <span class="rounded bg-[#f0e5d5] px-1.5 py-0.5 text-[#7a6a58]">{{ r.app }}</span>
                <span>{{ r.created_at || '' }}</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- 历史任务 -->
      <div v-if="activeTab === 'history'" class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div v-if="historyTasks.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-8 text-center text-xs text-[#a0907a]">
          暂无历史任务
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="r in historyTasks"
            :key="r.id"
            type="button"
            class="flex w-full cursor-pointer items-start gap-2.5 rounded-lg border border-[#efe4d4] bg-[#fcfaf6] px-3 py-2.5 text-left transition hover:bg-[#f8f1e7]"
            @click="openTask(r.id)"
          >
            <span class="mt-0.5 shrink-0 text-sm" :class="r.status === 'done' ? 'text-[#7a9a6a]' : 'text-[#c07060]'">
              {{ r.status === 'done' ? '✓' : '✗' }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="line-clamp-1 text-[12px] font-semibold leading-relaxed text-[#4a3a28]">{{ r.title || '未命名任务' }}</div>
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
import { on } from '../ws.js';

const router = useRouter();
const tasks = ref([]);
const schedules = ref([]);
const error = ref('');
const activeTab = ref('scheduled');

const runningTasks = computed(() => tasks.value.filter(t => t.status === 'pending'));
const historyTasks = computed(() => tasks.value.filter(t => t.status !== 'pending'));

const tabs = computed(() => [
  { key: 'scheduled', label: '未来任务', count: schedules.value.length },
  { key: 'running', label: '进行中', count: runningTasks.value.length },
  { key: 'history', label: '历史任务', count: historyTasks.value.length }
]);

const scheduleTypeLabel = (s) => {
  if (s.cron) return '循环';
  if (s.run_at) return '定时';
  return '排队';
};

const loadTasks = async () => {
  const res = await fetch('/api/task?limit=200');
  const data = await res.json().catch(() => []);
  tasks.value = Array.isArray(data) ? data : [];
};

const loadSchedules = async () => {
  const res = await fetch('/api/schedule');
  const data = await res.json().catch(() => []);
  schedules.value = Array.isArray(data) ? data : [];
};

const loadAll = async () => {
  error.value = '';
  try {
    await Promise.all([loadTasks(), loadSchedules()]);
  } catch (e) {
    error.value = e.message || '加载失败';
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
  await loadAll();
  unsubs.push(on('tasks_changed', loadTasks));
  unsubs.push(on('schedules_changed', loadSchedules));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
