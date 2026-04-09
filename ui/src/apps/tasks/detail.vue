<template>
  <div class="h-full overflow-y-auto bg-white p-6">
    <div class="mx-auto max-w-[960px]">

      <!-- Hero card -->
      <div class="mb-4 rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-[48px] h-[48px] shrink-0 rounded-[14px] flex items-center justify-center text-[24px]" style="background:linear-gradient(145deg,#d0e8f8,#a0c8e8);box-shadow:0 2px 6px rgba(0,0,0,0.1)">
            {{ appIcon }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-lg font-bold text-[#222] mb-2 leading-snug">{{ task.title || '__T_TASKDETAIL_UNNAMED_TASK__' }}</div>
            <div class="flex gap-1.5 flex-wrap">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[7px] text-[10.5px] font-semibold" :class="statusBadgeClass">
                <span v-if="task.status === 'pending'" class="w-[5px] h-[5px] rounded-full bg-current animate-pulse"></span>
                {{ statusLabel }}
              </span>
              <span v-if="task.app" class="px-2 py-0.5 rounded-[7px] text-[10.5px] font-semibold bg-black/[0.05] text-black/50 border border-black/[0.08]">{{ task.app }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="task.status === 'pending'"
              type="button"
              class="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="stopping"
              @click="stopTask"
            >
              {{ stopping ? '__T_TASKDETAIL_STOPPING__' : '__T_TASKDETAIL_STOP_BUTTON__' }}
            </button>
            <button type="button" class="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-black/50 transition hover:bg-black/[0.04]" @click="loadAll">__T_TASKDETAIL_REFRESH_BUTTON__</button>
          </div>
        </div>
        <div class="flex pt-3 text-xs border-t border-black/[0.06]">
          <div class="flex-1">
            <div class="text-[10px] text-black/35 uppercase tracking-[0.8px]">__T_TASKDETAIL_CREATED_AT__</div>
            <div class="text-[13px] text-[#222] font-semibold mt-0.5">{{ task.created_at || '-' }}</div>
          </div>
          <div class="flex-1 border-l border-black/[0.06] pl-3">
            <div class="text-[10px] text-black/35 uppercase tracking-[0.8px]">__T_TASKDETAIL_FINISHED_AT__</div>
            <div class="text-[13px] text-[#222] font-semibold mt-0.5">{{ task.finished_at || '-' }}</div>
          </div>
        </div>
      </div>

      <div v-if="error" class="mb-4 rounded-xl border border-dashed border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{{ error }}</div>

      <!-- 输入 -->
      <div v-if="task.prompt" class="mb-4 rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div class="flex items-center gap-1.5 px-4 py-2.5 border-b border-black/[0.06] bg-black/[0.02]">
          <span class="text-[13px]">📥</span>
          <span class="text-[11.5px] font-bold uppercase tracking-[0.8px] text-black/50">__T_TASKDETAIL_INPUT_LABEL__</span>
        </div>
        <div class="px-4 py-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[#333]">{{ task.prompt }}</div>
      </div>

      <!-- 错误 -->
      <div v-if="task.error" class="mb-4 rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
        <div class="flex items-center gap-1.5 px-4 py-2.5 border-b border-red-100">
          <span class="text-[13px]">⚠️</span>
          <span class="text-[11.5px] font-bold uppercase tracking-[0.8px] text-red-600">__T_TASKDETAIL_ERROR_LABEL__</span>
        </div>
        <div class="px-4 py-3 whitespace-pre-wrap text-[13px] leading-relaxed text-red-700">{{ task.error }}</div>
      </div>

      <!-- 消息列表 -->
      <div class="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div class="flex items-center gap-1.5 px-4 py-2.5 border-b border-black/[0.06] bg-black/[0.02]">
          <span class="text-[13px]">💬</span>
          <span class="text-[11.5px] font-bold uppercase tracking-[0.8px] text-black/50">__T_TASKDETAIL_MESSAGES_TITLE__ ({{ messages.length }})</span>
        </div>
        <div v-if="messages.length === 0" class="py-8 text-center text-xs text-black/35">__T_TASKDETAIL_NO_MESSAGES__</div>
        <div v-else class="p-3 space-y-2">
          <div v-for="item in displayMessages" :key="item.id" class="rounded-xl overflow-hidden" :style="msgCardStyle(item)">
            <div class="flex items-center gap-1.5 px-3 py-2 border-b border-black/[0.05]">
              <div class="w-[20px] h-[20px] rounded-[6px] flex items-center justify-center text-[11px] shrink-0" :style="msgRoleIconStyle(item)">{{ msgRoleEmoji(item) }}</div>
              <span class="text-[11px] font-bold flex-1 text-black/50">{{ roleLabel(item) }}</span>
              <span v-if="msgToolName(item)" class="text-[10px] px-1.5 py-0.5 rounded-[5px] text-emerald-600 bg-emerald-50 font-mono">{{ msgToolName(item) }}</span>
            </div>
            <div class="px-3 py-2.5">
              <!-- assistant 文本回复 -->
              <div v-if="isTextContent(item)" class="text-[13px] text-[#333] leading-relaxed whitespace-pre-wrap break-words">{{ messageText(item) }}</div>
              <!-- 工具调用 -->
              <div v-else-if="isToolCall(item)" class="flex flex-col gap-1.5">
                <div v-for="(tc, i) in item.message.tool_calls" :key="i" class="rounded-lg px-3 py-2 bg-blue-50/50 border border-blue-100">
                  <div class="text-[11px] font-bold text-blue-700 mb-1">🔧 {{ tc.function?.name || 'unknown' }}</div>
                  <div class="text-[11px] text-black/50 leading-relaxed break-all font-mono">{{ formatArgs(tc.function?.arguments) }}</div>
                </div>
              </div>
              <!-- 工具结果 -->
              <div v-else-if="isToolResult(item)" class="text-[11px] text-black/50 leading-relaxed whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto font-mono">{{ truncateResult(messageText(item)) }}</div>
              <!-- 兜底 -->
              <div v-else class="text-[13px] text-[#333] leading-relaxed whitespace-pre-wrap break-words">{{ messageText(item) }}</div>
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
  if (s === 'pending') return 'bg-[rgba(80,150,220,0.12)] text-[#3870c0] border border-[rgba(80,150,220,0.2)]';
  if (s === 'done') return 'bg-[rgba(72,168,88,0.12)] text-[#389848] border border-[rgba(72,168,88,0.2)]';
  return 'bg-[rgba(180,60,40,0.1)] text-[#b03828] border border-[rgba(180,60,40,0.18)]';
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
  if (r === 'user') return '👤';
  if (r === 'assistant' && isToolCall(item)) return '🔧';
  if (r === 'assistant') return '🤖';
  if (r === 'tool') return '📋';
  return '?';
};
const msgCardStyle = (item) => {
  const r = item?.message?.role;
  if (r === 'user') return 'background:#fafafa;border:1px solid rgba(0,0,0,0.06)';
  if (r === 'tool') return 'background:#f0faf0;border:1px solid rgba(0,0,0,0.06)';
  if (isToolCall(item)) return 'background:#f0f4fa;border:1px solid rgba(0,0,0,0.06)';
  return 'background:#fafafa;border:1px solid rgba(0,0,0,0.06)';
};
const msgRoleIconStyle = (item) => {
  const r = item?.message?.role;
  if (r === 'user') return 'background:#222;color:#fff';
  if (r === 'tool') return 'background:#22c55e;color:#fff';
  if (isToolCall(item)) return 'background:#3b82f6;color:#fff';
  return 'background:#6366f1;color:#fff';
};

const loadAll = async () => {
  error.value = '';
  try {
    const [td, tm] = await Promise.all([
      request(`/aios/api/task/detail?id=${taskId}`),
      request(`/aios/api/task/messages?id=${taskId}`)
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
    await request('/aios/api/task/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId }) });
    await loadAll();
  } catch (e) { error.value = e.message || '__T_TASKDETAIL_STOP_FAILED__'; }
  finally { stopping.value = false; }
};

const unsubs = [];
onMounted(async () => { await loadAll(); unsubs.push(on('tasks_changed', loadAll)); });
onUnmounted(() => { while (unsubs.length) { const off = unsubs.pop(); if (typeof off === 'function') off(); } });
</script>
