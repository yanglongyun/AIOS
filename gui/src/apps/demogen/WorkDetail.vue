<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  getTaskMessages, getTaskDetail, stopTask, buildWork, iterateWork, resolveWork, fileUrl,
} from './api.js';
import { on } from '@/system/ws.js';

const props = defineProps({
  work: { type: Object, required: true },
  project: { type: Object, required: true },
});
const emit = defineEmits(['back', 'reload']);

const work = ref({ ...props.work });
const messages = ref([]);
const instruction = ref('');
const sending = ref(false);
const errMsg = ref('');
const tab = ref('preview'); // preview | log
const nonce = ref(0);

const isRunning = computed(() => work.value.status === 'running');
const isDone = computed(() => work.value.status === 'done');
const hasPreview = computed(() => isDone.value && !!work.value.entry_path);
const previewSrc = computed(() => hasPreview.value ? `${fileUrl(work.value.entry_path)}&v=${nonce.value}` : '');

const STATUS_LABEL = { idle: '待生成', running: '生成中', done: '完成', error: '失败', aborted: '中止' };

const renderMsgs = computed(() =>
  messages.value.map((m, i) => {
    if (m.role === 'assistant') {
      const calls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      return { kind: calls.length ? 'tool_call' : 'assistant', id: m.id ?? i, text: m.content ?? '', calls };
    }
    if (m.role === 'tool') return { kind: 'tool_result', id: m.id ?? i, content: m.content };
    if (m.role === 'user') return { kind: 'user', id: m.id ?? i, text: m.content ?? '' };
    return { kind: 'raw', id: m.id ?? i, text: typeof m.content === 'string' ? m.content : JSON.stringify(m) };
  })
);

function fmtContent(c) {
  if (c == null) return '';
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((p) => p?.text ?? JSON.stringify(p)).join('\n');
  return JSON.stringify(c, null, 2);
}
function fmtArgs(s) {
  if (!s) return '';
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return String(s); }
}

async function loadMessages() {
  if (!work.value.task_id) return;
  try {
    const d = await getTaskMessages(work.value.task_id);
    messages.value = (d?.messages ?? []).map((row) => {
      let p;
      try { p = typeof row.message === 'string' ? JSON.parse(row.message) : row.message; }
      catch { p = { role: 'raw', content: row.message }; }
      return { id: row.id, ...p };
    });
  } catch { /* ignore */ }
}

// ── Poll task → resolve on completion ───────────────────────────────────────────
let timer = null;
function startPoll() {
  if (timer) return;
  loadMessages();
  timer = setInterval(async () => {
    if (!isRunning.value || !work.value.task_id) { stopPoll(); return; }
    await loadMessages();
    try {
      const res = await getTaskDetail(work.value.task_id);
      const task = res.task ?? res;
      if (task.status && task.status !== 'pending') {
        stopPoll();
        const updated = await resolveWork(work.value.id, task.status);
        work.value = { ...updated.work };
        if (work.value.status === 'done') { nonce.value += 1; tab.value = 'preview'; }
        emit('reload');
      }
    } catch { /* keep polling */ }
  }, 2500);
}
function stopPoll() { if (timer) { clearInterval(timer); timer = null; } }

// ── Actions ─────────────────────────────────────────────────────────────────────
async function rebuild() {
  errMsg.value = '';
  try {
    const res = await buildWork(work.value.id);
    work.value = { ...res.work };
    messages.value = [];
    tab.value = 'log';
    startPoll();
    emit('reload');
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '启动失败';
  }
}

async function sendIterate() {
  const text = instruction.value.trim();
  if (!text) return;
  sending.value = true;
  errMsg.value = '';
  try {
    const res = await iterateWork(work.value.id, text);
    work.value = { ...res.work };
    instruction.value = '';
    messages.value = [];
    tab.value = 'log';
    startPoll();
    emit('reload');
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '提交失败';
  } finally {
    sending.value = false;
  }
}

async function stop() {
  if (!work.value.task_id) return;
  try {
    await stopTask(work.value.task_id);
    const updated = await resolveWork(work.value.id, 'aborted');
    work.value = { ...updated.work };
    stopPoll();
    emit('reload');
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '停止失败';
  }
}

function openTab() { if (hasPreview.value) window.open(fileUrl(work.value.entry_path), '_blank'); }
function onKeydown(e) { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') sendIterate(); }

watch(() => work.value.status, (s) => {
  if (s === 'running') { startPoll(); tab.value = 'log'; }
  else { stopPoll(); if (s === 'done') tab.value = 'preview'; }
}, { immediate: true });

let stopWs = null;
onMounted(() => {
  if (isDone.value) { tab.value = 'preview'; loadMessages(); }
  stopWs = on('tasks_changed', () => { if (isRunning.value) loadMessages(); });
});
onBeforeUnmount(() => { stopWs?.(); stopPoll(); });
</script>

<template>
  <div class="wd-root">
    <header class="wd-topbar">
      <button class="back-btn" @click="$emit('back')"><span class="msi sm">arrow_back</span></button>
      <div class="wd-info">
        <h1>{{ work.name }}</h1>
        <span class="wd-pill" :class="work.status">
          <span v-if="isRunning" class="msi xxs spin">autorenew</span>
          <span v-else-if="isDone" class="msi xxs">check_circle</span>
          <span v-else-if="work.status === 'error'" class="msi xxs">cancel</span>
          {{ STATUS_LABEL[work.status] ?? work.status }}
        </span>
      </div>
      <div class="wd-actions">
        <button v-if="isRunning" class="btn-danger" @click="stop"><span class="msi sm">stop</span>停止</button>
        <button v-if="hasPreview" class="btn-ghost" @click="openTab"><span class="msi sm">open_in_new</span>新标签</button>
        <button class="btn-ghost" :disabled="isRunning" @click="rebuild"><span class="msi sm">refresh</span>重新生成</button>
      </div>
    </header>

    <div v-if="errMsg" class="wd-err">{{ errMsg }}</div>

    <div v-if="work.angle" class="wd-meta">
      <span class="wd-meta-label">方向</span>{{ work.angle }}
      <template v-if="work.highlights?.length">
        <span class="wd-meta-sep">·</span>
        <span v-for="h in work.highlights" :key="h" class="wd-tag">{{ h }}</span>
      </template>
    </div>

    <div class="wd-tabs">
      <button :class="{ active: tab === 'preview' }" @click="tab = 'preview'"><span class="msi sm">preview</span>预览</button>
      <button :class="{ active: tab === 'log' }" @click="tab = 'log'">
        <span class="msi sm">terminal</span>日志<span v-if="isRunning" class="tab-dot" />
      </button>
    </div>

    <!-- Preview -->
    <div v-show="tab === 'preview'" class="wd-preview">
      <iframe
        v-if="hasPreview"
        :src="previewSrc"
        class="wd-iframe"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      <div v-else-if="isRunning" class="wd-waiting">
        <span class="msi xl spin" style="color:#7c3aed;opacity:.5">autorenew</span>
        <p>Demo 生成中，完成后自动显示预览</p>
      </div>
      <div v-else-if="work.status === 'error'" class="wd-waiting">
        <span class="msi xl" style="color:#f87171;opacity:.4">broken_image</span>
        <p>{{ work.error || '生成失败' }}</p>
        <button class="btn-primary" @click="rebuild"><span class="msi sm">refresh</span>重新生成</button>
      </div>
      <div v-else class="wd-waiting">
        <span class="msi xl" style="color:#7c3aed;opacity:.3">preview</span>
        <p>点击「重新生成」开始生成这套 Demo</p>
        <button class="btn-primary" @click="rebuild"><span class="msi sm">rocket_launch</span>生成</button>
      </div>
    </div>

    <!-- Log -->
    <div v-show="tab === 'log'" class="wd-log">
      <div class="wd-log-body">
        <div v-if="!renderMsgs.length" class="log-empty">{{ isRunning ? 'Agent 启动中，等待响应…' : '暂无日志' }}</div>
        <template v-for="m in renderMsgs" :key="m.id">
          <div v-if="m.kind === 'user'" class="log-msg user"><span class="log-role">用户</span><pre class="log-text">{{ fmtContent(m.text) }}</pre></div>
          <div v-else-if="m.kind === 'assistant'" class="log-msg assistant"><span class="log-role">AI</span><pre class="log-text">{{ fmtContent(m.text) }}</pre></div>
          <div v-else-if="m.kind === 'tool_call'" class="log-msg tool-call">
            <span class="log-role">AI →</span>
            <div class="log-calls">
              <div v-for="c in m.calls" :key="c.id" class="log-call">
                <span class="call-name">{{ c.function?.name }}</span>
                <pre class="call-args">{{ fmtArgs(c.function?.arguments) }}</pre>
              </div>
            </div>
          </div>
          <div v-else-if="m.kind === 'tool_result'" class="log-msg tool-result"><span class="log-role">工具</span><pre class="log-text">{{ fmtContent(m.content).slice(0, 600) }}</pre></div>
        </template>
      </div>
    </div>

    <!-- Iterate box -->
    <div class="wd-iterate">
      <div class="wd-iterate-box">
        <textarea
          v-model="instruction"
          :disabled="isRunning || sending"
          placeholder="想怎么改？比如「换成深色主题」「加一个搜索框」（⌘/Ctrl+Enter 发送）"
          rows="2"
          @keydown="onKeydown"
        />
        <button class="send-btn" :disabled="!instruction.trim() || isRunning || sending" @click="sendIterate">
          <span class="msi sm">{{ sending ? 'hourglass_empty' : 'auto_fix_high' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wd-root { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.wd-topbar { flex: none; display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid #2a2340; background: #13101a; }
.back-btn { background: transparent; border: 0; color: #7a6f99; cursor: pointer; display: flex; padding: 6px; border-radius: 8px; flex: none; }
.back-btn:hover { background: #211c30; color: #e2dff0; }
.wd-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
h1 { margin: 0; font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wd-pill { flex: none; display: inline-flex; align-items: center; gap: 4px; border-radius: 99px; padding: 2px 8px; font-size: 11px; font-weight: 650; }
.wd-pill.idle { background: #211c30; color: #6d5fa0; }
.wd-pill.running { background: #2d1f5e; color: #a78bfa; }
.wd-pill.done { background: #14332a; color: #4ade80; }
.wd-pill.error { background: #3b0d0d; color: #f87171; }
.wd-pill.aborted { background: #1e1e2e; color: #6b7280; }
.wd-actions { display: flex; gap: 6px; flex: none; }
.wd-err { background: #3b0d0d; color: #f87171; padding: 8px 16px; font-size: 12.5px; flex: none; }

.wd-meta { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 8px 16px; font-size: 12px; color: #7a6f99; border-bottom: 1px solid #2a2340; background: #0f0d14; }
.wd-meta-label { color: #4d4468; font-weight: 650; margin-right: 2px; }
.wd-meta-sep { color: #3a3254; }
.wd-tag { background: #211c30; color: #8b7ec8; border-radius: 5px; padding: 1px 6px; font-size: 11px; }

.wd-tabs { flex: none; display: flex; gap: 2px; padding: 8px 16px 0; border-bottom: 1px solid #2a2340; background: #13101a; }
.wd-tabs button { display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; color: #5a5278; font: inherit; font-size: 13px; font-weight: 650; cursor: pointer; padding: 6px 12px; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.wd-tabs button:hover { color: #a89cc8; }
.wd-tabs button.active { color: #e2dff0; border-bottom-color: #7c3aed; }
.tab-dot { width: 6px; height: 6px; background: #a78bfa; border-radius: 99px; animation: pulse 1s infinite; }

.wd-preview { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.wd-iframe { flex: 1; width: 100%; border: 0; background: #fff; }
.wd-waiting { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #4d4468; }
.wd-waiting p { margin: 0; font-size: 14px; text-align: center; max-width: 420px; }

.wd-log { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.wd-log-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.log-empty { color: #4d4468; font-size: 13px; padding: 12px 0; }
.log-msg { display: grid; gap: 4px; }
.log-role { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.log-msg.user .log-role { color: #60a5fa; }
.log-msg.assistant .log-role { color: #a78bfa; }
.log-msg.tool-call .log-role { color: #f59e0b; }
.log-msg.tool-result .log-role { color: #38bdf8; }
.log-text { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, Menlo, monospace; font-size: 12px; line-height: 1.6; background: #13101a; border: 1px solid #2a2340; border-radius: 7px; padding: 10px 12px; max-height: 280px; overflow-y: auto; color: #c4b5fd; }
.log-msg.user .log-text { color: #93c5fd; }
.log-msg.tool-result .log-text { color: #7dd3fc; }
.log-calls { display: flex; flex-direction: column; gap: 6px; }
.log-call { background: #1a1528; border: 1px solid #2a2340; border-radius: 7px; padding: 8px 10px; }
.call-name { display: block; font-size: 11px; font-weight: 700; color: #f59e0b; margin-bottom: 4px; font-family: monospace; }
.call-args { margin: 0; font-family: monospace; font-size: 11.5px; color: #d1c4e9; white-space: pre-wrap; max-height: 160px; overflow-y: auto; }

.wd-iterate { flex: none; border-top: 1px solid #2a2340; padding: 12px 16px; background: #13101a; }
.wd-iterate-box { display: flex; gap: 8px; align-items: flex-end; }
textarea { flex: 1; background: #0f0d14; color: #e2dff0; border: 1px solid #2a2340; border-radius: 8px; font: inherit; font-size: 13px; padding: 8px 10px; outline: 0; resize: none; line-height: 1.55; }
textarea:focus { border-color: #7c3aed; }
textarea:disabled { opacity: .5; }
.send-btn { flex: none; width: 36px; height: 36px; background: #7c3aed; color: #fff; border: 0; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.send-btn:disabled { opacity: .4; cursor: default; }

.btn-primary, .btn-ghost, .btn-danger { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 8px; font: inherit; font-size: 12.5px; font-weight: 650; cursor: pointer; padding: 7px 12px; }
.btn-primary { background: #7c3aed; color: #fff; }
.btn-ghost { background: #2a2340; color: #c4b5fd; }
.btn-ghost:hover { background: #34296a; }
.btn-ghost:disabled { opacity: .4; cursor: default; }
.btn-danger { background: #3b0d0d; color: #f87171; }
.btn-danger:hover { background: #5a1515; }

.spin { animation: spin .9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-thumb { background: #2a2340; border-radius: 99px; }
</style>
