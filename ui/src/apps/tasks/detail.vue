<template>
  <div class="detail-shell flex h-full flex-col overflow-hidden font-['Georgia','PingFang_SC',serif]">
    <div class="cork-bg absolute inset-0"></div>
    <div class="frame-top shrink-0"></div>

    <div class="relative z-[1] flex min-h-0 flex-1 flex-col">
      <div class="topbar flex shrink-0 items-center justify-between gap-3 px-5 py-3">
        <div class="flex min-w-0 items-center gap-3">
          <div class="badge">{{ appIcon }}</div>
          <div class="min-w-0">
            <div class="truncate text-[15px] font-bold text-[#3a2810]">{{ task.title || '__T_TASKDETAIL_UNNAMED_TASK__' }}</div>
            <div class="mt-0.5 flex items-center gap-2 text-[11px] text-[rgba(58,40,16,0.55)]">
              <span class="status-chip" :class="statusBadgeClass">{{ statusLabel }}</span>
              <span v-if="task.app">{{ task.app }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="task.status === 'pending'"
            type="button"
            class="danger-btn px-3 py-1.5 text-[11px] font-bold"
            :disabled="stopping"
            @click="stopTask"
          >{{ stopping ? '__T_TASKDETAIL_STOPPING__' : '__T_TASKDETAIL_STOP_BUTTON__' }}</button>
          <button type="button" class="wood-btn px-3 py-1.5 text-[11px] font-bold" @click="loadAll">__T_TASKDETAIL_REFRESH_BUTTON__</button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
        <div class="mx-auto flex max-w-[980px] flex-col gap-4 pb-6">
          <div v-if="error" class="warn-card rounded-sm px-4 py-3 text-[12px] text-[#7a2818]">{{ error }}</div>

          <section class="panel rounded-sm p-4">
            <div class="section-kicker">TASK SNAPSHOT</div>
            <div class="mt-3 grid gap-3 md:grid-cols-3">
              <div class="info-card rounded-sm px-4 py-3">
                <div class="text-[10px] font-bold tracking-[0.14em] text-[#8c7755]">__T_TASKDETAIL_CREATED_AT__</div>
                <div class="mt-1 text-[13px] font-semibold text-[#3a2810]">{{ formatDateTime(task.created_at) }}</div>
              </div>
              <div class="info-card rounded-sm px-4 py-3">
                <div class="text-[10px] font-bold tracking-[0.14em] text-[#8c7755]">__T_TASKDETAIL_FINISHED_AT__</div>
                <div class="mt-1 text-[13px] font-semibold text-[#3a2810]">{{ formatDateTime(task.finished_at) }}</div>
              </div>
              <div class="info-card rounded-sm px-4 py-3">
                <div class="text-[10px] font-bold tracking-[0.14em] text-[#8c7755]">App</div>
                <div class="mt-1 text-[13px] font-semibold text-[#3a2810]">{{ task.app || '-' }}</div>
              </div>
            </div>
          </section>

          <section v-if="task.prompt" class="panel rounded-sm p-4">
            <div class="section-kicker">PROMPT</div>
            <div class="note-text mt-3 whitespace-pre-wrap">{{ task.prompt }}</div>
          </section>

          <section v-if="task.error" class="warn-card rounded-sm px-4 py-4">
            <div class="section-kicker text-[#a24834]">ERROR</div>
            <div class="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[#7a2818]">{{ task.error }}</div>
          </section>

          <section class="panel rounded-sm p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div>
                <div class="section-kicker">MESSAGE LOG</div>
                <div class="text-[18px] font-bold text-[#3a2810]">__T_TASKDETAIL_MESSAGES_TITLE__</div>
              </div>
              <div class="rounded-full bg-[rgba(0,0,0,0.08)] px-3 py-1 text-[11px] font-bold text-[#6a5638]">{{ messages.length }}</div>
            </div>

            <div v-if="messages.length === 0" class="empty-panel py-10 text-center text-[12px]">__T_TASKDETAIL_NO_MESSAGES__</div>

            <div v-else class="space-y-2">
              <div v-for="item in displayMessages" :key="item.id" class="message-card rounded-sm px-4 py-3" :class="msgRowClass(item)">
                <div class="mb-2 flex items-center gap-2">
                  <div class="role-badge" :class="msgRoleIconClass(item)">{{ msgRoleEmoji(item) }}</div>
                  <span class="text-[11px] font-bold text-[#7a6546]">{{ roleLabel(item) }}</span>
                  <span v-if="msgToolName(item)" class="mono-chip">{{ msgToolName(item) }}</span>
                </div>

                <div class="pl-[30px]">
                  <div v-if="isTextContent(item)" class="note-text whitespace-pre-wrap break-words">{{ messageText(item) }}</div>
                  <div v-else-if="isToolCall(item)" class="space-y-2">
                    <div v-for="(tc, i) in item.message.tool_calls" :key="i" class="tool-card rounded-sm px-3 py-2">
                      <div class="mb-1 text-[11px] font-bold text-[#3a2810]">{{ tc.function?.name || 'unknown' }}</div>
                      <div class="font-['Courier_New',monospace] text-[11px] leading-relaxed text-[#6d5b3f] break-all">{{ formatArgs(tc.function?.arguments) }}</div>
                    </div>
                  </div>
                  <div v-else-if="isToolResult(item)" class="tool-card max-h-[220px] overflow-y-auto whitespace-pre-wrap break-words rounded-sm px-3 py-2 font-['Courier_New',monospace] text-[11px] leading-relaxed text-[#6d5b3f] scrollbar-hide">
                    {{ truncateResult(messageText(item)) }}
                  </div>
                  <div v-else class="note-text whitespace-pre-wrap break-words">{{ messageText(item) }}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <div class="frame-bottom shrink-0"></div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { on } from '../../system/ws.js';
import { getApp } from '../../apps.js';
import { formatDateTime } from './timeline.js';

const viewProps = defineProps({ id: { type: [String, Number], default: null } });
const route = useRoute();
const taskId = Number(viewProps.id || route.params.id || 0);
const task = ref({});
const messages = ref([]);
const error = ref('');
const stopping = ref(false);

const appIcon = computed(() => getApp(task.value.app)?.icon || '✅');
const statusLabel = computed(() => ({
  pending: '__T_TASKDETAIL_STATUS_PENDING__',
  done: '__T_TASKDETAIL_STATUS_DONE__',
  error: '__T_TASKDETAIL_STATUS_ERROR__',
  aborted: '__T_TASKDETAIL_STATUS_ABORTED__'
}[task.value.status] || task.value.status || '-'));

const statusBadgeClass = computed(() => ({
  'status-pending': task.value.status === 'pending',
  'status-done': task.value.status === 'done',
  'status-error': task.value.status !== 'pending' && task.value.status !== 'done'
}));

const displayMessages = computed(() => [...messages.value].reverse());

const roleLabel = (item) => {
  const role = item?.message?.role;
  if (role === 'user') return '__T_TASKDETAIL_ROLE_USER__';
  if (role === 'assistant' && isToolCall(item)) return '__T_TASKDETAIL_ROLE_TOOL_CALL__';
  if (role === 'assistant') return 'AI';
  if (role === 'tool') return '__T_TASKDETAIL_ROLE_TOOL_RESULT__';
  return role || 'unknown';
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
  } catch {
    return String(args);
  }
};

const truncateResult = (text) => {
  if (!text || text.length <= 800) return text;
  return `${text.slice(0, 560)}\n\n… 省略 ${text.length - 800} 字 …\n\n${text.slice(-240)}`;
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
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
    return msg.tool_calls.map((tc) => `${tc?.function?.name || 'unknown'} ${tc?.function?.arguments || '{}'}`).join('\n');
  }
  return JSON.stringify(msg, null, 2);
};

const msgToolName = (item) => {
  const msg = item?.message || {};
  if (msg.name) return msg.name;
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) return msg.tool_calls[0]?.function?.name || '';
  return '';
};

const msgRoleEmoji = (item) => {
  const role = item?.message?.role;
  if (role === 'user') return 'U';
  if (role === 'assistant' && isToolCall(item)) return '⚙';
  if (role === 'assistant') return 'AI';
  if (role === 'tool') return '↩';
  return '?';
};

const msgRowClass = (item) => ({
  'message-tool': item?.message?.role === 'tool',
  'message-call': isToolCall(item)
});

const msgRoleIconClass = (item) => {
  const role = item?.message?.role;
  if (role === 'user') return 'role-user';
  if (role === 'tool') return 'role-tool';
  if (isToolCall(item)) return 'role-call';
  return 'role-ai';
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

<style scoped>
.detail-shell {
  position: relative;
  background: linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
}
.cork-bg {
  background:
    repeating-conic-gradient(rgba(160, 120, 70, 0.03) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px,
    repeating-linear-gradient(175deg, rgba(180, 140, 80, 0.02) 0px, transparent 1px, transparent 4px),
    repeating-linear-gradient(85deg, rgba(120, 80, 40, 0.02) 0px, transparent 1px, transparent 6px),
    linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.3);
}
.frame-top { height: 7px; background: linear-gradient(180deg, #4a3420, #3a2414); box-shadow: 0 3px 6px rgba(0, 0, 0, 0.35); }
.frame-bottom { height: 7px; background: linear-gradient(0deg, #4a3420, #3a2414); box-shadow: 0 -3px 6px rgba(0, 0, 0, 0.35); }
.topbar {
  background: linear-gradient(180deg, rgba(60, 42, 24, 0.58), rgba(50, 35, 20, 0.3));
  border-bottom: 1px solid rgba(0, 0, 0, 0.16);
}
.badge {
  display: flex;
  height: 36px;
  width: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 2px solid #6a4a18;
  background: radial-gradient(circle at 42% 38%, #c8a060, #8a6a30);
  box-shadow: inset 0 2px 3px rgba(255, 220, 150, 0.3), 0 2px 4px rgba(0, 0, 0, 0.4);
}
.panel {
  background: linear-gradient(180deg, rgba(249, 240, 220, 0.96), rgba(238, 227, 202, 0.95));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18), inset 0 0 24px rgba(200, 180, 140, 0.12);
}
.section-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(122, 98, 58, 0.72);
}
.info-card,
.message-card,
.tool-card {
  background: rgba(255, 248, 232, 0.58);
  border: 1px solid rgba(120, 90, 50, 0.12);
}
.note-text {
  font-size: 13px;
  line-height: 1.7;
  color: #5c492e;
}
.status-chip,
.mono-chip {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
}
.status-pending { background: rgba(70, 100, 180, 0.14); color: #3d4f8f; }
.status-done { background: rgba(90, 140, 90, 0.14); color: #406030; }
.status-error { background: rgba(180, 70, 60, 0.14); color: #8a3628; }
.mono-chip {
  background: rgba(0, 0, 0, 0.05);
  color: #7a6546;
  font-family: 'Courier New', monospace;
}
.role-badge {
  display: flex;
  height: 22px;
  width: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}
.role-user { background: #3a2810; color: #fff4da; }
.role-tool { background: #3f7b55; color: #fff; }
.role-call { background: rgba(0, 0, 0, 0.08); color: #5a4b30; }
.role-ai { background: rgba(0, 0, 0, 0.08); color: #5a4b30; }
.message-tool { background: rgba(230, 245, 232, 0.62); }
.message-call { background: rgba(255, 248, 232, 0.82); }
.warn-card {
  border: 1px solid rgba(170, 70, 54, 0.18);
  background: rgba(255, 235, 220, 0.78);
}
.danger-btn,
.wood-btn {
  border-radius: 6px;
  cursor: pointer;
}
.wood-btn {
  border: 1px solid #3a2810;
  color: rgba(255, 220, 150, 0.65);
  background: linear-gradient(180deg, #6a5838, #4a3820);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25);
}
.danger-btn {
  border: 1px solid #8a3628;
  color: #ffe2d0;
  background: linear-gradient(180deg, #b24e38, #8c3626);
  box-shadow: 0 2px 0 rgba(80, 18, 8, 0.35);
}
.empty-panel {
  color: rgba(104, 83, 52, 0.7);
  border: 1px dashed rgba(120, 90, 50, 0.18);
  background: rgba(255, 248, 232, 0.45);
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>
