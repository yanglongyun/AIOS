<script setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue';
import { useViewStore } from '@/stores/view.js';
import * as api from '@/utils/api.js';
import AppsTrigger from '@/components/AppsTrigger.vue';
import ChatTrigger from '@/components/ChatTrigger.vue';

const view = useViewStore();

const tasks = ref([]);
const filter = ref('all');
const errMsg = ref('');
const expandedId = ref(null);
const detailCache = new Map();   // id -> 详情(避免每次 expand 都重拉)
const detailFor = ref(null);
const loading = ref(false);

const newTitle = ref('');
const submitting = ref(false);
const showCompleted = ref(true);

const filters = [
  { id: 'all',     name: '所有任务',  icon: 'inbox' },
  { id: 'mine',    name: '我创建的',  icon: 'person' },
  { id: 'running', name: '运行中',    icon: 'autorenew' },
  { id: 'success', name: '成功',      icon: 'check_circle' },
  { id: 'failed',  name: '失败',      icon: 'cancel' }
];

function isMine(t) {
  // 没有 rerunOf 元信息的认为是用户手动创建的
  if (!t.meta) return true;
  try {
    const m = typeof t.meta === 'string' ? JSON.parse(t.meta) : t.meta;
    return !m?.rerunOf;
  } catch { return true; }
}

function applyFilter(list) {
  switch (filter.value) {
    case 'mine':    return list.filter(isMine);
    case 'running': return list.filter((t) => t.status === 'running' || t.status === 'pending');
    case 'success': return list.filter((t) => t.status === 'success');
    case 'failed':  return list.filter((t) => t.status === 'failed');
    default:        return list;
  }
}

const counts = computed(() => ({
  all:     tasks.value.length,
  mine:    tasks.value.filter(isMine).length,
  running: tasks.value.filter((t) => t.status === 'running' || t.status === 'pending').length,
  success: tasks.value.filter((t) => t.status === 'success').length,
  failed:  tasks.value.filter((t) => t.status === 'failed').length
}));

const visibleTasks = computed(() => applyFilter(tasks.value));
const openTasks = computed(() => visibleTasks.value.filter((t) => t.status === 'pending' || t.status === 'running'));
const doneTasks = computed(() => visibleTasks.value.filter((t) => t.status === 'success' || t.status === 'failed'));

const STATUS = {
  pending: { label: '待执行', icon: 'schedule',     cls: 'pending' },
  running: { label: '执行中', icon: 'autorenew',    cls: 'running' },
  success: { label: '成功',   icon: 'check_circle', cls: 'success' },
  failed:  { label: '失败',   icon: 'cancel',       cls: 'failed' }
};
function st(t) { return STATUS[t.status || 'pending'] || STATUS.pending; }

// ── 加载 ──
async function load() {
  loading.value = true;
  try {
    const res = await api.get('/api/task', { query: { limit: 200 } });
    tasks.value = Array.isArray(res) ? res : (res?.tasks || res?.items || []);
    // 如果当前展开的项还在,顺便刷新它的 detail
    if (expandedId.value) {
      const fresh = tasks.value.find((t) => t.id === expandedId.value);
      if (fresh) {
        detailCache.set(expandedId.value, fresh);
        detailFor.value = fresh;
      }
    }
  } catch (e) { errMsg.value = '加载任务失败: ' + (e?.body?.message || e.message || e); }
  loading.value = false;
}

// ── 自动轮询 (有 running 时) ──
let pollTimer = null;
watch(() => tasks.value.some((t) => t.status === 'running'), (busy) => {
  clearInterval(pollTimer); pollTimer = null;
  if (busy) pollTimer = setInterval(load, 4000);
});

// ── 展开详情 ──
async function toggleExpand(t) {
  if (expandedId.value === t.id) {
    expandedId.value = null;
    detailFor.value = null;
    return;
  }
  expandedId.value = t.id;
  detailFor.value = detailCache.get(t.id) || t;
  try {
    const d = await api.get('/api/task/detail', { query: { id: t.id } });
    const taskObj = d?.task || d;
    detailCache.set(t.id, taskObj);
    if (expandedId.value === t.id) detailFor.value = taskObj;
  } catch {}
}

// ── 创建 ──
async function addTask() {
  const t = newTitle.value.trim();
  if (!t || submitting.value) return;
  submitting.value = true; errMsg.value = '';
  try {
    const data = await api.post('/api/task/create/agent', {
      app:    'tasks',
      title:  t.slice(0, 80),
      prompt: t,
      meta:   null,
      wait:   false
    });
    newTitle.value = '';
    await load();
    if (data?.id) {
      expandedId.value = data.id;
      detailFor.value = tasks.value.find((x) => x.id === data.id) || null;
    }
  } catch (e) { errMsg.value = '创建失败: ' + (e?.body?.message || e.message || e); }
  submitting.value = false;
}

// ── 操作 ──
async function stopTask(id, e) {
  e?.stopPropagation();
  try { await api.post('/api/task/stop', { id }); await load(); }
  catch (err) { errMsg.value = '停止失败: ' + (err?.body?.message || err.message || err); }
}
async function rerun(t, e) {
  e?.stopPropagation();
  try {
    const data = await api.post('/api/task/create/agent', {
      app:    t.app || 'tasks',
      title:  t.title || (t.prompt || '').slice(0, 80),
      prompt: t.prompt,
      meta:   { rerunOf: t.id },
      wait:   false
    });
    await load();
    if (data?.id) { expandedId.value = data.id; detailFor.value = tasks.value.find((x) => x.id === data.id) || null; }
  } catch (err) { errMsg.value = '重跑失败: ' + (err?.body?.message || err.message || err); }
}

function pickFilter(id) {
  filter.value = id;
  expandedId.value = null;
  detailFor.value = null;
  if (window.innerWidth < 720) view.closeAppDrawer();
}

function relTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  const diffSec = (Date.now() - d.getTime()) / 1000;
  if (diffSec < 60) return Math.round(diffSec) + 's 前';
  if (diffSec < 3600) return Math.round(diffSec / 60) + ' 分前';
  if (diffSec < 86400) return Math.round(diffSec / 3600) + ' 小时前';
  return Math.round(diffSec / 86400) + ' 天前';
}
function preview(s, n = 80) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}

onMounted(load);
onActivated(load);
onDeactivated(() => { clearInterval(pollTimer); pollTimer = null; });
onBeforeUnmount(() => { clearInterval(pollTimer); pollTimer = null; });
</script>

<template>
  <div class="app-frame">
    <header class="topbar">
      <button class="icon-btn lg" :class="{ active: view.appDrawerOpen }"
        @click="view.toggleAppDrawer()" title="侧栏">
        <span class="msi">menu</span>
      </button>
      <div class="brand"><span class="name">任务</span></div>
      <div class="right">
        <ChatTrigger />
        <AppsTrigger />
      </div>
    </header>
    <div class="app-body">
      <aside class="app-side" :class="{ collapsed: !view.appDrawerOpen }">
    <div class="app-side-inner">
      <div v-for="f in filters" :key="f.id"
        class="list-item"
        :class="{ active: f.id === filter }"
        @click="pickFilter(f.id)">
        <span class="msi sm ic">{{ f.icon }}</span>
        <span class="label">{{ f.name }}</span>
        <span class="cnt" v-if="counts[f.id]">{{ counts[f.id] }}</span>
      </div>
    </div>
  </aside>

  <section class="page">
    <div class="inner">
      <!-- 添加任务 -->
      <form class="add" @submit.prevent="addTask">
        <span class="msi" :style="{ color: submitting ? 'var(--text-3)' : 'var(--accent)' }">
          {{ submitting ? 'hourglass_top' : 'add' }}
        </span>
        <input v-model="newTitle"
          :placeholder="submitting ? '创建中…' : '添加任务,Enter 让 AI 立刻去做'"
          :disabled="submitting" />
      </form>

      <div v-if="errMsg" class="err-bar">{{ errMsg }}</div>

      <!-- 进行中 -->
      <template v-if="openTasks.length">
        <div v-for="t in openTasks" :key="t.id"
          class="task" :class="[st(t).cls, { expanded: expandedId === t.id }]"
          @click="toggleExpand(t)">
          <button class="check" :class="st(t).cls" @click.stop>
            <span v-if="t.status === 'running'" class="msi xxs">autorenew</span>
            <span v-else-if="t.status === 'success'" class="msi xxs">check</span>
            <span v-else-if="t.status === 'failed'" class="msi xxs">close</span>
          </button>
          <div class="body">
            <div class="title">{{ t.title || (t.prompt || '').slice(0, 80) || '(空)' }}</div>
            <div v-if="t.prompt && t.prompt !== t.title" class="detail">{{ preview(t.prompt) }}</div>
            <div class="meta">
              <span class="badge" :class="st(t).cls">
                <span class="msi xxs">{{ st(t).icon }}</span>
                {{ st(t).label }}
              </span>
              <span class="app-tag">{{ t.app }}</span>
              <span class="time">{{ relTime(t.created_at) }}</span>
            </div>
            <div v-if="expandedId === t.id" class="expand">
              <div v-if="detailFor?.prompt" class="block">
                <div class="block-h">Prompt</div>
                <pre>{{ detailFor.prompt }}</pre>
              </div>
              <div v-if="detailFor?.response" class="block">
                <div class="block-h">Response</div>
                <pre>{{ typeof detailFor.response === 'string' ? detailFor.response : JSON.stringify(detailFor.response, null, 2) }}</pre>
              </div>
              <div v-if="detailFor?.error" class="block err">
                <div class="block-h">Error</div>
                <pre>{{ detailFor.error }}</pre>
              </div>
            </div>
          </div>
          <div class="actions" @click.stop>
            <button v-if="t.status === 'running'" class="act danger" title="停止" @click="stopTask(t.id, $event)">
              <span class="msi sm">stop</span>
            </button>
            <button class="act" title="重跑" @click="rerun(t, $event)">
              <span class="msi sm">replay</span>
            </button>
          </div>
        </div>
      </template>

      <!-- 已完成(只在 all/mine 时折叠展示) -->
      <template v-if="(filter === 'all' || filter === 'mine') && doneTasks.length">
        <button class="completed-toggle" @click="showCompleted = !showCompleted">
          <span class="msi sm" :style="{ transform: showCompleted ? '' : 'rotate(-90deg)' }">expand_more</span>
          <span>已完成 ({{ doneTasks.length }})</span>
        </button>
        <div v-if="showCompleted">
          <div v-for="t in doneTasks" :key="t.id"
            class="task done" :class="[st(t).cls, { expanded: expandedId === t.id }]"
            @click="toggleExpand(t)">
            <button class="check" :class="st(t).cls" @click.stop>
              <span v-if="t.status === 'success'" class="msi xxs">check</span>
              <span v-else class="msi xxs">close</span>
            </button>
            <div class="body">
              <div class="title">{{ t.title || (t.prompt || '').slice(0, 80) || '(空)' }}</div>
              <div v-if="t.prompt && t.prompt !== t.title" class="detail">{{ preview(t.prompt) }}</div>
              <div class="meta">
                <span class="app-tag">{{ t.app }}</span>
                <span class="time">{{ relTime(t.created_at) }}</span>
              </div>
              <div v-if="expandedId === t.id" class="expand">
                <div v-if="detailFor?.prompt" class="block">
                  <div class="block-h">Prompt</div>
                  <pre>{{ detailFor.prompt }}</pre>
                </div>
                <div v-if="detailFor?.response" class="block">
                  <div class="block-h">Response</div>
                  <pre>{{ typeof detailFor.response === 'string' ? detailFor.response : JSON.stringify(detailFor.response, null, 2) }}</pre>
                </div>
                <div v-if="detailFor?.error" class="block err">
                  <div class="block-h">Error</div>
                  <pre>{{ detailFor.error }}</pre>
                </div>
              </div>
            </div>
            <div class="actions" @click.stop>
              <button class="act" title="重跑" @click="rerun(t, $event)">
                <span class="msi sm">replay</span>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 单状态过滤下没有"已完成"折叠,直接平铺 -->
      <template v-if="filter !== 'all' && filter !== 'mine'">
        <div v-for="t in doneTasks" :key="t.id"
          class="task" :class="[st(t).cls, { expanded: expandedId === t.id }]"
          @click="toggleExpand(t)">
          <button class="check" :class="st(t).cls" @click.stop>
            <span v-if="t.status === 'success'" class="msi xxs">check</span>
            <span v-else class="msi xxs">close</span>
          </button>
          <div class="body">
            <div class="title">{{ t.title || (t.prompt || '').slice(0, 80) || '(空)' }}</div>
            <div v-if="t.prompt && t.prompt !== t.title" class="detail">{{ preview(t.prompt) }}</div>
            <div class="meta">
              <span class="app-tag">{{ t.app }}</span>
              <span class="time">{{ relTime(t.created_at) }}</span>
            </div>
            <div v-if="expandedId === t.id" class="expand">
              <div v-if="detailFor?.prompt" class="block">
                <div class="block-h">Prompt</div>
                <pre>{{ detailFor.prompt }}</pre>
              </div>
              <div v-if="detailFor?.response" class="block">
                <div class="block-h">Response</div>
                <pre>{{ typeof detailFor.response === 'string' ? detailFor.response : JSON.stringify(detailFor.response, null, 2) }}</pre>
              </div>
              <div v-if="detailFor?.error" class="block err">
                <div class="block-h">Error</div>
                <pre>{{ detailFor.error }}</pre>
              </div>
            </div>
          </div>
          <div class="actions" @click.stop>
            <button class="act" title="重跑" @click="rerun(t, $event)">
              <span class="msi sm">replay</span>
            </button>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-if="!visibleTasks.length && !loading" class="empty">
        <span class="msi" style="font-size:48px;color:var(--text-3)">task_alt</span>
        <div>{{ filter === 'all' ? '还没有任务,在上面添加一条试试' : '当前过滤条件下没有任务' }}</div>
      </div>
    </div>
  </section>
    </div>
  </div>
</template>

<style scoped>
/* ─── 自有顶栏 ─── */
.topbar {
  flex: none; height: 64px;
  display: flex; align-items: center;
  padding: 8px 16px;
  background: var(--bg);
}
.topbar .brand { flex: 1; min-width: 0; margin: 0 4px 0 12px; }
.topbar .brand .name { font-size: 20px; font-weight: 500; letter-spacing: -0.01em; }
.topbar .right { display: flex; align-items: center; gap: 4px; margin-left: auto; }
@media (max-width: 720px) {
  .topbar { padding: 8px; height: 56px; }
  .topbar .brand .name { font-size: 17px; }
}

/* ─── 左侧 rail (Google Tasks 风) ─── */
.app-side { background: var(--bg); }
.list-item {
  display: flex; align-items: center;
  gap: 14px;
  height: 40px;
  padding: 0 14px 0 24px;
  margin: 2px 12px 2px 0;
  border-radius: 0 20px 20px 0;
  color: var(--text);
  font-size: 14px; font-weight: 500;
  cursor: pointer;
  transition: background .15s;
}
.list-item:hover { background: var(--bg-hover); }
.list-item.active { background: var(--accent-soft); color: var(--accent-fg); }
.list-item .ic { color: var(--text-2); }
.list-item.active .ic { color: var(--accent-fg); }
.list-item .label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.list-item .cnt {
  font-size: 11.5px; color: var(--text-3);
  background: var(--bg-elev);
  padding: 1px 8px;
  border-radius: 10px;
  font-variant-numeric: tabular-nums;
}
.list-item.active .cnt { background: rgba(255,255,255,0.5); color: var(--accent-fg); }

/* ─── 主区 ─── */
.page { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; padding: 0 24px 80px; background: var(--bg); }
.inner { max-width: 720px; margin: 0 auto; padding: 16px 0; }

/* 添加输入框 */
.add {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  margin: 8px 0 12px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(60,64,67,0.06), 0 1px 3px rgba(60,64,67,0.04);
  transition: border-color .15s, box-shadow .15s;
}
.add:hover  { box-shadow: 0 1px 3px rgba(60,64,67,0.10), 0 4px 10px rgba(60,64,67,0.06); }
.add:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft), 0 1px 3px rgba(60,64,67,0.06);
}
.add input {
  flex: 1; border: 0; background: transparent; outline: 0;
  font-size: 14px;
  color: var(--text);
}
.add input::placeholder { color: var(--text-3); font-weight: 400; }
.add input:disabled { color: var(--text-3); }

.err-bar { margin: 8px 0; padding: 10px 14px; background: #fce8e6; color: var(--bad); border-radius: 10px; font-size: 12.5px; }

/* ─── 任务行 ─── */
.task {
  display: flex; align-items: flex-start;
  gap: 12px;
  padding: 12px 12px;
  border-bottom: 1px solid var(--line-soft);
  transition: background .15s;
  cursor: pointer;
  position: relative;
}
.task:hover { background: var(--bg-hover); }
.task.expanded { background: var(--bg-hover); }

.check {
  flex: none; width: 22px; height: 22px;
  margin-top: 2px;
  border: 2px solid var(--text-2);
  border-radius: 50%;
  background: transparent;
  cursor: default;
  display: grid; place-items: center;
  color: #fff;
  transition: border-color .15s, background .15s;
}
.check.pending { border-color: var(--text-3); background: transparent; }
.check.running { border-color: var(--accent); }
.check.running .msi { color: var(--accent); animation: spin 1.4s linear infinite; }
.check.success { border-color: var(--good); background: var(--good); }
.check.failed  { border-color: var(--bad);  background: var(--bad); }
@keyframes spin { to { transform: rotate(360deg); } }

.body { flex: 1; min-width: 0; }
.title { font-size: 14px; line-height: 1.5; color: var(--text); word-break: break-word; }
.task.success .title, .task.failed .title { color: var(--text-3); }
.detail { font-size: 12.5px; color: var(--text-2); margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task.expanded .detail { white-space: normal; overflow: visible; }

.meta { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 11.5px; color: var(--text-3); }
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 10px;
  font-size: 11px; font-weight: 500;
}
.badge.pending { background: #fef7e0; color: #b06000; }
.badge.running { background: var(--accent-soft); color: var(--accent-fg); }
.badge.success { background: #e6f4ea; color: var(--good); }
.badge.failed  { background: #fce8e6; color: var(--bad); }
.app-tag {
  padding: 1px 7px; background: var(--bg-elev); border-radius: 4px;
  font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 10.5px;
  color: var(--text-2);
}

/* 操作按钮 */
.actions {
  display: flex; gap: 2px; flex: none;
  opacity: 0; transition: opacity .15s;
  margin: -2px -6px 0 0;
}
.task:hover .actions, .task.expanded .actions { opacity: 1; }
.task.running .actions { opacity: 1; }
.act {
  width: 32px; height: 32px;
  border: 0; background: transparent;
  color: var(--text-3);
  border-radius: 50%;
  display: grid; place-items: center;
  cursor: pointer;
  transition: background .15s, color .15s;
}
.act:hover { background: rgba(0,0,0,0.06); color: var(--text); }
.act.danger:hover { background: rgba(217,48,37,0.1); color: var(--bad); }

/* 展开详情区 */
.expand {
  margin-top: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.block { background: #fafbfc; border-radius: 10px; padding: 10px 14px; }
.block.err { background: #fff3f2; }
.block-h {
  font-size: 10.5px; color: var(--text-3);
  letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500;
  margin-bottom: 4px;
}
.block.err .block-h { color: var(--bad); }
.block pre {
  margin: 0;
  font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  font-size: 12px; line-height: 1.55;
  white-space: pre-wrap; word-break: break-word;
  color: var(--text);
  max-height: 320px; overflow-y: auto;
}

/* 已完成 折叠 */
.completed-toggle {
  display: flex; align-items: center; gap: 8px;
  margin: 24px 0 4px;
  padding: 8px 12px;
  border: 0; background: transparent;
  font-size: 14px; font-weight: 500;
  color: var(--text);
  border-radius: 8px;
  width: 100%; text-align: left;
  cursor: pointer;
}
.completed-toggle:hover { background: var(--bg-hover); }
.completed-toggle .msi { transition: transform .15s; color: var(--text-2); }

/* 空态 */
.empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 80px 20px;
  color: var(--text-3); font-size: 13.5px;
}

@media (max-width: 720px) {
  .page { padding: 0 12px 80px; }
}
</style>
