<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useViewStore } from '@/stores/view.js';
import * as api from '@/lib/api.js';
import { send, on, wsStatus } from '@/lib/ws.js';

const view = useViewStore();

const conversations = ref([]);
const activeId = ref(null);
const messages = ref([]);
const input = ref('');
const listEl = ref(null);
const streaming = ref(false);
const errMsg = ref('');

const activeConv = computed(() => conversations.value.find((c) => c.conversation_id === activeId.value) || null);
const activeTitle = computed(() => activeConv.value?.title || (activeId.value ? '对话' : '选择或新建一个对话'));

function relTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toTimeString().slice(0, 5);
  const diff = (now - d) / (24 * 3600 * 1000);
  if (diff < 7) return `${Math.floor(diff)} 天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

async function loadConversations() {
  try {
    const list = await api.get('/api/chat/list', { query: { scene: 'chat' } });
    conversations.value = (list || []).map((c) => ({ ...c, _last: c.description || '' }));
    if (!activeId.value && conversations.value.length) {
      await pickConv(conversations.value[0].conversation_id);
    }
  } catch (e) { errMsg.value = '加载对话列表失败: ' + (e.message || e); }
}

async function pickConv(id) {
  if (!id) return;
  activeId.value = id;
  messages.value = [];
  if (window.innerWidth < 720) view.closeAppDrawer();
  try {
    const data = await api.get('/api/chat/messages', { query: { conversationId: id, limit: 50, offset: 0 } });
    messages.value = (data.messages || []).map(toViewMsg).filter(Boolean);
    scrollEnd();
  } catch (e) { errMsg.value = '加载消息失败: ' + (e.message || e); }
}

function toViewMsg(m) {
  if (!m || !m.role || m.role === 'system') return null;
  let text = '';
  if (typeof m.content === 'string') text = m.content;
  else if (Array.isArray(m.content)) text = m.content.map((p) => p.text || '').filter(Boolean).join('\n');
  return { role: m.role === 'assistant' ? 'ai' : 'user', text, _id: m._id };
}

async function newChat() {
  try {
    const c = await api.post('/api/chat/create', { title: '新对话', scene: 'chat' });
    await loadConversations();
    await pickConv(c.conversation_id);
  } catch (e) { errMsg.value = '新建对话失败: ' + (e.message || e); }
}

async function sendMsg() {
  const t = input.value.trim();
  if (!t || streaming.value) return;
  if (!activeId.value) {
    try {
      const c = await api.post('/api/chat/create', { title: t.slice(0, 30), scene: 'chat' });
      activeId.value = c.conversation_id;
      await loadConversations();
    } catch (e) { errMsg.value = '新建对话失败: ' + (e.message || e); return; }
  }
  messages.value.push({ role: 'user', text: t });
  messages.value.push({ role: 'ai', text: '', _streaming: true });
  input.value = '';
  streaming.value = true;
  scrollEnd();
  send({ type: 'message', conversationId: activeId.value, content: t, attachments: [] });
}

function abort() {
  if (!streaming.value || !activeId.value) return;
  send({ type: 'abort', conversationId: activeId.value });
}

function scrollEnd() {
  nextTick(() => { const el = listEl.value; if (el) el.scrollTop = el.scrollHeight; });
}

function appendDelta(text) {
  const last = messages.value[messages.value.length - 1];
  if (last?._streaming) last.text += text;
  else messages.value.push({ role: 'ai', text, _streaming: true });
  scrollEnd();
}
function finishStream(content) {
  const last = messages.value[messages.value.length - 1];
  if (last?._streaming) {
    if (content) last.text = content;
    delete last._streaming;
  }
  streaming.value = false;
  loadConversations();
}

onMounted(() => {
  on('delta', (d) => {
    if (d.conversationId !== activeId.value) return;
    if (d.delta) appendDelta(d.delta);
  });
  on('done', (d) => {
    if (d.conversationId !== activeId.value) return;
    finishStream(d.content);
  });
  on('aborted', (d) => {
    if (d.conversationId !== activeId.value) return;
    finishStream();
  });
  on('error', (d) => {
    if (d.conversationId && d.conversationId !== activeId.value) return;
    const last = messages.value[messages.value.length - 1];
    if (last?._streaming) { last.text += `\n[错误] ${d.content || '未知错误'}`; delete last._streaming; }
    streaming.value = false;
  });
  loadConversations();
});
</script>

<template>
  <div class="chat-shell">
    <aside class="app-side" :class="{ collapsed: !view.appDrawerOpen }">
      <div class="app-side-inner">
        <div class="head">
          <div class="title">对话</div>
          <button class="icon-btn" title="新对话" @click="newChat">
            <span class="msi sm">edit_square</span>
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
        <span class="ws-dot" :class="wsStatus" :title="'WS: ' + wsStatus"></span>
        <button class="icon-btn"><span class="msi sm">more_vert</span></button>
      </header>

      <div v-if="errMsg" class="err">{{ errMsg }}</div>

      <div class="msgs" ref="listEl">
        <div v-if="!activeId && !errMsg" class="placeholder">
          选一个对话,或者直接在下方输入开始一段新对话.
        </div>
        <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
          {{ m.text || (m._streaming ? '...' : '') }}
        </div>
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
</template>

<style scoped>
.chat-shell { flex: 1; min-width: 0; min-height: 0; display: flex; background: #f0f4f9; }

.app-side { background: #f0f4f9; border-right: 0; }

.head { display: flex; align-items: center; padding: 14px 16px 8px 20px; gap: 8px; }
.head .title { flex: 1; font-size: 18px; font-weight: 500; color: var(--text); letter-spacing: -0.01em; }
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
.chat-head { flex: none; display: flex; align-items: center; gap: 4px; padding: 14px 20px; }
.chat-head .title { flex: 1; font-size: 17px; font-weight: 500; letter-spacing: -0.01em; }
.ws-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-3); margin-right: 6px; }
.ws-dot.connected { background: var(--good); }
.ws-dot.connecting { background: var(--warn); }
.ws-dot.disconnected { background: var(--bad); }

.err { flex: none; margin: 0 24px 8px; padding: 8px 12px; background: #fce8e6; color: var(--bad); border-radius: 8px; font-size: 12.5px; }

.msgs {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 8px 24px 24px;
  display: flex; flex-direction: column; gap: 10px;
  max-width: 760px; margin: 0 auto; width: 100%;
}
.placeholder { color: var(--text-3); text-align: center; padding: 40px 0; font-size: 13.5px; }
.msg { max-width: 70%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
.msg.ai { background: #f0f4f9; border-top-left-radius: 4px; align-self: flex-start; }
.msg.user { background: var(--accent); color: #fff; border-top-right-radius: 4px; align-self: flex-end; }

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
