<template>
  <div class="h-full w-full overflow-y-auto bg-[#f5f0e8] text-[#3a2e20]" style="font-family: Georgia, 'Noto Serif SC', serif">
    <div class="mx-auto w-full max-w-3xl px-4 py-8">

      <!-- masthead -->
      <header class="mb-6 border-b-2 border-[#3a2e20] pb-4 text-center">
        <p class="text-[10px] uppercase tracking-[.35em] text-[#a09080]">AI-Powered Personal</p>
        <h1 class="mt-1 text-4xl font-black tracking-tight text-[#3a2e20]">专属早报</h1>
        <p class="mt-1.5 text-xs tracking-wide text-[#9a8a70]">{{ todayText }}</p>
      </header>

      <!-- requirement + generate -->
      <section class="mb-6">
        <div class="rounded-xl border border-[#ddd2c2] bg-[#fffdf8] p-4">
          <label class="mb-2 block text-[11px] font-bold uppercase tracking-widest text-[#a09078]">关注方向</label>
          <textarea
            v-model="requirement"
            rows="2"
            class="w-full resize-none rounded-lg border border-[#e8e0d4] bg-[#faf6f0] px-3 py-2.5 text-sm leading-relaxed text-[#3a2e20] outline-none transition placeholder:text-[#c4b8a4] focus:border-[#b89860] focus:ring-1 focus:ring-[#b89860]/30"
            placeholder="例如：我关注 AI 编程工具的最新进展、科技公司财报和云计算行业动态"
          ></textarea>

          <div class="mt-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button
                class="text-[11px] font-semibold text-[#8a7a60] underline decoration-dotted underline-offset-2 transition hover:text-[#5a4a30]"
                @click="saveConfig"
              >保存</button>
              <span v-if="configUpdatedAt" class="text-[10px] text-[#b8a890]">已保存 {{ formatTime(configUpdatedAt) }}</span>
            </div>
            <button
              class="relative overflow-hidden rounded-lg bg-[#3a2e20] px-5 py-2 text-xs font-bold tracking-wide text-[#f5efe4] transition hover:bg-[#4a3e30] disabled:opacity-40"
              :disabled="generating"
              @click="generate"
            >
              <span v-if="generating" class="flex items-center gap-1.5">
                <svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-20"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
                生成中
              </span>
              <span v-else>生成今日早报</span>
            </button>
          </div>
        </div>
      </section>

      <section v-if="error" class="mb-4 rounded-lg border border-[#e0b8a0] bg-[#fdf5ef] px-3 py-2 text-xs text-[#c05030]">
        {{ error }}
      </section>

      <!-- current report -->
      <section v-if="report" class="mb-8">
        <div class="mb-4 flex items-baseline justify-between border-b border-[#e0d8cc] pb-2">
          <h2 class="text-xl font-extrabold text-[#3a2e20]">{{ report.title }}</h2>
          <span class="shrink-0 text-[10px] text-[#a09080]">{{ formatTime(report.createdAt) }}</span>
        </div>

        <p v-if="report.requirement" class="mb-4 rounded-lg bg-[#eee6da] px-3 py-2 text-xs italic leading-relaxed text-[#6a5a44]">
          「{{ report.requirement }}」
        </p>

        <!-- rendered content -->
        <article class="prose-briefing space-y-1 text-sm leading-[1.9] text-[#3a2e20]">
          <template v-for="(line, i) in contentLines" :key="i">
            <h2 v-if="line.type === 'h2'" class="mt-5 mb-1.5 border-l-[3px] border-[#b89860] pl-3 text-base font-extrabold text-[#3a2e20]">{{ line.text }}</h2>
            <li v-else-if="line.type === 'li'" class="ml-4 list-disc text-[#4a3e2a]">{{ line.text }}</li>
            <p v-else-if="line.type === 'p' && line.text" class="text-[#4a3e2a]">{{ line.text }}</p>
          </template>
        </article>

        <!-- sources -->
        <details v-if="report.sources?.length" class="mt-6 group">
          <summary class="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-[#a09078] transition hover:text-[#6a5a40]">
            参考来源（{{ report.sources.length }}）
          </summary>
          <div class="mt-2 space-y-1">
            <a
              v-for="(s, idx) in report.sources.slice(0, 15)"
              :key="`${s.link}-${idx}`"
              :href="s.link"
              target="_blank"
              rel="noreferrer"
              class="flex items-baseline gap-2 rounded-md px-2 py-1.5 text-xs transition hover:bg-[#f0e8da]"
            >
              <span class="shrink-0 font-mono text-[10px] text-[#b8a890]">{{ String(idx + 1).padStart(2, '0') }}</span>
              <span class="text-[#5a4a38]">{{ s.title }}<span class="ml-1.5 text-[#b0a088]">— {{ s.source || s.keyword || '来源未知' }}</span></span>
            </a>
          </div>
        </details>
      </section>

      <div v-else class="mb-8 rounded-xl border border-dashed border-[#d8d0c0] py-12 text-center">
        <p class="text-sm text-[#b0a090]">填写关注方向，生成你的第一份早报</p>
      </div>

      <!-- history -->
      <section v-if="items.length">
        <div class="mb-3 flex items-baseline justify-between border-b border-[#e0d8cc] pb-2">
          <h2 class="text-xs font-bold uppercase tracking-widest text-[#a09078]">往期早报</h2>
          <span class="text-[10px] text-[#b8a890]">共 {{ total }} 期</span>
        </div>

        <div class="space-y-1">
          <button
            v-for="item in items"
            :key="item.id"
            class="w-full rounded-lg px-3 py-2.5 text-left transition"
            :class="report?.id === item.id ? 'bg-[#ede4d4]' : 'hover:bg-[#f5ede0]'"
            @click="loadDetail(item.id)"
          >
            <div class="flex items-baseline justify-between gap-4">
              <p class="truncate text-sm font-bold text-[#3a2e20]">{{ item.title }}</p>
              <span class="shrink-0 text-[10px] text-[#b0a088]">{{ formatTime(item.createdAt) }}</span>
            </div>
            <p class="mt-0.5 line-clamp-1 text-xs text-[#9a8a70]">{{ item.preview }}</p>
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
import { ref, computed, onMounted } from 'vue';

const API_BASE = 'http://localhost:9701/apps/briefing';

const requirement = ref('');
const configUpdatedAt = ref('');
const generating = ref(false);
const error = ref('');

const report = ref(null);
const items = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const totalPages = ref(1);

const todayText = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

const contentLines = computed(() => {
  if (!report.value?.content) return [];
  return report.value.content.split('\n').map((raw) => {
    const line = raw.trimEnd();
    if (/^## /.test(line)) return { type: 'h2', text: line.slice(3).trim() };
    if (/^# /.test(line)) return { type: 'h2', text: line.slice(2).trim() };
    if (/^- /.test(line)) return { type: 'li', text: line.slice(2).trim() };
    if (/^\d+\.\s/.test(line)) return { type: 'li', text: line.replace(/^\d+\.\s*/, '').trim() };
    return { type: 'p', text: line };
  });
});

const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const saveConfig = async () => {
  error.value = '';
  try {
    const data = await request(`${API_BASE}/config/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement: requirement.value })
    });
    requirement.value = data.requirement || '';
    configUpdatedAt.value = data.updatedAt || '';
  } catch (e) {
    error.value = e.message || '保存失败';
  }
};

const loadConfig = async () => {
  const data = await request(`${API_BASE}/config/get`);
  requirement.value = data.requirement || '';
  configUpdatedAt.value = data.updatedAt || '';
};

const loadList = async () => {
  const data = await request(`${API_BASE}/report/list?page=${page.value}&pageSize=${pageSize}`);
  items.value = data.items || [];
  total.value = data.total || 0;
  totalPages.value = data.totalPages || 1;
};

const loadDetail = async (id) => {
  error.value = '';
  try {
    const data = await request(`${API_BASE}/report/detail?id=${id}`);
    report.value = data.report;
  } catch (e) {
    error.value = e.message || '加载失败';
  }
};

const generate = async () => {
  error.value = '';
  generating.value = true;
  try {
    const text = requirement.value.trim();
    if (!text) throw new Error('请先填写关注方向');

    await saveConfig();
    const data = await request(`${API_BASE}/report/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement: text })
    });

    report.value = data.report;
    page.value = 1;
    await loadList();
  } catch (e) {
    error.value = e.message || '生成失败';
  } finally {
    generating.value = false;
  }
};

const changePage = async (nextPage) => {
  if (nextPage < 1 || nextPage > totalPages.value) return;
  page.value = nextPage;
  await loadList();
};

const formatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('zh-CN', { hour12: false });
};

onMounted(async () => {
  try {
    await loadConfig();
    await loadList();
    if (items.value.length > 0) await loadDetail(items.value[0].id);
  } catch (e) {
    error.value = e.message || '初始化失败';
  }
});
</script>
