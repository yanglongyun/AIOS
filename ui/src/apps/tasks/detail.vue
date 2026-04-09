<template>
  <div class="flex h-full flex-col bg-[#f8f8f7]">
    <!-- 顶栏 -->
    <div class="flex shrink-0 items-center justify-between border-b border-black/[0.07] bg-white px-5 py-3.5">
      <div class="flex items-center gap-2.5">
        <span class="text-[18px]">{{ appIcon }}</span>
        <span class="text-[15px] font-bold text-[#222]">{{ task.title || '__T_TASKDETAIL_UNNAMED_TASK__' }}</span>
        <span class="rounded-[6px] px-2 py-0.5 text-[11px] font-semibold" :class="statusBadgeClass">
          <span v-if="task.status === 'pending'" class="mr-1 inline-block h-[5px] w-[5px] animate-pulse rounded-full bg-current"></span>{{ statusLabel }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="task.status === 'pending'"
          type="button"
          class="rounded-[8px] border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          :disabled="stopping"
          @click="stopTask"
        >{{ stopping ? '__T_TASKDETAIL_STOPPING__' : '__T_TASKDETAIL_STOP_BUTTON__' }}</button>
        <button
          type="button"
          class="rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-black/50 transition hover:bg-black/[0.04]"
          @click="loadAll"
        >__T_TASKDETAIL_REFRESH_BUTTON__</button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">
      <div class="mx-auto max-w-[860px] space-y-3">

        <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-600">{{ error }}</div>

        <!-- 基本信息 -->
        <div class="flex gap-0 overflow-hidden rounded-[14px] border border-black/[0.07] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div class="flex-1 px-4 py-3">
            <div class="text-[10px] font-semibold uppercase tracking-wide text-black/30">__T_TASKDETAIL_CREATED_AT__</div>
            <div class="mt-1 text-[13px] font-medium text-[#222]">{{ task.created_at || '-' }}</div>
          </div>
          <div class="w-px bg-black/[0.06]"></div>
          <div class="flex-1 px-4 py-3">
            <div class="text-[10px] font-semibold uppercase tracking-wide text-black/30">__T_TASKDETAIL_FINISHED_AT__</div>
            <div class="mt-1 text-[13px] font-medium text-[#222]">{{ task.finished_at || '-' }}</div>
          </div>
          <template v-if="task.app">
            <div class="w-px bg-black/[0.06]"></div>
            <div class="flex-1 px-4 py-3">
              <div class="text-[10px] font-semibold uppercase tracking-wide text-black/30">App</div>
              <div class="mt-1 text-[13px] font-medium text-[#222]">{{ task.app }}</div>
            </div>
          </template>
        </div>

        <!-- 输入 -->
        <div v-if="task.prompt" class="overflow-hidden rounded-[14px] border border-black/[0.07] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div class="border-b border-black/[0.06] bg-black/[0.02] px-4 py-2.5">
            <span class="text-[11px] font-semibold uppercase tracking-wide text-black/40">__T_TASKDETAIL_INPUT_LABEL__</span>
          </div>
          <div class="px-4 py-3.5 text-[13px] leading-relaxed text-[#333] whitespace-pre-wrap">{{ task.prompt }}</div>
        </div>

        <!-- 错误 -->
        <div v-if="task.error" class="overflow-hidden rounded-[14px] border border-red-200 bg-red-50">
          <div class="border-b border-red-100 px-4 py-2.5">
            <span class="text-[11px] font-semibold uppercase tracking-wide text-red-500">__T_TASKDETAIL_ERROR_LABEL__</span>
          </div>
          <div class="px-4 py-3.5 text-[13px] leading-relaxed text-red-700 whitespace-pre-wrap">{{ task.error }}</div>
        </div>

        <!-- 消息列表 -->
        <div class="overflow-hidden rounded-[14px] border border-black/[0.07] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div class="flex items-center justify-between border-b border-black/[0.06] bg-black/[0.02] px-4 py-2.5">
            <span class="text-[11px] font-semibold uppercase tracking-wide text-black/40">__T_TASKDETAIL_MESSAGES_TITLE__</span>
            <span class="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-semibold text-black/40">{{ messages.length }}</span>
          </div>

          <div v-if="messages.length === 0" class="py-10 text-center text-[12px] text-black/35">__T_TASKDETAIL_NO_MESSAGES__</div>

          <div v-else class="divide-y divide-black/[0.05] px-0">
            <div v-for="item in displayMessages" :key="item.id" class="px-4 py-3.5" :class="msgRowClass(item)">
              <!-- 消息头 -->
              <div class="mb-2 flex items-center gap-2">
                <div class="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[5px] text-[10px] font-bold" :class="msgRoleIconClass(item)">
                  {{ msgRoleEmoji(item) }}
                </div>
                <span class="text-[11px] font-semibold text-black/40">{{ roleLabel(item) }}</span>
                <span v-if="msgToolName(item)" class="rounded-[5px] bg-black/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-black/50">{{ msgToolName(item) }}</span>
              </div>

              <!-- 内容 -->
              <div class="pl-[28px]">
                <!-- 文本 -->
                <div v-if="isTextContent(item)" class="text-[13px] leading-relaxed text-[#333] whitespace-pre-wrap break-words">{{ messageText(item) }}</div>
                <!-- 工具调用 -->
                <div v-else-if="isToolCall(item)" class="space-y-1.5">
                  <div v-for="(tc, i) in item.message.tool_calls" :key="i" class="rounded-[8px] border border-black/[0.07] bg-black/[0.02] px-3 py-2">
                    <div class="mb-1 text-[11px] font-semibold text-[#333]">{{ tc.function?.name || 'unknown' }}</div>
                    <div class="break-all font-mono text-[11px] leading-relaxed text-black/45">{{ formatArgs(tc.function?.arguments) }}</div>
                  </div>
                </div>
                <!-- 工具结果 -->
                <div v-else-if="isToolResult(item)" class="max-h-[200px] overflow-y-auto rounded-[8px] bg-black/[0.02] px-3 py-2 font-mono text-[11px] leading-relaxed text-black/45 whitespace-pre-wrap break-words">{{ truncateResult(messageText(item)) }}</div>
                <!-- 兜底 -->
                <div v-else class="text-[13px] leading-relaxed text-[#333] whitespace-pre-wrap break-words">{{ messageText(item) }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { on } from '../../ws.js';
import { appRegistry } from '../../apps.js';

const viewProps = defineProps({ id: { type: [String, Number], default: null } });
const route = useRoute();
const taskId = Number(viewProps.id || route.params.id || 0);
const task = ref({});
const messages = ref([]);
const error = ref('');
const stopping = ref(false);

const appIcon = computed(() => appRegistry.find(a => a.id === task.value.app)?.icon || '✅');
const statusLabel = computed(() => ({ pending: '__T_TASKDETAIL_STATUS_PENDING__', done: '__T_TASKDETAIL_STATUS_DONE__', error: '__T_TASKDETAIL_STATUS_ERROR__', aborted: '__T_TASKDETAIL_STATUS_ABORTED__' }[task.value.status] || task.value.status || '-'));
const statusBadgeClass = computed(() => {
  const s = task.value.status;
  if (s === 'pending') return 'bg-blue-50 text-blue-600 border border-blue-200';
  if (s === 'done') return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
  return 'bg-red-50 text-red-500 border border-red-200';
});
const displayMessages = computed(() => [...messages.value].reverse());

const roleLabel = (item) => {
  const r = item?.message?.role;
  if (r === 'user') return '__T_TASKDETAIL_ROLE_USER__';
  if (r === 'assistant' && isToolCall(item)) return '__T_TASKDETAIL_ROLE_TOOL_CALL__';
  if (r === 'assistant') return 'AI';
  if (r === 'tool') return '__T_TASKDETAIL_ROLE_TOOL_RESULT__';
  return r || 'unknown';
};

const isTextContent = (item) => {
  const msg = item?.message || {};
  return typeof msg.content === 'string' && msg.content.trim() && !Array.isArray(msg.tool_calls);
};
const isToolCall = (item) => Array.isArray(item?.message?.tool_calls) && item.message.tool_calls.length > 0;
const isToolResult = (item) => item?.message?.role === 'tool';

const formatArgs = (args) => {
  if (!args) return '';
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;
    if (parsed.command) return parsed.command;
    return JSON.stringify(parsed, null, 2);
  } catch { return String(args); }
};

const truncateResult = (text) => {
  if (!text || text.length <= 800) return text;
  return text.slice(0, 560) + '\n\n… 省略 ' + (text.length - 800) + ' 字 …\n\n' + text.slice(-240);
};

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

const messageText = (item) => {
  const msg = item?.message || {};
  if (typeof msg.content === 'string' && msg.content.trim()) return msg.content;
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length)
    return msg.tool_calls.map(tc => `${tc?.function?.name || 'unknown'} ${tc?.function?.arguments || '{}'}`).join('\n');
  return JSON.stringify(msg, null, 2);
};
const msgToolName = (item) => {
  const msg = item?.message || {};
  if (msg.name) return msg.name;
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) return msg.tool_calls[0]?.function?.name || '';
  return '';
};
const msgRoleEmoji = (item) => {
  const r = item?.message?.role;
  if (r === 'user') return 'U';
  if (r === 'assistant' && isToolCall(item)) return '⚙';
  if (r === 'assistant') return 'AI';
  if (r === 'tool') return '↩';
  return '?';
};
const msgRowClass = (item) => {
  const r = item?.message?.role;
  if (r === 'tool') return 'bg-emerald-50/40';
  if (isToolCall(item)) return 'bg-black/[0.01]';
  return '';
};
const msgRoleIconClass = (item) => {
  const r = item?.message?.role;
  if (r === 'user') return 'bg-[#222] text-white';
  if (r === 'tool') return 'bg-emerald-500 text-white';
  if (isToolCall(item)) return 'bg-black/[0.08] text-black/50';
  return 'bg-black/[0.08] text-black/50';
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
  } catch (e) { error.value = e.message || '__T_TASKDETAIL_LOAD_FAILED__'; }
};

const stopTask = async () => {
  if (stopping.value || task.value.status !== 'pending') return;
  stopping.value = true;
  error.value = '';
  try {
    await request('/api/task/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId }) });
    await loadAll();
  } catch (e) { error.value = e.message || '__T_TASKDETAIL_STOP_FAILED__'; }
  finally { stopping.value = false; }
};

const unsubs = [];
onMounted(async () => { await loadAll(); unsubs.push(on('tasks_changed', loadAll)); });
onUnmounted(() => { while (unsubs.length) { const off = unsubs.pop(); if (typeof off === 'function') off(); } });
</script>
