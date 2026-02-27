<template>
  <div class="relative min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900">

    <!-- 聊天操作栏 -->
    <div class="flex items-center justify-end gap-1 px-2 py-1 shrink-0 border-b border-gray-100 dark:border-neutral-800">
      <button @click="goNewChat" title="新对话"
        class="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
      <button @click="activeTab = activeTab === 'history' ? 'chat' : 'history'" title="历史对话"
        class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer"
        :class="activeTab === 'history'
          ? 'text-neutral-700 dark:text-neutral-200 bg-gray-100 dark:bg-neutral-800'
          : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </button>
    </div>

    <!-- 历史面板 -->
    <div v-if="activeTab === 'history'" class="flex-1 overflow-y-auto px-3 py-2">
      <HistoryPanel @open-chat="openChatFromHistory" />
    </div>

    <!-- 聊天主区域 -->
    <template v-else>
      <div ref="msgBox" class="flex-1 overflow-y-auto min-h-0" @scroll="onScroll">
        <div class="mx-auto flex min-h-full max-w-3xl flex-col gap-0 px-5 pt-6 pb-6 xl:max-w-4xl xl:pt-10">

          <!-- 空状态 -->
          <div v-if="!messages.length" class="flex flex-col items-center justify-center flex-1 py-20 text-center">
            <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-neutral-800 shadow-lg">
              <svg class="w-7 h-7 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">有什么可以帮你？</h2>
            <p class="text-neutral-400 text-sm max-w-sm leading-relaxed">
              输入任意内容开始对话，支持自动执行命令或手动确认模式。
            </p>
          </div>

          <!-- 消息列表 -->
          <template v-else>
            <div v-if="hasMore" class="flex justify-center py-2">
              <span class="text-xs text-neutral-400">加载更多...</span>
            </div>

            <div v-for="(m, i) in messages" :key="i" class="mb-6">

              <!-- 用户消息 -->
              <div v-if="m.role === 'user'" class="flex justify-end">
                <div class="max-w-[85%] rounded-2xl rounded-tr-sm bg-gray-100 dark:bg-neutral-800 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                  {{ m.content }}
                </div>
              </div>

              <!-- 助手消息 -->
              <div v-else-if="m.role === 'assistant'" class="group flex items-start gap-3">
                <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 shadow-sm">
                  <svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="markdown-body prose max-w-none text-neutral-800 dark:text-neutral-200" v-html="renderMd(m.content)" />
                  <div v-if="m.suggestions?.length" class="mt-3 flex flex-wrap gap-2">
                    <button
                      v-for="(s, idx) in m.suggestions" :key="`${i}-s-${idx}`"
                      @click="applySuggestion(s)"
                      class="px-3 py-1 rounded-xl text-xs cursor-pointer bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
                      {{ s }}
                    </button>
                  </div>
                  <div class="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="copyText(m.content)"
                      class="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      复制
                    </button>
                  </div>
                </div>
              </div>

              <!-- 工具调用（tool_call / confirm），可折叠 -->
              <div v-else-if="m.type === 'tool_call' || m.type === 'confirm'" class="flex items-start gap-3">
                <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
                  <svg class="w-3.5 h-3.5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div class="min-w-0 flex-1 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                  <!-- 可点击 header -->
                  <button type="button" @click="m.expanded = !m.expanded"
                    class="w-full flex items-center gap-2 px-3 py-2 text-left bg-gray-50 dark:bg-neutral-800/60 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                    <svg class="w-3 h-3 text-neutral-400 shrink-0 transition-transform" :class="m.expanded ? 'rotate-90' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                    <span class="text-xs text-neutral-600 dark:text-neutral-300 truncate flex-1">{{ m.reason || m.command || '工具调用' }}</span>
                    <!-- confirm 待确认 -->
                    <span v-if="m.type === 'confirm' && m.pending" class="text-xs text-amber-600 dark:text-amber-400 shrink-0">待确认</span>
                    <!-- confirm 已处理 -->
                    <span v-else-if="m.type === 'confirm' && m.status" class="text-xs shrink-0" :class="m.status === 'approved' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">
                      {{ m.status === 'approved' ? '✓ 已允许' : '✗ 已拒绝' }}
                    </span>
                    <!-- 有结果 -->
                    <span v-else-if="m.result" class="text-xs text-neutral-400 shrink-0">完成</span>
                  </button>

                  <!-- 展开内容 -->
                  <div v-if="m.expanded" class="border-t border-gray-200 dark:border-neutral-700">
                    <!-- command -->
                    <div v-if="m.command" class="px-3 py-2.5 font-mono text-xs text-green-700 dark:text-green-400 bg-white dark:bg-neutral-900 whitespace-pre-wrap break-all">{{ m.command }}</div>
                    <!-- confirm 按钮 -->
                    <div v-if="m.type === 'confirm' && m.pending" class="px-3 py-2 flex gap-2 border-t border-gray-100 dark:border-neutral-700/50">
                      <button @click="handleApprove(true)" class="px-3 py-1 rounded-lg text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:opacity-80 cursor-pointer transition-opacity">允许</button>
                      <button @click="handleApprove(false)" class="px-3 py-1 rounded-lg text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 hover:opacity-80 cursor-pointer transition-opacity">拒绝</button>
                    </div>
                    <!-- result -->
                    <div v-if="m.result" class="px-3 py-2.5 font-mono text-xs text-neutral-500 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-800/40 border-t border-gray-100 dark:border-neutral-700/50 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">{{ m.result }}</div>
                  </div>
                </div>
              </div>

              <!-- tool 结果（兜底：未能合并到 tool_call 的） -->
              <div v-else-if="m.role === 'tool' || m.type === 'tool_result'" class="flex items-start gap-3">
                <div class="mt-0.5 h-7 w-7 shrink-0 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></div>
                </div>
                <div class="min-w-0 flex-1 font-mono text-xs text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap break-all leading-relaxed">{{ m.result || m.content }}</div>
              </div>

            </div>

            <!-- 思考中 -->
            <div v-if="busy" class="flex items-start gap-3 mb-6">
              <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
                <svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="flex items-center py-2">
                <span class="loading-dots text-sm text-neutral-400">思考中</span>
              </div>
            </div>
          </template>
        </div>
      </div>


      <!-- 底部输入浮层 -->
      <div class="input-gradient shrink-0 mx-auto flex w-full max-w-3xl flex-col items-center px-3.5 pb-2 xl:max-w-4xl" :style="{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 8px)` }">
        <div class="w-full">
          <form @submit.prevent="handleSend"
            class="relative flex w-full flex-col rounded-xl bg-gray-100 dark:bg-gray-800">

            <textarea
              ref="textarea"
              v-model="input"
              @input="autoResize"
              @keydown.enter.exact="onEnter"
              @compositionstart="composing = true"
              @compositionend="composing = false"
              @focus="focused = true"
              @blur="focused = false"
              placeholder="输入消息..."
              rows="1"
              :disabled="busy"
              class="w-full px-3 py-3 bg-transparent text-base md:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none min-h-[52px] max-h-[200px] resize-none overflow-y-auto disabled:opacity-50 pr-12"
            />

            <!-- 底部工具栏 -->
            <div class="flex items-center px-3 pb-2.5 pt-1 text-gray-500 dark:text-gray-400">
              <!-- 模式切换 -->
              <div class="relative">
                <button type="button" @click.stop="showMenu = !showMenu"
                  class="flex items-center gap-1 text-xs cursor-pointer transition-colors rounded-full px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
                  :class="mode === 'auto' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'">
                  <span class="transition-transform inline-block" :class="showMenu ? 'rotate-90' : ''">›</span>
                  {{ mode === 'auto' ? 'Auto' : 'Ask' }}
                </button>
                <div v-if="showMenu"
                  class="absolute bottom-full left-0 mb-2 rounded-xl overflow-hidden z-10 min-w-[160px] shadow-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                  <button type="button" @click="mode = 'auto'; showMenu = false"
                    class="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                    :class="mode === 'auto' ? 'text-green-600 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'">
                    <div class="font-medium mb-0.5">Auto</div>
                    <div class="opacity-60">自动执行所有命令</div>
                  </button>
                  <button type="button" @click="mode = 'ask'; showMenu = false"
                    class="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors border-t border-gray-100 dark:border-neutral-700"
                    :class="mode === 'ask' ? 'text-yellow-600 dark:text-yellow-400' : 'text-neutral-500 dark:text-neutral-400'">
                    <div class="font-medium mb-0.5">Ask</div>
                    <div class="opacity-60">每次执行前需确认</div>
                  </button>
                </div>
              </div>
            </div>

            <!-- 发送/停止按钮（绝对定位右下角） -->
            <div class="absolute bottom-2 right-2 flex items-center gap-1.5">
              <button v-if="busy" type="button" @click="stopBusy"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black border border-transparent hover:opacity-80 transition-opacity cursor-pointer">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              </button>
              <button v-else type="submit" :disabled="!input.trim()"
                class="flex h-8 w-8 items-center justify-center rounded-full border transition-colors cursor-pointer"
                :class="input.trim()
                  ? 'bg-black dark:bg-white text-white dark:text-black border-transparent hover:opacity-80'
                  : 'bg-white dark:bg-gray-600 text-gray-400 dark:text-gray-300 border-gray-200 dark:border-transparent shadow cursor-default'">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
              </button>
            </div>
          </form>

        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import { connect, send, on, wsStatus } from '../ws.js';
import HistoryPanel from '../components/chat/History.vue';


const route = useRoute();
const router = useRouter();

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

const chatId = ref(null);
const chatTitle = ref('');
const messages = ref([]);
const busy = ref(false);
const hasMore = ref(false);
const loadedOffset = ref(0);
const mode = ref('auto');
const activeTab = ref('chat');
const input = ref('');
const msgBox = ref(null);
const textarea = ref(null);
const composing = ref(false);
const showMenu = ref(false);
const focused = ref(false);

const unsubs = [];
const LAST_CHAT_KEY = 'lastChatId';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
};

const saveLastChatId = (id) => { if (id) localStorage.setItem(LAST_CHAT_KEY, String(id)); };

const extractSuggestions = (text = '') => {
  const src = String(text || '');
  const match = src.match(/<suggestions>([\s\S]*?)<\/suggestions>/i);
  if (!match) return { content: src, suggestions: [] };
  const suggestions = (match[1] || '').split(/\r?\n|\|/g).map(l => l.replace(/^\s*[-*\d.)]+\s*/, '').trim()).filter(Boolean).slice(0, 3);
  return { content: src.replace(match[0], '').trim(), suggestions };
};

const parseMessages = (raw) => {
  const list = [];
  for (const m of raw) {
    if (m.role === 'assistant' && m.tool_calls?.length) {
      for (const tc of m.tool_calls) {
        const args = JSON.parse(tc.function.arguments || '{}');
        list.push({ type: 'tool_call', command: args.command, reason: args.reason });
      }
      continue;
    }
    if (m.role === 'tool') {
      // 合并到前一个 tool_call 的 result 字段
      for (let i = list.length - 1; i >= 0; i--) {
        if ((list[i].type === 'tool_call' || list[i].type === 'confirm') && !list[i].result) {
          list[i].result = m.content;
          break;
        }
      }
      continue;
    }
    if (m.role === 'assistant' && m.content) {
      const parsed = extractSuggestions(m.content);
      list.push({ role: 'assistant', content: parsed.content, suggestions: parsed.suggestions });
      continue;
    }
    if (m.role === 'user' && m.content) list.push({ role: m.role, content: m.content });
  }
  return list;
};

const loadChatPage = async (id, offset = 0, limit = 20) => {
  const params = new URLSearchParams({ chatId: id, offset: String(offset), limit: String(limit) });
  const data = await request(`/api/chat/messages?${params.toString()}`);
  hasMore.value = data.hasMore;
  loadedOffset.value = (data.offset || 0) + data.messages.length;
  const parsed = parseMessages(data.messages);
  messages.value = offset > 0 ? [...parsed, ...messages.value] : parsed;
};

const createNewChat = async (title = '新对话') => {
  const data = await request('/api/chat/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
  chatId.value = data.id; chatTitle.value = title; saveLastChatId(data.id);
  messages.value = []; hasMore.value = false; loadedOffset.value = 0;
};

const ensureChatId = async (text) => {
  if (chatId.value) return chatId.value;
  await createNewChat(text.slice(0, 20) || '新对话');
  return chatId.value;
};

const goNewChat = () => router.push({ path: '/chat', query: { new: String(Date.now()) } });
const toggleResult = (m) => { m.expanded = !m.expanded; };
const closeMenu = () => { if (showMenu.value) showMenu.value = false; };
const copyText = (text) => { navigator.clipboard?.writeText(text); };

const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (!msgBox.value) return;
    msgBox.value.scrollTo({ top: msgBox.value.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  });
};

const onScroll = () => {
  const el = msgBox.value;
  if (!el) return;
  const { scrollTop } = el;
  if (!hasMore.value || !chatId.value) return;
  if (scrollTop < 50) {
    const oldHeight = el.scrollHeight;
    loadChatPage(chatId.value, loadedOffset.value, 20).then(() => {
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

const handleSend = () => {
  const text = input.value.trim();
  if (!text || busy.value) return;
  busy.value = true;
  ensureChatId(text).then((id) => {
    messages.value.push({ role: 'user', content: text });
    send({ type: 'message', chatId: id, content: text, mode: mode.value });
    input.value = '';
    nextTick(() => { if (textarea.value) textarea.value.style.height = 'auto'; scrollToBottom(); });
  }).catch((e) => { messages.value.push({ role: 'assistant', content: `错误: ${e.message}` }); busy.value = false; });
};

const stopBusy = () => { busy.value = false; };

const handleApprove = (approved) => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].type === 'confirm' && messages.value[i].pending) {
      messages.value[i].pending = false; messages.value[i].status = approved ? 'approved' : 'rejected'; break;
    }
  }
  send({ type: approved ? 'tool_approve' : 'tool_reject' });
  busy.value = true;
};

const applySuggestion = (text) => {
  input.value = text;
  nextTick(() => { autoResize(); textarea.value?.focus(); });
};

const openChatFromHistory = async (chat) => {
  activeTab.value = 'chat';
  await router.push({ path: `/chat/${chat.id}`, query: { title: chat.title || chat.id.slice(0, 8) } });
};

watch(() => messages.value.length, (newLen, oldLen) => {
  if (oldLen > 0 && newLen - oldLen > 5) return;
  scrollToBottom();
});

watch(() => route.fullPath, async () => {
  if (!route.path.startsWith('/chat')) return;
  activeTab.value = 'chat';
  if (route.query.new) {
    try { await createNewChat(); } catch (e) { messages.value.push({ role: 'assistant', content: `错误: ${e.message}` }); }
    return;
  }
  const id = route.params.id ? String(route.params.id) : null;
  if (!id) {
    const lastId = localStorage.getItem(LAST_CHAT_KEY);
    if (lastId) await router.replace({ path: `/chat/${lastId}` });
    return;
  }
  chatId.value = id; saveLastChatId(id);
  chatTitle.value = typeof route.query.title === 'string' ? route.query.title : '';
  messages.value = []; hasMore.value = false; loadedOffset.value = 0;
  try { await loadChatPage(id, 0, 20); } catch (e) { messages.value.push({ role: 'assistant', content: `错误: ${e.message}` }); }
}, { immediate: true });

onMounted(() => {
  document.addEventListener('click', closeMenu);
  if (wsStatus.value === 'disconnected') connect();

  unsubs.push(on('tool_confirm', (data) => { messages.value.push({ type: 'confirm', command: data.command, reason: data.reason, pending: true, expanded: true }); busy.value = false; }));
  unsubs.push(on('tool_approved', (data) => {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const m = messages.value[i];
      if (m.type === 'confirm' && !m.pending) { m.status = data.approved ? 'approved' : 'rejected'; break; }
    }
  }));
  unsubs.push(on('tool_call', (data) => { messages.value.push({ type: 'tool_call', command: data.command, reason: data.reason }); }));
  unsubs.push(on('tool_result', (data) => {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const m = messages.value[i];
      if ((m.type === 'tool_call' || m.type === 'confirm') && !m.result) { m.result = data.content; return; }
    }
    messages.value.push({ type: 'tool_result', content: data.content });
  }));
  unsubs.push(on('reply', (data) => {
    const parsed = extractSuggestions(data.content || '');
    messages.value.push({ role: 'assistant', content: parsed.content, suggestions: parsed.suggestions });
    busy.value = false;
  }));
  unsubs.push(on('error', (data) => { messages.value.push({ role: 'assistant', content: `错误: ${data.content}` }); busy.value = false; }));
});

onUnmounted(() => { document.removeEventListener('click', closeMenu); unsubs.forEach(fn => fn()); });
</script>

<style>
/* 渐变遮罩 */
.input-gradient {
  background: linear-gradient(to top, #ffffff 40%, rgba(255,255,255,0.9) 75%, transparent);
}
.dark .input-gradient {
  background: linear-gradient(to top, #171717 40%, rgba(23,23,23,0.9) 75%, transparent);
}

/* 工具卡片 */
.tool-card { border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; background: #ffffff; }
.dark .tool-card { border-color: #2a2a2a; background: #1a1a1a; }
.tool-reason { padding: 8px 14px; font-size: 12px; color: #6b7280; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.dark .tool-reason { color: #737373; background: #111; border-bottom-color: #2a2a2a; }
.tool-command { padding: 10px 14px; font-family: ui-monospace, monospace; font-size: 12px; color: #166534; word-break: break-all; background: #f8fafc; }
.dark .tool-command { color: #4ade80; background: transparent; }
.tool-actions { padding: 8px 14px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; }
.dark .tool-actions { border-top-color: #2a2a2a; }
.tool-btn { padding: 4px 14px; border-radius: 8px; font-size: 12px; cursor: pointer; border: none; transition: opacity 0.15s; }
.tool-btn:hover { opacity: 0.8; }
.tool-btn-approve { background: #dcfce7; color: #166534; }
.tool-btn-reject  { background: #fee2e2; color: #991b1b; }
.dark .tool-btn-approve { background: #14532d; color: #86efac; }
.dark .tool-btn-reject  { background: #450a0a; color: #fca5a5; }
.tool-status { padding: 6px 14px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
.dark .tool-status { border-top-color: #2a2a2a; color: #525252; }
.tool-output-wrap { border-top: 1px solid #e5e7eb; }
.dark .tool-output-wrap { border-top-color: #2a2a2a; }
.tool-output-toggle { padding: 6px 14px; font-size: 11px; color: #6b7280; cursor: pointer; background: none; border: none; width: 100%; text-align: left; transition: color 0.15s; }
.tool-output-toggle:hover { color: #374151; }
.dark .tool-output-toggle { color: #525252; }
.dark .tool-output-toggle:hover { color: #a3a3a3; }
.tool-output { padding: 8px 14px; font-family: ui-monospace, monospace; font-size: 11px; color: #374151; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; border-top: 1px solid #e5e7eb; background: #f8fafc; }
.dark .tool-output { color: #a3a3a3; border-top-color: #222; background: transparent; }

/* markdown */
.markdown-body p { margin: 0.5em 0; }
.markdown-body p:first-child { margin-top: 0; }
.markdown-body p:last-child { margin-bottom: 0; }
.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4 { font-weight: 600; margin: 0.8em 0 0.4em; line-height: 1.3; }
.markdown-body h1 { font-size: 1.3em; }
.markdown-body h2 { font-size: 1.15em; }
.markdown-body h3 { font-size: 1em; }
.markdown-body code { background: rgba(0,0,0,0.06); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.85em; font-family: ui-monospace, monospace; }
.dark .markdown-body code { background: rgba(255,255,255,0.08); }
.markdown-body pre { background: #f5f7fa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; overflow-x: auto; margin: 0.6em 0; }
.dark .markdown-body pre { background: #0d0d0d; border-color: #2a2a2a; }
.markdown-body pre code { background: none; padding: 0; font-size: 0.8em; white-space: pre; }
.markdown-body ul,.markdown-body ol { padding-left: 1.5em; margin: 0.4em 0; }
.markdown-body li { margin: 0.25em 0; }
.markdown-body blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; color: #6b7280; margin: 0.5em 0; }
.dark .markdown-body blockquote { border-left-color: #404040; color: #737373; }
.markdown-body a { color: #2563eb; text-decoration: underline; }
.dark .markdown-body a { color: #60a5fa; }
.markdown-body hr { border: none; border-top: 1px solid #e5e7eb; margin: 0.8em 0; }
.dark .markdown-body hr { border-top-color: #2a2a2a; }
.markdown-body table { border-collapse: collapse; width: 100%; margin: 0.5em 0; font-size: 0.875em; }
.markdown-body th,.markdown-body td { border: 1px solid #e5e7eb; padding: 6px 12px; text-align: left; }
.dark .markdown-body th,.dark .markdown-body td { border-color: #2a2a2a; }
.markdown-body th { background: rgba(0,0,0,0.03); font-weight: 600; }
.dark .markdown-body th { background: rgba(255,255,255,0.04); }
.markdown-body strong { font-weight: 600; }
</style>
