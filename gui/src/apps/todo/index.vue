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
    <div class="flex h-full bg-bg">

        <!-- ============== LIST ============== -->
        <div v-if="view === 'list'" class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col">
            <header class="flex flex-none items-baseline gap-3 px-8 pb-4 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
                <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">__T_TODO_TITLE__</h1>
                <AppLauncher class="ml-auto self-center" />
            </header>

            <!-- Composer -->
            <div class="mx-8 mb-3 flex flex-none items-end gap-2 rounded-[16px] bg-card px-3.5 py-2.5 transition-colors focus-within:bg-card-hi max-md:mx-3">
                <span class="msi mt-1.5 text-faint" style="font-size:18px">auto_awesome</span>
                <textarea ref="inputRef" v-model="newTitle" @keydown="composerKeydown"
                    rows="1"
                    placeholder="__T_TODO_COMPOSER_PLACEHOLDER__"
                    class="composer-input min-w-0 flex-1 resize-none border-0 bg-transparent py-1.5 text-[14.5px] leading-[1.55] text-ink outline-none"></textarea>
                <button class="cursor-pointer rounded-full border-0 bg-blue-bg px-4 py-1.5 text-[13px] font-medium text-blue-fg transition-colors hover:bg-blue-soft disabled:cursor-default disabled:opacity-50"
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
                        <div class="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
                            <span class="h-1.5 w-1.5 rounded-full bg-accent animate-status-pulse"></span>
                            __T_TODO_GROUP_RUNNING__
                            <span class="font-normal text-faint">·  {{ grouped.running.length }}</span>
                        </div>
                        <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
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
                        <div v-if="grouped.running.length || grouped.done.length"
                            class="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                            __T_TODO_GROUP_PENDING__
                            <span class="font-normal">·  {{ grouped.pending.length }}</span>
                        </div>
                        <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
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
                        <button class="mb-1.5 flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint transition-colors hover:text-muted"
                            @click="showDone = !showDone">
                            <span class="msi" style="font-size:15px">{{ showDone ? 'expand_more' : 'chevron_right' }}</span>
                            <span>{{ showDone
                                ? '__T_TODO_GROUP_HIDE_DONE__'
                                : '__T_TODO_GROUP_SHOW_DONE__'.replace('{count}', grouped.done.length) }}</span>
                        </button>
                        <ul v-if="showDone" class="m-0 flex list-none flex-col gap-1.5 p-0">
                            <TodoRow v-for="t in grouped.done" :key="t.id"
                                :t="t" :live="liveStatusFor(t)" :meta="statusMeta(liveStatusFor(t))"
                                :tone-text="TONE_TEXT" :tone-bg="TONE_BG"
                                :is-active="false"
                                @open="goDetail(t.id)" @toggle-done="toggleDone($event)"
                                @run="runTodo($event)" @stop="stopTask($event)"
                                @toggle-pinned="togglePinned($event)" @remove="removeTodo($event)" />
                        </ul>
                    </section>
                </template>
            </div>
        </div>

        <!-- ============== DETAIL ============== -->
        <div v-else-if="view === 'detail' && currentTodo" class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col">
            <header class="flex flex-none items-center gap-3 px-8 pb-4 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
                <button class="grid h-9 w-9 flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                    @click="goList" :title="'__T_TODO_BACK__'">
                    <span class="msi" style="font-size:20px">arrow_back</span>
                </button>
                <input :value="currentTodo.title"
                    @blur="(e) => updateTitle(currentTodo, e.target.value)"
                    class="m-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-[26px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink outline-none max-md:text-[20px]"
                    :class="{ 'text-faint line-through': currentTodo.done }" />
                <AppLauncher class="flex-none" />
            </header>

            <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-2 max-md:px-4 max-md:pb-10">

                <!-- Status pill -->
                <div v-if="statusMeta(liveStatusFor(currentTodo))"
                    class="mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                    :class="[
                        TONE_TEXT[statusMeta(liveStatusFor(currentTodo)).tone],
                        TONE_SOFT[statusMeta(liveStatusFor(currentTodo)).tone]
                    ]">
                    <span v-if="statusMeta(liveStatusFor(currentTodo)).dot"
                        class="h-1.5 w-1.5 rounded-full animate-status-pulse"
                        :class="TONE_BG[statusMeta(liveStatusFor(currentTodo)).tone]"></span>
                    <span v-else class="msi" style="font-size:14px">{{ statusMeta(liveStatusFor(currentTodo)).icon }}</span>
                    {{ statusMeta(liveStatusFor(currentTodo)).labelKey }}
                </div>

                <!-- Action bar -->
                <div class="mb-7 flex flex-wrap items-center gap-2 max-md:gap-1.5">
                    <!-- Primary: run / stop -->
                    <button v-if="ACTIVE.has(liveStatusFor(currentTodo))"
                        class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 px-4 text-[13px] font-medium text-bad transition-colors hover:opacity-90"
                        style="background:color-mix(in srgb,var(--color-bad) 14%,transparent)"
                        @click="stopTask(currentTodo)">
                        <span class="msi" style="font-size:18px">stop_circle</span>
                        __T_TODO_ACTION_STOP__
                    </button>
                    <button v-else
                        class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-blue-bg px-4 text-[13px] font-medium text-blue-fg transition-colors hover:bg-blue-soft disabled:cursor-default disabled:opacity-50"
                        :disabled="currentTodo.done"
                        @click="runTodo(currentTodo)">
                        <span class="msi" style="font-size:18px">auto_awesome</span>
                        {{ currentTodo.taskId ? '__T_TODO_ACTION_RUN_AGAIN__' : '__T_TODO_ACTION_RUN__' }}
                    </button>

                    <!-- Secondary chips -->
                    <button class="action-chip"
                        :class="{ 'is-on': currentTodo.done }"
                        @click="toggleDone(currentTodo)">
                        <span class="msi" style="font-size:16px">{{ currentTodo.done ? 'check_circle' : 'radio_button_unchecked' }}</span>
                        {{ currentTodo.done ? '__T_TODO_ACTION_COMPLETED__' : '__T_TODO_ACTION_COMPLETE__' }}
                    </button>
                    <button class="action-chip"
                        :class="{ 'is-on': currentTodo.pinned }"
                        @click="togglePinned(currentTodo)">
                        <span class="msi" :class="{ filled: currentTodo.pinned }" style="font-size:16px">push_pin</span>
                        {{ currentTodo.pinned ? '__T_TODO_ACTION_PINNED__' : '__T_TODO_ACTION_PIN__' }}
                    </button>
                    <button class="action-chip ml-auto hover:!text-bad" @click="removeTodo(currentTodo)">
                        <span class="msi" style="font-size:16px">delete_outline</span>
                        __T_TODO_ACTION_DELETE__
                    </button>
                </div>

                <!-- Note -->
                <section class="mb-7">
                    <div class="section-label">__T_TODO_SECTION_NOTE__</div>
                    <textarea
                        :value="currentTodo.note"
                        @change="(e) => updateNote(currentTodo, e.target.value)"
                        placeholder="__T_TODO_NOTE_PLACEHOLDER__"
                        class="w-full resize-y rounded-[12px] border-0 bg-card px-3.5 py-3 text-[13.5px] leading-[1.65] text-ink outline-none transition-colors focus:bg-card-hi"
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
                            class="md rounded-[12px] border border-line bg-card px-3.5 py-3 text-[13.5px] leading-[1.65] text-ink break-words"
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
.composer-input::placeholder { color: var(--color-faint); }

.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

.section-label {
    margin-bottom: 8px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-faint);
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
