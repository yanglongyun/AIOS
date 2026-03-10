<template>
  <div class="flex h-full flex-col bg-[#e8ddd0] font-['PingFang_SC',-apple-system,serif] text-[#3a2e20]">

    <!-- ========== 列表页 ========== -->
    <template v-if="view === 'list'">
      <div class="beam shrink-0 relative z-20 flex h-[50px] items-center justify-between px-5">
        <span class="font-serif text-[15px] font-extrabold tracking-wider text-[#fff8ee] [text-shadow:0_1px_3px_rgba(0,0,0,.3)]">阅 读 器</span>
        <span></span>
      </div>
      <div class="wood-dark flex-1 overflow-y-auto">
        <div v-if="!sessions.length" class="flex h-full items-center justify-center text-[13px] text-[#9a8060]">还没有阅读，新建一个开始吧</div>
        <template v-else>
          <div v-for="(tier, ti) in shelfTiers" :key="ti" class="relative">
            <div class="book-row relative z-[2] grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-x-2.5 gap-y-3 px-5 pb-[18px] pt-8">
              <button
                v-for="(s, i) in tier" :key="s.id"
                class="book flex flex-col items-center gap-1.5 border-none bg-transparent p-0 font-inherit text-inherit cursor-pointer" @click="selectSession(s.id)"
              >
                <div class="book-cover relative flex w-full flex-col justify-end overflow-hidden rounded-[2px_6px_6px_2px] p-[10px_9px_9px]" :class="'c' + ((ti * 4 + i) % 9)" style="aspect-ratio:2/3">
                  <div class="cover-frame"></div>
                  <div class="relative z-[1]">
                    <div class="font-serif text-[13px] font-extrabold leading-tight text-left [text-shadow:0_1px_4px_rgba(0,0,0,.6)]">{{ s.title }}</div>
                    <div class="my-1 h-[1.5px] w-[22px] bg-current opacity-35"></div>
                    <div class="text-[9px] opacity-55 tracking-wider">{{ s.chapterCount || 0 }} 章</div>
                  </div>
                </div>
                <div class="w-full truncate text-center text-[10px] font-semibold text-[#6a5838]">{{ s.title }}</div>
              </button>
              <button v-if="ti === shelfTiers.length - 1" class="book book-add flex flex-col items-center gap-1.5 border-none bg-transparent p-0 font-inherit cursor-pointer" @click="view = 'create'">
                <div class="book-cover flex w-full items-center justify-center overflow-hidden rounded-[2px_6px_6px_2px] p-0" style="aspect-ratio:2/3">
                  <span class="text-[28px] text-black/15">+</span>
                </div>
                <div class="w-full truncate text-center text-[10px] font-semibold text-[#5a4828]">新建</div>
              </button>
            </div>
            <div class="plank wood-plank relative z-[3] h-[22px]"></div>
            <div class="plank-shadow relative z-[1] h-[18px]"></div>
          </div>
        </template>
      </div>
    </template>

    <!-- ========== 详情页 ========== -->
    <template v-if="view === 'detail' && activeSession">
      <div class="beam shrink-0 relative z-20 flex h-[50px] items-center justify-between px-5">
        <button class="beam-back flex items-center gap-1 rounded-md border border-black/20 px-3 py-1 pl-2 text-xs font-semibold text-[#fff8ee] cursor-pointer font-inherit [text-shadow:0_1px_2px_rgba(0,0,0,.4)]" @click="backToList">
          <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          阅读器
        </button>
        <span class="beam-title absolute left-1/2 -translate-x-1/2 max-w-[50%] truncate font-serif text-sm font-extrabold text-[#fff8ee] [text-shadow:0_1px_3px_rgba(0,0,0,.3)]">{{ activeSession.title }}</span>
        <button @click="resetReader" :disabled="loading" class="beam-back rounded-md border border-black/20 px-2.5 py-1 text-[11px] font-semibold text-[#fff8ee] cursor-pointer font-inherit [text-shadow:0_1px_2px_rgba(0,0,0,.4)] disabled:opacity-40 disabled:cursor-default">重置</button>
      </div>
      <div ref="timelineRef" class="wood-dark flex-1 overflow-y-auto px-5 py-6 pb-10">
        <div class="mx-auto max-w-[640px]">
          <div v-if="!chapters.length" class="rounded-xl border border-dashed border-black/10 py-12 text-center text-[13px] text-[#9a8060]">
            还没有章节，点击下方「开始阅读」即可生成第一章
          </div>
          <div v-for="ch in chapters" :key="ch.id">
            <div v-if="ch.action && !isStartReaderAction(ch.action)" class="mb-2 flex items-center gap-2">
              <span class="chapter-action-line flex-1 h-px"></span>
              <span class="whitespace-nowrap rounded-full border border-black/[.06] bg-white/30 px-2.5 py-0.5 text-[10px] text-[#8a7050]">{{ ch.action }}</span>
              <span class="chapter-action-line flex-1 h-px"></span>
            </div>
            <div class="chapter-body mb-3 rounded-[10px] border border-black/[.04] bg-white/50 px-4 py-3.5 hover:bg-white/[.65]">
              <div class="mb-1.5 flex items-center justify-between">
                <span class="text-[10px] font-bold tracking-wider text-[#b08040]">第 {{ ch.idx }} 章</span>
                <span class="text-[10px] text-[#a09070]">{{ ch.progress }}</span>
              </div>
              <p class="whitespace-pre-wrap text-[13px] leading-[1.9] text-[#4a3a28]">{{ ch.content }}</p>
            </div>
          </div>

          <div v-if="loading" class="flex items-center gap-2.5 py-4 text-xs text-[#9a8060]">
            <div class="loading-spinner h-4 w-4 rounded-full border-2 border-black/[.08] border-t-[#b08040]"></div>
            Agent 正在推进剧情...
          </div>

          <div v-if="!loading" class="action-panel mt-5 flex flex-col gap-3 rounded-xl px-4 py-4 pb-5">
            <div class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#9a7848]">
              <span class="action-divider h-px flex-1"></span>
              {{ chapters.length ? '接下来...' : '开始旅程' }}
              <span class="action-divider h-px flex-1"></span>
            </div>
            <div v-if="error" class="rounded-lg border border-[rgba(200,60,40,.12)] bg-[rgba(200,60,40,.08)] px-3 py-1.5 text-[11px] text-[#e07050]">{{ error }}</div>
            <div v-if="currentChoices.length" class="grid grid-cols-3 gap-2">
              <button
                v-for="(c, i) in currentChoices" :key="`${i}-${c}`"
                @click="runGenerate(c)" :disabled="loading"
                class="choice-btn relative rounded-lg border border-[rgba(120,80,30,.15)] px-2 py-2.5 text-left font-inherit text-[11px] leading-snug text-[#4a3820] cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >{{ c }}</button>
            </div>
            <div class="flex gap-2">
              <input
                v-model="customAction"
                :placeholder="chapters.length ? '自定义行动...' : '描述开场，或直接开始...'"
                @keyup.enter="chapters.length ? runCustom() : runGenerate(START_ACTION)"
                class="action-input flex-1 rounded-lg border border-[rgba(120,80,30,.15)] px-3.5 py-2.5 text-[13px] text-[#3a2a18] outline-none font-inherit placeholder:text-black/20"
              />
              <button
                @click="chapters.length ? runCustom() : runGenerate(START_ACTION)"
                :disabled="loading" class="action-go relative shrink-0 rounded-lg border border-black/20 px-5 py-2.5 text-[13px] font-bold text-[#fff8ee] cursor-pointer font-inherit [text-shadow:0_1px_2px_rgba(0,0,0,.3)] disabled:opacity-40 disabled:cursor-default"
              >{{ loading ? '生成中...' : (chapters.length ? '继续' : '开始阅读') }}</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== 创建页 ========== -->
    <template v-if="view === 'create'">
      <div class="beam shrink-0 relative z-20 flex h-[50px] items-center justify-between px-5">
        <button class="beam-back flex items-center gap-1 rounded-md border border-black/20 px-3 py-1 pl-2 text-xs font-semibold text-[#fff8ee] cursor-pointer font-inherit [text-shadow:0_1px_2px_rgba(0,0,0,.4)]" @click="view = 'list'">
          <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          阅读器
        </button>
        <span></span>
      </div>
      <div class="wood-dark flex flex-1 items-start justify-center overflow-y-auto px-5 py-8 pb-10">
        <div class="create-card flex w-full max-w-[460px] overflow-hidden rounded-[2px_10px_10px_2px]">
          <div class="create-spine w-[18px] shrink-0"></div>
          <div class="create-inner relative flex-1 px-7 py-7 pb-6">
            <div class="mb-5 font-serif text-[17px] font-extrabold text-[#3a2a18] [text-shadow:0_1px_0_rgba(255,240,200,.5)]">新建书籍</div>
            <div class="mb-4">
              <div class="mb-1.5 text-[11px] font-semibold tracking-wider text-[#8a6840]">书名</div>
              <input v-model="newTitle" class="create-input w-full rounded border border-[rgba(160,120,60,.15)] bg-white/50 px-3.5 py-2.5 text-[13px] text-[#3a2a18] outline-none font-inherit placeholder:text-black/20 focus:border-[rgba(160,120,60,.4)]" placeholder="给你的书起个名字" />
            </div>
            <div class="mb-4">
              <div class="mb-1.5 text-[11px] font-semibold tracking-wider text-[#8a6840]">世界观设定（可选）</div>
              <textarea v-model="newPremise" class="create-input w-full min-h-[80px] resize-y rounded border border-[rgba(160,120,60,.15)] bg-white/50 px-3.5 py-2.5 text-[13px] leading-relaxed text-[#3a2a18] outline-none font-inherit placeholder:text-black/20 focus:border-[rgba(160,120,60,.4)]" placeholder="描述故事的背景、时代、主角特征..."></textarea>
            </div>
            <button @click="createReader" :disabled="creating" class="create-submit relative mt-1 w-full rounded-md border border-black/20 py-3 text-sm font-bold text-[#fff8ee] cursor-pointer font-inherit [text-shadow:0_1px_2px_rgba(0,0,0,.3)] disabled:opacity-40 disabled:cursor-default">
              {{ creating ? '创建中...' : '开始创作' }}
            </button>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
const BOOKS_PER_SHELF = 4;
const API_BASE = '/apps/reader';

const view = ref('list');
const sessions = ref([]);
const activeSession = ref(null);
const chapters = ref([]);
const error = ref('');
const creating = ref(false);
const loading = ref(false);
const newTitle = ref('');
const newPremise = ref('');
const customAction = ref('');
const timelineRef = ref(null);
const START_ACTION = '开始阅读';

const shelfTiers = computed(() => {
  const tiers = [];
  for (let i = 0; i < sessions.value.length; i += BOOKS_PER_SHELF) {
    tiers.push(sessions.value.slice(i, i + BOOKS_PER_SHELF));
  }
  if (!tiers.length) tiers.push([]);
  return tiers;
});

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
  view.value = 'detail';
  await scrollToBottom();
};

const backToList = async () => {
  view.value = 'list';
  activeSession.value = null;
  await loadSessions();
};

const createReader = async () => {
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

const isStartReaderAction = (action) => action === START_ACTION || action === 'Start Reader';

const resetReader = async () => {
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
  } catch (e) {
    error.value = e.message || '重置失败';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await loadSessions();
  } catch (e) {
    error.value = e.message || '初始化失败';
  }
});
</script>

<style scoped>
/* ── 木纹纹理（多层 repeating-linear-gradient，Tailwind 无法实现） ── */
.wood-dark {
  background-color: #d8c8ae;
  background-image:
    repeating-linear-gradient(92deg, transparent 0px, transparent 18px, rgba(160,120,60,.06) 18px, rgba(160,120,60,.06) 20px, transparent 20px, transparent 46px, rgba(120,80,30,.04) 46px, rgba(120,80,30,.04) 48px),
    repeating-linear-gradient(88deg, transparent 0px, transparent 5px, rgba(160,120,60,.04) 5px, rgba(160,120,60,.04) 6px, transparent 6px, transparent 12px),
    repeating-linear-gradient(180deg, rgba(160,120,60,.02) 0px, rgba(160,120,60,.02) 1px, transparent 1px, transparent 40px);
}
.wood-plank {
  background-color: #b89868;
  background-image:
    linear-gradient(180deg, rgba(255,240,200,.2) 0%, transparent 25%, rgba(0,0,0,.08) 80%, rgba(255,220,160,.1) 100%),
    repeating-linear-gradient(90deg, transparent 0px, transparent 32px, rgba(0,0,0,.05) 32px, rgba(0,0,0,.05) 33px, transparent 33px, transparent 68px);
}

/* ── 顶梁（多层渐变+多层阴影+伪元素） ── */
.beam {
  background-color: #b89060;
  background-image:
    linear-gradient(180deg, rgba(255,240,200,.18) 0%, transparent 40%, rgba(0,0,0,.1) 100%),
    repeating-linear-gradient(90deg, transparent 0px, transparent 24px, rgba(0,0,0,.05) 24px, rgba(0,0,0,.05) 26px, transparent 26px, transparent 58px),
    repeating-linear-gradient(90deg, transparent 0px, transparent 7px, rgba(0,0,0,.03) 7px, rgba(0,0,0,.03) 8px);
  box-shadow: 0 3px 0 #8a6438, 0 4px 0 #a07848, 0 6px 16px rgba(0,0,0,.12);
}
.beam::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 3px;
  background: linear-gradient(180deg, rgba(255,240,200,.1), transparent);
}

/* ── 顶梁按钮（3D 凸起） ── */
.beam-back {
  background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(0,0,0,.08));
  box-shadow: 0 2px 0 rgba(0,0,0,.25), inset 0 1px 0 rgba(255,240,200,.12);
  position: relative;
  top: 0;
  transition: all .1s;
}
.beam-back:hover { background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.04)); }
.beam-back:active { top: 2px; box-shadow: 0 0 0 rgba(0,0,0,.25), inset 0 1px 3px rgba(0,0,0,.2); }

/* ── 书架木板（多层阴影） ── */
.plank {
  box-shadow: 0 3px 0 #8a6030, 0 4px 0 #a07840, 0 6px 14px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,240,200,.15);
}
.plank-shadow {
  background: radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,0,0,.08) 0%, transparent 70%);
}

/* ── 书本封面（多层阴影+伪元素+hover 动画） ── */
.book-cover {
  box-shadow: -2px 1px 0 rgba(0,0,0,.15), -4px 2px 0 rgba(0,0,0,.06), 2px 4px 12px rgba(0,0,0,.12);
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease;
}
.book:hover .book-cover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: -2px 1px 0 rgba(0,0,0,.15), -5px 3px 0 rgba(0,0,0,.06), 4px 14px 20px rgba(0,0,0,.16);
}
.book-cover::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 7px;
  background: linear-gradient(90deg, rgba(0,0,0,.2), rgba(0,0,0,.06) 50%, rgba(255,255,255,.08));
  border-radius: 2px 0 0 2px;
}
.book-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,.14) 0%, transparent 45%, rgba(0,0,0,.1) 100%);
  pointer-events: none;
  border-radius: 2px 6px 6px 2px;
}

/* 封面线框装饰 */
.cover-frame {
  position: absolute;
  inset: 8px 7px 8px 12px;
  border: 1px solid rgba(255,220,160,.15);
  border-radius: 2px;
  pointer-events: none;
}
.cover-frame::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid rgba(255,220,160,.08);
  border-radius: 1px;
}

/* 新建按钮覆盖 */
.book-add .book-cover {
  background: rgba(0,0,0,.02) !important;
  border: 2px dashed rgba(0,0,0,.1);
  box-shadow: none;
}
.book-add .book-cover::before,
.book-add .book-cover::after,
.book-add .cover-frame { display: none; }
.book-add:hover .book-cover {
  border-color: rgba(0,0,0,.2);
  background: rgba(0,0,0,.04) !important;
  transform: none;
  box-shadow: none;
}

/* 封面配色（多色渐变） */
.c0 { background: linear-gradient(160deg, #d4564c, #e87870 50%, #c84840); color: #fff8f4; }
.c1 { background: linear-gradient(160deg, #4878b8, #6098d8 50%, #4070b0); color: #f0f6ff; }
.c2 { background: linear-gradient(160deg, #48906a, #60b088 50%, #408060); color: #f0fff6; }
.c3 { background: linear-gradient(160deg, #b88840, #d0a858 50%, #a87830); color: #fffaf0; }
.c4 { background: linear-gradient(160deg, #8060b8, #9878d0 50%, #7050a8); color: #f6f0ff; }
.c5 { background: linear-gradient(160deg, #d87848, #e89868 50%, #c86838); color: #fff6f0; }
.c6 { background: linear-gradient(160deg, #5080a0, #6898b8 50%, #487898); color: #f0f8ff; }
.c7 { background: linear-gradient(160deg, #408888, #58a8a8 50%, #387878); color: #f0ffff; }
.c8 { background: linear-gradient(160deg, #c86088, #d878a0 50%, #b85078); color: #fff0f6; }

/* ── 章节分隔线（渐变） ── */
.chapter-action-line {
  background: linear-gradient(90deg, transparent, rgba(0,0,0,.08), transparent);
}

/* ── loading 动画 ── */
.loading-spinner { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── 操作面板（羊皮纸质感） ── */
.action-panel {
  background-color: #ece0c8;
  background-image:
    radial-gradient(ellipse at 30% 20%, rgba(255,240,200,.4), transparent 60%),
    radial-gradient(ellipse at 80% 80%, rgba(180,140,80,.06), transparent 50%);
  border: 1px solid rgba(160,120,60,.12);
  box-shadow:
    inset 0 1px 0 rgba(255,250,230,.5),
    inset 0 -1px 3px rgba(0,0,0,.04),
    0 2px 8px rgba(0,0,0,.06);
}
.action-divider {
  background: linear-gradient(90deg, transparent, rgba(160,120,60,.2), transparent);
}

/* 选项按钮（木质标签） */
.choice-btn {
  background: linear-gradient(180deg, rgba(255,250,235,.7), rgba(240,225,195,.6));
  box-shadow:
    0 2px 0 rgba(120,80,30,.1),
    inset 0 1px 0 rgba(255,255,255,.5);
  transition: all .12s;
  top: 0;
}
.choice-btn:hover {
  background: linear-gradient(180deg, rgba(255,252,240,.85), rgba(245,230,200,.75));
  border-color: rgba(120,80,30,.25);
  box-shadow: 0 2px 0 rgba(120,80,30,.15), inset 0 1px 0 rgba(255,255,255,.6);
}
.choice-btn:active {
  top: 2px;
  box-shadow: 0 0 0 rgba(120,80,30,.1), inset 0 1px 3px rgba(0,0,0,.08);
}

/* 输入框 */
.action-input {
  background: rgba(255,252,240,.7);
  box-shadow: inset 0 1px 3px rgba(0,0,0,.05);
  transition: border-color .15s, box-shadow .15s;
}
.action-input:focus {
  border-color: rgba(160,120,60,.35);
  box-shadow: inset 0 1px 3px rgba(0,0,0,.06), 0 0 0 2px rgba(160,120,60,.08);
}

/* 行动按钮（3D 木质） */
.action-go {
  background: linear-gradient(180deg, #c09048, #9a6c28);
  box-shadow: 0 3px 0 rgba(100,60,10,.35), inset 0 1px 0 rgba(255,240,200,.2);
  top: 0;
  transition: all .1s;
}
.action-go:hover { background: linear-gradient(180deg, #d0a058, #aa7c38); }
.action-go:active { top: 3px; box-shadow: 0 0 0 rgba(100,60,10,.35), inset 0 2px 4px rgba(0,0,0,.2); }
.action-go:disabled { top: 0; }

/* ── 创建卡片（书本造型，多层阴影） ── */
.create-card {
  box-shadow:
    -3px 1px 0 rgba(0,0,0,.12),
    -6px 2px 0 rgba(0,0,0,.06),
    4px 8px 24px rgba(0,0,0,.18),
    inset 0 0 0 1px rgba(0,0,0,.06);
}
.create-spine {
  background: linear-gradient(90deg, #6a4a28, #8a6840 40%, #7a5830 60%, #5a3a18);
  box-shadow: inset -2px 0 4px rgba(0,0,0,.2), inset 2px 0 3px rgba(255,220,160,.1);
}
.create-inner {
  background-color: #f5ead6;
  background-image:
    repeating-linear-gradient(180deg, transparent 0, transparent 29px, rgba(160,120,60,.06) 29px, rgba(160,120,60,.06) 30px);
  box-shadow: inset 3px 0 8px rgba(0,0,0,.06);
}
.create-inner::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: 0; width: 40px;
  background: linear-gradient(90deg, rgba(0,0,0,.04), transparent);
  pointer-events: none;
}
.create-input {
  box-shadow: inset 0 1px 3px rgba(0,0,0,.04);
}
.create-input:focus {
  box-shadow: inset 0 1px 3px rgba(0,0,0,.06), 0 0 0 2px rgba(160,120,60,.1);
}
.create-submit {
  background: linear-gradient(180deg, #c09048, #9a6c28);
  box-shadow: 0 3px 0 rgba(100,60,10,.4), inset 0 1px 0 rgba(255,240,200,.2);
  top: 0;
  transition: all .1s;
}
.create-submit:hover { background: linear-gradient(180deg, #d0a058, #aa7c38); }
.create-submit:active { top: 3px; box-shadow: 0 0 0 rgba(100,60,10,.4), inset 0 2px 4px rgba(0,0,0,.2); }

/* 滚动条 */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,.08); border-radius: 3px; }
</style>
