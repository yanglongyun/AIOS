<template>
  <div class="relative min-h-full bg-[#f5f0e8] font-['PingFang_SC',-apple-system,sans-serif] text-[#4a3f35]">

    <!-- 格线背景 -->
    <div class="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(transparent,transparent_31px,#e8ddd0_31px,#e8ddd0_32px)]" />


    <!-- topbar -->
    <div class="relative z-10 mx-auto flex max-w-xl items-center justify-between px-6 pb-3 pt-6">
      <div class="text-[22px] font-extrabold italic text-[#5a4030]">每日打卡</div>
      <div class="rounded-[10px] bg-[#ede7dc] px-3 py-1.5 text-right">
        <div class="text-[10px] leading-none tracking-widest text-[#b8a090]">{{ weekday }}</div>
        <div class="mt-0.5 text-[15px] font-bold leading-snug text-[#7a6050]">{{ monthDay }}</div>
      </div>
    </div>

    <!-- content -->
    <div class="relative z-10 mx-auto max-w-xl px-6 pb-16">

      <!-- error -->
      <div v-if="error" class="mb-3 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <!-- today card -->
      <div
        v-if="today.id"
        class="mb-4 overflow-hidden rounded-2xl border transition-all duration-500"
        :class="today.answered ? 'border-[#c8a060] shadow-[0_0_0_3px_rgba(200,160,96,0.12)]' : 'border-[#e0d4c4]'"
      >
        <!-- done banner -->
        <div
          v-if="today.answered"
          class="flex items-center gap-2.5 border-b border-[#f0e4c4] bg-gradient-to-r from-[#fdf4e3] to-[#fdf8ee] px-4 py-2.5"
        >
          <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8a44a] text-[12px] font-bold text-white">✓</div>
          <span class="text-[13px] font-bold text-[#a07030]">今日打卡完成</span>
          <span class="ml-auto rounded-full bg-[#fdf0d8] px-2 py-0.5 text-[11px] font-semibold text-[#c8902a]">
            🔥 连续 {{ stats.streak }} 天
          </span>
        </div>

        <!-- card head -->
        <div class="flex items-center justify-between px-4 pt-3">
          <span class="text-[11px] font-bold tracking-wider text-[#c09060]">今日</span>
          <button
            v-if="!today.answered"
            class="rounded-lg border border-[#e8ddd0] px-2.5 py-1 text-[11px] text-[#b0a080] transition hover:border-[#c09060] hover:text-[#c09060] disabled:opacity-40"
            :disabled="refreshing"
            @click="refreshQuestionByAgent"
          >
            {{ refreshing ? '生成中...' : '换一题 ↻' }}
          </button>
        </div>

        <!-- question -->
        <div class="px-4 pb-3 pt-2.5 text-[16px] font-semibold leading-relaxed text-[#3a2e1e]">
          {{ today.question }}
        </div>

        <!-- input area (未回答) -->
        <div v-if="!today.answered" class="border-t border-dotted border-[#e8e0d4] px-4 pb-4 pt-3">
          <textarea
            v-model="answerDraft"
            placeholder="写下你的回答..."
            rows="4"
            class="w-full rounded-xl border-[1.5px] border-dashed border-[#d4c8b8] bg-[#fafaf8] px-3.5 py-2.5 text-sm leading-relaxed text-[#4a3f35] outline-none transition placeholder:text-[#c4b8a8] focus:border-solid focus:border-[#c09060] focus:bg-white"
            @keydown.meta.enter.prevent="submitAnswer"
            @keydown.ctrl.enter.prevent="submitAnswer"
          />
          <div class="mt-2 flex items-center justify-between">
            <span class="text-[11px] text-[#c4b8a8]">⌘ + ↵ 提交</span>
            <button
              class="rounded-xl bg-[#e8a44a] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_6px_rgba(232,164,74,0.3)] transition hover:bg-[#d49440] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
              :disabled="saving || !answerDraft.trim()"
              @click="submitAnswer"
            >
              {{ saving ? '提交中...' : '提交回答' }}
            </button>
          </div>
        </div>

        <!-- answered display -->
        <div v-if="today.answered && today.answer" class="border-t border-dotted border-[#e8e0d4] px-4 py-3">
          <div class="mb-1.5 text-[10px] font-bold tracking-widest text-[#b0a080]">我的回答</div>
          <div class="whitespace-pre-wrap text-sm leading-relaxed text-[#5a4a38]">{{ today.answer }}</div>
        </div>

        <!-- ai response -->
        <div v-if="today.response" class="mx-4 mb-4 rounded-xl border border-[#f0e4c4] bg-[#fdf8ee] px-3.5 py-3">
          <div class="mb-1.5 text-[10px] font-bold tracking-widest text-[#c8902a]">✨ AI 回应</div>
          <div class="whitespace-pre-wrap text-[13px] leading-relaxed text-[#7a5a30]">{{ today.response }}</div>
        </div>
      </div>

      <!-- 无今日记录 -->
      <div v-else class="mb-4 rounded-2xl border border-dashed border-[#d4c8b8] py-12 text-center text-sm text-[#b0a090]">
        正在准备今日问题...
      </div>

      <!-- stats -->
      <div class="mb-4 flex gap-2">
        <div class="flex-1 rounded-xl border border-[#e8e0d4] bg-white py-2 text-center">
          <div class="text-[18px] font-extrabold text-[#5a4030]">{{ stats.totalDays }}</div>
          <div class="text-[10px] text-[#b8a898]">累计</div>
        </div>
        <div class="flex-1 rounded-xl border border-[#e8e0d4] bg-white py-2 text-center">
          <div class="text-[18px] font-extrabold text-[#5a4030]">{{ stats.totalAnswers }}</div>
          <div class="text-[10px] text-[#b8a898]">已答</div>
        </div>
        <div class="flex-1 rounded-xl border border-[#e8e0d4] bg-white py-2 text-center">
          <div class="text-[18px] font-extrabold text-[#5a4030]">{{ stats.streak }}</div>
          <div class="text-[10px] text-[#b8a898]">连续天</div>
        </div>
      </div>

      <!-- history -->
      <div v-if="items.length">
        <div class="mb-2.5 flex items-center gap-2">
          <span class="text-[13px] font-bold text-[#c09060]">历史</span>
          <span class="h-px flex-1 bg-[#e0d4c4]" />
          <span class="text-[11px] text-[#c4b8a8]">{{ total }} 条</span>
        </div>

        <div
          v-for="item in items"
          :key="item.id"
          class="flex gap-2.5 border-b border-dotted border-[#e0d8cc] py-3 last:border-0"
        >
          <div class="flex flex-col items-center pt-1">
            <div
              class="h-2 w-2 shrink-0 rounded-full"
              :class="item.answered ? 'bg-[#7ab868]' : 'bg-[#d8cec4]'"
            />
            <div class="mt-1 w-px flex-1 bg-[#e8e0d4]" />
          </div>
          <div class="min-w-0 flex-1 pb-1">
            <div class="mb-1 flex items-center gap-1.5">
              <span class="text-[11px] text-[#b8a898]">{{ item.date }}</span>
              <span
                class="rounded-full px-1.5 py-px text-[9px] font-bold"
                :class="item.answered ? 'bg-[#e8f5e4] text-[#4a8a38]' : 'bg-[#f0ebe0] text-[#b0a080]'"
              >{{ item.answered ? '已答' : '未答' }}</span>
            </div>
            <div class="mb-1 text-[13px] font-semibold leading-snug text-[#4a3a28]">{{ item.question }}</div>
            <div v-if="item.answer" class="text-xs leading-relaxed text-[#7a6a58]">{{ item.answer }}</div>
            <div v-else class="text-xs italic text-[#c0b098]">当天未回答</div>
            <div v-if="item.response" class="mt-1.5 rounded-lg bg-[#fdf8ee] px-2.5 py-2 text-xs leading-relaxed text-[#9a7a48]">
              {{ item.response }}
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-4">
          <button class="text-xs text-[#a09080] disabled:opacity-30" :disabled="page <= 1" @click="changePage(page - 1)">← 上一页</button>
          <span class="text-[10px] text-[#b0a088]">{{ page }} / {{ totalPages }}</span>
          <button class="text-xs text-[#a09080] disabled:opacity-30" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页 →</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';

const API_BASE = 'http://localhost:9701/apps/dailycheck';

const today = reactive({ id: 0, date: '', question: '', answered: false, answer: '', response: '' });
const stats = reactive({ totalDays: 0, totalAnswers: 0, streak: 0 });
const error = ref('');
const refreshing = ref(false);
const saving = ref(false);
const answerDraft = ref('');
const items = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const totalPages = ref(1);
const now = new Date();
const weekday = computed(() => ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()]);
const monthDay = computed(() => `${now.getMonth() + 1}月${now.getDate()}号`);

const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const applyToday = (data, s) => {
  today.id = data?.id || 0;
  today.date = data?.date || '';
  today.question = data?.question || '';
  today.answered = Boolean(data?.answered);
  today.answer = data?.answer || '';
  today.response = data?.response || '';
  if (s) { stats.totalDays = s.totalDays || 0; stats.totalAnswers = s.totalAnswers || 0; stats.streak = s.streak || 0; }
};

const loadToday = async () => {
  const data = await request(`${API_BASE}/today`);
  applyToday(data.today, data.stats);
};

const loadHistory = async () => {
  const data = await request(`${API_BASE}/history?page=${page.value}&pageSize=${pageSize}`);
  items.value = data.items || [];
  total.value = data.total || 0;
  totalPages.value = data.totalPages || 1;
};

/* confetti */
const launchConfetti = () => {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const colors = ['#e8a44a','#c8a060','#7ab868','#f0c880','#d49440','#a8c890'];
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 40,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
    angle: Math.random() * 360, spin: (Math.random() - 0.5) * 6,
    opacity: 1
  }));
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.opacity <= 0.05) continue;
      alive = true;
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.angle += p.spin;
      if (p.y > canvas.height * 0.6) p.opacity -= 0.03;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) requestAnimationFrame(tick);
    else canvas.remove();
  };
  tick();
};

const submitAnswer = async () => {
  if (!today.id || !answerDraft.value.trim() || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const data = await request(`${API_BASE}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyId: today.id, answer: answerDraft.value.trim() })
    });
    applyToday(data.today, null);
    stats.streak += 1;
    stats.totalAnswers += 1;
    launchConfetti();
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
    const data = await request(`${API_BASE}/refresh`, { method: 'POST' });
    applyToday(data.today, null);
    answerDraft.value = '';
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
