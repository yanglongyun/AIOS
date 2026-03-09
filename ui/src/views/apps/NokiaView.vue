<template>
  <div class="flex h-full w-full items-center justify-center overflow-hidden bg-gray-900">

    <div class="relative flex max-h-[calc(100vh-32px)] w-[320px] flex-col items-center overflow-y-auto rounded-[36px] bg-[linear-gradient(145deg,#2a2d35,#1a1d25)] px-4 pb-6 pt-5 shadow-[0_0_0_2px_#3a3d45,0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] max-[700px]:rounded-[28px] max-[700px]:px-3.5 max-[700px]:pb-[18px] max-[700px]:pt-3.5">
      <div v-if="isLoading" class="absolute inset-0 z-50 flex items-center justify-center rounded-[36px] bg-black/60 max-[700px]:rounded-[28px]">
        <div class="flex flex-col items-center gap-3">
          <div class="flex gap-1.5">
            <span class="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
            <span class="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:200ms]" />
            <span class="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:400ms]" />
          </div>
          <span class="font-mono text-sm text-gray-400">{{ toast }}</span>
        </div>
      </div>

      <div class="mb-2 h-1.5 w-[60px] rounded bg-[#111] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"></div>
      <div class="mb-2.5 font-['Arial_Black',sans-serif] text-sm uppercase tracking-[0.25em] text-[#555]">NOKIA</div>

      <div class="w-[260px] rounded-lg bg-[#0a0a0a] p-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
        <div class="flex h-[240px] w-full flex-col overflow-hidden rounded-[5px] bg-emerald-400 font-mono text-xs text-[#1a2e1a] max-[700px]:h-[200px]">
          <div v-if="homePage" class="flex flex-1 items-center justify-center p-0">
            <img src="/nokia/hand.png" class="h-full w-full rounded-[3px] object-cover" />
          </div>
          <div v-else-if="timeLine.length > 0" class="flex-1 overflow-y-auto p-2 text-xs leading-[1.5]" v-html="timeLine[currentIndex].content"></div>
        </div>
      </div>

      <div class="mt-2.5 flex w-[260px] flex-col gap-1.5 max-[700px]:gap-1">
        <template v-if="timeLine.length > 0">
          <button
            v-for="(option, i) in timeLine[currentIndex].options"
            :key="i"
            class="w-full rounded-lg border border-[#3a3d45] bg-[#2a2d35] px-3 py-2 text-left text-xs text-gray-400 transition-all hover:bg-[#3a3d45] hover:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 max-[700px]:px-2.5 max-[700px]:py-1.5"
            @click="chooseOption(option)"
            :disabled="isChoosing"
          >{{ option.text }}</button>
        </template>

        <div class="flex gap-1.5">
          <input
            v-model="customOption"
            placeholder="输入你的选择..."
            class="flex-1 rounded-lg border border-[#3a3d45] bg-[#1a1d25] px-3 py-2 text-xs text-gray-400 outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-400"
            @keydown.enter.prevent="customOption.trim() && chooseOption({ text: customOption })"
          />
          <button
            class="whitespace-nowrap rounded-lg border border-[#3a3d45] bg-[#2a2d35] px-3.5 py-2 text-xs text-gray-400 transition-all hover:bg-[#3a3d45] hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            @click="chooseOption({ text: customOption })"
            :disabled="!customOption.trim() || isChoosing"
          >发送</button>
        </div>
      </div>

      <div class="mt-3 flex w-[260px] items-center justify-between gap-2">
        <button class="whitespace-nowrap border-none bg-transparent px-2.5 py-1.5 text-[11px] text-gray-500 transition-colors hover:text-gray-300 disabled:cursor-not-allowed disabled:text-gray-700" @click="prevStory" :disabled="currentIndex >= timeLine.length - 1">◀ 上一步</button>
        <button class="whitespace-nowrap border-none bg-transparent px-2.5 py-1.5 text-[11px] text-gray-400 transition-colors hover:text-gray-300" @click="goHomePage">● 主页</button>
        <button class="whitespace-nowrap border-none bg-transparent px-2.5 py-1.5 text-[11px] text-gray-500 transition-colors hover:text-gray-300 disabled:cursor-not-allowed disabled:text-gray-700" @click="nextStory" :disabled="currentIndex <= 0">下一步 ▶</button>
      </div>
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
    content: `<div style="padding:8px 10px; font-family: monospace; font-size: 12px; line-height: 1.5; color:#102010;">
  <div style="font-weight:700; margin-bottom:6px;">NOKIA</div>
  <div>主屏幕</div>
  <div style="margin-top:6px;">请选择：</div>
  <div>1) 短信</div>
  <div>2) 新闻</div>
  <div>3) 漂流瓶</div>
</div>`,
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

function prevStory() {
  if (currentIndex.value < timeLine.value.length - 1) {
    currentIndex.value += 1;
  }
}

function nextStory() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
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
