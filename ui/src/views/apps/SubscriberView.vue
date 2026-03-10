<template>
  <div class="flex h-full w-full flex-col items-center overflow-hidden p-4 font-['PingFang_SC','Georgia',serif]"
       style="background-color:#2a1f10; background-image:linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px); background-size:20px 20px;">

    <!-- 全高胡桃木收音机 -->
    <div class="radio-cabinet">

      <!-- 应用标题 -->
      <div class="mb-3 flex shrink-0 items-center justify-center gap-3">
        <div class="text-[10px] font-black uppercase tracking-[0.3em] text-[#a08040]" style="text-shadow:0 1px 0 rgba(0,0,0,0.3);">{{ t('subscriber_title') }}</div>
        <div class="h-1 w-1 rounded-full bg-[#806040] opacity-50"></div>
        <div class="text-[10px] tracking-widest text-[#806040]">{{ t('subscriber_subtitle') }}</div>
      </div>

      <!-- 调频显示条 -->
      <div class="dial-strip">
        <!-- 左侧：状态显示 -->
        <div class="shrink-0 text-center" :class="{ 'status-receiving': refreshing }">
          <div class="na-label text-[8px] tracking-widest leading-none text-[#806040]">
            {{ refreshing ? 'ON AIR' : 'NEXT ON AIR' }}
          </div>
          <div class="na-value mt-0.5 text-[14px] font-black text-[#e8c060]" style="text-shadow:0 0 10px rgba(232,192,96,0.5);">
            {{ refreshing ? t('subscriber_refreshing') : scheduleTimeStr }}
          </div>
        </div>
        <!-- 中间：刻度（双针） -->
        <div class="dial-scale">
          <div class="dial-scale-inner"></div>
          <div class="needle-schedule" :style="{ left: schedulePercent + '%' }"></div>
          <div class="needle-now" :style="{ left: nowPercent + '%' }"></div>
        </div>
        <!-- 右侧：设置按钮 -->
        <button class="settings-btn" :class="{ 'is-open': showSettings }" @click="showSettings = !showSettings" :title="t('subscriber_focus_label')">
          <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>

      <!-- 展开面板 -->
      <div class="expand-panel" :class="{ 'is-open': showSettings }">
        <div class="control-panel mt-3">
          <!-- 订阅主题 -->
          <div class="mb-3">
            <div class="mb-1.5 text-[9px] font-black tracking-widest text-[#8a7a50]">{{ t('subscriber_focus_label') }}</div>
            <div class="speaker-grille-input">
              <textarea v-model="focus" rows="2" class="grille-textarea" :placeholder="t('subscriber_focus_placeholder')"></textarea>
            </div>
          </div>
          <!-- 播出时间 -->
          <div class="mb-4">
            <div class="mb-1.5 text-[9px] font-black tracking-widest text-[#8a7a50]">{{ t('subscriber_schedule_label') }}</div>
            <input type="time" v-model="scheduleTime" class="studio-input w-full px-3 py-2" />
          </div>
          <!-- 两个按钮 -->
          <div class="flex gap-3">
            <button class="save-btn flex-1 py-[9px]" @click="saveFocus">{{ t('subscriber_save_button') }}</button>
            <button class="broadcast-btn flex-1 py-[9px] text-[12px]" :disabled="refreshing" @click="refreshToday">{{ t('subscriber_refresh_button') }}</button>
          </div>
          <!-- 错误提示 -->
          <div v-if="error" class="mt-3 rounded border border-[#701808] bg-[#2a1008] px-3 py-2 text-[11px] text-[#e88060]">{{ error }}</div>
        </div>
      </div>

      <!-- 扬声器格栅（内容阅读区） -->
      <div class="speaker-grille" ref="grilleRef">
        <div class="grille-shadow"></div>

        <!-- 无内容提示 -->
        <div v-if="!today && !items.length" class="flex flex-1 items-center justify-center py-20">
          <p class="text-center text-[13px] text-[#604830]">{{ t('subscriber_fill_focus_hint') }}</p>
        </div>

        <!-- 当日文章 -->
        <div v-if="today" class="article-section" :class="{ 'cursor-pointer': selectedId && selectedId !== today.id }" @click="selectArticle(today)">
          <div class="timestamp">
            <span class="text-[#e84030]">>>> {{ today.date }} //</span> {{ formatTime(today.updatedAt || today.createdAt) }}
          </div>
          <h2 class="article-title">{{ today.title }}</h2>
          <div v-if="today.brief" class="article-synopsis">
            <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#e84030]">AI SYNOPSIS</span>
            {{ today.brief }}
          </div>
          <div v-if="selectedId === today.id || !selectedId" class="article-content whitespace-pre-wrap text-[15px] leading-[1.8] text-[#9a8a68]" style="text-align:justify;">{{ today.content }}</div>
        </div>

        <!-- 历史文章 -->
        <div v-for="item in visibleHistory" :key="item.id"
             class="article-section historical cursor-pointer"
             :class="{ '!opacity-100': selectedId === item.id }"
             @click="selectArticle(item)">
          <div class="timestamp">>>> {{ item.date }} // {{ formatTime(item.updatedAt || item.createdAt) }}</div>
          <h2 class="article-title">{{ item.title }}</h2>
          <div v-if="item.brief" class="article-synopsis">
            <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#806040]">AI SYNOPSIS</span>
            {{ item.brief }}
          </div>
          <div v-if="selectedId === item.id" class="article-content whitespace-pre-wrap text-[15px] leading-[1.8] text-[#9a8a68]" style="text-align:justify;">{{ item.content }}</div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-6 pb-4">
          <button class="text-[12px] font-bold text-[#806040] disabled:opacity-30" :disabled="page <= 1" @click="changePage(page - 1)">{{ t('subscriber_prev_page') }}</button>
          <span class="text-[10px] text-[#604830]">{{ page }} / {{ totalPages }}</span>
          <button class="text-[12px] font-bold text-[#806040] disabled:opacity-30" :disabled="page >= totalPages" @click="changePage(page + 1)">{{ t('subscriber_next_page') }}</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '../../i18n/index.js';

const { locale, t } = useI18n();
const API_BASE = '/apps/subscriber';

// 状态
const focus = ref('');
const focusUpdatedAt = ref('');
const refreshing = ref(false);
const error = ref('');
const showSettings = ref(false);
const selectedId = ref(null);
const scheduleTime = ref('08:00');
const grilleRef = ref(null);

// 数据
const today = ref(null);
const items = ref([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
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
  return isToday ? str : (locale.value === 'en' ? 'TMR ' : '明天 ') + str;
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
    error.value = e.message || t('subscriber_save_failed');
  }
};

const refreshToday = async () => {
  error.value = '';
  refreshing.value = true;
  showSettings.value = false;
  try {
    if (!focus.value.trim()) throw new Error(t('subscriber_fill_focus_error'));
    await saveFocus();
    const data = await request(`${API_BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus: focus.value })
    });
    today.value = data.today || null;
    selectedId.value = null;
    page.value = 1;
    await loadHistory();
    // 滚动到顶部
    if (grilleRef.value) grilleRef.value.scrollTop = 0;
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

<style scoped>
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

/* 设置齿轮按钮 */
.settings-btn {
  background: none; border: none; cursor: pointer;
  color: #806040; transition: all 0.25s;
  padding: 4px; display: flex; align-items: center; flex-shrink: 0;
}
.settings-btn:hover { color: #e8c060; }
.settings-btn.is-open svg { transform: rotate(90deg); }
.settings-btn svg {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 3px rgba(232,192,96,0.3));
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

/* 深槽输入框 */
.studio-input {
  background: #1a0e04;
  border: 2px solid #0a0804; border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #e8c060; font-weight: bold; font-size: 13px;
  outline: none;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04);
  transition: all 0.2s;
  text-shadow: 0 0 6px rgba(232,192,96,0.3);
}
.studio-input::placeholder { color: #4a3418; text-shadow: none; }
.studio-input:focus { border-color: #3a2510; box-shadow: inset 0 2px 6px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,192,96,0.15); }

/* 保存按钮 */
.save-btn {
  background: linear-gradient(180deg, #6a4a28 0%, #4a3218 100%);
  border: 2px solid #3a2510; border-radius: 6px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 3px 0 #2a1a08, 0 4px 8px rgba(0,0,0,0.4);
  color: #d8c090; font-weight: 900; font-size: 12px;
  letter-spacing: 0.08em; cursor: pointer;
  transition: all 0.1s;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  white-space: nowrap;
}
.save-btn:active {
  transform: translateY(3px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 #2a1a08, 0 1px 3px rgba(0,0,0,0.3);
}

/* 红色广播按键 */
.broadcast-btn {
  background: linear-gradient(180deg, #d84020 0%, #a02808 100%);
  border: 2px solid #701808; border-radius: 6px;
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.15), 0 3px 0 #501008, 0 4px 8px rgba(0,0,0,0.4);
  color: #fde8d8; font-weight: 900;
  letter-spacing: 0.1em; cursor: pointer;
  transition: all 0.1s;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  white-space: nowrap;
}
.broadcast-btn:active {
  transform: translateY(3px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 #501008, 0 1px 3px rgba(0,0,0,0.3);
}
.broadcast-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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

/* ===== 文章样式 ===== */
.article-section {
  padding-bottom: 32px; margin-bottom: 32px;
  border-bottom: 2px dashed rgba(232,192,96,0.12);
  position: relative;
}
.article-section:last-child { border-bottom: none; margin-bottom: 0; }

.timestamp {
  font-family: 'Courier New', monospace;
  font-size: 12px; font-weight: 900;
  color: #a08040; text-transform: uppercase;
  letter-spacing: 2px; margin-bottom: 15px;
}
.article-title {
  font-family: 'Georgia', serif;
  font-size: 24px; font-weight: 900;
  color: #ece4cd; line-height: 1.3;
  margin-bottom: 14px; letter-spacing: -0.3px;
}
.article-synopsis {
  background: rgba(232,192,96,0.06);
  border: 1px solid rgba(232,192,96,0.12);
  padding: 14px 18px;
  font-size: 14px; font-weight: bold;
  color: #c8b890; margin-bottom: 22px;
  line-height: 1.65;
  box-shadow: 3px 3px 0 rgba(0,0,0,0.1);
}
.historical { opacity: 0.45; transition: opacity 0.3s; }
.historical:hover { opacity: 1; }
</style>
