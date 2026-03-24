<template>
  <div class="flex h-full flex-col bg-[#e8ddd0] font-['PingFang_SC',-apple-system,serif] text-[#3a2e20]">
    <ReaderListView
      :view="view"
      :sessions="sessions"
      :shelf-tiers="shelfTiers"
      @select-session="selectSession"
      @open-create="view = 'create'"
    />
    <ReaderDetailView
      :view="view"
      :active-session="activeSession"
      :chapters="chapters"
      :error="error"
      :loading="loading"
      :current-choices="currentChoices"
      v-model:customAction="customAction"
      :start-action="startAction"
      :is-start-reader-action="isStartReaderAction"
      @back="backToList"
      @reset="resetReader"
      @generate="runGenerate"
      @run-custom="runCustom"
    />
    <ReaderCreateView
      :view="view"
      v-model:newTitle="newTitle"
      v-model:newPremise="newPremise"
      :creating="creating"
      @back="view = 'list'"
      @create="createReader"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '../../i18n/index.ts';
import { chatPanel } from '../../stores/chatPanel.ts';
import ReaderCreateView from './ReaderCreateView.vue';
import ReaderDetailView from './ReaderDetailView.vue';
import ReaderListView from './ReaderListView.vue';

const { t, locale } = useI18n();
const props = defineProps({
  initialView: {
    type: String,
    default: 'list'
  }
});
const BOOKS_PER_SHELF = 4;
const API_BASE = '/aios/apps/reader';

const validViews = new Set(['list', 'detail', 'create']);
const view = ref(validViews.has(props.initialView) ? props.initialView : 'list');
const sessions = ref([]);
const activeSession = ref(null);
const chapters = ref([]);
const error = ref('');
const creating = ref(false);
const loading = ref(false);
const newTitle = ref('');
const newPremise = ref('');
const customAction = ref('');
const startAction = computed(() => t('reader_start_reader'));
const readerLocale = computed(() => (locale.value === 'en' ? 'en' : 'zh'));

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

const buildReaderPrompt = ({ lang, session, action, recentChapters }) => {
  if (lang === 'en') {
    return [
      'You are writing the next chapter of an interactive novel.',
      'Return JSON only and strictly follow the schema.',
      `Book title: ${session.title}`,
      `World setting: ${session.premise || '(none)'}`,
      `Current summary: ${session.summary || '(none)'}`,
      `Current progress: ${session.progress || '(none)'}`,
      `User action: ${action}`,
      'Recent chapters context (latest up to 6):',
      JSON.stringify(recentChapters),
      'Requirements:',
      '- content: 120-260 words',
      '- choices: array of exactly 3 short strings, each a distinct action that branches the plot',
      '- summary: updated running summary, 80-140 words',
      '- progress: chapter progress text, e.g. "Chapter N: Subtitle"'
    ].join('\n');
  }
  return [
    '你在续写互动小说下一章。',
    '只输出 JSON，严格按 schema。',
    `书名：${session.title}`,
    `世界观设定：${session.premise || '无'}`,
    `当前梗概：${session.summary || '无'}`,
    `当前进度：${session.progress || '无'}`,
    `用户行动：${action}`,
    '最近章节上下文（最多 6 章）：',
    JSON.stringify(recentChapters),
    '要求：',
    '- content：120-260字',
    '- choices：字符串数组，恰好 3 个简短的行动选项，方向不同',
    '- summary：更新后的累计梗概，80-140字',
    '- progress：章节进度文本，如“第N章：副标题”'
  ].join('\n');
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
    error.value = e.message || t('reader_create_failed');
  } finally {
    creating.value = false;
  }
};

const runGenerate = async (action) => {
  if (!activeSession.value || loading.value) return;
  error.value = '';
  loading.value = true;
  try {
    const lang = readerLocale.value;
    const actionText = String(action || '').trim() || (lang === 'en' ? 'Start Reader' : '开始阅读');
    const recentChapters = chapters.value.slice(-6).map((c) => ({
      idx: c.idx,
      action: c.action,
      content: c.content
    }));
    const prompt = buildReaderPrompt({
      lang,
      session: activeSession.value,
      action: actionText,
      recentChapters
    });

    await request(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: activeSession.value.id,
        locale: lang,
        taskTitle: lang === 'en' ? `Story Progress #${activeSession.value.id}` : `故事推进 #${activeSession.value.id}`,
        action: actionText,
        prompt
      })
    });
    await selectSession(activeSession.value.id);
  } catch (e) {
    error.value = e.message || t('reader_generate_failed');
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

const isStartReaderAction = (action) => action === startAction.value || action === 'Start Reader';

const resetReader = async () => {
  if (!activeSession.value || loading.value) return;
  if (!confirm(t('reader_reset_confirm', { title: activeSession.value.title }))) return;
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
    error.value = e.message || t('reader_reset_failed');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  chatPanel.setContext({ scene: 'reader', label: t('app_sidebar_reader') });
  chatPanel.setQuickMessages([t('reader_chat_quick_1'), t('reader_chat_quick_2'), t('reader_chat_quick_3')]);
  try {
    await loadSessions();
    if (view.value === 'detail') {
      // detail 视图需要上下文 session，直接进入时回退到列表
      view.value = 'list';
    }
  } catch (e) {
    error.value = e.message || t('reader_init_failed');
  }
});
onUnmounted(() => { chatPanel.clearContext(); chatPanel.setQuickMessages([]); });
</script>

<style>
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
/* 滚动条 */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,.08); border-radius: 3px; }
</style>
