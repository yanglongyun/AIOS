<script setup>
import AppLauncher from '@/components/AppLauncher.vue';
import TodoRow from './components/TodoRow.vue';
import { ref, computed, onMounted, onUnmounted, nextTick, watch, watchEffect } from 'vue';
import { useQuickChatStore } from '@/stores/quickChat';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

const qc = useQuickChatStore();
const route = useRoute();
const router = useRouter();

const view = computed(() => route.params.p1 ? 'detail' : 'list');
const routeId = computed(() => Number(route.params.p1) || null);

const goList   = () => router.push('/app/todo');
const goDetail = (id) => router.push(`/app/todo/${id}`);

// ---- Data --------------------------------------------------------------
const todos        = ref([]);
const loading      = ref(false);
const error        = ref('');
const newTitle     = ref('');
const inputRef     = ref(null);
const showDone     = ref(false);

const TERMINAL = new Set(['done', 'aborted', 'error']);
const ACTIVE   = new Set(['pending', 'running']);

// status meta keyed by status code; tone maps to one of accent/good/bad/muted
const STATUS_META = {
    pending: { tone: 'accent', dot: true,  labelKey: '__T_TODO_STATUS_PENDING__' },
    running: { tone: 'accent', dot: true,  labelKey: '__T_TODO_STATUS_RUNNING__' },
    done:    { tone: 'good',   icon: 'check_circle',  labelKey: '__T_TODO_STATUS_DONE__'    },
    aborted: { tone: 'muted',  icon: 'cancel',         labelKey: '__T_TODO_STATUS_ABORTED__' },
    error:   { tone: 'bad',    icon: 'error',          labelKey: '__T_TODO_STATUS_ERROR__'   },
};
const statusMeta = (s) => STATUS_META[s] || null;

const TONE_TEXT = { accent: 'text-accent', good: 'text-good', bad: 'text-bad', muted: 'text-muted' };
const TONE_BG   = { accent: 'bg-accent',   good: 'bg-good',   bad: 'bg-bad',   muted: 'bg-muted'  };
const TONE_SOFT = {
    accent: 'bg-blue-bg',
    good:   'bg-[color-mix(in_srgb,var(--color-good)_14%,transparent)]',
    bad:    'bg-[color-mix(in_srgb,var(--color-bad)_14%,transparent)]',
    muted:  'bg-bg-hi',
};

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

// ---- Status (live) -----------------------------------------------------
const liveStatus = ref(new Map());
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
const addTodo = async (titleOverride) => {
    const title = (titleOverride ?? newTitle.value).trim();
    if (!title) return;
    try {
        const data = await todoApi('/create', { method: 'POST', body: JSON.stringify({ title }) });
        todos.value.unshift(data.item);
        newTitle.value = '';
        await nextTick();
        inputRef.value?.focus();
    } catch (e) { error.value = e.message; }
};

const composerKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        addTodo();
    }
};

const useExample = (text) => { newTitle.value = text; nextTick(() => inputRef.value?.focus()); };

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
        todos.value = todos.value.filter((t) => t.id !== todo.id);
        if (routeId.value === todo.id) goList();
    } catch (e) { error.value = e.message; }
};
const updateNote = async (todo, value) => {
    if (todo.note === value) return;
    try {
        const data = await todoApi('/update', { method: 'POST', body: JSON.stringify({ id: todo.id, note: value }) });
        patchLocal(data.item);
    } catch (e) { error.value = e.message; }
};
const updateTitle = async (todo, value) => {
    const trimmed = (value || '').trim();
    if (!trimmed || todo.title === trimmed) return;
    try {
        const data = await todoApi('/update', { method: 'POST', body: JSON.stringify({ id: todo.id, title: trimmed }) });
        patchLocal(data.item);
    } catch (e) { error.value = e.message; }
};

const runTodo = async (todo) => {
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

// ---- Grouping ----------------------------------------------------------
const grouped = computed(() => {
    const running = [], pending = [], done = [];
    for (const t of todos.value) {
        if (t.done) done.push(t);
        else if (ACTIVE.has(liveStatusFor(t))) running.push(t);
        else pending.push(t);
    }
    return { running, pending, done };
});

// ---- Detail: AI run result ---------------------------------------------
const detailMessages = ref([]);
const detailTaskRow = ref(null);

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
let detailPoller = null;
onMounted(() => {
    fetchAll();
    nextTick(() => inputRef.value?.focus());
    listPoller = setInterval(() => { pollActiveTasks(); }, 3000);
    detailPoller = setInterval(() => {
        if (view.value !== 'detail') return;
        const cur = currentTodo.value;
        if (!cur?.taskId) return;
        const live = liveStatusFor(cur);
        if (!TERMINAL.has(live)) loadDetailRun();
    }, 2500);
});
onUnmounted(() => {
    if (listPoller) clearInterval(listPoller);
    if (detailPoller) clearInterval(detailPoller);
});

watch(routeId, () => {
    detailMessages.value = [];
    detailTaskRow.value = null;
    loadDetailRun();
});

const currentTodo = computed(() => routeId.value ? getTodo(routeId.value) : null);

watchEffect(() => {
    if (view.value === 'detail' && currentTodo.value) {
        const t = currentTodo.value;
        qc.setContext({
            scope: `todo:detail:${t.id}`,
            label: '__T_QC_LABEL_TODO_ITEM__'.replace('{title}', t.title || '__T_QC_UNTITLED__'),
            snapshot: [
                '__T_QC_FIELD_STATUS__'.replace('{value}', t.done ? '__T_QC_DONE__' : (liveStatusFor(t) || '__T_QC_PENDING__')),
                t.title ? '__T_QC_FIELD_TITLE__'.replace('{value}', t.title) : null,
                t.taskId ? '__T_QC_FIELD_RELATED_TASK__'.replace('{id}', t.taskId) : null,
                t.note ? '__T_QC_FIELD_REMARK__'.replace('{value}', String(t.note).slice(0, 300)) : null,
            ].filter(Boolean).join('\n'),
        });
    } else {
        const undone = todos.value.filter(t => !t.done);
        qc.setContext({
            scope: 'todo:list',
            label: '__T_QC_LABEL_TODO_ROOT__',
            snapshot: [
                '__T_QC_FIELD_COUNT_WITH_UNDONE__'
                    .replace('{count}', todos.value.length)
                    .replace('{undone}', undone.length),
                undone.length
                    ? '__T_QC_FIELD_UNDONE_LIST__'
                        .replace('{list}', undone.slice(0, 10).map(t => '- ' + (t.title || '__T_QC_UNTITLED__')).join('\n'))
                    : null,
            ].filter(Boolean).join('\n'),
        });
    }
});

// ---- Helpers -----------------------------------------------------------
const messageText = (msg) => msg?.content == null ? '' : String(msg.content);
const toolCallName = (msg) => msg?.tool_calls?.[0]?.function?.name || 'tool';
const toolCallArgs = (msg) => msg?.tool_calls?.[0]?.function?.arguments || '';
const messageRoleLabel = (r) => ({
    assistant: '__T_TODO_ROLE_ASSISTANT__',
    tool: '__T_TODO_ROLE_TOOL__',
    user: '__T_TODO_ROLE_USER__',
    system: '__T_TODO_ROLE_SYSTEM__',
})[r] || r;
</script>

<template>
    <div class="todo-shell flex h-full bg-bg">

        <!-- ============== LIST ============== -->
        <div v-if="view === 'list'" class="mx-auto flex h-full w-full min-w-0 max-w-[720px] flex-col">
            <header class="flex flex-none items-baseline gap-3 px-8 pb-4 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
                <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">__T_TODO_TITLE__</h1>
                <span class="font-mono text-[10px] text-faint tracking-wide">v.things-4</span>
                <AppLauncher class="ml-auto self-center" />
            </header>

            <!-- Composer -->
            <div class="composer-card mx-8 mb-4 flex flex-none items-end gap-2.5 px-4 py-3 max-md:mx-3 max-md:px-3.5">
                <span class="composer-glyph mt-1 grid h-6 w-6 flex-none place-items-center rounded-full">
                    <span class="msi" style="font-size:14px">add</span>
                </span>
                <textarea ref="inputRef" v-model="newTitle" @keydown="composerKeydown"
                    rows="1"
                    placeholder="__T_TODO_COMPOSER_PLACEHOLDER__"
                    class="composer-input min-w-0 flex-1 resize-none border-0 bg-transparent py-1 text-[15px] leading-[1.55] text-ink outline-none"></textarea>
                <button class="composer-btn cursor-pointer rounded-full border-0 px-4 py-1.5 text-[13px] font-semibold text-white transition-shadow disabled:cursor-default disabled:opacity-45"
                    :disabled="!newTitle.trim()" @click="addTodo()">__T_TODO_COMPOSER_SUBMIT__</button>
            </div>

            <div v-if="error" class="mx-8 mb-2 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-3"
                 style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">{{ error }}</div>

            <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-1 max-md:px-3 max-md:pb-10">
                <!-- Loading skeleton -->
                <div v-if="loading && !todos.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                    <span class="msi text-faint" style="font-size:30px">hourglass_empty</span>
                    <div class="text-[14px]">__T_TODO_LOADING__</div>
                </div>

                <!-- Empty state with examples -->
                <div v-else-if="!todos.length" class="mx-auto mt-6 max-w-[520px]">
                    <div class="flex flex-col items-center gap-2 pt-6 pb-4 text-muted">
                        <span class="msi text-faint" style="font-size:34px">checklist</span>
                        <div class="text-[15px] text-ink">__T_TODO_EMPTY_TITLE__</div>
                        <div class="text-[12.5px] text-faint">__T_TODO_EMPTY_HINT__</div>
                    </div>
                    <div class="mt-2 flex flex-col gap-2">
                        <button v-for="ex in ['__T_TODO_EMPTY_EXAMPLE_1__', '__T_TODO_EMPTY_EXAMPLE_2__', '__T_TODO_EMPTY_EXAMPLE_3__']"
                            :key="ex"
                            class="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-card-sub px-3.5 py-2.5 text-left text-[13.5px] text-ink transition-colors hover:border-line-hi hover:bg-card"
                            @click="useExample(ex)">
                            <span class="msi text-faint group-hover:text-accent" style="font-size:18px">north_east</span>
                            <span class="flex-1">{{ ex }}</span>
                        </button>
                    </div>
                </div>

                <!-- Grouped lists -->
                <template v-else>
                    <!-- Running group -->
                    <section v-if="grouped.running.length" class="mb-5">
                        <div class="section-h text-accent">
                            <span class="h-1.5 w-1.5 rounded-full bg-accent animate-status-pulse"></span>
                            __T_TODO_GROUP_RUNNING__
                            <span class="ct">{{ grouped.running.length }}</span>
                        </div>
                        <ul class="todo-card m-0 flex list-none flex-col p-0">
                            <TodoRow v-for="t in grouped.running" :key="t.id"
                                :t="t" :live="liveStatusFor(t)" :meta="statusMeta(liveStatusFor(t))"
                                :tone-text="TONE_TEXT" :tone-bg="TONE_BG"
                                :is-active="ACTIVE.has(liveStatusFor(t))"
                                @open="goDetail(t.id)" @toggle-done="toggleDone($event)"
                                @run="runTodo($event)" @stop="stopTask($event)"
                                @toggle-pinned="togglePinned($event)" @remove="removeTodo($event)" />
                        </ul>
                    </section>

                    <!-- Pending group -->
                    <section v-if="grouped.pending.length" class="mb-5">
                        <div v-if="grouped.running.length || grouped.done.length" class="section-h">
                            <span class="msi text-faint" style="font-size:14px">radio_button_unchecked</span>
                            __T_TODO_GROUP_PENDING__
                            <span class="ct">{{ grouped.pending.length }}</span>
                        </div>
                        <ul class="todo-card m-0 flex list-none flex-col p-0">
                            <TodoRow v-for="t in grouped.pending" :key="t.id"
                                :t="t" :live="liveStatusFor(t)" :meta="statusMeta(liveStatusFor(t))"
                                :tone-text="TONE_TEXT" :tone-bg="TONE_BG"
                                :is-active="false"
                                @open="goDetail(t.id)" @toggle-done="toggleDone($event)"
                                @run="runTodo($event)" @stop="stopTask($event)"
                                @toggle-pinned="togglePinned($event)" @remove="removeTodo($event)" />
                        </ul>
                    </section>

                    <!-- Done group (collapsible) -->
                    <section v-if="grouped.done.length">
                        <button class="section-h section-h-btn"
                            @click="showDone = !showDone">
                            <span class="msi" style="font-size:15px">{{ showDone ? 'expand_more' : 'chevron_right' }}</span>
                            <span>{{ showDone
                                ? '__T_TODO_GROUP_HIDE_DONE__'
                                : '__T_TODO_GROUP_SHOW_DONE__'.replace('{count}', grouped.done.length) }}</span>
                        </button>
                        <ul v-if="showDone" class="todo-card m-0 flex list-none flex-col p-0">
                            <TodoRow v-for="t in grouped.done" :key="t.id"
                                :t="t" :live="liveStatusFor(t)" :meta="statusMeta(liveStatusFor(t))"
                                :tone-text="TONE_TEXT" :tone-bg="TONE_BG"
                                :is-active="false"
                                @open="goDetail(t.id)" @toggle-done="toggleDone($event)"
                                @run="runTodo($event)" @stop="stopTask($event)"
                                @toggle-pinned="togglePinned($event)" @remove="removeTodo($event)" />
                        </ul>
                    </section>

                    <!-- Bottom tip -->
                    <div class="tip-card">
                        <span class="ic">💡</span>
                        <span>给重要的事点亮 ⭐ 自动置顶。点开任意一条，可以补充说明、查看运行记录、再让 AI 处理一次。</span>
                    </div>
                </template>
            </div>
        </div>

        <!-- ============== DETAIL ============== -->
        <div v-else-if="view === 'detail' && currentTodo" class="mx-auto flex h-full w-full min-w-0 max-w-[720px] flex-col">
            <header class="flex flex-none items-center gap-1 px-8 pb-2 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
                <button class="grid h-9 w-9 flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                    @click="goList" :title="'__T_TODO_BACK__'">
                    <span class="msi" style="font-size:20px">arrow_back</span>
                </button>
                <div class="ml-auto flex items-center gap-1">
                    <button class="header-icon"
                        :class="{ 'is-on': currentTodo.pinned }"
                        @click="togglePinned(currentTodo)"
                        :title="currentTodo.pinned ? '__T_TODO_ACTION_UNPIN__' : '__T_TODO_ACTION_PIN__'">
                        <span class="msi" :class="{ filled: currentTodo.pinned }" style="font-size:18px">{{ currentTodo.pinned ? 'star' : 'star_outline' }}</span>
                    </button>
                    <button class="header-icon hover-bad" @click="removeTodo(currentTodo)" :title="'__T_TODO_ACTION_DELETE__'">
                        <span class="msi" style="font-size:18px">delete_outline</span>
                    </button>
                </div>
                <AppLauncher class="flex-none" />
            </header>

            <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-2 max-md:px-4 max-md:pb-10">

                <!-- Title (the brief) -->
                <input :value="currentTodo.title"
                    @blur="(e) => updateTitle(currentTodo, e.target.value)"
                    class="detail-title m-0 mb-2 block w-full border-0 bg-transparent p-0 text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink outline-none max-md:text-[22px]"
                    :class="{ 'text-muted line-through': currentTodo.done }" />

                <!-- Status meta line -->
                <div v-if="statusMeta(liveStatusFor(currentTodo))" class="mb-4 inline-flex items-center gap-1.5 status-pill"
                    :class="['tone-' + statusMeta(liveStatusFor(currentTodo)).tone]">
                    <span v-if="statusMeta(liveStatusFor(currentTodo)).dot"
                        class="h-1.5 w-1.5 rounded-full animate-status-pulse"
                        :class="TONE_BG[statusMeta(liveStatusFor(currentTodo)).tone]"></span>
                    <span v-else class="msi" style="font-size:13px">{{ statusMeta(liveStatusFor(currentTodo)).icon }}</span>
                    {{ statusMeta(liveStatusFor(currentTodo)).labelKey }}
                </div>

                <!-- Hero run card: 把"会被 AI 处理"这件事讲清楚 -->
                <div class="run-card mb-7" :class="{ 'is-active': ACTIVE.has(liveStatusFor(currentTodo)) }">
                    <div class="run-card-body">
                        <div class="run-card-title">
                            <span v-if="ACTIVE.has(liveStatusFor(currentTodo))">__T_TODO_RESULT_RUNNING__</span>
                            <span v-else-if="currentTodo.taskId">这条之前 AI 已经处理过</span>
                            <span v-else>这条会交给 AI 来做</span>
                        </div>
                        <div class="run-card-sub">
                            <span v-if="ACTIVE.has(liveStatusFor(currentTodo))">下方会实时显示进展</span>
                            <span v-else-if="currentTodo.done">已标记完成</span>
                            <span v-else-if="currentTodo.taskId">想让它再做一次,或者改改说明再来一次</span>
                            <span v-else>点右边按钮,AI 会基于标题和说明开始处理</span>
                        </div>
                    </div>
                    <button v-if="ACTIVE.has(liveStatusFor(currentTodo))"
                        class="run-btn is-stop"
                        @click="stopTask(currentTodo)">
                        <span class="msi" style="font-size:22px">stop_circle</span>
                        <span>__T_TODO_ACTION_STOP__</span>
                    </button>
                    <button v-else
                        class="run-btn is-go"
                        :disabled="currentTodo.done"
                        @click="runTodo(currentTodo)">
                        <span class="msi" style="font-size:22px">play_circle</span>
                        <span>{{ currentTodo.taskId ? '__T_TODO_ACTION_RUN_AGAIN__' : '__T_TODO_ACTION_RUN__' }}</span>
                    </button>
                </div>

                <!-- Mark complete toggle (smaller, below hero) -->
                <div class="mb-7">
                    <button class="action-chip"
                        :class="{ 'is-on': currentTodo.done }"
                        @click="toggleDone(currentTodo)">
                        <span class="msi" style="font-size:16px">{{ currentTodo.done ? 'check_circle' : 'radio_button_unchecked' }}</span>
                        {{ currentTodo.done ? '__T_TODO_ACTION_COMPLETED__' : '__T_TODO_ACTION_COMPLETE__' }}
                    </button>
                </div>

                <!-- Note -->
                <section class="mb-7">
                    <div class="section-label">__T_TODO_SECTION_NOTE__</div>
                    <textarea
                        :value="currentTodo.note"
                        @change="(e) => updateNote(currentTodo, e.target.value)"
                        placeholder="__T_TODO_NOTE_PLACEHOLDER__"
                        class="note-textarea w-full resize-y rounded-[12px] border border-line bg-card px-3.5 py-3 text-[13.5px] leading-[1.65] text-ink outline-none transition-colors focus:border-accent focus:bg-card-hi"
                        style="min-height: 92px;"></textarea>
                </section>

                <!-- Result -->
                <section>
                    <div class="section-label">__T_TODO_SECTION_RESULT__</div>

                    <div v-if="!currentTodo.taskId"
                        class="rounded-[12px] border border-dashed border-line px-4 py-10 text-center text-[12.5px] text-faint">
                        __T_TODO_RESULT_EMPTY__
                    </div>

                    <div v-else class="flex flex-col gap-3">
                        <div v-if="detailTaskRow?.error" class="rounded-[10px] px-3 py-2 text-[13px] text-bad"
                            style="background: color-mix(in srgb, var(--color-bad) 12%, transparent)">{{ detailTaskRow.error }}</div>

                        <div v-if="detailTaskRow?.response"
                            class="md rounded-[12px] border border-line bg-card px-4 py-3.5 text-[13.5px] leading-[1.65] text-ink break-words"
                            v-html="renderMd(detailTaskRow.response)"></div>
                        <div v-else-if="!TERMINAL.has(detailTaskRow?.status)"
                            class="flex items-center gap-2 rounded-[12px] border border-dashed border-line px-4 py-6 text-[12.5px] text-faint">
                            <span class="h-1.5 w-1.5 rounded-full bg-accent animate-status-pulse"></span>
                            __T_TODO_RESULT_RUNNING__
                        </div>

                        <details v-if="detailMessages.length" class="rounded-[12px] border border-line bg-bg-elev">
                            <summary class="cursor-pointer select-none list-none px-3.5 py-2 text-[12px] text-muted hover:text-ink">
                                <span class="msi align-[-2px]" style="font-size:14px">unfold_more</span>
                                __T_TODO_RESULT_LOG__
                                <span class="text-faint">·  {{ '__T_TODO_RESULT_LOG_COUNT__'.replace('{count}', detailMessages.length) }}</span>
                            </summary>
                            <div class="flex flex-col gap-2 px-3 pb-3 pt-1">
                                <div v-for="row in detailMessages" :key="row.id" class="rounded-lg border border-line bg-bg px-3 py-2">
                                    <div class="mb-1 flex items-center gap-2 text-[11px] text-faint">
                                        <span class="font-medium text-ink">{{ messageRoleLabel(row.message?.role) }}</span>
                                        <span v-if="row.message?.tool_calls?.length">·  {{ '__T_TODO_ROLE_TOOL_CALL__'.replace('{name}', toolCallName(row.message)) }}</span>
                                    </div>
                                    <pre v-if="row.message?.tool_calls?.length"
                                        class="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-[1.5] text-muted">{{ toolCallArgs(row.message) }}</pre>
                                    <div v-if="messageText(row.message)"
                                        class="whitespace-pre-wrap break-words text-[12.5px] leading-[1.55] text-muted">{{ messageText(row.message) }}</div>
                                </div>
                            </div>
                        </details>
                    </div>
                </section>
            </div>
        </div>

        <div v-else class="flex h-full w-full items-center justify-center text-muted">
            <span class="msi mr-2" style="font-size:20px">hourglass_empty</span>__T_TODO_LOADING__
        </div>
    </div>
</template>

<style scoped>
/* Things-3-ish palette: 暖白底 + 温和蓝 accent + 软阴影。
   仅作用于 todo app，借此达成「友好的桌面文具」气质。 */
.todo-shell {
    --color-bg:        #fbfbfa;
    --color-bg-elev:   #ffffff;
    --color-bg-hi:     #f3f3f0;
    --color-card:      #ffffff;
    --color-card-hi:   #fbfbfa;
    --color-card-sub:  #fbfbf6;
    --color-line:      #ebebe6;
    --color-line-hi:   #d8d8d2;
    --color-ink:       #1c1c1a;
    --color-muted:     #7a7a72;
    --color-faint:     #b0b0a8;
    --color-accent:    #2563eb;
    --color-accent-hi: #1d4ed8;
    --color-blue-bg:   #dbeafe;
    --color-blue-soft: #bfdbfe;
    --color-blue-fg:   #1e40af;
    --color-good:      #1a8a4a;
    --color-bad:       #b91c1c;
    --color-warm:      #fef9ec;
    color: var(--color-ink);
    background: var(--color-bg);
}

.composer-input::placeholder { color: var(--color-faint); }

.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

/* Composer: 像浮在桌面上的便签条 */
.composer-card {
    background: var(--color-card);
    border: 1px solid var(--color-line);
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.025);
    transition: box-shadow .15s, border-color .15s;
}
.composer-card:focus-within {
    border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-line));
    box-shadow: 0 1px 3px rgba(0,0,0,0.03),
                0 4px 14px rgba(0,0,0,0.04),
                0 0 0 4px color-mix(in srgb, var(--color-accent) 12%, transparent);
}
.composer-glyph {
    background: var(--color-bg-hi);
    color: var(--color-faint);
    transition: background .15s, color .15s;
}
.composer-card:focus-within .composer-glyph {
    background: var(--color-blue-bg);
    color: var(--color-accent);
}
.composer-btn {
    background: var(--color-accent);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--color-accent) 35%, transparent);
}
.composer-btn:hover:not(:disabled) {
    background: var(--color-accent-hi);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--color-accent) 45%, transparent);
}

/* Section header — 友好型小字标签，不再大写堆 letter-spacing */
.section-h {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin: 14px 4px 8px;
    color: var(--color-muted);
    font-size: 12.5px;
    font-weight: 600;
}
.section-h .ct {
    color: var(--color-faint);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}
.section-h-btn {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 6px;
    transition: color .12s, background .12s;
}
.section-h-btn:hover { color: var(--color-ink); background: var(--color-bg-hi); }

/* List card — 一组 row 共享一张卡片，分隔线在 TodoRow 内自带 */
.todo-card {
    background: var(--color-card);
    border: 1px solid var(--color-line);
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.04);
    overflow: hidden;
}

/* 底部提示卡 —— 暖纸黄，营造"小贴士"气质 */
.tip-card {
    margin-top: 26px;
    padding: 14px 16px;
    background: var(--color-warm);
    border: 1px dashed color-mix(in srgb, #d4a72c 35%, transparent);
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--color-muted);
    font-size: 12.5px;
    line-height: 1.55;
}
.tip-card .ic { font-size: 18px; flex: none; }

.section-label {
    margin-bottom: 8px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-faint);
}

/* Detail page status pill (reuse Things-y pill from row) */
.status-pill {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
}
.status-pill.tone-accent { background: var(--color-blue-bg); color: var(--color-blue-fg); }
.status-pill.tone-good   { background: color-mix(in srgb, var(--color-good) 14%, transparent); color: var(--color-good); }
.status-pill.tone-bad    { background: color-mix(in srgb, var(--color-bad) 12%, transparent); color: var(--color-bad); }
.status-pill.tone-muted  { background: var(--color-bg-hi); color: var(--color-muted); }

/* Header small icon buttons */
.header-icon {
    display: grid; place-items: center;
    height: 36px; width: 36px;
    border: 0; border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
    transition: background .12s, color .12s;
}
.header-icon:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.header-icon.hover-bad:hover { color: var(--color-bad); }
.header-icon.is-on { color: #d4a72c; }
.header-icon.is-on:hover { color: #b8780a; background: color-mix(in srgb, #d4a72c 14%, transparent); }

/* Detail title input */
.detail-title::placeholder { color: var(--color-faint); }

/* Hero run card —— 把"会被运行"这事讲出来 */
.run-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 18px;
    background: var(--color-card);
    border: 1px solid var(--color-line);
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.04);
}
.run-card.is-active {
    border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-line));
    background: color-mix(in srgb, var(--color-blue-bg) 30%, var(--color-card));
}
.run-card-body { flex: 1; min-width: 0; }
.run-card-title {
    font-size: 14.5px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1.4;
}
.run-card-sub {
    margin-top: 2px;
    font-size: 12.5px;
    color: var(--color-muted);
    line-height: 1.45;
}
.run-btn {
    appearance: none; border: 0;
    display: inline-flex; align-items: center; gap: 8px;
    height: 44px;
    padding: 0 18px;
    border-radius: 999px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    flex: none;
    transition: background .14s, box-shadow .14s, transform .14s;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent);
}
.run-btn.is-go { background: var(--color-accent); }
.run-btn.is-go:hover:not(:disabled) {
    background: var(--color-accent-hi);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--color-accent) 45%, transparent);
}
.run-btn.is-go:disabled {
    background: var(--color-bg-hi);
    color: var(--color-faint);
    box-shadow: none;
    cursor: default;
}
.run-btn.is-stop {
    background: var(--color-bad);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--color-bad) 30%, transparent);
}
.run-btn.is-stop:hover {
    background: #991b1b;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--color-bad) 45%, transparent);
}

/* Secondary chip used in detail action bar */
.action-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
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
.action-chip.is-on {
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    color: var(--color-accent);
    border-color: transparent;
}
</style>
