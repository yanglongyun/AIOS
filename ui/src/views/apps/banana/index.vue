<template>
  <div class="flex h-full w-full items-center justify-center overflow-hidden bg-[#c8bcac] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_8px)] font-['PingFang_SC','Microsoft_YaHei',sans-serif] text-[#3e3223]">
    <div class="relative flex max-h-[calc(100vh-32px)] w-[280px] flex-col overflow-hidden rounded-[20px] border border-[#ddd6ce] bg-[#eeebe6] p-[14px] shadow-[inset_0_4px_6px_rgba(255,255,255,0.9),inset_0_-4px_6px_rgba(0,0,0,0.06),0_20px_40px_rgba(80,60,40,0.25),0_6px_12px_rgba(80,60,40,0.12)]">
      <div class="mb-3 flex flex-col items-center">
        <div class="earpiece"></div>
        <div class="font-['Pacifico',cursive] text-[22px] tracking-[2px] text-[#8a7a62] [text-shadow:0_2px_0_rgba(255,255,255,0.6),0_-1px_0_rgba(0,0,0,0.1)]">banana</div>
      </div>
      <BananaScreen
        :is-loading="isLoading"
        :toast="toast"
        :time-line="timeLine"
        :current-index="currentIndex"
      />
      <BananaControls
        :time-line="timeLine"
        :current-index="currentIndex"
        v-model:customOption="customOption"
        :is-choosing="isChoosing"
        @choose="chooseOption"
      />
      <div class="mt-5 border-t-2 border-[#d4ccc0]"></div>
      <div class="mic"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from '../../../i18n/index.js';
import BananaControls from '../../../components/apps/banana/BananaControls.vue';
import BananaScreen from '../../../components/apps/banana/BananaScreen.vue';

const { t, locale } = useI18n();
const API_BASE = '/apps/banana';

const currentIndex = ref(0);
const customOption = ref('');
const timeLine = ref([]);
const isLoading = ref(false);
const isChoosing = ref(false);
const toast = ref('');

onMounted(() => {
  init();
});

function goHomePage() {
  timeLine.value = [{
    content: `<div style="text-align:center; font-weight:900; font-size:15px; letter-spacing:3px; margin-bottom:10px;">banana</div>
<div style="text-align:center; font-size:11px; margin-bottom:12px;">━━━━━━━━━━━━</div>
<div style="margin-bottom:3px;">📩 短信收发</div>
<div style="margin-bottom:3px;">📝 记事本</div>
<div style="margin-bottom:3px;">🌊 漂流瓶</div>
<div style="margin-bottom:3px;">🔮 每日占卜</div>
<div style="text-align:center; font-size:11px; margin-top:12px;">━━━━━━━━━━━━</div>
<div style="text-align:center; font-size:11px; margin-top:4px;">▶ 选择功能开始</div>`,
    options: [
      { text: '短信' },
      { text: '记事本' },
      { text: '漂流瓶' },
      { text: '占卜' }
    ],
    choices: null
  }];
  currentIndex.value = 0;
}

async function init() {
  isLoading.value = true;
  toast.value = t('banana_booting');

  try {
    const res = await fetch(`${API_BASE}/progress`);
    const data = await res.json();

    if (data && !data.isNew) {
      timeLine.value = [{
        content: data.current_screen.content,
        options: data.current_screen.options || [],
        choices: null
      }];

      isLoading.value = false;
      return;
    }
  } catch (e) {
    console.error('加载进度失败:', e);
  }

  try {
    const params = buildBananaTaskParams({
      now: t('banana_boot_screen'),
      next: t('banana_enter_home')
    });
    const result = await api('/generation', {
      now: t('banana_boot_screen'),
      next: t('banana_enter_home'),
      ...params
    });

    if (result.content) {
      timeLine.value.push({
        content: result.content,
        options: result.options || [],
        choices: null
      });

    }
  } catch (e) {
    console.error('初始化失败:', e);
    goHomePage();
  }

  isLoading.value = false;
}

async function chooseOption(option) {
  if (!option.text?.trim()) return;
  if (currentIndex.value !== 0) return;
  if (isChoosing.value) return;

  isChoosing.value = true;
  isLoading.value = true;
  toast.value = `${option.text}...`;

  timeLine.value[currentIndex.value].choices = option.text;

  const history = timeLine.value.slice(1, 3).reverse().map(item => {
    return `${t('banana_ctx_screen')}${item.content}` + (item.choices ? `${t('banana_ctx_choice')}${item.choices}` : '');
  });

  try {
    const params = buildBananaTaskParams({
      history,
      now: timeLine.value[currentIndex.value].content,
      choices: option.text
    });
    const result = await api('/generation', {
      history,
      now: timeLine.value[currentIndex.value].content,
      choices: option.text,
      ...params
    });

    if (result.content) {
      timeLine.value.unshift({
        content: result.content,
        options: result.options || [],
        choices: null
      });
      currentIndex.value = 0;

    }
  } catch (e) {
    console.error('生成失败:', e);
  }

  customOption.value = '';
  isLoading.value = false;
  isChoosing.value = false;
}

async function api(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await res.json();
}

function buildBananaTaskParams({ history = [], now = '', choices = '', next = '' }) {
  const lang = locale.value === 'en' ? 'en' : 'zh';
  const prompt = lang === 'en'
    ? 'Generate the next old-phone screen by context and return strict JSON.'
    : '根据上下文生成下一屏老手机界面。';
  const systemPrompt = lang === 'en'
    ? `This is an old-phone UI simulation game. Generate the next screen HTML by user choice.
Requirements:
1. HTML only with inline styles
2. Generate only actual screen content, no signal/time/battery shell
3. options must be exactly 3 items, each has short "text"
4. no external resources
5. font size 12px, line-height 1.6, avoid setting global background colors

Return JSON:
{"content":"<div>...</div>","options":[{"text":"Option 1"},{"text":"Option 2"},{"text":"Option 3"}]}`
    : `这是一个模拟老式手机的互动游戏，你的目标根据用户的选择生成新的html界面内容。
要求：
1. 界面必须是用html语言构成，内联样式
2. 只生成界面上显示的实际内容，不要生成信号栏、电量、时间等装饰元素（外壳已有）
3. 例如如果下一个是短信界面，那么就必须生成具体的短信内容
4. 返回结果必须是JSON格式，包含content(html内容)和options(选项数组)字段
5. options 只允许生成 3 个选项（必须刚好3个），每个选项必须包含text字段，text要简短明确
6. 不要设置背景色，不要用绿色/黑色配色，只用纯文本内容和简单排版
7. html内容不要包含外部资源，所有样式内联
8. 字体大小用12px，行高1.6，颜色不用设置（由外部控制）

返回格式：
{"content":"<div>...</div>","options":[{"text":"选项1"},{"text":"选项2"},{"text":"选项3"}]}`;
  const userPrompt = next
    ? (lang === 'en'
      ? `Current screen is '''${now}''', next target is '''${next}'''`
      : `当前是'''${now}'''，下一步要'''${next}'''`)
    : (lang === 'en'
      ? `Recent history: '''${JSON.stringify(history || [])}'''; current screen: '''${now}'''; latest choice: '''${choices}'''`
      : `用户最近的操作历史是'''${JSON.stringify(history || [])}'''，当前界面显示的是'''${now}'''，用户最新做出的选择是'''${choices}'''`);
  return {
    prompt,
    taskTitle: lang === 'en' ? 'Banana UI Generation' : '老手机界面生成',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  };
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');

.earpiece {
  width: 48px; height: 5px;
  background: linear-gradient(180deg, #5a5048, #3e3830);
  border-radius: 3px;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.3);
  position: relative;
  margin-bottom: 8px;
}
.earpiece::before {
  content: '';
  position: absolute;
  top: 1px; left: 6px; right: 6px; height: 2px;
  background: repeating-linear-gradient(90deg, transparent 0px, transparent 2px, #2a2420 2px, #2a2420 3px);
  border-radius: 1px;
}

/* ── LCD 屏幕 ── */
.lcd-screen {
  background-color: #a8b89c;
  border-radius: 8px;
  border: 3px solid #8a857a;
  box-shadow:
    inset 4px 4px 10px rgba(50,65,40,0.45),
    inset -2px -2px 4px rgba(255,255,255,0.4),
    0 2px 0 rgba(255,255,255,0.8);
  position: relative;
  overflow: hidden;
}
.lcd-screen::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px);
  pointer-events: none; z-index: 5;
}

.lcd-content {
  font-family: 'Courier New', Courier, monospace;
  color: #1e2a18;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  font-weight: 700;
  min-height: 180px;
  max-height: 240px;
  overflow-y: auto;
}
.lcd-content :deep(*) {
  background-color: transparent !important;
  color: #1e2a18 !important;
}
.lcd-content::-webkit-scrollbar { width: 3px; }
.lcd-content::-webkit-scrollbar-track { background: transparent; }
.lcd-content::-webkit-scrollbar-thumb { background: rgba(30,42,24,0.3); border-radius: 2px; }

/* ── 加载 ── */
.lcd-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}
.blink-cursor {
  animation: blink 0.8s step-end infinite;
  margin-left: 1px;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.lcd-progress {
  width: 100%;
  height: 10px;
  border: 1.5px solid #1e2a18;
  border-radius: 2px;
  padding: 1px;
}
.lcd-progress-bar {
  display: block;
  height: 100%;
  width: 0%;
  background: #1e2a18;
  border-radius: 1px;
  animation: progress 2s ease-in-out infinite;
}
@keyframes progress {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

/* ── 麦克风 ── */
.mic {
  width: 48px; height: 5px;
  background: linear-gradient(180deg, #5a5048, #3e3830);
  border-radius: 3px;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.3);
  margin: 10px auto 0;
  position: relative;
}
.mic::before {
  content: '';
  position: absolute;
  top: 1px; left: 6px; right: 6px; height: 2px;
  background: repeating-linear-gradient(90deg, transparent 0px, transparent 2px, #2a2420 2px, #2a2420 3px);
  border-radius: 1px;
}

::-webkit-scrollbar { display: none; }
</style>
