<template>
  <div class="h-full w-full overflow-y-auto bg-[#f5f0e8] px-4 py-6 text-[#4a3a28]">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <section class="rounded-2xl border border-[#e0d4c4] bg-[#fffdf8] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h1 class="text-2xl font-extrabold italic text-[#5a4030]">故事机</h1>
            <p class="mt-1 text-xs text-[#a0907a]">每次推进都输出三选项，并持续更新故事梗概与进度。</p>
          </div>
          <button
            class="rounded-lg border border-[#d4c0a0] bg-[#f5ead8] px-3 py-1.5 text-xs font-semibold text-[#6a5a48] transition hover:bg-[#ece0c8] disabled:opacity-40"
            :disabled="!activeSession || loading"
            @click="resetStory"
          >重置故事</button>
        </div>

        <div class="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
          <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              v-model="newTitle"
              placeholder="故事标题"
              class="rounded-lg border border-[#e0d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#c8a060]"
            />
            <button
              class="rounded-lg bg-[#5a3e28] px-4 py-2 text-sm font-semibold text-[#f5efe8] transition hover:bg-[#6a4e38] disabled:opacity-40"
              :disabled="creating"
              @click="createStory"
            >{{ creating ? '创建中...' : '新建故事' }}</button>
          </div>
          <textarea
            v-model="newPrompt"
            rows="2"
            placeholder="故事设定（可选）：世界观、风格、主线目标..."
            class="rounded-lg border border-[#e0d4c4] bg-white px-3 py-2 text-sm leading-6 outline-none placeholder:text-[#c0b098] focus:border-[#c8a060] md:col-span-2"
          ></textarea>
        </div>
      </section>

      <section v-if="error" class="rounded-xl border border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-sm text-[#c06040]">{{ error }}</section>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section class="rounded-2xl border border-[#e0d4c4] bg-[#fffdf8] p-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-sm font-bold text-[#5a4030]">故事列表</h2>
            <span class="text-xs text-[#a0907a]">{{ sessions.length }}</span>
          </div>
          <div class="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            <button
              v-for="s in sessions"
              :key="s.id"
              class="w-full rounded-xl border px-3 py-2 text-left transition"
              :class="activeSession?.id === s.id ? 'border-[#c8a060] bg-[#fff7ea]' : 'border-[#ece2d4] bg-white hover:border-[#d4c0a0]'"
              @click="selectSession(s.id)"
            >
              <p class="truncate text-sm font-semibold text-[#4a3a28]">{{ s.title }}</p>
              <p class="mt-1 line-clamp-2 text-xs text-[#8a7a60]">{{ s.progress || '第0章' }}</p>
            </button>
            <div v-if="!sessions.length" class="rounded-lg border border-dashed border-[#e0d4c4] bg-[#fffcf6] px-3 py-5 text-center text-xs text-[#b0a090]">
              暂无故事
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-[#e0d4c4] bg-[#fffdf8] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div v-if="activeSession" class="mb-3 rounded-xl border border-[#ece2d4] bg-[#fffbf4] px-3 py-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-base font-bold text-[#5a4030]">{{ activeSession.title }}</h2>
              <span class="rounded-full border border-[#d4c0a0] bg-[#f5ead8] px-2 py-0.5 text-xs text-[#6a5a48]">{{ activeSession.progress || '第0章' }}</span>
            </div>
            <p class="mt-1 text-xs leading-6 text-[#6a5a48]">{{ activeSession.summary || '故事尚未展开。点击“开始故事”进入第一章。' }}</p>
          </div>

          <div ref="timelineRef" class="max-h-[460px] space-y-3 overflow-y-auto pr-1">
            <article v-for="turn in turns" :key="turn.id" class="rounded-xl border px-3 py-2" :class="turn.role === 'assistant' ? 'border-[#e8dcc8] bg-[#fffaf2]' : 'border-[#ece2d4] bg-white'">
              <div class="mb-1 flex items-center justify-between text-[11px] text-[#a0907a]">
                <span>{{ turn.role === 'assistant' ? `第${turn.turnIndex}章` : '你的选择' }}</span>
                <span>{{ formatTime(turn.createdAt) }}</span>
              </div>
              <p class="whitespace-pre-wrap text-sm leading-7 text-[#4a3a28]">{{ turn.content }}</p>
              <div v-if="turn.role === 'assistant'" class="mt-2">
                <p class="text-[11px] text-[#8a7a60]">进度：{{ turn.progress }}</p>
                <p class="mt-1 text-[11px] leading-5 text-[#8a7a60]">梗概：{{ turn.summary }}</p>
              </div>
            </article>
            <div v-if="!turns.length" class="rounded-xl border border-dashed border-[#e0d4c4] bg-[#fffcf6] px-4 py-10 text-center text-sm text-[#b0a090]">
              还没有章节，点击下面“开始故事”即可生成第一章。
            </div>
          </div>

          <div v-if="activeSession" class="mt-3 space-y-2">
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                v-for="(c, idx) in currentChoices"
                :key="`${idx}-${c}`"
                class="rounded-xl border border-[#d4c0a0] bg-[#f5ead8] px-3 py-2 text-left text-sm text-[#5a4a38] transition hover:bg-[#ece0c8] disabled:opacity-40"
                :disabled="loading"
                @click="generateByChoice(c)"
              >{{ c }}</button>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="customAction"
                placeholder="自定义行动..."
                @keyup.enter="generateByCustom"
                class="min-w-0 flex-1 rounded-lg border border-[#e0d4c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#c8a060]"
              />
              <button
                class="rounded-lg bg-[#5a3e28] px-3 py-2 text-sm font-semibold text-[#f5efe8] transition hover:bg-[#6a4e38] disabled:opacity-40"
                :disabled="loading"
                @click="turns.length ? generateByCustom() : generateByChoice('开始故事')"
              >{{ loading ? '生成中...' : (turns.length ? '发送' : '开始故事') }}</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';

const API_BASE = 'http://localhost:9701/api/apps/story';

const sessions = ref([]);
const activeSession = ref(null);
const turns = ref([]);
const error = ref('');
const creating = ref(false);
const loading = ref(false);

const newTitle = ref('');
const newPrompt = ref('');
const customAction = ref('');
const timelineRef = ref(null);

const currentChoices = computed(() => {
  for (let i = turns.value.length - 1; i >= 0; i -= 1) {
    const t = turns.value[i];
    if (t.role === 'assistant' && Array.isArray(t.choices) && t.choices.length) {
      return t.choices.slice(0, 3);
    }
  }
  return ['观察环境', '主动出击', '保守试探'];
});

const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const scrollToBottom = async () => {
  await nextTick();
  if (timelineRef.value) {
    timelineRef.value.scrollTop = timelineRef.value.scrollHeight;
  }
};

const loadSessions = async () => {
  const data = await request(`${API_BASE}/list`);
  sessions.value = data.items || [];
};

const selectSession = async (id) => {
  const data = await request(`${API_BASE}/history?sessionId=${id}`);
  activeSession.value = data.session;
  turns.value = data.turns || [];
  await scrollToBottom();
};

const createStory = async () => {
  error.value = '';
  creating.value = true;
  try {
    const data = await request(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.value.trim(),
        story_prompt: newPrompt.value.trim()
      })
    });
    newTitle.value = '';
    newPrompt.value = '';
    await loadSessions();
    await selectSession(data.session.id);
  } catch (e) {
    error.value = e.message || '创建失败';
  } finally {
    creating.value = false;
  }
};

const refreshSessionHeader = () => {
  if (!activeSession.value) return;
  const latest = turns.value.filter(t => t.role === 'assistant').slice(-1)[0];
  if (!latest) return;
  activeSession.value = {
    ...activeSession.value,
    summary: latest.summary || activeSession.value.summary,
    progress: latest.progress || activeSession.value.progress,
    totalChapters: latest.turnIndex || activeSession.value.totalChapters
  };
};

const runGenerate = async (actionText) => {
  if (!activeSession.value || loading.value) return;
  error.value = '';
  loading.value = true;
  try {
    await request(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: activeSession.value.id, action: actionText })
    });
    await selectSession(activeSession.value.id);
    refreshSessionHeader();
    await loadSessions();
  } catch (e) {
    error.value = e.message || '生成失败';
  } finally {
    loading.value = false;
    customAction.value = '';
  }
};

const generateByChoice = async (choice) => {
  await runGenerate(choice);
};

const generateByCustom = async () => {
  const text = customAction.value.trim();
  if (!text) return;
  await runGenerate(text);
};

const resetStory = async () => {
  if (!activeSession.value || loading.value) return;
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

const formatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('zh-CN', { hour12: false });
};

onMounted(async () => {
  try {
    await loadSessions();
    if (sessions.value.length > 0) {
      await selectSession(sessions.value[0].id);
    }
  } catch (e) {
    error.value = e.message || '初始化失败';
  }
});
</script>
