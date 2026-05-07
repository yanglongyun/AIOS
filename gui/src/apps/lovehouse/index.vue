<script setup>
import { onMounted } from 'vue';
import AppsTrigger from '@/components/AppsTrigger.vue';
import ChatTrigger from '@/components/ChatTrigger.vue';
import MessageList from './MessageList.vue';
import Composer from './Composer.vue';
import { useLovehouse } from './useLovehouse.js';

const { messages, sending, loadMessages, sendMessage } = useLovehouse();

onMounted(loadMessages);
</script>

<template>
  <div class="app-frame">
    <!-- 背景层: 暖粉渐变 + 漂浮光斑 + 噪点 -->
    <div class="lh-bg">
      <div class="lh-aurora aurora-1"></div>
      <div class="lh-aurora aurora-2"></div>
      <div class="lh-aurora aurora-3"></div>
      <div class="lh-noise"></div>
    </div>

    <header class="topbar">
      <div class="brand">
        <span class="avatar">
          <span class="avatar-glow"></span>
          <span class="avatar-emoji">🌸</span>
        </span>
        <div class="brand-text">
          <span class="name">小桃 <span class="status-dot"></span></span>
          <span class="subtitle">在线 · 听得到内心的声音</span>
        </div>
      </div>
      <div class="right">
        <ChatTrigger />
        <AppsTrigger />
      </div>
    </header>

    <div class="app-body">
      <MessageList :messages="messages" :sending="sending" />
      <Composer :sending="sending" @send="sendMessage" />
    </div>
  </div>
</template>

<style scoped>
.app-frame {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse at top, #ffe4ec 0%, #fff5f7 35%, #fff9fb 70%, #fefcfd 100%);
  overflow: hidden;
}

/* ─── 氛围背景 ─────────────────────────────── */
.lh-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.lh-aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  animation: drift 18s ease-in-out infinite;
}
.aurora-1 {
  width: 480px; height: 480px;
  top: -150px; left: -100px;
  background: radial-gradient(circle, #ffb6c1 0%, transparent 70%);
}
.aurora-2 {
  width: 380px; height: 380px;
  top: 30%; right: -120px;
  background: radial-gradient(circle, #ffd1dc 0%, transparent 70%);
  animation-delay: -6s;
}
.aurora-3 {
  width: 420px; height: 420px;
  bottom: -180px; left: 30%;
  background: radial-gradient(circle, #fce4ec 0%, transparent 70%);
  animation-delay: -12s;
}
@keyframes drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.08); }
  66% { transform: translate(-30px, 40px) scale(0.95); }
}

/* 细腻噪点叠在最上面, 让粉色不那么"塑料" */
.lh-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  mix-blend-mode: multiply;
  opacity: 0.6;
}

/* ─── 顶栏 ─────────────────────────────────── */
.topbar {
  position: relative;
  z-index: 2;
  flex: none;
  height: 68px;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: rgba(255,255,255,0.55);
  backdrop-filter: saturate(160%) blur(18px);
  -webkit-backdrop-filter: saturate(160%) blur(18px);
  border-bottom: 1px solid rgba(236, 64, 122, 0.08);
}
.topbar .brand {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  position: relative;
  flex: none;
  width: 44px; height: 44px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffe0ec 0%, #ffc4d6 100%);
  border: 2px solid #fff;
  box-shadow: 0 4px 14px rgba(236, 64, 122, 0.25);
}
.avatar-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(236, 64, 122, 0.35), transparent 70%);
  filter: blur(8px);
  z-index: -1;
  animation: pulse 3s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}
.avatar-emoji { font-size: 22px; line-height: 1; }
.brand-text { display: flex; flex-direction: column; min-width: 0; }
.brand-text .name {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #5d2c3e;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.25), 0 0 8px rgba(74, 222, 128, 0.6);
}
.brand-text .subtitle {
  font-size: 12px;
  color: #b07a8a;
  margin-top: 2px;
}
.topbar .right {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.app-body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

@media (max-width: 720px) {
  .topbar { padding: 8px 12px; height: 60px; }
  .avatar { width: 38px; height: 38px; }
  .avatar-emoji { font-size: 18px; }
  .brand-text .name { font-size: 16px; }
  .brand-text .subtitle { font-size: 11px; }
}
</style>
