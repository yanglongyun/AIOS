<template>
  <div class="flex h-full flex-1 flex-col overflow-hidden bg-[#ece6da] font-['Georgia','PingFang_SC',serif]">
    <div class="flex items-center justify-between border-b border-[rgba(160,120,60,0.1)] bg-[rgba(236,230,218,0.95)] px-5 py-3 backdrop-blur-[8px]">
      <div class="text-[15px] font-bold text-[#5a4a38]">📄 写字板</div>
      <div class="text-[11px] text-[#b8a080]">{{ content.length }} 字</div>
    </div>

    <div class="flex min-h-0 flex-1 justify-center overflow-hidden px-5 py-6">
      <div class="flex h-full min-h-0 w-full max-w-[700px] flex-col overflow-hidden rounded-2xl bg-[#fdfaf4] shadow-[0_4px_20px_rgba(100,80,40,0.08),0_1px_3px_rgba(100,80,40,0.06)]">
        <div class="h-1 bg-[linear-gradient(90deg,#c8a060,#d4b478,#c8a060)] opacity-40"></div>
        <div class="flex items-center justify-between px-6 pt-3.5">
          <span class="text-[11px] italic text-[#b8a080]">{{ today }}</span>
        </div>
        <div class="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-3">
          <textarea
            ref="editorRef"
            v-model="content"
            class="min-h-0 w-full flex-1 resize-none overflow-y-auto border-none bg-transparent bg-[repeating-linear-gradient(transparent_0,transparent_27px,rgba(160,120,60,0.06)_27px,rgba(160,120,60,0.06)_28px)] bg-[length:100%_28px] text-sm leading-8 text-[#4a3a28] outline-none placeholder:text-[#d0c0a8]"
            placeholder="开始写作..."
          />
        </div>
      </div>
    </div>

    <div class="border-t border-[rgba(160,120,60,0.08)] bg-[rgba(236,230,218,0.95)] px-5 pb-4 pt-3 backdrop-blur-[8px]">
      <div class="mx-auto flex max-w-[700px] gap-2">
        <input
          v-model="input"
          @keyup.enter="handleSend"
          class="flex-1 rounded-xl border border-[rgba(160,120,60,0.12)] bg-[#fdfaf4] px-4 py-2.5 text-[13px] text-[#5a4a38] outline-none transition-colors placeholder:text-[#c8b898] focus:border-[rgba(160,120,60,0.3)]"
          placeholder="输入指令，AI 自动判断重写全文或局部替换..."
        />
        <button
          @click="handleSend"
          :disabled="loading || !input.trim()"
          class="whitespace-nowrap rounded-xl bg-[#5a3e28] px-5 py-2.5 text-[13px] text-[#f0e8d8] shadow-[0_2px_8px_rgba(90,62,40,0.2)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >{{ loading ? '处理中...' : '发送' }}</button>
      </div>
      <p v-if="reply" class="mx-auto mt-2 max-w-[700px] text-xs text-[#8a7050]">{{ reply }}</p>
      <p v-if="error" class="mx-auto mt-2 max-w-[700px] text-xs text-[#c05040]">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const API_BASE = '/apps/writerpad';
const LLM_API = '/api/llm/chat';
const GLOBAL_DOC_ID = 'global-writerpad';
const MAX_ROUNDS = 10;

const content = ref('');
const input = ref('');
const loading = ref(false);
const error = ref('');
const reply = ref('');
const editorRef = ref(null);
let saveTimer = null;

const today = computed(() => {
  const d = new Date();
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
});

// 工具定义
const tools = [
  {
    type: 'function',
    function: {
      name: 'rewrite_all',
      description: '重写整篇文档，用全新内容替换当前全部文本。适用于用户要求改写全文、换风格、翻译等。',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '重写后的完整文本' }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'replace_section',
      description: '查找并替换文档中的一段文本。适用于用户要求修改某个段落、某句话、局部润色等。可多次调用。',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: '要查找的原文片段（必须与文档中的文本完全匹配）' },
          replace: { type: 'string', description: '替换后的新文本' }
        },
        required: ['search', 'replace']
      }
    }
  }
];

// 前端工具执行
const runTool = (name, args) => {
  if (name === 'rewrite_all') {
    content.value = args.content;
    return '已重写全文';
  }
  if (name === 'replace_section') {
    if (!content.value.includes(args.search)) {
      return `未找到匹配文本: "${args.search.slice(0, 30)}..."`;
    }
    content.value = content.value.replace(args.search, args.replace);
    return '已替换';
  }
  return `未知工具: ${name}`;
};

// 系统提示词
const buildSystemPrompt = () => {
  return `你是写字板助手。你只能通过工具调用来修改文档，不能用文字描述修改。

当前文档内容：
---
${content.value || '（空文档）'}
---

规则：
1. 你必须调用工具来执行修改，绝对不能跳过工具调用直接回复
2. 重写全文或清空文档：调用 rewrite_all
3. 修改局部内容：调用 replace_section（search 必须与原文完全匹配）
4. 可以多次调用 replace_section 来修改多处
5. 工具执行完毕后，再用简短文字告诉用户做了什么`;
};

// 工具调用循环
const handleSend = async () => {
  const instruction = input.value.trim();
  if (!instruction || loading.value) return;

  input.value = '';
  loading.value = true;
  error.value = '';
  reply.value = '';

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: instruction }
  ];

  try {
    let round = 0;
    while (round++ < MAX_ROUNDS) {
      const res = await fetch(LLM_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, tools })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);

      const msg = data.message;

      // 有工具调用
      if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        messages.push({
          role: 'assistant',
          content: msg.content ?? null,
          tool_calls: msg.tool_calls
        });

        for (const tc of msg.tool_calls) {
          const args = JSON.parse(tc.function.arguments || '{}');
          const result = runTool(tc.function.name, args);
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: result
          });
        }
        continue;
      }

      // 纯文本回复，显示并结束
      if (msg.content) reply.value = msg.content;
      break;
    }
  } catch (e) {
    error.value = e.message || '处理失败';
  } finally {
    loading.value = false;
  }
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
      return;
    }
    const data = await res.json();
    if (!data?.success) return;
    content.value = String(data.doc?.content || '');
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

watch(content, () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(syncDoc, 800);
});

onMounted(loadDoc);
</script>
