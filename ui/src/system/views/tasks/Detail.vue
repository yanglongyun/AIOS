<template>
  <div class="h-full overflow-y-auto [scrollbar-width:none]" :style="contentBg">

    <!-- Hero card -->
    <div class="mx-3 mt-3 mb-3 rounded-[18px] p-4" :style="cardStyle">
      <div class="mb-3 flex items-start gap-3">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-2xl" :style="iconBgStyle">
          {{ appIcon }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-2 text-[16px] font-bold leading-snug text-[#3a2415]">{{ task.name || '未命名任务' }}</div>
          <div class="flex flex-wrap gap-1.5">
            <span class="inline-flex items-center gap-1 rounded-[7px] px-2 py-0.5 text-[10.5px] font-semibold" :style="statusBadgeStyle">
              <span v-if="task.status === 'pending'" class="h-[5px] w-[5px] animate-pulse rounded-full bg-current"></span>
              {{ statusLabel }}
            </span>
            <span class="rounded-[7px] border border-[rgba(120,90,40,0.15)] bg-[rgba(120,90,40,0.08)] px-2 py-0.5 text-[10.5px] font-semibold text-[#7a5a30]">task</span>
          </div>
        </div>
      </div>
      <div class="flex border-t border-[rgba(120,90,40,0.1)] pt-3">
        <div class="flex-1">
          <div class="font-sans text-[10px] uppercase tracking-[0.8px] text-[#b09870]">开始</div>
          <div class="mt-0.5 font-sans text-[13px] font-semibold text-[#4a3020]">{{ task.created_at ? task.created_at.slice(11,16) : '-' }}</div>
        </div>
        <div class="flex-1 border-l border-[rgba(120,90,40,0.1)] pl-3">
          <div class="font-sans text-[10px] uppercase tracking-[0.8px] text-[#b09870]">模式</div>
          <div class="mt-0.5 font-sans text-[13px] font-semibold text-[#4a3020]">{{ task.mode || 'auto' }}</div>
        </div>
        <div class="flex-1 border-l border-[rgba(120,90,40,0.1)] pl-3">
          <div class="font-sans text-[10px] uppercase tracking-[0.8px] text-[#b09870]">结束</div>
          <div class="mt-0.5 font-sans text-[13px] font-semibold text-[#4a3020]">{{ task.finished_at ? task.finished_at.slice(11,16) : '-' }}</div>
        </div>
      </div>
    </div>

    <!-- Stop button -->
    <div v-if="task.status === 'pending' || task.status === 'running'" class="mx-3 mb-3">
      <button
        class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-none text-[14px] font-bold"
        :style="stopBtnStyle"
        :disabled="stopping"
        @click="stopTask"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
        {{ stopping ? '停止中…' : '停止任务' }}
      </button>
    </div>

    <!-- Error banner -->
    <div v-if="loadError" class="mx-3 mb-3 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-[12px] text-[#c06040]">{{ loadError }}</div>

    <!-- 输入 -->
    <div v-if="taskInputText" class="mx-3 mb-3 rounded-[16px] overflow-hidden" :style="sectionCardStyle">
      <div class="flex items-center gap-1.5 px-3.5 py-2.5" :style="sectionHeadStyle">
        <span class="text-[13px]">📥</span>
        <span class="font-sans text-[11.5px] font-bold uppercase tracking-[0.8px] text-[#8a6840]">输入</span>
      </div>
      <div class="mx-3 mb-3 mt-2 px-3 py-2.5 rounded-[10px] text-[12.5px] text-[#4a3018] leading-relaxed whitespace-pre-wrap break-words" :style="textBlockStyle">{{ taskInputText }}</div>
    </div>

    <!-- 输出 -->
    <div v-if="task.response" class="mx-3 mb-3 rounded-[16px] overflow-hidden" :style="sectionCardStyle">
      <div class="flex items-center gap-1.5 px-3.5 py-2.5" :style="sectionHeadStyle">
        <span class="text-[13px]">📤</span>
        <span class="font-sans text-[11.5px] font-bold uppercase tracking-[0.8px] text-[#8a6840]">输出</span>
      </div>
      <div class="mx-3 mb-3 mt-2 px-3 py-2.5 rounded-[10px] text-[12.5px] text-[#4a3018] leading-relaxed whitespace-pre-wrap break-words" :style="textBlockStyle">{{ task.response }}</div>
    </div>

    <!-- 错误 -->
    <div v-if="task.error" class="mx-3 mb-3 rounded-[16px] overflow-hidden" :style="sectionCardStyle">
      <div class="flex items-center gap-1.5 px-3.5 py-2.5" :style="sectionHeadStyle">
        <span class="text-[13px]">⚠️</span>
        <span class="font-sans text-[11.5px] font-bold uppercase tracking-[0.8px] text-[#8a6840]">错误</span>
      </div>
      <div class="mx-3 mb-3 mt-2 px-3 py-2.5 rounded-[10px] text-[12.5px] leading-relaxed whitespace-pre-wrap break-words" :style="[textBlockStyle,{color:'#9a3a2a'}]">{{ task.error }}</div>
    </div>

    <!-- 消息列表 -->
    <div v-if="messages.length" class="mx-3 mb-4 rounded-[16px] overflow-hidden" :style="sectionCardStyle">
      <div class="flex items-center gap-1.5 px-3.5 py-2.5" :style="sectionHeadStyle">
        <span class="text-[13px]">💬</span>
        <span class="font-sans text-[11.5px] font-bold uppercase tracking-[0.8px] text-[#8a6840]">过程 ({{ messages.length }})</span>
      </div>
      <div class="flex flex-col gap-2 px-3 pb-3 pt-1">
        <div v-for="item in displayMessages" :key="item.id" class="overflow-hidden rounded-[10px]" :style="msgCardStyle(item)">
          <div class="flex items-center gap-1.5 border-b border-[rgba(120,90,40,0.08)] px-2.5 py-1.5">
            <div class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] text-[10px]" :style="msgRoleIconStyle(item)">{{ msgRoleEmoji(item) }}</div>
            <span class="flex-1 font-sans text-[10.5px] font-bold text-[#7a6040]">{{ roleLabel(item) }}</span>
            <span v-if="msgToolName(item)" class="rounded-[5px] bg-[rgba(80,140,80,0.08)] px-1.5 py-0.5 font-mono text-[10px] text-[#5a7a50]">{{ msgToolName(item) }}</span>
          </div>
          <div class="px-2.5 py-2">
            <!-- assistant 文本回复 -->
            <div v-if="isTextContent(item)" class="text-[12px] text-[#4a3820] leading-relaxed whitespace-pre-wrap break-words">{{ messageText(item) }}</div>
            <!-- 工具调用 -->
            <div v-else-if="isToolCall(item)" class="flex flex-col gap-1.5">
              <div v-for="(tc, i) in item.message.tool_calls" :key="i" class="rounded-lg border border-[rgba(80,120,180,0.1)] bg-[rgba(80,120,180,0.06)] px-2.5 py-2">
                <div class="mb-1 font-sans text-[11px] font-bold text-[#3a6090]">🔧 {{ tc.function?.name || 'unknown' }}</div>
                <div class="break-all font-mono text-[10.5px] leading-relaxed text-[#5a6a78]">{{ formatArgs(tc.function?.arguments) }}</div>
              </div>
            </div>
            <!-- 工具结果 -->
            <div v-else-if="isToolResult(item)" class="max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[#5a6a48]">{{ truncateResult(messageText(item)) }}</div>
            <!-- 兜底 -->
            <div v-else class="text-[11.5px] text-[#4a3820] leading-relaxed whitespace-pre-wrap break-words">{{ messageText(item) }}</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apps as appRegistry } from '../../../apps.js';

const props = defineProps({ id: { type: [String, Number], required: true } });
const taskId = computed(() => Number(props.id));

const task = ref({});
const messages = ref([]);
const loadError = ref('');
const stopping = ref(false);

const appIcon = computed(() => appRegistry.find(a => a.id === task.value.app)?.icon || '✅');
const statusLabel = computed(() => ({ pending: '进行中', running: '运行中', done: '已完成', completed: '已完成', error: '出错', aborted: '已中止', stopped: '已停止' }[task.value.status] || task.value.status || '-'));
const statusBadgeStyle = computed(() => {
  const s = task.value.status;
  if (s === 'pending' || s === 'running') return 'background:rgba(80,150,220,0.12);color:#3870c0;border:1px solid rgba(80,150,220,0.2)';
  if (s === 'done' || s === 'completed') return 'background:rgba(72,168,88,0.12);color:#389848;border:1px solid rgba(72,168,88,0.2)';
  return 'background:rgba(180,60,40,0.1);color:#b03828;border:1px solid rgba(180,60,40,0.18)';
});
const displayMessages = computed(() => [...messages.value].reverse());

// Extract user input from the clean task row.
const taskInputText = computed(() => {
  const t = task.value;
  if (!t) return '';
  return typeof t.prompt === 'string' ? t.prompt : '';
});

const roleLabel = (item) => {
  const r = item?.message?.role;
  if (r === 'user') return '用户';
  if (r === 'assistant' && isToolCall(item)) return 'AI 调用工具';
  if (r === 'assistant') return 'AI';
  if (r === 'tool') return '工具返回';
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
  if (!text || text.length <= 500) return text;
  return text.slice(0, 350) + '\n\n' + '… 省略 {n} 字 …'.replace('{n}', text.length - 500) + '\n\n' + text.slice(-150);
};

const request = async (url, opts = {}) => {
  const res = await fetch(url, opts);
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
  if (r === 'user') return 'background:linear-gradient(160deg,#f5f0e0,#ede5cc);border:1px solid rgba(120,90,40,0.12);box-shadow:inset 0 1px 3px rgba(0,0,0,0.06),0 1px 0 rgba(255,255,255,0.7)';
  if (r === 'tool') return 'background:linear-gradient(160deg,#f0f5ec,#e8f0e4);border:1px solid rgba(80,140,80,0.15);box-shadow:inset 0 1px 3px rgba(0,0,0,0.04),0 1px 0 rgba(255,255,255,0.7)';
  if (isToolCall(item)) return 'background:linear-gradient(160deg,#eef2f8,#e4ecf5);border:1px solid rgba(80,120,180,0.18);box-shadow:inset 0 1px 3px rgba(0,0,0,0.04),0 1px 0 rgba(255,255,255,0.7)';
  return 'background:linear-gradient(160deg,#faf5e8,#f2ebd8);border:1px solid rgba(180,150,80,0.22);box-shadow:inset 0 1px 3px rgba(0,0,0,0.06),0 1px 0 rgba(255,255,255,0.8)';
};
const msgRoleIconStyle = (item) => {
  const r = item?.message?.role;
  if (r === 'user') return 'background:linear-gradient(145deg,#c8b870,#a89040);color:#fff';
  if (r === 'tool') return 'background:linear-gradient(145deg,#58a860,#388040);color:#fff';
  if (isToolCall(item)) return 'background:linear-gradient(145deg,#58a0c8,#3070a0);color:#fff';
  return 'background:linear-gradient(145deg,#8890c8,#5860a8);color:#fff';
};

const loadAll = async () => {
  loadError.value = '';
  try {
    const td = await request(`/api/tasks?id=${taskId.value}`);
    task.value = td.task || {};
    messages.value = Array.isArray(td.messages) ? td.messages : [];
  } catch (e) { loadError.value = e.message || '加载失败'; }
};

const stopTask = async () => {
  if (stopping.value || (task.value.status !== 'pending' && task.value.status !== 'running')) return;
  stopping.value = true;
  try {
    await request(`/api/tasks?id=${taskId.value}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'aborted' }) });
    await loadAll();
  } catch (e) { loadError.value = e.message || '停止失败'; }
  finally { stopping.value = false; }
};

// styles
const contentBg     = { background: 'linear-gradient(180deg,#f0e8d5 0%,#e8dfca 100%)' };
const cardStyle     = { background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)', boxShadow: '0 4px 16px rgba(90,60,20,0.15),inset 0 1px 0 rgba(255,255,255,0.85)', border: '1px solid rgba(180,150,80,0.2)' };
const iconBgStyle   = { background: 'linear-gradient(145deg,#c8e4f8,#90c4e8)', boxShadow: '0 3px 10px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.7)' };
const stopBtnStyle  = { padding: '12px', background: 'linear-gradient(180deg,#e87040,#c04820)', boxShadow: '0 4px 0 #802000,0 6px 16px rgba(160,60,20,0.3),inset 0 1px 0 rgba(255,160,100,0.3)', color: 'rgba(255,235,220,0.95)', fontFamily: 'inherit', textShadow: '0 1px 3px rgba(0,0,0,0.3)' };
const sectionCardStyle = { background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)', boxShadow: '0 2px 10px rgba(90,60,20,0.1),inset 0 1px 0 rgba(255,255,255,0.8)', border: '1px solid rgba(180,150,80,0.18)' };
const sectionHeadStyle = { borderBottom: '1px solid rgba(120,90,40,0.1)', background: 'rgba(200,160,60,0.04)' };
const textBlockStyle   = { background: 'linear-gradient(180deg,#ede4cc,#e8dfc8)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1),inset 0 1px 2px rgba(0,0,0,0.06),0 1px 0 rgba(255,255,255,0.6)', border: '1px solid rgba(120,90,40,0.12)', fontFamily: 'system-ui,sans-serif' };

onMounted(loadAll);
</script>
