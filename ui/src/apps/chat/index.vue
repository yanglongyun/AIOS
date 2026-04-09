<template>
  <div class="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
    <!-- 左侧对话列表 -->
    <div class="flex w-56 shrink-0 flex-col border-r border-black/[0.07] bg-[#f7f7f7]">
      <div class="border-b border-black/[0.07] px-3 py-2.5">
        <button class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-black/[0.1] bg-white px-3 py-2 text-[13px] font-semibold text-[#222] transition-colors hover:bg-black/[0.04]" @click="newChat">
          <Plus class="h-3.5 w-3.5" />
          __T_CHAT_NEW_TITLE__
        </button>
      </div>
      <div class="flex-1 overflow-y-auto px-1.5 py-1.5 [scrollbar-width:thin]">
        <HistoryPanel ref="historyRef" :active-id="currentConversationId" @open-chat="openChatFromHistory" />
      </div>
    </div>

    <!-- 右侧聊天区 -->
    <div class="flex min-h-0 min-w-0 flex-1 flex-col bg-[#fafafa]">
    <div class="flex min-h-0 flex-1 flex-col">
      <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar]:w-1.5" @scroll="onScroll">
        <div class="mx-auto flex max-w-[720px] flex-col gap-0 px-5 py-6">

          <!-- 空状态 -->
          <div v-if="!messages.length" class="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <div class="mb-4 text-[40px] grayscale-[0.2]">💬</div>
            <h2 class="mb-2 text-xl font-bold text-[#222]">__T_CHAT_EMPTY_TITLE__</h2>
            <p class="max-w-[320px] text-[13px] leading-relaxed text-black/35">__T_CHAT_EMPTY_DESC__</p>
          </div>

          <!-- 消息列表 -->
          <template v-else>
            <div v-if="hasMore" class="py-2 text-center text-xs text-black/35">
              <span>__T_CHAT_LOAD_MORE__</span>
            </div>

            <div v-for="(m, i) in messages" :key="m._key || i" class="mb-5">

              <!-- 用户消息 -->
              <div v-if="m.role === 'user'" class="flex justify-end">
                <div class="max-w-[85%] overflow-x-auto rounded-[18px_18px_4px_18px] bg-black/[0.07] px-4 py-3 text-sm leading-relaxed text-[#222] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <div class="whitespace-pre-wrap [word-break:break-word]">{{ m.content }}</div>
                  <div v-if="m.attachments?.length" class="mt-2">
                    <template v-for="(f, idx) in m.attachments" :key="idx">
                      <div v-if="f.type === 'file'" class="mb-1 rounded-lg border border-black/[0.08] bg-black/[0.05] px-2 py-1">
                        <div class="text-[11px] font-semibold text-[#222]">{{ f.name }}</div>
                        <div class="break-all text-[10px] text-black/40">{{ f.path }}</div>
                      </div>
                      <div v-else-if="f.type === 'context'" class="mb-1 inline-block rounded-full border border-black/[0.08] bg-black/[0.04] px-2.5 py-0.5 text-[10px] text-black/40">{{ f.label }}</div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- 助手消息 -->
              <div v-else-if="m.role === 'assistant'" class="flex items-start">
                <div class="min-w-0 flex-1">
                  <div class="prose prose-sm max-w-none overflow-x-auto rounded-[18px_18px_18px_4px] border border-black/[0.06] bg-white px-4 py-3 text-[#333] shadow-[0_1px_4px_rgba(0,0,0,0.04)] prose-headings:text-[#222] prose-pre:overflow-x-auto prose-pre:border prose-pre:border-black/[0.08] prose-pre:bg-[#f5f5f5] prose-code:rounded prose-code:bg-black/[0.06] prose-code:px-1 prose-code:py-0.5 prose-blockquote:border-black/15 prose-blockquote:text-black/50" v-html="renderMd(m.content)" />
                </div>
              </div>

              <!-- 工具调用 -->
              <div v-else-if="m.type === 'tool_call'" class="flex items-start gap-2.5">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-base shadow-[0_1px_4px_rgba(0,0,0,0.08)]">⚙️</div>
                <div class="min-w-0 flex-1 overflow-hidden rounded-xl border border-black/[0.06] bg-white">
                  <button type="button" @click="m.expanded = !m.expanded" class="flex w-full cursor-pointer items-center gap-2 border-none bg-black/[0.02] px-3 py-2 text-left transition-colors hover:bg-black/[0.04]">
                    <ChevronRight class="h-3 w-3 shrink-0 text-black/35 transition-transform" :class="m.expanded ? 'rotate-90' : ''" />
                    <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[#333]">{{ m.title || '__T_CHAT_TOOL_CALL__' }}</span>
                    <span v-if="m.result" class="shrink-0 text-[11px] text-black/35">__T_CHAT_DONE__</span>
                  </button>
                  <div v-if="m.expanded" class="border-t border-black/[0.06]">
                    <div v-if="m.shell && m.command" class="overflow-x-auto whitespace-pre bg-black/[0.02] px-3 py-2.5 font-mono text-xs text-emerald-700"><span class="select-none text-black/35">$ </span>{{ m.command }}</div>
                    <div v-else-if="m.detail" class="overflow-x-auto whitespace-pre bg-white px-3 py-2.5 font-mono text-xs text-emerald-700">{{ m.detail }}</div>
                    <div v-if="m.result" class="max-h-48 overflow-auto whitespace-pre border-t border-black/[0.06] bg-black/[0.02] px-3 py-2.5 font-mono text-[11px] text-black/50">{{ m.result }}</div>
                  </div>
                </div>
              </div>

              <!-- tool 结果兜底 -->
              <div v-else-if="m.role === 'tool' || m.type === 'tool_result'" class="flex items-start gap-2.5">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center">
                  <span class="h-1.5 w-1.5 rounded-full bg-black/15"></span>
                </div>
                <div class="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-black/35">{{ m.result || m.content }}</div>
              </div>

            </div>

            <!-- 思考中 -->
            <div v-if="busy" class="flex items-start">
              <div class="py-2 text-sm text-black/35">__T_CHAT_THINKING__<span class="animate-pulse">...</span></div>
            </div>
          </template>
        </div>
      </div>

      <!-- 底部输入 -->
      <div class="shrink-0 bg-[linear-gradient(to_top,#fafafa_60%,transparent)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-0">
        <div class="mx-auto max-w-[720px]">
          <form
            @submit.prevent="handleSend"
            @dragenter="onDragEnter"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent="onDropFiles"
            class="relative flex flex-col rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            :class="dragActive ? 'ring-2 ring-black/30 ring-offset-2 ring-offset-[#fafafa]' : ''"
          >
            <input ref="fileInput" type="file" class="hidden" multiple @change="onPickFiles" />

            <div
              v-if="dragActive"
              class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-black/20 bg-black/[0.03] px-6 text-center text-sm font-semibold text-[#333]"
            >
              {{ uploading ? '__T_CHAT_UPLOADING__' : '__T_CHAT_DROP_FILES__' }}
            </div>

            <div v-if="pendingFiles.length" class="flex flex-wrap gap-1.5 px-3.5 pb-0 pt-2.5">
              <div v-for="(f, idx) in pendingFiles" :key="`${f.path}-${idx}`" class="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-black/[0.03] px-2.5 py-0.5 text-[11px] text-[#333]">
                <span class="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">{{ f.name }}</span>
                <button type="button" @click="removePendingFile(idx)" class="border-none bg-none text-xs text-black/35 hover:text-[#333]">x</button>
              </div>
            </div>
            <p v-if="uploadError" class="px-3.5 pb-0 pt-2 text-xs text-red-500">{{ uploadError }}</p>

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
              class="min-h-[52px] max-h-[200px] w-full resize-none overflow-y-auto border-none bg-transparent px-4 pb-3 pt-3.5 pr-12 text-sm leading-relaxed text-[#222] outline-none placeholder:text-black/25 disabled:opacity-50"
            />

            <div class="flex items-center px-3.5 pb-2.5">
              <button type="button" @click="openFilePicker" :disabled="busy || uploading" class="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2.5 text-xs text-black/35 transition-all hover:bg-black/[0.04] hover:text-[#333] disabled:cursor-not-allowed disabled:opacity-50">
                <Paperclip class="h-3.5 w-3.5" />
                {{ uploading ? '__T_CHAT_UPLOADING__' : '__T_CHAT_UPLOAD_FILE__' }}
              </button>
            </div>

            <div class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button v-if="busy" type="button" @click="stopBusy" class="flex h-[34px] w-[34px] items-center justify-center rounded-full border-none bg-[#222] text-white transition-opacity hover:opacity-80">
                <Square class="h-3.5 w-3.5 fill-current" />
              </button>
              <button v-else type="submit" :disabled="!input.trim()" class="flex h-[34px] w-[34px] items-center justify-center rounded-full border text-[#b8a888] transition-all" :class="input.trim() ? 'cursor-pointer border-transparent bg-[#222] text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:opacity-85' : 'cursor-default border-black/[0.08] bg-black/[0.04] text-black/25'">
                <ArrowUp class="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
        <div class="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-black/30">
          <span class="h-1.5 w-1.5 rounded-full" :class="wsStatus === 'connected' ? 'bg-emerald-500' : wsStatus === 'connecting' ? 'animate-pulse bg-amber-400' : 'bg-red-400'""></span>
          <span>{{ wsStatus === 'connected' ? '__T_COMMON_CONNECTED__' : wsStatus === 'connecting' ? '__T_COMMON_CONNECTING__' : '__T_COMMON_DISCONNECTED__' }}</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import { ArrowUp, ChevronRight, Paperclip, Plus, Square } from 'lucide-vue-next';
import HistoryPanel from './History.vue';
import { connect, send, on, wsStatus, ensureConnected } from '../../ws.js';
const viewProps = defineProps({
  id: { type: String, default: null },
  pendingMessage: { type: String, default: null },
  protocolRequest: { type: Object, default: null }
});
const route = useRoute();
const router = useRouter();
const LAST_CHAT_KEY = 'lastConversationId';

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
const fileInput = ref(null);
const composing = ref(false);
const uploading = ref(false);
const uploadError = ref('');
const pendingFiles = ref([]);
const streamingAssistantKey = ref('');
const dragActive = ref(false);
const dragCounter = ref(0);
const seenKeys = ref(new Set());
const historyRef = ref(null);
const unsubs = [];
const lastProtocolRequestId = ref(null);

const saveLastChatId = (id) => { if (id) localStorage.setItem(LAST_CHAT_KEY, String(id)); };

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
  return { type: 'tool_call', toolCall, title: name || '__T_CHAT_TOOL_CALL__', detail: args ? JSON.stringify(args, null, 2) : '', _key };
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
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  return normalized.slice(0, 20) || '__T_CHAT_NEW_TITLE__';
};

const createNewChat = async (title = '__T_CHAT_NEW_TITLE__') => {
  const data = await request('/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
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
  if ((!text && pendingFiles.value.length === 0) || busy.value) return;
  busy.value = true;

  try { await ensureConnected(); } catch {
    messages.value.push({ role: 'assistant', content: '__T_CHAT_WS_ERROR__' });
    busy.value = false;
    return;
  }

  const content = text || '__T_CHAT_ATTACHMENT_ONLY_PROMPT__';
  const outgoingAttachments = pendingFiles.value.map(f => ({ type: 'file', name: f.name, path: f.path, size: f.size }));

  ensureChatId(text).then((id) => {
    saveLastChatId(id);
    router.replace({ path: `/chat/${id}` }).catch(() => {});
    const _key = `client:${Date.now()}:user`;
    seenKeys.value.add(_key);
    messages.value.push({ role: 'user', content: text, attachments: outgoingAttachments, _key });
    send({ type: 'message', conversationId: id, content, attachments: outgoingAttachments });
    input.value = '';
    pendingFiles.value = [];
    nextTick(() => { if (textarea.value) textarea.value.style.height = 'auto'; scrollToBottom(); historyRef.value?.fetchChats(); });
  }).catch((e) => {
    messages.value.push({ role: 'assistant', content: '__T_CHAT_SEND_ERROR__'.replace('{message}', e.message) });
    busy.value = false;
  });
};

const stopBusy = () => { send({ type: 'abort', conversationId: currentConversationId.value }); busy.value = false; };

const newChat = () => {
  resetState();
  router.replace('/chat').catch(() => {});
};

const handleProtocolRequest = (req) => {
  if (!req?.requestId || req.requestId === lastProtocolRequestId.value) return;
  lastProtocolRequestId.value = req.requestId;
  const intent = req.intent || 'open';
  const payload = req.payload || {};

  if (intent === 'new') {
    newChat();
    return;
  }

  if (intent === 'new_and_send') {
    newChat();
    input.value = String(payload.message || '');
    nextTick(() => {
      autoResize();
      handleSend();
    });
    return;
  }

  if (intent === 'load_conversation') {
    const conversationId = String(payload.conversationId || '').trim();
    if (!conversationId) return;
    router.replace({ path: `/chat/${conversationId}` }).catch(() => {});
  }
};

const openChatFromHistory = (chat) => {
  const id = chat.conversation_id;
  if (id === currentConversationId.value) return;
  currentConversationId.value = id;
  saveLastChatId(id);
  messages.value = [];
  hasMore.value = false;
  loadedOffset.value = 0;
  seenKeys.value = new Set();
  loadChatPage(id, 0, 20).then(() => scrollToBottom(false)).catch(() => resetState());
};

const openFilePicker = () => { uploadError.value = ''; fileInput.value?.click(); };
const removePendingFile = (idx) => { pendingFiles.value.splice(idx, 1); };

const toDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('__T_CHAT_FILE_READ_FAILED__'));
  reader.readAsDataURL(file);
});

const uploadSingleFile = async (file) => {
  const dataUrl = await toDataUrl(file);
  const res = await request('/api/files/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, data: dataUrl, dir: 'files/uploads/chat' })
  });
  return res.file;
};

const appendFiles = async (files = []) => {
  if (!files.length) return;
  uploadError.value = '';
  uploading.value = true;
  try {
    for (const f of files) {
      const uploaded = await uploadSingleFile(f);
      if (uploaded?.path) pendingFiles.value.push(uploaded);
    }
  } catch (err) {
    uploadError.value = err.message || '__T_CHAT_UPLOAD_FAILED__';
  } finally { uploading.value = false; }
};

const onPickFiles = async (e) => {
  const files = Array.from(e.target?.files || []);
  await appendFiles(files);
  if (fileInput.value) fileInput.value.value = '';
};

const hasDraggedFiles = (event) => {
  const types = event?.dataTransfer?.types;
  return !!types && Array.from(types).includes('Files');
};
const onDragEnter = (event) => { if (!hasDraggedFiles(event) || busy.value) return; dragCounter.value += 1; dragActive.value = true; };
const onDragOver = (event) => { if (!hasDraggedFiles(event) || busy.value) return; if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'; dragActive.value = true; };
const onDragLeave = (event) => { if (!hasDraggedFiles(event)) return; dragCounter.value = Math.max(0, dragCounter.value - 1); if (dragCounter.value === 0) dragActive.value = false; };
const onDropFiles = async (event) => { dragCounter.value = 0; dragActive.value = false; if (busy.value) return; await appendFiles(Array.from(event.dataTransfer?.files || [])); };

// 路由驱动的会话切换
watch([() => viewProps.id, () => route.fullPath], () => {
  if (!viewProps.id && !route.path.startsWith('/chat')) return;
  const id = viewProps.id || (route.params.id ? String(route.params.id) : null);
  if (id === currentConversationId.value) return;
  if (!id) { resetState(); return; }
  currentConversationId.value = id;
  saveLastChatId(id);
  messages.value = [];
  hasMore.value = false;
  loadedOffset.value = 0;
  seenKeys.value = new Set();
  loadChatPage(id, 0, 20).then(() => {
    scrollToBottom(false);
  }).catch((e) => {
    if (e?.status === 404) { resetState(); router.replace('/chat'); return; }
    messages.value.push({ role: 'assistant', content: '__T_CHAT_SEND_ERROR__'.replace('{message}', e.message) });
  });
}, { immediate: true });

watch(() => viewProps.protocolRequest?.requestId, () => {
  handleProtocolRequest(viewProps.protocolRequest);
}, { immediate: true });

// 消息变化时自动滚动
watch(() => messages.value.length, (newLen, oldLen) => {
  if (oldLen === 0 && newLen > 0) { scrollToBottom(false); return; }
  if (!isNearBottom()) return;
  if (oldLen > 0 && newLen - oldLen > 5) return;
  scrollToBottom(true);
});

onMounted(() => {
  if (wsStatus.value === 'disconnected') connect();
  if (viewProps.pendingMessage) {
    input.value = viewProps.pendingMessage;
    nextTick(() => handleSend());
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
    messages.value.push({ role: 'assistant', content: '__T_CHAT_SEND_ERROR__'.replace('{message}', data.content), _key });
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
