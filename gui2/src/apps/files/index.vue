<script setup>
import { computed, onMounted, ref } from 'vue';
import { useViewStore } from '@/stores/view.js';
import * as api from '@/lib/api.js';

const view = useViewStore();

const home = ref('');
const sep = ref('/');
const cwd = ref('');
const entries = ref([]);
const showHidden = ref(false);
const loading = ref(false);
const errMsg = ref('');

const segments = computed(() => {
  if (!cwd.value) return [];
  const parts = cwd.value.split(sep.value).filter(Boolean);
  const acc = [];
  let p = '';
  for (const s of parts) {
    p = p + sep.value + s;
    acc.push({ name: s, path: p });
  }
  return acc;
});
const shortcuts = computed(() => {
  if (!home.value) return [];
  const j = (sub) => home.value + sep.value + sub;
  return [
    { name: '主目录',    path: home.value,    icon: 'home' },
    { name: '桌面',      path: j('Desktop'),  icon: 'desktop_mac' },
    { name: '下载',      path: j('Downloads'),icon: 'download' },
    { name: '文档',      path: j('Documents'),icon: 'description' },
    { name: '图片',      path: j('Pictures'), icon: 'image' }
  ];
});

async function loadHome() {
  try {
    const h = await api.get('/api/fs/home');
    home.value = h.path; sep.value = h.sep || '/';
    if (!cwd.value) cwd.value = home.value;
    await loadDir(cwd.value);
  } catch (e) { errMsg.value = '获取主目录失败: ' + (e.message || e); }
}

async function loadDir(p) {
  loading.value = true; errMsg.value = '';
  try {
    const data = await api.get('/api/fs/list', { query: { path: p, showHidden: showHidden.value ? 1 : 0 } });
    cwd.value = data.path;
    entries.value = data.entries || [];
  } catch (e) { errMsg.value = '加载目录失败: ' + (e?.body?.error || e.message || e); }
  loading.value = false;
}

function open(entry) {
  if (entry.type === 'dir' || entry.type === 'link') {
    const base = cwd.value.endsWith(sep.value) ? cwd.value : cwd.value + sep.value;
    loadDir(base + entry.name);
  } else {
    window.open('/api/fs/read?path=' + encodeURIComponent(cwd.value + sep.value + entry.name), '_blank');
  }
}

function up() {
  if (!cwd.value) return;
  const parts = cwd.value.split(sep.value).filter(Boolean);
  if (!parts.length) return;
  parts.pop();
  loadDir(sep.value + parts.join(sep.value));
}

function fmtSize(n) {
  if (!n) return '';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return n.toFixed(n >= 10 || i === 0 ? 0 : 1) + ' ' + u[i];
}
function fmtTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.toTimeString().slice(0, 5)}`;
}

function pickShortcut(p) {
  loadDir(p);
  if (window.innerWidth < 720) view.closeAppDrawer();
}

onMounted(loadHome);
</script>

<template>
  <aside class="app-side" :class="{ collapsed: !view.appDrawerOpen }">
    <div class="app-side-inner">
      <div class="head"><div class="title">文件</div></div>
      <div class="list">
        <div v-for="s in shortcuts" :key="s.path"
          class="shortcut" :class="{ active: cwd === s.path }"
          @click="pickShortcut(s.path)">
          <span class="msi sm ic">{{ s.icon }}</span>
          <span class="name">{{ s.name }}</span>
        </div>
        <div class="sep"></div>
        <label class="toggle">
          <input type="checkbox" v-model="showHidden" @change="loadDir(cwd)" />
          显示隐藏文件
        </label>
      </div>
    </div>
  </aside>

  <section class="files-pane">
    <header class="bar">
      <button class="icon-btn" title="上一级" @click="up"><span class="msi sm">arrow_upward</span></button>
      <div class="crumbs">
        <span class="crumb root" @click="loadDir(home)">~</span>
        <template v-for="seg in segments" :key="seg.path">
          <span class="sep-c">/</span>
          <span class="crumb" @click="loadDir(seg.path)">{{ seg.name }}</span>
        </template>
      </div>
      <button class="icon-btn" title="刷新" @click="loadDir(cwd)"><span class="msi sm">refresh</span></button>
    </header>

    <div v-if="errMsg" class="err">{{ errMsg }}</div>

    <div class="grid">
      <div v-if="loading" class="empty">读取中...</div>
      <div v-else-if="!entries.length" class="empty">空目录</div>
      <div v-else class="table">
        <div class="row head">
          <div class="col name">名称</div>
          <div class="col size">大小</div>
          <div class="col time">修改时间</div>
        </div>
        <div v-for="e in entries" :key="e.name" class="row" @dblclick="open(e)" @click.exact="open(e)">
          <div class="col name">
            <span class="msi sm ic" :class="e.type">
              {{ e.type === 'dir' ? 'folder' : (e.type === 'link' ? 'link' : 'description') }}
            </span>
            <span class="t">{{ e.name }}</span>
          </div>
          <div class="col size">{{ e.type === 'dir' ? '' : fmtSize(e.size) }}</div>
          <div class="col time">{{ fmtTime(e.mtime) }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.head { display: flex; align-items: center; padding: 12px 16px; gap: 8px; border-bottom: 1px solid var(--line-soft); }
.head .title { flex: 1; font-size: 16px; font-weight: 500; }
.list { flex: 1; min-height: 0; overflow-y: auto; padding: 6px 4px; }
.shortcut { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.shortcut:hover { background: var(--bg-hover); }
.shortcut.active { background: var(--accent-soft); color: var(--accent-fg); }
.shortcut .ic { color: var(--text-2); }
.shortcut.active .ic { color: var(--accent-fg); }
.shortcut .name { font-size: 13.5px; }
.sep { height: 1px; background: var(--line-soft); margin: 8px 12px; }
.toggle { display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 12.5px; color: var(--text-2); cursor: pointer; }

.files-pane { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.bar { flex: none; display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-bottom: 1px solid var(--line-soft); }
.crumbs { flex: 1; min-width: 0; display: flex; align-items: center; gap: 2px; overflow-x: auto; font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 12.5px; }
.crumb { padding: 4px 8px; border-radius: 6px; cursor: pointer; color: var(--text-2); white-space: nowrap; }
.crumb:hover { background: var(--bg-hover); color: var(--text); }
.crumb.root { color: var(--accent-fg); font-weight: 500; }
.sep-c { color: var(--text-3); }

.err { margin: 12px 16px; padding: 8px 12px; background: #fce8e6; color: var(--bad); border-radius: 8px; font-size: 12.5px; }

.grid { flex: 1; min-height: 0; overflow-y: auto; padding: 0 8px 8px; }
.empty { color: var(--text-3); padding: 40px; text-align: center; font-size: 13px; }
.table { width: 100%; }
.row { display: grid; grid-template-columns: minmax(0, 1fr) 100px 140px; align-items: center; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.row:hover:not(.head) { background: var(--bg-hover); }
.row.head { color: var(--text-3); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 12px; cursor: default; }
.col { font-size: 13px; min-width: 0; }
.col.name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.col.name .ic { color: var(--text-2); }
.col.name .ic.dir { color: var(--warn); }
.col.name .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col.size, .col.time { color: var(--text-2); font-variant-numeric: tabular-nums; }
</style>
