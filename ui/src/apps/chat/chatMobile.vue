<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-[#2e2014]">
    <div class="flex items-center justify-between border-b border-[#4a3828] px-4 py-2.5">
      <div class="flex items-baseline gap-1.5">
        <span class="text-sm font-bold text-[#e8d0a8]">__T_APP_TOP_CHAT__</span>
        <span v-if="contextLabel" class="text-[10px] text-[#6a5840]">{{ contextLabel }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="cursor-pointer text-[#8a7860] transition-colors hover:text-[#c8a060]" @click="newChat" title="__T_CHAT_NEW_TITLE__">
          <Plus class="h-4 w-4" />
        </button>
        <button class="cursor-pointer transition-colors" :class="showHistory ? 'text-[#c8a060]' : 'text-[#8a7860] hover:text-[#c8a060]'" @click="toggleHistory" title="__T_HISTORY_TITLE__">
          <History class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div v-if="showHistory" class="flex-1 overflow-y-auto [scrollbar-width:thin]">
      <div v-if="!historyList.length" class="px-4 py-8 text-center text-xs text-[#6a5840]">__T_HISTORY_EMPTY__</div>
      <button
        v-for="c in historyList"
        :key="c.conversation_id"
        type="button"
        class="flex w-full cursor-pointer items-start gap-2.5 border-b border-[#3a2818] px-4 py-2.5 text-left transition-colors hover:bg-[#3a2a1c] last:border-b-0"
        @click="openChat(c.conversation_id)"
      >
        <div class="min-w-0 flex-1">
          <div class="line-clamp-1 text-[11px] font-semibold leading-relaxed text-[#d8c8a8]">{{ c.title || c.conversation_id.slice(0, 8) }}</div>
          <div class="mt-0.5 text-[10px] text-[#6a5840]">{{ c.created_at }}</div>
        </div>
      </button>
    </div>

    <template v-else>
      <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]" @scroll="onScroll">
        <div class="flex flex-col gap-0 px-3 py-3">
          <div v-if="!messages.length" class="flex flex-col items-center justify-center py-10 text-center">
            <div class="mb-3 text-[32px] grayscale-[0.2]">💬</div>
            <h3 class="mb-1 text-sm font-bold text-[#e8d0a8]">__T_CHAT_EMPTY_TITLE__</h3>
            <p v-if="contextLabel" class="max-w-[260px] text-[11px] leading-relaxed text-[#6a5840]" v-html="'__T_CHAT_SIDE_CONTEXT_HINT__'.replace('{app}', `<b class=&quot;text-[#d4c0a0]&quot;>${contextLabel}</b>`)"></p>
            <p v-else class="max-w-[260px] text-[11px] leading-relaxed text-[#6a5840]">__T_CHAT_EMPTY_DESC__</p>
            <div v-if="quickMessages.length" class="mt-4 flex w-full flex-col gap-1.5 px-1">
              <button v-for="(msg, idx) in quickMessages" :key="idx" @click="sendQuick(msg)" class="cursor-pointer rounded-lg border border-[#4a3828] bg-[#3a2a1a] px-3 py-2 text-left text-[11px] text-[#d4c0a0] transition-colors hover:border-[#c8a060]/30 hover:bg-[#3a2a1c]">{{ msg }}</button>
            </div>
          </div>

          <template v-else>
            <div v-if="hasMore" class="py-1 text-center text-[10px] text-[#6a5840]">
              <span>__T_CHAT_LOAD_MORE__</span>
            </div>

            <div v-for="(m, i) in messages" :key="m._key || i" class="mb-3">
              <div v-if="m.role === 'user'" class="flex justify-end">
                <div class="max-w-[85%] rounded-[14px_14px_4px_14px] bg-[#c8a060] px-3 py-2 text-[12px] leading-relaxed text-[#1a1410]">
                  <div class="whitespace-pre-wrap [word-break:break-word]">{{ m.content }}</div>
                  <div v-if="m.attachments?.length" class="mt-1.5">
                    <template v-for="(f, idx) in m.attachments" :key="idx">
                      <div v-if="f.type === 'file'" class="mb-0.5 rounded border border-black/15 bg-black/10 px-1.5 py-0.5">
                        <div class="text-[10px] font-semibold">{{ f.name }}</div>
                      </div>
                      <div v-else-if="f.type === 'context'" class="mb-0.5 inline-block rounded-full border border-black/10 bg-black/5 px-2 py-0.5 text-[10px] text-[#5a4a38]">{{ f.label }}</div>
                    </template>
                  </div>
                </div>
              </div>

              <div v-else-if="m.role === 'assistant'" class="flex items-start gap-2">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3a2a1a] text-xs">🤖</div>
                <div class="chat-md min-w-0 flex-1 overflow-x-auto rounded-[14px_14px_14px_4px] bg-[#3a2a1a] px-3 py-2 text-[12px] leading-relaxed text-[#d4c0a0]" v-html="renderMd(m.content)" />
              </div>

              <div v-else-if="m.type === 'tool_call'" class="flex items-start gap-2">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a2a14] text-xs">⚙️</div>
                <div class="min-w-0 flex-1 overflow-hidden rounded-lg border border-[#3a2818] bg-[#3a2a1a]">
                  <button type="button" @click="m.expanded = !m.expanded" class="flex w-full cursor-pointer items-center gap-1.5 border-none bg-[#332618] px-2.5 py-1.5 text-left transition-colors hover:bg-[#3a2a1c]">
                    <ChevronRight class="h-2.5 w-2.5 shrink-0 text-[#6a5840] transition-transform" :class="m.expanded ? 'rotate-90' : ''" />
                    <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[#d4c0a0]">{{ m.title || '__T_CHAT_TOOL_CALL__' }}</span>
                    <span v-if="m.result" class="shrink-0 text-[10px] text-[#6a5840]">__T_CHAT_DONE__</span>
                  </button>
                  <div v-if="m.expanded" class="border-t border-[#3a2818]">
                    <div v-if="m.shell && m.command" class="overflow-x-auto whitespace-pre bg-[#1a1410] px-2.5 py-2 font-mono text-[10px] text-[#4ade80]"><span class="select-none text-[#6a5840]">$ </span>{{ m.command }}</div>
                    <div v-else-if="m.detail" class="overflow-x-auto whitespace-pre bg-[#1a1410] px-2.5 py-2 font-mono text-[10px] text-[#4ade80]">{{ m.detail }}</div>
                    <div v-if="m.result" class="max-h-32 overflow-auto whitespace-pre border-t border-[#3a2818] bg-[#1a1410] px-2.5 py-2 font-mono text-[10px] text-[#8a7a60]">{{ m.result }}</div>
                  </div>
                </div>
              </div>

              <div v-else-if="m.role === 'tool' || m.type === 'tool_result'" class="flex items-start gap-2">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center">
                  <span class="h-1 w-1 rounded-full bg-[#6a5840]"></span>
                </div>
                <div class="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[10px] leading-relaxed text-[#6a5840]">{{ m.result || m.content }}</div>
              </div>
            </div>

            <div v-if="busy" class="flex items-start gap-2">
              <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3a2a1a] text-xs">🤖</div>
              <div class="py-1 text-[12px] text-[#6a5840]">__T_CHAT_THINKING__<span class="animate-pulse">...</span></div>
            </div>
          </template>
        </div>
      </div>

      <div class="shrink-0 border-t border-[#4a3828] px-3 pb-3 pt-2">
        <form @submit.prevent="handleSend" class="flex items-end gap-1.5 rounded-lg border border-[#4a3828] bg-[#1a1410] pr-1">
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
            class="min-h-[36px] max-h-[100px] min-w-0 flex-1 resize-none overflow-y-auto border-none bg-transparent px-3 pb-2 pt-2 text-[12px] leading-relaxed text-[#d4c0a0] outline-none placeholder:text-[#4a3a28] disabled:opacity-50"
          />
          <div class="mb-1 shrink-0">
            <button v-if="busy" type="button" @click="stopBusy" class="flex h-7 w-7 items-center justify-center rounded-md border-none bg-[#c8a060] text-[#1a1410] transition-opacity hover:opacity-80">
              <Square class="h-3 w-3 fill-current" />
            </button>
            <button v-else type="submit" :disabled="!input.trim()" class="flex h-7 w-7 items-center justify-center rounded-md border transition-all" :class="input.trim() ? 'cursor-pointer border-transparent bg-[#c8a060] text-[#1a1410] hover:opacity-85' : 'cursor-default border-[#3a2818] bg-[#2a1e14] text-[#6a5840]'">
              <ArrowUp class="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { marked } from 'marked';
import { ArrowUp, ChevronRight, History, Plus, Square } from 'lucide-vue-next';
import { connect, ensureConnected, on, send, wsStatus } from '../../ws.js';

const props = defineProps({
  conversationId: { type: String, default: null },
  pendingMessage: { type: String, default: null }
});

const contextLabel = computed(() => '');
const contextScene = computed(() => 'chat');
const quickMessages = computed(() => []);

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

const currentConversationId = ref(props.conversationId || null);
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
const showHistory = ref(false);
const historyList = ref([]);
const unsubs = [];

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return data;
};

const parseToolArgs = (raw) => {
  if (typeof raw !== 'string') return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const mapToolCallMessage = (toolCall, key) => {
  const name = toolCall?.function?.name || '';
  const args = parseToolArgs(toolCall?.function?.arguments);
  if (name === 'shell' && args) {
    return { type: 'tool_call', shell: true, toolCall, title: args.reason || 'shell', command: args.command || '', _key: key };
  }
  return { type: 'tool_call', toolCall, title: name || '__T_CHAT_TOOL_CALL__', detail: args ? JSON.stringify(args, null, 2) : '', _key: key };
};

const addUniqueMessages = (items, { prepend = false } = {}) => {
  const uniq = [];
  for (const item of items) {
    const key = item?._key;
    if (key && seenKeys.value.has(key)) continue;
    if (key) seenKeys.value.add(key);
    uniq.push(item);
  }
  messages.value = prepend ? [...uniq, ...messages.value] : uniq;
};

const parseMessages = (raw) => {
  const list = [];
  for (const message of raw) {
    const base = message && message._id != null ? `db:${message._id}` : null;
    if (message.role === 'assistant' && message.tool_calls?.length) {
      if (message.content) list.push({ role: 'assistant', content: message.content, _key: base ? `${base}:assistant` : undefined });
      let toolIdx = 0;
      for (const toolCall of message.tool_calls) {
        list.push(mapToolCallMessage(toolCall, base ? `${base}:tool_call:${toolIdx}` : undefined));
        toolIdx += 1;
      }
      continue;
    }
    if (message.role === 'tool') {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if ((list[i].type === 'tool_call' || list[i].type === 'confirm') && !list[i].result) {
          list[i].result = message.content;
          break;
        }
      }
      continue;
    }
    if (message.role === 'assistant' && message.content) {
      list.push({ role: 'assistant', content: message.content, _key: base ? `${base}:assistant` : undefined });
      continue;
    }
    if (message.role === 'user' && message.content) {
      const attachments = Array.isArray(message._meta?.attachments) ? message._meta.attachments : [];
      list.push({ role: 'user', content: message.content, attachments, _key: base ? `${base}:user` : undefined });
    }
  }
  return list;
};

const loadChatPage = async (id, offset = 0, limit = 20) => {
  const params = new URLSearchParams({ conversationId: id, offset: String(offset), limit: String(limit) });
  const data = await request(`/aios/api/chat/messages?${params.toString()}`);
  hasMore.value = data.hasMore;
  loadedOffset.value = (data.offset || 0) + data.messages.length;
  const parsed = parseMessages(data.messages);
  if (offset <= 0) {
    seenKeys.value = new Set();
    addUniqueMessages(parsed, { prepend: false });
  } else {
    addUniqueMessages(parsed, { prepend: true });
  }
};

const resetState = () => {
  currentConversationId.value = null;
  messages.value = [];
  hasMore.value = false;
  loadedOffset.value = 0;
  seenKeys.value = new Set();
  busy.value = false;
  streamingAssistantKey.value = '';
};

const buildChatTitleFromFirstMessage = (text = '') => String(text).replace(/\s+/g, ' ').trim().slice(0, 20) || '__T_CHAT_NEW_TITLE__';

const createNewChat = async (title = '__T_CHAT_NEW_TITLE__') => {
  const data = await request('/aios/api/chat/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, scene: contextScene.value })
  });
  currentConversationId.value = data.conversationId;
  messages.value = [];
  hasMore.value = false;
  loadedOffset.value = 0;
  seenKeys.value = new Set();
};

const ensureChatId = async (text) => {
  if (currentConversationId.value) return currentConversationId.value;
  await createNewChat(buildChatTitleFromFirstMessage(text));
  return currentConversationId.value;
};

const isNearBottom = () => {
  const el = msgBox.value;
  if (!el) return true;
  return el.scrollHeight - (el.scrollTop + el.clientHeight) < 140;
};

const scrollToBottom = (smooth = true) => {
  const doScroll = () => {
    const el = msgBox.value;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else el.scrollTop = el.scrollHeight;
  };
  nextTick(() => { doScroll(); requestAnimationFrame(doScroll); setTimeout(doScroll, 80); });
};

const onScroll = () => {
  const el = msgBox.value;
  if (!el || !hasMore.value || !currentConversationId.value) return;
  if (el.scrollTop < 50) {
    const oldHeight = el.scrollHeight;
    loadChatPage(currentConversationId.value, loadedOffset.value, 20).then(() => {
      nextTick(() => { el.scrollTop = el.scrollHeight - oldHeight; });
    }).catch(() => {});
  }
};

const autoResize = () => {
  const el = textarea.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

const onEnter = (e) => {
  if (composing.value) return;
  e.preventDefault();
  handleSend();
};

const handleSend = async () => {
  const text = input.value.trim();
  if (!text || busy.value) return;
  busy.value = true;

  try {
    await ensureConnected();
  } catch {
    messages.value.push({ role: 'assistant', content: '__T_CHAT_WS_ERROR__' });
    busy.value = false;
    return;
  }

  ensureChatId(text).then((id) => {
    const key = `client:${Date.now()}:user`;
    seenKeys.value.add(key);
    messages.value.push({ role: 'user', content: text, _key: key });
    send({ type: 'message', conversationId: id, content: text });
    input.value = '';
    nextTick(() => {
      if (textarea.value) textarea.value.style.height = 'auto';
      scrollToBottom();
    });
  }).catch((e) => {
    messages.value.push({ role: 'assistant', content: '__T_CHAT_SEND_ERROR__'.replace('{message}', e.message) });
    busy.value = false;
  });
};

const stopBusy = () => {
  send({ type: 'abort', conversationId: currentConversationId.value });
  busy.value = false;
};

const newChat = () => {
  resetState();
  showHistory.value = false;
};

const sendQuick = (msg) => {
  input.value = msg;
  handleSend();
};

const fetchHistory = async () => {
  try {
    historyList.value = await request('/aios/api/chat/list');
  } catch {
    historyList.value = [];
  }
};

const toggleHistory = () => {
  showHistory.value = !showHistory.value;
  if (showHistory.value) fetchHistory();
};

const openChat = async (conversationId) => {
  showHistory.value = false;
  resetState();
  currentConversationId.value = conversationId;
  try {
    await loadChatPage(conversationId, 0, 20);
    scrollToBottom(false);
  } catch {
    resetState();
  }
};

watch(() => messages.value.length, (nextLen, prevLen) => {
  if (prevLen === 0 && nextLen > 0) {
    scrollToBottom(false);
    return;
  }
  if (!isNearBottom()) return;
  if (prevLen > 0 && nextLen - prevLen > 5) return;
  scrollToBottom(true);
});

onMounted(async () => {
  if (wsStatus.value === 'disconnected') connect();

  if (props.pendingMessage) {
    input.value = props.pendingMessage;
    nextTick(() => handleSend());
  } else if (props.conversationId) {
    try {
      currentConversationId.value = props.conversationId;
      await loadChatPage(props.conversationId, 0, 20);
      scrollToBottom(false);
    } catch {}
  } else {
    try {
      const list = await request('/aios/api/chat/list');
      if (list.length > 0) {
        const last = list[0];
        currentConversationId.value = last.conversation_id;
        await loadChatPage(last.conversation_id, 0, 20);
        scrollToBottom(false);
      }
    } catch {}
  }

  unsubs.push(on('delta', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    let key = streamingAssistantKey.value;
    if (!key) {
      key = `ws:${Date.now()}:assistant_stream`;
      streamingAssistantKey.value = key;
      seenKeys.value.add(key);
      messages.value.push({ role: 'assistant', content: '', _key: key, streaming: true });
    }
    const msg = messages.value.find((m) => m._key === key);
    if (msg) msg.content = `${msg.content || ''}${data.delta || ''}`;
    scrollToBottom(true);
  }));

  unsubs.push(on('done', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    const key = streamingAssistantKey.value;
    if (key) {
      const msg = messages.value.find((m) => m._key === key);
      if (msg) msg.streaming = false;
    }
    streamingAssistantKey.value = '';
    busy.value = false;
  }));

  unsubs.push(on('tool_call', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    const streamKey = streamingAssistantKey.value;
    if (streamKey) {
      const msg = messages.value.find((m) => m._key === streamKey);
      if (msg) msg.streaming = false;
      streamingAssistantKey.value = '';
    }
    const key = `ws:${Date.now()}:tool_call`;
    seenKeys.value.add(key);
    messages.value.push(mapToolCallMessage(data.toolCall, key));
  }));

  unsubs.push(on('tool_result', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    for (let i = messages.value.length - 1; i >= 0; i -= 1) {
      const msg = messages.value[i];
      if (msg.type === 'tool_call' && !msg.result) {
        msg.result = data.content;
        return;
      }
    }
    const key = `ws:${Date.now()}:tool_result`;
    seenKeys.value.add(key);
    messages.value.push({ type: 'tool_result', content: data.content, _key: key });
  }));

  unsubs.push(on('error', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    const key = `ws:${Date.now()}:error`;
    seenKeys.value.add(key);
    messages.value.push({ role: 'assistant', content: '__T_CHAT_SEND_ERROR__'.replace('{message}', data.content), _key: key });
    streamingAssistantKey.value = '';
    busy.value = false;
  }));

  unsubs.push(on('aborted', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    streamingAssistantKey.value = '';
    busy.value = false;
  }));
});

onUnmounted(() => {
  unsubs.forEach((fn) => fn());
});
</script>

<style scoped>
.chat-md :deep(p) { margin: 0.3em 0; }
.chat-md :deep(p:first-child) { margin-top: 0; }
.chat-md :deep(p:last-child) { margin-bottom: 0; }
.chat-md :deep(pre) { overflow-x: auto; border-radius: 6px; padding: 8px; margin: 4px 0; background: #1a1410; font-size: 10px; }
.chat-md :deep(code) { font-size: 10px; background: rgba(200,160,96,0.1); padding: 1px 4px; border-radius: 3px; }
.chat-md :deep(pre code) { background: none; padding: 0; }
.chat-md :deep(ul), .chat-md :deep(ol) { padding-left: 1.2em; margin: 0.3em 0; }
.chat-md :deep(blockquote) { border-left: 2px solid #4a3828; padding-left: 8px; margin: 4px 0; color: #8a7a60; }
.chat-md :deep(a) { color: #c8a060; text-decoration: underline; }
.chat-md :deep(h1), .chat-md :deep(h2), .chat-md :deep(h3) { font-size: 13px; font-weight: bold; color: #e8d0a8; margin: 0.4em 0 0.2em; }
</style>
