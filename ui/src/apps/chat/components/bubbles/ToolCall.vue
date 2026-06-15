<script setup>
import { computed } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

const props = defineProps({
  msg: { type: Object, required: true },
  busy: { type: Boolean, default: false }
});

const running = computed(() => props.busy && props.msg.result == null);
const toolName = computed(() => props.msg.toolCall?.function?.name || (props.msg.shell ? 'shell' : '__T_CHAT_TOOL__'));
const toolDesc = computed(() => props.msg.shell ? (props.msg.title || props.msg.command || '') : (props.msg.title || ''));
const toolInput = computed(() => props.msg.shell ? `$ ${props.msg.command || ''}` : (props.msg.detail || ''));
const toolOutput = computed(() => {
  if (props.msg.result == null) return '';
  return typeof props.msg.result === 'string' ? props.msg.result : JSON.stringify(props.msg.result, null, 2);
});

const toggle = () => { props.msg.expanded = !props.msg.expanded; };
</script>

<template>
  <div class="tool-call" :class="{ open: msg.expanded }">
    <button type="button" class="tc-head" @click="toggle">
      <span v-if="running" class="spin" aria-hidden="true"></span>
      <span v-else class="ok"><Check :size="11" :stroke-width="2.5" /></span>
      <span class="name">{{ toolName }}</span>
      <span class="desc">{{ toolDesc }}</span>
      <ChevronDown class="chev" :size="14" :stroke-width="2" />
    </button>

    <div v-if="msg.expanded" class="tc-detail">
      <template v-if="toolInput">
        <label>{{ '__T_CHAT_TOOL_INPUT__' }}</label>
        <pre>{{ toolInput }}</pre>
      </template>
      <template v-if="toolOutput">
        <label>{{ '__T_CHAT_TOOL_OUTPUT__' }}</label>
        <pre>{{ toolOutput }}</pre>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tool-call {
  width: min(720px, 96%);
  margin-bottom: 14px;
  background: var(--color-bg-elev);
  border: 1px solid var(--color-line);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.tc-head {
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
.tc-head:hover { background: var(--color-bg-hi); }
.ok {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: #e8f5ec;
  color: #2e9e5b;
}
.name {
  flex-shrink: 0;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--color-ink);
  background: var(--color-bg-hi);
  border-radius: 5px;
  padding: 1px 7px;
}
.desc {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-faint);
}
.chev {
  flex-shrink: 0;
  color: var(--color-faint);
  transition: transform 0.15s;
}
.tool-call.open .chev { transform: rotate(180deg); }
.tc-detail {
  border-top: 1px solid var(--color-line);
  padding: 4px 14px 12px;
}
.tc-detail label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-faint);
  margin: 8px 0 4px;
  letter-spacing: 0.3px;
}
.tc-detail pre {
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
  animation: tc-spin 0.8s linear infinite;
}
@keyframes tc-spin { to { transform: rotate(360deg); } }
</style>
