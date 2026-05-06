<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useViewStore } from '@/stores/view.js';
import * as api from '@/lib/api.js';
import { send, on, wsStatus } from '@/lib/ws.js';

const view = useViewStore();
const input = ref('');
const inputEl = ref(null);
const messages = ref([
  { role: 'ai', text: '你好,我可以帮你看终端、读文件、跑任务、查系统状态。问我吧。' }
]);
const conversationId = ref(null);
const streaming = ref(false);

watch(() => view.chatOpen, async (open) => {
  if (open) { await nextTick(); inputEl.value?.focus(); }
});

async function ensureConv() {
  if (conversationId.value) return conversationId.value;
  const c = await api.post('/api/chat/create', { title: '快速对话', scene: 'quick' });
  conversationId.value = c.conversation_id;
  return conversationId.value;
}

async function sendMsg() {
  const t = input.value.trim();
  if (!t || streaming.value) return;
  try { await ensureConv(); }
  catch (e) {
    messages.value.push({ role: 'ai', text: '无法创建对话: ' + (e.message || e) });
    return;
  }
  messages.value.push({ role: 'user', text: t });
  messages.value.push({ role: 'ai', text: '', _streaming: true });
  input.value = '';
  streaming.value = true;
  send({ type: 'message', conversationId: conversationId.value, content: t, attachments: [] });
}

function onKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMsg(); }
}
function abort() {
  if (!streaming.value || !conversationId.value) return;
  send({ type: 'abort', conversationId: conversationId.value });
}

onMounted(() => {
  on('delta', (d) => {
    if (d.conversationId !== conversationId.value) return;
    const last = messages.value[messages.value.length - 1];
    if (last?._streaming && d.delta) last.text += d.delta;
  });
  on('done', (d) => {
    if (d.conversationId !== conversationId.value) return;
    const last = messages.value[messages.value.length - 1];
    if (last?._streaming) { if (d.content) last.text = d.content; delete last._streaming; }
    streaming.value = false;
  });
  on('aborted', (d) => {
    if (d.conversationId !== conversationId.value) return;
    const last = messages.value[messages.value.length - 1];
    if (last?._streaming) delete last._streaming;
    streaming.value = false;
  });
  on('error', (d) => {
    if (d.conversationId && d.conversationId !== conversationId.value) return;
    const last = messages.value[messages.value.length - 1];
    if (last?._streaming) { last.text += `\n[错误] ${d.content || ''}`; delete last._streaming; }
    streaming.value = false;
  });
});

function onEsc(e) { if (e.key === 'Escape') view.closeChat(); }
onMounted(() => document.addEventListener('keydown', onEsc));
onBeforeUnmount(() => document.removeEventListener('keydown', onEsc));
</script>

<template>
  <Transition name="chat-fade">
    <aside v-if="view.chatOpen" class="chat-popup">
      <header class="head">
        <span class="bot">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <circle cx="12" cy="12" r="10" fill="#1a73e8"/>
            <circle cx="9" cy="11" r="1.6" fill="#fff"/>
            <circle cx="15" cy="11" r="1.6" fill="#fff"/>
            <path d="M8.5 14.5c1 1.2 2.2 1.7 3.5 1.7s2.5-.5 3.5-1.7" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="title">问 AI</span>
        <span class="ws-dot" :class="wsStatus" :title="'WS: ' + wsStatus"></span>
        <button class="icon-btn" @click="view.closeChat()" title="关闭">
          <span class="msi sm">close</span>
        </button>
      </header>

      <div class="body">
        <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
          {{ m.text || (m._streaming ? '...' : '') }}
        </div>
      </div>

      <div class="foot">
        <textarea ref="inputEl" v-model="input" rows="1" placeholder="问点什么..." @keydown="onKey" />
        <button v-if="streaming" class="send stop" @click="abort"><span class="msi sm">stop</span></button>
        <button v-else class="send" :disabled="!input.trim()" @click="sendMsg"><span class="msi sm">send</span></button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.chat-popup {
  position: fixed;
  top: calc(var(--topbar-h) - 4px); right: 12px;
  width: 380px; max-width: calc(100vw - 24px);
  height: min(560px, calc(100vh - 80px));
  background: var(--bg);
  border-radius: 12px;
  box-shadow: var(--shadow-3);
  z-index: 60;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.chat-fade-enter-active { animation: pop-in 0.16s cubic-bezier(.2,.7,.2,1); }
.chat-fade-leave-active { animation: pop-in 0.12s reverse; }
@keyframes pop-in {
  from { opacity: 0; transform: scale(.96) translateY(-6px); transform-origin: top right; }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.head { flex: none; display: flex; align-items: center; gap: 10px; padding: 12px 12px 12px 16px; border-bottom: 1px solid var(--line-soft); }
.head .bot { display: grid; place-items: center; }
.head .title { flex: 1; font-weight: 500; font-size: 14px; }
.ws-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-3); }
.ws-dot.connected { background: var(--good); }
.ws-dot.connecting { background: var(--warn); }
.ws-dot.disconnected { background: var(--bad); }

.body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.msg.ai { background: var(--bg-elev); color: var(--text); border-top-left-radius: 4px; align-self: flex-start; }
.msg.user { background: var(--accent); color: #fff; border-top-right-radius: 4px; align-self: flex-end; }

.foot { flex: none; display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--line-soft); }
.foot textarea { flex: 1; min-width: 0; border: 0; outline: 0; background: var(--bg-elev); border-radius: 18px; padding: 9px 14px; font-size: 14px; resize: none; max-height: 120px; }
.foot textarea:focus { background: var(--bg); box-shadow: 0 0 0 2px var(--accent-soft); }
.send { width: 36px; height: 36px; display: grid; place-items: center; border: 0; background: var(--accent); color: #fff; border-radius: 50%; transition: background .15s; }
.send:hover:not(:disabled) { background: var(--accent-hi); }
.send:disabled { opacity: .4; cursor: default; }
.send.stop { background: var(--bad); }

@media (max-width: 720px) {
  .chat-popup { top: 50px; left: 8px; right: 8px; width: auto; height: calc(100vh - 70px); }
}
</style>
