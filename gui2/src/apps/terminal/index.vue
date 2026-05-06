<script setup>
import { onActivated, onMounted, ref, watch } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useViewStore } from '@/stores/view.js';
import { send, on, wsStatus } from '@/lib/ws.js';

const view = useViewStore();

const tabs = ref([]);
const activeId = ref('');

const insts = new Map(); // id -> { term, fit }
const buf = new Map();   // id -> 缓冲输出 (xterm 还没 mount 时)

const wrapEl = ref(null);

function shortCwd(p) { return (p || '').replace(/^\/Users\/[^/]+/, '~').replace(/^\/home\/[^/]+/, '~'); }

function getOrCreate(id) {
  if (insts.has(id)) return insts.get(id);
  const term = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: 'JetBrains Mono, ui-monospace, Menlo, Monaco, Consolas, monospace',
    scrollback: 5000,
    theme: {
      background: '#1e1e1e', foreground: '#e8eaed',
      cursor: '#34a853', cursorAccent: '#1e1e1e',
      selectionBackground: '#3a3a3a',
      black: '#1e1e1e', red: '#f28b82', green: '#34a853', yellow: '#fbbc04',
      blue: '#5e97ff', magenta: '#c58af9', cyan: '#78d4fa', white: '#e8eaed',
      brightBlack: '#5f6368', brightRed: '#ff7a72', brightGreen: '#5dca80',
      brightYellow: '#fde293', brightBlue: '#8ab4f8', brightMagenta: '#d7aefb',
      brightCyan: '#a1f0fa', brightWhite: '#ffffff'
    }
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.onData((data) => {
    if (id !== activeId.value) return;
    send({ type: 'data.input', to: 'desktop', data: { terminalId: id, input: data } });
  });
  insts.set(id, { term, fit });
  return insts.get(id);
}

function flushBuf(id) {
  const pending = buf.get(id);
  if (!pending) return;
  const inst = insts.get(id);
  if (!inst) return;
  inst.term.write(pending);
  buf.delete(id);
}

function mount(id) {
  const wrap = wrapEl.value;
  if (!wrap || !id) return;
  for (const [tid, { term }] of insts.entries()) {
    if (term.element) term.element.style.display = (tid === id) ? '' : 'none';
  }
  const inst = getOrCreate(id);
  if (!inst.term.element) inst.term.open(wrap);
  flushBuf(id);
  setTimeout(() => { inst.fit.fit(); sendResize(id); }, 0);
}

function sendResize(id = activeId.value) {
  if (!id) return;
  const inst = insts.get(id);
  if (!inst) return;
  send({ type: 'system.resize', to: 'desktop', data: { terminalId: id, cols: inst.term.cols, rows: inst.term.rows } });
}

function pickTab(id) {
  if (!id || id === activeId.value) return;
  activeId.value = id;
  send({ type: 'terminal.activate', to: 'desktop', data: { terminalId: id } });
  if (window.innerWidth < 720) view.closeAppDrawer();
  mount(id);
}
function addTab() { send({ type: 'terminal.create', to: 'desktop', data: {} }); }
function closeTab(id, e) { e?.stopPropagation(); send({ type: 'terminal.close', to: 'desktop', data: { terminalId: id } }); }

function setTabs(items, preferredId) {
  tabs.value = items || [];
  const fallback = preferredId || items.find((it) => it.isActive)?.id || items[0]?.id || '';
  for (const tid of [...insts.keys()]) {
    if (!items.some((it) => it.id === tid)) {
      insts.get(tid)?.term.dispose();
      insts.delete(tid);
      buf.delete(tid);
    }
  }
  if (fallback && fallback !== activeId.value) {
    activeId.value = fallback;
    setTimeout(() => mount(fallback), 0);
  } else if (activeId.value) {
    setTimeout(() => mount(activeId.value), 0);
  }
}

function refreshList() { send({ type: 'terminal.list', to: 'desktop', data: {} }); }

onMounted(() => {
  on('terminal.list', (msg) => setTabs(msg.data?.terminals || [], msg.data?.activeTerminalId));
  on('terminal.created', (msg) => {
    const t = msg.data?.terminal;
    if (!t?.id) return;
    const next = [...tabs.value.filter((it) => it.id !== t.id), t];
    setTabs(next, msg.data?.activeTerminalId || t.id);
  });
  on('terminal.closed', (msg) => {
    setTabs(tabs.value.filter((it) => it.id !== msg.data?.terminalId), msg.data?.activeTerminalId || '');
  });
  on('terminal.activated', (msg) => {
    const id = msg.data?.terminalId;
    if (!id) return;
    activeId.value = id;
    mount(id);
  });
  on('data.output', (msg) => {
    const id = msg.data?.terminalId;
    const out = msg.data?.output;
    if (!id || !out) return;
    const inst = insts.get(id);
    if (inst?.term.element) inst.term.write(out);
    else buf.set(id, (buf.get(id) || '') + out);
  });
  on('system.init', (msg) => {
    const id = msg.data?.terminalId || activeId.value;
    if (!id) return;
    const inst = getOrCreate(id);
    if (msg.data?.cols && msg.data?.rows) {
      inst.term.resize(msg.data.cols, msg.data.rows);
      if (id === activeId.value) inst.fit.fit();
    }
  });
  on('open', () => refreshList());
  if (wsStatus.value === 'connected') refreshList();
});

watch(() => view.appDrawerOpen, () => {
  setTimeout(() => { insts.get(activeId.value)?.fit.fit(); sendResize(); }, 200);
});
window.addEventListener('resize', () => {
  insts.get(activeId.value)?.fit.fit();
  sendResize();
});
onActivated(() => { setTimeout(() => mount(activeId.value), 0); });
</script>

<template>
  <aside class="app-side" :class="{ collapsed: !view.appDrawerOpen }">
    <div class="app-side-inner">
      <div class="head">
        <div class="title">终端</div>
        <button class="icon-btn" title="新会话" @click="addTab">
          <span class="msi sm">add</span>
        </button>
      </div>
      <div class="list">
        <div v-if="!tabs.length" class="empty">点 + 新建一个 PTY 会话</div>
        <div v-for="t in tabs" :key="t.id"
          class="sess"
          :class="{ active: t.id === activeId }"
          @click="pickTab(t.id)">
          <span class="msi sm ic">terminal</span>
          <div class="meta">
            <div class="t">{{ t.title || ('会话 ' + String(t.id).slice(0, 6)) }}</div>
            <div class="cwd">{{ shortCwd(t.cwd) }}</div>
          </div>
          <button class="x" title="关闭" @click="closeTab(t.id, $event)">
            <span class="msi xxs">close</span>
          </button>
        </div>
      </div>
    </div>
  </aside>

  <section class="term-pane">
    <div class="term-host" ref="wrapEl"></div>
  </section>
</template>

<style scoped>
.head { display: flex; align-items: center; padding: 12px 16px; gap: 8px; border-bottom: 1px solid var(--line-soft); }
.head .title { flex: 1; font-size: 16px; font-weight: 500; }

.list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px; }
.empty { padding: 20px 16px; color: var(--text-3); font-size: 12.5px; text-align: center; }
.sess { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; cursor: pointer; transition: background .12s; }
.sess:hover { background: var(--bg-hover); }
.sess.active { background: var(--accent-soft); }
.sess .ic { color: var(--text-2); }
.sess.active .ic { color: var(--accent-fg); }
.sess .meta { flex: 1; min-width: 0; }
.sess .t { font-size: 13.5px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sess .cwd { font-size: 11.5px; color: var(--text-3); font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sess .x {
  flex: none; width: 22px; height: 22px;
  display: grid; place-items: center;
  border: 0; background: transparent;
  color: var(--text-3); border-radius: 50%;
  opacity: 0; transition: background .12s, opacity .12s;
}
.sess:hover .x, .sess.active .x { opacity: 1; }
.sess .x:hover { background: rgba(60,64,67,0.12); color: var(--text); }

.term-pane { flex: 1; min-width: 0; min-height: 0; display: flex; background: #1e1e1e; }
.term-host { flex: 1; min-width: 0; min-height: 0; padding: 8px 4px 4px 8px; }
.term-host :deep(.xterm-viewport) { background: #1e1e1e !important; }
</style>
