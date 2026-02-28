<template>
  <nav class="np-root">

    <!-- 对话区 -->
    <div class="np-section">
      <div class="np-label">对话</div>
      <button @click="goNewSession" class="np-btn" :class="{ active: isChatNew }">
        <span class="np-icon">✦</span> 新会话
      </button>
      <button @click="goHistory" class="np-btn" :class="{ active: isChatHistory }">
        <span class="np-icon">◷</span> 历史会话
      </button>
    </div>

    <!-- 应用区域 -->
    <div class="np-section np-apps">
      <div class="np-label">应用</div>
      <div class="np-scroll">
        <button @click="go('/notebook')" class="np-btn" :class="{ active: is('/notebook') }">
          <span class="np-icon">📝</span> 随心记
        </button>
        <button @click="go('/finance')" class="np-btn" :class="{ active: is('/finance') }">
          <span class="np-icon">💰</span> 记账本
        </button>
        <button @click="go('/inbox')" class="np-btn" :class="{ active: is('/inbox') }">
          <span class="np-icon">📬</span> 收件箱
        </button>
        <button @click="go('/playground')" class="np-btn" :class="{ active: is('/playground') }">
          <span class="np-icon">⚡</span> 游乐园
        </button>
        <button @click="go('/mindtree')" class="np-btn" :class="{ active: route.path.startsWith('/mindtree') }">
          <span class="np-icon">🌳</span> 心树
        </button>
        <button @click="go('/writerpad')" class="np-btn" :class="{ active: route.path.startsWith('/writerpad') }">
          <span class="np-icon">📄</span> 写字板
        </button>
        <button @click="go('/debate-simulator')" class="np-btn" :class="{ active: route.path.startsWith('/debate-simulator') }">
          <span class="np-icon">🎤</span> 竞选模拟器
        </button>
        <button @click="go('/treasure')" class="np-btn" :class="{ active: route.path.startsWith('/treasure') }">
          <span class="np-icon">🔍</span> 藏宝阁
        </button>
        <button @click="go('/lovehouse')" class="np-btn" :class="{ active: is('/lovehouse') }">
          <span class="np-icon">❤️</span> 窗口
        </button>
        <button @click="go('/nokia')" class="np-btn" :class="{ active: is('/nokia') }">
          <span class="np-icon">📱</span> 老手机
        </button>
      </div>
    </div>

    <!-- 底部 -->
    <div class="np-bottom">
      <button @click="go('/community')" class="np-btn" :class="{ active: is('/community') }">
        <span class="np-icon">👥</span> 社区
      </button>
      <button @click="go('/settings')" class="np-btn" :class="{ active: is('/settings') }">
        <span class="np-icon">⚙️</span> 设置
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits(['navigate']);
const route = useRoute();
const router = useRouter();

const isChatNew = computed(() => route.path.startsWith('/chat'));
const isChatHistory = computed(() => route.path === '/history');
const is = (path) => route.path === path;

const go = (path) => {
  emit('navigate');
  router.push(path);
};

const goNewSession = async () => {
  emit('navigate');
  await router.push({ path: '/chat', query: { new: String(Date.now()) } });
};

const goHistory = async () => {
  emit('navigate');
  await router.push('/history');
};
</script>

<style scoped>
.np-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  font-family: 'Georgia', 'PingFang SC', serif;
  background: linear-gradient(180deg, #3a2a1a 0%, #2e2014 100%);
}

.np-section {
  padding: 16px 12px 8px;
}

.np-apps {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.np-label {
  font-size: 9px;
  color: #8a7050;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 0 10px;
  margin-bottom: 6px;
}

.np-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  color: #b8a080;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  position: relative;
}
.np-btn:hover {
  background: rgba(255,255,255,0.06);
  color: #e0c8a0;
}
.np-btn.active {
  background: rgba(200,160,100,0.15);
  color: #e8d0a8;
  box-shadow: inset 3px 0 0 #c8a060;
}

.np-icon {
  width: 18px; height: 18px;
  background: rgba(255,255,255,0.06);
  border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}

.np-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}
.np-scroll::-webkit-scrollbar { width: 0; }

.np-bottom {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 8px 12px 12px;
}
</style>
