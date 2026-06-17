<template>
  <div class="h-full overflow-y-auto px-6 pb-7 pt-[18px] dotgrid">
    <div class="mx-auto grid max-w-[860px] gap-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-[17px] font-bold text-[var(--ink)]">待办</h2>
      </div>

      <div class="flex items-center gap-2 rounded-2xl border border-[var(--line2)] bg-white py-2 pl-4 pr-2 shadow-card">
        <input
          v-model="input"
          class="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          placeholder="添加待办，比如：明天下午交材料，重要"
          @keydown.enter="addTodo"
        />
        <button class="rounded-[10px] bg-[var(--accent-d)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#2563eb] disabled:opacity-50" type="button" :disabled="adding || !input.trim()" @click="addTodo">
          {{ adding ? '添加中' : '添加' }}
        </button>
      </div>

      <div v-if="error" class="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-[13px] text-[#b91c1c]">{{ error }}</div>

      <template v-if="sorted.length">
        <template v-for="todo in sorted" :key="todo.id">
          <div
            class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--line2)] bg-white px-4 py-3 shadow-card transition hover:border-[var(--accent)]"
            :class="{ 'opacity-70': todo.done }"
            @click="toggleDone(todo)"
          >
            <button v-if="todo.subtasks.length" class="grid h-5 w-5 place-items-center rounded-md text-[var(--muted)]" type="button" @click.stop="toggleOpen(todo)">
              <ChevronRight class="h-4 w-4 transition" :class="{ 'rotate-90': openId === todo.id }" />
            </button>
            <span v-else class="h-5 w-5"></span>
            <span class="grid h-[21px] w-[21px] shrink-0 place-items-center rounded-md border-[1.5px] border-[var(--line2)] text-white" :class="{ 'border-[var(--accent-d)] bg-[var(--accent-d)]': todo.done }">
              <Check v-if="todo.done" class="h-3.5 w-3.5 stroke-[3]" />
            </span>
            <span class="min-w-0 flex-1 truncate text-[13.5px] text-[var(--ink)]" :class="{ 'line-through text-[var(--muted)]': todo.done }">{{ todo.text }}</span>
            <span v-if="todo.subtasks.length" class="shrink-0 text-[11px] font-medium text-[var(--muted)]">{{ subDone(todo) }}/{{ todo.subtasks.length }}</span>
            <span v-if="todo.due" class="shrink-0 rounded-full bg-[#f3f3f4] px-2 py-0.5 text-[11px] font-medium" :class="dueLabel(todo.due).late ? 'text-[#b91c1c]' : 'text-[var(--muted)]'">{{ dueLabel(todo.due).text }}</span>
            <span v-if="todo.priority === 'high'" class="shrink-0 rounded-full bg-[#fff1f2] px-2 py-0.5 text-[11px] font-semibold text-[#be123c]">重要</span>
            <button
              v-if="!todo.subtasks.length && !todo.done"
              class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--accent-d)] opacity-80 hover:bg-[#eef4fe]"
              type="button"
              :disabled="decomposingId !== null"
              title="AI 拆解"
              @click.stop="decomposeRow(todo)"
            >
              <LoaderCircle v-if="decomposingId === todo.id" class="h-4 w-4 animate-spin" />
              <Sparkles v-else class="h-4 w-4" />
            </button>
            <button class="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[#fef2f2] hover:text-[#b91c1c]" type="button" title="删除" @click.stop="remove(todo.id)">
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
          <div v-if="rowError.id === todo.id" class="-mt-1 px-4 text-[12px] text-[#b91c1c]">{{ rowError.text }}</div>
          <div v-if="openId === todo.id" class="ml-7 grid gap-2">
            <button
              v-for="sub in todo.subtasks"
              :key="sub.id"
              class="flex items-center gap-2 rounded-[10px] border border-[var(--line2)] bg-white px-4 py-2 text-left text-[13px] text-[var(--ink2)] shadow-card"
              :class="{ 'text-[var(--muted)] line-through': sub.done }"
              type="button"
              @click="toggleSub(todo, sub)"
            >
              <span class="grid h-[19px] w-[19px] shrink-0 place-items-center rounded-md border border-[var(--line2)] text-white" :class="{ 'border-[var(--accent-d)] bg-[var(--accent-d)]': sub.done }">✓</span>
              {{ sub.text }}
            </button>
          </div>
        </template>
      </template>
      <div v-else class="rounded-xl border border-dashed border-[var(--line2)] bg-white p-10 text-center text-[13px] text-[var(--muted)]">
        <b class="mb-1 block text-[16px] text-[var(--ink)]">还没有待办</b>
        写下一件事，AI 会帮你识别日期和优先级。
      </div>

      <div class="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white opacity-0 transition" :class="{ 'opacity-100': toast }">{{ toast }}</div>
    </div>
  </div>
</template>

<script setup>
import { Check, ChevronRight, LoaderCircle, Sparkles, Trash2 } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';

const todos = ref([]);
const input = ref('');
const openId = ref(null);
const adding = ref(false);
const decomposingId = ref(null);
const error = ref('');
const toast = ref('');
const rowError = reactive({ id: null, text: '' });
let toastTimer = null;
let rowTimer = null;

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};
const postJson = (url, body) => request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const patchJson = (url, body) => request(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const sortTodos = (a, b) => {
  const priority = (x) => x.priority === 'high' ? 0 : 1;
  if (priority(a) !== priority(b)) return priority(a) - priority(b);
  return String(a.due || '9999-99-99').localeCompare(String(b.due || '9999-99-99')) || Number(b.id) - Number(a.id);
};
const sorted = computed(() => [
  ...todos.value.filter((x) => !x.done && x.section === 'today').sort(sortTodos),
  ...todos.value.filter((x) => !x.done && x.section === 'later').sort(sortTodos),
  ...todos.value.filter((x) => x.done).sort((a, b) => String(b.doneAt).localeCompare(String(a.doneAt))),
]);

const load = async () => {
  const data = await request('/apps/todo/todos');
  todos.value = data.todos || [];
};
const showToast = (text) => {
  toast.value = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = ''; }, 1800);
};
const showRowError = (id, text) => {
  rowError.id = id;
  rowError.text = text;
  clearTimeout(rowTimer);
  rowTimer = setTimeout(() => { rowError.id = null; rowError.text = ''; }, 3000);
};
const parseLocal = (raw) => ({
  text: raw,
  section: /稍后|以后|改天|下周|下个月/.test(raw) ? 'later' : 'today',
  priority: /重要|紧急|urgent|high/i.test(raw) ? 'high' : '',
  due: '',
});
const patchTodo = async (todo, body) => {
  const data = await patchJson(`/apps/todo/todos?id=${encodeURIComponent(todo.id)}`, body);
  todos.value = todos.value.map((item) => item.id === data.todo.id ? data.todo : item);
  return data.todo;
};
const addTodo = async () => {
  const raw = input.value.trim();
  if (!raw || adding.value) return;
  adding.value = true;
  error.value = '';
  let parsed = parseLocal(raw);
  try {
    parsed = (await postJson('/apps/todo/parse', { text: raw })).result || parsed;
  } catch {}
  try {
    await postJson('/apps/todo/todos', parsed);
    input.value = '';
    await load();
    showToast(parsed.section === 'today' ? '已加入今天' : '已加入稍后');
  } catch (err) {
    error.value = err.message || '添加失败';
  } finally {
    adding.value = false;
  }
};
const toggleOpen = (todo) => { openId.value = openId.value === todo.id ? null : todo.id; };
const toggleDone = async (todo) => {
  await patchTodo(todo, { done: !todo.done });
  showToast(!todo.done ? '已完成' : '已恢复');
};
const toggleSub = async (todo, sub) => {
  const subtasks = todo.subtasks.map((item) => item.id === sub.id ? { ...item, done: !item.done } : item);
  await patchTodo(todo, { subtasks, done: subtasks.length > 0 && subtasks.every((item) => item.done) });
};
const decomposeRow = async (todo) => {
  if (decomposingId.value !== null) return;
  decomposingId.value = todo.id;
  try {
    const data = await postJson('/apps/todo/decompose', { text: todo.text });
    const subtasks = data.subtasks || [];
    if (!subtasks.length) {
      showRowError(todo.id, 'AI 没有拆出可用子任务');
      return;
    }
    await patchTodo(todo, { subtasks });
    openId.value = todo.id;
    showToast(`已拆成 ${subtasks.length} 步`);
  } catch (err) {
    showRowError(todo.id, err.message || '拆解失败');
  } finally {
    decomposingId.value = null;
  }
};
const remove = async (id) => {
  await request(`/apps/todo/todos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  await load();
};
const subDone = (todo) => todo.subtasks.filter((item) => item.done).length;
const dueLabel = (due) => {
  if (!due) return { text: '', late: false };
  const today = new Date().toISOString().slice(0, 10);
  if (due < today) return { text: '已过期', late: true };
  if (due === today) return { text: '今天', late: false };
  return { text: due.slice(5), late: false };
};

onMounted(load);
</script>
