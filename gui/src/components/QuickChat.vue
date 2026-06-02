<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useViewStore } from '@/stores/view.js';
import { useAppContext } from '@/stores/appContext.js';
import * as api from '@/utils/api.js';
import { send, on, wsStatus } from '@/system/ws.js';

const view = useViewStore();
const appContext = useAppContext();
const route = useRoute();
// 在 chat app 内不显示快捷聊天(避免套娃)
const isChat = computed(() => route.path === '/app/chat');
// 路由切到 chat 时,顺手把已经打开的快捷面板关掉
watch(isChat, (v) => { if (v) view.closeChat(); });
const input = ref('');
const inputEl = ref(null);
const messages = ref([
  { role: 'ai', text: '你好,你可以问我关于当前应用的问题,也可以让我帮你做事。' }
]);
const conversationId = ref(null);
const streaming = ref(false);

watch(() => view.chatOpen, async (open) => {
  if (open) { await nextTick(); inputEl.value?.focus(); }
});

async function ensureConv() {
  if (conversationId.value) return conversationId.value;
  const c = await api.post('/api/chat/create', { title: '快速对话', scene: 'quick' });
  conversationId.value = c.conversationId || c.conversation_id;
  return conversationId.value;
}

async function sendMsg(forceText) {
  const t = String(forceText ?? input.value).trim();
  if (!t || streaming.value) return;
  try { await ensureConv(); }
  catch (e) {
    messages.value.push({ role: 'ai', text: '无法创建对话: ' + (e.message || e) });
    return;
  }
  messages.value.push({ role: 'user', text: t });
  messages.value.push({ role: 'ai', text: '', _streaming: true });
  if (forceText === undefined) input.value = '';
  streaming.value = true;
  send({
    type: 'message',
    conversationId: conversationId.value,
    content: t,
    attachments: [],
    // 应用主动告知 AI 的临时上下文,后端这一轮拼进 system prompt
    appContext: appContext.context || ''
  });
}

function onChip(prompt) {
  if (streaming.value) return;
  sendMsg(prompt.text);
}

function onKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMsg(); }
}
function abort() {
  if (!streaming.value || !conversationId.value) return;
  send({ type: 'abort', conversationId: conversationId.value });
}

onMounted(() => {
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
    <aside v-if="view.chatOpen && !isChat" class="chat-popup">
      <div class="inner-card">
        <header class="head">
          <span class="bot">
            <span class="msi sm">memory</span>
          </span>
          <span class="title">AI CHANNEL</span>
          <span class="ws-dot" :class="wsStatus" :title="'WS: ' + wsStatus"></span>
          <button class="icon-btn close-btn" @click="view.closeChat()" title="关闭">
            <span class="msi sm">close</span>
          </button>
        </header>

        <div class="body">
          <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
            {{ m.text || (m._streaming ? '...' : '') }}
          </div>
        </div>

        <div v-if="appContext.prompts.length" class="chips">
          <button v-for="p in appContext.prompts" :key="p.label"
            class="chip" :disabled="streaming" @click="onChip(p)" :title="p.text">
            {{ p.label }}
          </button>
        </div>

        <div class="foot">
          <textarea ref="inputEl" v-model="input" rows="1" placeholder="问点什么..." @keydown="onKey" />
          <button v-if="streaming" class="send stop" @click="abort"><span class="msi sm">stop</span></button>
          <button v-else class="send" :disabled="!input.trim()" @click="sendMsg"><span class="msi sm">send</span></button>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.chat-popup {
  position: fixed;
  top: 60px; right: 12px;
  width: 400px; max-width: calc(100vw - 24px);
  height: min(580px, calc(100vh - 80px));
  background: var(--bg-elev);
  border-radius: 8px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-3);
  z-index: 60;
  padding: 8px;
  display: flex; flex-direction: column;
  transform-origin: top right;
}
.chat-fade-enter-active { animation: pop-in 0.18s cubic-bezier(.2,.7,.2,1); }
.chat-fade-leave-active { animation: pop-in 0.12s reverse; }
@keyframes pop-in {
  from { opacity: 0; transform: scale(.96) translateY(-6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* 内嵌暗色工作站面板 */
.inner-card {
  flex: 1; min-height: 0;
  background: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--line);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.head { flex: none; display: flex; align-items: center; gap: 10px; padding: 14px 12px 12px 18px; border-bottom: 1px solid var(--line); }
.head .bot { display: grid; place-items: center; }
.head .bot {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(0, 229, 255, .28);
  border-radius: 4px;
  color: var(--accent);
}
.head .title { flex: 1; font-family: var(--font-mono); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
.ws-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-3); }
.ws-dot.connected { background: var(--good); box-shadow: 0 0 6px var(--good); }
.ws-dot.connecting { background: var(--warn); }
.ws-dot.disconnected { background: var(--bad); }

.body { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 14px 14px; display: flex; flex-direction: column; gap: 10px; }
.msg { max-width: 85%; padding: 10px 14px; border-radius: 6px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.msg.ai { background: var(--bg-elev); color: var(--text); border: 1px solid var(--line); border-top-left-radius: 2px; align-self: flex-start; }
.msg.user { background: var(--accent-soft); color: var(--text); border: 1px solid rgba(0, 229, 255, 0.25); border-top-right-radius: 2px; align-self: flex-end; }

.chips {
  flex: none;
  display: flex;
  gap: 6px;
  padding: 0 12px 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.chips::-webkit-scrollbar { display: none; }
.chip {
  flex: none;
  border: 1px solid rgba(0, 229, 255, 0.2);
  background: var(--accent-soft);
  color: var(--accent-fg);
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.chip:hover:not(:disabled) { background: rgba(0, 229, 255, 0.15); border-color: var(--accent); }
.chip:disabled { opacity: .5; cursor: default; }

.foot {
  flex: none; display: flex; align-items: center; gap: 4px;
  padding: 4px 6px 4px 12px;
  margin: 4px 12px 12px;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: 4px;
  transition: all .15s;
}
.foot:focus-within {
  background: var(--bg-card);
  border-color: var(--accent);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.15);
}
.foot textarea {
  flex: 1; min-width: 0;
  border: 0; outline: 0;
  background: transparent;
  padding: 6px 4px;
  font-size: 13.5px;
  resize: none;
  max-height: 120px;
  line-height: 1.4;
}
.send { width: 32px; height: 32px; display: grid; place-items: center; border: 0; background: var(--accent); color: var(--bg-elev); border-radius: 4px; transition: all .15s; flex: none; }
.send:hover:not(:disabled) { background: var(--accent-hi); }
.send:disabled { opacity: .4; cursor: default; background: var(--line); color: var(--text-3); }
.send.stop { background: var(--bad); color: var(--text); }

@media (max-width: 720px) {
  .chat-popup { top: 56px; left: 8px; right: 8px; width: auto; height: calc(100vh - 70px); border-radius: 8px; }
  .inner-card { border-radius: 6px; }
}
</style>
