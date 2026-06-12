<script setup>
import { computed, ref } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

const props = defineProps({
  // 连续的 tool_call / tool_result 消息聚合成的一组
  items: { type: Array, required: true },
  busy: { type: Boolean, default: false }
});

const open = ref(false);

const calls = computed(() => props.items.filter((m) => m.type === 'tool_call'));

const allDone = computed(() => calls.value.every((m) => m.result != null));
const running = computed(() => props.busy && !allDone.value);

const toolName = (m) => m.toolCall?.function?.name || (m.shell ? 'shell' : '__T_CHAT_TOOL__');
const toolDesc = (m) => m.shell ? (m.title || m.command || '') : (m.title || '');
const toolInput = (m) => m.shell ? `$ ${m.command || ''}` : (m.detail || '');
const toolOutput = (m) => {
  if (m.result == null) return '';
  return typeof m.result === 'string' ? m.result : JSON.stringify(m.result, null, 2);
};

const latest = computed(() => {
  const list = calls.value;
  // 流式进行中优先展示正在运行的工具，否则展示最后一个
  const runningTool = props.busy ? list.find((m) => m.result == null) : null;
  const m = runningTool || list[list.length - 1];
  if (!m) return '';
  return toolDesc(m) || toolName(m);
});

const toggleRow = (m) => { m.expanded = !m.expanded; };
</script>

<template>
  <div class="tool-group" :class="{ open }">
    <button type="button" class="tg-head" @click="open = !open">
      <span v-if="running" class="spin" aria-hidden="true"></span>
      <span v-else class="ok"><Check :size="11" :stroke-width="2.5" /></span>
      <span class="count">{{ `__T_CHAT_ACTIVITY_COUNT__`.replace('{n}', String(calls.length)) }}</span>
      <span class="latest">{{ latest }}</span>
      <ChevronDown class="chev" :size="14" :stroke-width="2" />
    </button>

    <div v-if="open" class="tg-list">
      <div v-for="(m, i) in calls" :key="m._key || i" class="tool-row" :class="{ open: m.expanded }">
        <button type="button" class="tr-sum" @click="toggleRow(m)">
          <span class="name">{{ toolName(m) }}</span>
          <span class="desc">{{ toolDesc(m) }}</span>
          <span v-if="m.result == null && busy" class="spin sm" aria-hidden="true"></span>
          <ChevronDown class="chev" :size="13" :stroke-width="2" />
        </button>
        <div v-if="m.expanded" class="tr-detail">
          <template v-if="toolInput(m)">
            <label>{{ '__T_CHAT_TOOL_INPUT__' }}</label>
            <pre>{{ toolInput(m) }}</pre>
          </template>
          <template v-if="toolOutput(m)">
            <label>{{ '__T_CHAT_TOOL_OUTPUT__' }}</label>
            <pre>{{ toolOutput(m) }}</pre>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-group {
  width: min(720px, 96%);
  margin-bottom: 14px;
  background: var(--color-bg-elev);
  border: 1px solid var(--color-line);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.tg-head {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--color-muted);
  text-align: left;
  cursor: pointer;
}
.tg-head:hover { background: var(--color-bg-hi); }
.tg-head .ok {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: #e8f5ec;
  color: #2e9e5b;
  font-size: 11px;
}
.tg-head .count { flex-shrink: 0; color: var(--color-faint); }
.tg-head .latest {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chev {
  flex-shrink: 0;
  color: var(--color-faint);
  transition: transform 0.15s;
}
.tool-group.open > .tg-head .chev { transform: rotate(180deg); }
.tg-list { border-top: 1px solid var(--color-line); }
.tool-row { border-bottom: 1px solid var(--color-line); }
.tool-row:last-child { border-bottom: 0; }
.tr-sum {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 14px;
  border: none;
  background: transparent;
  font-size: 12.8px;
  color: var(--color-muted);
  text-align: left;
  cursor: pointer;
}
.tr-sum:hover { background: var(--color-bg-hi); }
.tr-sum .name {
  flex-shrink: 0;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--color-ink);
  background: var(--color-bg-hi);
  border-radius: 5px;
  padding: 1px 7px;
}
.tr-sum .desc {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-faint);
}
.tool-row.open .tr-sum .chev { transform: rotate(180deg); }
.tr-detail { padding: 4px 14px 12px; }
.tr-detail label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-faint);
  margin: 8px 0 4px;
  letter-spacing: 0.3px;
}
.tr-detail pre {
  margin: 0;
  background: var(--color-bg-hi);
  border: 1px solid var(--color-line);
  border-radius: 8px;
  padding: 9px 11px;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--color-ink);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 260px;
  overflow-y: auto;
}
.spin {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid var(--color-line-hi);
  border-top-color: var(--color-blue-fg);
  animation: tg-spin 0.8s linear infinite;
}
.spin.sm { width: 12px; height: 12px; border-width: 1.6px; }
@keyframes tg-spin { to { transform: rotate(360deg); } }
</style>
