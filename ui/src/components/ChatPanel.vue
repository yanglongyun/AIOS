<template>
  <div class="fixed inset-0 z-[90] max-md:bg-[rgba(22,14,8,0.45)] max-md:backdrop-blur-[1px]" @click.self="$emit('close')">
    <div class="absolute right-4 top-12 z-[91] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-[#3a2010] bg-[#2e2014] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <!-- 顶栏 -->
      <div class="flex items-center justify-between border-b border-[#4a3828] px-4 py-2.5">
        <div class="flex items-baseline gap-1.5">
          <span class="text-sm font-bold text-[#e8d0a8]">{{ t('app_top_chat') }}</span>
          <span v-if="contextLabel" class="text-[10px] text-[#6a5840]">{{ contextLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="cursor-pointer text-[#8a7860] transition-colors hover:text-[#c8a060]" @click="newChat" :title="t('chat_new_title')">
            <Plus class="h-4 w-4" />
          </button>
          <button class="cursor-pointer transition-colors" :class="showHistory ? 'text-[#c8a060]' : 'text-[#8a7860] hover:text-[#c8a060]'" @click="toggleHistory" :title="t('history_title')">
            <History class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- 历史列表 -->
      <div v-if="showHistory" class="flex-1 overflow-y-auto [scrollbar-width:thin]">
        <div v-if="!historyList.length" class="px-4 py-8 text-center text-xs text-[#6a5840]">{{ t('history_empty') }}</div>
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

      <!-- 聊天内容 -->
      <template v-else>
        <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]" @scroll="onScroll">
          <div class="flex flex-col gap-0 px-3 py-3">

            <!-- 空状态 -->
            <div v-if="!messages.length" class="flex flex-col items-center justify-center py-10 text-center">
              <div class="mb-3 text-[32px] grayscale-[0.2]">💬</div>
              <h3 class="mb-1 text-sm font-bold text-[#e8d0a8]">{{ t('chat_empty_title') }}</h3>
              <p v-if="contextLabel" class="max-w-[260px] text-[11px] leading-relaxed text-[#6a5840]" v-html="t('chat_side_context_hint', { app: `<b class=&quot;text-[#d4c0a0]&quot;>${contextLabel}</b>` })"></p>
              <p v-else class="max-w-[260px] text-[11px] leading-relaxed text-[#6a5840]">{{ t('chat_empty_desc') }}</p>
              <div v-if="quickMessages.length" class="mt-4 flex w-full flex-col gap-1.5 px-1">
                <button v-for="(msg, idx) in quickMessages" :key="idx" @click="sendQuick(msg)" class="cursor-pointer rounded-lg border border-[#4a3828] bg-[#3a2a1a] px-3 py-2 text-left text-[11px] text-[#d4c0a0] transition-colors hover:border-[#c8a060]/30 hover:bg-[#3a2a1c]">{{ msg }}</button>
              </div>
            </div>

            <!-- 消息列表 -->
            <template v-else>
              <div v-if="hasMore" class="py-1 text-center text-[10px] text-[#6a5840]">
                <span>{{ t('chat_load_more') }}</span>
              </div>

              <div v-for="(m, i) in messages" :key="m._key || i" class="mb-3">

                <!-- 用户消息 -->
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

                <!-- 助手消息 -->
                <div v-else-if="m.role === 'assistant'" class="flex items-start gap-2">
                  <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3a2a1a] text-xs">🤖</div>
                  <div class="chat-md min-w-0 flex-1 overflow-x-auto rounded-[14px_14px_14px_4px] bg-[#3a2a1a] px-3 py-2 text-[12px] leading-relaxed text-[#d4c0a0]" v-html="renderMd(m.content)" />
                </div>

                <!-- 工具调用 -->
                <div v-else-if="m.type === 'tool_call'" class="flex items-start gap-2">
                  <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a2a14] text-xs">⚙️</div>
                  <div class="min-w-0 flex-1 overflow-hidden rounded-lg border border-[#3a2818] bg-[#3a2a1a]">
                    <button type="button" @click="m.expanded = !m.expanded" class="flex w-full cursor-pointer items-center gap-1.5 border-none bg-[#332618] px-2.5 py-1.5 text-left transition-colors hover:bg-[#3a2a1c]">
                      <ChevronRight class="h-2.5 w-2.5 shrink-0 text-[#6a5840] transition-transform" :class="m.expanded ? 'rotate-90' : ''" />
                      <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[#d4c0a0]">{{ m.title || t('chat_tool_call') }}</span>
                      <span v-if="m.result" class="shrink-0 text-[10px] text-[#6a5840]">{{ t('chat_done') }}</span>
                    </button>
                    <div v-if="m.expanded" class="border-t border-[#3a2818]">
                      <div v-if="m.shell && m.command" class="overflow-x-auto whitespace-pre bg-[#1a1410] px-2.5 py-2 font-mono text-[10px] text-[#4ade80]"><span class="select-none text-[#6a5840]">$ </span>{{ m.command }}</div>
                      <div v-else-if="m.detail" class="overflow-x-auto whitespace-pre bg-[#1a1410] px-2.5 py-2 font-mono text-[10px] text-[#4ade80]">{{ m.detail }}</div>
                      <div v-if="m.result" class="max-h-32 overflow-auto whitespace-pre border-t border-[#3a2818] bg-[#1a1410] px-2.5 py-2 font-mono text-[10px] text-[#8a7a60]">{{ m.result }}</div>
                    </div>
                  </div>
                </div>

                <!-- tool 结果兜底 -->
                <div v-else-if="m.role === 'tool' || m.type === 'tool_result'" class="flex items-start gap-2">
                  <div class="flex h-6 w-6 shrink-0 items-center justify-center">
                    <span class="h-1 w-1 rounded-full bg-[#6a5840]"></span>
                  </div>
                  <div class="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[10px] leading-relaxed text-[#6a5840]">{{ m.result || m.content }}</div>
                </div>

              </div>

              <!-- 思考中 -->
              <div v-if="busy" class="flex items-start gap-2">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3a2a1a] text-xs">🤖</div>
                <div class="py-1 text-[12px] text-[#6a5840]">{{ t('chat_thinking') }}<span class="animate-pulse">...</span></div>
              </div>
            </template>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="shrink-0 border-t border-[#4a3828] px-3 pb-3 pt-2">
          <form @submit.prevent="handleSend" class="flex items-end gap-1.5 rounded-lg border border-[#4a3828] bg-[#1a1410] pr-1">
            <textarea
              ref="textarea"
              v-model="input"
              @input="autoResize"
              @keydown.enter.exact="onEnter"
              @compositionstart="composing = true"
              @compositionend="composing = false"
              :placeholder="busy ? t('chat_input_placeholder_busy') : t('chat_input_placeholder')"
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
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';
import { ArrowUp, ChevronRight, History, Plus, Square } from 'lucide-vue-next';
import { connect, send, on, wsStatus, ensureConnected } from '../ws.js';
import { chatPanel } from '../stores/chatPanel.js';
import { useI18n } from '../i18n/index.js';

const props = defineProps({
  pendingMessage: { type: String, default: null }
});

const contextLabel = computed(() => chatPanel.state.context?.label || '');
const contextScene = computed(() => chatPanel.state.context?.scene || 'chat');
const quickMessages = computed(() => chatPanel.state.quickMessages);
defineEmits(['close']);

const { t } = useI18n();
marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

const currentConversationId = ref(null);
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

const mapToolCallMessage = (toolCall, _key) => {
  const name = toolCall?.function?.name || '';
  const args = parseToolArgs(toolCall?.function?.arguments);
  if (name === 'shell' && args) {
    return { type: 'tool_call', shell: true, toolCall, title: args.reason || 'shell', command: args.command || '', _key };
  }
  return { type: 'tool_call', toolCall, title: name || t('chat_tool_call'), detail: args ? JSON.stringify(args, null, 2) : '', _key };
};

const addUniqueMessages = (items, { prepend = false } = {}) => {
  const uniq = [];
  for (const it of items) {
    const k = it?._key;
    if (k && seenKeys.value.has(k)) continue;
    if (k) seenKeys.value.add(k);
    uniq.push(it);
  }
  messages.value = prepend ? [...uniq, ...messages.value] : uniq;
};

const parseMessages = (raw) => {
  const list = [];
  for (const m of raw) {
    const base = m && m._id != null ? `db:${m._id}` : null;
    if (m.role === 'assistant' && m.tool_calls?.length) {
      if (m.content) list.push({ role: 'assistant', content: m.content, _key: base ? `${base}:assistant` : undefined });
      let tcIdx = 0;
      for (const tc of m.tool_calls) {
        list.push(mapToolCallMessage(tc, base ? `${base}:tool_call:${tcIdx}` : undefined));
        tcIdx++;
      }
      continue;
    }
    if (m.role === 'tool') {
      for (let i = list.length - 1; i >= 0; i--) {
        if ((list[i].type === 'tool_call' || list[i].type === 'confirm') && !list[i].result) { list[i].result = m.content; break; }
      }
      continue;
    }
    if (m.role === 'assistant' && m.content) {
      list.push({ role: 'assistant', content: m.content, _key: base ? `${base}:assistant` : undefined });
      continue;
    }
    if (m.role === 'user' && m.content) {
      const attachments = Array.isArray(m._meta?.attachments) ? m._meta.attachments : [];
      list.push({ role: m.role, content: m.content, attachments, _key: base ? `${base}:user` : undefined });
    }
  }
  return list;
};

const loadChatPage = async (id, offset = 0, limit = 20) => {
  const params = new URLSearchParams({ conversationId: id, offset: String(offset), limit: String(limit) });
  const data = await request(`/api/chat/messages?${params.toString()}`);
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

const buildChatTitleFromFirstMessage = (text = '') => {
  const prefix = contextLabel.value ? `[${contextLabel.value}] ` : '';
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  return prefix + (normalized.slice(0, 20) || t('chat_new_title'));
};

const createNewChat = async (title = t('chat_new_title')) => {
  const data = await request('/aios/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, scene: contextScene.value }) });
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
  el.style.height = el.scrollHeight + 'px';
};

const onEnter = (e) => { if (composing.value) return; e.preventDefault(); handleSend(); };

const handleSend = async () => {
  const text = input.value.trim();
  if (!text || busy.value) return;
  busy.value = true;

  try { await ensureConnected(); } catch {
    messages.value.push({ role: 'assistant', content: t('chat_ws_error') });
    busy.value = false;
    return;
  }

  const outgoingAttachments = [];
  if (chatPanel.state.context) {
    outgoingAttachments.push({ type: 'context', scene: chatPanel.state.context.scene, label: chatPanel.state.context.label });
  }

  ensureChatId(text).then((id) => {
    const _key = `client:${Date.now()}:user`;
    seenKeys.value.add(_key);
    messages.value.push({ role: 'user', content: text, attachments: outgoingAttachments.length ? outgoingAttachments : undefined, _key });
    send({ type: 'message', conversationId: id, content: text, attachments: outgoingAttachments.length ? outgoingAttachments : undefined });
    input.value = '';
    nextTick(() => { if (textarea.value) textarea.value.style.height = 'auto'; scrollToBottom(); });
  }).catch((e) => {
    messages.value.push({ role: 'assistant', content: t('chat_send_error', { message: e.message }) });
    busy.value = false;
  });
};

const stopBusy = () => { send({ type: 'abort', conversationId: currentConversationId.value }); busy.value = false; };

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
    const scene = contextScene.value;
    const params = scene !== 'chat' ? `?scene=${scene}` : '';
    historyList.value = await request(`/api/chat/list${params}`);
  } catch { historyList.value = []; }
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

// 消息变化时自动滚动
watch(() => messages.value.length, (newLen, oldLen) => {
  if (oldLen === 0 && newLen > 0) { scrollToBottom(false); return; }
  if (!isNearBottom()) return;
  if (oldLen > 0 && newLen - oldLen > 5) return;
  scrollToBottom(true);
});

// 挂载时加载当前 scene 最近对话
onMounted(async () => {
  if (wsStatus.value === 'disconnected') connect();

  // 自动发送 pendingMessage
  if (props.pendingMessage) {
    input.value = props.pendingMessage;
    chatPanel.clearPending();
    nextTick(() => handleSend());
  } else {
    // 按 scene 加载最近一个对话
    const scene = contextScene.value;
    const params = scene !== 'chat' ? `?scene=${scene}` : '';
    try {
      const list = await request(`/api/chat/list${params}`);
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
    const msg = messages.value.find(m => m._key === key);
    if (msg) msg.content = `${msg.content || ''}${data.delta || ''}`;
    scrollToBottom(true);
  }));

  unsubs.push(on('done', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    const key = streamingAssistantKey.value;
    if (key) { const msg = messages.value.find(m => m._key === key); if (msg) msg.streaming = false; }
    streamingAssistantKey.value = '';
    busy.value = false;
  }));

  unsubs.push(on('tool_call', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    const sKey = streamingAssistantKey.value;
    if (sKey) { const msg = messages.value.find(m => m._key === sKey); if (msg) msg.streaming = false; streamingAssistantKey.value = ''; }
    const _key = `ws:${Date.now()}:tool_call`;
    seenKeys.value.add(_key);
    messages.value.push(mapToolCallMessage(data.toolCall, _key));
  }));

  unsubs.push(on('tool_result', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const m = messages.value[i];
      if (m.type === 'tool_call' && !m.result) { m.result = data.content; return; }
    }
    const _key = `ws:${Date.now()}:tool_result`;
    seenKeys.value.add(_key);
    messages.value.push({ type: 'tool_result', content: data.content, _key });
  }));

  unsubs.push(on('error', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    const _key = `ws:${Date.now()}:error`;
    seenKeys.value.add(_key);
    messages.value.push({ role: 'assistant', content: t('chat_send_error', { message: data.content }), _key });
    streamingAssistantKey.value = '';
    busy.value = false;
  }));

  unsubs.push(on('aborted', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    streamingAssistantKey.value = '';
    busy.value = false;
  }));
});

onUnmounted(() => { unsubs.forEach(fn => fn()); });
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
