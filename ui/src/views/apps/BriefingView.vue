<template>
  <div class="h-full w-full overflow-y-auto bg-[#f5f0e8] text-[#3a2e20]" style="font-family: Georgia, 'Noto Serif SC', serif">
    <div class="mx-auto w-full max-w-4xl px-4 py-8">
      <header class="mb-6 border-b-2 border-[#3a2e20] pb-4">
        <p class="text-[10px] uppercase tracking-[.35em] text-[#a09080]">AI-Powered Personal</p>
        <h1 class="mt-1 text-4xl font-black tracking-tight text-[#3a2e20]">专属早报</h1>
        <p class="mt-1.5 text-xs tracking-wide text-[#9a8a70]">{{ todayText }}</p>
      </header>

      <section class="mb-6 rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-4">
        <label class="mb-2 block text-[11px] font-bold uppercase tracking-widest text-[#a09078]">关注方向</label>
        <textarea
          v-model="focus"
          rows="2"
          class="w-full resize-none rounded-lg border border-[#e8e0d4] bg-[#faf6f0] px-3 py-2.5 text-sm leading-relaxed text-[#3a2e20] outline-none transition placeholder:text-[#c4b8a4] focus:border-[#b89860] focus:ring-1 focus:ring-[#b89860]/30"
          placeholder="例如：AI 编程工具、全球科技公司动态、加密市场趋势"
        ></textarea>

        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
              class="text-[11px] font-semibold text-[#8a7a60] underline decoration-dotted underline-offset-2 transition hover:text-[#5a4a30]"
              @click="saveFocus"
            >保存</button>
            <span v-if="focusUpdatedAt" class="text-[10px] text-[#b8a890]">已保存 {{ formatTime(focusUpdatedAt) }}</span>
          </div>
          <button
            class="rounded-lg bg-[#3a2e20] px-5 py-2 text-xs font-bold tracking-wide text-[#f5efe4] transition hover:bg-[#4a3e30] disabled:opacity-40"
            :disabled="refreshing"
            @click="refreshToday"
          >
            {{ refreshing ? '生成中' : '刷新今日早报' }}
          </button>
        </div>
      </section>

      <section v-if="error" class="mb-4 rounded-lg border border-[#e0b8a0] bg-[#fdf5ef] px-3 py-2 text-xs text-[#c05030]">
        {{ error }}
      </section>

      <section v-if="today" class="mb-8 rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-5">
        <div class="mb-2 flex items-baseline justify-between border-b border-[#e0d8cc] pb-2">
          <h2 class="text-xl font-extrabold text-[#3a2e20]">{{ today.title }}</h2>
          <span class="text-[10px] text-[#a09080]">{{ formatTime(today.updatedAt || today.createdAt) }}</span>
        </div>
        <p class="mb-4 rounded-lg bg-[#eee6da] px-3 py-2 text-xs italic leading-relaxed text-[#6a5a44]">{{ today.brief }}</p>
        <article class="whitespace-pre-wrap break-words text-sm leading-[1.9] text-[#4a3e2a]">{{ today.content }}</article>
      </section>

      <section v-else class="mb-8 rounded-xl border border-dashed border-[#d8d0c0] py-12 text-center">
        <p class="text-sm text-[#b0a090]">填写关注方向后，点击“刷新今日早报”生成内容</p>
      </section>

      <section>
        <div class="mb-3 flex items-baseline justify-between border-b border-[#e0d8cc] pb-2">
          <h2 class="text-xs font-bold uppercase tracking-widest text-[#a09078]">历史早报</h2>
          <span class="text-[10px] text-[#b8a890]">共 {{ total }} 期</span>
        </div>

        <div class="space-y-1">
          <button
            v-for="item in items"
            :key="item.id"
            class="w-full rounded-lg px-3 py-2.5 text-left transition"
            :class="today?.id === item.id ? 'bg-[#ede4d4]' : 'hover:bg-[#f5ede0]'"
            @click="today = item"
          >
            <div class="flex items-baseline justify-between gap-4">
              <p class="truncate text-sm font-bold text-[#3a2e20]">{{ item.title }}</p>
              <span class="shrink-0 text-[10px] text-[#b0a088]">{{ item.date }}</span>
            </div>
            <p class="mt-0.5 line-clamp-1 text-xs text-[#9a8a70]">{{ item.brief }}</p>
          </button>
        </div>

        <div v-if="totalPages > 1" class="mt-3 flex items-center justify-center gap-4">
          <button class="text-xs text-[#8a7a60] disabled:opacity-30" :disabled="page <= 1" @click="changePage(page - 1)">← 上一页</button>
          <span class="text-[10px] text-[#b0a088]">{{ page }} / {{ totalPages }}</span>
          <button class="text-xs text-[#8a7a60] disabled:opacity-30" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页 →</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const API_BASE = 'http://localhost:9701/apps/briefing';

const focus = ref('');
const focusUpdatedAt = ref('');
const refreshing = ref(false);
const error = ref('');

const today = ref(null);
const items = ref([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const totalPages = ref(1);

const todayText = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
});

const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const loadToday = async () => {
  const data = await request(`${API_BASE}/today`);
  focus.value = data.profile?.focus || '';
  focusUpdatedAt.value = data.profile?.updatedAt || '';
  today.value = data.today || null;
};

const loadHistory = async () => {
  const data = await request(`${API_BASE}/history?page=${page.value}&pageSize=${pageSize}`);
  items.value = data.items || [];
  total.value = data.total || 0;
  totalPages.value = data.totalPages || 1;
};

const saveFocus = async () => {
  error.value = '';
  try {
    const data = await request(`${API_BASE}/focus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus: focus.value })
    });
    focus.value = data.profile?.focus || '';
    focusUpdatedAt.value = data.profile?.updatedAt || '';
  } catch (e) {
    error.value = e.message || '保存失败';
  }
};

const refreshToday = async () => {
  error.value = '';
  refreshing.value = true;
  try {
    if (!focus.value.trim()) throw new Error('请先填写关注方向');
    await saveFocus();
    const data = await request(`${API_BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus: focus.value })
    });
    today.value = data.today || null;
    page.value = 1;
    await loadHistory();
  } catch (e) {
    error.value = e.message || '生成失败';
  } finally {
    refreshing.value = false;
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

