<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { getTaskMessages, continueTask, stopTask, syncWorkStatus, createAgentTask, launchWork } from './api.js';
import { on } from '@/system/ws.js';

const props = defineProps({
  work:    { type: Object, required: true },
  project: { type: Object, required: true },
});
const emit = defineEmits(['back', 'reload']);

// ── State ─────────────────────────────────────────────────────────────────────
const work      = ref({ ...props.work });
const messages  = ref([]);
const blobUrl   = ref(null);
const continueText = ref('');
const sending   = ref(false);
const rerunBusy = ref(false);
const errMsg    = ref('');
const tab       = ref('preview'); // preview | log

// ── Computed ──────────────────────────────────────────────────────────────────
const isRunning  = computed(() => work.value.status === 'running');
const isDone     = computed(() => work.value.status === 'done');
const isIdle     = computed(() => work.value.status === 'idle');
const canContinue = computed(() => (isDone.value || work.value.status === 'error') && work.value.task_id);

const renderMsgs = computed(() =>
  messages.value.map((m, i) => {
    if (m.role === 'assistant') {
      const calls = Array.isArray(m.tool_calls) ? m.tool_calls : [];
      return { kind: calls.length ? 'tool_call' : 'assistant', id: m.id ?? i, ts: m.ts, text: m.content ?? '', calls };
    }
    if (m.role === 'tool') return { kind: 'tool_result', id: m.id ?? i, ts: m.ts, content: m.content };
    if (m.role === 'user') return { kind: 'user', id: m.id ?? i, ts: m.ts, text: m.content ?? '' };
    return { kind: 'raw', id: m.id ?? i, ts: m.ts, text: typeof m.content === 'string' ? m.content : JSON.stringify(m) };
  })
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function safeName(v) {
  return String(v ?? '').trim().toLowerCase()
    .replace(/[^a-z0-9一-龥]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'demo';
}
function batchId() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}
function demoPrompt(project, w, batch) {
  const dir = `files/exports/demogen/${safeName(project.feature)}-${batch}/${safeName(w.plan_id)}`;
  const plan = { id: w.plan_id, name: w.name, angle: w.angle, audience: w.audience, layout: w.layout, interactions: w.interactions };
  return `请实现一套可运行的前端 demo。

原始功能：${project.feature}

技术栈与约束：
${project.stack}
${project.constraints}

本方案上下文：
${JSON.stringify(plan, null, 2)}

输出要求：
- 把所有产物写入 ${dir}/
- 必须生成 ${dir}/index.html，确保直接用浏览器打开可运行
- 不要写占位内容，要真实生成完整可查看的 demo
- 严格围绕当前方案，不混入其他方案的方向
- 完成后只需简短说明产物路径即可`;
}

function fmtContent(c) {
  if (c == null) return '';
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map(p => p?.text ?? JSON.stringify(p)).join('\n');
  return JSON.stringify(c, null, 2);
}
function fmtArgs(s) {
  if (!s) return '';
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return String(s); }
}

// ── Messages ──────────────────────────────────────────────────────────────────
async function loadMessages() {
  if (!work.value.task_id) return;
  try {
    const d = await getTaskMessages(work.value.task_id);
    messages.value = (d?.messages ?? []).map(row => {
      let p;
      try { p = typeof row.message === 'string' ? JSON.parse(row.message) : row.message; }
      catch { p = { role: 'raw', content: row.message }; }
      return { id: row.id, ts: row.createdAt ?? row.created_at, ...p };
    });
  } catch {}
}

let pollTimer = null;
function startPoll() {
  if (pollTimer) return;
  loadMessages();
  pollTimer = setInterval(async () => {
    await loadMessages();
    // detect task completion via last message or just sync from parent
  }, 2500);
}
function stopPoll() {
  if (!pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

// ── Preview ───────────────────────────────────────────────────────────────────
async function loadPreview() {
  if (!isDone.value) return;
  if (blobUrl.value) return;
  const batch = work.value.batch;
  if (!batch) return;
  const dir = `files/exports/demogen/${safeName(props.project.feature)}-${batch}/${safeName(work.value.plan_id)}`;
  try {
    const res = await fetch(`/${dir}/index.html`);
    if (!res.ok) return;
    const html = await res.text();
    const blob = new Blob([html], { type: 'text/html' });
    blobUrl.value = URL.createObjectURL(blob);
    tab.value = 'preview';
  } catch {}
}

// ── Continue ──────────────────────────────────────────────────────────────────
async function sendContinue() {
  const text = continueText.value.trim();
  if (!text || !work.value.task_id) return;
  sending.value = true;
  errMsg.value = '';
  try {
    await continueTask(work.value.task_id, text);
    continueText.value = '';
    work.value.status = 'running';
    await syncWorkStatus(work.value.id, 'running');
    if (blobUrl.value) { URL.revokeObjectURL(blobUrl.value); blobUrl.value = null; }
    startPoll();
    tab.value = 'log';
    emit('reload');
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '发送失败';
  } finally {
    sending.value = false;
  }
}

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') sendContinue();
}

// ── Stop ──────────────────────────────────────────────────────────────────────
async function stop() {
  if (!work.value.task_id) return;
  try {
    await stopTask(work.value.task_id);
    work.value.status = 'aborted';
    await syncWorkStatus(work.value.id, 'aborted');
    stopPoll();
    emit('reload');
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '停止失败';
  }
}

// ── Rerun ─────────────────────────────────────────────────────────────────────
async function rerun() {
  rerunBusy.value = true;
  errMsg.value = '';
  if (blobUrl.value) { URL.revokeObjectURL(blobUrl.value); blobUrl.value = null; }
  const batch = batchId();
  try {
    const taskRes = await createAgentTask({
      app: 'demogen',
      title: `${props.project.feature} · ${work.value.name}`.slice(0, 90),
      wait: false,
      meta: { type: 'demo', project_id: props.project.id, work_id: work.value.id, batch },
      payload: {
        messages: [
          { role: 'system', content: '你是资深前端原型工程师，擅长用原生 HTML/CSS/JS 生成真实可运行的 demo 文件。' },
          { role: 'user', content: demoPrompt(props.project, work.value, batch) },
        ],
      },
    });
    await launchWork(work.value.id, taskRes.id, batch);
    work.value.task_id = taskRes.id;
    work.value.batch = batch;
    work.value.status = 'running';
    messages.value = [];
    tab.value = 'log';
    startPoll();
    emit('reload');
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '启动失败';
  } finally {
    rerunBusy.value = false;
  }
}

// ── Open in tab ───────────────────────────────────────────────────────────────
function openInTab() {
  if (blobUrl.value) window.open(blobUrl.value, '_blank');
}

// ── Watch ─────────────────────────────────────────────────────────────────────
watch(() => work.value.status, (s) => {
  if (s === 'running') { startPoll(); tab.value = 'log'; }
  else { stopPoll(); }
  if (s === 'done') loadPreview();
}, { immediate: true });

let stopWs = null;
onMounted(() => {
  stopWs = on('tasks_changed', async () => {
    if (!work.value.task_id) return;
    // re-fetch task status from parent's view
  });
});
onBeforeUnmount(() => {
  stopWs?.();
  stopPoll();
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value);
});
</script>

<template>
  <div class="wd-root">

    <!-- Top bar -->
    <header class="wd-topbar">
      <button class="back-btn" @click="$emit('back')">
        <span class="msi sm">arrow_back</span>
      </button>

      <div class="wd-info">
        <h1>{{ work.name }}</h1>
        <span class="wd-pill" :class="work.status">
          <span v-if="isRunning" class="msi xxs spin">autorenew</span>
          <span v-else-if="isDone" class="msi xxs">check_circle</span>
          <span v-else-if="work.status === 'error'" class="msi xxs">cancel</span>
          {{ { idle:'待生成', running:'生成中', done:'完成', error:'失败', aborted:'中止' }[work.status] ?? work.status }}
        </span>
      </div>

      <div class="wd-actions">
        <button v-if="isRunning" class="btn-danger" @click="stop">
          <span class="msi sm">stop</span>停止
        </button>
        <button v-if="isDone" class="btn-ghost" :disabled="!blobUrl" @click="openInTab">
          <span class="msi sm">open_in_new</span>新标签
        </button>
        <button class="btn-ghost" :disabled="rerunBusy || isRunning" @click="rerun">
          <span class="msi sm">refresh</span>
          {{ rerunBusy ? '启动中…' : '重新生成' }}
        </button>
      </div>
    </header>

    <!-- Error -->
    <div v-if="errMsg" class="wd-err">{{ errMsg }}</div>

    <!-- Tab bar (only when has content) -->
    <div v-if="work.task_id" class="wd-tabs">
      <button :class="{ active: tab === 'preview' }" @click="tab = 'preview'">
        <span class="msi sm">preview</span>预览
      </button>
      <button :class="{ active: tab === 'log' }" @click="tab = 'log'">
        <span class="msi sm">terminal</span>日志
        <span v-if="isRunning" class="tab-dot" />
      </button>
    </div>

    <!-- Preview tab -->
    <div v-if="tab === 'preview'" class="wd-preview">
      <iframe v-if="blobUrl" :key="blobUrl" :src="blobUrl" class="wd-iframe" sandbox="allow-scripts allow-same-origin" />
      <div v-else-if="isRunning" class="wd-waiting">
        <span class="msi xl spin" style="color:#7c3aed;opacity:.5">autorenew</span>
        <p>Demo 生成中，完成后自动刷新预览</p>
      </div>
      <div v-else-if="isIdle" class="wd-waiting">
        <span class="msi xl" style="color:#7c3aed;opacity:.3">preview</span>
        <p>点击「重新生成」开始生成这套 Demo</p>
        <button class="btn-primary" @click="rerun">
          <span class="msi sm">rocket_launch</span>生成
        </button>
      </div>
      <div v-else class="wd-waiting">
        <span class="msi xl" style="color:#f87171;opacity:.4">broken_image</span>
        <p>预览加载失败，可尝试重新生成</p>
      </div>
    </div>

    <!-- Log tab -->
    <div v-if="tab === 'log'" class="wd-log">
      <div class="wd-log-body" ref="logBody">
        <div v-if="!renderMsgs.length" class="log-empty">
          {{ isRunning ? 'Agent 启动中，等待响应…' : '暂无日志' }}
        </div>

        <template v-for="m in renderMsgs" :key="m.id">
          <!-- User -->
          <div v-if="m.kind === 'user'" class="log-msg user">
            <span class="log-role">用户</span>
            <pre class="log-text">{{ fmtContent(m.text) }}</pre>
          </div>

          <!-- Assistant text -->
          <div v-else-if="m.kind === 'assistant'" class="log-msg assistant">
            <span class="log-role">AI</span>
            <pre class="log-text">{{ fmtContent(m.text) }}</pre>
          </div>

          <!-- Tool call -->
          <div v-else-if="m.kind === 'tool_call'" class="log-msg tool-call">
            <span class="log-role">AI →</span>
            <div class="log-calls">
              <div v-for="c in m.calls" :key="c.id" class="log-call">
                <span class="call-name">{{ c.function?.name }}</span>
                <pre class="call-args">{{ fmtArgs(c.function?.arguments) }}</pre>
              </div>
            </div>
            <pre v-if="m.text" class="log-text" style="margin-top:6px">{{ fmtContent(m.text) }}</pre>
          </div>

          <!-- Tool result -->
          <div v-else-if="m.kind === 'tool_result'" class="log-msg tool-result">
            <span class="log-role">工具</span>
            <pre class="log-text">{{ fmtContent(m.content).slice(0, 600) }}</pre>
          </div>
        </template>

        <div v-if="isRunning" class="log-typing">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </div>
      </div>

      <!-- Continue box -->
      <div class="wd-continue">
        <div class="wd-continue-box">
          <textarea
            v-model="continueText"
            :disabled="isRunning || sending"
            placeholder="发消息继续修改（⌘+Enter 发送）"
            rows="2"
            @keydown="onKeydown"
          />
          <button class="send-btn" :disabled="!continueText.trim() || isRunning || sending" @click="sendContinue">
            <span class="msi sm">send</span>
          </button>
        </div>
        <p class="continue-hint">基于已有任务继续执行 · ⌘+Enter 发送</p>
      </div>
    </div>

    <!-- Plan info (shown below main area when visible) -->
    <div class="wd-plan-info">
      <div v-if="work.angle"><span class="info-label">方向</span>{{ work.angle }}</div>
      <div v-if="work.audience"><span class="info-label">场景</span>{{ work.audience }}</div>
      <div v-if="work.layout"><span class="info-label">布局</span>{{ work.layout }}</div>
      <div v-if="work.interactions?.length">
        <span class="info-label">交互</span>{{ work.interactions.join(' / ') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.wd-root { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }

/* Topbar */
.wd-topbar {
  flex: none; display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-bottom: 1px solid #2a2340; background: #13101a;
}
.back-btn { background: transparent; border: 0; color: #7a6f99; cursor: pointer; display: flex; padding: 6px; border-radius: 8px; flex: none; }
.back-btn:hover { background: #211c30; color: #e2dff0; }
.wd-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
h1 { margin: 0; font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wd-pill {
  flex: none; display: inline-flex; align-items: center; gap: 4px;
  border-radius: 99px; padding: 2px 8px; font-size: 11px; font-weight: 650;
}
.wd-pill.idle    { background: #211c30; color: #6d5fa0; }
.wd-pill.running { background: #2d1f5e; color: #a78bfa; }
.wd-pill.done    { background: #14332a; color: #4ade80; }
.wd-pill.error   { background: #3b0d0d; color: #f87171; }
.wd-pill.aborted { background: #1e1e2e; color: #6b7280; }
.wd-actions { display: flex; gap: 6px; flex: none; }
.wd-err { background: #3b0d0d; color: #f87171; padding: 8px 16px; font-size: 12.5px; flex: none; }

/* Tabs */
.wd-tabs { flex: none; display: flex; gap: 2px; padding: 8px 16px 0; border-bottom: 1px solid #2a2340; background: #13101a; }
.wd-tabs button {
  display: inline-flex; align-items: center; gap: 6px; border: 0;
  background: transparent; color: #5a5278; font: inherit; font-size: 13px; font-weight: 650;
  cursor: pointer; padding: 6px 12px; border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color .15s;
}
.wd-tabs button:hover { color: #a89cc8; }
.wd-tabs button.active { color: #e2dff0; border-bottom-color: #7c3aed; }
.tab-dot { width: 6px; height: 6px; background: #a78bfa; border-radius: 99px; animation: pulse 1s infinite; }

/* Preview */
.wd-preview { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.wd-iframe { flex: 1; width: 100%; border: 0; background: #fff; }
.wd-waiting {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; color: #4d4468;
}
.wd-waiting p { margin: 0; font-size: 14px; }

/* Log */
.wd-log { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.wd-log-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.log-empty { color: #4d4468; font-size: 13px; padding: 12px 0; }

.log-msg { display: grid; gap: 4px; }
.log-role { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.log-msg.user .log-role    { color: #60a5fa; }
.log-msg.assistant .log-role { color: #a78bfa; }
.log-msg.tool-call .log-role { color: #f59e0b; }
.log-msg.tool-result .log-role { color: #38bdf8; }

.log-text {
  margin: 0; white-space: pre-wrap; word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 1.6;
  background: #13101a; border: 1px solid #2a2340; border-radius: 7px;
  padding: 10px 12px; max-height: 280px; overflow-y: auto; color: #c4b5fd;
}
.log-msg.user .log-text        { color: #93c5fd; }
.log-msg.tool-result .log-text { color: #7dd3fc; }

.log-calls { display: flex; flex-direction: column; gap: 6px; }
.log-call { background: #1a1528; border: 1px solid #2a2340; border-radius: 7px; padding: 8px 10px; }
.call-name { display: block; font-size: 11px; font-weight: 700; color: #f59e0b; margin-bottom: 4px; font-family: monospace; }
.call-args { margin: 0; font-family: monospace; font-size: 11.5px; color: #d1c4e9; white-space: pre-wrap; max-height: 160px; overflow-y: auto; }

.log-typing { display: flex; gap: 5px; padding: 6px 2px; }
.dot { width: 6px; height: 6px; background: #7c3aed; border-radius: 99px; animation: bounce .9s infinite; }
.dot:nth-child(2) { animation-delay: .15s; }
.dot:nth-child(3) { animation-delay: .3s; }

/* Continue box */
.wd-continue { flex: none; border-top: 1px solid #2a2340; padding: 12px 16px; background: #13101a; }
.wd-continue-box { display: flex; gap: 8px; align-items: flex-end; }
textarea {
  flex: 1; background: #0f0d14; color: #e2dff0; border: 1px solid #2a2340;
  border-radius: 8px; font: inherit; font-size: 13px; padding: 8px 10px; outline: 0;
  resize: none; line-height: 1.55; transition: border-color .15s;
}
textarea:focus { border-color: #7c3aed; }
textarea:disabled { opacity: .5; }
.send-btn {
  flex: none; width: 36px; height: 36px; background: #7c3aed; color: #fff;
  border: 0; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.send-btn:disabled { opacity: .4; cursor: default; }
.continue-hint { margin: 5px 0 0; font-size: 11px; color: #4d4468; }

/* Plan info strip */
.wd-plan-info {
  flex: none; display: flex; flex-wrap: wrap; gap: 12px 24px;
  padding: 10px 16px; border-top: 1px solid #2a2340; background: #0f0d14;
  font-size: 12px; color: #7a6f99;
}
.wd-plan-info > div { display: flex; gap: 6px; }
.info-label { color: #4d4468; font-weight: 650; }

/* Buttons */
.btn-primary, .btn-ghost, .btn-danger {
  display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 8px;
  font: inherit; font-size: 12.5px; font-weight: 650; cursor: pointer; padding: 7px 12px;
}
.btn-primary { background: #7c3aed; color: #fff; }
.btn-ghost   { background: #2a2340; color: #c4b5fd; }
.btn-ghost:hover { background: #34296a; }
.btn-ghost:disabled { opacity: .4; cursor: default; }
.btn-danger  { background: #3b0d0d; color: #f87171; }
.btn-danger:hover { background: #5a1515; }

/* Animations */
.spin { animation: spin .9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

/* Scrollbar */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #2a2340; border-radius: 99px; }
</style>
