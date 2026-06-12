<template>
  <div class="ti" :class="{ done: todo.done }" @click="$emit('toggle-done')">
    <span v-if="todo.subtasks.length" class="chev" :class="{ open }" @click.stop="$emit('toggle-open')">›</span>
    <span class="cb">{{ todo.done ? '✓' : '' }}</span>
    <span>{{ todo.text }}</span>
    <span v-if="todo.subtasks.length" class="sub-count">{{ subDone }}/{{ todo.subtasks.length }}</span>
    <span v-if="todo.due" class="due" :class="{ warn: dueLabel(todo.due).cls === 'late' }">{{ dueLabel(todo.due).text }}</span>
    <button
      v-if="!todo.subtasks.length && !todo.done"
      class="row-dec-btn"
      :class="{ busy: decomposing }"
      title="__T_TODO_AI_DECOMPOSE__"
      :disabled="decomposeDisabled"
      @click.stop="$emit('decompose')"
    >
      <span v-if="decomposing" class="spin"></span>
      <Sparkles v-else :size="14" :stroke-width="1.5" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Sparkles } from 'lucide-vue-next';
import { dueLabel } from '../lib/format.js';

const props = defineProps({
  todo: { type: Object, required: true },
  open: { type: Boolean, default: false },
  decomposing: { type: Boolean, default: false },
  decomposeDisabled: { type: Boolean, default: false },
});
defineEmits(['toggle-done', 'toggle-open', 'decompose']);

const subDone = computed(() => props.todo.subtasks.filter((s) => s.done).length);
</script>

<style scoped>
.ti{display:flex;align-items:center;gap:11px;padding:12px 16px;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);margin-bottom:9px;cursor:pointer}
.ti:hover{border-color:var(--line2)}
.chev{flex:none;width:16px;color:var(--muted);font-size:15px;text-align:center;transition:transform .18s;user-select:none}
.chev.open{transform:rotate(90deg)}
.cb{width:19px;height:19px;border:1.6px solid var(--line2);border-radius:6px;flex-shrink:0;display:grid;place-items:center;color:#fff;font-size:12px}
.ti.done .cb{background:var(--accent);border-color:var(--accent)}
.ti span{flex:1;font-size:13.5px}
.ti.done span{color:var(--muted);text-decoration:line-through}
.sub-count{font-size:11px;color:var(--muted)}
.due{font-size:11.5px;color:var(--muted)}
.ti .due,.ti .cb,.ti .sub-count,.ti .chev{flex:none}
.due.warn{color:var(--color-bad)}
.row-dec-btn{flex:none;display:grid;place-items:center;width:26px;height:26px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--accent);cursor:pointer;opacity:0;transition:opacity .15s,background .15s}
.ti:hover .row-dec-btn,.row-dec-btn.busy{opacity:1}
.row-dec-btn:hover{background:color-mix(in srgb,var(--accent) 8%,transparent);border-color:var(--accent)}
.row-dec-btn:disabled{cursor:default}
.spin{width:14px;height:14px;border:2px solid var(--line2);border-top-color:var(--accent);border-radius:50%;animation:td-spin .8s linear infinite;flex-shrink:0}
.row-dec-btn .spin{width:13px;height:13px}
@keyframes td-spin{to{transform:rotate(360deg)}}
</style>
