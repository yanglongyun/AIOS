<template>
  <div class="h-full w-full overflow-y-auto bg-[#f5f0e8] text-[#3a2e20]" style="font-family: Georgia, 'Noto Serif SC', serif">
    <div class="mx-auto w-full max-w-2xl px-4 py-8">

      <!-- header -->
      <header class="mb-6 flex items-baseline justify-between border-b border-[#d8d0c0] pb-4">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-[#3a2e20]">每日一问</h1>
          <p class="mt-1 text-xs text-[#a09078]">AI 提问，你来回答，持续自省。</p>
        </div>
        <div class="flex items-center gap-4 text-center">
          <div>
            <div class="text-xl font-black text-[#b89860]">{{ stats.streak }}</div>
            <div class="text-[10px] text-[#a09078]">连续</div>
          </div>
          <div class="h-6 w-px bg-[#ddd4c4]"></div>
          <div>
            <div class="text-xl font-black text-[#3a2e20]">{{ stats.totalAnswers }}</div>
            <div class="text-[10px] text-[#a09078]">已答</div>
          </div>
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
            class="text-[11px] text-[#a09078] underline decoration-dotted underline-offset-2 transition hover:text-[#5a4a30]"
            @click="refreshToday"
          >换一题</button>
        </div>

        <div class="rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-5">
          <p class="text-lg font-bold leading-relaxed text-[#3a2e20]">{{ today.question }}</p>
          <p v-if="today.purpose" class="mt-2 text-xs italic text-[#9a8a70]">{{ today.purpose }}</p>
          <div v-if="today.tags?.length" class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="(t, idx) in today.tags"
              :key="`${t}-${idx}`"
              class="rounded-full bg-[#f0e8da] px-2.5 py-0.5 text-[10px] text-[#8a7a60]"
            >{{ t }}</span>
          </div>
        </div>

        <!-- answer -->
        <div class="mt-4">
          <textarea
            v-model="answer"
            rows="5"
            placeholder="写下你的思考..."
            class="w-full resize-y rounded-xl border border-[#e0d8cc] bg-[#fffdf8] px-4 py-3 text-sm leading-[1.9] text-[#3a2e20] outline-none transition placeholder:text-[#c4b8a4] focus:border-[#b89860] focus:ring-1 focus:ring-[#b89860]/30"
          ></textarea>
          <div class="mt-2 flex items-center justify-between">
            <p class="text-[11px] text-[#b0a088]">
              {{ today.answered ? `已回答 · ${formatTime(today.answerUpdatedAt)}` : '今天还未回答' }}
            </p>
            <button
              class="rounded-lg bg-[#3a2e20] px-5 py-2 text-xs font-bold text-[#f5efe4] transition hover:bg-[#4a3e30] disabled:opacity-40"
              :disabled="saving || !answer.trim()"
              @click="submitAnswer"
            >
              <span v-if="saving" class="flex items-center gap-1.5">
                <svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-20"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
                提交中
              </span>
              <span v-else>{{ today.answered ? '更新' : '提交回答' }}</span>
            </button>
          </div>
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

const API_BASE = 'http://localhost:9701/api/apps/lifeguide';

const today = reactive({
  id: 0,
  date: '',
  question: '',
  purpose: '',
  tags: [],
  answered: false,
  answer: '',
  answerUpdatedAt: ''
});

const stats = reactive({
  streak: 0,
  totalAnswers: 0,
  totalQuestions: 0
});

const answer = ref('');
const saving = ref(false);
const error = ref('');

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
  today.purpose = data.purpose || '';
  today.tags = Array.isArray(data.tags) ? data.tags : [];
  today.answered = Boolean(data.answered);
  today.answer = data.answer || '';
  today.answerUpdatedAt = data.answerUpdatedAt || '';
  answer.value = today.answer;
};

const loadToday = async () => {
  const data = await request(`${API_BASE}/today`);
  applyToday(data.today || {});
  stats.streak = data.stats?.streak || 0;
  stats.totalAnswers = data.stats?.totalAnswers || 0;
  stats.totalQuestions = data.stats?.totalQuestions || 0;
};

const loadHistory = async () => {
  const data = await request(`${API_BASE}/history?page=${page.value}&pageSize=${pageSize}`);
  items.value = data.items || [];
  total.value = data.total || 0;
  totalPages.value = data.totalPages || 1;
};

const submitAnswer = async () => {
  if (!today.id || !answer.value.trim() || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    await request(`${API_BASE}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: today.id, answer: answer.value.trim() })
    });
    await loadToday();
    page.value = 1;
    await loadHistory();
  } catch (e) {
    error.value = e.message || '提交失败';
  } finally {
    saving.value = false;
  }
};

const refreshToday = async () => {
  error.value = '';
  try {
    await request(`${API_BASE}/refresh`, { method: 'POST' });
    await loadToday();
    await loadHistory();
  } catch (e) {
    error.value = e.message || '刷新失败';
  }
};

const changePage = async (nextPage) => {
  if (nextPage < 1 || nextPage > totalPages.value) return;
  page.value = nextPage;
  await loadHistory();
};

const formatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('zh-CN', { hour12: false });
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
