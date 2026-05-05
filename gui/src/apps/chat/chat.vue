<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col" style="background:var(--color-bg)">
    <div class="flex min-h-0 flex-1 flex-col">
      <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]" style="scrollbar-color:var(--color-line-hi) transparent" @scroll="onScroll">
        <div class="mx-auto flex max-w-[720px] flex-col gap-0 px-5 py-6">
          <div v-if="!messages.length" class="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <div class="mb-4 text-[40px]">💬</div>
            <h2 class="mb-2 text-xl font-bold" style="color:var(--color-ink)">__T_CHAT_EMPTY_TITLE__</h2>
            <p class="max-w-[320px] text-[13px] leading-relaxed" style="color:var(--color-muted)">__T_CHAT_EMPTY_SUBTITLE__</p>
          </div>

          <template v-else>
            <div v-if="hasMore" class="py-2 text-center text-xs" style="color:var(--color-faint)">__T_CHAT_LOAD_MORE__</div>

            <div v-for="(m, i) in messages" :key="m._key || i" :class="isToolMsg(m) && isToolMsg(messages[i + 1]) ? 'mb-3' : 'mb-6'" :data-message-key="m._key || ''">
              <!-- USER: small pill, right-aligned -->
              <div v-if="m.role === 'user'" class="flex justify-end">
                <div class="user-bubble">
                  <div class="whitespace-pre-wrap [word-break:break-word]">{{ m.content }}</div>
                  <div v-if="m.attachments?.length" class="mt-2 flex flex-wrap gap-1.5">
                    <template v-for="(f, idx) in m.attachments" :key="idx">
                      <div v-if="f.type === 'file'" class="rounded-lg px-2 py-1" style="border:1px solid var(--color-line);background:var(--color-bg-elev)">
                        <div class="text-[11px] font-semibold" style="color:var(--color-ink)">{{ f.name }}</div>
                        <div class="break-all text-[10px]" style="color:var(--color-muted)">{{ f.path }}</div>
                      </div>
                      <div v-else-if="f.type === 'context'" class="inline-block rounded-full px-2.5 py-0.5 text-[10px]" style="border:1px solid var(--color-line);background:var(--color-bg-elev);color:var(--color-muted)">{{ f.label }}</div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- ASSISTANT: no bubble, AI avatar + flowing text -->
              <div v-else-if="m.role === 'assistant'" class="flex items-start gap-3">
                <img class="assistant-avatar" :src="aiAvatarUrl" alt="AI" />
                <div class="min-w-0 flex-1">
                  <div class="md text-[14px]" v-html="renderMd(m.content)" />
                  <div v-if="m.remark"
                    class="mt-2 flex items-start gap-1.5 text-[12px] leading-[1.5] text-faint">
                    <FileText :size="13" :stroke-width="1.8" class="shrink-0 mt-[3px]" />
                    <span>{{ m.remark }}</span>
                  </div>
                </div>
              </div>

              <div v-else-if="m.type === 'tool_call'" class="flex items-start gap-2.5">
                <div class="min-w-0 flex-1 overflow-hidden rounded-xl" style="border:1px solid var(--color-line);background:var(--color-bg-elev)">
                  <button type="button" class="flex w-full cursor-pointer items-center gap-2 border-none px-3 py-2 text-left transition-colors" style="background:color-mix(in srgb, var(--color-accent) 8%, transparent)" @mouseover="$event.currentTarget.style.background='rgba(160,120,80,0.09)'" @mouseleave="$event.currentTarget.style.background='rgba(160,120,80,0.05)'" @click="m.expanded = !m.expanded">
                    <ChevronRight class="h-3 w-3 shrink-0 transition-transform" :class="m.expanded ? 'rotate-90' : ''" style="color:var(--color-faint)" />
                    <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs" style="color:var(--color-ink)">{{ m.title || '__T_CHAT_TOOL_CALL__' }}</span>
                    <span v-if="m.result" class="shrink-0 text-[11px]" style="color:var(--color-faint)">__T_COMMON_DONE__</span>
                  </button>
                  <div v-if="m.expanded" style="border-top:1px solid var(--color-line)">
                    <div v-if="m.shell && m.command" class="overflow-x-auto whitespace-pre px-3 py-2.5 font-mono text-xs" style="background:color-mix(in srgb, var(--color-accent) 6%, transparent);color:var(--color-good)"><span class="select-none" style="color:var(--color-faint)">$ </span>{{ m.command }}</div>
                    <div v-else-if="m.detail" class="overflow-x-auto whitespace-pre px-3 py-2.5 font-mono text-xs" style="background:var(--color-bg-elev);color:var(--color-good)">{{ m.detail }}</div>
                    <div v-if="m.result" class="max-h-48 overflow-auto whitespace-pre px-3 py-2.5 font-mono text-[11px]" style="border-top:1px solid var(--color-line);background:color-mix(in srgb, var(--color-accent) 4%, transparent);color:var(--color-muted)">{{ m.result }}</div>
                  </div>
                </div>
              </div>

              <div v-else-if="m.role === 'tool' || m.type === 'tool_result'" class="flex items-start gap-2.5">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center"><span class="h-1.5 w-1.5 rounded-full" style="background:color-mix(in srgb, var(--color-accent) 30%, transparent)"></span></div>
                <div class="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed" style="color:var(--color-faint)">{{ m.result || m.content }}</div>
              </div>
            </div>

            <div v-if="busy" class="flex items-start">
              <div class="py-2 text-sm" style="color:var(--color-muted)">__T_CHAT_THINKING__<span class="animate-pulse">...</span></div>
            </div>
          </template>
        </div>
      </div>

      <div class="shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-0" style="background:linear-gradient(to top,var(--color-bg) 60%,transparent)">
        <div class="mx-auto max-w-[720px]">
          <form
            class="relative flex flex-col rounded-2xl"
            :class="dragActive ? 'ring-2 ring-offset-2' : ''"
            :style="dragActive ? 'border:1px solid var(--color-accent);background:var(--color-bg-elev)' : 'border:1px solid var(--color-line-hi);background:var(--color-bg-elev)'"
            @submit.prevent="handleSend"
            @dragenter="onDragEnter"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent="onDropFiles"
          >
            <input ref="fileInput" type="file" class="hidden" multiple @change="onPickFiles" />
            <div v-if="dragActive" class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center text-sm font-semibold" style="border-color:var(--color-accent);background:color-mix(in srgb, var(--color-accent) 8%, transparent);color:var(--color-accent-hi)">
              {{ uploading ? '__T_CHAT_UPLOADING__' : '__T_CHAT_DROP_FILES__' }}
            </div>
            <div v-if="pendingFiles.length" class="flex flex-wrap gap-1.5 px-3.5 pb-0 pt-2.5">
              <div v-for="(f, idx) in pendingFiles" :key="`${f.path}-${idx}`" class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px]" style="border:1px solid var(--color-line);background:color-mix(in srgb, var(--color-accent) 8%, transparent);color:var(--color-ink)">
                <span class="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">{{ f.name }}</span>
                <button type="button" class="border-none bg-none text-xs" style="color:var(--color-faint)" @click="removePendingFile(idx)">x</button>
              </div>
            </div>
            <p v-if="uploadError" class="px-3.5 pb-0 pt-2 text-xs text-red-500">{{ uploadError }}</p>

            <textarea
              ref="textarea"
              v-model="input"
              rows="1"
              :disabled="busy"
              :placeholder="busy ? '__T_CHAT_BUSY_PLACEHOLDER__' : '__T_CHAT_INPUT_PLACEHOLDER__'"
              class="min-h-[52px] max-h-[200px] w-full resize-none overflow-y-auto border-none bg-transparent px-4 pb-3 pt-3.5 pr-12 text-sm leading-relaxed outline-none disabled:opacity-50"
              style="color:var(--color-ink)"
              @input="autoResize"
              @keydown.enter.exact="onEnter"
              @compositionstart="composing = true"
              @compositionend="composing = false"
            />

            <div class="flex items-center px-3.5 pb-2.5">
              <button type="button" :disabled="busy || uploading" class="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2.5 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50" style="color:var(--color-muted)" @mouseover="$event.currentTarget.style.background='color-mix(in srgb, var(--color-accent) 10%, transparent)';$event.currentTarget.style.color='var(--color-ink)'" @mouseleave="$event.currentTarget.style.background='transparent';$event.currentTarget.style.color='var(--color-muted)'" @click="openFilePicker">
                <Paperclip class="h-3.5 w-3.5" />
                {{ uploading ? '__T_CHAT_UPLOADING__' : '__T_CHAT_UPLOAD_FILE__' }}
              </button>
            </div>

            <div class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button v-if="busy" type="button" class="flex h-[34px] w-[34px] items-center justify-center rounded-full border-none text-white transition-opacity hover:opacity-80" style="background:var(--color-accent)" @click="stopBusy">
                <Square class="h-3.5 w-3.5 fill-current" />
              </button>
              <button v-else type="submit" :disabled="!canSend" class="flex h-[34px] w-[34px] items-center justify-center rounded-full border transition-all" :style="canSend ? 'cursor:pointer;border-color:transparent;background:var(--color-accent);color:var(--color-bg);box-shadow:0 2px 8px color-mix(in srgb, var(--color-accent) 35%, transparent)' : 'cursor:default;border-color:var(--color-line);background:color-mix(in srgb, var(--color-accent) 6%, transparent);color:var(--color-faint)'">
                <ArrowUp class="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      <div class="flex items-center justify-center gap-1.5 pt-1 text-[11px]" style="color:var(--color-faint)">
          <span class="h-1.5 w-1.5 rounded-full" :class="wsStatus === 'connected' ? 'bg-emerald-500' : wsStatus === 'connecting' ? 'animate-pulse bg-amber-400' : 'bg-red-400'"></span>
          <span>{{ wsStatus === 'connected' ? '__T_CONNECTION_CONNECTED__' : wsStatus === 'connecting' ? '__T_CONNECTION_CONNECTING_PLAIN__' : '__T_CONNECTION_DISCONNECTED__' }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { marked } from 'marked';
import { ArrowUp, ChevronRight, Paperclip, Square, FileText } from 'lucide-vue-next';
import { connect, ensureConnected, on, send, wsStatus } from '../../system/ws.js';
import aiAvatarUrl from './ai.png';
const emit = defineEmits(['conversation-change', 'history-change']);

const props = defineProps({
  conversationId: { type: String, default: null },
  pendingMessage: { type: String, default: null },
  intentRequest: { type: Object, default: null },
  contextLabel: { type: String, default: '' },
  contextScene: { type: String, default: 'chat' },
  // 可选：每条 outgoing 消息前自动拼上的上下文文本(显示给用户的气泡仍只显示本人输入)
  contextSnapshot: { type: String, default: '' },
  quickMessages: { type: Array, default: () => [] },
  autoOpenLast: { type: Boolean, default: true }
});

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');
const isToolMsg = (m) => !!m && (m.type === 'tool_call' || m.type === 'tool_result' || m.role === 'tool');
const LAST_CHAT_KEY = 'lastConversationId';

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
const unsubs = [];
const lastIntentRequestId = ref(null);
const canSend = computed(() => !!input.value.trim() || pendingFiles.value.length > 0);

const saveLastChatId = (id) => {
  if (!id) return;
  currentConversationId.value = id;
  localStorage.setItem(LAST_CHAT_KEY, String(id));
  emit('conversation-change', id);
};

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
      list.push({
        role: 'assistant',
        content: message.content,
        remark: message._remark || null,
        _key: base ? `${base}:assistant` : undefined
      });
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
  const data = await request(`/api/chat/messages?${params.toString()}`);
  hasMore.value = data.hasMore;
  loadedOffset.value = (data.offset || 0) + data.messages.length;
  const parsed = parseMessages(data.messages);
  if (offset <= 0) {
    seenKeys.value = new Set();
    addUniqueMessages(parsed, { prepend: false });
    busy.value = data.state === 'running';
    if (data.state !== 'running') streamingAssistantKey.value = '';
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

const buildChatTitleFromFirstMessage = (text = '') => String(text).replace(/\s+/g, ' ').trim().slice(0, 20) || '__T_CHAT_NEW_CONVERSATION__';

const createNewChat = async (title = '__T_CHAT_NEW_CONVERSATION__') => {
  const data = await request('/api/chat/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, scene: props.contextScene })
  });
  messages.value = [];
  hasMore.value = false;
  loadedOffset.value = 0;
  seenKeys.value = new Set();
  saveLastChatId(data.conversationId);
  emit('history-change');
  return data.conversationId;
};

const ensureChatId = async (text) => {
  if (currentConversationId.value) return currentConversationId.value;
  return createNewChat(buildChatTitleFromFirstMessage(text));
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

const openConversation = async (conversationId) => {
  if (!conversationId) {
    resetState();
    emit('conversation-change', null);
    return;
  }
  saveLastChatId(conversationId);
  messages.value = [];
  hasMore.value = false;
  loadedOffset.value = 0;
  seenKeys.value = new Set();
  try {
    await loadChatPage(conversationId, 0, 20);
    scrollToBottom(false);
  } catch (e) {
    if (e?.status === 404) {
      resetState();
      emit('conversation-change', null);
      return;
    }
    messages.value.push({ role: 'assistant', content: '__T_COMMON_ERROR_MESSAGE__'.replace('{message}', e.message) });
  }
};

const handleSend = async () => {
  const text = input.value.trim();
  if (!canSend.value || busy.value) return;
  busy.value = true;

  try {
    await ensureConnected();
  } catch {
    messages.value.push({ role: 'assistant', content: '__T_CHAT_WS_NOT_CONNECTED__' });
    busy.value = false;
    return;
  }

  const baseContent = text || '__T_CHAT_ATTACHMENT_SUMMARY_PROMPT__';
  // 把当前应用上下文 (如果有) 作为引用块拼到发送给后端的内容前面;
  // UI 上的用户气泡仍然只显示本人输入,避免噪音。
  const preface = props.contextSnapshot ? `${props.contextSnapshot}\n\n---\n\n` : '';
  const content = preface + baseContent;
  const outgoingAttachments = pendingFiles.value.map((f) => ({ type: 'file', name: f.name, path: f.path, size: f.size }));

  ensureChatId(text).then((id) => {
    const key = `client:${Date.now()}:user`;
    seenKeys.value.add(key);
    messages.value.push({ role: 'user', content: text, attachments: outgoingAttachments, _key: key });
    send({ type: 'message', conversationId: id, content, attachments: outgoingAttachments });
    input.value = '';
    pendingFiles.value = [];
    nextTick(() => {
      if (textarea.value) textarea.value.style.height = 'auto';
      scrollToBottom();
      emit('history-change');
    });
  }).catch((e) => {
    messages.value.push({ role: 'assistant', content: '__T_COMMON_ERROR_MESSAGE__'.replace('{message}', e.message) });
    busy.value = false;
  });
};

const stopBusy = () => {
  send({ type: 'abort', conversationId: currentConversationId.value });
  busy.value = false;
};

const newChat = () => {
  resetState();
  emit('conversation-change', null);
};

const sendQuick = (msg) => {
  input.value = msg;
  handleSend();
};

const handleIntentRequest = (req) => {
  if (!req?.requestId || req.requestId === lastIntentRequestId.value) return;
  lastIntentRequestId.value = req.requestId;
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
    if (conversationId) openConversation(conversationId);
  }
};

// 上传走统一的 /api/fs/upload (multipart).
// dir 是相对路径,服务器按 cwd 解析为 <AIOS>/files/uploads/chat,响应里
// path 是绝对路径,attachments.js 用前缀校验做安全过滤.
const uploadSingleFile = async (file) => {
  const fd = new FormData();
  fd.append('file', file, file.name);
  const url = '/api/fs/upload?' + new URLSearchParams({ dir: 'files/uploads/chat' }).toString();
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`__T_CHAT_UPLOAD_FAILED__ ${res.status}`);
  const data = await res.json();
  const out = (data.files || [])[0];
  if (!out) throw new Error('__T_CHAT_UPLOAD_EMPTY__');
  return { name: out.name, path: out.path, size: out.size };
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
  } finally {
    uploading.value = false;
  }
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

const onDragEnter = (event) => {
  if (!hasDraggedFiles(event) || busy.value) return;
  dragCounter.value += 1;
  dragActive.value = true;
};

const onDragOver = (event) => {
  if (!hasDraggedFiles(event) || busy.value) return;
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  dragActive.value = true;
};

const onDragLeave = (event) => {
  if (!hasDraggedFiles(event)) return;
  dragCounter.value = Math.max(0, dragCounter.value - 1);
  if (dragCounter.value === 0) dragActive.value = false;
};

const onDropFiles = async (event) => {
  dragCounter.value = 0;
  dragActive.value = false;
  if (busy.value) return;
  await appendFiles(Array.from(event.dataTransfer?.files || []));
};

const openFilePicker = () => {
  uploadError.value = '';
  fileInput.value?.click();
};

const removePendingFile = (idx) => {
  pendingFiles.value.splice(idx, 1);
};

watch(() => props.conversationId, (id) => {
  if (id === currentConversationId.value) return;
  if (!id) {
    newChat();
    return;
  }
  openConversation(id);
}, { immediate: false });

watch(() => props.intentRequest?.requestId, () => {
  handleIntentRequest(props.intentRequest);
}, { immediate: true });

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

  // 如果挂载时已经有 intentRequest，交给 intentRequest watcher 处理，
  // 不要再自动加载"上次的对话"——否则会和 new_and_send 的 handleSend 竞态，
  // 导致界面显示老会话、用户的消息发到一个看不见的新会话。
  if (props.intentRequest) return;

  if (props.pendingMessage) {
    input.value = props.pendingMessage;
    nextTick(() => handleSend());
  } else if (props.conversationId) {
    await openConversation(props.conversationId);
  } else if (props.autoOpenLast) {
    try {
      const list = await request('/api/chat/list');
      const lastChatId = localStorage.getItem(LAST_CHAT_KEY);
      const target = list.find((item) => item.conversation_id === lastChatId) || list[0];
      if (target?.conversation_id) {
        await openConversation(target.conversation_id);
      }
    } catch {}
  }

  unsubs.push(on('delta', (data) => {
    if (data.conversationId !== currentConversationId.value) return;
    busy.value = true;
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
      if (msg) {
        msg.content = data.content || msg.content || '';
        msg.remark = data.remark || null;
        msg.streaming = false;
      }
    }
    streamingAssistantKey.value = '';
    busy.value = false;
    emit('history-change');
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
    messages.value.push({ role: 'assistant', content: '__T_COMMON_ERROR_MESSAGE__'.replace('{message}', data.content), _key: key });
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

defineExpose({
  newChat,
  openConversation
});
</script>

<style scoped>
textarea::placeholder { color: var(--color-faint); }

/* USER bubble — small light-gray pill, right-aligned */
.user-bubble {
  max-width: min(70%, 560px);
  padding: 9px 16px;
  border-radius: 18px;
  background: var(--color-bg-hi);
  color: var(--color-ink);
  font-size: 14px;
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: anywhere;
}

/* ASSISTANT avatar — small circular AI portrait on the left, no bubble around content */
.assistant-avatar {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  margin-top: -2px;    /* visually align with first line baseline */
  user-select: none;
  -webkit-user-drag: none;
}
</style>
