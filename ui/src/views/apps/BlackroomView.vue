<template>
  <div class="h-full w-full overflow-y-auto bg-black text-[#d6d6d6] [scrollbar-color:#5a5a5a_#151515] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#151515] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#5a5a5a] [&::-webkit-scrollbar-thumb:hover]:bg-[#7a7a7a]">
    <div class="mx-auto w-full max-w-4xl px-5 py-8">
      <header class="mb-6 border-b border-white/10 pb-4">
        <h1 class="text-3xl font-extrabold text-white">小黑屋</h1>
        <p class="mt-2 text-sm text-[#8a8a8a]">对 AI 不满意就写下来，也可以投掷 💩 发泄情绪。提交后会交给 Agent 处理。</p>
      </header>

      <section class="mb-5 rounded-xl border border-white/10 bg-[#0c0c0c] p-4">
        <label class="mb-2 block text-xs uppercase tracking-widest text-[#888]">不满内容</label>
        <textarea
          v-model="complaint"
          rows="5"
          placeholder="例如：你最近总是答非所问，执行动作前也没先确认..."
          class="w-full resize-none rounded-lg border border-white/10 bg-[#131313] px-3 py-2.5 text-sm leading-relaxed text-[#e8e8e8] outline-none placeholder:text-[#666] focus:border-[#888]"
        />

        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg border border-[#5a5a5a] bg-[#1b1b1b] px-3 py-1.5 text-sm text-[#d8d8d8] transition hover:bg-[#252525]"
              @click="addPoop"
            >
              投掷 💩
            </button>
            <button
              class="rounded-lg border border-white/10 bg-[#151515] px-3 py-1.5 text-xs text-[#999] transition hover:bg-[#1e1e1e]"
              @click="resetPoop"
            >
              清空
            </button>
            <span class="text-xs text-[#9a9a9a]">当前 {{ poopCount }} 个</span>
          </div>

          <button
            class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#ddd] disabled:opacity-40"
            :disabled="submitting || (!complaint.trim() && poopCount <= 0)"
            @click="submit"
          >
            {{ submitting ? '提交中...' : '提交给 Agent' }}
          </button>
        </div>

        <div class="mt-3 min-h-[20px] text-xs text-[#c77]">{{ error }}</div>
      </section>

      <section class="mb-5 rounded-xl border border-white/10 bg-[#0c0c0c] p-4">
        <div class="mb-2 text-xs uppercase tracking-widest text-[#888]">统计</div>
        <div class="flex gap-2">
          <div class="flex-1 rounded-lg border border-white/10 bg-[#141414] px-3 py-2">
            <div class="text-xl font-bold text-white">{{ stats.totalCount }}</div>
            <div class="text-[11px] text-[#8d8d8d]">累计不满</div>
          </div>
          <div class="flex-1 rounded-lg border border-white/10 bg-[#141414] px-3 py-2">
            <div class="text-xl font-bold text-white">{{ stats.totalPoop }}</div>
            <div class="text-[11px] text-[#8d8d8d]">累计 💩</div>
          </div>
        </div>
      </section>

      <section>
        <div class="mb-2 flex items-center justify-between">
          <div class="text-xs uppercase tracking-widest text-[#888]">记录</div>
          <div class="text-[11px] text-[#666]">第 {{ page }} / {{ totalPages }} 页</div>
        </div>

        <div v-if="items.length === 0" class="rounded-xl border border-dashed border-white/15 py-10 text-center text-sm text-[#666]">
          还没有记录
        </div>

        <div v-else class="space-y-2">
          <div v-for="item in items" :key="item.id" class="rounded-xl border border-white/10 bg-[#101010] p-3">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-[11px] text-[#777]">#{{ item.id }} · {{ formatTime(item.createdAt) }}</span>
              <span class="text-xs text-[#aaa]">💩 x {{ item.poopCount }}</span>
            </div>
            <div v-if="item.complaint" class="whitespace-pre-wrap text-sm leading-relaxed text-[#ddd]">{{ item.complaint }}</div>
            <div v-else class="text-sm italic text-[#777]">（无文本，仅情绪投掷）</div>
            <div v-if="item.agentResponse" class="mt-2 rounded-lg border border-white/10 bg-[#171717] px-2.5 py-2 text-xs leading-relaxed text-[#bbb]">
              Agent：{{ item.agentResponse }}
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-4">
          <button class="text-xs text-[#999] disabled:opacity-30" :disabled="page <= 1" @click="changePage(page - 1)">← 上一页</button>
          <span class="text-[10px] text-[#666]">{{ page }} / {{ totalPages }}</span>
          <button class="text-xs text-[#999] disabled:opacity-30" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页 →</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';

const API_BASE = 'http://localhost:9701/apps/blackroom';

const complaint = ref('');
const poopCount = ref(0);
const submitting = ref(false);
const error = ref('');

const items = ref([]);
const page = ref(1);
const pageSize = 10;
const totalPages = ref(1);
const stats = reactive({ totalCount: 0, totalPoop: 0 });

const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const loadList = async () => {
  const data = await request(`${API_BASE}/list?page=${page.value}&pageSize=${pageSize}`);
  items.value = data.items || [];
  totalPages.value = data.totalPages || 1;
  stats.totalCount = data.stats?.totalCount || 0;
  stats.totalPoop = data.stats?.totalPoop || 0;
};

const addPoop = () => {
  poopCount.value += 1;
};

const resetPoop = () => {
  poopCount.value = 0;
};

const submit = async () => {
  if (submitting.value) return;
  if (!complaint.value.trim() && poopCount.value <= 0) return;
  submitting.value = true;
  error.value = '';
  try {
    await request(`${API_BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint: complaint.value,
        poopCount: poopCount.value
      })
    });
    complaint.value = '';
    poopCount.value = 0;
    page.value = 1;
    await loadList();
  } catch (e) {
    error.value = e.message || '提交失败';
  } finally {
    submitting.value = false;
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

onMounted(loadList);
</script>
