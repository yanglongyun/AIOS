<template>
  <div class="chat-root">
    <!-- 聊天主区域 -->
    <div class="chat-main">
      <div ref="msgBox" class="chat-scroll" @scroll="onScroll">
        <div class="chat-inner">

          <!-- 空状态 -->
          <div v-if="!messages.length" class="chat-empty">
            <div class="chat-empty-icon">💬</div>
            <h2 class="chat-empty-title">有什么可以帮你？</h2>
            <p class="chat-empty-desc">输入任意内容开始对话，支持自动执行命令或手动确认模式。</p>
          </div>

          <!-- 消息列表 -->
          <template v-else>
            <div v-if="hasMore" class="chat-loadmore">
              <span>加载更多...</span>
            </div>

            <div v-for="(m, i) in messages" :key="m._key || i" class="chat-msg-wrap">

              <!-- 用户消息 -->
              <div v-if="m.role === 'user'" class="chat-msg-user">
                <div class="chat-bubble-user">
                  <div>{{ m.content }}</div>
                  <div v-if="m.attachments?.length" class="chat-attachments">
                    <div class="chat-attach-label">附件</div>
                    <div v-for="(f, idx) in m.attachments" :key="`${f.path}-${idx}`" class="chat-attach-item">
                      <div class="chat-attach-name">{{ f.name }}</div>
                      <div class="chat-attach-path">{{ f.path }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 助手消息 -->
              <div v-else-if="m.role === 'assistant'" class="chat-msg-bot group">
                <div class="chat-avatar">🤖</div>
                <div class="chat-bubble-bot-wrap">
                  <div class="chat-bubble-bot markdown-body" v-html="renderMd(m.content)" />
                  <div v-if="m.suggestions?.length" class="chat-suggestions">
                    <button v-for="(s, idx) in m.suggestions" :key="`${i}-s-${idx}`" @click="applySuggestion(s)" class="chat-suggest-btn">{{ s }}</button>
                  </div>
                  <div class="chat-actions">
                    <button @click="copyText(m.content)" class="chat-action-btn">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      复制
                    </button>
                  </div>
                </div>
              </div>

              <!-- 工具调用 -->
              <div v-else-if="m.type === 'tool_call'" class="chat-msg-bot">
                <div class="chat-avatar chat-avatar-tool">⚙️</div>
                <div class="chat-tool-card">
                  <button type="button" @click="m.expanded = !m.expanded" class="chat-tool-header">
                    <svg class="chat-tool-arrow" :class="m.expanded ? 'rotate-90' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
                    <span class="chat-tool-reason">{{ m.reason || m.command || '工具调用' }}</span>
                    <span v-if="m.result" class="chat-tool-done">完成</span>
                  </button>
                  <div v-if="m.expanded" class="chat-tool-body">
                    <div v-if="m.command" class="chat-tool-cmd">{{ m.command }}</div>
                    <div v-if="m.result" class="chat-tool-result">{{ m.result }}</div>
                  </div>
                </div>
              </div>

              <!-- tool 结果兜底 -->
              <div v-else-if="m.role === 'tool' || m.type === 'tool_result'" class="chat-msg-bot">
                <div class="chat-avatar-dot"></div>
                <div class="chat-tool-fallback">{{ m.result || m.content }}</div>
              </div>

            </div>

            <!-- 思考中 -->
            <div v-if="busy" class="chat-msg-bot">
              <div class="chat-avatar">🤖</div>
              <div class="chat-thinking">思考中<span class="chat-dots">...</span></div>
            </div>
          </template>
        </div>
      </div>

      <!-- 底部输入 -->
      <div class="chat-input-area">
        <div class="chat-input-inner">
          <form @submit.prevent="handleSend" class="chat-form">
            <input ref="fileInput" type="file" class="hidden" multiple @change="onPickFiles" />

            <div v-if="pendingFiles.length" class="chat-pending-files">
              <div v-for="(f, idx) in pendingFiles" :key="`${f.path}-${idx}`" class="chat-pending-file">
                <span class="chat-pending-name">{{ f.name }}</span>
                <button type="button" @click="removePendingFile(idx)" class="chat-pending-remove">x</button>
              </div>
            </div>
            <p v-if="uploadError" class="chat-upload-error">{{ uploadError }}</p>

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
              class="chat-textarea"
            />

            <div class="chat-toolbar">
              <button type="button" @click="openFilePicker" :disabled="busy || uploading" class="chat-upload-btn">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.2a4 4 0 0 1 5.66 5.66l-9.2 9.2a2 2 0 0 1-2.82-2.83l8.48-8.48" />
                </svg>
                {{ uploading ? '上传中...' : '上传文件' }}
              </button>
            </div>

            <div class="chat-send-area">
              <button v-if="busy" type="button" @click="stopBusy" class="chat-stop-btn">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              </button>
              <button v-else type="submit" :disabled="!input.trim()" class="chat-send-btn" :class="input.trim() ? 'active' : ''">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';
import { connect, send, on, wsStatus } from '../ws.js';


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
const input = ref('');
const msgBox = ref(null);
const textarea = ref(null);
const fileInput = ref(null);
const composing = ref(false);
const uploading = ref(false);
const uploadError = ref('');
const pendingFiles = ref([]);

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
const LAST_CHAT_KEY = 'lastChatId';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `${res.status} ${res.statusText}`);
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
    const base = m && m._id != null ? `db:${m._id}` : null;

    if (m.role === 'assistant' && m.tool_calls?.length) {
      let tcIdx = 0;
      for (const tc of m.tool_calls) {
        const args = JSON.parse(tc.function.arguments || '{}');
        list.push({ type: 'tool_call', command: args.command, reason: args.reason, _key: base ? `${base}:tool_call:${tcIdx}` : undefined });
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
      const parsed = extractSuggestions(m.content);
      list.push({ role: 'assistant', content: parsed.content, suggestions: parsed.suggestions, _key: base ? `${base}:assistant` : undefined });
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
  const params = new URLSearchParams({ chatId: id, offset: String(offset), limit: String(limit) });
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
  chatId.value = data.id; chatTitle.value = title; saveLastChatId(data.id);
  messages.value = []; hasMore.value = false; loadedOffset.value = 0;
  seenKeys.value = new Set();
};

const buildChatTitleFromFirstMessage = (text = '') => {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  return normalized.slice(0, 20) || '新对话';
};

const ensureChatId = async (text) => {
  if (chatId.value) return chatId.value;
  await createNewChat(buildChatTitleFromFirstMessage(text));
  return chatId.value;
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
  if ((!text && pendingFiles.value.length === 0) || busy.value) return;
  busy.value = true;
  const content = text || '请先阅读附件并总结关键信息';
  const outgoingAttachments = pendingFiles.value.map((f) => ({
    name: f.name,
    path: f.path,
    size: f.size
  }));

  ensureChatId(content).then((id) => {
    const _key = `client:${Date.now()}:user`;
    seenKeys.value.add(_key);
    messages.value.push({ role: 'user', content, attachments: outgoingAttachments, _key });
    send({
      type: 'message',
      chatId: id,
      content,
      attachments: outgoingAttachments
    });
    input.value = '';
    pendingFiles.value = [];
    nextTick(() => { if (textarea.value) textarea.value.style.height = 'auto'; scrollToBottom(); });
  }).catch((e) => { messages.value.push({ role: 'assistant', content: `错误: ${e.message}` }); busy.value = false; });
};

const stopBusy = () => { busy.value = false; };

const applySuggestion = (text) => {
  input.value = text;
  nextTick(() => { autoResize(); textarea.value?.focus(); });
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

const onPickFiles = async (e) => {
  const files = Array.from(e.target?.files || []);
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
    if (fileInput.value) fileInput.value.value = '';
  }
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
  if (route.query.new) {
    chatId.value = null;
    chatTitle.value = '新对话';
    messages.value = [];
    hasMore.value = false;
    loadedOffset.value = 0;
    seenKeys.value = new Set();
    busy.value = false;
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

  unsubs.push(on('tool_call', (data) => {
    const _key = `ws:${Date.now()}:tool_call`;
    seenKeys.value.add(_key);
    messages.value.push({ type: 'tool_call', command: data.command, reason: data.reason, _key });
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
  unsubs.push(on('reply', (data) => {
    const parsed = extractSuggestions(data.content || '');
    const _key = `ws:${Date.now()}:assistant`;
    seenKeys.value.add(_key);
    messages.value.push({ role: 'assistant', content: parsed.content, suggestions: parsed.suggestions, _key });
    busy.value = false;
  }));
  unsubs.push(on('error', (data) => {
    const _key = `ws:${Date.now()}:error`;
    seenKeys.value.add(_key);
    messages.value.push({ role: 'assistant', content: `错误: ${data.content}`, _key });
    busy.value = false;
  }));
});

onUnmounted(() => { unsubs.forEach(fn => fn()); });
</script>

<style scoped>
.chat-root {
  position: relative;
  min-height: 0;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f0e8;
  /* 纸纹 */
  background-image:
    repeating-linear-gradient(0deg, transparent 0, transparent 28px, rgba(0,0,0,0.02) 28px, rgba(0,0,0,0.02) 29px);
  font-family: 'Georgia', 'PingFang SC', serif;
}

.chat-main { flex: 1; display: flex; flex-direction: column; min-height: 0; }

.chat-scroll { flex: 1; overflow-y: auto; min-height: 0; }
.chat-scroll::-webkit-scrollbar { width: 6px; }
.chat-scroll::-webkit-scrollbar-track { background: transparent; }
.chat-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }

.chat-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 空状态 */
.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 80px 0;
  text-align: center;
}
.chat-empty-icon {
  font-size: 40px;
  margin-bottom: 16px;
  filter: grayscale(0.2);
}
.chat-empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #5a4a38;
  margin-bottom: 8px;
}
.chat-empty-desc {
  font-size: 13px;
  color: #a0907a;
  max-width: 320px;
  line-height: 1.6;
}

.chat-loadmore { text-align: center; padding: 8px 0; font-size: 12px; color: #a0907a; }

.chat-msg-wrap { margin-bottom: 20px; }

/* 用户消息 */
.chat-msg-user { display: flex; justify-content: flex-end; }
.chat-bubble-user {
  max-width: 85%;
  background: #5a3e28;
  color: #f0e8d8;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chat-attachments { margin-top: 8px; }
.chat-attach-label { font-size: 10px; color: #c0a878; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.chat-attach-item {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  padding: 4px 8px;
  margin-bottom: 4px;
}
.chat-attach-name { font-size: 11px; font-weight: 600; }
.chat-attach-path { font-size: 10px; color: #c0a878; word-break: break-all; }

/* 助手消息 */
.chat-msg-bot { display: flex; align-items: flex-start; gap: 10px; }
.chat-avatar {
  width: 32px; height: 32px;
  background: #e8dcc8;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.chat-avatar-tool {
  background: #dce8d4;
}

.chat-bubble-bot-wrap { min-width: 0; flex: 1; }
.chat-bubble-bot {
  background: #fffdf8;
  border: 1px solid #e8dcc8;
  border-radius: 18px 18px 18px 4px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #4a3a28;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.chat-suggestions { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
.chat-suggest-btn {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  background: #f5ead8;
  border: 1px dashed #d4c0a0;
  color: #7a6a50;
  font-family: inherit;
  transition: all 0.15s;
}
.chat-suggest-btn:hover { background: #ece0c8; color: #5a4a38; border-color: #c0a878; }

.chat-actions {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.group:hover .chat-actions { opacity: 1; }
.chat-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #a0907a;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.chat-action-btn:hover { background: #f0e8d8; color: #5a4a38; }

/* 工具调用卡片 */
.chat-tool-card {
  min-width: 0; flex: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dcd0b8;
  background: #fffdf8;
}
.chat-tool-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5ead8;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background 0.15s;
}
.chat-tool-header:hover { background: #ece0c8; }
.chat-tool-arrow { width: 12px; height: 12px; color: #a0907a; flex-shrink: 0; transition: transform 0.15s; }
.chat-tool-arrow.rotate-90 { transform: rotate(90deg); }
.chat-tool-reason { font-size: 12px; color: #5a4a38; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-tool-done { font-size: 11px; color: #a0907a; flex-shrink: 0; }
.chat-tool-body { border-top: 1px solid #e8dcc8; }
.chat-tool-cmd { padding: 10px 12px; font-family: 'Courier New', monospace; font-size: 12px; color: #2d6a30; background: #fffdf8; white-space: pre-wrap; word-break: break-all; }
.chat-tool-result { padding: 10px 12px; font-family: 'Courier New', monospace; font-size: 11px; color: #7a6a50; background: #f5ead8; border-top: 1px solid #e8dcc8; white-space: pre-wrap; word-break: break-all; max-height: 192px; overflow-y: auto; }

.chat-avatar-dot { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.chat-avatar-dot::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #d4c0a0; }
.chat-tool-fallback { min-width: 0; flex: 1; font-family: 'Courier New', monospace; font-size: 12px; color: #a0907a; white-space: pre-wrap; word-break: break-all; line-height: 1.5; }

/* 思考中 */
.chat-thinking { padding: 8px 0; font-size: 14px; color: #a0907a; }
.chat-dots { animation: dotPulse 1.4s infinite; }
@keyframes dotPulse { 0%,80%,100% { opacity: 0.3; } 40% { opacity: 1; } }

/* ========== 输入区 ========== */
.chat-input-area {
  flex-shrink: 0;
  padding: 0 16px 16px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
  background: linear-gradient(to top, #f5f0e8 60%, transparent);
}
.chat-input-inner { max-width: 720px; margin: 0 auto; }

.chat-form {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #fffdf8;
  border: 1px solid #dcd0b8;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.chat-pending-files { padding: 10px 14px 0; display: flex; flex-wrap: wrap; gap: 6px; }
.chat-pending-file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 20px;
  border: 1px solid #dcd0b8;
  background: #f5ead8;
  padding: 3px 10px;
  font-size: 11px;
  color: #5a4a38;
}
.chat-pending-name { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-pending-remove { background: none; border: none; color: #a0907a; cursor: pointer; font-size: 12px; }
.chat-pending-remove:hover { color: #5a4a38; }

.chat-upload-error { padding: 8px 14px 0; font-size: 12px; color: #c04040; }

.chat-textarea {
  width: 100%;
  padding: 14px 48px 14px 16px;
  background: transparent;
  font-size: 14px;
  line-height: 1.5;
  color: #4a3a28;
  border: none;
  outline: none;
  min-height: 52px;
  max-height: 200px;
  resize: none;
  overflow-y: auto;
  font-family: inherit;
}
.chat-textarea::placeholder { color: #c0b098; }
.chat-textarea:disabled { opacity: 0.5; }

.chat-toolbar {
  padding: 0 14px 10px;
  display: flex;
  align-items: center;
}
.chat-upload-btn {
  display: inline-flex;
  height: 28px;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 12px;
  color: #a0907a;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.chat-upload-btn:hover { background: #f5ead8; color: #5a4a38; }
.chat-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.chat-send-area {
  position: absolute;
  bottom: 10px; right: 10px;
  display: flex; align-items: center; gap: 6px;
}
.chat-stop-btn {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: #5a3e28;
  color: #f0e8d8;
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: opacity 0.15s;
}
.chat-stop-btn:hover { opacity: 0.8; }
.chat-send-btn {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: #e8dcc8;
  color: #b8a888;
  border: 1px solid #dcd0b8;
  display: flex; align-items: center; justify-content: center;
  cursor: default;
  transition: all 0.15s;
}
.chat-send-btn.active {
  background: #5a3e28;
  color: #f0e8d8;
  border-color: transparent;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(90,62,40,0.3);
}
.chat-send-btn.active:hover { opacity: 0.85; }

.hidden { display: none; }
</style>

<style>
/* markdown (全局) */
.chat-bubble-bot p { margin: 0.4em 0; }
.chat-bubble-bot p:first-child { margin-top: 0; }
.chat-bubble-bot p:last-child { margin-bottom: 0; }
.chat-bubble-bot h1,.chat-bubble-bot h2,.chat-bubble-bot h3,.chat-bubble-bot h4 { font-weight: 700; margin: 0.8em 0 0.4em; line-height: 1.3; color: #3a2a18; }
.chat-bubble-bot h1 { font-size: 1.3em; }
.chat-bubble-bot h2 { font-size: 1.15em; }
.chat-bubble-bot h3 { font-size: 1em; }
.chat-bubble-bot code { background: rgba(90,62,40,0.08); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.85em; font-family: 'Courier New', monospace; }
.chat-bubble-bot pre { background: #f5ead8; border: 1px solid #e8dcc8; border-radius: 10px; padding: 14px; overflow-x: auto; margin: 0.6em 0; }
.chat-bubble-bot pre code { background: none; padding: 0; font-size: 0.8em; white-space: pre; }
.chat-bubble-bot ul,.chat-bubble-bot ol { padding-left: 1.5em; margin: 0.4em 0; }
.chat-bubble-bot li { margin: 0.25em 0; }
.chat-bubble-bot blockquote { border-left: 3px solid #d4c0a0; padding-left: 12px; color: #8a7a60; margin: 0.5em 0; }
.chat-bubble-bot a { color: #8a5a30; text-decoration: underline; }
.chat-bubble-bot hr { border: none; border-top: 1px dashed #d4c0a0; margin: 0.8em 0; }
.chat-bubble-bot table { border-collapse: collapse; width: 100%; margin: 0.5em 0; font-size: 0.875em; }
.chat-bubble-bot th,.chat-bubble-bot td { border: 1px solid #e8dcc8; padding: 6px 12px; text-align: left; }
.chat-bubble-bot th { background: #f5ead8; font-weight: 600; }
.chat-bubble-bot strong { font-weight: 700; }
</style>
