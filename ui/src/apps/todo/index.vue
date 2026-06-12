<template>
  <div class="td-app absolute inset-0 overflow-y-auto dot-grid" :data-theme="themeName">
    <MainView
      v-model:input="input"
      :sorted="sorted"
      :open-id="openId"
      :decomposing-id="decomposingId"
      :row-error="rowError"
      @add="addTodo"
      @toggle-done="toggleDone"
      @toggle-open="toggleOpen"
      @toggle-sub="toggleSub"
      @decompose="decomposeRow"
    />

    <div class="toast" :class="{ show: toastText }">{{ toastText }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useThemeStore } from '../../stores/theme.js';
import MainView from './views/MainView.vue';
import { request, postJson, patchJson } from './lib/api.js';
import { parseLocal, sortTodos } from './lib/format.js';

const theme = useThemeStore();
const themeName = computed(() => theme.resolved === 'dark' ? 'dark' : 'light');
const todos = ref([]);
const input = ref('');
const openId = ref(null);
const toastText = ref('');
const decomposingId = ref(null);
const rowError = reactive({ id: null, text: '' });
let toastTimer = null;
let rowErrTimer = null;

const load = async () => { todos.value = (await request('/apps/todo/todos')).todos || []; };
const patch = async (todo, body) => {
  const data = await patchJson(`/apps/todo/todos?id=${todo.id}`, body);
  const i = todos.value.findIndex((x) => x.id === todo.id);
  if (i >= 0) todos.value[i] = data.todo;
  return data.todo;
};
const showToast = (text) => { toastText.value = text; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastText.value = ''; }, 1800); };
const showRowError = (id, text) => {
  rowError.id = id; rowError.text = text;
  clearTimeout(rowErrTimer);
  rowErrTimer = setTimeout(() => { rowError.id = null; rowError.text = ''; }, 3000);
};

const sorted = computed(() => [
  ...todos.value.filter((x) => !x.done && x.section === 'today').sort(sortTodos),
  ...todos.value.filter((x) => !x.done && x.section === 'later').sort(sortTodos),
  ...todos.value.filter((x) => x.done).sort((a, b) => String(b.doneAt).localeCompare(String(a.doneAt))),
]);

const toggleOpen = (todo) => { openId.value = openId.value === todo.id ? null : todo.id; };
const toggleDone = async (todo) => { await patch(todo, { done: !todo.done }); showToast(!todo.done ? '__T_TODO_DONE_TOAST__' : '__T_TODO_UNDONE_TOAST__'); };
const toggleSub = async (todo, sub) => {
  const subtasks = todo.subtasks.map((s) => s.id === sub.id ? { ...s, done: !s.done } : s);
  await patch(todo, { subtasks, done: subtasks.length > 0 && subtasks.every((s) => s.done) });
};
const addTodo = async () => {
  const raw = input.value.trim();
  if (!raw) return;
  let parsed = parseLocal(raw);
  try { parsed = (await postJson('/apps/todo/parse', { text: raw })).result; } catch {}
  await postJson('/apps/todo/todos', parsed);
  input.value = '';
  await load();
  showToast(`__T_TODO_ADDED_TO__`.replace('{section}', parsed.section === 'today' ? '__T_TIME_TODAY__' : '__T_TODO_SECTION_LATER__'));
};
const decomposeRow = async (todo) => {
  if (decomposingId.value !== null) return;
  decomposingId.value = todo.id;
  try {
    const subtasks = ((await postJson('/apps/todo/decompose', { text: todo.text })).subtasks || [])
      .map(({ id, text, done }) => ({ id, text, done: !!done }));
    if (!subtasks.length) { showRowError(todo.id, '__T_TODO_AI_NO_SUBTASKS__'); return; }
    await patch(todo, { subtasks });
    openId.value = todo.id;
    showToast(`__T_TODO_DECOMPOSED__`.replace('{n}', String(subtasks.length)));
  } catch (error) {
    showRowError(todo.id, error.message || '__T_TODO_DECOMPOSE_FAILED__');
  } finally {
    decomposingId.value = null;
  }
};
onMounted(load);
</script>

<style scoped>
.td-app{--panel:var(--color-bg-elev);--ink:var(--color-ink);--ink2:var(--color-muted);--muted:var(--color-faint);--line:var(--color-line);--line2:var(--color-line-hi);--accent:var(--color-accent);color:var(--ink)}
.toast{position:fixed;top:12px;left:50%;transform:translate(-50%,-180%);opacity:0;visibility:hidden;transition:transform .25s,opacity .25s,visibility .25s;z-index:30;background:var(--color-ink);color:var(--color-bg);border-radius:999px;padding:8px 14px;font-size:12px;font-weight:600}
.toast.show{transform:translate(-50%,0);opacity:1;visibility:visible}
</style>
