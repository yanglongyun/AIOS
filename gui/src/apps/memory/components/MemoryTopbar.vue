<template>
  <header class="topbar">
    <button class="icon-btn lg" :class="{ active: drawerOpen }" title="侧栏" @click="$emit('toggle-drawer')">
      <span class="msi">menu</span>
    </button>
    <div class="topbar-title">记忆</div>
    <div class="topbar-actions">
      <button class="create-btn" @click="$emit('create')">
        <span class="msi xxs">add</span>
        新建
      </button>
      <button class="icon-btn" title="刷新" @click="$emit('refresh')">
        <span class="msi">refresh</span>
      </button>
      <AskAI />
      <AppHub />
    </div>
  </header>
</template>

<script setup>
import AppHub from '@/components/AppHub.vue';
import AskAI from '@/components/AskAI.vue';

defineProps({
  drawerOpen: { type: Boolean, default: false },
});

defineEmits(['toggle-drawer', 'create', 'refresh']);
</script>

<style scoped>
.topbar {
  display: flex;
  height: 64px;
  flex: none;
  align-items: center;
  border-bottom: 1px solid var(--line-soft);
  background: var(--bg);
  padding: 0 16px;
}
.topbar-title {
  min-width: 0;
  flex: 1;
  margin: 0 4px 0 12px;
  overflow: hidden;
  color: var(--text);
  font-size: 20px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.create-btn {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  background: var(--accent);
  color: var(--bg);
  font-size: 13px;
  font-weight: 650;
  padding: 0 14px;
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
@media (max-width: 768px) {
  .topbar {
    height: 56px;
    padding: 0 8px;
  }
  .topbar-title {
    font-size: 17px;
  }
  .create-btn {
    width: 36px;
    padding: 0;
  }
  .create-btn .msi {
    margin: 0;
  }
  .create-btn {
    font-size: 0;
  }
}
</style>
