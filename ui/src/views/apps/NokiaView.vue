<template>
  <div class="w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden">
    <!-- 加载蒙层 -->
    <div v-if="isLoading" class="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div class="loading-box">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
        <span class="loading-text">{{ toast }}</span>
      </div>
    </div>

    <!-- 手机外壳 -->
    <div class="phone-body">
      <!-- 听筒 -->
      <div class="phone-earpiece"></div>

      <!-- 品牌 -->
      <div class="phone-brand">NOKIA</div>

      <!-- 屏幕区域 -->
      <div class="phone-screen-wrap">
        <div class="phone-screen">
          <!-- 主页面：hand.png -->
          <div v-if="homePage" class="screen-content home-screen">
            <img src="/nokia/hand.png" class="hand-img" />
          </div>

          <!-- 动态内容 -->
          <div v-else-if="timeLine.length > 0" class="screen-content" v-html="timeLine[currentIndex].content"></div>
        </div>
      </div>

      <!-- 选项区域 -->
      <div class="options-area">
        <template v-if="timeLine.length > 0">
          <button
            v-for="(option, i) in timeLine[currentIndex].options"
            :key="i"
            class="option-btn"
            @click="chooseOption(option)"
            :disabled="isChoosing"
          >{{ option.text }}</button>
        </template>

        <!-- 自定义输入 -->
        <div class="custom-input-row">
          <input
            v-model="customOption"
            placeholder="输入你的选择..."
            class="custom-input"
            @keydown.enter.prevent="customOption.trim() && chooseOption({ text: customOption })"
          />
          <button
            class="send-btn"
            @click="chooseOption({ text: customOption })"
            :disabled="!customOption.trim() || isChoosing"
          >发送</button>
        </div>
      </div>

      <!-- 导航键 -->
      <div class="nav-keys">
        <button
          class="nav-key"
          @click="prevStory"
          :disabled="currentIndex >= timeLine.length - 1"
        >◀ 上一步</button>
        <button class="nav-key home-key" @click="goHomePage">● 主页</button>
        <button
          class="nav-key"
          @click="nextStory"
          :disabled="currentIndex <= 0"
        >下一步 ▶</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const API_BASE = 'http://localhost:9701/api/apps/nokia';

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
    content: '',
    options: [
      { text: '打开未读短信' },
      { text: '打开我订阅的新闻' },
      { text: '查看漂流瓶的通知' }
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

  // 新用户，生成初始屏幕
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
    // 回退到默认主页
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
    return `界面：${item.content}` + (item.choices ? `，选择：${item.choices}` : '');
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
.phone-body {
  width: 320px;
  background: linear-gradient(145deg, #2a2d35, #1a1d25);
  border-radius: 36px;
  padding: 20px 16px 24px;
  box-shadow:
    0 0 0 2px #3a3d45,
    0 20px 60px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
}

.phone-earpiece {
  width: 60px;
  height: 6px;
  background: #111;
  border-radius: 3px;
  margin-bottom: 8px;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);
}

.phone-brand {
  font-family: 'Arial Black', sans-serif;
  font-size: 14px;
  color: #555;
  letter-spacing: 4px;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.phone-screen-wrap {
  width: 260px;
  background: #0a0a0a;
  border-radius: 8px;
  padding: 4px;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.8);
}

.phone-screen {
  width: 100%;
  height: 240px;
  background: #4ade80;
  border-radius: 5px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', monospace;
  color: #1a2e1a;
}

.screen-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.screen-content::-webkit-scrollbar { width: 2px; }
.screen-content::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 2px; }

.home-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.hand-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 3px;
}

/* 选项区域 */
.options-area {
  width: 260px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-btn {
  width: 100%;
  padding: 8px 12px;
  background: #2a2d35;
  border: 1px solid #3a3d45;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.option-btn:hover:not(:disabled) {
  background: #3a3d45;
  color: #d1d5db;
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-input-row {
  display: flex;
  gap: 6px;
}

.custom-input {
  flex: 1;
  padding: 8px 12px;
  background: #1a1d25;
  border: 1px solid #3a3d45;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}

.custom-input:focus {
  border-color: #4ade80;
}

.custom-input::placeholder {
  color: #4b5563;
}

.send-btn {
  padding: 8px 14px;
  background: #2a2d35;
  border: 1px solid #3a3d45;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.send-btn:hover:not(:disabled) {
  background: #3a3d45;
  color: #4ade80;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 导航键 */
.nav-keys {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 260px;
  margin-top: 12px;
  gap: 8px;
}

.nav-key {
  padding: 6px 10px;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 11px;
  cursor: pointer;
  transition: color 0.15s;
  white-space: nowrap;
}

.nav-key:hover:not(:disabled) {
  color: #d1d5db;
}

.nav-key:disabled {
  color: #374151;
  cursor: not-allowed;
}

.home-key {
  color: #9ca3af;
}


/* 加载动画 */
.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-text {
  color: #9ca3af;
  font-size: 14px;
  font-family: 'Courier New', monospace;
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  animation: bounce 1.2s infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 响应式 - 小屏缩小 */
@media (max-height: 700px) {
  .phone-body { padding: 14px 14px 18px; border-radius: 28px; }
  .phone-screen { height: 200px; }
  .options-area { gap: 4px; }
  .option-btn { padding: 6px 10px; }
}
</style>
