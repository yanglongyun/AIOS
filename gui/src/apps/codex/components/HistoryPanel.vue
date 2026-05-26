<script setup>
defineProps({
  threads: { type: Array, default: () => [] },
  activeId: { type: String, default: "" },
  connected: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});

defineEmits(["new", "pick", "refresh", "start"]);

function threadTitle(thread) {
  return thread?.title || thread?.name || thread?.id || "Codex 会话";
}

function threadMeta(thread) {
  return thread?.cwd || thread?.updated_at || thread?.updatedAt || "";
}
</script>

<template>
  <section class="history-panel">
    <header>
      <div>
        <h1>会话历史</h1>
        <p>查看和继续本机 Codex 线程。</p>
      </div>
      <div class="actions">
        <button v-if="!connected" class="primary" @click="$emit('start')">启动 Codex</button>
        <button class="ghost" @click="$emit('refresh')">刷新</button>
        <button class="primary" @click="$emit('new')">新会话</button>
      </div>
    </header>

    <div v-if="loading" class="state">正在加载</div>
    <div v-else-if="!threads.length" class="state">暂无会话</div>
    <div v-else class="rows">
      <button
        v-for="thread in threads"
        :key="thread.id"
        class="row"
        :class="{ active: thread.id === activeId }"
        @click="$emit('pick', thread)">
        <strong>{{ threadTitle(thread) }}</strong>
        <span>{{ threadMeta(thread) }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.history-panel {
  flex: 1; min-height: 0; overflow: auto; padding: 26px 34px 34px; background: #f3f6f8;
}
header {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 18px;
  padding-bottom: 18px; border-bottom: 1px solid #dfe5eb;
}
h1 { margin: 0; color: #202124; font-size: 30px; letter-spacing: 0; }
p { margin: 7px 0 0; color: #6b7280; }
.actions { flex: none; display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
button {
  border: 0; border-radius: 999px; min-height: 38px; padding: 0 14px;
  font: inherit; font-weight: 650; cursor: pointer;
}
.primary { background: #276ef1; color: #fff; }
.ghost { background: #e8eef5; color: #4b5563; }
.rows { display: grid; }
.row {
  width: 100%; border-radius: 0; background: transparent; color: #202124;
  display: grid; gap: 5px; text-align: left; padding: 15px 0; border-bottom: 1px solid #dfe5eb;
}
.row:hover strong, .row.active strong { color: #174ea6; }
.row strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; }
.row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #6b7280; font-size: 12px; }
.state {
  margin-top: 20px; border: 1px dashed #d8dee4; border-radius: 8px; padding: 18px;
  color: #6b7280; text-align: center;
}
@media (max-width: 760px) {
  .history-panel { padding: 18px 16px 24px; }
  header { align-items: flex-start; flex-direction: column; }
  h1 { font-size: 25px; }
  .actions { width: 100%; justify-content: flex-start; }
}
</style>
