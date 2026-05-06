<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { marked } from 'marked';
import { useViewStore } from '@/stores/view.js';
import * as api from '@/utils/api.js';
import { send, on } from '@/system/ws.js';
import AppsTrigger from '@/components/AppsTrigger.vue';

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

const props = defineProps({
  pendingMessage: { type: String, default: null },
  intentRequest: { type: Object, default: null }
});

const view = useViewStore();
const MOBILE_BREAK = 720;

// ─── state ─────────────────────────────────────────
const conversations = ref([]);
const activeId = ref(null);
const messages = ref([]);
const input = ref('');
const streaming = ref(false);
const streamingKey = ref('');
const errMsg = ref('');
const listEl = ref(null);

const menuOpen = ref(false);
const remarksOpen = ref(false);
const remarks = ref([]);
const remarksLoading = ref(false);

// ─── computed ──────────────────────────────────────
const activeConv = computed(() => conversations.value.find((c) => c.conversation_id === activeId.value) || null);
const activeTitle = computed(() => activeConv.value?.title || (activeId.value ? '对话' : '选择或新建一个对话'));

// ─── helpers ───────────────────────────────────────
const mkKey = (kind) => `ws:${Date.now()}:${kind}`;
const isMobile = () => window.innerWidth < MOBILE_BREAK;
const setErr = (label, e) => { errMsg.value = `${label}: ${e?.message || e}`; };

function scrollEnd() {
  nextTick(() => { if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight; });
}

function relTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toTimeString().slice(0, 5);
  const diff = (now - d) / (24 * 3600 * 1000);
  if (diff < 7) return `${Math.floor(diff)} 天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const parseToolArgs = (raw) => {
  if (typeof raw !== 'string') return null;
  try { return JSON.parse(raw); } catch { return null; }
};
function mapToolCall(tc, key) {
  const name = tc?.function?.name || '';
  const args = parseToolArgs(tc?.function?.arguments);
  if (name === 'shell' && args) {
    return { type: 'tool_call', shell: true, title: args.reason || 'shell', command: args.command || '', _key: key, expanded: false };
  }
  return { type: 'tool_call', title: name || '工具调用', detail: args ? JSON.stringify(args, null, 2) : '', _key: key, expanded: false };
}

function parseMessages(raw) {
  const list = [];
  for (const m of raw) {
    if (!m || m.role === 'system') continue;
    const base = m._id != null ? `db:${m._id}` : null;
    if (m.role === 'assistant' && m.tool_calls?.length) {
      if (m.content) list.push({ role: 'ai', text: m.content, _key: base ? `${base}:asst` : undefined });
      m.tool_calls.forEach((tc, i) => list.push(mapToolCall(tc, base ? `${base}:tc:${i}` : undefined)));
      continue;
    }
    if (m.role === 'tool') {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].type === 'tool_call' && !list[i].result) {
          list[i].result = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
          break;
        }
      }
      continue;
    }
    if (m.role === 'assistant' && m.content) {
      list.push({ role: 'ai', text: m.content, remark: m._remark || null, _key: base ? `${base}:asst` : undefined });
      continue;
    }
    if (m.role === 'user' && m.content) {
      const text = typeof m.content === 'string'
        ? m.content
        : Array.isArray(m.content) ? m.content.map((p) => p.text || '').filter(Boolean).join('\n') : '';
      list.push({ role: 'user', text, _key: base ? `${base}:user` : undefined });
    }
  }
  return list;
}

// 收尾正在流式中的 AI 气泡:有内容就锁定,没内容就直接删掉
function closeStreaming(finalText, remark) {
  const key = streamingKey.value;
  streamingKey.value = '';
  if (!key) return;
  const idx = messages.value.findIndex((m) => m._key === key);
  if (idx < 0) return;
  const msg = messages.value[idx];
  if (finalText) msg.text = finalText;
  if (remark) msg.remark = remark;
  delete msg._streaming;
  if (!msg.text) messages.value.splice(idx, 1);
}

// ─── 对话操作 ──────────────────────────────────────
async function loadConversations() {
  try {
    const list = await api.get('/api/chat/list', { query: { scene: 'chat' } });
    conversations.value = (list || []).map((c) => ({ ...c, _last: c.description || '' }));
    if (!activeId.value && conversations.value.length) {
      await pickConv(conversations.value[0].conversation_id);
    }
  } catch (e) { setErr('加载对话列表失败', e); }
}

async function pickConv(id) {
  if (!id) return;
  activeId.value = id;
  messages.value = [];
  streamingKey.value = '';
  if (isMobile()) view.closeAppDrawer();
  try {
    const data = await api.get('/api/chat/messages', { query: { conversationId: id, limit: 50, offset: 0 } });
    messages.value = parseMessages(data.messages || []);
    streaming.value = data.state === 'running';
    scrollEnd();
  } catch (e) { setErr('加载消息失败', e); }
}

async function newChat() {
  try {
    const c = await api.post('/api/chat/create', { title: '新对话', scene: 'chat' });
    const id = c.conversationId || c.conversation_id;
    await loadConversations();
    await pickConv(id);
  } catch (e) { setErr('新建对话失败', e); }
}

async function sendMsg() {
  const t = input.value.trim();
  if (!t || streaming.value) return;
  if (!activeId.value) {
    try {
      const c = await api.post('/api/chat/create', { title: t.slice(0, 30), scene: 'chat' });
      activeId.value = c.conversationId || c.conversation_id;
      await loadConversations();
    } catch (e) { setErr('新建对话失败', e); return; }
  }
  messages.value.push({ role: 'user', text: t, _key: mkKey('u') });
  input.value = '';
  streaming.value = true;
  scrollEnd();
  send({ type: 'message', conversationId: activeId.value, content: t, attachments: [] });
}

function abort() {
  if (!streaming.value || !activeId.value) return;
  send({ type: 'abort', conversationId: activeId.value });
}

async function renameCurrent() {
  menuOpen.value = false;
  if (!activeId.value) return;
  const t = prompt('新标题', activeConv.value?.title || '');
  if (t === null) return;
  const title = t.trim();
  if (!title) return;
  try {
    await api.post('/api/chat/rename', { conversationId: activeId.value, title });
    await loadConversations();
  } catch (e) { setErr('改名失败', e); }
}

async function deleteCurrent() {
  menuOpen.value = false;
  if (!activeId.value) return;
  if (!confirm('删除这个对话?此操作不可撤销。')) return;
  try {
    await api.post('/api/chat/delete', { conversationId: activeId.value });
    activeId.value = null;
    messages.value = [];
    await loadConversations();
  } catch (e) { setErr('删除失败', e); }
}

// ─── 更多菜单 + 备注面板 ───────────────────────────
function toggleMenu() {
  menuOpen.value = !menuOpen.value;
  if (menuOpen.value) remarksOpen.value = false;
}
function toggleRemarks() {
  if (!activeId.value) return;
  remarksOpen.value = !remarksOpen.value;
  if (remarksOpen.value) { menuOpen.value = false; loadRemarks(); }
}
async function loadRemarks() {
  if (!activeId.value) return;
  remarksLoading.value = true;
  try {
    const data = await api.get('/api/chat/remarks', { query: { conversationId: activeId.value } });
    remarks.value = data?.items || [];
  } catch { remarks.value = []; }
  remarksLoading.value = false;
}
function onDocClick(e) {
  if (menuOpen.value && !e.target.closest('.menu-pop') && !e.target.closest('.menu-trigger')) menuOpen.value = false;
  if (remarksOpen.value && !e.target.closest('.remarks-pop') && !e.target.closest('.remarks-trigger')) remarksOpen.value = false;
}

// ─── WS handlers ───────────────────────────────────
const isCurrent = (d) => d.conversationId === activeId.value;
const isCurrentOrGlobal = (d) => !d.conversationId || d.conversationId === activeId.value;

function onDelta(d) {
  if (!isCurrent(d)) return;
  streaming.value = true;
  if (!d.delta) return;  // 空 delta 不开气泡 —— 避免生成空白条
  let key = streamingKey.value;
  if (!key) {
    key = mkKey('asst');
    streamingKey.value = key;
    messages.value.push({ role: 'ai', text: '', _key: key, _streaming: true });
  }
  const msg = messages.value.find((m) => m._key === key);
  if (msg) msg.text = (msg.text || '') + d.delta;
  scrollEnd();
}

function onDone(d) {
  if (!isCurrent(d)) return;
  if (streamingKey.value) {
    closeStreaming(d.content, d.remark);
  } else if (d.content) {
    // 没有 streaming 占位但 done 带最终内容 → 直接新建一条
    messages.value.push({ role: 'ai', text: d.content, remark: d.remark || null, _key: mkKey('done') });
  }
  streaming.value = false;
  scrollEnd();
  loadConversations();
}

function onToolCall(d) {
  if (!isCurrent(d)) return;
  closeStreaming();
  messages.value.push(mapToolCall(d.toolCall, mkKey('tc')));
  scrollEnd();
}

function onToolResult(d) {
  if (!isCurrent(d)) return;
  for (let i = messages.value.length - 1; i >= 0; i--) {
    const msg = messages.value[i];
    if (msg.type === 'tool_call' && !msg.result) { msg.result = d.content; return; }
  }
  messages.value.push({ type: 'tool_result', content: d.content, _key: mkKey('tr') });
}

function onAborted(d) {
  if (!isCurrent(d)) return;
  closeStreaming();
  streaming.value = false;
}

function onWsError(d) {
  if (!isCurrentOrGlobal(d)) return;
  closeStreaming();
  messages.value.push({ role: 'ai', text: `[错误] ${d.content || '未知错误'}`, _key: mkKey('err') });
  streaming.value = false;
}

// ─── 生命周期 ──────────────────────────────────────
onMounted(() => {
  on('delta', onDelta);
  on('done', onDone);
  on('tool_call', onToolCall);
  on('tool_result', onToolResult);
  on('aborted', onAborted);
  on('error', onWsError);
  document.addEventListener('click', onDocClick);

  loadConversations();

  // workshop 等过来:自动新建并发送
  const ir = props.intentRequest;
  if (ir?.intent === 'new_and_send' && ir.payload?.message) {
    nextTick(async () => {
      activeId.value = null;
      messages.value = [];
      input.value = ir.payload.message;
      await sendMsg();
    });
  } else if (props.pendingMessage) {
    nextTick(() => { input.value = props.pendingMessage; });
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
});
</script>

<template>
  <div class="app-frame">
    <header class="topbar">
      <button class="icon-btn lg" :class="{ active: view.appDrawerOpen }"
        @click="view.toggleAppDrawer()" title="侧栏">
        <span class="msi">menu</span>
      </button>
      <div class="brand"><span class="name">对话</span></div>
      <div class="right">
        <AppsTrigger />
      </div>
    </header>
    <div class="chat-shell">
    <aside class="app-side" :class="{ collapsed: !view.appDrawerOpen }">
      <div class="app-side-inner">
        <div class="head">
          <button class="new-pill" @click="newChat">
            <span class="msi sm">edit_square</span>
            <span>新对话</span>
          </button>
        </div>
        <div class="list">
          <div v-if="!conversations.length" class="empty">还没有对话,点右上角 ✎ 新建一个</div>
          <div v-for="c in conversations" :key="c.conversation_id"
            class="conv"
            :class="{ active: c.conversation_id === activeId }"
            @click="pickConv(c.conversation_id)">
            <div class="row1">
              <span v-if="c.pinned" class="msi xxs pin">push_pin</span>
              <span class="t">{{ c.title || '未命名' }}</span>
              <span class="time">{{ relTime(c.created_at) }}</span>
            </div>
            <div class="last">{{ c._last || '...' }}</div>
          </div>
        </div>
      </div>
    </aside>

    <section class="chat-pane">
      <header class="chat-head">
        <div class="title">{{ activeTitle }}</div>

        <div class="head-action">
          <button class="icon-btn remarks-trigger"
            :class="{ 'is-on': remarksOpen }"
            :disabled="!activeId"
            title="对话要点"
            @click="toggleRemarks">
            <span class="msi sm">summarize</span>
          </button>
          <Transition name="pop">
            <div v-if="remarksOpen" class="remarks-pop">
              <div class="pop-head">
                <span class="pop-title">对话要点</span>
                <span class="pop-count" v-if="remarks.length">{{ remarks.length }}</span>
              </div>
              <div class="pop-body">
                <div v-if="remarksLoading" class="pop-empty">加载中…</div>
                <div v-else-if="!remarks.length" class="pop-empty">还没有要点摘要</div>
                <div v-else class="remarks-list">
                  <div v-for="r in remarks" :key="r.id" class="remark-item">{{ r.remark }}</div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <div class="head-action">
          <button class="icon-btn menu-trigger"
            :class="{ 'is-on': menuOpen }"
            :disabled="!activeId"
            title="更多"
            @click="toggleMenu">
            <span class="msi sm">more_vert</span>
          </button>
          <Transition name="pop">
            <div v-if="menuOpen" class="menu-pop">
              <button class="menu-item" @click="renameCurrent">
                <span class="msi sm">edit</span>
                <span>重命名</span>
              </button>
              <button class="menu-item danger" @click="deleteCurrent">
                <span class="msi sm">delete</span>
                <span>删除对话</span>
              </button>
            </div>
          </Transition>
        </div>
      </header>

      <div v-if="errMsg" class="err">{{ errMsg }}</div>

      <div class="msgs" ref="listEl">
        <div v-if="!activeId && !errMsg" class="placeholder">
          选一个对话,或者直接在下方输入开始一段新对话.
        </div>
        <template v-for="(m, i) in messages" :key="m._key || i">
          <!-- 用户气泡 -->
          <div v-if="m.role === 'user'" class="msg user">{{ m.text }}</div>

          <!-- AI 文本 (markdown) -->
          <div v-else-if="m.role === 'ai' && m.text" class="msg ai">
            <div class="md" v-html="renderMd(m.text)" />
            <div v-if="m.remark" class="remark">{{ m.remark }}</div>
          </div>

          <!-- 工具调用 (可展开) -->
          <div v-else-if="m.type === 'tool_call'" class="tool-row">
            <button type="button" class="tool-head" @click="m.expanded = !m.expanded">
              <span class="msi xs" :style="{ transform: m.expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .15s' }">chevron_right</span>
              <span class="tool-title">{{ m.title }}</span>
              <span v-if="m.result" class="tool-done">完成</span>
            </button>
            <div v-if="m.expanded" class="tool-body">
              <pre v-if="m.shell && m.command" class="tool-cmd"><span class="prompt">$ </span>{{ m.command }}</pre>
              <pre v-else-if="m.detail" class="tool-detail">{{ m.detail }}</pre>
              <pre v-if="m.result" class="tool-result">{{ m.result }}</pre>
            </div>
          </div>

          <!-- 独立工具结果 -->
          <div v-else-if="m.type === 'tool_result'" class="tool-orphan">
            <span class="dot"></span>
            <pre>{{ m.content }}</pre>
          </div>
        </template>

        <!-- 流式期间的「思考中」指示 (不挂在某条 message 上, 不占位) -->
        <div v-if="streaming" class="thinking">思考中<span class="dots">…</span></div>
      </div>

      <div class="composer">
        <textarea v-model="input" rows="1" placeholder="输入消息 (Enter 发送, Shift+Enter 换行)"
          @keydown.enter.exact.prevent="sendMsg" />
        <button v-if="streaming" class="send stop" @click="abort" title="中断">
          <span class="msi sm">stop</span>
        </button>
        <button v-else class="send" :disabled="!input.trim()" @click="sendMsg">
          <span class="msi sm">send</span>
        </button>
      </div>
    </section>
    </div>
  </div>
</template>

<style scoped>
/* ─── chat 自己的顶栏 ─── */
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

.chat-shell { flex: 1; min-width: 0; min-height: 0; display: flex; background: #f0f4f9; }

.app-side { background: #f0f4f9; border-right: 0; }

.head { display: flex; align-items: center; padding: 14px 12px 8px 12px; gap: 8px; }
.new-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px;
  background: #fff;
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 22px;
  font-size: 13.5px; font-weight: 500;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(60,64,67,0.08), 0 1px 3px rgba(60,64,67,0.04);
  transition: background .12s, box-shadow .15s;
}
.new-pill:hover { background: #fafbfc; box-shadow: 0 1px 3px rgba(60,64,67,0.12), 0 4px 10px rgba(60,64,67,0.06); }
.new-pill .msi { color: var(--accent); }
.list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 8px 8px; }
.empty { padding: 20px 16px; color: var(--text-3); font-size: 12.5px; text-align: center; }
.conv { padding: 10px 14px; border-radius: 22px; cursor: pointer; margin: 1px 0; transition: background .12s; }
.conv:hover { background: rgba(60,64,67,0.06); }
.conv.active { background: var(--accent-soft); }
.conv .row1 { display: flex; align-items: center; gap: 6px; }
.conv .pin { color: var(--accent); }
.conv .t { flex: 1; font-size: 13.5px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv .time { font-size: 11.5px; color: var(--text-3); }
.conv .last { font-size: 12.5px; color: var(--text-2); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv.active .last { color: var(--text); }

.chat-pane {
  flex: 1; min-width: 0; min-height: 0;
  display: flex; flex-direction: column;
  background: #fff;
  border-radius: 16px;
  margin: 8px 8px 8px 0;
  overflow: hidden;
}
.chat-head { flex: none; display: flex; align-items: center; gap: 4px; padding: 14px 20px; position: relative; z-index: 5; }
.chat-head .title { flex: 1; font-size: 17px; font-weight: 500; letter-spacing: -0.01em; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.head-action { position: relative; }
.icon-btn.is-on { background: var(--accent-soft); color: var(--accent-fg); }
.icon-btn:disabled { opacity: 0.35; cursor: default; }
.icon-btn:disabled:hover { background: transparent; }

/* 通用浮层(更多菜单 / 备注) */
.menu-pop, .remarks-pop {
  position: absolute;
  top: calc(100% + 6px); right: 0;
  z-index: 20;
  background: #fff;
  border-radius: 14px;
  box-shadow: var(--shadow-3);
  overflow: hidden;
}
.menu-pop { min-width: 180px; padding: 6px; }
.menu-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0; background: transparent;
  border-radius: 8px;
  font-size: 13.5px;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: background .12s;
}
.menu-item:hover { background: var(--bg-hover); }
.menu-item.danger { color: var(--bad); }
.menu-item.danger:hover { background: color-mix(in srgb, var(--bad) 10%, transparent); }
.menu-item .msi { color: inherit; }

.remarks-pop { width: 320px; max-width: calc(100vw - 24px); max-height: min(420px, calc(100vh - 120px)); display: flex; flex-direction: column; }
.pop-head { flex: none; display: flex; align-items: baseline; justify-content: space-between; padding: 14px 16px 10px; border-bottom: 1px solid var(--line-soft); }
.pop-title { font-size: 13px; font-weight: 600; color: var(--text); }
.pop-count { font-size: 11px; color: var(--text-3); font-family: var(--font-mono); }
.pop-body { flex: 1; min-height: 0; overflow-y: auto; padding: 6px; }
.pop-empty { padding: 24px 12px; text-align: center; font-size: 12.5px; color: var(--text-3); }
.remarks-list { display: flex; flex-direction: column; gap: 4px; }
.remark-item {
  padding: 10px 12px;
  background: var(--bg-elev);
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text);
}

.pop-enter-active, .pop-leave-active { transition: opacity .12s, transform .12s; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }

.err { flex: none; margin: 0 24px 8px; padding: 8px 12px; background: #fce8e6; color: var(--bad); border-radius: 8px; font-size: 12.5px; }

.msgs {
  flex: 1; min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 24px 24px;
}
.msgs > * + * { margin-top: 12px; }
.msgs-inner { max-width: 760px; margin: 0 auto; width: 100%; }
.placeholder { color: var(--text-3); text-align: center; padding: 40px 0; font-size: 13.5px; }

.msg { padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.55; word-break: break-word; max-width: 720px; }
.msg.ai { background: #f0f4f9; border-top-left-radius: 4px; margin-right: auto; white-space: normal; }
.msg.user { background: var(--accent); color: #fff; border-top-right-radius: 4px; margin-left: auto; white-space: pre-wrap; max-width: min(70%, 560px); }
.msg.ai .md :deep(p) { margin: 0 0 0.6em; }
.msg.ai .md :deep(p:last-child) { margin-bottom: 0; }
.msg.ai .md :deep(pre) { background: #fff; padding: 10px 12px; border-radius: 10px; overflow-x: auto; font-size: 12.5px; line-height: 1.55; margin: 8px 0; }
.msg.ai .md :deep(code) { background: rgba(60,64,67,0.08); padding: 1px 5px; border-radius: 4px; font-size: 13px; }
.msg.ai .md :deep(pre code) { background: transparent; padding: 0; }
.msg.ai .md :deep(ul), .msg.ai .md :deep(ol) { margin: 0.4em 0; padding-left: 1.5em; }
.msg.ai .md :deep(a) { color: var(--accent); text-decoration: underline; }
.thinking {
  padding: 6px 4px;
  font-size: 13px;
  color: var(--text-3);
}
.thinking .dots {
  display: inline-block;
  margin-left: 2px;
  letter-spacing: 2px;
  animation: chat-pulse 1.2s ease-in-out infinite;
}
.msg.ai .remark { margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--line); font-size: 12.5px; line-height: 1.55; color: var(--text-3); font-style: italic; }
@keyframes chat-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* 工具调用 */
.tool-row {
  max-width: 720px;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}
.tool-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  border: 0;
  background: color-mix(in srgb, var(--accent) 5%, transparent);
  cursor: pointer;
  font: inherit;
  color: var(--text);
  text-align: left;
  transition: background .15s;
}
.tool-head:hover { background: color-mix(in srgb, var(--accent) 9%, transparent); }
.tool-head .msi { color: var(--text-3); }
.tool-title { flex: 1; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tool-done { font-size: 11px; color: var(--text-3); font-family: 'Google Sans', sans-serif; }
.tool-body { border-top: 1px solid var(--line-soft); }
.tool-cmd, .tool-detail, .tool-result {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
}
.tool-cmd { background: #f6f8fc; color: #1e8e3e; }
.tool-cmd .prompt { color: var(--text-3); user-select: none; }
.tool-detail { background: var(--bg-elev); color: var(--text-2); }
.tool-result {
  border-top: 1px solid var(--line-soft);
  background: color-mix(in srgb, var(--accent) 3%, transparent);
  color: var(--text-2);
  max-height: 200px;
  overflow-y: auto;
}

/* 独立工具结果 */
.tool-orphan {
  display: flex; gap: 10px; align-items: flex-start;
  font-family: var(--font-mono);
  max-width: 720px;
}
.tool-orphan .dot {
  width: 8px; height: 8px; margin-top: 8px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 40%, transparent);
  flex-shrink: 0;
}
.tool-orphan pre {
  margin: 0;
  flex: 1; min-width: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-3);
  white-space: pre-wrap;
  word-break: break-word;
}

.composer {
  flex: none; display: flex; align-items: center; gap: 4px;
  padding: 6px 6px 6px 14px;
  margin: 4px auto 14px;
  width: calc(100% - 32px); max-width: 760px;
  background: #f0f4f9; border-radius: 26px;
  transition: background .15s, box-shadow .15s;
}
.composer:focus-within { background: #fff; box-shadow: 0 0 0 1px var(--line), 0 1px 3px rgba(60,64,67,0.08); }
.composer textarea { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; padding: 9px 4px; font-size: 14px; resize: none; max-height: 140px; line-height: 1.4; }
.send { width: 36px; height: 36px; display: grid; place-items: center; border: 0; background: var(--accent); color: #fff; border-radius: 50%; transition: background .15s, opacity .15s; }
.send:hover:not(:disabled) { background: var(--accent-hi); }
.send:disabled { opacity: .4; cursor: default; }
.send.stop { background: var(--bad); }
.send.stop:hover { background: #b3271c; }

@media (max-width: 720px) {
  .chat-pane { margin: 4px; border-radius: 14px; }
  .msgs { padding: 8px 12px 16px; }
  .composer { width: calc(100% - 16px); margin: 4px auto 10px; }
}
</style>
