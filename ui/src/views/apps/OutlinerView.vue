<template>
  <div class="relative h-full w-full overflow-hidden bg-[#f7f3ef] font-sans dark:bg-neutral-900">
    <div class="absolute left-0 right-0 top-0 z-20 border-b border-stone-300 bg-[#f7f3ef]/95 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/95">
      <div class="mx-auto flex w-full max-w-4xl items-center justify-between p-3">
        <div class="flex shrink-0 items-center gap-2 text-sm">
          <button
            class="rounded-full p-2 transition-colors"
            :class="canUndo ? 'text-gray-400 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100' : 'cursor-not-allowed text-gray-200 dark:text-neutral-700'"
            :disabled="!canUndo"
            @click="undo"
          >
            <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 14 4 9l5-5" />
              <path d="M20 20a8 8 0 0 0-8-8H4" />
            </svg>
          </button>
          <button
            class="rounded-full p-2 transition-colors"
            :class="canRedo ? 'text-gray-400 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100' : 'cursor-not-allowed text-gray-200 dark:text-neutral-700'"
            :disabled="!canRedo"
            @click="redo"
          >
            <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 14 5-5-5-5" />
              <path d="M4 20a8 8 0 0 1 8-8h8" />
            </svg>
          </button>
        </div>

        <div class="ml-2 flex shrink-0 items-center gap-2 text-sm">
          <div class="h-4 w-px bg-gray-200 dark:bg-neutral-700" />
          <button class="rounded-full p-2 text-gray-400 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100" @click="copyOutline">
            <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button class="rounded-full p-2 text-gray-400 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100" @click="downloadOutline">
            <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="absolute inset-0 w-full overflow-y-auto pb-[90px] pt-[60px]">
      <div class="mx-auto flex min-h-full w-full max-w-4xl flex-col">
        <div class="flex-1 p-4 sm:p-6">
          <section
            v-if="outlineData.length === 0"
            class="mb-6 rounded-2xl border border-stone-200/80 bg-white/80 p-6 text-stone-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-200"
          >
            <h2 class="text-2xl font-bold tracking-tight">欢迎使用心树</h2>
            <p class="mt-2 text-sm text-stone-500 dark:text-neutral-400">在这里你可以快速整理思路，AI 会帮你扩展、改写和重构大纲结构。</p>
            <div class="mt-4 flex flex-wrap gap-2 text-xs">
              <span class="rounded-full bg-stone-100 px-3 py-1 text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">Enter: 新增同级节点</span>
              <span class="rounded-full bg-stone-100 px-3 py-1 text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">Tab: 缩进为子节点</span>
              <span class="rounded-full bg-stone-100 px-3 py-1 text-stone-600 dark:bg-neutral-700 dark:text-neutral-300">底部输入框: 让 AI 直接改大纲</span>
            </div>
          </section>

          <draggable v-model="outlineData" group="outline" item-key="id" handle=".drag-handle" animation="150" ghost-class="ghost">
            <template #item="{ element }">
              <OutlineNode
                :node="element"
                :focus-node-id="focusNodeId"
                @update="handleNodeUpdate"
                @add-sibling="handleAddRootSibling"
                @indent="handleRootIndent"
                @delete="handleDeleteRoot"
                @focus-node="focusNodeId = $event"
              />
            </template>
          </draggable>

          <button
            class="mt-4 flex w-full items-center justify-center rounded-xl border border-dashed px-4 py-2 font-medium transition-all"
            :class="loading ? 'cursor-wait border-stone-200 bg-stone-50 text-stone-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500' : 'border-stone-300 text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'"
            :disabled="loading"
            @click="addRootNode"
          >
            <span v-if="loading" class="loading-dots">正在绘制中</span>
            <template v-else>
              <svg viewBox="0 0 24 24" class="mr-2 h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加新节点
            </template>
          </button>
        </div>
      </div>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-10">
      <div class="relative mx-auto h-full w-full max-w-4xl">
        <div
          v-if="!isChatOpen && latestAiReply && showPreview"
          class="pointer-events-auto absolute left-0 right-0 px-3 pb-2 pt-2 sm:px-4"
          style="bottom: 90px;"
        >
          <div class="relative max-w-[85%] cursor-pointer rounded-2xl rounded-bl-sm border border-gray-200 bg-gray-50 px-4 py-2 pr-8 shadow-sm transition-colors hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700" @click="toggleChat">
            <button
              class="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-neutral-600"
              @click.stop="closePreview"
            >
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div class="prose prose-sm line-clamp-3 text-sm text-gray-800 dark:prose-invert dark:text-neutral-100" v-html="renderMarkdown(latestAiReply)" />
          </div>
        </div>

        <OutlinerChat
          ref="chatPanelRef"
          v-model="inputMessage"
          :messages="messages"
          :loading="loading"
          :is-open="isChatOpen"
          @toggle="toggleChat"
          @send="sendMessage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { marked } from 'marked';
import OutlineNode from '../../components/apps/mindtree/OutlineNode.vue';
import OutlinerChat from '../../components/apps/mindtree/OutlinerChat.vue';

const API_BASE = 'http://localhost:9701/api/apps/mindtree';
const GLOBAL_OUTLINE_ID = 'global-outline';

const outlineData = ref([]);
const outlineTitle = ref('心树');
const outlineId = ref('');
const syncStatus = ref('synced');
const focusNodeId = ref('');

const messages = ref([]);
const inputMessage = ref('');
const loading = ref(false);

const history = ref([]);
const historyIndex = ref(-1);
const HISTORY_LIMIT = 30;
let historyDebounceTimer = null;
let saveTimer = null;
let previewTimer = null;

const isChatOpen = ref(false);
const showPreview = ref(false);
const chatPanelRef = ref(null);
const isHistoryLoaded = ref(false);

const findNode = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const findParent = (nodes, childId) => {
  for (const node of nodes) {
    if (node.children?.some((child) => child.id === childId)) return node;
    if (node.children?.length) {
      const found = findParent(node.children, childId);
      if (found) return found;
    }
  }
  return null;
};

const normalizeNodes = (nodes = []) => {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => ({
    id: String(node.id || Math.random().toString(36).slice(2, 10)),
    text: String(node.text || ''),
    note: node.note == null ? '' : String(node.note),
    children: normalizeNodes(node.children || [])
  }));
};

const applyOps = (ops = []) => {
  for (const item of Array.isArray(ops) ? ops : []) {
    const op = String(item?.op || '');
    const args = item?.args || {};

    if (op === 'create_outline') {
      outlineData.value = normalizeNodes(args.nodes);
      saveHistory(true);
      continue;
    }

    if (op === 'add_nodes') {
      const parentId = String(args.parentId || 'root');
      const nodes = normalizeNodes(args.nodes);
      if (parentId === 'root') {
        outlineData.value.push(...nodes);
      } else {
        const parent = findNode(outlineData.value, parentId);
        if (parent) parent.children = [...(parent.children || []), ...nodes];
      }
      saveHistory(true);
      continue;
    }

    if (op === 'update_node') {
      const node = findNode(outlineData.value, String(args.id || ''));
      if (!node) continue;
      if (args.text !== undefined) node.text = String(args.text || '');
      if (args.note !== undefined) node.note = String(args.note || '');
      saveHistory(true);
      continue;
    }

    if (op === 'delete_node') {
      const id = String(args.id || '');
      if (!id) continue;
      const rootIndex = outlineData.value.findIndex((node) => node.id === id);
      if (rootIndex >= 0) {
        outlineData.value.splice(rootIndex, 1);
      } else {
        const parent = findParent(outlineData.value, id);
        if (parent) parent.children = (parent.children || []).filter((child) => child.id !== id);
      }
      saveHistory(true);
    }
  }
};

const pushHistory = (snapshot) => {
  if (history.value.length > 0) {
    const latest = JSON.stringify(history.value[history.value.length - 1]);
    if (latest === JSON.stringify(snapshot)) return;
  }

  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  history.value.push(snapshot);
  if (history.value.length > HISTORY_LIMIT) history.value.shift();
  historyIndex.value = history.value.length - 1;
};

const saveHistory = (immediate = false) => {
  const snapshot = JSON.parse(JSON.stringify(outlineData.value));
  if (!immediate) {
    if (historyDebounceTimer) clearTimeout(historyDebounceTimer);
    historyDebounceTimer = setTimeout(() => pushHistory(snapshot), 900);
    return;
  }
  if (historyDebounceTimer) clearTimeout(historyDebounceTimer);
  pushHistory(snapshot);
};

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

const undo = () => {
  if (!canUndo.value) return;
  historyIndex.value -= 1;
  outlineData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
};

const redo = () => {
  if (!canRedo.value) return;
  historyIndex.value += 1;
  outlineData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
};

const handleNodeUpdate = (updatedNode) => {
  const index = outlineData.value.findIndex((node) => node.id === updatedNode.id);
  if (index !== -1) {
    outlineData.value[index] = updatedNode;
    saveHistory(false);
  }
};

const handleAddRootSibling = (nodeId) => {
  const index = outlineData.value.findIndex((node) => node.id === nodeId);
  if (index === -1) return;
  const newId = Math.random().toString(36).slice(2, 10);
  outlineData.value.splice(index + 1, 0, { id: newId, text: '', note: '', children: [] });
  focusNodeId.value = newId;
  saveHistory(true);
};

const handleRootIndent = (nodeId) => {
  const index = outlineData.value.findIndex((node) => node.id === nodeId);
  if (index <= 0) return;
  const prevSibling = outlineData.value[index - 1];
  const current = outlineData.value[index];
  prevSibling.children = [...(prevSibling.children || []), current];
  outlineData.value.splice(index, 1);
  focusNodeId.value = current.id;
  saveHistory(true);
};

const handleDeleteRoot = (nodeId) => {
  outlineData.value = outlineData.value.filter((node) => node.id !== nodeId);
  saveHistory(true);
};

const addRootNode = () => {
  const newId = Math.random().toString(36).slice(2, 10);
  outlineData.value.push({ id: newId, text: '', note: '', children: [] });
  focusNodeId.value = newId;
  saveHistory(true);
};

const outlineToText = (nodes, indent = 0) => {
  let text = '';
  for (const node of nodes) {
    const prefix = '  '.repeat(indent);
    text += `${prefix}- ${node.text}\n`;
    if (node.note) text += `${prefix}  ${node.note}\n`;
    if (node.children?.length) text += outlineToText(node.children, indent + 1);
  }
  return text;
};

const saveOutline = async () => {
  if (!outlineId.value) return;
  try {
    syncStatus.value = 'syncing';
    await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outlineId: outlineId.value,
        title: outlineTitle.value || '无标题大纲',
        data: outlineData.value
      })
    });
    syncStatus.value = 'synced';
  } catch (e) {
    syncStatus.value = 'error';
    console.error('save outline failed', e);
  }
};

const loadOutline = async () => {
  outlineId.value = GLOBAL_OUTLINE_ID;
  try {
    const res = await fetch(`${API_BASE}/get?id=${encodeURIComponent(GLOBAL_OUTLINE_ID)}`);
    if (res.status === 404) {
      outlineData.value = [];
      outlineTitle.value = '心树';
      messages.value = [];
      await saveOutline();
      return;
    }
    const data = await res.json();
    if (!data?.success || !data.outline) return;

    outlineTitle.value = data.outline.title || '心树';
    outlineData.value = normalizeNodes(JSON.parse(data.outline.data || '[]'));
    messages.value = (data.messages || []).map((m) => ({
      role: m.role,
      content: [{ type: 'text', text: m.content || '' }]
    }));
    isHistoryLoaded.value = true;
    pushHistory(JSON.parse(JSON.stringify(outlineData.value)));

  } catch (e) {
    console.error('load outline failed', e);
  }
};

const sendMessage = async () => {
  const content = inputMessage.value.trim();
  if (!content || loading.value || !outlineId.value) return;

  inputMessage.value = '';
  loading.value = true;
  messages.value.push({ role: 'user', content: [{ type: 'text', text: content }] });

  try {
    const contextMessages = messages.value.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-20);
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outlineId: outlineId.value,
        title: outlineTitle.value,
        message: content,
        messages: contextMessages,
        outlineData: outlineData.value
      })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    if (Array.isArray(data.ops) && data.ops.length > 0) {
      applyOps(data.ops);
    }
    if (Array.isArray(data.outlineData)) {
      outlineData.value = normalizeNodes(data.outlineData);
      saveHistory(true);
    }
    if (data.title) outlineTitle.value = data.title;
    messages.value.push({
      role: 'assistant',
      content: [{ type: 'text', text: String(data.reply || '已完成。') }]
    });
  } catch (e) {
    messages.value.push({
      role: 'system',
      content: [{ type: 'text', text: e.message || '发送失败，请重试' }]
    });
  } finally {
    loading.value = false;
  }
};

const copyOutline = async () => {
  const text = `${outlineTitle.value}\n\n${outlineToText(outlineData.value)}`;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.error('copy failed', e);
  }
};

const downloadOutline = () => {
  const text = `${outlineTitle.value}\n\n${outlineToText(outlineData.value)}`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${outlineTitle.value || '大纲'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
  if (isChatOpen.value && previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
};

const closePreview = () => {
  showPreview.value = false;
  if (previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
};

const startPreviewTimer = () => {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    showPreview.value = false;
    previewTimer = null;
  }, 3000);
};

const latestAiReply = computed(() => {
  const assistant = messages.value.filter((m) => m.role === 'assistant');
  if (!assistant.length) return '';
  return assistant[assistant.length - 1].content?.[0]?.text || '';
});

const renderMarkdown = (text) => marked.parse(String(text || ''));

watch(outlineData, () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveOutline, 1200);
}, { deep: true });

watch(messages, (val) => {
  if (isChatOpen.value || !isHistoryLoaded.value) return;
  const last = val[val.length - 1];
  if (last?.role === 'assistant') showPreview.value = true;
}, { deep: true });

watch(loading, (v) => {
  if (!v && !isChatOpen.value && showPreview.value) startPreviewTimer();
});

onMounted(() => {
  loadOutline();
});
</script>

<style scoped>
.ghost {
  opacity: 0.65;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}
</style>
