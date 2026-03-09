<template>
  <div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] font-['Georgia','PingFang_SC',serif] dark:bg-[#1a1410] dark:bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(255,255,255,0.02)_28px,rgba(255,255,255,0.02)_29px)]">
    <div class="flex min-h-0 flex-1 flex-col">
      <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar]:w-1.5 dark:[&::-webkit-scrollbar-thumb]:bg-white/10" @scroll="onScroll">
        <div class="mx-auto flex max-w-[720px] flex-col gap-0 px-5 py-6">

          <!-- 空状态 -->
          <div v-if="!messages.length" class="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <div class="mb-4 text-[40px] grayscale-[0.2]">💬</div>
            <h2 class="mb-2 text-xl font-bold text-[#5a4a38] dark:text-[#e8dcc8]">有什么可以帮你？</h2>
            <p class="max-w-[320px] text-[13px] leading-relaxed text-[#a0907a] dark:text-[#6a5840]">输入任意内容开始对话，支持自动执行命令或手动确认模式。</p>
          </div>

          <!-- 消息列表 -->
          <template v-else>
            <div v-if="hasMore" class="py-2 text-center text-xs text-[#a0907a] dark:text-[#6a5840]">
              <span>加载更多...</span>
            </div>

            <div v-for="(m, i) in messages" :key="m._key || i" class="mb-5">

              <!-- 用户消息 -->
              <div v-if="m.role === 'user'" class="flex justify-end">
                <div class="max-w-[85%] overflow-x-auto rounded-[18px_18px_4px_18px] bg-[#5a3e28] px-4 py-3 text-sm leading-relaxed text-[#f0e8d8] shadow-[0_2px_8px_rgba(0,0,0,0.1)] dark:bg-[#c8a060] dark:text-[#1a1410] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                  <div class="whitespace-pre-wrap [word-break:break-word]">{{ m.content }}</div>
                  <div v-if="m.attachments?.length" class="mt-2">
                    <div class="mb-1 text-[10px] uppercase tracking-[0.08em] text-[#c0a878] dark:text-[#5a4a38]">附件</div>
                    <div v-for="(f, idx) in m.attachments" :key="`${f.path}-${idx}`" class="mb-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1 dark:border-black/15 dark:bg-black/10">
                      <div class="text-[11px] font-semibold">{{ f.name }}</div>
                      <div class="break-all text-[10px] text-[#c0a878] dark:text-[#5a4a38]">{{ f.path }}</div>
                    </div>
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
                    <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[#5a4a38] dark:text-[#d4c0a0]">{{ m.title || '工具调用' }}</span>
                    <span v-if="m.result" class="shrink-0 text-[11px] text-[#a0907a] dark:text-[#6a5840]">完成</span>
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
              <div class="py-2 text-sm text-[#a0907a] dark:text-[#6a5840]">思考中<span class="animate-pulse">...</span></div>
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
              {{ uploading ? '上传中...' : '拖拽文件到这里即可添加附件' }}
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
              placeholder="输入消息..."
              rows="1"
              :disabled="busy"
              class="min-h-[52px] max-h-[200px] w-full resize-none overflow-y-auto border-none bg-transparent px-4 pb-3 pt-3.5 pr-12 text-sm leading-relaxed text-[#4a3a28] outline-none placeholder:text-[#c0b098] disabled:opacity-50 dark:text-[#d4c0a0] dark:placeholder:text-[#4a3a28]"
            />

            <div class="flex items-center px-3.5 pb-2.5">
              <button type="button" @click="openFilePicker" :disabled="busy || uploading" class="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2.5 text-xs text-[#a0907a] transition-all hover:bg-[#f5ead8] hover:text-[#5a4a38] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#6a5840] dark:hover:bg-[rgba(200,160,96,0.1)] dark:hover:text-[#c8a060]">
                <Paperclip class="h-3.5 w-3.5" />
                {{ uploading ? '上传中...' : '上传文件' }}
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
          <span>{{ wsStatus === 'connected' ? '已连接' : wsStatus === 'connecting' ? '连接中...' : '未连接' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import { ArrowUp, ChevronRight, Copy, Paperclip, Square } from 'lucide-vue-next';
import { connect, send, on, wsStatus, ensureConnected } from '../ws.js';
const route = useRoute();
const router = useRouter();
marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

const conversationId = ref(null);
const CHAT_INPUT_CACHE_KEY = 'chatInputCache';
const chatTitle = ref('');
const messages = ref([]);
const busy = ref(false);
const hasMore = ref(false);
const loadedOffset = ref(0);
const input = ref(localStorage.getItem(CHAT_INPUT_CACHE_KEY) || '');
const msgBox = ref(null);
const textarea = ref(null);
const fileInput = ref(null);
const composing = ref(false);
const uploading = ref(false);
const uploadError = ref('');
const pendingFiles = ref([]);
const streamingAssistantKey = ref('');
const dragActive = ref(false);

// 保存输入到 localStorage
watch(input, (val) => { localStorage.setItem(CHAT_INPUT_CACHE_KEY, val); });
const dragCounter = ref(0);

const seenKeys = ref(new Set());

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

const unsubs = [];
const LAST_CHAT_KEY = 'lastConversationId';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `${res.status} ${res.statusText}`);
  return data;
};

const saveLastChatId = (id) => { if (id) localStorage.setItem(LAST_CHAT_KEY, String(id)); };

const parseToolArgs = (raw) => {
  if (typeof raw !== 'string') return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const mapToolCallMessage = (toolCall, _key) => {
  const name = toolCall?.function?.name || '';
  const args = parseToolArgs(toolCall?.function?.arguments);
  if (name === 'shell' && args) {
    return {
      type: 'tool_call',
      shell: true,
      toolCall,
      title: args.reason || 'shell',
      command: args.command || '',
      _key
    };
  }
  return {
    type: 'tool_call',
    toolCall,
    title: name || '工具调用',
    detail: args ? JSON.stringify(args, null, 2) : '',
    _key
  };
};

const parseMessages = (raw) => {
  const list = [];
  for (const m of raw) {
    const base = m && m._id != null ? `db:${m._id}` : null;

    if (m.role === 'assistant' && m.tool_calls?.length) {
      if (m.content) {
        list.push({ role: 'assistant', content: m.content, _key: base ? `${base}:assistant` : undefined });
      }
      let tcIdx = 0;
      for (const tc of m.tool_calls) {
        list.push(mapToolCallMessage(tc, base ? `${base}:tool_call:${tcIdx}` : undefined));
        tcIdx++;
      }
      continue;
    }
    if (m.role === 'tool') {
      for (let i = list.length - 1; i >= 0; i--) {
        if ((list[i].type === 'tool_call' || list[i].type === 'confirm') && !list[i].result) {
          list[i].result = m.content;
          break;
        }
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

const createNewChat = async (title = '新对话') => {
  const data = await request('/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
  conversationId.value = data.conversationId; chatTitle.value = title; saveLastChatId(data.conversationId);
  messages.value = []; hasMore.value = false; loadedOffset.value = 0;
  seenKeys.value = new Set();
};

const buildChatTitleFromFirstMessage = (text = '') => {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  return normalized.slice(0, 20) || '新对话';
};

const ensureChatId = async (text) => {
  if (conversationId.value) return conversationId.value;
  await createNewChat(buildChatTitleFromFirstMessage(text));
  return conversationId.value;
};

const toggleResult = (m) => { m.expanded = !m.expanded; };
const copyText = (text) => { navigator.clipboard?.writeText(text); };

const isNearBottom = () => {
  const el = msgBox.value;
  if (!el) return true;
  const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
  return distance < 140;
};

const scrollToBottom = (smooth = true) => {
  const doScroll = () => {
    const el = msgBox.value;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else el.scrollTop = el.scrollHeight;
  };
  nextTick(() => {
    doScroll();
    requestAnimationFrame(() => doScroll());
    setTimeout(() => doScroll(), 80);
  });
};

const onScroll = () => {
  const el = msgBox.value;
  if (!el) return;
  const { scrollTop } = el;
  if (!hasMore.value || !conversationId.value) return;
  if (scrollTop < 50) {
    const oldHeight = el.scrollHeight;
    loadChatPage(conversationId.value, loadedOffset.value, 20).then(() => {
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

  try {
    await ensureConnected();
  } catch {
    messages.value.push({ role: 'assistant', content: '错误: WebSocket 未连接，请检查服务是否启动' });
    busy.value = false;
    return;
  }

  const content = text || '请先阅读附件并总结关键信息';
  const outgoingAttachments = pendingFiles.value.map((f) => ({
    name: f.name,
    path: f.path,
    size: f.size
  }));

  ensureChatId(content).then((id) => {
    // 首条消息创建会话后，切换到 /chat/:id，保证刷新可回溯历史
    router.replace({ path: `/chat/${id}` }).catch(() => {});
    const _key = `client:${Date.now()}:user`;
    seenKeys.value.add(_key);
    messages.value.push({ role: 'user', content, attachments: outgoingAttachments, _key });
    send({
      type: 'message',
      conversationId: id,
      content,
      attachments: outgoingAttachments
    });
    input.value = '';
    localStorage.removeItem(CHAT_INPUT_CACHE_KEY);
    pendingFiles.value = [];
    nextTick(() => { if (textarea.value) textarea.value.style.height = 'auto'; scrollToBottom(); });
  }).catch((e) => { messages.value.push({ role: 'assistant', content: `错误: ${e.message}` }); busy.value = false; });
};

const stopBusy = () => {
  send({ type: 'abort' });
  busy.value = false;
};

const openFilePicker = () => {
  uploadError.value = '';
  fileInput.value?.click();
};

const removePendingFile = (idx) => {
  pendingFiles.value.splice(idx, 1);
};

const toDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('文件读取失败'));
  reader.readAsDataURL(file);
});

const uploadSingleFile = async (file) => {
  const dataUrl = await toDataUrl(file);
  const res = await request('/api/files/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: file.name,
      data: dataUrl
    })
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
    uploadError.value = err.message || '上传失败';
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
  const files = Array.from(event.dataTransfer?.files || []);
  await appendFiles(files);
};

watch(() => messages.value.length, (newLen, oldLen) => {
  if (oldLen === 0 && newLen > 0) {
    scrollToBottom(false);
    return;
  }
  if (!isNearBottom()) return;
  if (oldLen > 0 && newLen - oldLen > 5) return;
  scrollToBottom(true);
});

watch(() => route.fullPath, async () => {
  if (!route.path.startsWith('/chat')) return;
  const id = route.params.id ? String(route.params.id) : null;
  if (!id) {
    // /chat 作为默认入口：展示一个干净的新对话 UI；真正的会话在发送第一条消息时创建
    conversationId.value = null;
    chatTitle.value = '新对话';
    messages.value = [];
    hasMore.value = false;
    loadedOffset.value = 0;
    seenKeys.value = new Set();
    busy.value = false;
    return;
  }
  conversationId.value = id; saveLastChatId(id);
  chatTitle.value = typeof route.query.title === 'string' ? route.query.title : '';
  messages.value = []; hasMore.value = false; loadedOffset.value = 0;
  seenKeys.value = new Set();
  try {
    await loadChatPage(id, 0, 20);
    scrollToBottom(false);
  } catch (e) {
    messages.value.push({ role: 'assistant', content: `错误: ${e.message}` });
  }
}, { immediate: true });

onMounted(() => {
  if (wsStatus.value === 'disconnected') connect();

  unsubs.push(on('delta', (data) => {
    let key = streamingAssistantKey.value;
    if (!key) {
      key = `ws:${Date.now()}:assistant_stream`;
      streamingAssistantKey.value = key;
      seenKeys.value.add(key);
      messages.value.push({ role: 'assistant', content: '', _key: key, streaming: true });
    }
    const msg = messages.value.find((m) => m._key === key);
    if (!msg) return;
    msg.content = `${msg.content || ''}${data.delta || ''}`;
    scrollToBottom(true);
  }));

  unsubs.push(on('done', () => {
    const key = streamingAssistantKey.value;
    if (key) {
      const msg = messages.value.find((m) => m._key === key);
      if (msg) msg.streaming = false;
    }
    streamingAssistantKey.value = '';
    busy.value = false;
  }));

  unsubs.push(on('tool_call', (data) => {
    // 工具调用前，如果有正在流式的气泡，先收尾
    const sKey = streamingAssistantKey.value;
    if (sKey) {
      const msg = messages.value.find((m) => m._key === sKey);
      if (msg) msg.streaming = false;
      streamingAssistantKey.value = '';
    }
    const _key = `ws:${Date.now()}:tool_call`;
    seenKeys.value.add(_key);
    messages.value.push(mapToolCallMessage(data.toolCall, _key));
  }));
  unsubs.push(on('tool_result', (data) => {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const m = messages.value[i];
      if (m.type === 'tool_call' && !m.result) { m.result = data.content; return; }
    }
    const _key = `ws:${Date.now()}:tool_result`;
    seenKeys.value.add(_key);
    messages.value.push({ type: 'tool_result', content: data.content, _key });
  }));
  unsubs.push(on('error', (data) => {
    const _key = `ws:${Date.now()}:error`;
    seenKeys.value.add(_key);
    messages.value.push({ role: 'assistant', content: `错误: ${data.content}`, _key });
    streamingAssistantKey.value = '';
    busy.value = false;
  }));
  unsubs.push(on('aborted', () => {
    streamingAssistantKey.value = '';
    busy.value = false;
  }));
});

onUnmounted(() => { unsubs.forEach(fn => fn()); });
</script>
