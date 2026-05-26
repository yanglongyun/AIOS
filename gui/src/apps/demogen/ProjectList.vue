<script setup>
import { ref, onMounted } from 'vue';
import { listProjects, createProject, deleteProject } from './api.js';

const emit = defineEmits(['open']);

const projects = ref([]);
const loading  = ref(false);
const errMsg   = ref('');
const creating = ref(false);
const deleting = ref(null);

const form = ref({ title: '', feature: '', plan_count: 4 });
const showForm = ref(false);
const submitting = ref(false);

async function load() {
  loading.value = true;
  errMsg.value = '';
  try {
    const res = await listProjects();
    projects.value = res.projects ?? [];
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '加载失败';
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!form.value.feature.trim()) { errMsg.value = '请填写需求'; return; }
  form.value.plan_count = Math.max(1, Math.min(10, Math.round(Number(form.value.plan_count) || 4)));
  submitting.value = true;
  errMsg.value = '';
  try {
    const res = await createProject({
      title: form.value.title || form.value.feature,
      feature: form.value.feature,
      plan_count: form.value.plan_count,
    });
    showForm.value = false;
    form.value = { title: '', feature: '', plan_count: 4 };
    await load();
    emit('open', res.project);
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '创建失败';
  } finally {
    submitting.value = false;
  }
}

async function remove(project, e) {
  e.stopPropagation();
  if (!confirm(`确认删除「${project.title || project.feature}」？此操作不可撤销。`)) return;
  deleting.value = project.id;
  try {
    await deleteProject(project.id);
    projects.value = projects.value.filter(p => p.id !== project.id);
  } catch (err) {
    errMsg.value = err?.body?.message ?? err.message ?? '删除失败';
  } finally {
    deleting.value = null;
  }
}

function statusLabel(p) {
  if (p.running_count > 0) return '生成中';
  if (p.done_count > 0 && p.done_count === p.work_count) return '已完成';
  if (p.work_count > 0) return '进行中';
  if (p.status === 'planned') return '已规划';
  return '草稿';
}
function statusCls(p) {
  if (p.running_count > 0) return 'running';
  if (p.done_count > 0 && p.done_count === p.work_count) return 'done';
  if (p.work_count > 0) return 'partial';
  return 'draft';
}
function relTime(ts) {
  if (!ts) return '';
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return '刚刚';
  if (d < 3600000) return Math.floor(d / 60000) + ' 分前';
  if (d < 86400000) return Math.floor(d / 3600000) + ' 小时前';
  return Math.floor(d / 86400000) + ' 天前';
}

onMounted(load);
</script>

<template>
  <div class="pl-root">
    <header class="pl-header">
      <div>
        <h1>Demo 生成器</h1>
        <p class="pl-sub">用 AI 一次生成多套可比较的 Demo 方案</p>
      </div>
      <button class="btn-primary" @click="showForm = true">
        <span class="msi sm">add</span>新建项目
      </button>
    </header>

    <div v-if="errMsg" class="pl-err">{{ errMsg }}</div>

    <!-- Empty -->
    <div v-if="!loading && !projects.length && !showForm" class="pl-empty">
      <span class="msi xl" style="color:#7c3aed;opacity:.4">view_carousel</span>
      <p>还没有项目</p>
      <button class="btn-primary" @click="showForm = true">创建第一个项目</button>
    </div>

    <!-- Project grid -->
    <div v-else class="pl-grid">
      <article
        v-for="p in projects"
        :key="p.id"
        class="pl-card"
        @click="$emit('open', p)"
      >
        <div class="pl-card-head">
          <span class="pl-badge" :class="statusCls(p)">{{ statusLabel(p) }}</span>
          <button class="pl-del" :disabled="deleting === p.id" title="删除" @click="remove(p, $event)">
            <span class="msi sm">delete</span>
          </button>
        </div>
        <h2 class="pl-card-title">{{ p.title || p.feature }}</h2>
        <p class="pl-card-feature">{{ p.feature }}</p>
        <div class="pl-card-footer">
          <span>{{ p.work_count }} 套作品</span>
          <span v-if="p.work_count">{{ p.done_count }}/{{ p.work_count }} 完成</span>
          <span class="pl-time">{{ relTime(p.created_at) }}</span>
        </div>
      </article>
    </div>

    <!-- Create form modal -->
    <div v-if="showForm" class="pl-modal-bg" @click.self="showForm = false">
      <div class="pl-modal">
        <div class="pl-modal-head">
          <h2>新建项目</h2>
          <button class="pl-icon-btn" @click="showForm = false"><span class="msi sm">close</span></button>
        </div>
        <div v-if="errMsg" class="pl-err sm">{{ errMsg }}</div>
        <div class="pl-modal-body">
          <label class="field">
            <span>标题</span>
            <input v-model="form.title" placeholder="项目名称" autofocus />
          </label>
          <label class="field">
            <span>需求 *</span>
            <input v-model="form.feature" placeholder="例：用户登录页面、支付流程、文件上传" />
          </label>
          <label class="field">
            <span>数量（最多 10）</span>
            <input v-model.number="form.plan_count" type="number" min="1" max="10" />
          </label>
        </div>
        <div class="pl-modal-foot">
          <button class="btn-ghost" @click="showForm = false">取消</button>
          <button class="btn-primary" :disabled="submitting" @click="submit">
            {{ submitting ? '创建中…' : '创建项目' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pl-root { flex: 1; min-height: 0; overflow-y: auto; padding: 32px; }
.pl-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
h1 { margin: 0; font-size: 26px; font-weight: 750; letter-spacing: -.02em; }
.pl-sub { margin: 4px 0 0; font-size: 13px; color: #7a6f99; }
.pl-err { background: #3b0d0d; color: #f87171; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
.pl-err.sm { margin-bottom: 0; }
.pl-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-height: 360px; color: #4d4468; }
.pl-empty p { margin: 0; font-size: 15px; }
.pl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

.pl-card {
  background: #17131f; border: 1px solid #2a2340; border-radius: 12px;
  padding: 16px 18px; cursor: pointer; transition: border-color .15s, transform .1s;
  display: flex; flex-direction: column; gap: 8px;
}
.pl-card:hover { border-color: #7c3aed; transform: translateY(-1px); }
.pl-card-head { display: flex; align-items: center; justify-content: space-between; }
.pl-badge { border-radius: 99px; padding: 3px 9px; font-size: 11px; font-weight: 650; }
.pl-badge.draft   { background: #211c30; color: #6d5fa0; }
.pl-badge.planned { background: #1e2d4a; color: #60a5fa; }
.pl-badge.running { background: #2d1f5e; color: #a78bfa; }
.pl-badge.partial { background: #1a2e3b; color: #38bdf8; }
.pl-badge.done    { background: #14332a; color: #4ade80; }
.pl-del { background: transparent; border: 0; color: #4d4468; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; }
.pl-del:hover { color: #f87171; background: #2a1a1a; }
.pl-card-title { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.pl-card-feature { margin: 0; font-size: 12.5px; color: #7a6f99; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pl-card-footer { display: flex; gap: 10px; font-size: 11.5px; color: #5a5278; margin-top: 4px; }
.pl-time { margin-left: auto; }

/* Modal */
.pl-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
.pl-modal { background: #17131f; border: 1px solid #2a2340; border-radius: 14px; width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.pl-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 14px; border-bottom: 1px solid #2a2340; }
.pl-modal-head h2 { margin: 0; font-size: 16px; font-weight: 700; }
.pl-icon-btn { background: transparent; border: 0; color: #7a6f99; cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
.pl-icon-btn:hover { background: #2a2340; color: #e2dff0; }
.pl-modal-body { flex: 1; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; gap: 13px; }
.pl-modal-foot { display: flex; gap: 8px; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid #2a2340; }
.field { display: grid; gap: 5px; }
.field span { font-size: 11px; font-weight: 650; color: #7a6f99; }
input, textarea {
  background: #0f0d14; color: #e2dff0; border: 1px solid #2a2340; border-radius: 7px;
  font: inherit; font-size: 13px; padding: 8px 10px; outline: 0; width: 100%;
  transition: border-color .15s;
}
textarea { resize: vertical; line-height: 1.55; }
input:focus, textarea:focus { border-color: #7c3aed; }

/* Buttons */
.btn-primary, .btn-ghost {
  display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 8px;
  font: inherit; font-size: 13px; font-weight: 650; cursor: pointer;
  padding: 9px 16px; transition: background .15s;
}
.btn-primary { background: #7c3aed; color: #fff; }
.btn-primary:hover { background: #6d28d9; }
.btn-primary:disabled { opacity: .5; cursor: default; }
.btn-ghost { background: #211c30; color: #a89cc8; }
.btn-ghost:hover { background: #2a2340; }
</style>
