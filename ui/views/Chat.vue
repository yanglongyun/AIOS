<template>
  <History v-if="showHistory" class="absolute inset-0" @open="onHistorySelect" @new="onNewChat" />

  <div v-else class="absolute inset-0 flex min-w-0 overflow-hidden bg-[var(--bg)]">
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
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
        :compacting="compacting"
        @send="handleSend"
        @abort="stopBusy"
      />
    </div>
  </div>
</template>

<script setup>
import { inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { connect, ensureConnected, send, wsStatus } from '../lib/ws.js';
import Composer from '../components/Composer.vue';
import History from '../components/History.vue';
import Messages from '../components/Messages.vue';
import { createConversation, listConversations, loadMessages } from '../lib/api.js';
import { parseMessages } from '../lib/messages.js';
import { setupChatStream } from '../lib/stream.js';
import { t } from '../lib/locale.js';

const setPageNav = inject('pageNav');

const showHistory = ref(false);
const currentChatId = ref(null);
const currentTitle = ref(t('chat_title', 'Agent Chat'));
const messages = ref([]);
const busy = ref(false);
const compacting = ref(false);
const hasMore = ref(false);
const loadedOffset = ref(0);
const input = ref('');
const streamingKey = ref('');
const seenKeys = ref(new Set());
const messagesRef = ref(null);
const composerRef = ref(null);
let unsubs = [];
let suppressTopLoadTimer = null;
const suppressTopLoad = ref(false);

const emptyHints = [
  { icon: '🛠️', label: t('chat_hint_app_label', '帮我做个应用'), desc: t('chat_hint_app_desc', '描述需求，AI 自动写代码上线'), text: t('chat_hint_app_text', '帮我做一个旅行清单应用') },
  { icon: '💻', label: t('chat_hint_shell_label', '执行命令'), desc: t('chat_hint_shell_desc', '在本机终端运行任意 shell 操作'), text: t('chat_hint_shell_text', '查看当前系统磁盘使用情况') },
  { icon: '📄', label: t('chat_hint_file_label', '处理文件'), desc: t('chat_hint_file_desc', '上传附件让 AI 分析、整理、转换'), text: t('chat_hint_file_text', '我想上传一个文件让你帮我分析') },
  { icon: '🤖', label: t('chat_hint_task_label', '自动化任务'), desc: t('chat_hint_task_desc', '设置定时任务，AI 定期执行'), text: t('chat_hint_task_text', '帮我创建一个每天早上推送新闻摘要的任务') },
];

function setDefaultNav() {
  setPageNav(currentTitle.value, null,
    null,
    null
  );
}

function openHistory() {
  showHistory.value = true;
  setPageNav(
    t('chat_history_title', '对话历史'),
    () => { showHistory.value = false; setDefaultNav(); },
    null,
    { icon: 'add', title: t('chat_new_title', '新对话'), fn: onNewChat },
  );
}

async function onHistorySelect(c) {
  showHistory.value = false;
  currentChatId.value = c.id;
  currentTitle.value = c.title || t('chat_title', '对话');
  setDefaultNav();
  await loadInitialPage(c.id);
}

function onNewChat() {
  showHistory.value = false;
  currentChatId.value = null;
  currentTitle.value = t('chat_new_title', 'New Chat');
  messages.value = [];
  seenKeys.value = new Set();
  streamingKey.value = '';
  busy.value = false;
  compacting.value = false;
  hasMore.value = false;
  loadedOffset.value = 0;
  composerRef.value?.clearFiles();
  setDefaultNav();
}

async function onOpenChatEvent(event) {
  const chat = event?.detail?.chat;
  if (!chat?.id) return;
  await onHistorySelect(chat);
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
  return messagesRef.value?.scrollToBottom(smooth);
}

function releaseTopLoadSoon() {
  if (suppressTopLoadTimer) clearTimeout(suppressTopLoadTimer);
  suppressTopLoadTimer = setTimeout(() => {
    suppressTopLoad.value = false;
    suppressTopLoadTimer = null;
  }, 160);
}

async function loadInitialPage(id) {
  suppressTopLoad.value = true;
  try {
    await loadPage(id);
    await scrollToBottom(false);
  } finally {
    releaseTopLoadSoon();
  }
}

async function loadMore(oldHeight) {
  const el = messagesRef.value?.msgBox;
  if (!el || suppressTopLoad.value || !hasMore.value || !currentChatId.value) return;
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
  const title = (text || files[0]?.name || t('chat_file_title', 'File')).slice(0, 20);
  const data = await createConversation(title);
  currentChatId.value = data.chatId || data.chat?.id;
  currentTitle.value = title;
  setDefaultNav();
  window.dispatchEvent(new CustomEvent('agent:refresh-chats'));
}

async function handleSend() {
  const text = input.value.trim();
  const files = composerRef.value?.pendingFiles?.slice() || [];
  if ((!text && !files.length) || busy.value) return;
  busy.value = true;

  try {
    await ensureConnected();
  } catch {
    messages.value.push({ role: 'assistant', content: t('chat_ws_disconnected', '错误: WebSocket 未连接，请检查服务是否启动') });
    busy.value = false;
    return;
  }

  await ensureConversation(text, files);

  const attachments = files.map((f) => ({ type: 'file', name: f.name, path: f.path, size: f.size }));
  const content = text || t('chat_attachment_default_prompt', '请先阅读附件并总结关键信息');
  send({ type: 'send', chatId: currentChatId.value, text: content, source: 'user', attachments });
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
  compacting.value = false;
}

onMounted(async () => {
  setDefaultNav();
  if (wsStatus.value === 'disconnected') connect();
  window.addEventListener('aios:send-chat-message', sendExternalMessage);
  window.addEventListener('agent:new-chat', onNewChat);
  window.addEventListener('agent:open-chat', onOpenChatEvent);
  unsubs = setupChatStream({ messages, currentChatId, busy, compacting, streamingKey, seenKeys, scrollToBottom });

  try {
    const list = await listConversations();
    if (list.length) {
      const last = list[0];
      currentChatId.value = last.id;
      currentTitle.value = last.title || t('chat_title', '对话');
      setDefaultNav();
      await loadInitialPage(last.id);
    }
  } catch {}
});

onUnmounted(() => {
  if (suppressTopLoadTimer) clearTimeout(suppressTopLoadTimer);
  window.removeEventListener('aios:send-chat-message', sendExternalMessage);
  window.removeEventListener('agent:new-chat', onNewChat);
  window.removeEventListener('agent:open-chat', onOpenChatEvent);
  unsubs.forEach((fn) => fn?.());
});
</script>
