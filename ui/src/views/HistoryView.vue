<template>
  <div class="hist-root">
    <div class="hist-container">
      <div class="hist-header">
        <span class="hist-header-icon">📜</span>
        <div>
          <h1 class="hist-title">历史会话</h1>
          <p class="hist-desc">选择一个会话继续对话</p>
        </div>
      </div>
      <div class="hist-card">
        <HistoryPanel @open-chat="openChatFromHistory" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import HistoryPanel from '../components/chat/History.vue';

const router = useRouter();

const openChatFromHistory = async (chat) => {
  await router.push({ path: `/chat/${chat.id}`, query: { title: chat.title || chat.id.slice(0, 8) } });
};
</script>

<style scoped>
.hist-root {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  background: #f5f0e8;
  background-image:
    repeating-linear-gradient(0deg, transparent 0, transparent 28px, rgba(0,0,0,0.02) 28px, rgba(0,0,0,0.02) 29px);
  font-family: 'Georgia', 'PingFang SC', serif;
}

.hist-container {
  max-width: 640px;
  margin: 0 auto;
}

.hist-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.hist-header-icon {
  font-size: 28px;
}
.hist-title {
  font-size: 20px;
  font-weight: 700;
  color: #4a3a28;
  margin: 0;
}
.hist-desc {
  font-size: 12px;
  color: #a0907a;
  margin: 2px 0 0;
}

.hist-card {
  background: #fffdf8;
  border: 1px solid #e8dcc8;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
</style>
