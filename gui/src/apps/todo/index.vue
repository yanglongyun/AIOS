<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

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

// ---- Helpers -----------------------------------------------------------
const messageText = (msg) => msg?.content == null ? '' : String(msg.content);
const toolCallName = (msg) => msg?.tool_calls?.[0]?.function?.name || 'tool';
const toolCallArgs = (msg) => msg?.tool_calls?.[0]?.function?.arguments || '';
const messageRoleLabel = (r) => ({ assistant: 'AI', tool: '工具结果', user: '指令', system: '系统' }[r] || r);
</script>

<template>
    <div class="todo-root flex h-full bg-bg">

        <!-- ============== LIST ============== -->
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
                <div v-else-if="!todos.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                    <span class="msi" style="font-size:34px;color:var(--color-faint)">checklist</span>
                    <div class="text-[14px]">还没有待办</div>
                </div>

                <ul v-else class="m-0 flex list-none flex-col gap-1.5 p-0">
                    <li v-for="t in todos" :key="t.id"
                        class="todo-row group/item relative flex items-center gap-3 rounded-[14px] px-3.5 py-3 transition-colors hover:bg-bg-hi cursor-pointer max-md:gap-2.5 max-md:px-3 max-md:py-2.5"
                        :class="{ 'is-pinned': t.pinned, 'has-active-task': liveStatusFor(t) === 'running' || liveStatusFor(t) === 'pending' }"
                        @click="goDetail(t.id)">

                        <button class="grid h-[22px] w-[22px] flex-none cursor-pointer place-items-center rounded-full border-[1.5px] border-line-hi bg-transparent text-white transition-colors hover:border-accent"
                            :class="{ '!border-accent !bg-accent': t.done }"
                            @click.stop="toggleDone(t)">
                            <span class="msi xs" v-if="t.done">check</span>
                        </button>

                        <div class="min-w-0 flex-1">
                            <div class="break-words text-[14.5px] text-ink"
                                 :class="{ 'text-faint line-through': t.done }">{{ t.title }}</div>
                            <div v-if="statusMeta(liveStatusFor(t))" class="mt-0.5">
                                <span class="inline-flex items-center gap-1.5 text-[12px]"
                                    :style="{ color: statusMeta(liveStatusFor(t)).color }">
                                    <span v-if="statusMeta(liveStatusFor(t)).dot" class="animate-status-pulse h-1.5 w-1.5 rounded-full"
                                        :style="{ background: statusMeta(liveStatusFor(t)).color }"></span>
                                    {{ statusMeta(liveStatusFor(t)).label }}
                                </span>
                            </div>
                        </div>

                        <div class="flex flex-none items-center gap-1.5">
                            <button v-if="liveStatusFor(t) === 'running' || liveStatusFor(t) === 'pending'"
                                class="row-chip is-stop" @click.stop="stopTask(t)">
                                <span class="msi sm">stop_circle</span> 停止
                            </button>
                            <button v-else
                                class="row-chip is-primary"
                                :disabled="t.done"
                                @click.stop="runTodo(t)">
                                <span class="msi sm">play_arrow</span>
                                {{ t.taskId ? '再次执行' : '执行' }}
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

        <!-- ============== DETAIL ============== -->
        <div v-else-if="view === 'detail' && currentTodo" class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col">
            <header class="flex flex-none items-center gap-3 px-8 pb-4 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
                <button class="grid h-9 w-9 flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                    @click="goList" title="返回">
                    <span class="msi sm">arrow_back</span>
                </button>
                <input v-model="currentTodo.title"
                    @blur="todoApi('/update', { method: 'POST', body: JSON.stringify({ id: currentTodo.id, title: currentTodo.title }) }).catch(() => {})"
                    class="m-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink outline-none max-md:text-[24px]"
                    :class="{ 'text-faint line-through': currentTodo.done }" />
                <span v-if="statusMeta(liveStatusFor(currentTodo))"
                    class="inline-flex flex-none items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium"
                    :style="{ color: statusMeta(liveStatusFor(currentTodo)).color, background: 'color-mix(in srgb, ' + statusMeta(liveStatusFor(currentTodo)).color + ' 12%, transparent)' }">
                    <span v-if="statusMeta(liveStatusFor(currentTodo)).dot" class="animate-status-pulse h-1.5 w-1.5 rounded-full"
                        :style="{ background: statusMeta(liveStatusFor(currentTodo)).color }"></span>
                    <span v-else class="msi" style="font-size:13px">{{ liveStatusFor(currentTodo) === 'done' ? 'check_circle' : (liveStatusFor(currentTodo) === 'error' ? 'error' : 'cancel') }}</span>
                    {{ statusMeta(liveStatusFor(currentTodo)).label }}
                </span>
            </header>

            <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-1 max-md:px-4 max-md:pb-10">

                <div class="flex flex-wrap items-center gap-1.5 max-md:gap-1">
                    <button v-if="liveStatusFor(currentTodo) === 'running' || liveStatusFor(currentTodo) === 'pending'"
                        class="action-chip is-stop" @click="stopTask(currentTodo)">
                        <span class="msi sm">stop_circle</span> 停止
                    </button>
                    <button v-else class="action-chip is-primary" @click="runTodo(currentTodo)">
                        <span class="msi sm">auto_awesome</span>
                        {{ currentTodo.taskId ? '再次执行' : '执行' }}
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

                <section class="mt-7">
                    <div class="section-label">备注</div>
                    <textarea
                        :value="currentTodo.note"
                        @change="(e) => updateNote(currentTodo, e.target.value)"
                        placeholder="可以写背景、目标、约束、想要的产出格式…"
                        class="w-full resize-y rounded-[12px] border-0 bg-card px-3.5 py-3 text-[13.5px] leading-[1.65] text-ink outline-none transition-colors focus:bg-card-hi"
                        style="min-height: 92px;"></textarea>
                </section>

                <section class="mt-7">
                    <div class="section-label">结果</div>

                    <div v-if="!currentTodo.taskId"
                        class="rounded-[12px] border border-dashed border-line px-4 py-10 text-center text-[12.5px] text-faint">
                        还没让 AI 跑过。点上面的「执行」试试。
                    </div>

                    <div v-else class="flex flex-col gap-3">
                        <div v-if="detailTaskRow?.error" class="rounded-[10px] px-3 py-2 text-[13px] text-bad"
                            style="background: color-mix(in srgb, var(--color-bad) 12%, transparent)">{{ detailTaskRow.error }}</div>

                        <div v-if="detailTaskRow?.response" class="md rounded-[12px] border border-line bg-card px-3.5 py-3 text-[13.5px] leading-[1.65] text-ink break-words" v-html="renderMd(detailTaskRow.response)"></div>
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

.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

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

.section-label {
    margin-bottom: 8px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-faint);
}
</style>
