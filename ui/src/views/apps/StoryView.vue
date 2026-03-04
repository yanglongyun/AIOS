<template>
  <div class="flex h-full w-full overflow-hidden bg-[#f5f0e8] font-['PingFang_SC',-apple-system,sans-serif] text-[#4a3a28]">

    <!-- 左侧：故事列表 -->
    <div class="flex w-[220px] shrink-0 flex-col border-r border-[#e0d4c4] bg-[#ede8e0]">
      <div class="shrink-0 px-4 py-4">
        <div class="text-[14px] font-extrabold italic text-[#5a4030]">故事机</div>
        <p class="mt-0.5 text-[10px] text-[#a0907a]">互动式章节故事</p>
      </div>

      <!-- 新建按钮 -->
      <div class="shrink-0 px-3 pb-3">
        <button
          @click="showCreate = !showCreate"
          class="w-full rounded-xl border border-[#d4c0a0] bg-[#f5ead8] py-2 text-[12px] font-semibold text-[#6a5040] transition hover:bg-[#ece0c8]"
        >+ 新建故事</button>
      </div>

      <!-- 新建表单 -->
      <div v-if="showCreate" class="shrink-0 space-y-2 border-b border-[#e0d4c4] px-3 pb-3">
        <input
          v-model="newTitle"
          placeholder="故事标题"
          class="w-full rounded-lg border border-[#e0d4c4] bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-[#c8a060]"
        />
        <textarea
          v-model="newPremise"
          rows="2"
          placeholder="世界观设定（可选）"
          class="w-full rounded-lg border border-[#e0d4c4] bg-white px-2.5 py-1.5 text-[12px] leading-5 outline-none placeholder:text-[#c0b098] focus:border-[#c8a060]"
        />
        <button
          @click="createStory"
          :disabled="creating"
          class="w-full rounded-lg bg-[#5a3e28] py-1.5 text-[12px] font-semibold text-[#f5efe8] transition hover:bg-[#6a4e38] disabled:opacity-40"
        >{{ creating ? '创建中...' : '确认创建' }}</button>
      </div>

      <!-- 列表 -->
      <div class="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-1">
        <button
          v-for="s in sessions"
          :key="s.id"
          @click="selectSession(s.id)"
          class="w-full rounded-xl px-3 py-2.5 text-left transition"
          :class="activeSession?.id === s.id
            ? 'bg-[#5a3e28] text-[#f5ead8]'
            : 'text-[#5a4030] hover:bg-white/60'"
        >
          <p class="truncate text-[12px] font-semibold">{{ s.title }}</p>
          <p class="mt-0.5 text-[10px]" :class="activeSession?.id === s.id ? 'text-[#c8a870]' : 'text-[#a0907a]'">
            {{ s.progress || '第0章' }} · {{ s.chapterCount }}章
          </p>
        </button>
        <div v-if="!sessions.length" class="py-8 text-center text-[11px] text-[#b0a090]">暂无故事</div>
      </div>
    </div>

    <!-- 右侧：阅读/交互区 -->
    <div class="flex min-w-0 flex-1 flex-col">

      <!-- 无故事选中 -->
      <div v-if="!activeSession" class="flex flex-1 items-center justify-center text-[13px] text-[#b0a090]">
        选择或新建一个故事开始
      </div>

      <template v-else>
        <!-- 故事头部 -->
        <div class="shrink-0 border-b border-[#e0d4c4] bg-[#fffdf8] px-6 py-3">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <h2 class="truncate text-[15px] font-extrabold text-[#4a3020]">{{ activeSession.title }}</h2>
              <p v-if="activeSession.summary" class="mt-0.5 line-clamp-1 text-[11px] text-[#8a7a60]">{{ activeSession.summary }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span class="rounded-full border border-[#d4c0a0] bg-[#f5ead8] px-2.5 py-0.5 text-[10px] font-semibold text-[#7a5a38]">
                {{ activeSession.progress || '第0章' }}
              </span>
              <button
                @click="resetStory"
                :disabled="loading"
                class="rounded-lg border border-[#e0d4c4] px-2.5 py-1 text-[11px] text-[#b0a080] transition hover:border-[#c8a060] hover:text-[#a07040] disabled:opacity-40"
              >重置</button>
            </div>
          </div>
        </div>

        <!-- 章节流 -->
        <div ref="timelineRef" class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div class="mx-auto max-w-[680px] space-y-5">

            <!-- 空状态 -->
            <div v-if="!chapters.length" class="rounded-2xl border border-dashed border-[#e0d4c4] py-14 text-center text-[13px] text-[#b0a090]">
              还没有章节，点击下面"开始故事"即可生成第一章
            </div>

            <!-- 章节卡片 -->
            <div v-for="ch in chapters" :key="ch.id">
              <!-- 用户行动标签 -->
              <div v-if="ch.action && ch.action !== '开始故事'" class="mb-2 flex items-center gap-2">
                <span class="h-px flex-1 bg-[#e8e0d4]" />
                <span class="rounded-full border border-[#e0d4c4] bg-[#ede8e0] px-2.5 py-0.5 text-[10px] text-[#8a7a60]">
                  {{ ch.action }}
                </span>
                <span class="h-px flex-1 bg-[#e8e0d4]" />
              </div>

              <!-- 章节正文 -->
              <article class="rounded-2xl border border-[#e8dcc8] bg-[#fffaf2] px-5 py-4">
                <div class="mb-2.5 flex items-center justify-between text-[10px] text-[#b0a080]">
                  <span class="font-bold tracking-wider">第 {{ ch.idx }} 章</span>
                  <span>{{ ch.progress }}</span>
                </div>
                <p class="whitespace-pre-wrap text-[14px] leading-[1.9] text-[#3a2e1e]">{{ ch.content }}</p>
              </article>
            </div>

            <!-- 生成中 -->
            <div v-if="loading" class="flex items-center gap-3 py-4 text-[12px] text-[#b0a080]">
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-[#e8e0d4] border-t-[#c8a060]" />
              Agent 正在推进剧情...
            </div>
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="shrink-0 border-t border-[#e0d4c4] bg-[#fffdf8] px-6 py-4">
          <div class="mx-auto max-w-[680px]">
            <!-- 错误 -->
            <div v-if="error" class="mb-3 rounded-xl border border-[#e8c0b0] bg-[#fdf5f0] px-3 py-2 text-[11px] text-[#c06040]">{{ error }}</div>

            <!-- 三选项 -->
            <div v-if="currentChoices.length" class="mb-3 grid grid-cols-3 gap-2">
              <button
                v-for="(c, i) in currentChoices"
                :key="`${i}-${c}`"
                @click="runGenerate(c)"
                :disabled="loading"
                class="rounded-xl border border-[#d4c0a0] bg-[#f5ead8] px-3 py-2.5 text-left text-[12px] leading-snug text-[#5a4a38] transition hover:bg-[#ece0c8] hover:border-[#c8a060] disabled:opacity-40"
              >{{ c }}</button>
            </div>

            <!-- 自定义输入 -->
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
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';

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
