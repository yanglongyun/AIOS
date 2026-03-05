<template>
  <div class="flex h-full flex-col bg-[#f5f0e8] font-['PingFang_SC',-apple-system,sans-serif] text-[#4a3a28]">

    <!-- ========== 列表页 ========== -->
    <template v-if="!activeSession">
      <!-- 顶栏 -->
      <div class="shrink-0 border-b border-[#d4b896] bg-[#f0e6d4] px-5 py-3">
        <div class="mx-auto flex max-w-[800px] items-center justify-between">
          <div>
            <div class="text-[15px] font-extrabold text-[#3a2010]">故事会</div>
            <p class="text-[10px] text-[#9a7a5a]">互动式章节故事</p>
          </div>
          <button @click="showCreate = !showCreate" class="rounded-lg border border-[#c4a070] bg-[#e8d4b0] px-3 py-1.5 text-[12px] font-semibold text-[#5a3a18] transition hover:bg-[#dcc8a0]">+ 新建故事</button>
        </div>
        <div v-if="showCreate" class="mx-auto mt-3 max-w-[800px] space-y-2 border-t border-[#d4c0a0] pt-3">
          <input v-model="newTitle" placeholder="故事标题" class="w-full rounded-lg border border-[#d4c0a0] bg-white/80 px-3 py-2 text-[13px] outline-none focus:border-[#c8a060]" />
          <textarea v-model="newPremise" rows="2" placeholder="世界观设定（可选）" class="w-full rounded-lg border border-[#d4c0a0] bg-white/80 px-3 py-2 text-[13px] leading-5 outline-none placeholder:text-[#c0b098] focus:border-[#c8a060]" />
          <div class="flex justify-end">
            <button @click="createStory" :disabled="creating" class="rounded-lg bg-[#5a3e28] px-5 py-1.5 text-[12px] font-semibold text-[#f5efe8] transition hover:bg-[#6a4e38] disabled:opacity-40">{{ creating ? '创建中...' : '确认创建' }}</button>
          </div>
        </div>
      </div>

      <!-- 书架区域 -->
      <div class="shelf-room flex-1 overflow-y-auto">
        <div v-if="!sessions.length" class="flex h-full items-center justify-center text-[13px] text-[#a08060]">还没有故事，新建一个开始吧</div>
        <div v-else class="px-10 pt-10 pb-4">
          <div class="shelf-row">
            <!-- 书脊 -->
            <button
              v-for="(s, i) in sessions" :key="s.id"
              class="book-spine"
              :style="{
                background: bookColor(i).bg,
                height: bookHeight(i) + 'px',
                '--text-color': bookColor(i).text,
                '--accent-color': bookColor(i).accent,
              }"
              @click="selectSession(s.id)"
            >
              <span class="book-label">{{ s.title }}</span>
              <span class="book-meta">{{ s.chapterCount }}章</span>
            </button>
          </div>
          <!-- 木板 -->
          <div class="shelf-board"></div>
          <div class="shelf-shadow"></div>
        </div>
      </div>
    </template>

    <!-- ========== 详情页 ========== -->
    <template v-else>
      <!-- 顶栏 + 面包屑 -->
      <div class="shrink-0 border-b border-[#e0d4c4] bg-[#fffdf8] px-5 py-3">
        <div class="mx-auto max-w-[680px] flex items-center justify-between">
          <div class="flex items-center gap-1.5 text-[13px]">
            <button @click="activeSession = null" class="text-[#a0907a] hover:text-[#5a4030] transition">故事会</button>
            <span class="text-[#d4c0a0]">/</span>
            <span class="font-semibold text-[#4a3020] truncate max-w-[200px]">{{ activeSession.title }}</span>
            <span class="ml-2 rounded-full border border-[#d4c0a0] bg-[#f5ead8] px-2 py-0.5 text-[10px] font-semibold text-[#7a5a38]">{{ activeSession.progress || '第0章' }}</span>
          </div>
          <button @click="resetStory" :disabled="loading" class="rounded-lg border border-[#e0d4c4] px-2.5 py-1 text-[11px] text-[#b0a080] transition hover:border-[#c8a060] hover:text-[#a07040] disabled:opacity-40">重置</button>
        </div>
      </div>

      <!-- 章节流 -->
      <div ref="timelineRef" class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div class="mx-auto max-w-[680px] space-y-5">
          <div v-if="!chapters.length" class="rounded-2xl border border-dashed border-[#e0d4c4] py-14 text-center text-[13px] text-[#b0a090]">
            还没有章节，点击下面"开始故事"即可生成第一章
          </div>
          <div v-for="ch in chapters" :key="ch.id">
            <div v-if="ch.action && ch.action !== '开始故事'" class="mb-2 flex items-center gap-2">
              <span class="h-px flex-1 bg-[#e8e0d4]" />
              <span class="rounded-full border border-[#e0d4c4] bg-[#ede8e0] px-2.5 py-0.5 text-[10px] text-[#8a7a60]">{{ ch.action }}</span>
              <span class="h-px flex-1 bg-[#e8e0d4]" />
            </div>
            <article class="rounded-2xl border border-[#e8dcc8] bg-[#fffaf2] px-5 py-4">
              <div class="mb-2.5 flex items-center justify-between text-[10px] text-[#b0a080]">
                <span class="font-bold tracking-wider">第 {{ ch.idx }} 章</span>
                <span>{{ ch.progress }}</span>
              </div>
              <p class="whitespace-pre-wrap text-[14px] leading-[1.9] text-[#3a2e1e]">{{ ch.content }}</p>
            </article>
          </div>
          <div v-if="loading" class="flex items-center gap-3 py-4 text-[12px] text-[#b0a080]">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-[#e8e0d4] border-t-[#c8a060]" />
            Agent 正在推进剧情...
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="shrink-0 border-t border-[#e0d4c4] bg-[#fffdf8] px-5 py-4">
        <div class="mx-auto max-w-[680px]">
          <div v-if="error" class="mb-3 rounded-xl border border-[#e8c0b0] bg-[#fdf5f0] px-3 py-2 text-[11px] text-[#c06040]">{{ error }}</div>
          <div v-if="currentChoices.length" class="mb-3 grid grid-cols-3 gap-2">
            <button
              v-for="(c, i) in currentChoices" :key="`${i}-${c}`"
              @click="runGenerate(c)" :disabled="loading"
              class="rounded-xl border border-[#d4c0a0] bg-[#f5ead8] px-3 py-2.5 text-left text-[12px] leading-snug text-[#5a4a38] transition hover:border-[#c8a060] hover:bg-[#ece0c8] disabled:opacity-40"
            >{{ c }}</button>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="customAction"
              placeholder="自定义行动，或直接开始故事..."
              @keyup.enter="chapters.length ? runCustom() : runGenerate('开始故事')"
              class="min-w-0 flex-1 rounded-xl border border-[#e0d4c4] bg-white px-4 py-2.5 text-[13px] outline-none transition placeholder:text-[#c0b098] focus:border-[#c8a060]"
            />
            <button
              @click="chapters.length ? runCustom() : runGenerate('开始故事')"
              :disabled="loading"
              class="shrink-0 rounded-xl bg-[#5a3e28] px-5 py-2.5 text-[13px] font-semibold text-[#f5efe8] transition hover:bg-[#6a4e38] disabled:opacity-40"
            >{{ loading ? '生成中...' : (chapters.length ? '行动' : '开始故事') }}</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';

const SPINE_COLORS = [
  { bg: 'linear-gradient(to right, #6b2323, #8b3a3a, #7a2a2a)', text: '#f5dcc8', accent: '#e8a878' },
  { bg: 'linear-gradient(to right, #1c3f6e, #2c5f8a, #1e4878)', text: '#d8eaf8', accent: '#88b8e8' },
  { bg: 'linear-gradient(to right, #1e4d30, #2d6a4f, #224038)', text: '#d0f0e0', accent: '#78c898' },
  { bg: 'linear-gradient(to right, #5a3010, #7a4820, #623818)', text: '#f5e0c8', accent: '#d89858' },
  { bg: 'linear-gradient(to right, #3d2060, #5a3a7a, #442868)', text: '#e8d8f8', accent: '#b890e8' },
  { bg: 'linear-gradient(to right, #7a3010, #b85c2a, #8a3818)', text: '#f8e8d8', accent: '#e8a878' },
  { bg: 'linear-gradient(to right, #283858, #3a4a6a, #2e4060)', text: '#d8e8f8', accent: '#8898c8' },
  { bg: 'linear-gradient(to right, #1a4848, #2a6868, #1e5050)', text: '#d0f0f0', accent: '#78c8c8' },
];
const bookColor = (i) => SPINE_COLORS[i % SPINE_COLORS.length];
const bookHeight = (i) => 148 + (i % 4) * 18;

const API_BASE = '/apps/story';

const sessions = ref([]);
const activeSession = ref(null);
const chapters = ref([]);
const error = ref('');
const creating = ref(false);
const loading = ref(false);
const showCreate = ref(false);
const newTitle = ref('');
const newPremise = ref('');
const customAction = ref('');
const timelineRef = ref(null);

const currentChoices = computed(() => {
  for (let i = chapters.value.length - 1; i >= 0; i--) {
    const ch = chapters.value[i];
    if (Array.isArray(ch.choices) && ch.choices.length) return ch.choices.slice(0, 3);
  }
  return [];
});

const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const scrollToBottom = async () => {
  await nextTick();
  if (timelineRef.value) timelineRef.value.scrollTop = timelineRef.value.scrollHeight;
};

const loadSessions = async () => {
  const data = await request(`${API_BASE}/list`);
  sessions.value = data.items || [];
};

const selectSession = async (id) => {
  const data = await request(`${API_BASE}/history?sessionId=${id}`);
  activeSession.value = data.session;
  chapters.value = data.chapters || [];
  error.value = '';
  await scrollToBottom();
};

const createStory = async () => {
  error.value = '';
  creating.value = true;
  try {
    const data = await request(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.value.trim(), premise: newPremise.value.trim() })
    });
    newTitle.value = '';
    newPremise.value = '';
    showCreate.value = false;
    await loadSessions();
    await selectSession(data.session.id);
  } catch (e) {
    error.value = e.message || '创建失败';
  } finally {
    creating.value = false;
  }
};

const runGenerate = async (action) => {
  if (!activeSession.value || loading.value) return;
  error.value = '';
  loading.value = true;
  try {
    await request(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: activeSession.value.id, action })
    });
    await selectSession(activeSession.value.id);
    await loadSessions();
  } catch (e) {
    error.value = e.message || '生成失败';
  } finally {
    loading.value = false;
    customAction.value = '';
  }
};

const runCustom = async () => {
  const text = customAction.value.trim();
  if (!text) return;
  await runGenerate(text);
};

const resetStory = async () => {
  if (!activeSession.value || loading.value) return;
  if (!confirm(`重置「${activeSession.value.title}」？所有章节将被清除。`)) return;
  error.value = '';
  loading.value = true;
  try {
    await request(`${API_BASE}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: activeSession.value.id })
    });
    await selectSession(activeSession.value.id);
    await loadSessions();
  } catch (e) {
    error.value = e.message || '重置失败';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await loadSessions();
    if (sessions.value.length > 0) await selectSession(sessions.value[0].id);
  } catch (e) {
    error.value = e.message || '初始化失败';
  }
});
</script>

<style scoped>
/* ===== 书房背景 ===== */
.shelf-room {
  background:
    radial-gradient(ellipse at top, #2a1a0a 0%, #1a0e05 60%, #0e0805 100%);
  position: relative;
}
.shelf-room::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 80px,
      rgba(255,220,160,0.03) 80px,
      rgba(255,220,160,0.03) 81px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 120px,
      rgba(255,220,160,0.02) 120px,
      rgba(255,220,160,0.02) 121px
    );
  pointer-events: none;
}

/* ===== 书架行 ===== */
.shelf-row {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  padding: 0 4px;
  flex-wrap: wrap;
}

/* ===== 书脊 ===== */
.book-spine {
  position: relative;
  width: 42px;
  border-radius: 2px 4px 4px 2px;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
  box-shadow:
    inset -3px 0 6px rgba(0,0,0,0.4),
    inset 2px 0 4px rgba(255,255,255,0.08),
    2px 4px 12px rgba(0,0,0,0.6),
    1px 0 0 rgba(0,0,0,0.5);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 8px;
  overflow: hidden;
}
.book-spine::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background: rgba(0,0,0,0.35);
  border-radius: 2px 0 0 2px;
}
.book-spine::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: rgba(255,255,255,0.07);
}
.book-spine:hover {
  transform: translateY(-14px) scale(1.04);
  box-shadow:
    inset -3px 0 6px rgba(0,0,0,0.4),
    inset 2px 0 4px rgba(255,255,255,0.1),
    4px 18px 24px rgba(0,0,0,0.7),
    1px 0 0 rgba(0,0,0,0.5);
  z-index: 10;
}

/* ===== 书名标签（竖排） ===== */
.book-label {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  color: var(--text-color, #f0e0c8);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 1;
  max-height: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 2px;
}

/* ===== 章节数标记 ===== */
.book-meta {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  color: var(--accent-color, #d8a878);
  font-size: 9px;
  letter-spacing: 0.05em;
  opacity: 0.85;
  flex-shrink: 0;
}

/* ===== 木板 ===== */
.shelf-board {
  height: 18px;
  margin: 0 -4px;
  background: linear-gradient(
    to bottom,
    #c89040 0%,
    #a06820 30%,
    #7a4e10 60%,
    #906030 80%,
    #c89040 100%
  );
  border-radius: 0 0 3px 3px;
  box-shadow:
    0 3px 0 #5a3008,
    0 6px 16px rgba(0,0,0,0.5);
  position: relative;
  z-index: 1;
}
.shelf-board::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 40px,
    rgba(0,0,0,0.08) 40px,
    rgba(0,0,0,0.08) 41px
  );
}

/* ===== 木板阴影 ===== */
.shelf-shadow {
  height: 20px;
  margin: 0 8px;
  background: radial-gradient(ellipse at top, rgba(0,0,0,0.45) 0%, transparent 70%);
  position: relative;
  z-index: 0;
}
</style>
