<template>
  <div class="flex h-full w-full items-center justify-center overflow-hidden bg-[#c8bcac] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_8px)] font-['PingFang_SC','Microsoft_YaHei',sans-serif] text-[#3e3223]">
    <div class="relative flex max-h-[calc(100vh-32px)] w-[280px] flex-col overflow-hidden rounded-[20px] border border-[#ddd6ce] bg-[#eeebe6] p-[14px] shadow-[inset_0_4px_6px_rgba(255,255,255,0.9),inset_0_-4px_6px_rgba(0,0,0,0.06),0_20px_40px_rgba(80,60,40,0.25),0_6px_12px_rgba(80,60,40,0.12)]">

      <!-- 听筒 + 品牌 -->
      <div class="mb-3 flex flex-col items-center">
        <div class="earpiece"></div>
        <div class="font-['Pacifico',cursive] text-[22px] tracking-[2px] text-[#8a7a62] [text-shadow:0_2px_0_rgba(255,255,255,0.6),0_-1px_0_rgba(0,0,0,0.1)]">banana</div>
      </div>

      <!-- LCD 屏幕 -->
      <div class="lcd-screen">
        <div v-if="isLoading" class="lcd-content lcd-loading">
          <div>{{ toast }}<span class="blink-cursor">▮</span></div>
          <div class="lcd-progress">
            <span class="lcd-progress-bar"></span>
          </div>
        </div>
        <div v-else-if="homePage" class="lcd-content home-img">
          <img src="/nokia/hand.png" />
        </div>
        <div v-else-if="timeLine.length > 0" class="lcd-content" v-html="timeLine[currentIndex].content"></div>
      </div>

      <!-- 选项按钮 -->
      <div class="flex flex-1 flex-col gap-2.5 overflow-y-auto py-[10px] pb-2" v-if="timeLine.length > 0">
        <button
          v-for="(option, i) in timeLine[currentIndex].options"
          :key="i"
          class="w-full rounded-md border border-[#9c9288] bg-[linear-gradient(180deg,#e6e0d8_0%,#c2b8ac_100%)] px-2.5 py-2 text-left text-[11px] font-extrabold text-[#4a4136] [text-shadow:0_1px_0_rgba(255,255,255,0.5)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_3px_0_#8a8076,0_4px_6px_rgba(0,0,0,0.18)] transition-all active:translate-y-[3px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_0,0_1px_2px_rgba(0,0,0,0.15)] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0"
          @click="chooseOption(option)"
          :disabled="isChoosing"
        >{{ option.text }}</button>
      </div>

      <!-- 输入框 -->
      <input
        v-model="customOption"
        class="mt-2 box-border w-full rounded-md border border-[#d4c8b4] bg-[#faf7f2] px-2.5 py-2 text-[11px] font-bold text-[#3e3223] shadow-[inset_0_3px_6px_rgba(0,0,0,0.12),0_2px_0_rgba(255,255,255,0.8)] outline-none placeholder:text-[#b8ad9e] focus:border-[#8a7f62]"
        placeholder="输入你的指令..."
        @keydown.enter.prevent="customOption.trim() && chooseOption({ text: customOption })"
      />

      <!-- 红色执行按钮 -->
      <button
        class="mt-2 w-full rounded-lg border-2 border-[#7a2810] bg-[linear-gradient(180deg,#d05a38_0%,#a83c20_100%)] py-2.5 text-[13px] font-black tracking-[2px] text-[#fdf0e8] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)] shadow-[inset_0_2px_0_rgba(255,255,255,0.2),0_4px_0_#6a1e08,0_5px_8px_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_0_#6a1e08,0_1px_2px_rgba(0,0,0,0.3)] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0"
        @click="chooseOption({ text: customOption })"
        :disabled="!customOption.trim() || isChoosing"
      >执 行</button>

      <!-- 分割线 + 麦克风 -->
      <div class="mt-5 border-t-2 border-[#d4ccc0]"></div>
      <div class="mic"></div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const API_BASE = '/apps/nokia';

const homePage = ref(true);
const currentIndex = ref(0);
const customOption = ref('');
const timeLine = ref([]);
const isLoading = ref(false);
const isChoosing = ref(false);
const toast = ref('');

onMounted(() => {
  init();
});

async function goHomePage() {
  timeLine.value = [{
    content: `<div style="font-weight:900; margin-bottom:6px; font-size:14px; letter-spacing:2px;">banana</div>
<div style="margin-top:8px;">欢迎使用</div>
<div style="margin-top:6px;">请选择：</div>
<div>1) 短信</div>
<div>2) 新闻</div>
<div>3) 漂流瓶</div>`,
    options: [
      { text: '查看通话记录' },
      { text: '写一条备忘录' },
      { text: '看看今日运势' }
    ],
    choices: null
  }];
  currentIndex.value = 0;
  homePage.value = true;
}

async function init() {
  isLoading.value = true;
  toast.value = '正在开机...';

  try {
    const res = await fetch(`${API_BASE}/progress`);
    const data = await res.json();

    if (data && !data.isNew) {
      timeLine.value = [{
        content: data.current_screen.content,
        options: data.current_screen.options || [],
        choices: null
      }];
      homePage.value = false;
      isLoading.value = false;
      return;
    }
  } catch (e) {
    console.error('加载进度失败:', e);
  }

  try {
    const result = await api('/generation', {
      now: '开机画面',
      next: '进入主屏幕'
    });

    if (result.content) {
      timeLine.value.push({
        content: result.content,
        options: result.options || [],
        choices: null
      });
      homePage.value = false;
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
    return `${'界面：'}${item.content}` + (item.choices ? `${'，选择：'}${item.choices}` : '');
  });

  try {
    const result = await api('/generation', {
      history,
      now: timeLine.value[currentIndex.value].content,
      choices: option.text
    });

    if (result.content) {
      timeLine.value.unshift({
        content: result.content,
        options: result.options || [],
        choices: null
      });
      currentIndex.value = 0;
      homePage.value = false;
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
</script>

<style scoped>
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

.lcd-content.home-img {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lcd-content.home-img img {
  width: 100%; height: 100%;
  border-radius: 5px;
  object-fit: cover;
}

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
