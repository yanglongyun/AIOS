<template>
  <div class="td-app" :data-theme="themeName">
    <header class="td-head">
      <div>
        <div class="greet">{{ greeting }} · {{ todayLabel }}</div>
        <h1 class="serif">待办 <span>{{ openCount }} 件未完成</span></h1>
      </div>
    </header>

    <section class="hero">
      <svg viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="29" class="track" />
        <circle cx="36" cy="36" r="29" class="bar" :style="{ strokeDashoffset: ringOffset }" />
      </svg>
      <div class="pct mono">{{ Math.round(doneRate * 100) }}%</div>
      <div class="hero-mid">
        <b>今天完成 {{ todayDone }} / {{ todayTotal }}</b>
        <small>{{ todayLeft ? `还剩 ${todayLeft} 件 · 一件一件来` : (todayTotal ? '全部搞定,漂亮 ✦' : '把要紧的事放进「今天」') }}</small>
        <div class="weekbars">
          <i v-for="(n, i) in weekCounts" :key="i" :class="{ t: i === 6 }" :style="{ height: `${Math.max(12, n / maxWeek * 100)}%` }"></i>
        </div>
      </div>
      <button class="plan" @click="planToday">AI<br>安排</button>
    </section>

    <div class="chips">
      <button v-for="f in filters" :key="f.key" class="chip" :class="{ on: filter === f.key }" @click="filter = f.key">{{ f.label }}<b>{{ f.count }}</b></button>
    </div>

    <main class="scroll">
      <template v-if="visibleTodos.length">
        <section v-if="todayTodos.length">
          <h2>☀️ 今天<span></span></h2>
          <TodoCard v-for="todo in todayTodos" :key="todo.id" :todo="todo" :open="openId === todo.id" @toggle="toggleDone" @open="toggleOpen" @sub="toggleSub" @move="moveSection" @del="removeTodo" @ai="decompose" />
        </section>
        <section v-if="laterTodos.length">
          <h2>🌙 稍后<span></span></h2>
          <TodoCard v-for="todo in laterTodos" :key="todo.id" :todo="todo" :open="openId === todo.id" @toggle="toggleDone" @open="toggleOpen" @sub="toggleSub" @move="moveSection" @del="removeTodo" @ai="decompose" />
        </section>
        <section v-if="doneTodos.length">
          <h2>✓ 已完成 {{ doneTodos.length }}<span></span><button @click="showDone = !showDone">{{ showDone ? '收起' : '展开' }}</button></h2>
          <template v-if="showDone">
            <TodoCard v-for="todo in doneTodos" :key="todo.id" :todo="todo" :open="openId === todo.id" @toggle="toggleDone" @open="toggleOpen" @sub="toggleSub" @move="moveSection" @del="removeTodo" @ai="decompose" />
          </template>
        </section>
      </template>
      <div v-else class="empty"><b>这里很干净</b><p>在下方输入一句话,AI 帮你建待办</p></div>
    </main>

    <div class="parse-tip" :class="{ show: input.trim() }">
      <b>AI 识别</b><span>{{ preview.text }}</span><span v-if="preview.due">📅 {{ dueLabel(preview.due).text }}</span><span v-if="preview.priority" class="warn">🔥 高优先</span><span>{{ preview.section === 'today' ? '☀️ 今天' : '🌙 稍后' }}</span>
    </div>

    <footer class="dock">
      <input v-model="input" placeholder="周五前交季度报告 很重要" @keydown.enter="addTodo" />
      <button @click="addTodo">↑</button>
    </footer>

    <div class="mask" :class="{ show: sheetOpen }" @click="closeSheet"></div>
    <aside class="sheet" :class="{ show: sheetOpen }">
      <div class="grip"></div>
      <header><b>{{ sheetTitle }}</b><button @click="closeSheet">×</button></header>
      <div class="out">
        <div v-if="sheetLoading">处理中...</div>
        <template v-else-if="sheetKind === 'decompose'">
          <label v-for="item in sheetSubtasks" :key="item.id"><input v-model="item.done" type="checkbox" />{{ item.text }}</label>
        </template>
        <template v-else>
          <div v-if="planNote" class="note">{{ planNote }}</div>
          <div v-for="pick in planPicks" :key="pick.id" class="pick"><b>{{ todoById(pick.id)?.text }}</b><p>{{ pick.reason }}</p></div>
        </template>
      </div>
      <footer><button class="primary" :disabled="sheetLoading" @click="applySheet">应用</button><button @click="closeSheet">放弃</button></footer>
    </aside>
    <div class="toast" :class="{ show: toastText }">{{ toastText }}</div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import { useThemeStore } from '../../stores/theme.js';

const TodoCard = defineComponent({
  props: { todo: Object, open: Boolean },
  emits: ['toggle', 'open', 'sub', 'move', 'del', 'ai'],
  setup(props, { emit }) {
    const label = computed(() => dueLabel(props.todo.due));
    const subDone = computed(() => props.todo.subtasks.filter((s) => s.done).length);
    return () => h('article', { class: ['todo-card', { done: props.todo.done, open: props.open }] }, [
      h('div', { class: 'main' }, [
        h('button', { class: ['cb', { on: props.todo.done }], onClick: () => emit('toggle', props.todo) }, props.todo.done ? '✓' : ''),
        h('div', { class: 'body', onClick: () => emit('open', props.todo) }, [
          h('b', props.todo.text),
          h('div', { class: 'badges' }, [
            props.todo.priority === 'high' ? h('span', { class: 'pri' }, '🔥 高优先') : null,
            props.todo.due ? h('span', { class: ['due', label.value.cls] }, `📅 ${label.value.text}`) : null,
            props.todo.subtasks.length ? h('span', `☑ ${subDone.value}/${props.todo.subtasks.length}`) : null,
          ]),
          props.todo.subtasks.length ? h('div', { class: 'subbar' }, h('i', { style: { width: `${subDone.value / props.todo.subtasks.length * 100}%` } })) : null,
        ]),
      ]),
      props.open ? h('div', { class: 'exp' }, [
        ...props.todo.subtasks.map((s) => h('button', { class: ['sub', { on: s.done }], onClick: () => emit('sub', props.todo, s) }, [h('i', s.done ? '✓' : ''), h('span', s.text)])),
        h('div', { class: 'acts' }, [
          h('button', { class: 'ai', onClick: () => emit('ai', props.todo) }, 'AI 拆解'),
          h('button', { onClick: () => emit('move', props.todo) }, props.todo.section === 'today' ? '🌙 稍后' : '☀️ 今天'),
          h('button', { class: 'del', onClick: () => emit('del', props.todo) }, '删除'),
        ]),
      ]) : null,
    ]);
  },
});

const theme = useThemeStore();
const themeName = computed(() => theme.resolved === 'dark' ? 'dark' : 'light');
const todos = ref([]);
const filter = ref('all');
const input = ref('');
const openId = ref(null);
const showDone = ref(false);
const toastText = ref('');
const sheetOpen = ref(false);
const sheetTitle = ref('AI');
const sheetLoading = ref(false);
const sheetKind = ref('');
const sheetTodo = ref(null);
const sheetSubtasks = ref([]);
const planPicks = ref([]);
const planNote = ref('');
let toastTimer = null;

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};
const load = async () => { todos.value = (await request('/apps/todo/todos')).todos || []; };
const patch = async (todo, body) => {
  const data = await request(`/apps/todo/todos?id=${todo.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const i = todos.value.findIndex((x) => x.id === todo.id);
  if (i >= 0) todos.value[i] = data.todo;
  return data.todo;
};
const showToast = (text) => { toastText.value = text; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastText.value = ''; }, 1800); };

const greeting = computed(() => new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好');
const today = () => new Date().toISOString().slice(0, 10);
const todayLabel = computed(() => new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }));
const openCount = computed(() => todos.value.filter((x) => !x.done).length);
const todayTotal = computed(() => todos.value.filter((x) => x.section === 'today').length);
const todayDone = computed(() => todos.value.filter((x) => x.section === 'today' && x.done).length);
const todayLeft = computed(() => todayTotal.value - todayDone.value);
const doneRate = computed(() => todayTotal.value ? todayDone.value / todayTotal.value : 0);
const ringOffset = computed(() => `${182 - 182 * doneRate.value}px`);
const weekCounts = computed(() => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
  return todos.value.filter((x) => String(x.doneAt || '').slice(0, 10) === d).length;
}));
const maxWeek = computed(() => Math.max(1, ...weekCounts.value));
const preview = computed(() => parseLocal(input.value));
const visibleTodos = computed(() => todos.value.filter(matchFilter));
const sortTodos = (a, b) => (b.priority === 'high') - (a.priority === 'high') || String(a.due || '9999').localeCompare(String(b.due || '9999')) || b.id - a.id;
const todayTodos = computed(() => visibleTodos.value.filter((x) => x.section === 'today' && !x.done).sort(sortTodos));
const laterTodos = computed(() => visibleTodos.value.filter((x) => x.section === 'later' && !x.done).sort(sortTodos));
const doneTodos = computed(() => visibleTodos.value.filter((x) => x.done).sort((a, b) => String(b.doneAt).localeCompare(String(a.doneAt))));
const filters = computed(() => [
  { key: 'all', label: '全部', count: todos.value.filter((x) => !x.done).length },
  { key: 'high', label: '高优先', count: todos.value.filter((x) => !x.done && x.priority === 'high').length },
  { key: 'due', label: '有期限', count: todos.value.filter((x) => !x.done && x.due).length },
  { key: 'overdue', label: '逾期', count: todos.value.filter((x) => !x.done && x.due && x.due < today()).length },
]);
const matchFilter = (x) => filter.value === 'all' || (filter.value === 'high' && x.priority === 'high') || (filter.value === 'due' && x.due) || (filter.value === 'overdue' && x.due && x.due < today());

function dueLabel(due) {
  if (!due) return { text: '', cls: '' };
  const diff = Math.round((new Date(due) - new Date(today())) / 86400000);
  if (diff < 0) return { text: `已逾期 ${Math.abs(diff)} 天`, cls: 'late' };
  if (diff === 0) return { text: '今天', cls: 'soon' };
  if (diff === 1) return { text: '明天', cls: 'soon' };
  return { text: new Date(due).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }), cls: '' };
}
function parseLocal(raw) {
  let text = raw.trim();
  let due = '';
  const d = new Date();
  if (/明天/.test(text)) { d.setDate(d.getDate() + 1); due = d.toISOString().slice(0, 10); text = text.replace('明天', ''); }
  else if (/后天/.test(text)) { d.setDate(d.getDate() + 2); due = d.toISOString().slice(0, 10); text = text.replace('后天', ''); }
  else if (/今天/.test(text)) { due = today(); text = text.replace('今天', ''); }
  const priority = /(重要|紧急|高优先)/.test(text) ? 'high' : '';
  text = text.replace(/很重要|重要|紧急|高优先/g, '').trim();
  return { text: text || raw.trim(), due, priority, section: due && due > today() ? 'later' : 'today' };
}
const todoById = (id) => todos.value.find((x) => Number(x.id) === Number(id));
const toggleOpen = (todo) => { openId.value = openId.value === todo.id ? null : todo.id; };
const toggleDone = async (todo) => { await patch(todo, { done: !todo.done }); showToast(!todo.done ? '完成 ✓ 干得好' : '已取消完成'); };
const toggleSub = async (todo, sub) => {
  const subtasks = todo.subtasks.map((s) => s.id === sub.id ? { ...s, done: !s.done } : s);
  await patch(todo, { subtasks, done: subtasks.length && subtasks.every((s) => s.done) });
};
const moveSection = async (todo) => { await patch(todo, { section: todo.section === 'today' ? 'later' : 'today' }); };
const removeTodo = async (todo) => { await request(`/apps/todo/todos?id=${todo.id}`, { method: 'DELETE' }); await load(); showToast('已删除'); };
const addTodo = async () => {
  const raw = input.value.trim();
  if (!raw) return;
  let parsed = preview.value;
  try { parsed = (await request('/apps/todo/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: raw }) })).result; } catch {}
  await request('/apps/todo/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
  input.value = '';
  await load();
  showToast(`已添加到「${parsed.section === 'today' ? '今天' : '稍后'}」`);
};
const openSheet = (title, kind) => { sheetTitle.value = title; sheetKind.value = kind; sheetOpen.value = true; sheetLoading.value = true; };
const closeSheet = () => { sheetOpen.value = false; };
const decompose = async (todo) => {
  sheetTodo.value = todo; sheetSubtasks.value = []; openSheet('AI 拆解子任务', 'decompose');
  try { sheetSubtasks.value = (await request('/apps/todo/decompose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: todo.text }) })).subtasks || []; } finally { sheetLoading.value = false; }
};
const planToday = async () => {
  planPicks.value = []; planNote.value = ''; openSheet('AI 安排今天', 'plan');
  try { const data = await request('/apps/todo/plan', { method: 'POST' }); planPicks.value = data.picks || []; planNote.value = data.note || ''; } finally { sheetLoading.value = false; }
};
const applySheet = async () => {
  if (sheetKind.value === 'decompose' && sheetTodo.value) await patch(sheetTodo.value, { subtasks: sheetSubtasks.value });
  if (sheetKind.value === 'plan') for (const pick of planPicks.value) { const todo = todoById(pick.id); if (todo) await patch(todo, { section: 'today' }); }
  closeSheet(); await load(); showToast('已应用');
};
onMounted(load);
</script>

<style scoped>
.td-app{--bg0:#eef4df;--bg1:#dbe8c5;--panel:#fbfff3;--panel2:#f4fae9;--ink:#1f321f;--ink2:#506548;--muted:#7b9270;--line:rgba(80,120,60,.18);--line2:rgba(80,120,60,.32);--accent:#3f7a48;--gold:#b8860b;--shadow:0 4px 18px rgba(40,80,30,.12);height:100%;position:relative;overflow:hidden;background:linear-gradient(160deg,var(--bg0),var(--bg1));background-image:radial-gradient(rgba(70,110,50,.05) 1px,transparent 1px);background-size:7px 7px;color:var(--ink)}
.td-app[data-theme=dark]{--bg0:#111b12;--bg1:#1c2b1d;--panel:#1f2d20;--panel2:#263827;--ink:#edf7df;--ink2:#c5d6b8;--muted:#8fa382;--line:rgba(210,240,190,.12);--line2:rgba(210,240,190,.24);--accent:#6faa72;--shadow:0 4px 18px rgba(0,0,0,.28)}.serif{font-family:"Songti SC","Noto Serif SC",serif}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.td-head{padding:14px 18px 8px}.greet{font-size:11px;color:var(--muted)}h1{font-size:28px;font-weight:900}h1 span{font-size:11px;color:var(--muted)}.hero{margin:4px 18px 6px;border-radius:22px;padding:15px;display:flex;align-items:center;gap:12px;color:#eef8df;background:linear-gradient(145deg,#214d30,#3f7a48);box-shadow:var(--shadow);position:relative;overflow:hidden}.hero:after{content:"";position:absolute;inset:-40%;background:radial-gradient(circle,rgba(255,255,255,.16),transparent 45%);transform:translateX(35%)}.hero svg{width:66px;height:66px;transform:rotate(-90deg);position:relative;z-index:1}.track{fill:none;stroke:rgba(255,255,255,.18);stroke-width:7}.bar{fill:none;stroke:#d8f2a8;stroke-width:7;stroke-linecap:round;stroke-dasharray:182;transition:.5s}.pct{position:absolute;left:31px;font-weight:900}.hero-mid{min-width:0;flex:1;position:relative;z-index:1}.hero-mid b{display:block;font-size:15px}.hero-mid small{display:block;color:rgba(230,245,210,.78);margin-top:3px}.weekbars{height:28px;display:flex;align-items:end;gap:3px;margin-top:8px}.weekbars i{width:8px;border-radius:99px;background:rgba(255,255,255,.24)}.weekbars i.t{background:#d8f2a8}.plan{position:relative;z-index:1;border:0;border-radius:16px;background:rgba(255,255,255,.16);color:#f5ffe8;font-weight:900;padding:10px}.chips{display:flex;gap:7px;overflow:auto;padding:9px 18px}.chip{border:1px solid var(--line);background:rgba(255,255,255,.5);color:var(--ink2);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:900}.chip b{margin-left:5px;color:var(--muted)}.chip.on{background:var(--ink);color:var(--bg0)}.scroll{height:calc(100% - 245px);overflow:auto;padding:4px 18px 110px}section h2{display:flex;align-items:center;gap:8px;margin:12px 0 8px;font-size:12px;color:var(--muted)}section h2 span{height:1px;flex:1;background:var(--line)}section h2 button{border:0;background:transparent;color:var(--accent);font-weight:900}.todo-card{border:1px solid var(--line);background:linear-gradient(160deg,var(--panel),var(--panel2));border-radius:17px;box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.7);padding:12px;margin-bottom:9px;animation:pop .32s both}.todo-card.done .body b{text-decoration:line-through;color:var(--muted)}.main{display:flex;gap:10px}.cb{width:25px;height:25px;border-radius:9px;border:2px solid var(--line2);background:transparent;color:white;font-weight:900}.cb.on{background:var(--accent);border-color:var(--accent)}.body{min-width:0;flex:1}.body b{font-size:14px}.badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.badges span{font-size:10px;font-weight:900;border-radius:999px;background:rgba(63,122,72,.1);color:var(--accent);padding:3px 7px}.badges .late{background:#fff0e8;color:#c14b34}.badges .pri{background:#fff4d8;color:#9c6a00}.subbar{height:5px;border-radius:99px;background:var(--line);margin-top:8px;overflow:hidden}.subbar i{display:block;height:100%;background:var(--accent)}.exp{margin-top:10px;border-top:1px dashed var(--line);padding-top:9px}.sub{display:flex;gap:8px;width:100%;border:0;background:transparent;color:var(--ink2);padding:6px 0;text-align:left}.sub i{display:grid;place-items:center;width:18px;height:18px;border-radius:7px;border:1px solid var(--line2)}.sub.on span{text-decoration:line-through;color:var(--muted)}.acts{display:flex;gap:6px;margin-top:8px}.acts button{border:1px solid var(--line);background:var(--panel);border-radius:9px;padding:7px 9px;font-weight:900;color:var(--ink2)}.acts .ai{color:var(--gold)}.acts .del{color:#b34a35}.empty{text-align:center;color:var(--muted);padding:12vh 20px}.empty b{display:block;color:var(--ink);font-size:18px}.parse-tip{position:absolute;left:16px;right:16px;bottom:76px;display:none;gap:6px;overflow:auto;border:1px solid var(--line);background:rgba(251,255,243,.92);backdrop-filter:blur(10px);border-radius:14px;padding:8px}.parse-tip.show{display:flex}.parse-tip span,.parse-tip b{flex:none;font-size:10px;border-radius:999px;background:rgba(63,122,72,.1);padding:4px 8px;color:var(--accent);font-weight:900}.parse-tip .warn{background:#fff4d8;color:#9c6a00}.dock{position:absolute;left:14px;right:14px;bottom:14px;display:flex;gap:8px;border:1px solid var(--line2);border-radius:18px;padding:10px;background:var(--panel);box-shadow:0 0 0 3px rgba(63,122,72,.08),var(--shadow)}.dock input{flex:1;border:0;outline:0;background:transparent;color:var(--ink)}.dock button{width:36px;height:36px;border:0;border-radius:13px;background:var(--accent);color:white;font-weight:900}.mask{position:absolute;inset:0;background:rgba(15,20,5,.45);opacity:0;pointer-events:none;transition:.22s;z-index:20}.mask.show{opacity:1;pointer-events:auto}.sheet{position:absolute;left:0;right:0;bottom:0;max-height:74%;transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.9,.2,1);z-index:21;background:var(--panel);border-radius:22px 22px 0 0;box-shadow:0 -18px 50px rgba(0,0,0,.22);display:flex;flex-direction:column}.sheet.show{transform:translateY(0)}.grip{width:40px;height:5px;border-radius:99px;background:var(--line2);margin:10px auto}.sheet header,.sheet footer{display:flex;gap:9px;align-items:center;padding:10px 18px}.sheet header button{margin-left:auto}.out{min-height:150px;overflow:auto;padding:8px 22px 16px;line-height:1.8}.out label{display:flex;gap:8px;margin:8px 0}.pick{border:1px solid var(--line);border-radius:12px;padding:10px;margin:8px 0}.pick p,.note{color:var(--ink2);font-size:12px}.sheet button{border:1px solid var(--line);background:var(--panel2);border-radius:11px;padding:9px 12px;font-weight:900;color:var(--ink)}.sheet .primary{background:var(--accent);color:white}.toast{position:absolute;top:12px;left:50%;transform:translate(-50%,-140%);transition:.25s;z-index:30;background:var(--ink);color:var(--bg0);border-radius:999px;padding:9px 14px;font-size:12px;font-weight:900}.toast.show{transform:translate(-50%,0)}@keyframes pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
</style>
