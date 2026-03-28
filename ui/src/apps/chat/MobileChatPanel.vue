<template>
  <div class="flex h-full flex-col overflow-hidden bg-[#1a1410]">
    <!-- 消息列表 -->
    <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin]" @scroll="onScroll">
      <div v-if="!messages.length" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="mb-3 text-[40px]">💬</div>
        <p class="text-[13px] text-[#6a5840]">__T_CHAT_EMPTY_DESC__</p>
      </div>
      <template v-else>
        <div v-if="hasMore" class="py-2 text-center text-[11px] text-[#6a5840]">__T_CHAT_LOAD_MORE__</div>
        <div v-for="(m, i) in messages" :key="m._key || i" class="mb-4">
          <div v-if="m.role === 'user'" class="flex justify-end">
            <div class="max-w-[82%] rounded-[16px_16px_4px_16px] bg-[#c8a060] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#1a1410]">
              <div class="whitespace-pre-wrap [word-break:break-word]">{{ m.content }}</div>
            </div>
          </div>
          <div v-else-if="m.role === 'assistant'" class="flex items-start gap-2">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a1e14] text-[14px]">🤖</div>
            <div class="min-w-0 flex-1 rounded-[4px_16px_16px_16px] bg-[#2a1e14] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#d4c0a0]" v-html="renderMd(m.content)" />
          </div>
          <div v-else-if="m.type === 'tool_call'" class="ml-9 rounded-lg border border-[#3a2818] bg-[#2a1e14] px-3 py-2">
            <span class="text-[11px] text-[#6a5840]">⚙️ {{ m.title }}</span>
          </div>
        </div>
        <div v-if="busy" class="flex items-start gap-2">
          <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a1e14] text-[14px]">🤖</div>
          <div class="py-1 text-[13px] text-[#6a5840]">__T_CHAT_THINKING__<span class="animate-pulse">...</span></div>
        </div>
      </template>
    </div>

    <!-- 输入区 -->
    <div class="shrink-0 border-t border-[#2a1e14] px-3 pb-2 pt-2" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px)">
      <div class="flex items-end gap-2 rounded-2xl border border-[#3a2818] bg-[#1e1610] px-3 pr-1 py-1">
        <textarea
          ref="textarea"
          v-model="input"
          @input="autoResize"
          @keydown.enter.exact="onEnter"
          @compositionstart="composing = true"
          @compositionend="composing = false"
          :placeholder="busy ? '__T_CHAT_INPUT_PLACEHOLDER_BUSY__' : '__T_CHAT_INPUT_PLACEHOLDER__'"
          rows="1"
          :disabled="busy"
          class="min-h-[36px] max-h-[120px] flex-1 resize-none overflow-y-auto border-none bg-transparent py-2 text-[13px] leading-relaxed text-[#d4c0a0] outline-none placeholder:text-[#4a3a28] disabled:opacity-50"
        />
        <button
          v-if="busy"
          type="button"
          @click="stopBusy"
          class="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c8a060] text-[#1a1410]"
        >■</button>
        <button
          v-else
          type="button"
          :disabled="!input.trim()"
          @click="handleSend"
          class="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all"
          :class="input.trim() ? 'bg-[#c8a060] text-[#1a1410]' : 'bg-[#2a1e14] text-[#4a3a28]'"
        >↑</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';
import { connect, send, on, wsStatus, ensureConnected } from '../../ws.ts';
const props = defineProps({
  conversationId: { type: String, default: null }
});

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

const currentConversationId = ref(props.conversationId);
const messages = ref([]);
const busy = ref(false);
const hasMore = ref(false);
const loadedOffset = ref(0);
const input = ref('');
const msgBox = ref(null);
const textarea = ref(null);
const composing = ref(false);
const streamingAssistantKey = ref('');
const seenKeys = ref(new Set());
const unsubs = [];

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status}`);
  return data;
};

const parseMessages = (raw) => {
  const list = [];
  for (const m of raw) {
    const base = m._id != null ? `db:${m._id}` : null;
    if (m.role === 'assistant' && m.tool_calls?.length) {
      if (m.content) list.push({ role: 'assistant', content: m.content, _key: base ? `${base}:a` : undefined });
      m.tool_calls.forEach((tc, i) => {
        const name = tc?.function?.name || '';
        list.push({ type: 'tool_call', title: name, _key: base ? `${base}:tc:${i}` : undefined });
      });
      continue;
    }
    if (m.role === 'tool') continue;
    if (m.role === 'assistant' && m.content) list.push({ role: 'assistant', content: m.content, _key: base ? `${base}:a` : undefined });
    if (m.role === 'user' && m.content) list.push({ role: 'user', content: m.content, _key: base ? `${base}:u` : undefined });
  }
  return list;
};

const addMessages = (items, prepend = false) => {
  const uniq = items.filter(it => { if (!it._key || seenKeys.value.has(it._key)) return false; seenKeys.value.add(it._key); return true; });
  messages.value = prepend ? [...uniq, ...messages.value] : uniq;
};

const loadPage = async (id, offset = 0) => {
  const params = new URLSearchParams({ conversationId: id, offset: String(offset), limit: '20' });
  const data = await request(`/aios/api/chat/messages?${params}`);
  hasMore.value = data.hasMore;
  loadedOffset.value = (data.offset || 0) + data.messages.length;
  const parsed = parseMessages(data.messages);
  if (offset <= 0) { seenKeys.value = new Set(); addMessages(parsed, false); }
  else addMessages(parsed, true);
};

const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    const el = msgBox.value;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else el.scrollTop = el.scrollHeight;
  });
};

const onScroll = () => {
  const el = msgBox.value;
  if (!el || !hasMore.value || !currentConversationId.value) return;
  if (el.scrollTop < 50) {
    const oldH = el.scrollHeight;
    loadPage(currentConversationId.value, loadedOffset.value).then(() => nextTick(() => { el.scrollTop = el.scrollHeight - oldH; })).catch(() => {});
  }
};

const autoResize = () => {
  const el = textarea.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
};

const onEnter = (e) => { if (composing.value) return; e.preventDefault(); handleSend(); };

const handleSend = async () => {
  const text = input.value.trim();
  if (!text || busy.value) return;
  busy.value = true;
  try { await ensureConnected(); } catch { messages.value.push({ role: 'assistant', content: '__T_CHAT_WS_ERROR__' }); busy.value = false; return; }

  if (!currentConversationId.value) {
    const data = await request('/aios/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: text.slice(0, 20) }) });
    currentConversationId.value = data.conversationId;
  }

  const _key = `client:${Date.now()}:user`;
  seenKeys.value.add(_key);
  messages.value.push({ role: 'user', content: text, _key });
  send({ type: 'message', conversationId: currentConversationId.value, content: text });
  input.value = '';
  nextTick(() => { if (textarea.value) textarea.value.style.height = 'auto'; scrollToBottom(); });
};

const stopBusy = () => { send({ type: 'abort', conversationId: currentConversationId.value }); busy.value = false; };

watch(() => messages.value.length, (n, o) => {
  if (o === 0 && n > 0) { scrollToBottom(false); return; }
  const el = msgBox.value;
  if (el && el.scrollHeight - (el.scrollTop + el.clientHeight) < 140) scrollToBottom(true);
});

onMounted(async () => {
  if (wsStatus.value === 'disconnected') connect();
  if (currentConversationId.value) {
    try {
      await loadPage(currentConversationId.value);
      scrollToBottom(false);
    } catch {}
  }

  unsubs.push(on('delta', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    let key = streamingAssistantKey.value;
    if (!key) { key = `ws:${Date.now()}:s`; streamingAssistantKey.value = key; seenKeys.value.add(key); messages.value.push({ role: 'assistant', content: '', _key: key }); }
    const msg = messages.value.find(m => m._key === key);
    if (msg) msg.content += data.delta || '';
    scrollToBottom(true);
  }));
  unsubs.push(on('done', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    streamingAssistantKey.value = ''; busy.value = false;
  }));
  unsubs.push(on('tool_call', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    streamingAssistantKey.value = '';
    const _key = `ws:${Date.now()}:tc`;
    seenKeys.value.add(_key);
    messages.value.push({ type: 'tool_call', title: data.toolCall?.function?.name || '', _key });
  }));
  unsubs.push(on('error', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    messages.value.push({ role: 'assistant', content: '__T_CHAT_SEND_ERROR__'.replace('{message}', data.content) });
    streamingAssistantKey.value = ''; busy.value = false;
  }));
  unsubs.push(on('aborted', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    streamingAssistantKey.value = ''; busy.value = false;
  }));
});

onUnmounted(() => unsubs.forEach(fn => fn()));
</script>

<style scoped>
:deep(p) { margin: 0.25em 0; }
:deep(p:first-child) { margin-top: 0; }
:deep(p:last-child) { margin-bottom: 0; }
:deep(pre) { overflow-x: auto; border-radius: 6px; padding: 8px; margin: 4px 0; background: #1a1410; font-size: 11px; }
:deep(code) { font-size: 11px; background: rgba(200,160,96,0.1); padding: 1px 4px; border-radius: 3px; }
:deep(pre code) { background: none; padding: 0; }
</style>
