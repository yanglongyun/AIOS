<template>
  <div class="flex h-full flex-col overflow-hidden bg-[#f6f3ee] text-[#241f1a]">
    <div class="border-b border-black/[0.06] bg-white/80 px-5 py-4 backdrop-blur">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="text-[22px] font-semibold">{{ task.title || '__T_TASKDETAIL_UNNAMED_TASK__' }}</div>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-black/55">
            <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium" :class="statusClass(task.status)">
              {{ statusLabel }}
            </span>
            <span v-if="task.app">{{ task.app }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="task.status === 'pending'"
            type="button"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="stopping"
            @click="stopTask"
          >
            {{ stopping ? '__T_TASKDETAIL_STOPPING__' : '__T_TASKDETAIL_STOP_BUTTON__' }}
          </button>
          <button type="button" class="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] font-medium text-[#222] transition hover:bg-black/[0.03]" @click="loadAll">
            __T_TASKDETAIL_REFRESH_BUTTON__
          </button>
        </div>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <div class="mx-auto flex max-w-[960px] flex-col gap-4">
        <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{{ error }}</div>

        <section class="grid gap-3 md:grid-cols-3">
          <div class="rounded-2xl border border-black/[0.06] bg-white px-4 py-4">
            <div class="text-[12px] text-black/45">__T_TASKDETAIL_CREATED_AT__</div>
            <div class="mt-1 text-[14px] font-medium text-[#222]">{{ formatDateTime(task.created_at) }}</div>
          </div>
          <div class="rounded-2xl border border-black/[0.06] bg-white px-4 py-4">
            <div class="text-[12px] text-black/45">__T_TASKDETAIL_FINISHED_AT__</div>
            <div class="mt-1 text-[14px] font-medium text-[#222]">{{ formatDateTime(task.finished_at) }}</div>
          </div>
          <div class="rounded-2xl border border-black/[0.06] bg-white px-4 py-4">
            <div class="text-[12px] text-black/45">__T_TASKDETAIL_APP_LABEL__</div>
            <div class="mt-1 text-[14px] font-medium text-[#222]">{{ task.app || '-' }}</div>
          </div>
        </section>

        <section v-if="task.prompt" class="rounded-2xl border border-black/[0.06] bg-white p-5">
          <div class="text-[13px] font-medium text-black/55">__T_TASKDETAIL_PROMPT_LABEL__</div>
          <div class="mt-3 whitespace-pre-wrap break-words text-[14px] leading-7 text-[#2f2a24]">{{ task.prompt }}</div>
        </section>

        <section v-if="task.error" class="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div class="text-[13px] font-medium text-red-700">__T_TASKDETAIL_ERROR_LABEL__</div>
          <div class="mt-3 whitespace-pre-wrap break-words text-[14px] leading-7 text-red-800">{{ task.error }}</div>
        </section>

        <section class="rounded-2xl border border-black/[0.06] bg-white p-5">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div class="text-[18px] font-semibold text-[#222]">__T_TASKDETAIL_MESSAGES_TITLE__</div>
            <div class="rounded-full bg-black/[0.05] px-3 py-1 text-[12px] font-medium text-black/55">{{ messages.length }}</div>
          </div>

          <div v-if="messages.length === 0" class="rounded-xl border border-dashed border-black/[0.08] bg-[#faf8f4] px-5 py-10 text-center text-[13px] text-black/45">
            __T_TASKDETAIL_NO_MESSAGES__
          </div>

          <div v-else class="space-y-3">
            <div v-for="item in displayMessages" :key="item.id" class="rounded-2xl border border-black/[0.06] bg-[#faf8f4] p-4">
              <div class="mb-3 flex items-center gap-2 text-[12px] text-black/55">
                <span class="inline-flex rounded-full bg-black/[0.06] px-2.5 py-1 font-medium text-[#222]">{{ roleLabel(item) }}</span>
                <span v-if="msgToolName(item)" class="rounded-full bg-black/[0.05] px-2.5 py-1 font-medium">{{ msgToolName(item) }}</span>
              </div>

              <div v-if="isTextContent(item)" class="whitespace-pre-wrap break-words text-[14px] leading-7 text-[#2f2a24]">{{ messageText(item) }}</div>
              <div v-else-if="isToolCall(item)" class="space-y-2">
                <div v-for="(tc, i) in item.message.tool_calls" :key="i" class="rounded-xl border border-black/[0.06] bg-white px-4 py-3">
                  <div class="mb-1 text-[13px] font-medium text-[#222]">{{ tc.function?.name || '__T_TASKDETAIL_TOOL_UNKNOWN__' }}</div>
                  <div class="break-all font-['Courier_New',monospace] text-[12px] leading-6 text-black/65">{{ formatArgs(tc.function?.arguments) }}</div>
                </div>
              </div>
              <div v-else class="whitespace-pre-wrap break-words text-[14px] leading-7 text-[#2f2a24]">{{ renderToolResult(item) }}</div>
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

const statusLabel = computed(() => ({
  pending: '__T_TASKS_STATUS_PENDING__',
  done: '__T_TASKS_STATUS_DONE__',
  error: '__T_TASKS_STATUS_ERROR__',
  aborted: '__T_TASKS_STATUS_ABORTED__'
}[task.value.status] || task.value.status || '-'));

const statusClass = (status) => ({
  'bg-blue-50 text-blue-700': status === 'pending',
  'bg-emerald-50 text-emerald-700': status === 'done',
  'bg-red-50 text-red-700': status === 'error',
  'bg-zinc-100 text-zinc-700': status === 'aborted'
});

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
