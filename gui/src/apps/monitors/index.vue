<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import * as api from '@/utils/api.js';
import { on } from '@/system/ws.js';
import AppTopbar from '@/components/AppTopbar.vue';

const items = ref([]);
const loading = ref(false);
const errMsg = ref('');

const STATUS = {
  active: { label: '等待中', icon: 'bolt', cls: 'active' },
  fired: { label: '已通知', icon: 'check_circle', cls: 'fired' },
  paused: { label: '已暂停', icon: 'pause_circle', cls: 'paused' },
  deleted: { label: '已删除', icon: 'delete', cls: 'deleted' },
};

function statusOf(item) {
  return STATUS[item.status] || STATUS.active;
}

function eventLabel(item) {
  const labels = {
    done: '完成',
    error: '失败',
    aborted: '中止',
    time: '到时',
  };
  return labels[item.event] || item.event;
}

function targetLabel(item) {
  if (item.targetMode === 'new_chat') return '新对话';
  return item.conversationId ? `会话 ${String(item.conversationId).slice(0, 8)}` : '会话';
}

function relTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.max(1, Math.round(diff))} 秒前`;
  if (diff < 3600) return `${Math.round(diff / 60)} 分前`;
  if (diff < 86400) return `${Math.round(diff / 3600)} 小时前`;
  return `${Math.round(diff / 86400)} 天前`;
}

async function load() {
  loading.value = true;
  try {
    const res = await api.get('/api/monitors', { query: { limit: 200 } });
    items.value = Array.isArray(res?.items) ? res.items : [];
    errMsg.value = '';
  } catch (error) {
    errMsg.value = `加载监视器失败: ${error?.body?.message || error?.message || error}`;
  }
  loading.value = false;
}

let unlisten = null;
onMounted(() => {
  load();
  unlisten = on('monitors_changed', load);
});
onBeforeUnmount(() => unlisten?.());
</script>

<template>
  <div class="monitor-app">
    <AppTopbar title="监视器">
      <template #actions>
        <button class="icon-btn" title="刷新" @click="load">
          <span class="msi sm">refresh</span>
        </button>
      </template>
    </AppTopbar>

    <main class="content">
      <div v-if="errMsg" class="err">{{ errMsg }}</div>
      <div v-if="loading && !items.length" class="empty">加载中...</div>
      <div v-else-if="!items.length" class="empty">暂无监视器</div>

      <div v-else class="list">
        <article v-for="item in items" :key="item.id" class="row">
          <div class="state" :class="statusOf(item).cls">
            <span class="msi sm">{{ statusOf(item).icon }}</span>
          </div>
          <div class="main">
            <div class="line">
              <strong>{{ item.title || item.chatTitle || '未命名监视器' }}</strong>
              <span class="badge" :class="statusOf(item).cls">{{ statusOf(item).label }}</span>
            </div>
            <div class="sub">
              <span>任务 {{ item.sourceId || '-' }}</span>
              <span>{{ eventLabel(item) }}</span>
              <span>{{ targetLabel(item) }}</span>
              <span>{{ item.firedAt ? relTime(item.firedAt) : relTime(item.createdAt) }}</span>
            </div>
            <p v-if="item.prompt" class="prompt">{{ item.prompt }}</p>
            <p v-if="item.error" class="error">{{ item.error }}</p>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<style scoped>
.monitor-app {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}
.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 24px 28px;
}
.list {
  max-width: 920px;
  margin: 0 auto;
  border-top: 1px solid var(--line);
}
.row {
  display: flex;
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.state {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--bg-elev);
  color: var(--text-2);
}
.state.active {
  background: var(--accent-soft);
  color: var(--accent-fg);
}
.state.fired {
  background: rgba(0, 255, 163, 0.10);
  color: var(--good);
}
.state.paused {
  background: rgba(255, 230, 109, 0.12);
  color: var(--warn);
}
.main {
  min-width: 0;
  flex: 1;
}
.line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.line strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  color: var(--text);
}
.badge {
  flex: none;
  border-radius: 8px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  background: var(--bg-elev);
  color: var(--text-2);
}
.badge.active {
  background: var(--accent-soft);
  color: var(--accent-fg);
}
.badge.fired {
  background: rgba(0, 255, 163, 0.10);
  color: var(--good);
}
.sub {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
  color: var(--text-3);
  font-size: 12px;
}
.prompt {
  margin: 10px 0 0;
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.55;
}
.error {
  margin: 10px 0 0;
  color: var(--bad);
  font-size: 12.5px;
}
.empty, .err {
  max-width: 920px;
  margin: 0 auto;
  border-radius: 8px;
  padding: 16px;
  color: var(--text-2);
  background: var(--bg-card);
  border: 1px solid var(--line);
}
.err {
  color: var(--bad);
  border-color: rgba(255, 63, 110, 0.25);
  background: rgba(255, 63, 110, 0.10);
}
@media (max-width: 768px) {
  .content {
    padding: 14px 16px 24px;
  }
  .intro h1 {
    font-size: 28px;
  }
}
</style>
