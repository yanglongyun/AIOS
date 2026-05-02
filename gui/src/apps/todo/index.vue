<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ---- Routing -----------------------------------------------------------
//
// The whole app lives behind  /app/:id/:p1?/:p2?  — `id` is fixed to "todo"
// here.  We use the two optional params to encode the three views:
//
//   /app/todo                     →  list (no p1)
//   /app/todo/<parentId>          →  parent detail (p1 set)
//   /app/todo/<parentId>/<subId>  →  subtask detail (both set)
//
const route = useRoute();
const router = useRouter();

const view = computed(() => {
    const p1 = route.params.p1;
    const p2 = route.params.p2;
    if (!p1) return 'list';
    if (!p2) return 'parent';
    return 'subtask';
});
const routeParentId = computed(() => Number(route.params.p1) || null);
const routeSubId    = computed(() => Number(route.params.p2) || null);
const currentId     = computed(() => routeSubId.value || routeParentId.value || null);

const goList   = () => router.push('/app/todo');
const goParent = (id) => router.push(`/app/todo/${id}`);
const goSubtask = (parentId, id) => router.push(`/app/todo/${parentId}/${id}`);
const goBack = () => {
    if (view.value === 'subtask') goParent(routeParentId.value);
    else goList();
};

// ---- Data --------------------------------------------------------------

const todos        = ref([]);
const loading      = ref(false);
const error        = ref('');
const newTitle     = ref('');
const inputRef     = ref(null);
const decomposing  = ref(new Set());
const openRowMenu  = ref(null);
const detailMenuOpen = ref(false);
const expandedRunId = ref(null);

const TERMINAL = new Set(['done', 'aborted', 'error']);
const STATUS_META = {
    pending: { label: '排队中',    color: 'var(--color-accent)', dot: true },
    running: { label: 'AI 工作中', color: 'var(--color-accent)', dot: true },
    done:    { label: 'AI 已完成', color: 'var(--color-good)' },
    aborted: { label: '已停止',    color: 'var(--color-muted)' },
    error:   { label: '失败',      color: 'var(--color-bad)' },
};
const statusMeta = (s) => STATUS_META[s] || null;

const todoApi = async (path, options = {}) => {
    const res = await fetch(`/apps/todo${path}`, {
        ...options,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
    return data;
};
const taskApi = async (path, query) => {
    const url = new URL(path, window.location.origin);
    if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    const res = await fetch(url.toString().replace(window.location.origin, ''), { credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) throw new Error(data.message || `${res.status}`);
    return data;
};

const fetchAll = async () => {
    loading.value = true;
    error.value = '';
    try {
        const data = await todoApi('/list');
        todos.value = data.items || [];
    } catch (e) { error.value = e.message; }
    finally { loading.value = false; }
};

const getTodo = (id) => todos.value.find((t) => t.id === id) || null;
const childrenOf = (id) => todos.value.filter((t) => t.parentId === id).sort((a, b) => a.id - b.id);

// ---- Status (live) -----------------------------------------------------
const liveStatus = ref(new Map()); // todoId -> status
const liveStatusFor = (t) => {
    if (!t) return '';
    return liveStatus.value.get(t.id) || t.taskStatus || '';
};

const pollActiveTasks = async () => {
    const targets = todos.value.filter((t) => t.taskId && !TERMINAL.has(t.taskStatus));
    if (!targets.length) return;
    const next = new Map(liveStatus.value);
    let needRefetch = false;
    for (const t of targets) {
        try {
            const data = await taskApi('/api/task/detail', { id: t.taskId });
            const status = data?.task?.status || '';
            if (!status) continue;
            next.set(t.id, status);
            if (TERMINAL.has(status) && t.taskStatus !== status) {
                try {
                    await todoApi('/update-task-status', {
                        method: 'POST',
                        body: JSON.stringify({ id: t.id, taskStatus: status }),
                    });
                    needRefetch = true;
                } catch {}
            }
        } catch {}
    }
    liveStatus.value = next;
    if (needRefetch) await fetchAll();
};

// ---- Mutations ---------------------------------------------------------

const addTodo = async () => {
    const title = newTitle.value.trim();
    if (!title) return;
    try {
        const data = await todoApi('/create', { method: 'POST', body: JSON.stringify({ title }) });
        todos.value.unshift(data.item);
        newTitle.value = '';
        await nextTick();
        inputRef.value?.focus();
    } catch (e) { error.value = e.message; }
};

const patchLocal = (item) => {
    const idx = todos.value.findIndex((t) => t.id === item.id);
    if (idx >= 0) todos.value[idx] = { ...todos.value[idx], ...item };
    else todos.value.push(item);
};

const toggleDone = async (todo) => {
    try {
        const data = await todoApi('/update', { method: 'POST', body: JSON.stringify({ id: todo.id, done: !todo.done }) });
        patchLocal(data.item);
    } catch (e) { error.value = e.message; }
};
const togglePinned = async (todo) => {
    try {
        const data = await todoApi('/update', { method: 'POST', body: JSON.stringify({ id: todo.id, pinned: !todo.pinned }) });
        patchLocal(data.item);
    } catch (e) { error.value = e.message; }
};
const removeTodo = async (todo) => {
    try {
        await todoApi('/delete', { method: 'POST', body: JSON.stringify({ id: todo.id }) });
        const ids = new Set([todo.id, ...childrenOf(todo.id).map((c) => c.id)]);
        todos.value = todos.value.filter((t) => !ids.has(t.id));
        // If we deleted the parent we're viewing, bounce out.
        if (currentId.value === todo.id) goBack();
    } catch (e) { error.value = e.message; }
};
const updateNote = async (todo, value) => {
    if (todo.note === value) return;
    try {
        const data = await todoApi('/update', { method: 'POST', body: JSON.stringify({ id: todo.id, note: value }) });
        patchLocal(data.item);
    } catch (e) { error.value = e.message; }
};

const decompose = async (todo) => {
    if (decomposing.value.has(todo.id)) return false;
    decomposing.value.add(todo.id);
    try {
        const data = await todoApi('/decompose', { method: 'POST', body: JSON.stringify({ id: todo.id }) });
        if (Array.isArray(data.items)) todos.value.push(...data.items);
        return Array.isArray(data.items) && data.items.length > 0;
    } catch (e) { error.value = e.message; return false; }
    finally { decomposing.value.delete(todo.id); }
};

// One-click execute used on the list: if no plan yet, generate it first then run.
const executeTodo = async (todo) => {
    if (!childrenOf(todo.id).length) {
        const ok = await decompose(todo);
        if (!ok) return;
    }
    await runPlan(todo);
};

const runPlan = async (todo) => {
    try {
        const data = await todoApi('/run-plan', { method: 'POST', body: JSON.stringify({ id: todo.id }) });
        // Backend marked the first sub running; reflect it locally.
        await fetchAll();
        return data;
    } catch (e) { error.value = e.message; }
};

const runOne = async (todo) => {
    try {
        const data = await todoApi('/run', { method: 'POST', body: JSON.stringify({ id: todo.id }) });
        patchLocal(data.item);
    } catch (e) { error.value = e.message; }
};

const stopTask = async (todo) => {
    if (!todo.taskId) return;
    try {
        const res = await fetch('/api/task/stop', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: todo.taskId }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `${res.status}`);
        }
        await pollActiveTasks();
    } catch (e) { error.value = e.message; }
};

// ---- Pipeline state derived from current children ----------------------
const planRunning = (parent) => {
    if (!parent) return false;
    const kids = childrenOf(parent.id);
    return kids.some((k) => liveStatusFor(k) === 'running' || liveStatusFor(k) === 'pending');
};

// ---- Drawer / menu close on outside click ------------------------------
const closeAllMenus = () => { openRowMenu.value = null; detailMenuOpen.value = false };
const toggleRowMenu = (id) => { openRowMenu.value = openRowMenu.value === id ? null : id; detailMenuOpen.value = false };
const toggleDetailMenu = () => { detailMenuOpen.value = !detailMenuOpen.value; openRowMenu.value = null };
const onDocClick = () => closeAllMenus();
const onEsc = (e) => { if (e.key === 'Escape') closeAllMenus(); };

// ---- AI run history (subtask detail) -----------------------------------
const detailMessages = ref([]);
const detailTaskRow = ref(null);
let detailPoller = null;

const loadDetailRun = async () => {
    const cur = currentTodo.value;
    if (!cur || !cur.taskId) { detailMessages.value = []; detailTaskRow.value = null; return; }
    try {
        const [d, m] = await Promise.all([
            taskApi('/api/task/detail',   { id: cur.taskId }),
            taskApi('/api/task/messages', { id: cur.taskId }),
        ]);
        detailTaskRow.value = d?.task || null;
        detailMessages.value = Array.isArray(m?.messages) ? m.messages : [];
    } catch {}
};

// ---- Lifecycle ---------------------------------------------------------
let listPoller = null;
onMounted(() => {
    fetchAll();
    nextTick(() => inputRef.value?.focus());
    listPoller = setInterval(() => { pollActiveTasks(); }, 3000);
    detailPoller = setInterval(() => {
        if (view.value !== 'subtask') return;
        const cur = currentTodo.value;
        if (!cur?.taskId) return;
        const live = liveStatusFor(cur);
        if (!TERMINAL.has(live)) loadDetailRun();
    }, 2500);
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
});
onUnmounted(() => {
    if (listPoller) clearInterval(listPoller);
    if (detailPoller) clearInterval(detailPoller);
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onEsc);
});

watch(currentId, () => {
    detailMessages.value = [];
    detailTaskRow.value = null;
    expandedRunId.value = null;
    loadDetailRun();
});

const currentTodo = computed(() => currentId.value ? getTodo(currentId.value) : null);

// ---- Helpers -----------------------------------------------------------
const fmtRelative = (s) => {
    if (!s) return '';
    const d = new Date(String(s).replace(' ', 'T') + 'Z');
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)    return '刚刚';
    if (diff < 3600)  return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return `${Math.floor(diff / 86400)} 天前`;
};
const fmtFull = (s) => {
    if (!s) return '';
    const d = new Date(String(s).replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) return s;
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const messageText = (msg) => msg?.content == null ? '' : String(msg.content);
const toolCallName = (msg) => msg?.tool_calls?.[0]?.function?.name || 'tool';
const toolCallArgs = (msg) => msg?.tool_calls?.[0]?.function?.arguments || '';
const messageRoleLabel = (r) => ({ assistant: 'AI', tool: '工具结果', user: '指令', system: '系统' }[r] || r);
</script>

<template>
    <div class="todo-root flex h-full bg-bg">

        <!-- ============== LIST (L1) ============== -->
        <div v-if="view === 'list'" class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col">
            <header class="flex flex-none items-baseline gap-3 px-8 pb-4 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
                <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">待办</h1>
                <span class="text-[12.5px] text-faint">·  让 AI 帮你做完</span>
            </header>

            <div class="composer mx-8 mb-2 flex flex-none items-center gap-2 rounded-[14px] bg-card px-3 py-2 transition-colors max-md:mx-3">
                <span class="msi text-muted" style="font-size:20px">add</span>
                <input ref="inputRef" v-model="newTitle" @keydown.enter="addTodo"
                    placeholder="加一条待办,回车确认"
                    class="composer-input min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[14.5px] text-ink outline-none" />
                <button class="cursor-pointer rounded-full border-0 bg-blue-bg px-4 py-1.5 text-[13px] font-medium text-blue-fg transition-colors hover:bg-blue-soft disabled:cursor-default disabled:opacity-50"
                    :disabled="!newTitle.trim()" @click="addTodo">添加</button>
            </div>

            <div v-if="error" class="mx-8 mb-2 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-3"
                 style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">{{ error }}</div>

            <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-1 max-md:px-3 max-md:pb-10">
                <div v-if="loading && !todos.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                    <span class="msi" style="font-size:30px;color:var(--color-faint)">hourglass_empty</span>
                    <div class="text-[14px]">加载中…</div>
                </div>
                <div v-else-if="!todos.filter(t => !t.parentId).length" class="flex flex-col items-center gap-2 py-15 text-muted">
                    <span class="msi" style="font-size:34px;color:var(--color-faint)">checklist</span>
                    <div class="text-[14px]">还没有待办</div>
                </div>

                <ul v-else class="m-0 flex list-none flex-col gap-1.5 p-0">
                    <li v-for="t in todos.filter(t => !t.parentId)" :key="t.id"
                        class="todo-row group/item relative flex items-center gap-3 rounded-[14px] px-3.5 py-3 transition-colors hover:bg-bg-hi cursor-pointer max-md:gap-2.5 max-md:px-3 max-md:py-2.5"
                        :class="{ 'is-pinned': t.pinned, 'has-active-task': planRunning(t) }"
                        @click="goParent(t.id)">

                        <button class="grid h-[22px] w-[22px] flex-none cursor-pointer place-items-center rounded-full border-[1.5px] border-line-hi bg-transparent text-white transition-colors hover:border-accent"
                            :class="{ '!border-accent !bg-accent': t.done }"
                            @click.stop="toggleDone(t)">
                            <span class="msi xs" v-if="t.done">check</span>
                        </button>

                        <div class="min-w-0 flex-1">
                            <div class="break-words text-[14.5px] text-ink"
                                 :class="{ 'text-faint line-through': t.done }">{{ t.title }}</div>
                            <div v-if="childrenOf(t.id).length || planRunning(t)" class="mt-0.5 flex flex-wrap items-center gap-2 text-[12px]">
                                <span v-if="childrenOf(t.id).length" class="inline-flex items-center gap-1 text-faint">
                                    <span class="msi" style="font-size:14px">account_tree</span>
                                    {{ childrenOf(t.id).filter(k => k.done).length }}/{{ childrenOf(t.id).length }}
                                </span>
                                <span v-if="planRunning(t)" class="inline-flex items-center gap-1.5 text-accent">
                                    <span class="animate-status-pulse h-1.5 w-1.5 rounded-full" style="background: var(--color-accent)"></span>
                                    执行中
                                </span>
                            </div>
                        </div>

                        <!-- 3 actions: 执行 / 置顶 / 移除. 「执行」无计划自动先分解 -->
                        <div class="flex flex-none items-center gap-1.5">
                            <button v-if="planRunning(t)"
                                class="row-chip is-stop"
                                @click.stop="(() => { const k = childrenOf(t.id).find(c => liveStatusFor(c) === 'running' || liveStatusFor(c) === 'pending'); if (k) stopTask(k); })()">
                                <span class="msi sm">stop_circle</span> 停止
                            </button>
                            <button v-else
                                class="row-chip is-primary"
                                :class="{ 'is-active': decomposing.has(t.id) }"
                                :disabled="decomposing.has(t.id) || (childrenOf(t.id).length > 0 && childrenOf(t.id).every(k => k.done))"
                                @click.stop="executeTodo(t)">
                                <span class="msi sm" :class="{ spin: decomposing.has(t.id) }">{{ decomposing.has(t.id) ? 'progress_activity' : 'play_arrow' }}</span>
                                {{ decomposing.has(t.id) ? '准备中…' : (childrenOf(t.id).length > 0 && childrenOf(t.id).every(k => k.done) ? '已完成' : '执行') }}
                            </button>

                            <button class="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-accent"
                                :class="{ '!text-accent': t.pinned }"
                                @click.stop="togglePinned(t)" :title="t.pinned ? '取消置顶' : '置顶'">
                                <span class="msi sm" :class="{ filled: t.pinned }">push_pin</span>
                            </button>
                            <button class="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-bad"
                                @click.stop="removeTodo(t)" title="移除">
                                <span class="msi sm">close</span>
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <!-- ============== PARENT DETAIL (L2) ============== -->
        <div v-else-if="view === 'parent' && currentTodo" class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col">
            <!-- Title row: back + big title (mirrors home page) -->
            <header class="flex flex-none items-center gap-3 px-8 pb-4 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
                <button class="grid h-9 w-9 flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                    @click="goBack" title="返回">
                    <span class="msi sm">arrow_back</span>
                </button>
                <input v-model="currentTodo.title"
                    @blur="todoApi('/update', { method: 'POST', body: JSON.stringify({ id: currentTodo.id, title: currentTodo.title }) }).catch(() => {})"
                    class="m-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink outline-none max-md:text-[24px]"
                    :class="{ 'text-faint line-through': currentTodo.done }" />
            </header>

            <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-1 max-md:px-4 max-md:pb-10">

                <!-- 操作项 -->
                <div class="flex flex-wrap items-center gap-1.5 max-md:gap-1">
                    <button v-if="planRunning(currentTodo)" class="action-chip is-stop"
                        @click="(() => { const k = childrenOf(currentTodo.id).find(c => liveStatusFor(c) === 'running' || liveStatusFor(c) === 'pending'); if (k) stopTask(k); })()">
                        <span class="msi sm">stop_circle</span> 停止
                    </button>
                    <button v-else-if="childrenOf(currentTodo.id).length"
                        class="action-chip is-primary"
                        :disabled="!childrenOf(currentTodo.id).filter(k => !k.done).length"
                        @click="runPlan(currentTodo)">
                        <span class="msi sm">play_arrow</span>
                        {{ childrenOf(currentTodo.id).filter(k => !k.done).length ? '执行' : '已全部完成' }}
                    </button>
                    <button v-else class="action-chip is-primary"
                        :class="{ 'is-active': decomposing.has(currentTodo.id) }"
                        :disabled="decomposing.has(currentTodo.id)"
                        @click="decompose(currentTodo)">
                        <span class="msi sm" :class="{ spin: decomposing.has(currentTodo.id) }">{{ decomposing.has(currentTodo.id) ? 'progress_activity' : 'fork_right' }}</span>
                        {{ decomposing.has(currentTodo.id) ? '分解中…' : '分解' }}
                    </button>

                    <button class="action-chip" :class="currentTodo.done ? 'is-done' : ''"
                        @click="toggleDone(currentTodo)">
                        <span class="msi sm">{{ currentTodo.done ? 'check_circle' : 'radio_button_unchecked' }}</span>
                        {{ currentTodo.done ? '已完成' : '完成' }}
                    </button>
                    <button class="action-chip"
                        :class="{ 'is-active': currentTodo.pinned }"
                        @click="togglePinned(currentTodo)">
                        <span class="msi sm" :class="{ filled: currentTodo.pinned }">push_pin</span>
                        {{ currentTodo.pinned ? '已置顶' : '置顶' }}
                    </button>
                    <button class="action-chip hover:!text-bad" @click="removeTodo(currentTodo)">
                        <span class="msi sm">delete</span> 删除
                    </button>
                </div>

                <!-- 备注 -->
                <section class="mt-7">
                    <div class="section-label">备注</div>
                    <textarea
                        :value="currentTodo.note"
                        @change="(e) => updateNote(currentTodo, e.target.value)"
                        placeholder="可以写背景、目标、约束、想要的产出格式…"
                        class="w-full resize-y rounded-[12px] border-0 bg-card px-3.5 py-3 text-[13.5px] leading-[1.65] text-ink outline-none transition-colors focus:bg-card-hi"
                        style="min-height: 92px;"></textarea>
                </section>

                <!-- 计划 -->
                <section class="mt-7">
                    <div class="section-label">
                        计划
                        <span v-if="childrenOf(currentTodo.id).length" class="ml-2 text-[11px] normal-case tracking-normal text-faint">{{ childrenOf(currentTodo.id).filter(k => k.done).length }} / {{ childrenOf(currentTodo.id).length }}</span>
                    </div>

                    <div v-if="!childrenOf(currentTodo.id).length"
                        class="rounded-[12px] border border-dashed border-line px-4 py-10 text-center text-[12.5px] text-faint">
                        还没有计划。点上面的「分解」让 AI 把这条待办拆成子任务。
                    </div>

                    <ul v-else class="m-0 flex list-none flex-col gap-1.5 p-0">
                        <li v-for="(k, idx) in childrenOf(currentTodo.id)" :key="k.id"
                            class="step-row group/item flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-bg-hi cursor-pointer"
                            :class="{ 'has-active-task': liveStatusFor(k) === 'running' || liveStatusFor(k) === 'pending' }"
                            @click="goSubtask(currentTodo.id, k.id)">

                            <span class="step-num grid h-[22px] w-[22px] flex-none place-items-center rounded-full text-[11px] font-semibold"
                                :class="{ 'is-done': k.done, 'is-active': liveStatusFor(k) === 'running' || liveStatusFor(k) === 'pending' }">
                                <span v-if="k.done" class="msi xs">check</span>
                                <span v-else>{{ idx + 1 }}</span>
                            </span>

                            <div class="min-w-0 flex-1">
                                <div class="break-words text-[13.5px] text-ink" :class="{ 'text-faint line-through': k.done }">{{ k.title }}</div>
                                <div v-if="statusMeta(liveStatusFor(k))" class="mt-0.5">
                                    <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-px text-[11px] font-medium"
                                        :style="{ color: statusMeta(liveStatusFor(k)).color, background: 'color-mix(in srgb, ' + statusMeta(liveStatusFor(k)).color + ' 12%, transparent)' }">
                                        <span v-if="statusMeta(liveStatusFor(k)).dot" class="animate-status-pulse h-1.5 w-1.5 rounded-full"
                                            :style="{ background: statusMeta(liveStatusFor(k)).color }"></span>
                                        <span v-else class="msi" style="font-size:12px">{{ liveStatusFor(k) === 'done' ? 'check_circle' : (liveStatusFor(k) === 'error' ? 'error' : 'cancel') }}</span>
                                        {{ statusMeta(liveStatusFor(k)).label }}
                                    </span>
                                </div>
                            </div>

                            <span class="msi text-faint" style="font-size:18px">arrow_forward</span>
                        </li>
                    </ul>
                </section>
            </div>
        </div>

        <!-- ============== SUBTASK DETAIL (L3) ============== -->
        <div v-else-if="view === 'subtask' && currentTodo" class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col">
            <header class="flex flex-none items-center gap-3 px-8 pb-4 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
                <button class="grid h-9 w-9 flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                    @click="goBack" title="返回父待办">
                    <span class="msi sm">arrow_back</span>
                </button>
                <input v-model="currentTodo.title"
                    @blur="todoApi('/update', { method: 'POST', body: JSON.stringify({ id: currentTodo.id, title: currentTodo.title }) }).catch(() => {})"
                    class="m-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink outline-none max-md:text-[24px]"
                    :class="{ 'text-faint line-through': currentTodo.done }" />
                <span v-if="statusMeta(liveStatusFor(currentTodo))"
                    class="inline-flex flex-none items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium max-md:px-1.5"
                    :style="{ color: statusMeta(liveStatusFor(currentTodo)).color, background: 'color-mix(in srgb, ' + statusMeta(liveStatusFor(currentTodo)).color + ' 12%, transparent)' }">
                    <span v-if="statusMeta(liveStatusFor(currentTodo)).dot" class="animate-status-pulse h-1.5 w-1.5 rounded-full"
                        :style="{ background: statusMeta(liveStatusFor(currentTodo)).color }"></span>
                    <span v-else class="msi" style="font-size:13px">{{ liveStatusFor(currentTodo) === 'done' ? 'check_circle' : (liveStatusFor(currentTodo) === 'error' ? 'error' : 'cancel') }}</span>
                    <span class="max-md:hidden">{{ statusMeta(liveStatusFor(currentTodo)).label }}</span>
                </span>
            </header>

            <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-1 max-md:px-4 max-md:pb-10">

                <!-- 操作项 -->
                <div class="flex flex-wrap items-center gap-1.5 max-md:gap-1">
                    <button v-if="liveStatusFor(currentTodo) === 'running' || liveStatusFor(currentTodo) === 'pending'"
                        class="action-chip is-stop" @click="stopTask(currentTodo)">
                        <span class="msi sm">stop_circle</span> 停止
                    </button>
                    <button v-else class="action-chip is-primary" @click="runOne(currentTodo)">
                        <span class="msi sm">auto_awesome</span>
                        {{ currentTodo.taskId ? '再次执行' : '单独执行' }}
                    </button>
                    <button class="action-chip" :class="currentTodo.done ? 'is-done' : ''"
                        @click="toggleDone(currentTodo)">
                        <span class="msi sm">{{ currentTodo.done ? 'check_circle' : 'radio_button_unchecked' }}</span>
                        {{ currentTodo.done ? '已完成' : '完成' }}
                    </button>
                    <button class="action-chip hover:!text-bad" @click="removeTodo(currentTodo)">
                        <span class="msi sm">delete</span> 删除
                    </button>
                </div>

                <!-- 备注 -->
                <section class="mt-7">
                    <div class="section-label">备注</div>
                    <textarea
                        :value="currentTodo.note"
                        @change="(e) => updateNote(currentTodo, e.target.value)"
                        placeholder="(可空)"
                        class="w-full resize-y rounded-[12px] border-0 bg-card px-3.5 py-3 text-[13.5px] leading-[1.65] text-ink outline-none transition-colors focus:bg-card-hi"
                        style="min-height: 72px;"></textarea>
                </section>

                <!-- 结果 -->
                <section class="mt-7">
                    <div class="section-label">结果</div>

                    <div v-if="!currentTodo.taskId"
                        class="rounded-[12px] border border-dashed border-line px-4 py-10 text-center text-[12.5px] text-faint">
                        还没让 AI 跑过这一步。
                    </div>

                    <div v-else class="flex flex-col gap-3">
                        <div v-if="detailTaskRow?.error" class="rounded-[10px] px-3 py-2 text-[13px] text-bad"
                            style="background: color-mix(in srgb, var(--color-bad) 12%, transparent)">{{ detailTaskRow.error }}</div>

                        <div v-if="detailTaskRow?.response" class="rounded-[12px] border border-line bg-card px-3.5 py-3 text-[13.5px] leading-[1.65] text-ink whitespace-pre-wrap break-words">{{ detailTaskRow.response }}</div>
                        <div v-else-if="!TERMINAL.has(detailTaskRow?.status)" class="text-[12.5px] text-faint">AI 还在工作,稍后这里会出现产物。</div>

                        <details v-if="detailMessages.length" class="rounded-[12px] border border-line bg-bg-elev">
                            <summary class="cursor-pointer select-none list-none px-3.5 py-2 text-[12px] text-muted hover:text-ink">
                                <span class="msi" style="font-size:14px;vertical-align:-2px">unfold_more</span>
                                工作日志 ·  {{ detailMessages.length }} 条消息
                            </summary>
                            <div class="flex flex-col gap-2 px-3 pb-3 pt-1">
                                <div v-for="row in detailMessages" :key="row.id" class="rounded-lg border border-line bg-bg px-3 py-2">
                                    <div class="mb-1 flex items-center gap-2 text-[11px] text-faint">
                                        <span class="font-medium text-ink">{{ messageRoleLabel(row.message?.role) }}</span>
                                        <span v-if="row.message?.tool_calls?.length">·  调用 <span class="font-mono text-ink">{{ toolCallName(row.message) }}</span></span>
                                    </div>
                                    <pre v-if="row.message?.tool_calls?.length" class="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-[1.5] text-muted">{{ toolCallArgs(row.message) }}</pre>
                                    <div v-if="messageText(row.message)" class="whitespace-pre-wrap break-words text-[12.5px] leading-[1.55] text-muted">{{ messageText(row.message) }}</div>
                                </div>
                            </div>
                        </details>
                    </div>
                </section>
            </div>
        </div>

        <!-- Fallback while route resolves but data not yet loaded -->
        <div v-else class="flex h-full w-full items-center justify-center text-muted">
            <span class="msi mr-2" style="font-size:20px">hourglass_empty</span>加载中…
        </div>
    </div>
</template>

<style scoped>
.composer:focus-within { background: var(--color-card-hi); }
.composer-input::placeholder { color: var(--color-faint); }

.todo-row.is-pinned { background: color-mix(in srgb, var(--color-accent) 6%, transparent); }
.todo-row.is-pinned:hover { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
.todo-row.has-active-task { box-shadow: inset 3px 0 0 0 var(--color-accent); }
.step-row.has-active-task { box-shadow: inset 2px 0 0 0 var(--color-accent); }

.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Step number bubble */
.step-num {
    background: var(--color-bg-hi);
    color: var(--color-muted);
    border: 1px solid var(--color-line);
}
.step-num.is-done {
    background: var(--color-good);
    color: white;
    border-color: transparent;
}
.step-num.is-active {
    background: color-mix(in srgb, var(--color-accent) 18%, transparent);
    color: var(--color-accent);
    border-color: var(--color-accent);
}

/* Action chip (detail action bar) */
.action-chip {
    display: inline-flex; align-items: center; gap: 6px;
    height: 32px;
    padding: 0 12px;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background .12s, color .12s, border-color .12s;
    white-space: nowrap;
}
.action-chip:hover:not(:disabled) {
    background: var(--color-bg-hi);
    color: var(--color-ink);
    border-color: var(--color-line-hi);
}
.action-chip:disabled { opacity: 0.55; cursor: default; }
.action-chip .msi { font-size: 17px; }
.action-chip.is-primary {
    background: var(--color-blue-bg);
    color: var(--color-blue-fg);
    border-color: transparent;
}
.action-chip.is-primary:hover:not(:disabled) { background: var(--color-blue-soft); color: var(--color-blue-fg); }
.action-chip.is-stop {
    color: var(--color-bad);
    border-color: color-mix(in srgb, var(--color-bad) 45%, transparent);
}
.action-chip.is-stop:hover { background: color-mix(in srgb, var(--color-bad) 12%, transparent); color: var(--color-bad); border-color: var(--color-bad); }
.action-chip.is-done {
    background: var(--color-green-bg);
    color: var(--color-green-fg);
    border-color: transparent;
}
.action-chip.is-done:hover { background: var(--color-green-soft); color: var(--color-green-fg); }
.action-chip.is-active {
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
    color: var(--color-accent);
    border-color: transparent;
}

/* Row chip (compact, used in list rows) */
.row-chip {
    display: inline-flex; align-items: center; gap: 5px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background .12s, color .12s, border-color .12s;
    white-space: nowrap;
}
.row-chip:hover:not(:disabled) { background: var(--color-bg-hi); color: var(--color-ink); border-color: var(--color-line-hi); }
.row-chip:disabled { opacity: 0.55; cursor: default; }
.row-chip .msi { font-size: 15px; }
.row-chip.is-primary {
    background: var(--color-blue-bg);
    color: var(--color-blue-fg);
    border-color: transparent;
}
.row-chip.is-primary:hover { background: var(--color-blue-soft); }
.row-chip.is-stop {
    color: var(--color-bad);
    border-color: color-mix(in srgb, var(--color-bad) 45%, transparent);
}
.row-chip.is-stop:hover { background: color-mix(in srgb, var(--color-bad) 12%, transparent); border-color: var(--color-bad); }
.row-chip.is-active {
    background: color-mix(in srgb, var(--color-accent) 14%, transparent);
    color: var(--color-accent);
    border-color: transparent;
}

/* Popup menu */
.menu-pop {
    position: absolute;
    z-index: 40;
    min-width: 184px;
    padding: 4px;
    border: 1px solid var(--color-line);
    border-radius: 12px;
    background: var(--color-bg-elev);
    box-shadow: 0 8px 30px rgba(0,0,0,0.45);
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.menu-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--color-ink);
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    transition: background .12s, color .12s;
}
.menu-item:hover { background: var(--color-bg-hi); }
.menu-item.danger:hover { color: var(--color-bad); }
.menu-item .msi { color: var(--color-muted); }
.menu-item:hover .msi { color: inherit; }
.menu-item.is-on .msi { color: var(--color-accent); }
.menu-divider { height: 1px; background: var(--color-line); margin: 4px 2px; }

/* Section header in detail pages — small uppercase label above note/plan/结果 */
.section-label {
    margin-bottom: 8px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-faint);
}


/* Header right-cluster buttons */
.header-chip {
    display: inline-flex; align-items: center; gap: 5px;
    height: 30px;
    padding: 0 12px;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background .12s, color .12s, border-color .12s;
    white-space: nowrap;
    flex: none;
}
.header-chip:hover:not(:disabled) {
    background: var(--color-bg-hi);
    color: var(--color-ink);
    border-color: var(--color-line-hi);
}
.header-chip .msi { font-size: 16px; }
.header-chip.is-done {
    background: var(--color-green-bg);
    color: var(--color-green-fg);
    border-color: transparent;
}
.header-chip.is-done:hover { background: var(--color-green-soft); color: var(--color-green-fg); }
@media (max-width: 768px) {
    .header-chip { padding: 0; width: 36px; height: 36px; justify-content: center; gap: 0; border-color: transparent; }
    .header-chip:hover:not(:disabled) { border-color: transparent; }
}

.header-icon {
    display: grid; place-items: center;
    height: 36px; width: 36px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--color-faint);
    cursor: pointer;
    transition: background .12s, color .12s;
    flex: none;
}
.header-icon:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.header-icon.is-active { color: var(--color-accent); }
.header-icon .msi { font-size: 18px; }
</style>
