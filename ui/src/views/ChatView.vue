<template>
  <div class="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#1a1410] font-['Georgia','PingFang_SC',serif]">
    <!-- 左侧对话列表 -->
    <div class="flex w-56 shrink-0 flex-col border-r border-[#2a1e14] bg-[#1e1610]">
      <div class="border-b border-[#2a1e14] px-3 py-2.5">
        <button class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#3a2818] bg-[rgba(200,160,96,0.08)] px-3 py-2 text-[13px] text-[#c8a060] transition-colors hover:bg-[rgba(200,160,96,0.15)]" @click="newChat">
          <Plus class="h-3.5 w-3.5" />
          {{ t('chat_new_title') }}
        </button>
      </div>
      <div class="flex-1 overflow-y-auto px-1.5 py-1.5 [scrollbar-width:thin]">
        <HistoryPanel ref="historyRef" :active-id="currentConversationId" @open-chat="openChatFromHistory" />
      </div>
    </div>

    <!-- 右侧聊天区 -->
    <div class="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] dark:bg-[#1a1410] dark:bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(255,255,255,0.02)_28px,rgba(255,255,255,0.02)_29px)]">
    <div class="flex min-h-0 flex-1 flex-col">
      <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar]:w-1.5 dark:[&::-webkit-scrollbar-thumb]:bg-white/10" @scroll="onScroll">
        <div class="mx-auto flex max-w-[720px] flex-col gap-0 px-5 py-6">

          <!-- 空状态 -->
          <div v-if="!messages.length" class="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <div class="mb-4 text-[40px] grayscale-[0.2]">💬</div>
            <h2 class="mb-2 text-xl font-bold text-[#5a4a38] dark:text-[#e8dcc8]">{{ t('chat_empty_title') }}</h2>
            <p class="max-w-[320px] text-[13px] leading-relaxed text-[#a0907a] dark:text-[#6a5840]">{{ t('chat_empty_desc') }}</p>
          </div>

          <!-- 消息列表 -->
          <template v-else>
            <div v-if="hasMore" class="py-2 text-center text-xs text-[#a0907a] dark:text-[#6a5840]">
              <span>{{ t('chat_load_more') }}</span>
            </div>

            <div v-for="(m, i) in messages" :key="m._key || i" class="mb-5">

              <!-- 用户消息 -->
              <div v-if="m.role === 'user'" class="flex justify-end">
                <div class="max-w-[85%] overflow-x-auto rounded-[18px_18px_4px_18px] bg-[#5a3e28] px-4 py-3 text-sm leading-relaxed text-[#f0e8d8] shadow-[0_2px_8px_rgba(0,0,0,0.1)] dark:bg-[#c8a060] dark:text-[#1a1410] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                  <div class="whitespace-pre-wrap [word-break:break-word]">{{ m.content }}</div>
                  <div v-if="m.attachments?.length" class="mt-2">
                    <template v-for="(f, idx) in m.attachments" :key="idx">
                      <div v-if="f.type === 'file'" class="mb-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1 dark:border-black/15 dark:bg-black/10">
                        <div class="text-[11px] font-semibold">{{ f.name }}</div>
                        <div class="break-all text-[10px] text-[#c0a878] dark:text-[#5a4a38]">{{ f.path }}</div>
                      </div>
                      <div v-else-if="f.type === 'context'" class="mb-1 inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-[#c0a878] dark:border-black/10 dark:bg-black/5 dark:text-[#6a5840]">{{ f.label }}</div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- 助手消息 -->
              <div v-else-if="m.role === 'assistant'" class="flex items-start gap-2.5">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8dcc8] text-base shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:bg-[#2a1e14]">🤖</div>
                <div class="min-w-0 flex-1">
                  <div class="prose prose-sm max-w-none overflow-x-auto rounded-[18px_18px_18px_4px] border border-[#e8dcc8] bg-[#fffdf8] px-4 py-3 text-[#4a3a28] shadow-[0_1px_4px_rgba(0,0,0,0.04)] prose-headings:text-[#3a2a18] prose-pre:overflow-x-auto prose-pre:border prose-pre:border-[#e8dcc8] prose-pre:bg-[#f5ead8] prose-code:rounded prose-code:bg-[rgba(90,62,40,0.08)] prose-code:px-1 prose-code:py-0.5 prose-blockquote:border-[#d4c0a0] prose-blockquote:text-[#8a7a60] dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.8)] dark:text-[#d4c0a0] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)] dark:prose-headings:text-[#e8dcc8] dark:prose-pre:border-[#2a1e14] dark:prose-pre:bg-[#1a1410] dark:prose-code:bg-[rgba(200,160,96,0.1)] dark:prose-blockquote:border-[#3a2a1a] dark:prose-blockquote:text-[#8a7a60]" v-html="renderMd(m.content)" />
                </div>
              </div>

              <!-- 工具调用 -->
              <div v-else-if="m.type === 'tool_call'" class="flex items-start gap-2.5">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dce8d4] text-base shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:bg-[#1a2a14]">⚙️</div>
                <div class="min-w-0 flex-1 overflow-hidden rounded-xl border border-[#dcd0b8] bg-[#fffdf8] dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.8)]">
                  <button type="button" @click="m.expanded = !m.expanded" class="flex w-full cursor-pointer items-center gap-2 border-none bg-[#f5ead8] px-3 py-2 text-left transition-colors hover:bg-[#ece0c8] dark:bg-[rgba(30,22,14,0.4)] dark:hover:bg-[rgba(30,22,14,0.6)]">
                    <ChevronRight class="h-3 w-3 shrink-0 text-[#a0907a] transition-transform dark:text-[#6a5840]" :class="m.expanded ? 'rotate-90' : ''" />
                    <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[#5a4a38] dark:text-[#d4c0a0]">{{ m.title || t('chat_tool_call') }}</span>
                    <span v-if="m.result" class="shrink-0 text-[11px] text-[#a0907a] dark:text-[#6a5840]">{{ t('chat_done') }}</span>
                  </button>
                  <div v-if="m.expanded" class="border-t border-[#e8dcc8] dark:border-[#2a1e14]">
                    <div v-if="m.shell && m.command" class="overflow-x-auto whitespace-pre bg-[#f5ead8] px-3 py-2.5 font-mono text-xs text-[#2d6a30] dark:bg-[rgba(30,22,14,0.4)] dark:text-[#4ade80]"><span class="select-none text-[#a0907a] dark:text-[#6a5840]">$ </span>{{ m.command }}</div>
                    <div v-else-if="m.detail" class="overflow-x-auto whitespace-pre bg-[#fffdf8] px-3 py-2.5 font-mono text-xs text-[#2d6a30] dark:bg-[rgba(30,22,14,0.6)] dark:text-[#4ade80]">{{ m.detail }}</div>
                    <div v-if="m.result" class="max-h-48 overflow-auto whitespace-pre border-t border-[#e8dcc8] bg-[#f5ead8] px-3 py-2.5 font-mono text-[11px] text-[#7a6a50] dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.4)] dark:text-[#8a7a60]">{{ m.result }}</div>
                  </div>
                </div>
              </div>

              <!-- tool 结果兜底 -->
              <div v-else-if="m.role === 'tool' || m.type === 'tool_result'" class="flex items-start gap-2.5">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center">
                  <span class="h-1.5 w-1.5 rounded-full bg-[#d4c0a0] dark:bg-[#6a5840]"></span>
                </div>
                <div class="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-[#a0907a] dark:text-[#6a5840]">{{ m.result || m.content }}</div>
              </div>

            </div>

            <!-- 思考中 -->
            <div v-if="busy" class="flex items-start gap-2.5">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8dcc8] text-base shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:bg-[#2a1e14]">🤖</div>
              <div class="py-2 text-sm text-[#a0907a] dark:text-[#6a5840]">{{ t('chat_thinking') }}<span class="animate-pulse">...</span></div>
            </div>
          </template>
        </div>
      </div>

      <!-- 底部输入 -->
      <div class="shrink-0 bg-[linear-gradient(to_top,#f5f0e8_60%,transparent)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-0 dark:bg-[linear-gradient(to_top,#1a1410_60%,transparent)]">
        <div class="mx-auto max-w-[720px]">
          <form
            @submit.prevent="handleSend"
            @dragenter="onDragEnter"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent="onDropFiles"
            class="relative flex flex-col rounded-2xl border border-[#dcd0b8] bg-[#fffdf8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.8)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
            :class="dragActive ? 'ring-2 ring-[#c8a060] ring-offset-2 ring-offset-[#f5f0e8] dark:ring-offset-[#1a1410]' : ''"
          >
            <input ref="fileInput" type="file" class="hidden" multiple @change="onPickFiles" />

            <div
              v-if="dragActive"
              class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#c8a060] bg-[rgba(200,160,96,0.14)] px-6 text-center text-sm font-semibold text-[#5a3e28] dark:bg-[rgba(200,160,96,0.1)] dark:text-[#e8dcc8]"
            >
              {{ uploading ? t('chat_uploading') : t('chat_drop_files') }}
            </div>

            <div v-if="pendingFiles.length" class="flex flex-wrap gap-1.5 px-3.5 pb-0 pt-2.5">
              <div v-for="(f, idx) in pendingFiles" :key="`${f.path}-${idx}`" class="inline-flex items-center gap-1.5 rounded-full border border-[#dcd0b8] bg-[#f5ead8] px-2.5 py-0.5 text-[11px] text-[#5a4a38] dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.4)] dark:text-[#d4c0a0]">
                <span class="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">{{ f.name }}</span>
                <button type="button" @click="removePendingFile(idx)" class="border-none bg-none text-xs text-[#a0907a] hover:text-[#5a4a38] dark:text-[#6a5840] dark:hover:text-[#c8a060]">x</button>
              </div>
            </div>
            <p v-if="uploadError" class="px-3.5 pb-0 pt-2 text-xs text-[#c04040]">{{ uploadError }}</p>

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
              class="min-h-[52px] max-h-[200px] w-full resize-none overflow-y-auto border-none bg-transparent px-4 pb-3 pt-3.5 pr-12 text-sm leading-relaxed text-[#4a3a28] outline-none placeholder:text-[#c0b098] disabled:opacity-50 dark:text-[#d4c0a0] dark:placeholder:text-[#4a3a28]"
            />

            <div class="flex items-center px-3.5 pb-2.5">
              <button type="button" @click="openFilePicker" :disabled="busy || uploading" class="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2.5 text-xs text-[#a0907a] transition-all hover:bg-[#f5ead8] hover:text-[#5a4a38] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#6a5840] dark:hover:bg-[rgba(200,160,96,0.1)] dark:hover:text-[#c8a060]">
                <Paperclip class="h-3.5 w-3.5" />
                {{ uploading ? t('chat_uploading') : t('chat_upload_file') }}
              </button>
            </div>

            <div class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button v-if="busy" type="button" @click="stopBusy" class="flex h-[34px] w-[34px] items-center justify-center rounded-full border-none bg-[#5a3e28] text-[#f0e8d8] transition-opacity hover:opacity-80 dark:bg-[#c8a060] dark:text-[#1a1410]">
                <Square class="h-3.5 w-3.5 fill-current" />
              </button>
              <button v-else type="submit" :disabled="!input.trim()" class="flex h-[34px] w-[34px] items-center justify-center rounded-full border text-[#b8a888] transition-all dark:text-[#6a5840]" :class="input.trim() ? 'cursor-pointer border-transparent bg-[#5a3e28] text-[#f0e8d8] shadow-[0_2px_8px_rgba(90,62,40,0.3)] hover:opacity-85 dark:bg-[#c8a060] dark:text-[#1a1410] dark:shadow-[0_2px_8px_rgba(200,160,96,0.3)]' : 'cursor-default border-[#dcd0b8] bg-[#e8dcc8] dark:border-[#2a1e14] dark:bg-[#2a1e14]'">
                <ArrowUp class="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
        <div class="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[#b0a090] dark:text-[#5a4a38]">
          <span class="h-1.5 w-1.5 rounded-full bg-[#ccc]" :class="wsStatus === 'connected' ? 'bg-[#6a9a4a]' : wsStatus === 'connecting' ? 'animate-pulse bg-[#d4a840]' : 'bg-[#c04040]'"></span>
          <span>{{ wsStatus === 'connected' ? t('common_connected') : wsStatus === 'connecting' ? t('common_connecting') : t('common_disconnected') }}</span>
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
import HistoryPanel from '../components/chat/History.vue';
import { connect, send, on, wsStatus, ensureConnected } from '../ws.js';
import { useI18n } from '../i18n/index.js';

const viewProps = defineProps({
  id: { type: String, default: null },
  pendingMessage: { type: String, default: null }
});
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
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
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  return normalized.slice(0, 20) || t('chat_new_title');
};

const createNewChat = async (title = t('chat_new_title')) => {
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
    messages.value.push({ role: 'assistant', content: t('chat_ws_error') });
    busy.value = false;
    return;
  }

  const content = text || t('chat_attachment_only_prompt');
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
    messages.value.push({ role: 'assistant', content: t('chat_send_error', { message: e.message }) });
    busy.value = false;
  });
};

const stopBusy = () => { send({ type: 'abort', conversationId: currentConversationId.value }); busy.value = false; };

const newChat = () => {
  resetState();
  router.replace('/chat').catch(() => {});
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
  reader.onerror = () => reject(new Error(t('chat_file_read_failed')));
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
    uploadError.value = err.message || t('chat_upload_failed');
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
    messages.value.push({ role: 'assistant', content: t('chat_send_error', { message: e.message }) });
  });
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
