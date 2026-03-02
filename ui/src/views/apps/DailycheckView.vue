<template>
  <div class="h-full w-full overflow-y-auto bg-[#f5f0e8] text-[#3a2e20]" style="font-family: Georgia, 'Noto Serif SC', serif">
    <div class="mx-auto w-full max-w-2xl px-4 py-8">

      <!-- header -->
      <header class="mb-6 border-b border-[#d8d0c0] pb-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-[#3a2e20]">每日打卡</h1>
          <p class="mt-1 text-xs text-[#a09078]">AI 提问，你来回答，持续自省。</p>
        </div>
      </header>

      <section v-if="error" class="mb-4 rounded-lg border border-[#e0b8a0] bg-[#fdf5ef] px-3 py-2 text-xs text-[#c05030]">
        {{ error }}
      </section>

      <!-- today's question -->
      <section v-if="today.id" class="mb-8">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-widest text-[#a09078]">{{ today.date }}</span>
          <button
            class="text-[11px] text-[#a09078] underline decoration-dotted underline-offset-2 transition hover:text-[#5a4a30] disabled:opacity-40"
            :disabled="refreshing"
            @click="refreshQuestionByAgent"
          >{{ refreshing ? '生成中...' : '换一题' }}</button>
        </div>

        <div class="rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-5">
          <p class="text-lg font-bold leading-relaxed text-[#3a2e20]">{{ today.question }}</p>
        </div>

        <div class="mt-4">
          <textarea
            v-model="answerDraft"
            rows="5"
            placeholder="写下你的回答..."
            class="w-full resize-y rounded-xl border border-[#e0d8cc] bg-[#fffdf8] px-4 py-3 text-sm leading-[1.9] text-[#3a2e20] outline-none transition placeholder:text-[#c4b8a4] focus:border-[#b89860] focus:ring-1 focus:ring-[#b89860]/30"
          ></textarea>
          <div class="mt-2 flex items-center justify-between">
            <p class="text-[11px] text-[#b0a088]">
              {{ today.answered ? `已回答 · ${today.answerUpdatedAt || ''}` : '今天还未回答' }}
            </p>
            <button
              class="rounded-lg bg-[#3a2e20] px-5 py-2 text-xs font-bold text-[#f5efe4] transition hover:bg-[#4a3e30] disabled:opacity-40"
              :disabled="saving || !answerDraft.trim()"
              @click="submitAnswer"
            >
              {{ saving ? '提交中...' : (today.answered ? '更新回答' : '提交回答') }}
            </button>
          </div>
        </div>

        <div v-if="today.answer" class="mt-4 rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-4">
          <p class="text-[11px] font-bold uppercase tracking-widest text-[#a09078]">用户回答</p>
          <p class="mt-2 whitespace-pre-wrap text-sm leading-[1.9] text-[#4a3a28]">{{ today.answer }}</p>
        </div>

        <div v-if="today.response" class="mt-4 rounded-xl border border-[#ddd2c2] bg-[#f8f4ec] p-4">
          <p class="text-[11px] font-bold uppercase tracking-widest text-[#a09078]">AI 回应</p>
          <p class="mt-2 whitespace-pre-wrap text-sm leading-[1.9] text-[#4a3a28]">{{ today.response }}</p>
        </div>
      </section>

      <div v-else class="mb-8 rounded-xl border border-dashed border-[#d8d0c0] py-12 text-center text-sm text-[#b0a090]">
        正在准备今日问题...
      </div>

      <!-- history -->
      <section v-if="items.length">
        <div class="mb-3 flex items-baseline justify-between border-b border-[#e0d8cc] pb-2">
          <h2 class="text-xs font-bold uppercase tracking-widest text-[#a09078]">历史记录</h2>
          <span class="text-[10px] text-[#b8a890]">共 {{ total }} 条</span>
        </div>

        <div class="space-y-3">
          <article
            v-for="item in items"
            :key="item.id"
            class="border-b border-[#ece6da] pb-3 last:border-0"
          >
            <div class="mb-1 flex items-center gap-2">
              <span class="text-[11px] font-semibold text-[#9a8a70]">{{ item.date }}</span>
              <span
                class="rounded-full px-1.5 py-px text-[9px]"
                :class="item.answered ? 'bg-[#e8f0e4] text-[#4a8a3a]' : 'bg-[#f5ead8] text-[#b09060]'"
              >{{ item.answered ? '已答' : '未答' }}</span>
            </div>
            <p class="text-sm font-bold text-[#3a2e20]">{{ item.question }}</p>
            <p v-if="item.answer" class="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#6a5a44]">{{ item.answer }}</p>
            <p v-else class="mt-1 text-xs italic text-[#c0b098]">当天未回答</p>
            <p v-if="item.response" class="mt-1.5 whitespace-pre-wrap rounded bg-[#f8f4ec] px-2.5 py-2 text-xs leading-relaxed text-[#5a4a38]">
              AI：{{ item.response }}
            </p>
          </article>
        </div>

        <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-4">
          <button class="text-xs text-[#8a7a60] disabled:opacity-30" :disabled="page <= 1" @click="changePage(page - 1)">← 上一页</button>
          <span class="text-[10px] text-[#b0a088]">{{ page }} / {{ totalPages }}</span>
          <button class="text-xs text-[#8a7a60] disabled:opacity-30" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页 →</button>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';

const API_BASE = 'http://localhost:9701/apps/dailycheck';

const today = reactive({
  id: 0,
  date: '',
  question: '',
  answered: false,
  answer: '',
  response: '',
  answerUpdatedAt: ''
});

const error = ref('');
const refreshing = ref(false);
const saving = ref(false);
const answerDraft = ref('');

const items = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const totalPages = ref(1);

const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const applyToday = (data) => {
  today.id = data.id || 0;
  today.date = data.date || '';
  today.question = data.question || '';
  today.answered = Boolean(data.answered);
  today.answer = data.answer || '';
  today.response = data.response || '';
  today.answerUpdatedAt = data.answerUpdatedAt || '';
  answerDraft.value = today.answer || '';
};

const loadToday = async () => {
  const data = await request(`${API_BASE}/today`);
  applyToday(data.today || {});
};

const loadHistory = async () => {
  const data = await request(`${API_BASE}/history?page=${page.value}&pageSize=${pageSize}`);
  items.value = data.items || [];
  total.value = data.total || 0;
  totalPages.value = data.totalPages || 1;
};

const submitAnswer = async () => {
  if (!today.id || !answerDraft.value.trim() || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    await request(`${API_BASE}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyId: today.id, answer: answerDraft.value.trim() })
    });
    await loadToday();
    await loadHistory();
  } catch (e) {
    error.value = e.message || '提交失败';
  } finally {
    saving.value = false;
  }
};

const refreshQuestionByAgent = async () => {
  refreshing.value = true;
  error.value = '';
  try {
    await request(`${API_BASE}/refresh`, { method: 'POST' });
    await loadToday();
    await loadHistory();
  } catch (e) {
    error.value = e.message || '换题失败';
  } finally {
    refreshing.value = false;
  }
};

const changePage = async (nextPage) => {
  if (nextPage < 1 || nextPage > totalPages.value) return;
  page.value = nextPage;
  await loadHistory();
};

onMounted(async () => {
  try {
    await loadToday();
    await loadHistory();
  } catch (e) {
    error.value = e.message || '初始化失败';
  }
});
</script>
