<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  getProject, savePlans, launchWork, syncWorkStatus,
  createInstantTask, createAgentTask, getTaskDetail,
} from './api.js';
import { on } from '@/system/ws.js';

const props  = defineProps({ projectId: { type: Number, required: true } });
const emit   = defineEmits(['back', 'open-work']);

const project = ref(null);
const works   = ref([]);
const errMsg  = ref('');
const phase   = ref('idle');  // idle | planning | launching

// ── Helpers ───────────────────────────────────────────────────────────────────
function batchId() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}
function safeName(v) {
  return String(v ?? '').trim().toLowerCase()
    .replace(/[^a-z0-9一-龥]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'demo';
}
function clamp(n) { return Math.max(1, Math.min(10, Math.round(Number(n) || 1))); }

function parseJsonObject(text) {
  if (text && typeof text === 'object') return text;
  const raw = String(text ?? '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1].trim() : raw;
  const s = body.indexOf('{'), e = body.lastIndexOf('}');
  if (s < 0 || e <= s) throw new Error('返回结果不是 JSON');
  return JSON.parse(body.slice(s, e + 1));
}

function normalizePlans(value, count) {
  const list = Array.isArray(value?.plans) ? value.plans
    : Array.isArray(value?.demos) ? value.demos : [];
  if (!list.length) throw new Error('方案结果缺少 plans 字段');
  return list.slice(0, clamp(count)).map((item, i) => ({
    id:           String(item.id ?? `demo-${i + 1}`),
    name:         String(item.name ?? item.title ?? `方案 ${i + 1}`).trim(),
    angle:        String(item.angle ?? item.concept ?? item.summary ?? '').trim(),
    audience:     String(item.audience ?? '').trim(),
    layout:       String(item.layout ?? '').trim(),
    interactions: Array.isArray(item.interactions) ? item.interactions.map(String) : [],
    files:        Array.isArray(item.files) ? item.files.map(String) : ['index.html'],
  }));
}

function planPrompt(p, count) {
  return `请为同一个功能生成 ${count} 套差异明显的 demo 方案。

功能：${p.feature}
技术栈：${p.stack}
约束：${p.constraints}

只返回 JSON，不要任何 Markdown 包裹或说明文字。结构：
{
  "plans": [
    {
      "id": "demo-1",
      "name": "方案名称",
      "angle": "这套方案的产品/设计方向（一句话）",
      "audience": "适合的目标用户或场景",
      "layout": "主要布局描述",
      "interactions": ["关键交互1", "关键交互2"],
      "files": ["index.html"]
    }
  ]
}`;
}

function demoPrompt(project, work, batch) {
  const dir = `files/exports/demogen/${safeName(project.feature)}-${batch}/${safeName(work.plan_id)}`;
  const plan = { id: work.plan_id, name: work.name, angle: work.angle, audience: work.audience, layout: work.layout, interactions: work.interactions };
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

// ── Load ──────────────────────────────────────────────────────────────────────
async function load() {
  errMsg.value = '';
  try {
    const res = await getProject(props.projectId);
    project.value = res.project;
    works.value = res.works ?? [];
    // poll running works
    works.value.filter(w => w.status === 'running' && w.task_id).forEach(w => startPoll(w));
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '加载失败';
  }
}

// ── Task polling ──────────────────────────────────────────────────────────────
const polls = {};

async function pollWork(work) {
  try {
    const res = await getTaskDetail(work.task_id);
    const task = res.task ?? res;
    const status = task.status === 'pending' ? 'running' : task.status;
    if (status !== work.status) {
      work.status = status;
      await syncWorkStatus(work.id, status);
      if (status !== 'running') stopPoll(work.id);
    }
  } catch {}
}

function startPoll(work) {
  if (polls[work.id]) return;
  polls[work.id] = setInterval(() => {
    const w = works.value.find(x => x.id === work.id);
    if (!w || w.status !== 'running') { stopPoll(work.id); return; }
    pollWork(w);
  }, 3000);
}

function stopPoll(workId) {
  if (!polls[workId]) return;
  clearInterval(polls[workId]);
  delete polls[workId];
}

// ── Generate plans ────────────────────────────────────────────────────────────
async function generatePlans() {
  if (!project.value) return;
  phase.value = 'planning';
  errMsg.value = '';
  const count = clamp(project.value.plan_count);
  try {
    const res = await createInstantTask({
      app: 'demogen',
      title: `生成方案：${project.value.feature}`.slice(0, 80),
      responseFormat: 'json',
      meta: { type: 'plan', project_id: project.value.id },
      payload: {
        messages: [
          { role: 'system', content: '你是产品原型与前端 demo 总监，擅长把同一个功能拆成多个风格清晰、差异明显的 demo 方向。' },
          { role: 'user', content: planPrompt(project.value, count) },
        ],
      },
    });
    const plans = normalizePlans(parseJsonObject(res.response), count);
    const batch = batchId();
    const saved = await savePlans(project.value.id, plans, batch);
    works.value = saved.works ?? [];
    await load();
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '生成失败';
  } finally {
    phase.value = 'idle';
  }
}

// ── Launch work ───────────────────────────────────────────────────────────────
async function launch(work) {
  if (!project.value) return;
  const batch = work.batch || batchId();
  errMsg.value = '';
  work.status = 'running';
  try {
    const taskRes = await createAgentTask({
      app: 'demogen',
      title: `${project.value.feature} · ${work.name}`.slice(0, 90),
      wait: false,
      meta: { type: 'demo', project_id: project.value.id, work_id: work.id, batch },
      payload: {
        messages: [
          { role: 'system', content: '你是资深前端原型工程师，擅长用原生 HTML/CSS/JS 生成真实可运行的 demo 文件。' },
          { role: 'user', content: demoPrompt(project.value, work, batch) },
        ],
      },
    });
    await launchWork(work.id, taskRes.id, batch);
    work.task_id = taskRes.id;
    work.batch = batch;
    startPoll(work);
  } catch (e) {
    work.status = 'idle';
    errMsg.value = e?.body?.message ?? e.message ?? '启动失败';
  }
}

async function launchAll() {
  if (!works.value.length) {
    await generatePlans();
    if (!works.value.length) return;
  }
  phase.value = 'launching';
  const batch = batchId();
  try {
    await Promise.all(
      works.value
        .filter(w => w.status === 'idle' || w.status === 'error' || w.status === 'aborted')
        .map(w => { w.batch = batch; return launch(w); })
    );
  } finally {
    phase.value = 'idle';
  }
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS = {
  idle:    { label: '待生成', cls: 'idle' },
  running: { label: '生成中', cls: 'running' },
  done:    { label: '完成',   cls: 'done' },
  error:   { label: '失败',   cls: 'error' },
  aborted: { label: '中止',   cls: 'aborted' },
};
const st = w => STATUS[w.status] ?? STATUS.idle;

const doneCount    = computed(() => works.value.filter(w => w.status === 'done').length);
const runningCount = computed(() => works.value.filter(w => w.status === 'running').length);

let stopWs = null;
onMounted(() => {
  load();
  stopWs = on('tasks_changed', load);
});
onBeforeUnmount(() => {
  stopWs?.();
  Object.keys(polls).forEach(stopPoll);
});
</script>

<template>
  <div class="pd-root">
    <!-- Header -->
    <header class="pd-header">
      <button class="back-btn" @click="$emit('back')">
        <span class="msi sm">arrow_back</span>
      </button>
      <div class="pd-title-group">
        <h1>{{ project?.title || project?.feature || '…' }}</h1>
        <p v-if="project?.feature && project?.title !== project?.feature" class="pd-sub">{{ project?.feature }}</p>
      </div>
      <div class="pd-actions">
        <button class="btn-outline" :disabled="phase !== 'idle'" @click="generatePlans">
          <span class="msi sm">schema</span>
          {{ phase === 'planning' ? '生成中…' : '重新生成方案' }}
        </button>
        <button class="btn-primary" :disabled="phase !== 'idle'" @click="launchAll">
          <span class="msi sm">rocket_launch</span>
          {{ phase === 'launching' ? '启动中…' : '生成全部 Demo' }}
        </button>
      </div>
    </header>

    <div v-if="errMsg" class="pd-err">{{ errMsg }}</div>

    <!-- Stats bar -->
    <div v-if="works.length" class="pd-stats">
      <span>{{ works.length }} 套方案</span>
      <span v-if="runningCount > 0" class="running">{{ runningCount }} 个生成中</span>
      <span v-if="doneCount > 0" class="done">{{ doneCount }} 个完成</span>
    </div>

    <!-- Empty state -->
    <div v-if="!works.length && phase === 'idle'" class="pd-empty">
      <span class="msi xl" style="color:#7c3aed;opacity:.35">schema</span>
      <p>还没有方案</p>
      <p class="sub">点击「重新生成方案」让 AI 规划 {{ project?.plan_count ?? 4 }} 套方向，或直接「生成全部 Demo」</p>
      <div class="pd-empty-actions">
        <button class="btn-outline" @click="generatePlans">生成方案</button>
        <button class="btn-primary" @click="launchAll">直接生成 Demo</button>
      </div>
    </div>

    <!-- Works grid -->
    <div v-else class="pd-grid">
      <article
        v-for="work in works"
        :key="work.id"
        class="work-card"
        :class="work.status"
        @click="$emit('open-work', work)"
      >
        <div class="work-card-head">
          <span class="work-badge" :class="st(work).cls">
            <span v-if="work.status === 'running'" class="msi xxs spin">autorenew</span>
            <span v-else-if="work.status === 'done'" class="msi xxs">check_circle</span>
            <span v-else-if="work.status === 'error'" class="msi xxs">cancel</span>
            {{ st(work).label }}
          </span>
          <button
            class="work-launch-btn"
            :disabled="work.status === 'running' || phase !== 'idle'"
            title="生成这套 Demo"
            @click.stop="launch(work)"
          >
            <span class="msi sm">{{ work.status === 'done' ? 'refresh' : 'play_arrow' }}</span>
          </button>
        </div>
        <h3 class="work-name">{{ work.name }}</h3>
        <p class="work-angle">{{ work.angle }}</p>
        <div v-if="work.layout || work.interactions.length" class="work-tags">
          <span v-if="work.layout">{{ work.layout }}</span>
          <span v-for="ia in work.interactions.slice(0, 2)" :key="ia">{{ ia }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.pd-root { flex: 1; min-height: 0; overflow-y: auto; padding: 24px 32px; display: flex; flex-direction: column; gap: 20px; }

/* Header */
.pd-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.back-btn { background: transparent; border: 0; color: #7a6f99; cursor: pointer; display: flex; align-items: center; padding: 6px; border-radius: 8px; }
.back-btn:hover { background: #211c30; color: #e2dff0; }
.pd-title-group { flex: 1; min-width: 0; }
h1 { margin: 0; font-size: 22px; font-weight: 750; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pd-sub { margin: 2px 0 0; font-size: 12px; color: #7a6f99; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pd-actions { display: flex; gap: 8px; flex: none; }
.pd-err { background: #3b0d0d; color: #f87171; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
.pd-stats { display: flex; gap: 12px; font-size: 12.5px; color: #5a5278; }
.pd-stats .running { color: #a78bfa; }
.pd-stats .done    { color: #4ade80; }

/* Empty */
.pd-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 320px; color: #4d4468; text-align: center; }
.pd-empty p { margin: 0; font-size: 15px; }
.pd-empty p.sub { font-size: 12.5px; color: #3a3254; max-width: 420px; }
.pd-empty-actions { display: flex; gap: 10px; margin-top: 8px; }

/* Works grid */
.pd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }

.work-card {
  background: #17131f; border: 1px solid #2a2340; border-radius: 12px;
  padding: 14px 16px; cursor: pointer; transition: border-color .15s, transform .1s;
  display: flex; flex-direction: column; gap: 8px;
}
.work-card:hover { border-color: #7c3aed; transform: translateY(-1px); }
.work-card.done { border-color: #1a3a2a; }
.work-card.done:hover { border-color: #4ade80; }
.work-card.error { border-color: #3b1010; }

.work-card-head { display: flex; align-items: center; justify-content: space-between; }
.work-badge {
  display: inline-flex; align-items: center; gap: 4px;
  border-radius: 99px; padding: 3px 9px; font-size: 11px; font-weight: 650;
}
.work-badge.idle    { background: #211c30; color: #6d5fa0; }
.work-badge.running { background: #2d1f5e; color: #a78bfa; }
.work-badge.done    { background: #14332a; color: #4ade80; }
.work-badge.error   { background: #3b0d0d; color: #f87171; }
.work-badge.aborted { background: #1e1e2e; color: #6b7280; }

.work-launch-btn {
  background: transparent; border: 0; color: #5a5278; cursor: pointer;
  display: flex; padding: 4px; border-radius: 6px;
}
.work-launch-btn:hover:not(:disabled) { background: #2a2340; color: #a78bfa; }
.work-launch-btn:disabled { opacity: .4; cursor: default; }

.work-name { margin: 0; font-size: 14px; font-weight: 700; line-height: 1.3; }
.work-angle { margin: 0; font-size: 12.5px; color: #7a6f99; line-height: 1.5; }
.work-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.work-tags span {
  background: #211c30; color: #8b7ec8; border-radius: 5px;
  padding: 2px 6px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;
}

/* Buttons */
.btn-primary, .btn-outline {
  display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 8px;
  font: inherit; font-size: 13px; font-weight: 650; cursor: pointer; padding: 9px 14px;
}
.btn-primary { background: #7c3aed; color: #fff; }
.btn-primary:hover { background: #6d28d9; }
.btn-primary:disabled { opacity: .5; cursor: default; }
.btn-outline { background: #2a2340; color: #c4b5fd; }
.btn-outline:hover { background: #34296a; }
.btn-outline:disabled { opacity: .5; cursor: default; }

.spin { animation: spin .9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
