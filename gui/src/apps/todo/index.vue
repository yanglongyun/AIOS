<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

const todos    = ref([]);
const loading  = ref(false);
const error    = ref('');
const newTitle = ref('');
const inputRef = ref(null);
const filter   = ref('active'); // all | active | done
const expanded = ref(new Set()); // parent ids whose children are visible
const decomposing = ref(new Set()); // todo ids currently being decomposed
const drawerTodoId = ref(null); // which todo's AI log drawer is open

const todoApi = async (path, options = {}) => {
    const res = await fetch(`/apps/todo${path}`, {
        ...options,
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
        // Auto-expand any parent that has live AI activity in children, and any with subtasks by default.
        for (const t of todos.value) if (!t.parentId) expanded.value.add(t.id);
    } catch (e) { error.value = e.message; }
    finally { loading.value = false; }
};

const tree = computed(() => {
    // Group by parent for rendering. Parents come from todos.value (already pre-sorted by backend).
    const parents = todos.value.filter((t) => !t.parentId);
    const childrenByParent = new Map();
    for (const t of todos.value) {
        if (!t.parentId) continue;
        if (!childrenByParent.has(t.parentId)) childrenByParent.set(t.parentId, []);
        childrenByParent.get(t.parentId).push(t);
    }
    const matches = (t) => {
        if (filter.value === 'all')    return true;
        if (filter.value === 'done')   return t.done;
        return !t.done; // active
    };
    return parents
        .map((p) => {
            const kids = (childrenByParent.get(p.id) || []).filter(matches);
            return { parent: p, kids, allKids: childrenByParent.get(p.id) || [] };
        })
        .filter(({ parent, kids }) => matches(parent) || kids.length);
});

const counts = computed(() => {
    let active = 0, done = 0;
    for (const t of todos.value) (t.done ? done++ : active++);
    return { all: todos.value.length, active, done };
});

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

const sortLocal = () => {
    // Re-sort top level only; children are nested via tree() and stay in creation order.
    todos.value = [...todos.value].sort((a, b) => {
        if (!!a.parentId !== !!b.parentId) return a.parentId ? 1 : -1;
        if (a.parentId && b.parentId) {
            if (a.parentId !== b.parentId) return a.parentId - b.parentId;
            if (a.done !== b.done) return a.done ? 1 : -1;
            return a.id - b.id;
        }
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        if (a.done !== b.done)     return a.done - b.done;
        return b.id - a.id;
    });
};

const patchLocal = (item) => {
    const idx = todos.value.findIndex((t) => t.id === item.id);
    if (idx >= 0) todos.value[idx] = { ...todos.value[idx], ...item };
};

const toggleDone = async (todo) => {
    try {
        const data = await todoApi('/update', { method: 'POST', body: JSON.stringify({ id: todo.id, done: !todo.done }) });
        patchLocal(data.item);
        sortLocal();
    } catch (e) { error.value = e.message; }
};

const togglePinned = async (todo) => {
    try {
        const data = await todoApi('/update', { method: 'POST', body: JSON.stringify({ id: todo.id, pinned: !todo.pinned }) });
        patchLocal(data.item);
        sortLocal();
    } catch (e) { error.value = e.message; }
};

const removeTodo = async (todo) => {
    try {
        await todoApi('/delete', { method: 'POST', body: JSON.stringify({ id: todo.id }) });
        // Drop the row + any of its children from local state.
        todos.value = todos.value.filter((t) => t.id !== todo.id && t.parentId !== todo.id);
        if (drawerTodoId.value === todo.id) drawerTodoId.value = null;
    } catch (e) { error.value = e.message; }
};

const runWithAi = async (todo) => {
    try {
        const data = await todoApi('/run', { method: 'POST', body: JSON.stringify({ id: todo.id }) });
        patchLocal(data.item);
        drawerTodoId.value = todo.id;
    } catch (e) { error.value = e.message; }
};

const decompose = async (todo) => {
    if (decomposing.value.has(todo.id)) return;
    decomposing.value.add(todo.id);
    try {
        const data = await todoApi('/decompose', { method: 'POST', body: JSON.stringify({ id: todo.id }) });
        if (Array.isArray(data.items)) {
            todos.value.push(...data.items);
            expanded.value.add(todo.id);
            sortLocal();
        }
    } catch (e) { error.value = e.message; }
    finally { decomposing.value.delete(todo.id); }
};

const toggleExpand = (todo) => {
    if (expanded.value.has(todo.id)) expanded.value.delete(todo.id);
    else expanded.value.add(todo.id);
};

const startInlineSubtask = ref(null); // parent id whose inline composer is open
const newSubtitle = ref('');
const subInputRef = ref(null);
const openInlineSubtask = async (parent) => {
    startInlineSubtask.value = parent.id;
    newSubtitle.value = '';
    expanded.value.add(parent.id);
    await nextTick();
    subInputRef.value?.focus();
};
const submitSubtask = async (parent) => {
    const title = newSubtitle.value.trim();
    if (!title) { startInlineSubtask.value = null; return; }
    try {
        const data = await todoApi('/create', { method: 'POST', body: JSON.stringify({ title, parentId: parent.id }) });
        todos.value.push(data.item);
        sortLocal();
        newSubtitle.value = '';
        await nextTick();
        subInputRef.value?.focus();
    } catch (e) { error.value = e.message; }
};

const onSubInputBlur = () => {
    if (!newSubtitle.value.trim()) startInlineSubtask.value = null;
};

// ----- Status polling for any todo with a non-terminal task_status -----
const liveStatus = ref(new Map()); // todoId -> { status, ts }
const TERMINAL = new Set(['done', 'aborted', 'error']);

const liveStatusFor = (t) => {
    const live = liveStatus.value.get(t.id);
    return (live && live.status) || t.taskStatus || '';
};

const pollActiveTasks = async () => {
    const targets = todos.value.filter((t) => t.taskId && !TERMINAL.has(t.taskStatus));
    if (!targets.length) return;
    const next = new Map(liveStatus.value);
    let needSort = false;
    for (const t of targets) {
        try {
            const data = await taskApi('/api/task/detail', { id: t.taskId });
            const status = data?.task?.status || '';
            if (!status) continue;
            next.set(t.id, { status, ts: Date.now() });
            if (TERMINAL.has(status) && t.taskStatus !== status) {
                // Persist the terminal cache back to the row.
                try {
                    const upd = await todoApi('/update-task-status', {
                        method: 'POST',
                        body: JSON.stringify({ id: t.id, taskStatus: status }),
                    });
                    patchLocal(upd.item);
                    needSort = true;
                } catch {}
            }
        } catch {}
    }
    liveStatus.value = next;
    if (needSort) sortLocal();
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

// ----- AI work-log drawer state -----
const drawerTodo = computed(() => todos.value.find((t) => t.id === drawerTodoId.value) || null);
const drawerMessages = ref([]);
const drawerTaskDetail = ref(null);
const drawerLoading = ref(false);
let drawerPoller = null;

const loadDrawer = async () => {
    const t = drawerTodo.value;
    if (!t || !t.taskId) { drawerMessages.value = []; drawerTaskDetail.value = null; return; }
    drawerLoading.value = true;
    try {
        const [d, m] = await Promise.all([
            taskApi('/api/task/detail',   { id: t.taskId }),
            taskApi('/api/task/messages', { id: t.taskId }),
        ]);
        drawerTaskDetail.value = d?.task || null;
        drawerMessages.value = Array.isArray(m?.messages) ? m.messages : [];
    } catch (e) { error.value = e.message; }
    finally { drawerLoading.value = false; }
};

const openDrawer = (todo) => {
    drawerTodoId.value = todo.id;
    loadDrawer();
};
const closeDrawer = () => {
    drawerTodoId.value = null;
    drawerMessages.value = [];
    drawerTaskDetail.value = null;
};

let listPoller = null;
onMounted(() => {
    fetchAll();
    nextTick(() => inputRef.value?.focus());
    listPoller = setInterval(() => { pollActiveTasks(); }, 3000);
    drawerPoller = setInterval(() => {
        if (!drawerTodoId.value) return;
        const t = drawerTodo.value;
        if (!t || !t.taskId) return;
        const live = liveStatusFor(t);
        if (!TERMINAL.has(live)) loadDrawer();
    }, 2500);
});
onUnmounted(() => {
    if (listPoller) clearInterval(listPoller);
    if (drawerPoller) clearInterval(drawerPoller);
});

const STATUS_META = {
    pending: { label: '排队中', color: 'var(--color-accent)', dot: true },
    running: { label: 'AI 工作中', color: 'var(--color-accent)', dot: true },
    done:    { label: 'AI 已完成', color: 'var(--color-good)' },
    aborted: { label: '已停止',    color: 'var(--color-muted)' },
    error:   { label: '失败',      color: 'var(--color-bad)' },
};
const statusMeta = (s) => STATUS_META[s] || null;

const fmtTime = (s) => {
    if (!s) return '';
    const d = new Date(String(s).replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) return s;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const messageText = (msg) => msg?.content == null ? '' : String(msg.content);
const toolCallName = (msg) => msg?.tool_calls?.[0]?.function?.name || 'tool';
const toolCallArgs = (msg) => msg?.tool_calls?.[0]?.function?.arguments || '';
const messageRoleLabel = (role) => {
    if (role === 'assistant') return 'AI';
    if (role === 'tool')      return '工具结果';
    if (role === 'user')      return '指令';
    if (role === 'system')    return '系统';
    return role || '消息';
};
</script>

<template>
    <div class="todo-root flex h-full bg-bg">
        <!-- Main column -->
        <div class="flex min-w-0 flex-1 flex-col">
            <header class="flex flex-none flex-col gap-1 px-8 pb-4 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
                <div class="flex items-baseline gap-3">
                    <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">待办</h1>
                    <span class="text-[12.5px] text-faint">·  让 AI 帮你做完</span>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                        v-for="f in [{ key: 'active', label: '进行中', n: counts.active }, { key: 'all', label: '全部', n: counts.all }, { key: 'done', label: '已完成', n: counts.done }]"
                        :key="f.key"
                        class="filter-pill cursor-pointer rounded-full border-0 px-3 py-1 text-[12.5px] transition-colors"
                        :class="filter === f.key ? 'is-active' : ''"
                        @click="filter = f.key">
                        {{ f.label }}
                        <span class="ml-1 text-[11px] opacity-70">{{ f.n }}</span>
                    </button>
                </div>
            </header>

            <div class="composer mx-8 mb-2 flex flex-none items-center gap-2 rounded-[14px] bg-card px-3 py-2 transition-colors max-md:mx-3">
                <span class="msi text-muted" style="font-size:20px">add</span>
                <input
                    ref="inputRef"
                    v-model="newTitle"
                    @keydown.enter="addTodo"
                    placeholder="加一条待办,回车确认"
                    class="composer-input min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[14.5px] text-ink outline-none"
                />
                <button
                    class="cursor-pointer rounded-full border-0 bg-blue-bg px-4 py-1.5 text-[13px] font-medium text-blue-fg transition-colors hover:enabled:bg-blue-soft disabled:cursor-default disabled:opacity-50"
                    :disabled="!newTitle.trim()" @click="addTodo">
                    添加
                </button>
            </div>

            <div v-if="error" class="mx-8 mb-2 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-3"
                 style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                {{ error }}
            </div>

            <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-1 max-md:px-3 max-md:pb-10">
                <div v-if="loading && !todos.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                    <span class="msi" style="font-size:30px;color:var(--color-faint)">hourglass_empty</span>
                    <div class="text-[14px]">加载中…</div>
                </div>
                <div v-else-if="!tree.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                    <span class="msi" style="font-size:34px;color:var(--color-faint)">checklist</span>
                    <div class="text-[14px]">{{ counts.all === 0 ? '还没有待办' : '这个筛选下没有内容' }}</div>
                    <div class="text-[12px] text-faint">{{ counts.all === 0 ? '在上面输入第一条试试' : '换个筛选试试' }}</div>
                </div>

                <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
                    <li v-for="{ parent: t, kids, allKids } in tree" :key="t.id" class="flex flex-col">
                        <!-- Parent row -->
                        <div class="item parent-row group/item flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 transition-colors hover:bg-bg-hi max-md:gap-2.5 max-md:px-3 max-md:py-2"
                             :class="{ 'is-pinned': t.pinned, 'has-active-task': liveStatusFor(t) === 'running' || liveStatusFor(t) === 'pending' }">
                            <button
                                class="grid h-[22px] w-[22px] flex-none cursor-pointer place-items-center rounded-full border-[1.5px] border-line-hi bg-transparent text-white transition-colors hover:border-accent"
                                :class="{ '!border-accent !bg-accent': t.done }"
                                @click="toggleDone(t)">
                                <span class="msi xs" v-if="t.done">check</span>
                            </button>

                            <button v-if="allKids.length"
                                class="caret grid h-[20px] w-[20px] flex-none cursor-pointer place-items-center rounded border-0 bg-transparent text-faint transition-transform hover:text-ink"
                                :class="{ 'is-open': expanded.has(t.id) }"
                                @click="toggleExpand(t)" title="展开/折叠子任务">
                                <span class="msi xs">chevron_right</span>
                            </button>
                            <span v-else class="caret-spacer flex-none" style="width:20px"></span>

                            <div class="min-w-0 flex-1">
                                <div class="t-title break-words text-[14.5px] text-ink"
                                     :class="{ 'text-faint line-through': t.done }">
                                    {{ t.title }}
                                </div>
                                <div v-if="liveStatusFor(t) || allKids.length" class="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                                    <button v-if="statusMeta(liveStatusFor(t))"
                                        class="status-pill inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-2 py-px text-[11.5px] font-medium"
                                        :style="{ color: statusMeta(liveStatusFor(t)).color, background: `color-mix(in srgb, ${statusMeta(liveStatusFor(t)).color} 12%, transparent)` }"
                                        @click="openDrawer(t)" title="查看 AI 工作日志">
                                        <span v-if="statusMeta(liveStatusFor(t)).dot" class="status-dot animate-status-pulse h-1.5 w-1.5 rounded-full"
                                              :style="{ background: statusMeta(liveStatusFor(t)).color }"></span>
                                        <span v-else class="msi" style="font-size:13px">{{ liveStatusFor(t) === 'done' ? 'check_circle' : (liveStatusFor(t) === 'error' ? 'error' : 'cancel') }}</span>
                                        {{ statusMeta(liveStatusFor(t)).label }}
                                    </button>
                                    <span v-if="allKids.length" class="inline-flex items-center gap-1 text-faint">
                                        <span class="msi" style="font-size:14px">account_tree</span>
                                        {{ allKids.filter(k => k.done).length }}/{{ allKids.length }}
                                    </span>
                                </div>
                            </div>

                            <div class="flex flex-none items-center gap-px">
                                <button v-if="liveStatusFor(t) === 'running' || liveStatusFor(t) === 'pending'"
                                    class="hover-only is-on grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:!text-bad"
                                    title="停止 AI"
                                    @click="stopTask(t)">
                                    <span class="msi sm">stop_circle</span>
                                </button>
                                <button v-else
                                    class="hover-only grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-accent"
                                    :title="t.taskId ? '让 AI 再跑一次' : '让 AI 帮你做'"
                                    @click="runWithAi(t)">
                                    <span class="msi sm">auto_awesome</span>
                                </button>
                                <button
                                    class="hover-only grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-accent disabled:cursor-default disabled:opacity-50"
                                    :class="{ 'is-on !text-accent': decomposing.has(t.id) }"
                                    :disabled="decomposing.has(t.id)"
                                    title="AI 拆分子任务"
                                    @click="decompose(t)">
                                    <span class="msi sm" :class="{ spin: decomposing.has(t.id) }">{{ decomposing.has(t.id) ? 'progress_activity' : 'fork_right' }}</span>
                                </button>
                                <button
                                    class="hover-only grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-accent"
                                    title="加一条子任务"
                                    @click="openInlineSubtask(t)">
                                    <span class="msi sm">subdirectory_arrow_right</span>
                                </button>
                                <button
                                    class="hover-only grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-accent"
                                    :class="{ 'is-on !text-accent': t.pinned }"
                                    :title="t.pinned ? '取消置顶' : '置顶'"
                                    @click="togglePinned(t)">
                                    <span class="msi sm" :class="{ filled: t.pinned }">push_pin</span>
                                </button>
                                <button
                                    class="hover-only grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-bad"
                                    title="删除"
                                    @click="removeTodo(t)">
                                    <span class="msi sm">close</span>
                                </button>
                            </div>
                        </div>

                        <!-- Children -->
                        <ul v-if="(allKids.length && expanded.has(t.id)) || startInlineSubtask === t.id"
                            class="m-0 mt-1 ml-[26px] flex list-none flex-col gap-1 border-l border-line p-0 pl-3 max-md:ml-4">
                            <li v-for="k in kids" :key="k.id"
                                class="item child-row group/item flex items-center gap-3 rounded-[12px] px-3 py-2 transition-colors hover:bg-bg-hi"
                                :class="{ 'has-active-task': liveStatusFor(k) === 'running' || liveStatusFor(k) === 'pending' }">
                                <button
                                    class="grid h-[20px] w-[20px] flex-none cursor-pointer place-items-center rounded-full border-[1.5px] border-line-hi bg-transparent text-white transition-colors hover:border-accent"
                                    :class="{ '!border-accent !bg-accent': k.done }"
                                    @click="toggleDone(k)">
                                    <span class="msi xs" v-if="k.done">check</span>
                                </button>
                                <div class="min-w-0 flex-1">
                                    <div class="break-words text-[13.5px] text-ink"
                                         :class="{ 'text-faint line-through': k.done }">
                                        {{ k.title }}
                                    </div>
                                    <button v-if="statusMeta(liveStatusFor(k))"
                                        class="status-pill mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-2 py-px text-[11px] font-medium"
                                        :style="{ color: statusMeta(liveStatusFor(k)).color, background: `color-mix(in srgb, ${statusMeta(liveStatusFor(k)).color} 12%, transparent)` }"
                                        @click="openDrawer(k)" title="查看 AI 工作日志">
                                        <span v-if="statusMeta(liveStatusFor(k)).dot" class="status-dot animate-status-pulse h-1.5 w-1.5 rounded-full"
                                              :style="{ background: statusMeta(liveStatusFor(k)).color }"></span>
                                        <span v-else class="msi" style="font-size:12px">{{ liveStatusFor(k) === 'done' ? 'check_circle' : (liveStatusFor(k) === 'error' ? 'error' : 'cancel') }}</span>
                                        {{ statusMeta(liveStatusFor(k)).label }}
                                    </button>
                                </div>
                                <div class="flex flex-none items-center gap-px">
                                    <button v-if="liveStatusFor(k) === 'running' || liveStatusFor(k) === 'pending'"
                                        class="hover-only is-on grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:!text-bad"
                                        title="停止 AI"
                                        @click="stopTask(k)">
                                        <span class="msi sm">stop_circle</span>
                                    </button>
                                    <button v-else
                                        class="hover-only grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-accent"
                                        :title="k.taskId ? '让 AI 再跑一次' : '让 AI 帮你做'"
                                        @click="runWithAi(k)">
                                        <span class="msi sm">auto_awesome</span>
                                    </button>
                                    <button
                                        class="hover-only grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-bad"
                                        title="删除"
                                        @click="removeTodo(k)">
                                        <span class="msi sm">close</span>
                                    </button>
                                </div>
                            </li>

                            <!-- Inline subtask composer -->
                            <li v-if="startInlineSubtask === t.id"
                                class="flex items-center gap-3 rounded-[12px] bg-card px-3 py-2">
                                <span class="msi text-muted" style="font-size:18px">add</span>
                                <input
                                    ref="subInputRef"
                                    v-model="newSubtitle"
                                    @keydown.enter="submitSubtask(t)"
                                    @keydown.esc="startInlineSubtask = null"
                                    @blur="onSubInputBlur"
                                    placeholder="加一条子任务,回车确认"
                                    class="composer-input min-w-0 flex-1 border-0 bg-transparent py-1 text-[13.5px] text-ink outline-none"
                                />
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>

        <!-- AI work-log drawer -->
        <transition name="drawer">
            <aside v-if="drawerTodo" class="drawer flex w-[420px] flex-none flex-col border-l border-line bg-bg-elev max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:z-20 max-md:w-[88vw]">
                <header class="flex flex-none items-center gap-2 border-b border-line px-4 py-3">
                    <span class="msi text-accent" style="font-size:18px">auto_awesome</span>
                    <div class="min-w-0 flex-1">
                        <div class="text-[12px] text-faint">AI 工作日志</div>
                        <div class="truncate text-[13.5px] text-ink">{{ drawerTodo.title }}</div>
                    </div>
                    <button class="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                        @click="closeDrawer" title="关闭">
                        <span class="msi sm">close</span>
                    </button>
                </header>

                <div class="min-h-0 flex-1 overflow-auto px-4 py-3">
                    <div v-if="!drawerTodo.taskId" class="flex flex-col items-center gap-2 py-12 text-muted">
                        <span class="msi" style="font-size:30px;color:var(--color-faint)">auto_awesome</span>
                        <div class="text-[13.5px]">还没让 AI 跑过这条</div>
                        <button class="mt-2 inline-flex items-center gap-1.5 rounded-full border-0 bg-blue-bg px-3 py-1.5 text-[12.5px] font-medium text-blue-fg transition-colors hover:bg-blue-soft"
                            @click="runWithAi(drawerTodo)">
                            <span class="msi sm">play_arrow</span>
                            让 AI 开始
                        </button>
                    </div>

                    <template v-else>
                        <div class="mb-3 flex flex-wrap items-center gap-2">
                            <span v-if="drawerTaskDetail" class="rounded-md border border-line bg-bg-elev px-1.5 py-px text-[10.5px] font-medium uppercase tracking-[0.04em] text-ink">#{{ drawerTaskDetail.id }}</span>
                            <span v-if="drawerTaskDetail" class="text-[11.5px] text-muted">{{ drawerTaskDetail.mode }}</span>
                            <span v-if="statusMeta(drawerTaskDetail?.status)"
                                class="inline-flex items-center gap-1.5 text-[12px] font-medium"
                                :style="{ color: statusMeta(drawerTaskDetail.status).color }">
                                <span class="h-1.5 w-1.5 rounded-full"
                                      :class="{ 'animate-status-pulse': drawerTaskDetail.status === 'running' || drawerTaskDetail.status === 'pending' }"
                                      :style="{ background: statusMeta(drawerTaskDetail.status).color }"></span>
                                {{ statusMeta(drawerTaskDetail.status).label }}
                            </span>
                            <span v-if="drawerTaskDetail?.created_at" class="text-[11.5px] text-faint">{{ fmtTime(drawerTaskDetail.created_at) }}</span>
                            <button v-if="drawerTaskDetail && (drawerTaskDetail.status === 'running' || drawerTaskDetail.status === 'pending')"
                                class="ml-auto inline-flex items-center gap-1 rounded-full border border-line-hi bg-transparent px-2 py-0.5 text-[11.5px] text-muted transition-colors hover:border-bad hover:text-bad"
                                @click="stopTask(drawerTodo)">
                                <span class="msi xs">stop_circle</span>
                                停止
                            </button>
                        </div>

                        <div v-if="drawerTaskDetail?.error" class="mb-3 rounded-lg px-3 py-2 text-[12.5px] text-bad"
                             style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                            {{ drawerTaskDetail.error }}
                        </div>

                        <div v-if="drawerTaskDetail?.response" class="mb-3 rounded-lg border border-line bg-bg-elev px-3 py-2.5 text-[13px] leading-[1.6] text-ink whitespace-pre-wrap break-words">
                            {{ drawerTaskDetail.response }}
                        </div>

                        <div class="mb-2 text-[10.5px] font-medium uppercase tracking-wider text-faint">消息流 · {{ drawerMessages.length }}</div>
                        <div v-if="!drawerMessages.length && drawerLoading" class="text-[12.5px] text-muted">加载中…</div>
                        <div v-else-if="!drawerMessages.length" class="text-[12.5px] text-muted">还没有消息</div>
                        <ol v-else class="m-0 flex list-none flex-col gap-2 p-0">
                            <li v-for="row in drawerMessages" :key="row.id"
                                class="rounded-lg border border-line bg-bg-elev px-3 py-2">
                                <div class="mb-1 flex items-center gap-2 text-[11px] text-faint">
                                    <span class="font-medium text-ink">{{ messageRoleLabel(row.message?.role) }}</span>
                                    <span>#{{ row.id }}</span>
                                </div>
                                <template v-if="row.message?.tool_calls?.length">
                                    <div class="mb-1 text-[12px] text-muted">
                                        调用 <span class="font-mono text-ink">{{ toolCallName(row.message) }}</span>
                                    </div>
                                    <pre class="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-[1.5] text-muted">{{ toolCallArgs(row.message) }}</pre>
                                </template>
                                <div v-if="messageText(row.message)"
                                     class="whitespace-pre-wrap break-words text-[12.5px] leading-[1.55] text-muted">
                                    {{ messageText(row.message) }}
                                </div>
                            </li>
                        </ol>
                    </template>
                </div>

                <footer v-if="drawerTodo.taskId && drawerTaskDetail && drawerTaskDetail.status === 'done' && !drawerTodo.done"
                    class="flex flex-none items-center gap-2 border-t border-line px-4 py-3">
                    <span class="text-[12px] text-faint">满意了?</span>
                    <button class="ml-auto inline-flex items-center gap-1.5 rounded-full border-0 bg-green-bg px-3 py-1.5 text-[12.5px] font-medium text-green-fg transition-colors hover:bg-green-soft"
                        @click="toggleDone(drawerTodo)">
                        <span class="msi sm">check</span>
                        标记完成
                    </button>
                </footer>
            </aside>
        </transition>
    </div>
</template>

<style scoped>
.composer:focus-within { background: var(--color-card-hi); }
.composer-input::placeholder { color: var(--color-faint); }

/* Filter pills */
.filter-pill { background: transparent; color: var(--color-muted); }
.filter-pill:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.filter-pill.is-active { background: var(--color-bg-hi); color: var(--color-ink); }

/* Pinned tint */
.item.is-pinned { background: color-mix(in srgb, var(--color-accent) 6%, transparent); }
.item.is-pinned:hover { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }

/* When a parent has an AI task running, paint a subtle accent left border. */
.parent-row.has-active-task { box-shadow: inset 3px 0 0 0 var(--color-accent); }
.child-row.has-active-task  { box-shadow: inset 2px 0 0 0 var(--color-accent); }

/* Caret rotate */
.caret { transition: transform .18s ease; }
.caret.is-open { transform: rotate(90deg); }

/* hover-only buttons */
.hover-only { opacity: 0; transition: opacity .15s, color .15s, background .15s; }
.item:hover .hover-only,
.hover-only.is-on { opacity: 1; }
@media (max-width: 768px) { .hover-only { opacity: 1; } }

/* Status pulse */
.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

/* Spinner */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Drawer transitions */
.drawer-enter-from { transform: translateX(100%); opacity: 0; }
.drawer-enter-active, .drawer-leave-active { transition: transform .22s ease, opacity .22s ease; }
.drawer-leave-to { transform: translateX(100%); opacity: 0; }
</style>
