<template>
  <div class="flex h-full w-full flex-col items-center overflow-hidden p-4 font-['PingFang_SC','Georgia',serif]"
       style="background-color:#2a1f10; background-image:linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px); background-size:20px 20px;">
    <div class="radio-cabinet">
      <SubscriberControlPanel
        :refreshing="refreshing"
        :schedule-time-str="scheduleTimeStr"
        :schedule-percent="schedulePercent"
        :now-percent="nowPercent"
        :show-settings="showSettings"
        v-model:focus="focus"
        v-model:scheduleTime="scheduleTime"
        :error="error"
        @toggle-settings="showSettings = !showSettings"
        @save-focus="saveFocus"
        @refresh="refreshToday"
      />
      <SubscriberArticlePanel
        :today="today"
        :items="items"
        :visible-history="visibleHistory"
        :selected-id="selectedId"
        :page="page"
        :total-pages="totalPages"
        :format-time="formatTime"
        @select-article="selectArticle"
        @change-page="changePage"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '../../../i18n/index.js';
import SubscriberArticlePanel from '../../../components/apps/subscriber/SubscriberArticlePanel.vue';
import SubscriberControlPanel from '../../../components/apps/subscriber/SubscriberControlPanel.vue';

const { locale, t } = useI18n();
const API_BASE = '/apps/subscriber';

// 状态
const focus = ref('');
const refreshing = ref(false);
const error = ref('');
const showSettings = ref(false);
const selectedId = ref(null);
const scheduleTime = ref('08:00');

// 数据
const today = ref(null);
const items = ref([]);
const page = ref(1);
const pageSize = 10;
const totalPages = ref(1);

// 时间针
const nowPercent = ref(0);
const schedulePercent = computed(() => {
  const [h, m] = scheduleTime.value.split(':').map(Number);
  return ((h * 60 + m) / 1440) * 100;
});
const scheduleTimeStr = computed(() => {
  const [h, m] = scheduleTime.value.split(':').map(Number);
  const now = new Date();
  const sched = new Date(now);
  sched.setHours(h, m, 0, 0);
  if (sched <= now) sched.setDate(sched.getDate() + 1);
  const isToday = sched.getDate() === now.getDate();
  const str = scheduleTime.value;
  return isToday ? str : t('subscriber_tomorrow_prefix') + str;
});

// 历史列表（排除 today）
const visibleHistory = computed(() => {
  if (!today.value) return items.value;
  return items.value.filter(i => i.id !== today.value.id);
});

// 更新当前时间针
let dialTimer = null;
function updateNow() {
  const now = new Date();
  nowPercent.value = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;
}

// API
const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const loadToday = async () => {
  const data = await request(`${API_BASE}/today`);
  focus.value = data.profile?.focus || '';
  today.value = data.today || null;
};

const loadHistory = async () => {
  const data = await request(`${API_BASE}/history?page=${page.value}&pageSize=${pageSize}`);
  items.value = data.items || [];
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
  } catch (e) {
    error.value = e.message || t('subscriber_save_failed');
  }
};

const buildSubscriberPrompt = ({ lang, date, focusText, currentNote }) => {
  if (lang === 'en') {
    return [
      'Generate today\'s subscriber briefing.',
      'You may browse and read web sources before summarizing.',
      'Return JSON only: {"title":"...","brief":"...","content":"...","note":"..."}',
      'content should be multi-paragraph and include key bullet points.',
      `Date: ${date}`,
      `Focus: ${focusText}`,
      `Current note: ${currentNote || ''}`
    ].join('\n');
  }
  return [
    '你在处理 subscriber（订阅机）的今日新闻简报生成请求。',
    '你可以自行使用 shell 搜索和阅读网页，再整理结果。',
    '最终只输出 JSON，不要输出任何其它文字。',
    'JSON 格式必须是：{"title":"...","brief":"...","content":"...","note":"..."}。',
    '其中 content 建议使用多段文本，包含要点列表。',
    `日期：${date}`,
    `用户关注方向：${focusText}`,
    `当前 note：${currentNote || ''}`
  ].join('\n');
};

const refreshToday = async () => {
  error.value = '';
  refreshing.value = true;
  showSettings.value = false;
  try {
    if (!focus.value.trim()) throw new Error(t('subscriber_fill_focus_error'));
    await saveFocus();
    const lang = locale.value === 'en' ? 'en' : 'zh';
    const date = new Date().toISOString().slice(0, 10);
    const prompt = buildSubscriberPrompt({
      lang,
      date,
      focusText: focus.value.trim(),
      currentNote: today.value?.note || ''
    });
    const data = await request(`${API_BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        focus: focus.value,
        taskTitle: lang === 'en' ? `Subscriber Briefing ${date}` : `订阅收报 ${date}`,
        prompt
      })
    });
    today.value = data.today || null;
    selectedId.value = null;
    page.value = 1;
    await loadHistory();
    // 滚动到顶部
  } catch (e) {
    error.value = e.message || t('subscriber_generate_failed');
  } finally {
    refreshing.value = false;
  }
};

const changePage = async (nextPage) => {
  if (nextPage < 1 || nextPage > totalPages.value) return;
  page.value = nextPage;
  await loadHistory();
};

const selectArticle = (item) => {
  if (selectedId.value === item.id) {
    selectedId.value = null;
  } else {
    selectedId.value = item.id;
    today.value = item;
  }
};

const formatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(locale.value === 'en' ? 'en-US' : 'zh-CN', { hour12: false });
};

onMounted(async () => {
  updateNow();
  dialTimer = setInterval(updateNow, 10000);
  try {
    await loadToday();
    await loadHistory();
  } catch (e) {
    error.value = e.message || t('subscriber_init_failed');
  }
});

onUnmounted(() => {
  if (dialTimer) clearInterval(dialTimer);
});
</script>

<style>
/* ===== 全高木质机壳 ===== */
.radio-cabinet {
  width: 100%; max-width: 680px;
  flex: 1; display: flex; flex-direction: column;
  background: linear-gradient(160deg, #7a5a30 0%, #5a3a18 40%, #6a4a20 100%);
  border-radius: 16px;
  box-shadow:
    inset 0 -4px 8px rgba(0,0,0,0.4),
    0 15px 40px rgba(0,0,0,0.8),
    0 4px 12px rgba(0,0,0,0.5);
  border: 1px solid #3a2510;
  padding: 16px 20px 20px;
  overflow: hidden;
}

/* ===== 调频显示条 ===== */
.dial-strip {
  flex-shrink: 0;
  background: #1a0e04;
  border-radius: 6px;
  border: 2px solid #0a0804;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.8);
  font-family: 'Courier New', monospace;
  display: flex; align-items: center;
  padding: 8px 16px; gap: 12px;
}

/* 调频刻度 */
.dial-scale {
  flex: 1; height: 16px;
  position: relative; border-radius: 3px; overflow: hidden;
  background: linear-gradient(180deg, #0d0804, #1a0e04);
  border: 1px solid #0a0804;
}
.dial-scale-inner {
  position: absolute; inset: 2px;
  background: repeating-linear-gradient(90deg, rgba(232,192,96,0.15) 0px, rgba(232,192,96,0.15) 1px, transparent 1px, transparent 8px);
  animation: dialDrift 8s linear infinite;
}
.dial-scale-inner::after {
  content: ''; position: absolute; inset: 0;
  background: repeating-linear-gradient(90deg, rgba(232,192,96,0.4) 0px, rgba(232,192,96,0.4) 1px, transparent 1px, transparent 40px);
  animation: dialDrift 20s linear infinite;
}
@keyframes dialDrift {
  from { background-position: 0 0; }
  to   { background-position: -80px 0; }
}

/* 订阅时间针（红色） */
.needle-schedule {
  position: absolute; top: 0; bottom: 0; width: 2px;
  background: #e84030;
  box-shadow: 0 0 6px rgba(232,64,48,0.6);
  z-index: 3; transition: left 0.5s ease;
}
.needle-schedule::after {
  content: ''; position: absolute; top: -1px; left: -3px;
  width: 0; height: 0;
  border-left: 4px solid transparent; border-right: 4px solid transparent;
  border-top: 5px solid #e84030;
}

/* 当前时间针（琥珀色） */
.needle-now {
  position: absolute; top: 0; bottom: 0; width: 2px;
  background: #e8c060;
  box-shadow: 0 0 8px rgba(232,192,96,0.6);
  z-index: 2; transition: left 1s linear;
}
.needle-now::after {
  content: ''; position: absolute; bottom: -1px; left: -3px;
  width: 0; height: 0;
  border-left: 4px solid transparent; border-right: 4px solid transparent;
  border-bottom: 5px solid #e8c060;
}

/* 接收中闪烁 */
.status-receiving .na-value {
  animation: receivePulse 1s ease-in-out infinite;
  color: #e84030 !important;
}
@keyframes receivePulse {
  0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(232,64,48,0.8); }
  50%      { opacity: 0.4; text-shadow: 0 0 4px rgba(232,64,48,0.3); }
}

/* ===== 展开面板 ===== */
.expand-panel {
  flex-shrink: 0;
  max-height: 0; opacity: 0; overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.expand-panel.is-open { max-height: 500px; opacity: 1; }

/* 控制面板 */
.control-panel {
  background: linear-gradient(180deg, #4a3218 0%, #3a2510 100%);
  border-radius: 8px;
  border: 2px solid #2a1a08;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.3);
  padding: 16px;
}

/* 栅格输入区域 */
.speaker-grille-input {
  background-color: #3a2510;
  background-image: repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 5px);
  border-radius: 6px;
  border: 2px solid #2a1a08;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.08);
  padding: 2px;
}
.grille-textarea {
  width: 100%; display: block;
  background: transparent; border: none;
  font-family: 'Courier New', monospace;
  font-size: 13px; font-weight: 700;
  color: #e8c060;
  text-shadow: 0 0 8px rgba(232,192,96,0.4);
  padding: 8px 12px; outline: none; resize: none;
  line-height: 1.6; letter-spacing: 0.5px;
}
.grille-textarea::placeholder { color: #604830; text-shadow: none; }

/* ===== 扬声器格栅（阅读区） ===== */
.speaker-grille {
  flex: 1; min-height: 0; margin-top: 14px;
  background-color: #3a2510;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 4px),
    repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 4px);
  border-radius: 8px;
  border: 2px solid #2a1a08;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.08);
  overflow-y: auto; scrollbar-width: none;
  padding: 24px 32px 40px; position: relative;
}
.speaker-grille::-webkit-scrollbar { display: none; }

/* 格栅顶部阴影 */
.grille-shadow {
  position: sticky; top: -24px; left: -32px; right: -32px;
  height: 20px; margin: -24px -32px 20px;
  background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%);
  z-index: 10; pointer-events: none;
}

</style>
