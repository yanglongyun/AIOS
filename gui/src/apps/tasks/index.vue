<template>
  <div class="flex h-full flex-col overflow-hidden bg-[#f5f5f5] text-[#1a1a1a] font-['Inter',-apple-system,'PingFang_SC',sans-serif]">

    <!-- ═══ LIST VIEW ═══ -->
    <template v-if="!detailTask">
      <!-- Toolbar -->
      <div class="flex shrink-0 items-center gap-0.5 border-b border-[#e8e8e8] bg-[#fafafa] px-2.5 py-1.5">
        <button
          v-for="f in filters" :key="f.key"
          class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all"
          :class="activeFilter === f.key
            ? 'bg-[#3478f6] text-white'
            : 'text-[#666] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]'"
          @click="activeFilter = f.key"
        >
          {{ f.label }}
          <span
            class="ml-0.5 inline-block rounded-full px-1 text-[9px] font-semibold align-[1px]"
            :class="activeFilter === f.key ? 'bg-white/25 text-white' : 'bg-black/[0.05] text-[#999]'"
          >{{ f.count }}</span>
        </button>
        <span class="flex-1" />
        <button
          class="flex h-[26px] w-[26px] items-center justify-center rounded-md text-[#666] transition hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
          @click="loadTasks"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 8a5.5 5.5 0 019.5-3.7M13.5 8a5.5 5.5 0 01-9.5 3.7" stroke-linecap="round"/><path d="M12 1.5v3h-3M4 15.5v-3h3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <!-- Column header -->
      <div class="grid shrink-0 grid-cols-[1fr_64px_70px_80px] gap-1 border-b border-[#e8e8e8] bg-[#fafafa] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-[#999]">
        <span>__T_TASKS_COLUMN_TITLE__</span>
        <span>__T_TASKS_COLUMN_MODE__</span>
        <span>__T_TASKS_COLUMN_STATUS__</span>
        <span>__T_TASKS_COLUMN_TIME__</span>
      </div>

      <!-- Error -->
      <div v-if="error" class="mx-3 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{{ error }}</div>

      <!-- Rows -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="filteredTasks.length === 0" class="flex h-full flex-col items-center justify-center text-[#999]">
          <div class="mb-1.5 text-[28px] opacity-35">📭</div>
          <div class="text-[12px]">__T_TASKS_EMPTY__</div>
        </div>

        <button
          v-for="task in filteredTasks" :key="task.id"
          class="grid w-full grid-cols-[1fr_64px_70px_80px] items-center gap-1 border-b border-[#f2f2f2] px-3 py-[7px] text-left transition-colors hover:bg-[#f8f9ff] active:bg-[#f0f3ff]"
          @click="openDetail(task)"
        >
          <div class="flex items-center gap-[7px] min-w-0">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="dotClass(task.status)" />
            <div class="min-w-0">
              <div class="truncate text-[12px] font-semibold text-[#1a1a1a]">{{ task.title || '__T_TASKS_UNNAMED__' }}</div>
              <div class="mt-px text-[9px] text-[#999]">#{{ task.id }} · {{ task.app || '-' }}</div>
            </div>
          </div>
          <div class="text-[10px] text-[#666]">{{ modeLabel(task.mode) }}</div>
          <div>
            <span class="inline-block rounded px-1.5 py-px text-[9px] font-semibold" :class="tagClass(task.status)">{{ statusLabel(task.status) }}</span>
          </div>
          <div class="text-[10px] tabular-nums text-[#999]">{{ formatCompactDateTime(task.finished_at || task.created_at) }}</div>
        </button>
      </div>
    </template>

    <!-- ═══ DETAIL VIEW ═══ -->
    <template v-else>
      <!-- Detail toolbar -->
      <div class="flex shrink-0 items-center gap-1.5 border-b border-[#e8e8e8] bg-[#fafafa] px-2.5 py-1.5">
        <button
          class="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#3478f6] transition hover:bg-[#eef4ff]"
          @click="closeDetail"
        >
          <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 3L5 8l5 5"/></svg>
          __T_TASKDETAIL_BACK__
        </button>
        <div class="flex-1 truncate text-[11px] font-semibold text-[#1a1a1a]">{{ detailTask.title || '__T_TASKS_UNNAMED__' }}</div>
        <button
          v-if="detailTask.status === 'pending'"
          class="rounded-md bg-[#fef0ef] px-2 py-1 text-[10px] font-semibold text-[#ea4335] transition hover:bg-[#fde2e0]"
          :disabled="stopping"
          @click="stopTask"
        >
          {{ stopping ? '__T_TASKDETAIL_STOPPING__' : '__T_TASKDETAIL_STOP_BUTTON__' }}
        </button>
        <button
          class="flex h-[26px] w-[26px] items-center justify-center rounded-md text-[#666] transition hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
          @click="loadDetail"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 8a5.5 5.5 0 019.5-3.7M13.5 8a5.5 5.5 0 01-9.5 3.7" stroke-linecap="round"/><path d="M12 1.5v3h-3M4 15.5v-3h3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <!-- Detail error -->
      <div v-if="detailError" class="mx-3 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{{ detailError }}</div>

      <!-- Detail content -->
      <div class="min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
        <!-- Facts -->
        <div class="grid grid-cols-4 gap-1.5 mb-2.5">
          <div v-for="fact in detailFacts" :key="fact.key" class="rounded-md bg-[#f8f8f8] border border-[#e8e8e8] px-2 py-1.5">
            <div class="text-[9px] uppercase tracking-[0.04em] text-[#999]">{{ fact.label }}</div>
            <div class="mt-0.5 text-[11px] font-semibold text-[#1a1a1a]">{{ fact.value }}</div>
          </div>
        </div>

        <!-- Prompt -->
        <template v-if="detailTask.prompt">
          <div class="mb-1 text-[9px] font-semibold uppercase tracking-[0.05em] text-[#999]">__T_TASKDETAIL_PROMPT_LABEL__</div>
          <div class="mb-2.5 whitespace-pre-wrap break-words rounded-md border border-[#e8e8e8] bg-[#f8f8f8] px-2.5 py-2 text-[11px] leading-[1.6] text-[#1a1a1a]">{{ detailTask.prompt }}</div>
        </template>

        <!-- Error -->
        <template v-if="detailTask.error">
          <div class="mb-1 text-[9px] font-semibold uppercase tracking-[0.05em] text-[#999]">__T_TASKDETAIL_ERROR_LABEL__</div>
          <div class="mb-2.5 whitespace-pre-wrap break-words rounded-md border border-[#fcc] bg-[#fef0ef] px-2.5 py-2 text-[11px] leading-[1.6] text-[#ea4335]">{{ detailTask.error }}</div>
        </template>

        <!-- Messages -->
        <div class="mb-1 text-[9px] font-semibold uppercase tracking-[0.05em] text-[#999]">
          __T_TASKDETAIL_MESSAGES_TITLE__ · {{ messages.length }}
        </div>

        <div v-if="messages.length === 0" class="rounded-md border border-dashed border-[#e0e0e0] bg-[#fafafa] py-10 text-center text-[12px] text-[#999]">
          __T_TASKDETAIL_NO_MESSAGES__
        </div>

        <div v-else class="space-y-1">
          <div
            v-for="item in displayMessages" :key="item.id"
            class="rounded-md border border-[#e8e8e8] bg-[#f8f8f8] px-2.5 py-[7px]"
          >
            <div class="mb-1 flex items-center gap-1.5">
              <span class="rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.03em]" :class="roleClass(item)">
                {{ roleLabel(item) }}
              </span>
              <span v-if="msgToolName(item)" class="text-[9px] text-[#999]">{{ msgToolName(item) }}</span>
            </div>

            <template v-if="isToolCall(item)">
              <div
                v-for="(tc, i) in item.message.tool_calls" :key="i"
                class="break-all rounded bg-[#f0f0f0] px-2 py-1.5 font-mono text-[10px] leading-[1.6] text-[#666]"
              >{{ formatArgs(tc.function?.arguments) }}</div>
            </template>
            <div v-else class="whitespace-pre-wrap break-words text-[11px] leading-[1.6] text-[#1a1a1a]">
              {{ renderContent(item) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { on } from '../../system/ws.js';

const tasks = ref([]);
const error = ref('');
const activeFilter = ref('all');
const detailTask = ref(null);
const messages = ref([]);
const detailError = ref('');
const stopping = ref(false);

const parseSqlDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = value instanceof Date ? value : parseSqlDate(value);
  if (!date) return '-';
  return date.toLocaleString();
};

const formatCompactDateTime = (value) => {
  const date = value instanceof Date ? value : parseSqlDate(value);
  if (!date) return '-';
  return date.toLocaleString([], {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/* ── filters ── */
const countBy = (s) => {
  if (s === 'error') return tasks.value.filter((t) => t.status === 'error' || t.status === 'aborted').length;
  return tasks.value.filter((t) => t.status === s).length;
};

const filters = computed(() => [
  { key: 'all', label: '__T_TASKS_TAB_ALL__', count: tasks.value.length },
  { key: 'pending', label: '__T_TASKS_STATUS_PENDING__', count: countBy('pending') },
  { key: 'done', label: '__T_TASKS_STATUS_DONE__', count: countBy('done') },
  { key: 'error', label: '__T_TASKS_STATUS_ERROR__', count: countBy('error') }
]);

const filteredTasks = computed(() => {
  if (activeFilter.value === 'all') return tasks.value;
  if (activeFilter.value === 'error') return tasks.value.filter((t) => t.status === 'error' || t.status === 'aborted');
  return tasks.value.filter((t) => t.status === activeFilter.value);
});

/* ── status helpers ── */
const modeLabel = (mode) => {
  if (mode === 'instant') return '__T_TASKS_MODE_LABEL_INSTANT__';
  if (mode === 'agent') return '__T_TASKS_MODE_LABEL_AGENT__';
  return mode || '-';
};

const statusLabel = (status) => ({
  pending: '__T_TASKS_STATUS_PENDING__',
  done: '__T_TASKS_STATUS_DONE__',
  error: '__T_TASKS_STATUS_ERROR__',
  aborted: '__T_TASKS_STATUS_ABORTED__'
}[status] || status || '-');

const dotClass = (status) => ({
  'bg-[#3478f6]': status === 'pending',
  'bg-[#34a853]': status === 'done',
  'bg-[#ea4335]': status === 'error',
  'bg-[#aaa]': status === 'aborted'
});

const tagClass = (status) => ({
  'bg-[#eef4ff] text-[#3478f6]': status === 'pending',
  'bg-[#eef8f0] text-[#34a853]': status === 'done',
  'bg-[#fef0ef] text-[#ea4335]': status === 'error',
  'bg-[#f0f0f0] text-[#aaa]': status === 'aborted'
});

/* ── API ── */
const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

const loadTasks = async () => {
  error.value = '';
  try {
    const data = await request('/api/task?limit=200');
    tasks.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e.message || '__T_TASKS_LOAD_FAIL__';
  }
};

/* ── detail ── */
const openDetail = async (task) => {
  detailTask.value = task;
  messages.value = [];
  detailError.value = '';
  stopping.value = false;
  await loadDetail();
};

const loadDetail = async () => {
  if (!detailTask.value) return;
  detailError.value = '';
  try {
    const [td, tm] = await Promise.all([
      request(`/api/task/detail?id=${detailTask.value.id}`),
      request(`/api/task/messages?id=${detailTask.value.id}`)
    ]);
    detailTask.value = td.task || detailTask.value;
    messages.value = Array.isArray(tm.messages) ? tm.messages : [];
  } catch (e) {
    detailError.value = e.message || '__T_TASKDETAIL_LOAD_FAILED__';
  }
};

const closeDetail = () => {
  detailTask.value = null;
  messages.value = [];
};

const stopTask = async () => {
  if (stopping.value || !detailTask.value || detailTask.value.status !== 'pending') return;
  stopping.value = true;
  detailError.value = '';
  try {
    await request('/api/task/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: detailTask.value.id })
    });
    await loadDetail();
  } catch (e) {
    detailError.value = e.message || '__T_TASKDETAIL_STOP_FAILED__';
  } finally {
    stopping.value = false;
  }
};

/* ── detail computed ── */
const detailFacts = computed(() => {
  if (!detailTask.value) return [];
  return [
    { key: 'created', label: '__T_TASKDETAIL_CREATED_AT__', value: formatDateTime(detailTask.value.created_at) },
    { key: 'finished', label: '__T_TASKDETAIL_FINISHED_AT__', value: formatDateTime(detailTask.value.finished_at) },
    { key: 'app', label: '__T_TASKDETAIL_APP_LABEL__', value: detailTask.value.app || '-' },
    { key: 'mode', label: '__T_TASKS_COLUMN_MODE__', value: modeLabel(detailTask.value.mode) }
  ];
});

const displayMessages = computed(() => [...messages.value].reverse());

/* ── message helpers ── */
const isToolCall = (item) => Array.isArray(item?.message?.tool_calls) && item.message.tool_calls.length > 0;

const roleLabel = (item) => {
  const role = item?.message?.role;
  if (role === 'user') return '__T_TASKDETAIL_ROLE_USER__';
  if (role === 'assistant' && isToolCall(item)) return '__T_TASKDETAIL_ROLE_TOOL_CALL__';
  if (role === 'assistant') return '__T_TASKDETAIL_ROLE_AI__';
  if (role === 'tool') return '__T_TASKDETAIL_ROLE_TOOL_RESULT__';
  return '__T_TASKDETAIL_ROLE_UNKNOWN__';
};

const roleClass = (item) => {
  const role = item?.message?.role;
  if (role === 'user') return 'bg-[#fef3c7] text-[#92400e]';
  if (role === 'assistant' && isToolCall(item)) return 'bg-[#f3f0ff] text-[#7c3aed]';
  if (role === 'assistant') return 'bg-[#eef4ff] text-[#3478f6]';
  return 'bg-[#f0f0f0] text-[#666]';
};

const msgToolName = (item) => {
  const msg = item?.message || {};
  if (msg.name) return msg.name;
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) return msg.tool_calls[0]?.function?.name || '';
  return '';
};

const renderContent = (item) => {
  const msg = item?.message || {};
  if (typeof msg.content === 'string' && msg.content.trim()) {
    const text = msg.content;
    if (text.length <= 800) return text;
    return `${text.slice(0, 560)}\n\n__T_TASKDETAIL_TRUNCATED_RESULT__`.replace('{count}', String(text.length - 800)) + `\n\n${text.slice(-240)}`;
  }
  return JSON.stringify(msg, null, 2);
};

const formatArgs = (args) => {
  if (!args) return '';
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;
    if (parsed.command) return parsed.command;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(args);
  }
};

/* ── lifecycle ── */
const unsubs = [];
onMounted(async () => {
  await loadTasks();
  unsubs.push(on('tasks_changed', () => {
    loadTasks();
    if (detailTask.value) loadDetail();
  }));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
