<template>
  <div class="relative flex h-full flex-col overflow-hidden bg-[#f5f0e8] font-['Georgia','PingFang_SC',serif]">
    <!-- 消息列表 -->
    <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar]:w-1.5" @scroll="onScroll">
      <div class="mx-auto flex max-w-[720px] flex-col gap-0 px-4 py-5">
      <div v-if="!messages.length" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="mb-3 text-[40px] grayscale-[0.2]">💬</div>
        <h2 class="mb-2 text-xl font-bold text-[#5a4a38]">__T_CHAT_EMPTY_TITLE__</h2>
        <p class="max-w-[320px] text-[13px] leading-relaxed text-[#a0907a]">__T_CHAT_EMPTY_DESC__</p>
      </div>
      <template v-else>
        <div v-if="hasMore" class="py-2 text-center text-[11px] text-[#a0907a]">__T_CHAT_LOAD_MORE__</div>
        <div v-for="(m, i) in messages" :key="m._key || i" class="mb-5">
          <div v-if="m.role === 'user'" class="flex justify-end">
            <div class="max-w-[85%] overflow-x-auto rounded-[18px_18px_4px_18px] bg-[#5a3e28] px-4 py-3 text-sm leading-relaxed text-[#f0e8d8] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              <div class="whitespace-pre-wrap [word-break:break-word]">{{ m.content }}</div>
              <div v-if="m.attachments?.length" class="mt-2">
                <template v-for="(f, idx) in m.attachments" :key="idx">
                  <div v-if="f.type === 'file'" class="mb-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1">
                    <div class="text-[11px] font-semibold">{{ f.name }}</div>
                    <div class="break-all text-[10px] text-[#c0a878]">{{ f.path }}</div>
                  </div>
                  <div v-else-if="f.type === 'context'" class="mb-1 inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-[#c0a878]">{{ f.label }}</div>
                </template>
              </div>
            </div>
          </div>
          <div v-else-if="m.role === 'assistant'" class="flex items-start gap-2">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8dcc8] text-base shadow-[0_1px_4px_rgba(0,0,0,0.08)]">🤖</div>
            <div class="prose prose-sm min-w-0 max-w-none flex-1 overflow-x-auto rounded-[18px_18px_18px_4px] border border-[#e8dcc8] bg-[#fffdf8] px-4 py-3 text-[#4a3a28] shadow-[0_1px_4px_rgba(0,0,0,0.04)] prose-headings:text-[#3a2a18] prose-pre:overflow-x-auto prose-pre:border prose-pre:border-[#e8dcc8] prose-pre:bg-[#f5ead8] prose-code:rounded prose-code:bg-[rgba(90,62,40,0.08)] prose-code:px-1 prose-code:py-0.5 prose-blockquote:border-[#d4c0a0] prose-blockquote:text-[#8a7a60]" v-html="renderMd(m.content)" />
          </div>
          <div v-else-if="m.type === 'tool_call'" class="flex items-start gap-2">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dce8d4] text-base shadow-[0_1px_4px_rgba(0,0,0,0.08)]">⚙️</div>
            <div class="min-w-0 flex-1 overflow-hidden rounded-xl border border-[#dcd0b8] bg-[#fffdf8]">
              <button type="button" @click="m.expanded = !m.expanded" class="flex w-full items-center gap-2 border-none bg-[#f5ead8] px-3 py-2 text-left">
                <span class="text-[11px] text-[#5a4a38]">{{ m.title || '__T_CHAT_TOOL_CALL__' }}</span>
                <span v-if="m.result" class="ml-auto shrink-0 text-[11px] text-[#a0907a]">__T_CHAT_DONE__</span>
              </button>
              <div v-if="m.expanded" class="border-t border-[#e8dcc8]">
                <div v-if="m.shell && m.command" class="overflow-x-auto whitespace-pre bg-[#f5ead8] px-3 py-2.5 font-mono text-xs text-[#2d6a30]"><span class="select-none text-[#a0907a]">$ </span>{{ m.command }}</div>
                <div v-else-if="m.detail" class="overflow-x-auto whitespace-pre bg-[#fffdf8] px-3 py-2.5 font-mono text-xs text-[#2d6a30]">{{ m.detail }}</div>
                <div v-if="m.result" class="max-h-48 overflow-auto whitespace-pre border-t border-[#e8dcc8] bg-[#f5ead8] px-3 py-2.5 font-mono text-[11px] text-[#7a6a50]">{{ m.result }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="m.role === 'tool' || m.type === 'tool_result'" class="flex items-start gap-2">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center">
              <span class="h-1.5 w-1.5 rounded-full bg-[#d4c0a0]"></span>
            </div>
            <div class="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-[#a0907a]">{{ m.result || m.content }}</div>
          </div>
        </div>
        <div v-if="busy" class="flex items-start gap-2">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8dcc8] text-base shadow-[0_1px_4px_rgba(0,0,0,0.08)]">🤖</div>
          <div class="py-2 text-sm text-[#a0907a]">__T_CHAT_THINKING__<span class="animate-pulse">...</span></div>
        </div>
      </template>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="shrink-0 bg-[linear-gradient(to_top,#f5f0e8_60%,transparent)] px-4 pt-0" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px)">
      <div class="mx-auto max-w-[720px]">
      <div class="flex items-end gap-2 rounded-2xl border border-[#dcd0b8] bg-[#fffdf8] px-4 py-1 pr-1 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
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
          class="min-h-[52px] max-h-[160px] flex-1 resize-none overflow-y-auto border-none bg-transparent py-3 text-sm leading-relaxed text-[#4a3a28] outline-none placeholder:text-[#c0b098] disabled:opacity-50"
        />
        <button
          v-if="busy"
          type="button"
          @click="stopBusy"
          class="mb-1 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#5a3e28] text-[#f0e8d8] transition-opacity hover:opacity-80"
        >■</button>
        <button
          v-else
          type="button"
          :disabled="!input.trim()"
          @click="handleSend"
          class="mb-1 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border transition-all"
          :class="input.trim() ? 'border-transparent bg-[#5a3e28] text-[#f0e8d8] shadow-[0_2px_8px_rgba(90,62,40,0.3)]' : 'border-[#dcd0b8] bg-[#e8dcc8] text-[#b8a888]'"
        >↑</button>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';
import { connect, send, on, wsStatus, ensureConnected } from '../../ws.js';
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
    if (m.role === 'tool') {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].type === 'tool_call' && !list[i].result) { list[i].result = m.content; break; }
      }
      continue;
    }
    if (m.role === 'assistant' && m.content) list.push({ role: 'assistant', content: m.content, _key: base ? `${base}:a` : undefined });
    if (m.role === 'user' && m.content) {
      const attachments = Array.isArray(m._meta?.attachments) ? m._meta.attachments : [];
      list.push({ role: 'user', content: m.content, attachments, _key: base ? `${base}:u` : undefined });
    }
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
    messages.value.push({
      type: 'tool_call',
      title: data.toolCall?.function?.name || '',
      command: '',
      detail: '',
      result: '',
      expanded: false,
      _key
    });
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
