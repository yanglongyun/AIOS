<template>
  <div class="app-root" style="height: 100dvh;">

    <!-- 顶部栏：木纹书桌 -->
    <div class="app-topbar">
      <button @click="sidebarOpen = !sidebarOpen" class="app-topbar-menu">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2.5" width="14" height="1.5" rx="0.75"/>
          <rect x="1" y="7.25" width="14" height="1.5" rx="0.75"/>
          <rect x="1" y="12" width="14" height="1.5" rx="0.75"/>
        </svg>
      </button>
      <span class="app-topbar-title">AIOS</span>
      <span class="app-topbar-brass">Personal System</span>
    </div>

    <!-- 下方：导航面板 + 内容区 -->
    <div class="app-body">
      <div v-if="sidebarOpen" @click="sidebarOpen = false" class="app-overlay" />
      <div v-show="sidebarOpen" class="app-sidebar">
        <NavPanel @navigate="onNavigate" />
      </div>
      <div class="app-content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import NavPanel from './components/NavPanel.vue';

const sidebarOpen = ref(window.innerWidth >= 768);

const onNavigate = () => {
  if (window.innerWidth < 768) sidebarOpen.value = false;
};

const onResize = () => {
  if (window.innerWidth < 768) sidebarOpen.value = false;
};

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
.app-root {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #2a2218;
  font-family: 'Georgia', 'PingFang SC', serif;
}

/* ========== 顶部栏 ========== */
.app-topbar {
  height: 48px;
  background: linear-gradient(180deg, #5a3e28 0%, #4a3020 100%);
  border-bottom: 2px solid #3a2010;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  background-image:
    repeating-linear-gradient(90deg, transparent 0, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px);
  position: relative;
  z-index: 80;
}

.app-topbar-menu {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #d4c0a0;
  transition: all 0.15s;
}
.app-topbar-menu:hover { background: rgba(255,255,255,0.15); color: #f0e0c0; }

.app-topbar-title {
  font-size: 16px;
  font-weight: 700;
  color: #e8d4b8;
  letter-spacing: 2px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.app-topbar-brass {
  font-size: 10px;
  color: #c0a878;
  margin-left: auto;
  letter-spacing: 1px;
  font-style: italic;
}

/* ========== 主体 ========== */
.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
}

.app-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(22, 14, 8, 0.45);
  backdrop-filter: blur(1px);
  display: none;
}
@media (max-width: 767px) {
  .app-overlay { display: block; }
}

/* ========== 侧边栏 ========== */
.app-sidebar {
  position: relative;
  z-index: 70;
  height: 100%;
  width: 220px;
  flex-shrink: 0;
  opacity: 1;
  background: linear-gradient(180deg, #3a2a1a 0%, #2e2014 100%);
  border-right: 1px solid #1a1008;
  background-image:
    repeating-linear-gradient(180deg, transparent 0, transparent 6px, rgba(255,255,255,0.01) 6px, rgba(255,255,255,0.01) 7px);
}
@media (max-width: 767px) {
  .app-sidebar {
    position: absolute;
    inset-block: 0;
    left: 0;
    box-shadow: 4px 0 20px rgba(0,0,0,0.5);
  }
}

/* ========== 内容区 ========== */
.app-content {
  position: relative;
  z-index: 0;
  display: flex;
  min-height: 0;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}
</style>
