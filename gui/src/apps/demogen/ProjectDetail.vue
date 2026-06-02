<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
  getProject, generatePlan, buildAll, buildWork, resolveWork, getTaskDetail,
} from './api.js';
import { on } from '@/system/ws.js';

const props = defineProps({ projectId: { type: Number, required: true } });
const emit = defineEmits(['back', 'open-work', 'open-compare']);

const project = ref(null);
const works = ref([]);
const errMsg = ref('');
const phase = ref('idle'); // idle | planning | building

const STATUS = {
  idle:    { label: '待生成', cls: 'idle' },
  running: { label: '生成中', cls: 'running' },
  done:    { label: '完成',   cls: 'done' },
  error:   { label: '失败',   cls: 'error' },
  aborted: { label: '中止',   cls: 'aborted' },
};
const st = (w) => STATUS[w.status] ?? STATUS.idle;

const doneCount = computed(() => works.value.filter((w) => w.status === 'done').length);
const runningCount = computed(() => works.value.filter((w) => w.status === 'running').length);
const canCompare = computed(() => doneCount.value >= 1);

async function load() {
  errMsg.value = '';
  try {
    const res = await getProject(props.projectId);
    project.value = res.project;
    works.value = res.works ?? [];
    works.value.filter((w) => w.status === 'running' && w.task_id).forEach(startPoll);
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '加载失败';
  }
}

// ── Task polling → resolve on completion ───────────────────────────────────────
const polls = {};

async function pollOnce(work) {
  try {
    const res = await getTaskDetail(work.task_id);
    const task = res.task ?? res;
    const taskStatus = task.status; // pending | done | error | aborted
    if (taskStatus && taskStatus !== 'pending') {
      stopPoll(work.id);
      const updated = await resolveWork(work.id, taskStatus);
      replaceWork(updated.work);
    }
  } catch { /* keep polling */ }
}

function startPoll(work) {
  if (polls[work.id]) return;
  polls[work.id] = setInterval(() => {
    const w = works.value.find((x) => x.id === work.id);
    if (!w || w.status !== 'running' || !w.task_id) { stopPoll(work.id); return; }
    pollOnce(w);
  }, 3000);
}

function stopPoll(workId) {
  if (!polls[workId]) return;
  clearInterval(polls[workId]);
  delete polls[workId];
}

function replaceWork(fresh) {
  if (!fresh) return;
  const i = works.value.findIndex((w) => w.id === fresh.id);
  if (i >= 0) works.value[i] = fresh;
  if (fresh.status === 'running' && fresh.task_id) startPoll(fresh);
}

// ── Actions ─────────────────────────────────────────────────────────────────────
async function doPlan() {
  phase.value = 'planning';
  errMsg.value = '';
  try {
    const res = await generatePlan(props.projectId);
    works.value = res.works ?? [];
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '生成方案失败';
  } finally {
    phase.value = 'idle';
  }
}

async function doBuildAll() {
  phase.value = 'building';
  errMsg.value = '';
  try {
    if (!works.value.length) {
      const res = await generatePlan(props.projectId);
      works.value = res.works ?? [];
    }
    const res = await buildAll(props.projectId);
    works.value = res.works ?? [];
    works.value.filter((w) => w.status === 'running' && w.task_id).forEach(startPoll);
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '启动生成失败';
  } finally {
    phase.value = 'idle';
  }
}

async function doBuildOne(work, e) {
  e?.stopPropagation();
  errMsg.value = '';
  try {
    const res = await buildWork(work.id);
    replaceWork(res.work);
  } catch (err) {
    errMsg.value = err?.body?.message ?? err.message ?? '启动失败';
  }
}

let stopWs = null;
onMounted(() => {
  load();
  stopWs = on('tasks_changed', () => {
    works.value.filter((w) => w.status === 'running' && w.task_id).forEach(pollOnce);
  });
});
onBeforeUnmount(() => {
  stopWs?.();
  Object.keys(polls).forEach(stopPoll);
});
</script>

<template>
  <div class="pd-root">
    <header class="pd-header">
      <button class="back-btn" @click="$emit('back')"><span class="msi sm">arrow_back</span></button>
      <div class="pd-title-group">
        <h1>{{ project?.title || project?.feature || '…' }}</h1>
        <p v-if="project?.feature && project?.title !== project?.feature" class="pd-sub">{{ project?.feature }}</p>
      </div>
      <div class="pd-actions">
        <button class="btn-outline" :disabled="phase !== 'idle'" @click="doPlan">
          <span class="msi sm">schema</span>{{ phase === 'planning' ? '生成中…' : '重新规划方案' }}
        </button>
        <button class="btn-primary" :disabled="phase !== 'idle'" @click="doBuildAll">
          <span class="msi sm">rocket_launch</span>{{ phase === 'building' ? '启动中…' : '生成全部 Demo' }}
        </button>
        <button class="btn-compare" :disabled="!canCompare" @click="$emit('open-compare')">
          <span class="msi sm">grid_view</span>并排对比
        </button>
      </div>
    </header>

    <div v-if="errMsg" class="pd-err">{{ errMsg }}</div>

    <div v-if="works.length" class="pd-stats">
      <span>{{ works.length }} 套方案</span>
      <span v-if="runningCount > 0" class="running">{{ runningCount }} 个生成中</span>
      <span v-if="doneCount > 0" class="done">{{ doneCount }} 个完成</span>
    </div>

    <div v-if="!works.length && phase === 'idle'" class="pd-empty">
      <span class="msi xl" style="color:#7c3aed;opacity:.35">schema</span>
      <p>还没有方案</p>
      <p class="sub">让 AI 规划 {{ project?.plan_count ?? 4 }} 套差异明显的方向，并发生成后并排对比。</p>
      <div class="pd-empty-actions">
        <button class="btn-outline" @click="doPlan">先规划方案</button>
        <button class="btn-primary" @click="doBuildAll">直接生成全部</button>
      </div>
    </div>

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
            :disabled="work.status === 'running'"
            :title="work.status === 'done' ? '重新生成' : '生成这套 Demo'"
            @click.stop="doBuildOne(work, $event)"
          >
            <span class="msi sm">{{ work.status === 'done' ? 'refresh' : 'play_arrow' }}</span>
          </button>
        </div>
        <h3 class="work-name">{{ work.name }}</h3>
        <p class="work-angle">{{ work.angle }}</p>
        <div v-if="work.highlights?.length" class="work-tags">
          <span v-for="h in work.highlights.slice(0, 3)" :key="h">{{ h }}</span>
        </div>
        <p v-if="work.status === 'error' && work.error" class="work-error">{{ work.error }}</p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.pd-root { flex: 1; min-height: 0; overflow-y: auto; padding: 24px 32px; display: flex; flex-direction: column; gap: 20px; }
.pd-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.back-btn { background: transparent; border: 0; color: #7a6f99; cursor: pointer; display: flex; align-items: center; padding: 6px; border-radius: 8px; }
.back-btn:hover { background: #211c30; color: #e2dff0; }
.pd-title-group { flex: 1; min-width: 0; }
h1 { margin: 0; font-size: 22px; font-weight: 750; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pd-sub { margin: 2px 0 0; font-size: 12px; color: #7a6f99; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pd-actions { display: flex; gap: 8px; flex: none; flex-wrap: wrap; }
.pd-err { background: #3b0d0d; color: #f87171; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
.pd-stats { display: flex; gap: 12px; font-size: 12.5px; color: #5a5278; }
.pd-stats .running { color: #a78bfa; }
.pd-stats .done { color: #4ade80; }

.pd-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 320px; color: #4d4468; text-align: center; }
.pd-empty p { margin: 0; font-size: 15px; }
.pd-empty p.sub { font-size: 12.5px; color: #3a3254; max-width: 440px; }
.pd-empty-actions { display: flex; gap: 10px; margin-top: 8px; }

.pd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.work-card { background: #17131f; border: 1px solid #2a2340; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: border-color .15s, transform .1s; display: flex; flex-direction: column; gap: 8px; }
.work-card:hover { border-color: #7c3aed; transform: translateY(-1px); }
.work-card.done { border-color: #1a3a2a; }
.work-card.done:hover { border-color: #4ade80; }
.work-card.error { border-color: #3b1010; }
.work-card-head { display: flex; align-items: center; justify-content: space-between; }
.work-badge { display: inline-flex; align-items: center; gap: 4px; border-radius: 99px; padding: 3px 9px; font-size: 11px; font-weight: 650; }
.work-badge.idle { background: #211c30; color: #6d5fa0; }
.work-badge.running { background: #2d1f5e; color: #a78bfa; }
.work-badge.done { background: #14332a; color: #4ade80; }
.work-badge.error { background: #3b0d0d; color: #f87171; }
.work-badge.aborted { background: #1e1e2e; color: #6b7280; }
.work-launch-btn { background: transparent; border: 0; color: #5a5278; cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
.work-launch-btn:hover:not(:disabled) { background: #2a2340; color: #a78bfa; }
.work-launch-btn:disabled { opacity: .4; cursor: default; }
.work-name { margin: 0; font-size: 14px; font-weight: 700; line-height: 1.3; }
.work-angle { margin: 0; font-size: 12.5px; color: #7a6f99; line-height: 1.5; }
.work-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.work-tags span { background: #211c30; color: #8b7ec8; border-radius: 5px; padding: 2px 6px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.work-error { margin: 0; font-size: 11.5px; color: #f87171; }

.btn-primary, .btn-outline, .btn-compare {
  display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 8px;
  font: inherit; font-size: 13px; font-weight: 650; cursor: pointer; padding: 9px 14px;
}
.btn-primary { background: #7c3aed; color: #fff; }
.btn-primary:hover { background: #6d28d9; }
.btn-primary:disabled { opacity: .5; cursor: default; }
.btn-outline { background: #2a2340; color: #c4b5fd; }
.btn-outline:hover { background: #34296a; }
.btn-outline:disabled { opacity: .5; cursor: default; }
.btn-compare { background: #1a2e3b; color: #38bdf8; }
.btn-compare:hover:not(:disabled) { background: #1e3a4a; }
.btn-compare:disabled { opacity: .4; cursor: default; }

.spin { animation: spin .9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
