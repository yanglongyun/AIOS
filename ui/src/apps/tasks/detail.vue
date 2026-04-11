<template>
  <div class="flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#f7f4ed_0%,#ece5d7_48%,#ddd2bf_100%)] text-[#241f1a]">
    <div class="border-b border-[#bba98d] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(235,227,211,0.96))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_28px_rgba(81,60,31,0.08)] backdrop-blur">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#77684f]">Task Inspector</div>
          <div class="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#2a2218]">{{ task.title || '__T_TASKDETAIL_UNNAMED_TASK__' }}</div>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#6f624d]">
            <span class="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]" :class="statusClass(task.status)">
              {{ statusLabel }}
            </span>
            <span v-if="task.app" class="inline-flex rounded-full border border-[#cbbda7] bg-white/60 px-2.5 py-1 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              {{ task.app }}
            </span>
            <span class="inline-flex rounded-full border border-[#d7ccb9] bg-[#f7f0e4] px-2.5 py-1 font-medium text-[#7a6c53]">
              #{{ taskId || '-' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="task.status === 'pending'"
            type="button"
            class="rounded-xl border border-[#d4b2ab] bg-[linear-gradient(180deg,#fff8f8,#f4dbd8)] px-3.5 py-2 text-[13px] font-medium text-[#8c5f59] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition hover:bg-[linear-gradient(180deg,#fffdfd,#eed1cc)] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="stopping"
            @click="stopTask"
          >
            {{ stopping ? '__T_TASKDETAIL_STOPPING__' : '__T_TASKDETAIL_STOP_BUTTON__' }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-[#b7a78e] bg-[linear-gradient(180deg,#fffdfa,#ebe1cf)] px-3.5 py-2 text-[13px] font-medium text-[#32291f] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_6px_rgba(71,55,28,0.08)] transition hover:bg-[linear-gradient(180deg,#ffffff,#e6dbc6)]"
            @click="loadAll"
          >
            __T_TASKDETAIL_REFRESH_BUTTON__
          </button>
        </div>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <div class="mx-auto grid max-w-[1180px] gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside class="space-y-4">
          <div v-if="error" class="rounded-2xl border border-red-300 bg-[linear-gradient(180deg,#fff7f7,#fde6e6)] px-4 py-3 text-[13px] text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            {{ error }}
          </div>

          <section class="rounded-[28px] border border-[#b8a88f] bg-[linear-gradient(180deg,#fdfbf6,#ece1d0)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_14px_30px_rgba(77,58,30,0.08)]">
            <div class="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b6b53]">Overview</div>
            <div class="space-y-3">
              <div v-for="fact in facts" :key="fact.key" class="rounded-2xl border border-[#d0c1ab] bg-white/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#80715a]">{{ fact.label }}</div>
                <div class="mt-1 break-words text-[14px] font-medium text-[#281f14]">{{ fact.value }}</div>
              </div>
            </div>
          </section>

          <section v-if="task.prompt" class="rounded-[28px] border border-[#b7a78e] bg-[linear-gradient(180deg,#fcfaf5,#ece1cf)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_14px_30px_rgba(77,58,30,0.07)]">
            <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b6b53]">__T_TASKDETAIL_PROMPT_LABEL__</div>
            <div class="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-[#d4c7b4] bg-white/60 px-4 py-4 text-[14px] leading-7 text-[#2f2a24] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              {{ task.prompt }}
            </div>
          </section>

          <section v-if="task.error" class="rounded-[28px] border border-[#d5b4ae] bg-[linear-gradient(180deg,#fff8f8,#f4dfdc)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_14px_30px_rgba(119,66,59,0.08)]">
            <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#966760]">__T_TASKDETAIL_ERROR_LABEL__</div>
            <div class="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-[#e1c2bc] bg-white/55 px-4 py-4 text-[14px] leading-7 text-[#8a4e49] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              {{ task.error }}
            </div>
          </section>
        </aside>

        <section class="min-h-0 rounded-[30px] border border-[#b8a88f] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(238,230,215,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_36px_rgba(77,58,30,0.08)]">
          <div class="mb-4 flex items-center justify-between gap-3 border-b border-[#d5c8b4] pb-4">
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b6b53]">Activity</div>
              <div class="mt-1 text-[20px] font-semibold text-[#281f14]">__T_TASKDETAIL_MESSAGES_TITLE__</div>
            </div>
            <div class="rounded-full border border-[#cec0aa] bg-white/65 px-3 py-1 text-[12px] font-semibold text-[#6a5c46] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              {{ messages.length }}
            </div>
          </div>

          <div v-if="messages.length === 0" class="rounded-[24px] border border-dashed border-[#bbae98] bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(241,232,218,0.65))] px-5 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <div class="text-[12px] font-semibold uppercase tracking-[0.26em] text-[#84755d]">Log</div>
            <div class="mt-3 text-[13px] text-[#6f614d]">__T_TASKDETAIL_NO_MESSAGES__</div>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="item in displayMessages"
              :key="item.id"
              class="rounded-[24px] border border-[#d3c6b3] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,236,224,0.94))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]"
            >
              <div class="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-[#776a55]">
                <span class="inline-flex rounded-full border border-[#cfc2ad] bg-white/70 px-2.5 py-1 font-semibold uppercase tracking-[0.12em] text-[#3b3227]">
                  {{ roleLabel(item) }}
                </span>
                <span v-if="msgToolName(item)" class="inline-flex rounded-full border border-[#d4c9b8] bg-[#f6efe2] px-2.5 py-1 font-medium text-[#6f624d]">
                  {{ msgToolName(item) }}
                </span>
              </div>

              <div v-if="isTextContent(item)" class="whitespace-pre-wrap break-words rounded-2xl border border-[#ddd2c2] bg-white/55 px-4 py-4 text-[14px] leading-7 text-[#2f2a24]">
                {{ messageText(item) }}
              </div>
              <div v-else-if="isToolCall(item)" class="space-y-2">
                <div v-for="(tc, i) in item.message.tool_calls" :key="i" class="rounded-2xl border border-[#d8ccb9] bg-[linear-gradient(180deg,#fffdfa,#f0e5d4)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  <div class="mb-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#75674f]">{{ tc.function?.name || '__T_TASKDETAIL_TOOL_UNKNOWN__' }}</div>
                  <div class="break-all font-['Courier_New',monospace] text-[12px] leading-6 text-[#524736]">{{ formatArgs(tc.function?.arguments) }}</div>
                </div>
              </div>
              <div v-else class="whitespace-pre-wrap break-words rounded-2xl border border-[#ddd2c2] bg-white/55 px-4 py-4 text-[14px] leading-7 text-[#2f2a24]">
                {{ renderToolResult(item) }}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { on } from '../../system/ws.js';
import { formatDateTime } from './timeline.js';

const viewProps = defineProps({ id: { type: [String, Number], default: null } });
const route = useRoute();
const taskId = Number(viewProps.id || route.params.id || 0);
const task = ref({});
const messages = ref([]);
const error = ref('');
const stopping = ref(false);

const displayMessages = computed(() => [...messages.value].reverse());
const facts = computed(() => [
  { key: 'created', label: '__T_TASKDETAIL_CREATED_AT__', value: formatDateTime(task.value.created_at) },
  { key: 'finished', label: '__T_TASKDETAIL_FINISHED_AT__', value: formatDateTime(task.value.finished_at) },
  { key: 'app', label: '__T_TASKDETAIL_APP_LABEL__', value: task.value.app || '-' },
  { key: 'mode', label: '__T_TASKS_COLUMN_MODE__', value: taskModeLabel(task.value.mode) },
  { key: 'status', label: '__T_TASKS_COLUMN_STATUS__', value: statusLabel.value }
]);

const statusLabel = computed(() => ({
  pending: '__T_TASKS_STATUS_PENDING__',
  done: '__T_TASKS_STATUS_DONE__',
  error: '__T_TASKS_STATUS_ERROR__',
  aborted: '__T_TASKS_STATUS_ABORTED__'
}[task.value.status] || task.value.status || '-'));

const statusClass = (status) => ({
  'border-[#b9c8d7] bg-[#eef5fb] text-[#58718b]': status === 'pending',
  'border-[#b9cab9] bg-[#edf4eb] text-[#556f54]': status === 'done',
  'border-[#d5b7b0] bg-[#fbefec] text-[#8c605c]': status === 'error',
  'border-[#c8c0b5] bg-[#f0ede8] text-[#6d6559]': status === 'aborted'
});

const taskModeLabel = (mode) => {
  if (mode === 'instant') return '__T_TASKS_MODE_LABEL_INSTANT__';
  if (mode === 'agent') return '__T_TASKS_MODE_LABEL_AGENT__';
  return mode || '-';
};

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
};

const loadAll = async () => {
  error.value = '';
  try {
    const [td, tm] = await Promise.all([
      request(`/api/task/detail?id=${taskId}`),
      request(`/api/task/messages?id=${taskId}`)
    ]);
    task.value = td.task || {};
    messages.value = Array.isArray(tm.messages) ? tm.messages : [];
  } catch (e) {
    error.value = e.message || '__T_TASKDETAIL_LOAD_FAILED__';
  }
};

const stopTask = async () => {
  if (stopping.value || task.value.status !== 'pending') return;
  stopping.value = true;
  error.value = '';
  try {
    await request('/api/task/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId })
    });
    await loadAll();
  } catch (e) {
    error.value = e.message || '__T_TASKDETAIL_STOP_FAILED__';
  } finally {
    stopping.value = false;
  }
};

const isTextContent = (item) => {
  const msg = item?.message || {};
  return typeof msg.content === 'string' && msg.content.trim() && !Array.isArray(msg.tool_calls);
};

const isToolCall = (item) => Array.isArray(item?.message?.tool_calls) && item.message.tool_calls.length > 0;

const roleLabel = (item) => {
  const role = item?.message?.role;
  if (role === 'user') return '__T_TASKDETAIL_ROLE_USER__';
  if (role === 'assistant' && isToolCall(item)) return '__T_TASKDETAIL_ROLE_TOOL_CALL__';
  if (role === 'assistant') return '__T_TASKDETAIL_ROLE_AI__';
  if (role === 'tool') return '__T_TASKDETAIL_ROLE_TOOL_RESULT__';
  return '__T_TASKDETAIL_ROLE_UNKNOWN__';
};

const messageText = (item) => {
  const msg = item?.message || {};
  if (typeof msg.content === 'string' && msg.content.trim()) return msg.content;
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
    return msg.tool_calls.map((tc) => `${tc?.function?.name || '__T_TASKDETAIL_TOOL_UNKNOWN__'} ${tc?.function?.arguments || '{}'}`).join('\n');
  }
  return JSON.stringify(msg, null, 2);
};

const msgToolName = (item) => {
  const msg = item?.message || {};
  if (msg.name) return msg.name;
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) return msg.tool_calls[0]?.function?.name || '';
  return '';
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

const renderToolResult = (item) => {
  const text = messageText(item);
  if (!text || text.length <= 800) return text;
  return `${text.slice(0, 560)}\n\n__T_TASKDETAIL_TRUNCATED_RESULT__`.replace('{count}', String(text.length - 800)) + `\n\n${text.slice(-240)}`;
};

const unsubs = [];
onMounted(async () => {
  await loadAll();
  unsubs.push(on('tasks_changed', loadAll));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
