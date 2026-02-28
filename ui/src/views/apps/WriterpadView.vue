<template>
  <div class="relative h-full w-full overflow-hidden bg-[#f7f3ef] font-sans dark:bg-neutral-900">
    <div class="absolute left-0 right-0 top-0 z-20 border-b border-stone-300 bg-[#f7f3ef]/95 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/95">
      <div class="mx-auto flex w-full max-w-4xl items-center justify-between p-3">
        <div class="text-sm font-semibold text-stone-700 dark:text-neutral-200">写字板</div>
        <div class="flex items-center gap-2 rounded-full bg-white/80 p-1 dark:bg-neutral-800">
          <button
            class="rounded-full px-3 py-1 text-xs"
            :class="mode === 'global' ? 'bg-stone-800 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'"
            @click="mode = 'global'"
          >
            全局重写
          </button>
          <button
            class="rounded-full px-3 py-1 text-xs"
            :class="mode === 'local' ? 'bg-stone-800 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'"
            @click="mode = 'local'"
          >
            局部替换
          </button>
        </div>
      </div>
    </div>

    <div class="absolute inset-0 overflow-y-auto pb-[90px] pt-[60px]">
      <div class="mx-auto w-full max-w-4xl p-4 sm:p-6">
        <section class="mb-4 rounded-2xl border border-stone-200/80 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-800/70">
          <textarea
            ref="editorRef"
            v-model="content"
            class="min-h-[420px] w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm leading-7 text-stone-800 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-600 dark:focus:ring-neutral-700"
            placeholder="开始写作..."
            @select="updateSelection"
            @keyup="updateSelection"
            @mouseup="updateSelection"
          />
          <div class="mt-2 flex items-center justify-between px-1 text-xs text-stone-500 dark:text-neutral-400">
            <span>{{ content.length }} 字</span>
            <span v-if="mode === 'local'">{{ selectedLength > 0 ? `已选中 ${selectedLength} 字` : '请在正文中选中要替换的文本' }}</span>
            <span v-else>将对全文进行重写</span>
          </div>
        </section>

        <section v-if="content.length === 0" class="rounded-2xl border border-stone-200/80 bg-white/70 p-6 text-stone-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200">
          <h2 class="text-2xl font-bold tracking-tight">欢迎使用写字板</h2>
          <p class="mt-2 text-sm text-stone-500 dark:text-neutral-400">底部输入重写要求，可直接调用 AI 对全文重写或局部替换。</p>
        </section>
      </div>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-10">
      <div class="relative mx-auto h-full w-full max-w-4xl">
        <WriterpadChat
          v-model="input"
          :messages="messages"
          :loading="loading"
          :is-open="chatOpen"
          @toggle="chatOpen = !chatOpen"
          @send="rewrite"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import WriterpadChat from '../../components/apps/writerpad/WriterpadChat.vue';

const API_BASE = 'http://localhost:9701/api/apps/writerpad';
const GLOBAL_DOC_ID = 'global-writerpad';

const content = ref('');
const mode = ref('global');
const input = ref('');
const loading = ref(false);
const chatOpen = ref(false);
const messages = ref([]);
const selectedStart = ref(-1);
const selectedEnd = ref(-1);
const selectedLength = ref(0);
const editorRef = ref(null);
let saveTimer = null;

const updateSelection = () => {
  const el = editorRef.value;
  if (!el) return;
  selectedStart.value = el.selectionStart;
  selectedEnd.value = el.selectionEnd;
  selectedLength.value = Math.max(0, selectedEnd.value - selectedStart.value);
};

const loadDoc = async () => {
  try {
    const res = await fetch(`${API_BASE}/get?id=${encodeURIComponent(GLOBAL_DOC_ID)}`);
    if (res.status === 404) {
      await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: GLOBAL_DOC_ID, title: '写字板', content: '' })
      });
      content.value = '';
      messages.value = [];
      return;
    }
    const data = await res.json();
    if (!data?.success) return;
    content.value = String(data.doc?.content || '');
    messages.value = (data.messages || []).map((m) => ({
      role: m.role,
      mode: m.mode,
      content: [{ type: 'text', text: m.content || '' }]
    }));
  } catch (e) {
    console.error('load writerpad failed', e);
  }
};

const syncDoc = async () => {
  try {
    await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docId: GLOBAL_DOC_ID,
        title: '写字板',
        content: content.value
      })
    });
  } catch (e) {
    console.error('sync writerpad failed', e);
  }
};

const rewrite = async () => {
  const instruction = input.value.trim();
  if (!instruction || loading.value) return;
  if (mode.value === 'local' && selectedLength.value <= 0) return;

  input.value = '';
  loading.value = true;
  messages.value.push({
    role: 'user',
    mode: mode.value,
    content: [{ type: 'text', text: instruction }]
  });

  try {
    const res = await fetch(`${API_BASE}/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docId: GLOBAL_DOC_ID,
        title: '写字板',
        mode: mode.value,
        instruction,
        content: content.value,
        selectionStart: selectedStart.value,
        selectionEnd: selectedEnd.value,
        messages: messages.value.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-20)
      })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);

    content.value = String(data.content || '');
    messages.value.push({
      role: 'assistant',
      mode: mode.value,
      content: [{ type: 'text', text: String(data.rewritten || '') }]
    });
  } catch (e) {
    messages.value.push({
      role: 'assistant',
      mode: mode.value,
      content: [{ type: 'text', text: `重写失败：${e.message || 'unknown error'}` }]
    });
  } finally {
    loading.value = false;
  }
};

watch(content, () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(syncDoc, 800);
});

onMounted(loadDoc);
</script>
