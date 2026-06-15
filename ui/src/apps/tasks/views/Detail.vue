<template>
  <div class="page">

    <!-- Status hero card -->
    <section class="v6-card hero">
      <div class="hero-top">
        <span class="badge" :class="badgeClass">
          <span v-if="active" class="badge-dot"></span>
          {{ statusLabel }}
        </span>
        <button v-if="active" class="stop-btn" :disabled="stopping" @click="stopTask">
          <Square :size="11" fill="currentColor" :stroke-width="0" />
          {{ stopping ? '__T_TASK_STOP_BUSY__' : '__T_COMMON_STOP__' }}
        </button>
      </div>
      <h1 class="hero-name">{{ task.name || '__T_TASK_DETAIL_UNTITLED__' }}</h1>
      <div class="hero-meta">
        <span v-if="task.created_at">{{ '__T_TASK_DETAIL_CREATED_PREFIX__' }} {{ fmtTime(task.created_at) }}</span>
        <span v-if="duration">{{ '__T_TASK_DETAIL_DURATION_PREFIX__' }} {{ duration }}</span>
      </div>
    </section>

    <!-- Error banner (load/stop failures) -->
    <div v-if="loadError" class="load-error">{{ loadError }}</div>

    <!-- 指令 -->
    <section v-if="task.prompt" class="v6-card block">
      <div class="block-title">__T_TASK_DETAIL_PROMPT__</div>
      <div class="prompt-text">{{ task.prompt }}</div>
    </section>

    <!-- 执行过程 -->
    <section v-if="segments.length" class="process">
      <div class="block-title standalone">__T_TASK_DETAIL_PROCESS__</div>
      <template v-for="(seg, i) in segments" :key="i">
        <ToolCall v-if="seg.type === 'tool'" :msg="seg.item" :busy="active" />
        <div v-else class="v6-card text-seg">{{ seg.text }}</div>
      </template>
    </section>

    <!-- 结果 -->
    <section v-if="task.response" class="v6-card block">
      <div class="block-title">__T_TASK_DETAIL_RESULT__</div>
      <div class="result-text">{{ task.response }}</div>
    </section>

    <!-- 失败 -->
    <section v-if="task.error" class="v6-card block error-card">
      <div class="block-title bad">__T_TASK_DETAIL_ERROR_TITLE__</div>
      <pre class="error-pre">{{ task.error }}</pre>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Square } from 'lucide-vue-next';
import ToolCall from '../../chat/components/bubbles/ToolCall.vue';
import { fetchTaskDetail, abortTask, isActive, parseTime, fmtTime } from '../lib/api.js';

const props = defineProps({ id: { type: [String, Number], required: true } });
const taskId = computed(() => Number(props.id));

const task = ref({});
const segments = ref([]);
const loadError = ref('');
const stopping = ref(false);

const active = computed(() => isActive(task.value.status));

const statusLabel = computed(() => ({
  pending: '__T_TASK_STATUS_RUNNING__', running: '__T_TASK_STATUS_RUNNING__',
  done: '__T_TASK_STATUS_DONE__', completed: '__T_TASK_STATUS_DONE__',
  error: '__T_TASK_STATUS_FAILED__', aborted: '__T_TASK_STATUS_ABORTED__', stopped: '__T_TASK_STATUS_STOPPED__',
}[task.value.status] || task.value.status || '-'));

const badgeClass = computed(() => {
  const s = task.value.status;
  if (s === 'pending' || s === 'running') return 'run';
  if (s === 'done' || s === 'completed') return 'ok';
  return 'bad';
});

const duration = computed(() => {
  const start = parseTime(task.value.created_at);
  if (!start) return '';
  const end = active.value ? new Date() : parseTime(task.value.finished_at);
  if (!end) return '';
  const sec = Math.max(0, Math.round((end - start) / 1000));
  if (sec < 60) return `__T_TASK_DURATION_SEC__`.replace('{n}', String(sec));
  if (sec < 3600) return `__T_TASK_DURATION_MIN_SEC__`.replace('{m}', String(Math.floor(sec / 60))).replace('{s}', String(sec % 60));
  return `__T_TASK_DURATION_HOUR_MIN__`.replace('{h}', String(Math.floor(sec / 3600))).replace('{m}', String(Math.floor((sec % 3600) / 60)));
});

// --- Map raw task messages into single-tool segments ---
// segments = [{type:'tool', item:{type:'tool_call', toolCall, title, detail, command, shell, result, expanded, _key}}, {type:'text', text}]
const expandedKeys = new Set();

const argTitle = (args) => {
  try {
    const a = typeof args === 'string' ? JSON.parse(args) : (args || {});
    return a.summary || a.reason || a.title || a.command || '';
  } catch { return ''; }
};
const argDetail = (args) => {
  if (!args) return '';
  try {
    const a = typeof args === 'string' ? JSON.parse(args) : args;
    return JSON.stringify(a, null, 2);
  } catch { return String(args); }
};
const argCommand = (args) => {
  try {
    const a = typeof args === 'string' ? JSON.parse(args) : (args || {});
    return typeof a.command === 'string' ? a.command : '';
  } catch { return ''; }
};
const contentText = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((c) => c?.text || '').join('');
  return content == null ? '' : JSON.stringify(content);
};

const buildSegments = (rawMessages) => {
  // Collect tool results keyed by tool_call_id
  const results = new Map();
  for (const item of rawMessages) {
    const msg = item?.message || {};
    if (msg.role === 'tool' && msg.tool_call_id) results.set(msg.tool_call_id, contentText(msg.content));
  }
  const segs = [];
  for (const item of rawMessages) {
    const msg = item?.message || {};
    if (msg.role === 'assistant' && Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
      for (const tc of msg.tool_calls) {
        const key = tc.id || `tc-${segs.length}`;
        const args = tc.function?.arguments;
        const name = tc.function?.name || '';
        const command = argCommand(args);
        const shell = name === 'shell' || name === 'bash' || name === 'exec';
        const result = results.has(key) ? results.get(key) : null;
        const itemObj = {
          type: 'tool_call',
          toolCall: { function: { name } },
          title: argTitle(args),
          detail: argDetail(args),
          command,
          shell,
          result,
          _key: key,
        };
        // preserve expansion state across polls
        Object.defineProperty(itemObj, 'expanded', {
          get: () => expandedKeys.has(key),
          set: (v) => { v ? expandedKeys.add(key) : expandedKeys.delete(key); },
          enumerable: true,
        });
        segs.push({ type: 'tool', item: itemObj });
      }
    } else if (msg.role === 'assistant') {
      const text = contentText(msg.content).trim();
      if (text) segs.push({ type: 'text', text });
    }
  }
  return segs;
};

const loadAll = async () => {
  try {
    const td = await fetchTaskDetail(taskId.value);
    task.value = td.task || {};
    segments.value = buildSegments(Array.isArray(td.messages) ? td.messages : []);
    loadError.value = '';
  } catch (e) { loadError.value = e.message || '__T_TASK_LOAD_FAILED__'; }
};

const stopTask = async () => {
  if (stopping.value || !active.value) return;
  stopping.value = true;
  try {
    await abortTask(taskId.value);
    await loadAll();
  } catch (e) { loadError.value = e.message || '__T_TASK_STOP_FAILED__'; }
  finally { stopping.value = false; }
};

// Poll every 3s while the task is active
let timer = null;
watch(active, (a) => {
  if (a && !timer) timer = setInterval(loadAll, 3000);
  else if (!a && timer) { clearInterval(timer); timer = null; }
}, { immediate: true });

onMounted(loadAll);
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<style scoped>
.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 26px 24px 50px;
}
.v6-card {
  background: var(--color-bg-elev);
  border: 1px solid var(--color-line);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 18px 20px;
  margin-bottom: 14px;
}

/* Hero */
.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 11px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
}
.badge.run { background: var(--color-blue-bg, #eef4fe); color: var(--color-accent); }
.badge.ok { background: color-mix(in srgb, var(--color-good) 12%, transparent); color: var(--color-good); }
.badge.bad { background: color-mix(in srgb, var(--color-bad) 10%, transparent); color: var(--color-bad); }
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: td-pulse 1.4s infinite;
}
@keyframes td-pulse { 50% { opacity: 0.35; } }
.stop-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 999px;
  border: none;
  background: var(--color-bad);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.stop-btn:hover { opacity: 0.9; }
.stop-btn:disabled { opacity: 0.6; cursor: default; }
.hero-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1.4;
  word-break: break-word;
}
.hero-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-faint);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  font-variant-numeric: tabular-nums;
}

.load-error {
  margin-bottom: 14px;
  padding: 8px 12px;
  border: 1px dashed var(--color-bad);
  border-radius: 10px;
  background: var(--color-bg-elev);
  font-size: 12px;
  color: var(--color-bad);
}

/* Blocks */
.block-title {
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--color-muted);
  margin-bottom: 10px;
}
.block-title.standalone { margin: 4px 2px 10px; }
.block-title.bad { color: var(--color-bad); }
.prompt-text,
.result-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-ink);
  white-space: pre-wrap;
  word-break: break-word;
}
.process { margin-bottom: 14px; }
.process :deep(.tool-group) { width: 100%; margin-bottom: 10px; }
.text-seg {
  padding: 13px 16px;
  margin-bottom: 10px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--color-muted);
  white-space: pre-wrap;
  word-break: break-word;
}
.error-card { border-color: color-mix(in srgb, var(--color-bad) 40%, transparent); }
.error-pre {
  margin: 0;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--color-bad) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-bad) 20%, transparent);
  border-radius: 8px;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-bad);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
