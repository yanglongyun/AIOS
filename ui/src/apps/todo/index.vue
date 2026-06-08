<template>
  <div class="relative flex h-full min-h-0 flex-col overflow-hidden" :style="bgStyle">
    <div v-if="mode === 'list'" class="min-h-0 flex-1 overflow-y-auto px-3.5 py-3.5 pb-24 [scrollbar-width:none]">
      <div class="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#a07010]">{{ todayLabel }}</div>

      <div class="mb-4 flex items-center gap-3 rounded-[14px] px-3.5 py-3" :style="panelStyle">
        <div class="relative grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full" :style="ringStyle">
          <div class="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#f4ecd8] font-mono text-[12px] font-extrabold text-[#3a2415]">
            {{ progressPercent }}%
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[15px] font-extrabold text-[#3a2415]">今天完成 {{ doneToday }} / {{ todayTodos.length }}</div>
          <div class="mt-0.5 text-[12px] text-[#7a5e40]">{{ remainingToday > 0 ? `还有 ${remainingToday} 项 · 加油` : '全部搞定' }}</div>
        </div>
      </div>

      <template v-if="todos.length">
        <section v-if="todayTodos.length">
          <div class="section-title">今天</div>
          <TodoCard
            v-for="todo in todayTodos"
            :key="todo.id"
            :todo="todo"
            :busy-id="decomposingId"
            :panel-style="panelStyle"
            @toggle="toggleTodo"
            @toggle-subtask="toggleSubtask"
            @decompose="decompose"
            @delete="remove"
          />
        </section>

        <section v-if="laterTodos.length" class="mt-4">
          <div class="section-title">稍后</div>
          <TodoCard
            v-for="todo in laterTodos"
            :key="todo.id"
            :todo="todo"
            :busy-id="decomposingId"
            :panel-style="panelStyle"
            @toggle="toggleTodo"
            @toggle-subtask="toggleSubtask"
            @decompose="decompose"
            @delete="remove"
          />
        </section>
      </template>

      <div v-else class="flex flex-col items-center gap-2 py-16 text-center text-[#9a8060]">
        <div class="text-[14px] font-bold text-[#5a4030]">还没有待办</div>
        <div class="text-[12px]">点右下角添加第一项</div>
      </div>

      <div v-if="error" class="mt-3 rounded-[12px] border border-[rgba(168,58,40,0.28)] bg-[rgba(168,58,40,0.08)] px-3 py-2 text-[12px] leading-relaxed text-[#9a3a2a]">
        {{ error }}
      </div>
    </div>

    <button
      v-if="mode === 'list'"
      type="button"
      class="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-[14px] px-4 py-3 text-[14px] font-bold text-[rgba(255,245,200,0.96)] active:translate-y-[2px]"
      :style="fabStyle"
      @click="openAdd"
    >
      <Plus :size="19" :stroke-width="2.6" />
      添加
    </button>

    <div v-if="mode === 'add'" class="flex min-h-0 flex-1 flex-col overflow-hidden" :style="detailStyle">
      <div class="flex h-[50px] shrink-0 items-center gap-2 border-b border-[rgba(120,90,40,0.16)] px-3">
        <button class="grid h-9 w-9 place-items-center rounded-[10px] text-[#7a5e40] active:bg-[rgba(120,90,40,0.08)]" type="button" aria-label="返回待办列表" @click="closeAdd">
          <ChevronLeft :size="21" />
        </button>
        <div class="min-w-0 flex-1 truncate text-[17px] font-extrabold text-[#3a2415]">新待办</div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-3.5 py-3.5 pb-28 [scrollbar-width:none]">
        <input
          v-model="form.text"
          class="mb-4 w-full rounded-[12px] border border-[rgba(120,90,40,0.28)] bg-[#e4dcc8] px-3 py-3 text-[14px] text-[#3a2415] shadow-[inset_0_2px_6px_rgba(0,0,0,0.10),0_1px_0_rgba(255,255,255,0.5)] outline-none placeholder:text-[#b09870]"
          placeholder="要做什么？"
          @keyup.enter="add"
        />

        <div class="mb-4">
          <div class="field-label">什么时候</div>
          <div class="grid grid-cols-2 gap-2">
            <button class="seg-btn" :class="{ on: form.section === 'today' }" type="button" @click="form.section = 'today'">今天</button>
            <button class="seg-btn" :class="{ on: form.section === 'later' }" type="button" @click="form.section = 'later'">稍后</button>
          </div>
        </div>

        <button class="mb-4 flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left" :style="panelStyle" type="button" @click="form.priority = form.priority === 'high' ? '' : 'high'">
          <span class="block h-2.5 w-2.5 rounded-full" :class="form.priority === 'high' ? 'bg-[#a83a28]' : 'bg-[#9a8060]'"></span>
          <span class="min-w-0 flex-1">
            <span class="block text-[14px] font-extrabold text-[#3a2415]">高优先级</span>
            <span class="mt-0.5 block text-[12px] text-[#7a5e40]">标一个醒目的红点</span>
          </span>
          <span class="relative h-6 w-11 rounded-full" :class="form.priority === 'high' ? 'bg-[#a83a28]' : 'bg-[rgba(120,90,40,0.25)]'">
            <span class="absolute top-1 h-4 w-4 rounded-full bg-[#f8f0dc] transition-all" :class="form.priority === 'high' ? 'left-6' : 'left-1'"></span>
          </span>
        </button>
      </div>

      <div class="absolute inset-x-0 bottom-0 z-10 border-t border-[rgba(120,90,40,0.16)] px-3.5 py-3" :style="actionBarStyle">
        <button
          class="h-11 w-full rounded-[12px] text-[14px] font-bold text-[rgba(255,245,200,0.96)] disabled:opacity-45"
          type="button"
          :style="buttonStyle"
          :disabled="saving || !form.text.trim()"
          @click="add"
        >
          {{ saving ? '添加中...' : '添加' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Check, ChevronLeft, Plus, Sparkles, Trash2 } from 'lucide-vue-next';
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue';

const TodoCard = defineComponent({
  name: 'TodoCard',
  props: {
    todo: { type: Object, required: true },
    busyId: { type: [Number, String], default: null },
    panelStyle: { type: Object, required: true },
  },
  emits: ['toggle', 'toggleSubtask', 'decompose', 'delete'],
  setup(props, { emit }) {
    return () => h('div', {
      class: ['mb-2.5 rounded-[14px] px-3.5 py-3', props.todo.done ? 'opacity-70' : ''],
      style: props.panelStyle,
    }, [
      h('div', { class: 'flex items-start gap-3' }, [
        h('button', {
          class: [
            'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[8px] border-2',
            props.todo.done ? 'border-transparent bg-[linear-gradient(180deg,#d4981e,#a07010)] text-white' : 'border-[#a07010] bg-white/45 text-transparent',
          ],
          type: 'button',
          onClick: () => emit('toggle', props.todo),
        }, props.todo.done ? h(Check, { size: 14, strokeWidth: 3 }) : ''),
        !props.todo.done && props.todo.priority === 'high'
          ? h('span', { class: 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a83a28]' })
          : null,
        h('div', { class: 'min-w-0 flex-1' }, [
          h('div', {
            class: [
              'break-words text-[14.5px] leading-relaxed text-[#3a2415]',
              props.todo.done ? 'line-through text-[#9a8060]' : '',
            ],
          }, props.todo.text),
          !props.todo.done && props.todo.subtasks?.length
            ? h('div', { class: 'mt-3 flex flex-col gap-2 border-t border-dashed border-[rgba(160,130,70,0.30)] pt-3' },
              props.todo.subtasks.map((subtask) => h('div', { key: subtask.id, class: ['flex items-center gap-2', subtask.done ? 'opacity-60' : ''] }, [
                h('button', {
                  class: [
                    'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border',
                    subtask.done ? 'border-transparent bg-[linear-gradient(180deg,#d4981e,#a07010)] text-white' : 'border-[#a07010] bg-white/45 text-transparent',
                  ],
                  type: 'button',
                  onClick: () => emit('toggleSubtask', props.todo, subtask),
                }, subtask.done ? h(Check, { size: 11, strokeWidth: 3 }) : ''),
                h('span', { class: ['min-w-0 flex-1 break-words text-[13px] text-[#3a2415]', subtask.done ? 'line-through text-[#9a8060]' : ''] }, subtask.text),
              ])))
            : null,
          !props.todo.done && !props.todo.subtasks?.length
            ? props.busyId === props.todo.id
              ? h('div', { class: 'mt-3 flex items-center gap-2 rounded-[12px] border border-[rgba(200,148,28,0.30)] bg-[linear-gradient(160deg,#fdf6e3,#f5ebd0)] px-3 py-2 text-[12.5px] font-bold text-[#a07010]' }, [
                h(Sparkles, { size: 14, class: 'animate-spin' }),
                '正在拆解子任务...',
              ])
              : h('button', {
                class: 'mt-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(200,148,28,0.30)] bg-[rgba(200,148,28,0.10)] px-3 py-1.5 text-[12px] font-bold text-[#a07010]',
                type: 'button',
                onClick: () => emit('decompose', props.todo),
              }, [h(Sparkles, { size: 13 }), 'AI 拆解子任务'])
            : null,
        ]),
        h('button', {
          class: 'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-[#9a3a2a] active:bg-[rgba(168,58,40,0.08)]',
          type: 'button',
          ariaLabel: '删除待办',
          onClick: () => emit('delete', props.todo.id),
        }, h(Trash2, { size: 15 })),
      ]),
    ]);
  },
});

const todos = ref([]);
const mode = ref('list');
const saving = ref(false);
const decomposingId = ref(null);
const error = ref('');
const form = reactive({
  text: '',
  section: 'today',
  priority: '',
});

const todayTodos = computed(() => todos.value.filter((todo) => todo.section !== 'later'));
const laterTodos = computed(() => todos.value.filter((todo) => todo.section === 'later'));
const doneToday = computed(() => todayTodos.value.filter((todo) => todo.done).length);
const remainingToday = computed(() => Math.max(0, todayTodos.value.length - doneToday.value));
const progressPercent = computed(() => todayTodos.value.length ? Math.round((doneToday.value / todayTodos.value.length) * 100) : 0);
const ringStyle = computed(() => ({
  background: `conic-gradient(#c8941c 0 ${progressPercent.value}%, #e4dcc4 ${progressPercent.value}% 100%)`,
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)',
}));
const todayLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date()));

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const load = async () => {
  const data = await request('/apps/todo/todos');
  todos.value = data.todos || [];
};

const openAdd = () => {
  mode.value = 'add';
  form.text = '';
  form.section = 'today';
  form.priority = '';
  error.value = '';
};

const closeAdd = () => {
  if (saving.value) return;
  mode.value = 'list';
  error.value = '';
};

const add = async () => {
  const text = form.text.trim();
  if (!text || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    await request('/apps/todo/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, section: form.section, priority: form.priority }),
    });
    mode.value = 'list';
    await load();
  } catch (err) {
    error.value = err.message || '添加失败';
  } finally {
    saving.value = false;
  }
};

const patchTodo = async (todo, patch) => {
  const data = await request(`/apps/todo/todos?id=${encodeURIComponent(todo.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const next = data.todo;
  todos.value = todos.value.map((item) => item.id === next.id ? next : item);
};

const toggleTodo = async (todo) => {
  await patchTodo(todo, { done: !todo.done });
};

const toggleSubtask = async (todo, subtask) => {
  const subtasks = (todo.subtasks || []).map((item) => item.id === subtask.id ? { ...item, done: !item.done } : item);
  await patchTodo(todo, { subtasks });
};

const decompose = async (todo) => {
  if (decomposingId.value) return;
  decomposingId.value = todo.id;
  error.value = '';
  try {
    const data = await request('/apps/todo/decompose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: todo.text }),
    });
    await patchTodo(todo, { subtasks: data.subtasks || [] });
  } catch (err) {
    error.value = err.message || '拆解失败';
  } finally {
    decomposingId.value = null;
  }
};

const remove = async (id) => {
  await request(`/apps/todo/todos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  await load();
};

onMounted(load);

const bgStyle = {
  background:
    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'>' +
      '<filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/>' +
      '<feColorMatrix type=\'saturate\' values=\'0\'/></filter>' +
      '<rect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/></svg>"), ' +
    'linear-gradient(180deg,#f0e8d5 0%,#e8dfca 100%)',
};
const panelStyle = {
  background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)',
  boxShadow: '0 3px 12px rgba(90,60,20,0.13),0 1px 3px rgba(90,60,20,0.10),inset 0 1px 0 rgba(255,255,255,0.8)',
  border: '1px solid rgba(180,150,80,0.20)',
};
const buttonStyle = {
  background: 'linear-gradient(180deg,#d4981e 0%,#a07010 100%)',
  boxShadow: '0 3px 0 #6a4800,0 4px 10px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,215,80,0.35)',
  color: 'rgba(255,245,190,0.95)',
};
const fabStyle = {
  background: 'linear-gradient(180deg,#d4981e 0%,#a07010 100%)',
  boxShadow: '0 4px 0 #6a4800,0 6px 14px rgba(0,0,0,0.30),inset 0 1px 0 rgba(255,215,80,0.40)',
};
const detailStyle = {
  background:
    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'>' +
      '<filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/>' +
      '<feColorMatrix type=\'saturate\' values=\'0\'/></filter>' +
      '<rect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/></svg>"), ' +
    'linear-gradient(180deg,#f4ecd8 0%,#ece2c8 100%)',
};
const actionBarStyle = {
  background:
    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'>' +
      '<filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/>' +
      '<feColorMatrix type=\'saturate\' values=\'0\'/></filter>' +
      '<rect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/></svg>"), ' +
    'linear-gradient(180deg,rgba(244,236,216,0.94) 0%,rgba(236,226,200,0.98) 100%)',
  boxShadow: '0 -8px 20px rgba(90,60,20,0.12)',
};
</script>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 16px 4px 9px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #9a8060;
}
.seg-btn {
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(120,90,40,0.28);
  background: rgba(255,255,255,0.45);
  color: #7a5e40;
  font-size: 13px;
  font-weight: 800;
}
.seg-btn.on {
  border-color: transparent;
  background: linear-gradient(180deg,#d4981e,#a07010);
  color: rgba(255,245,200,0.96);
  box-shadow: inset 0 1px 0 rgba(255,215,80,0.40);
}
.field-label {
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 800;
  color: #7a5e40;
}
</style>
