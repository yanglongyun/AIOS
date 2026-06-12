<template>
  <div class="absolute inset-0 flex overflow-hidden chat-panel">
    <!-- 左侧历史面板（应用内部侧栏，可收合） -->
    <History
      ref="historyRef"
      class="chat-side"
      :class="{ collapsed: !sidebarOpen }"
      :current-id="currentChatId"
      @open="onHistorySelect"
      @new="onNewChat"
    />
    <div v-if="sidebarOpen" class="chat-side-mask" @click="sidebarOpen = false"></div>

    <!-- 右侧主区：消息流 + 输入 -->
    <div class="flex min-w-0 flex-1 flex-col">
      <Messages
        ref="messagesRef"
        :messages="messages"
        :busy="busy"
        :has-more="hasMore"
        :empty-hints="emptyHints"
        @pick-hint="sendHint"
        @top-reached="loadMore"
      />

      <Composer
        ref="composerRef"
        v-model="input"
        :busy="busy"
        @send="handleSend"
        @abort="stopBusy"
      />
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { connect, ensureConnected, send, wsStatus } from '@/system/ws.js';
import { topTitle, topLeftAction } from '@/system/shell.js';
import Composer from './components/Composer.vue';
import History from './components/History.vue';
import Messages from './components/Messages.vue';
import { createConversation, listConversations, loadMessages } from './lib/api.js';
import { parseMessages } from './lib/messages.js';
import { setupChatStream } from './lib/stream.js';

const sidebarOpen = ref(false);
const currentChatId = ref(null);
const currentTitle = ref('对话');
const messages = ref([]);
const busy = ref(false);
const hasMore = ref(false);
const loadedOffset = ref(0);
const input = ref('');
const streamingKey = ref('');
const seenKeys = ref(new Set());
const messagesRef = ref(null);
const composerRef = ref(null);
const historyRef = ref(null);
let unsubs = [];

const emptyHints = [
  { icon: '🛠️', label: '帮我做个应用', desc: '描述需求，AI 自动写代码上线', text: '帮我做一个旅行清单应用' },
  { icon: '💻', label: '执行命令', desc: '在本机终端运行任意 shell 操作', text: '查看当前系统磁盘使用情况' },
  { icon: '📄', label: '处理文件', desc: '上传附件让 AI 分析、整理、转换', text: '我想上传一个文件让你帮我分析' },
  { icon: '🤖', label: '自动化任务', desc: '设置定时任务，AI 定期执行', text: '帮我创建一个每天早上推送新闻摘要的任务' },
];

watch(currentTitle, (v) => { topTitle.value = v || '对话'; });

watch(sidebarOpen, (open) => {
  if (open) historyRef.value?.reload();
});

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

async function onHistorySelect(c) {
  if (isMobile()) sidebarOpen.value = false;
  currentChatId.value = c.id;
  currentTitle.value = c.title || '对话';
  await loadPage(c.id);
  scrollToBottom(false);
}

function onNewChat() {
  if (isMobile()) sidebarOpen.value = false;
  currentChatId.value = null;
  currentTitle.value = '新对话';
  messages.value = [];
  seenKeys.value = new Set();
  streamingKey.value = '';
  busy.value = false;
  hasMore.value = false;
  loadedOffset.value = 0;
  composerRef.value?.clearFiles();
}

function addMessages(items, prepend = false) {
  const uniq = items.filter((item) => {
    if (!item._key || seenKeys.value.has(item._key)) return false;
    seenKeys.value.add(item._key);
    return true;
  });
  messages.value = prepend ? [...uniq, ...messages.value] : uniq;
}

async function loadPage(id, offset = 0) {
  const data = await loadMessages(id, offset, 20);
  hasMore.value = data.hasMore;
  loadedOffset.value = (data.offset || 0) + data.messages.length;
  if (offset <= 0) {
    busy.value = data.state === 'running';
    if (!busy.value) streamingKey.value = '';
  }
  const parsed = parseMessages(data.messages);
  if (offset <= 0) {
    seenKeys.value = new Set();
    addMessages(parsed, false);
  } else {
    addMessages(parsed, true);
  }
}

function scrollToBottom(smooth = true) {
  messagesRef.value?.scrollToBottom(smooth);
}

async function loadMore(oldHeight) {
  const el = messagesRef.value?.msgBox;
  if (!el || !hasMore.value || !currentChatId.value) return;
  await loadPage(currentChatId.value, loadedOffset.value);
  nextTick(() => { el.scrollTop = el.scrollHeight - oldHeight; });
}

watch(() => messages.value.length, (n, o) => {
  if (o === 0 && n > 0) {
    scrollToBottom(false);
    return;
  }
  const el = messagesRef.value?.msgBox;
  if (el && el.scrollHeight - (el.scrollTop + el.clientHeight) < 140) scrollToBottom(true);
});

async function ensureConversation(text, files) {
  if (currentChatId.value) return;
  const title = (text || files[0]?.name || '文件').slice(0, 20);
  const data = await createConversation(title);
  currentChatId.value = data.chatId || data.chat?.id;
  currentTitle.value = title;
}

async function handleSend() {
  const text = input.value.trim();
  const files = composerRef.value?.pendingFiles?.slice() || [];
  if ((!text && !files.length) || busy.value) return;
  busy.value = true;

  try {
    await ensureConnected();
  } catch {
    messages.value.push({ role: 'assistant', content: '错误: WebSocket 未连接，请检查服务是否启动' });
    busy.value = false;
    return;
  }

  await ensureConversation(text, files);

  const attachments = files.map((f) => ({ type: 'file', name: f.name, path: f.path, size: f.size }));
  const content = text || '请先阅读附件并总结关键信息';
  send({ type: 'chat.message', chatId: currentChatId.value, prompt: content, source: 'user', attachments });
  input.value = '';
  composerRef.value?.clearFiles();
  composerRef.value?.resetTextarea();
  scrollToBottom(true);
}

async function sendHint(text) {
  input.value = text;
  await nextTick();
  handleSend();
}

async function sendExternalMessage(event) {
  const text = String(event?.detail?.message || '').trim();
  if (!text || busy.value) return;
  onNewChat();
  input.value = text;
  await nextTick();
  handleSend();
}

function stopBusy() {
  if (currentChatId.value) send({ type: 'chat.abort', chatId: currentChatId.value });
  busy.value = false;
}

onMounted(async () => {
  topTitle.value = currentTitle.value;
  topLeftAction.value = {
    icon: 'menu',
    title: '对话历史',
    fn: () => { sidebarOpen.value = !sidebarOpen.value; }
  };

  if (wsStatus.value === 'disconnected') connect();
  window.addEventListener('aios:send-chat-message', sendExternalMessage);
  unsubs = setupChatStream({ messages, currentChatId, busy, streamingKey, seenKeys, scrollToBottom });

  try {
    const list = await listConversations();
    if (list.length) {
      const last = list[0];
      currentChatId.value = last.id;
      currentTitle.value = last.title || '对话';
      await loadPage(last.id);
      scrollToBottom(false);
    }
  } catch {}
});

onUnmounted(() => {
  topLeftAction.value = null;
  window.removeEventListener('aios:send-chat-message', sendExternalMessage);
  unsubs.forEach((fn) => fn?.());
});
</script>

<style scoped>
.chat-panel {
  background: var(--color-bg);
}
.chat-side {
  width: 295px;
  flex-shrink: 0;
  transition: margin-left 0.22s ease;
}
.chat-side.collapsed {
  margin-left: -295px;
}
.chat-side-mask { display: none; }

/* 移动端:侧栏浮层覆盖,不挤压消息区 */
@media (max-width: 768px) {
  .chat-side {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 30;
    margin-left: 0 !important;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: 0 0 40px rgba(20, 20, 25, 0.18);
  }
  .chat-side:not(.collapsed) { transform: translateX(0); }
  .chat-side-mask {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 25;
    background: rgba(20, 20, 25, 0.28);
  }
}
</style>
