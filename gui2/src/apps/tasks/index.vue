<script setup>
import { computed, onActivated, onMounted, ref } from 'vue';
import { useViewStore } from '@/stores/view.js';
import * as api from '@/lib/api.js';

const view = useViewStore();

const tasks = ref([]);
const filter = ref('all');
const errMsg = ref('');
const activeId = ref(null);
const detail = ref(null);

const filtered = computed(() => {
  if (filter.value === 'all') return tasks.value;
  return tasks.value.filter((t) => (t.status || 'pending') === filter.value);
});
const counts = computed(() => {
  const acc = { all: tasks.value.length, pending: 0, running: 0, success: 0, failed: 0 };
  for (const t of tasks.value) acc[t.status] = (acc[t.status] || 0) + 1;
  return acc;
});

async function load() {
  try {
    const res = await api.get('/api/task', { query: { limit: 50 } });
    tasks.value = res?.tasks || res?.items || res || [];
    if (Array.isArray(tasks.value) === false) tasks.value = [];
  } catch (e) { errMsg.value = '加载任务失败: ' + (e.message || e); }
}

async function pick(t) {
  activeId.value = t.id;
  detail.value = null;
  if (window.innerWidth < 720) view.closeAppDrawer();
  try {
    const d = await api.get('/api/task/detail', { query: { id: t.id } });
    detail.value = d?.task || d;
  } catch (e) { detail.value = { ...t, _err: e.message || String(e) }; }
}

async function stop(id) {
  try { await api.post('/api/task/stop', { id }); await load(); }
  catch (e) { errMsg.value = '停止失败: ' + (e.message || e); }
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toTimeString().slice(0, 5)}`;
}
const statusLabel = { pending: '待执行', running: '执行中', success: '成功', failed: '失败' };

onMounted(load);
onActivated(load);
</script>

<template>
  <aside class="app-side" :class="{ collapsed: !view.appDrawerOpen }">
    <div class="app-side-inner">
      <div class="head">
        <div class="title">任务</div>
        <button class="icon-btn" title="刷新" @click="load"><span class="msi sm">refresh</span></button>
      </div>
      <div class="filters">
        <button v-for="k in ['all','pending','running','success','failed']" :key="k"
          class="chip" :class="{ active: filter === k }" @click="filter = k">
          {{ k === 'all' ? '全部' : statusLabel[k] }}
          <span class="cnt">{{ counts[k] || 0 }}</span>
        </button>
      </div>
      <div class="list">
        <div v-if="!filtered.length" class="empty">没有任务</div>
        <div v-for="t in filtered" :key="t.id" class="task" :class="{ active: t.id === activeId }" @click="pick(t)">
          <div class="row1">
            <span class="dot" :class="t.status || 'pending'"></span>
            <span class="t">{{ t.title || ('任务 #' + t.id) }}</span>
            <span class="time">{{ fmtTime(t.created_at) }}</span>
          </div>
          <div class="meta">{{ t.app }} · {{ t.mode }}</div>
        </div>
      </div>
    </div>
  </aside>

  <section class="task-pane">
    <div v-if="errMsg" class="err">{{ errMsg }}</div>
    <div v-if="!detail" class="placeholder">选一个任务查看详情</div>
    <template v-else>
      <header class="head">
        <div class="title">{{ detail.title || ('任务 #' + detail.id) }}</div>
        <span class="badge" :class="detail.status">{{ statusLabel[detail.status] || detail.status }}</span>
        <button v-if="detail.status === 'running'" class="pill-btn" @click="stop(detail.id)">停止</button>
      </header>
      <div class="meta-row">
        <span>app: <code>{{ detail.app }}</code></span>
        <span>mode: <code>{{ detail.mode }}</code></span>
        <span>创建: {{ fmtTime(detail.created_at) }}</span>
        <span v-if="detail.finished_at">完成: {{ fmtTime(detail.finished_at) }}</span>
      </div>
      <section class="card">
        <div class="section-title">Prompt</div>
        <pre class="code">{{ detail.prompt }}</pre>
      </section>
      <section v-if="detail.response" class="card">
        <div class="section-title">Response</div>
        <pre class="code">{{ typeof detail.response === 'string' ? detail.response : JSON.stringify(detail.response, null, 2) }}</pre>
      </section>
      <section v-if="detail.error" class="card err-card">
        <div class="section-title">Error</div>
        <pre class="code">{{ detail.error }}</pre>
      </section>
    </template>
  </section>
</template>

<style scoped>
.head { display: flex; align-items: center; padding: 12px 16px; gap: 8px; border-bottom: 1px solid var(--line-soft); }
.head .title { flex: 1; font-size: 16px; font-weight: 500; }

.filters { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 12px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border: 1px solid var(--line); background: transparent;
  border-radius: 14px; font-size: 12px; color: var(--text-2); cursor: pointer;
}
.chip.active { background: var(--accent-soft); color: var(--accent-fg); border-color: var(--accent-soft); }
.chip .cnt { font-size: 11px; color: var(--text-3); }
.chip.active .cnt { color: var(--accent-fg); }

.list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 8px 8px; }
.empty { padding: 30px 16px; color: var(--text-3); font-size: 12.5px; text-align: center; }
.task { padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background .12s; }
.task:hover { background: var(--bg-hover); }
.task.active { background: var(--accent-soft); }
.task .row1 { display: flex; align-items: center; gap: 8px; }
.task .t { flex: 1; font-size: 13.5px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task .time { font-size: 11.5px; color: var(--text-3); }
.task .meta { font-size: 11.5px; color: var(--text-3); margin-top: 2px; padding-left: 16px; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--text-3); }
.dot.pending { background: var(--warn); }
.dot.running { background: var(--accent); }
.dot.success { background: var(--good); }
.dot.failed  { background: var(--bad); }

.task-pane { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; padding: 0 0 24px; }
.task-pane .head { padding: 14px 24px; }
.task-pane .head .title { font-size: 17px; }
.placeholder { color: var(--text-3); padding: 60px; text-align: center; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 11.5px; background: var(--bg-elev); color: var(--text-2); }
.badge.success { background: #e6f4ea; color: var(--good); }
.badge.failed { background: #fce8e6; color: var(--bad); }
.badge.running { background: var(--accent-soft); color: var(--accent-fg); }
.badge.pending { background: #fef7e0; color: #b06000; }

.meta-row { padding: 6px 24px 12px; display: flex; gap: 16px; flex-wrap: wrap; font-size: 12.5px; color: var(--text-2); }
.meta-row code { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; background: var(--bg-elev); padding: 1px 6px; border-radius: 4px; }

.card { margin: 0 24px 12px; padding: 14px 16px; }
.code { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 12.5px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; max-height: 360px; overflow-y: auto; margin: 0; }
.err-card { background: #fff5f5; border-color: #fdd; color: var(--bad); }

.err { margin: 12px 24px 0; padding: 8px 12px; background: #fce8e6; color: var(--bad); border-radius: 8px; font-size: 12.5px; }
</style>
