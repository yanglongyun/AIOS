<template>
  <div class="page">
    <div class="h-row">
      <h2>__T_APP_NAME_TODO__</h2>
    </div>

    <div class="input-bar">
      <input v-model="input" placeholder="__T_TODO_INPUT_PLACEHOLDER__" @keydown.enter="$emit('add')" />
      <button class="blue-btn" @click="$emit('add')">__T_TODO_ADD__</button>
    </div>

    <template v-if="sorted.length">
      <template v-for="todo in sorted" :key="todo.id">
        <TodoItem
          :todo="todo"
          :open="openId === todo.id"
          :decomposing="decomposingId === todo.id"
          :decompose-disabled="decomposingId !== null"
          @toggle-done="$emit('toggle-done', todo)"
          @toggle-open="$emit('toggle-open', todo)"
          @decompose="$emit('decompose', todo)"
        />
        <div v-if="rowError.id === todo.id" class="row-err">{{ rowError.text }}</div>
        <template v-if="openId === todo.id">
          <div v-for="sub in todo.subtasks" :key="sub.id" class="ti sub-ti" :class="{ done: sub.done }" @click="$emit('toggle-sub', todo, sub)">
            <span class="cb">{{ sub.done ? '✓' : '' }}</span>
            <span>{{ sub.text }}</span>
          </div>
        </template>
      </template>
    </template>
    <div v-else class="empty"><b>__T_TODO_EMPTY_TITLE__</b><p>__T_TODO_EMPTY_HINT__</p></div>
  </div>
</template>

<script setup>
import TodoItem from '../components/TodoItem.vue';

defineProps({
  sorted: { type: Array, default: () => [] },
  openId: { default: null },
  decomposingId: { default: null },
  rowError: { type: Object, default: () => ({ id: null, text: '' }) },
});
defineEmits(['add', 'toggle-done', 'toggle-open', 'toggle-sub', 'decompose']);
const input = defineModel('input', { type: String, default: '' });
</script>

<style scoped>
.page{width:min(860px,100%);margin:0 auto;padding:26px 24px 50px}
.h-row{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.h-row h2{font-size:17px;font-weight:700;flex:1;color:var(--ink)}
.input-bar{display:flex;align-items:center;gap:9px;background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:9px 9px 9px 15px;margin-bottom:14px}
.input-bar input{flex:1;border:0;outline:0;background:transparent;color:var(--ink);font:inherit;font-size:13.5px;min-width:0}
.blue-btn{padding:8px 16px;border-radius:9px;border:0;background:var(--accent);color:#fff;font-weight:600;font-size:13px;cursor:pointer;flex-shrink:0}
.blue-btn:hover{background:var(--color-accent-hi)}
.blue-btn:disabled{opacity:.45;cursor:default}
.row-err{color:var(--color-bad);font-size:12px;margin:-4px 0 9px 16px}
.ti{display:flex;align-items:center;gap:11px;padding:12px 16px;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);margin-bottom:9px;cursor:pointer}
.ti:hover{border-color:var(--line2)}
.cb{width:19px;height:19px;border:1.6px solid var(--line2);border-radius:6px;flex-shrink:0;display:grid;place-items:center;color:#fff;font-size:12px}
.ti.done .cb{background:var(--accent);border-color:var(--accent)}
.ti span{flex:1;font-size:13.5px}
.ti.done span{color:var(--muted);text-decoration:line-through}
.ti .cb{flex:none}
.sub-ti{margin-left:16px;border-left:2px solid var(--line2);border-radius:10px;padding:9px 16px}
.sub-ti span{font-size:13px}
.empty{text-align:center;color:var(--muted);padding:12vh 20px}.empty b{display:block;color:var(--ink);font-size:16px}
</style>
