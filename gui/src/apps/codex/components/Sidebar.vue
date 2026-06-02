<script setup>
defineProps({
  threads: { type: Array, default: () => [] },
  activeId: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  connected: { type: Boolean, default: false },
});

defineEmits(["new", "pick", "refresh", "env"]);

function title(thread) {
  return thread?.title || thread?.name || thread?.id || "未命名会话";
}

function meta(thread) {
  const value = thread?.cwd || thread?.updated_at || thread?.updatedAt || thread?.id || "";
  if (!value) return "";
  const str = String(value);
  return str.length > 40 ? "…" + str.slice(-38) : str;
}
</script>

<template>
  <aside class="sidebar">
    <button class="new-btn" :disabled="!connected" @click="$emit('new')">
      <span class="msi">add</span>
      <span>新会话</span>
    </button>

    <div class="list-wrap">
      <div v-if="!connected" class="empty">
        <span class="msi">power_off</span>
        <p>未连接</p>
      </div>
      <div v-else-if="loading && !threads.length" class="empty">
        <span class="msi spinning">progress_activity</span>
        <p>加载中</p>
      </div>
      <div v-else-if="!threads.length" class="empty">
        <span class="msi">forum</span>
        <p>暂无会话</p>
      </div>
      <div v-else class="list">
        <button
          v-for="thread in threads"
          :key="thread.id"
          class="thread"
          :class="{ active: thread.id === activeId }"
          @click="$emit('pick', thread)">
          <span class="msi t-icon">chat_bubble</span>
          <span class="t-body">
            <strong>{{ title(thread) }}</strong>
            <span class="t-meta">{{ meta(thread) }}</span>
          </span>
        </button>
      </div>
    </div>

    <div class="footer">
      <button class="footer-btn" :disabled="!connected" @click="$emit('env')">
        <span class="msi">tune</span>
        <span>环境</span>
      </button>
      <button
        class="footer-btn icon"
        :disabled="!connected"
        :title="loading ? '加载中' : '刷新'"
        @click="$emit('refresh')">
        <span class="msi" :class="{ spinning: loading }">refresh</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  padding: 12px 10px;
  gap: 10px;
}
.new-btn {
  flex: none;
  display: flex; align-items: center; gap: 8px;
  height: 38px; padding: 0 14px;
  border: 0; border-radius: 10px;
  background: var(--accent); color: #fff;
  font: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-1);
  transition: background .15s, box-shadow .15s;
}
.new-btn:hover:not(:disabled) { background: var(--accent-hi); box-shadow: var(--shadow-2); }
.new-btn:disabled { background: var(--bg-elev); color: var(--text-3); box-shadow: none; cursor: default; }
.new-btn .msi { font-size: 18px; }

.list-wrap {
  flex: 1; min-height: 0;
  overflow: hidden;
  display: flex; flex-direction: column;
}
.list {
  flex: 1;
  overflow-y: auto;
  display: flex; flex-direction: column;
  gap: 1px;
}
.empty {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px;
  color: var(--text-3);
  font-size: 12.5px;
}
.empty .msi { font-size: 28px; opacity: 0.7; }
.empty p { margin: 0; }

.thread {
  display: flex; align-items: flex-start; gap: 10px;
  width: 100%; min-width: 0;
  padding: 10px 10px;
  border: 0; border-radius: 8px;
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  font: inherit;
  transition: background .12s, color .12s;
}
.thread:hover { background: var(--bg-elev); }
.thread.active { background: var(--accent-soft); color: var(--accent-fg); }
.thread.active .t-icon { color: var(--accent); }

.t-icon {
  flex: none;
  font-size: 18px;
  color: var(--text-3);
  margin-top: 1px;
}
.t-body {
  min-width: 0;
  display: grid;
  gap: 2px;
  flex: 1;
}
.t-body strong {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.t-meta {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-3);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.thread.active .t-meta { color: var(--accent-fg); opacity: 0.7; }

.footer {
  flex: none;
  display: flex; gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--line-soft);
}
.footer-btn {
  flex: 1;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 34px; padding: 0 12px;
  border: 0; border-radius: 8px;
  background: transparent;
  color: var(--text-2);
  font: inherit; font-size: 12.5px; font-weight: 500;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.footer-btn:hover:not(:disabled) { background: var(--bg-elev); color: var(--text); }
.footer-btn.icon { flex: none; width: 34px; padding: 0; }
.footer-btn:disabled { color: var(--text-3); cursor: default; }
.footer-btn .msi { font-size: 18px; }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
