<script setup>
import AppLauncher from '@/components/AppLauncher.vue';
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue';
import { useTasksStore } from '@/stores/tasks';
import { useQuickChatStore } from '@/stores/quickChat';
import * as api from '@/utils/api';

const qc = useQuickChatStore();
const tasks = useTasksStore();

const STATUS_META = {
    running:   { label: '__T_TASKS_STATUS_RUNNING__',         tone: 'accent', dot: true  },
    pending:   { label: '__T_TASKS_STATUS_PENDING_SHORT__',   tone: 'accent', dot: true  },
    done:      { label: '__T_TASKS_STATUS_DONE_SHORT__',      tone: 'good',   icon: 'check_circle' },
    completed: { label: '__T_TASKS_STATUS_DONE_SHORT__',      tone: 'good',   icon: 'check_circle' },
    aborted:   { label: '__T_TASKS_STATUS_STOPPED_SHORT__',   tone: 'muted',  icon: 'cancel' },
    stopped:   { label: '__T_TASKS_STATUS_STOPPED_SHORT__',   tone: 'muted',  icon: 'cancel' },
    error:     { label: '__T_TASKS_STATUS_ERROR__',           tone: 'bad',    icon: 'error' },
};
const statusMeta = (s) => STATUS_META[s] || { label: s || '__T_TASKDETAIL_ROLE_UNKNOWN__', tone: 'muted' };
const isActive = (t) => t && (t.status === 'running' || t.status === 'pending');
const isFailed = (t) => t && t.status === 'error';

const TONE_TEXT = { accent: 'text-accent', good: 'text-good', bad: 'text-bad', muted: 'text-muted' };
const TONE_BG   = { accent: 'bg-accent',   good: 'bg-good',   bad: 'bg-bad',   muted: 'bg-muted' };
const TONE_SOFT = {
    accent: 'bg-blue-bg',
    good:   'bg-[color-mix(in_srgb,var(--color-good)_14%,transparent)]',
    bad:    'bg-[color-mix(in_srgb,var(--color-bad)_14%,transparent)]',
    muted:  'bg-bg-hi',
};

function fmtTime(s) {
    if (!s) return '';
    const d = new Date(String(s).replace(' ', 'T') + 'Z');
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60)    return '__T_TASKS_JUST_NOW__';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}
function fmtFullTime(s) {
    if (!s) return '';
    const d = new Date(String(s).replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) return s;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// ---- Filtering & grouping ---------------------------------------------
const filter = ref('all');           // 'all' | 'active' | 'failed'
const search = ref('');

const filteredAll = computed(() => {
    let list = tasks.tasks || [];
    if (filter.value === 'active') list = list.filter(isActive);
    else if (filter.value === 'failed') list = list.filter(isFailed);
    const q = search.value.trim().toLowerCase();
    if (q) {
        list = list.filter(t => {
            const blob = `${t.title || ''}|${t.app || ''}|${t.prompt || ''}|${t.response || ''}`.toLowerCase();
            return blob.includes(q);
        });
    }
    return list;
});

const grouped = computed(() => {
    const list = filteredAll.value;
    return {
        active: list.filter(isActive),
        recent: list.filter(t => !isActive(t)),
    };
});

// ---- Detail -----------------------------------------------------------
const selectedId = ref(null);
const detail = ref(null);
const detailMessages = ref([]);
const detailLoading = ref(false);
const detailError = ref('');
let detailPoller = null;

const selected = computed(() => detail.value);

async function openDetail(id) {
    if (detailPoller) { clearInterval(detailPoller); detailPoller = null; }
    selectedId.value = id;
    detailError.value = '';
    detail.value = null;
    detailMessages.value = [];
    await refreshDetail();
    detailPoller = setInterval(() => {
        if (!detail.value || isActive(detail.value)) refreshDetail();
        else { clearInterval(detailPoller); detailPoller = null; }
    }, 2000);
}
async function refreshDetail() {
    if (!selectedId.value) return;
    detailLoading.value = true;
    try {
        const [data, msgData] = await Promise.all([
            api.get('/api/task/detail', { query: { id: selectedId.value } }),
            api.get('/api/task/messages', { query: { id: selectedId.value } }),
        ]);
        detail.value = data?.task || null;
        detailMessages.value = Array.isArray(msgData?.messages) ? msgData.messages : [];
    } catch (err) {
        detailError.value = err?.body?.message || err.message || '__T_TASKS_LOAD_FAIL__';
    } finally {
        detailLoading.value = false;
    }
}
function backToList() {
    selectedId.value = null;
    detail.value = null;
    detailMessages.value = [];
    detailError.value = '';
    if (detailPoller) { clearInterval(detailPoller); detailPoller = null; }
}

async function stopFromDetail() {
    if (!detail.value) return;
    try {
        await tasks.stop(detail.value.id);
        await refreshDetail();
    } catch {}
}

let listPoller = null;
onMounted(() => {
    tasks.fetch();
    listPoller = setInterval(() => { if (!selectedId.value) tasks.fetch(); }, 4000);
});
onUnmounted(() => {
    if (listPoller) clearInterval(listPoller);
    if (detailPoller) clearInterval(detailPoller);
});

watchEffect(() => {
    if (selectedId.value && selected.value) {
        const t = selected.value;
        qc.setContext({
            scope: `tasks:detail:${t.id}`,
            label: '__T_QC_LABEL_TASKS_ITEM__'.replace('{title}', t.title || ('#' + t.id)),
            snapshot: [
                '__T_QC_FIELD_STATUS__'.replace('{value}', t.status || '?'),
                t.app ? '__T_QC_FIELD_APP__'.replace('{value}', t.app) : null,
                t.mode ? '__T_QC_FIELD_MODE__'.replace('{value}', t.mode) : null,
                t.prompt ? '__T_QC_FIELD_PROMPT__'.replace('{value}', String(t.prompt).slice(0, 400)) : null,
                t.error ? '__T_QC_FIELD_ERROR__'.replace('{value}', String(t.error).slice(0, 300)) : null,
                t.response ? '__T_QC_FIELD_RESPONSE__'.replace('{value}', String(t.response).slice(0, 400)) : null,
            ].filter(Boolean).join('\n'),
        });
    } else {
        const list = tasks.tasks || [];
        const running = list.filter(x => x.status === 'running' || x.status === 'pending');
        qc.setContext({
            scope: 'tasks:list',
            label: '__T_QC_LABEL_TASKS_ROOT__',
            snapshot: [
                '__T_QC_FIELD_COUNT_WITH_RUNNING__'
                    .replace('{count}', list.length)
                    .replace('{running}', running.length),
                running.length
                    ? '__T_QC_FIELD_RUNNING_LIST__'
                        .replace('{list}', running.slice(0, 5).map(t => '#' + t.id + ' ' + (t.title || '')).join(', '))
                    : null,
            ].filter(Boolean).join('\n'),
        });
    }
});

function toolCallName(msg) { return msg?.tool_calls?.[0]?.function?.name || 'tool'; }
function toolCallArgs(msg) { return msg?.tool_calls?.[0]?.function?.arguments || ''; }
function messageText(msg) { return msg?.content == null ? '' : String(msg.content); }
function messageRoleLabel(role) {
    if (role === 'assistant') return '__T_TASKS_ROLE_MODEL__';
    if (role === 'tool') return '__T_TASKDETAIL_ROLE_TOOL_RESULT__';
    if (role === 'user') return '__T_TASKDETAIL_ROLE_USER__';
    if (role === 'system') return '__T_TASKS_ROLE_SYSTEM__';
    return role || '__T_TASKS_ROLE_MESSAGE__';
}
</script>

<template>
    <!-- detail view -->
    <div v-if="selectedId" class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col bg-bg">
        <header class="flex flex-none items-center gap-2 px-8 pb-2 pt-7 max-md:px-4 max-md:pt-5">
            <button class="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                @click="backToList" :title="'__T_TASKDETAIL_BACK__'">
                <span class="msi" style="font-size:20px">arrow_back</span>
            </button>
            <div class="ml-auto flex items-center gap-2">
                <button v-if="selected && isActive(selected)"
                    class="inline-flex items-center gap-1.5 rounded-full border border-line-hi bg-transparent px-3 py-1 text-[12.5px] text-muted transition-colors hover:border-bad hover:bg-bg-hi hover:text-bad"
                    @click="stopFromDetail">
                    <span class="msi" style="font-size:15px">stop_circle</span>
                    <span>__T_TASKS_STOP__</span>
                </button>
                <AppLauncher />
            </div>
        </header>

        <div v-if="detailError" class="mx-8 mt-3 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-4"
             style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
            {{ detailError }}
        </div>

        <div v-if="!selected && !detailError" class="flex flex-1 flex-col items-center gap-2 py-15 text-muted">
            <span class="msi text-faint" style="font-size:30px">hourglass_empty</span>
            <div class="text-[14px]">__T_TASKS_LOADING__</div>
        </div>

        <div v-else-if="selected" class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-2 max-md:px-4 max-md:pb-10">
            <!-- Hero: title + status pill -->
            <h2 class="m-0 break-words text-[24px] font-semibold leading-[1.25] tracking-[-0.01em] text-ink max-md:text-[19px]">
                {{ selected.title || '__T_TASKS_NO_TITLE__' }}
            </h2>

            <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                    :class="[ TONE_TEXT[statusMeta(selected.status).tone], TONE_SOFT[statusMeta(selected.status).tone] ]">
                    <span v-if="statusMeta(selected.status).dot"
                        class="h-1.5 w-1.5 rounded-full animate-status-pulse"
                        :class="TONE_BG[statusMeta(selected.status).tone]"></span>
                    <span v-else class="msi" style="font-size:14px">{{ statusMeta(selected.status).icon }}</span>
                    {{ statusMeta(selected.status).label }}
                </span>
                <span class="rounded-md border border-line bg-bg-elev px-1.5 py-px text-[11px] font-medium uppercase tracking-[0.04em] text-ink">
                    {{ selected.app || 'unknown' }}
                </span>
                <span class="text-[12px] text-muted">{{ selected.mode || '—' }}</span>
                <span class="text-[12px] text-faint">·</span>
                <span class="text-[12px] text-faint">#{{ selected.id }}</span>
            </div>

            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-faint">
                <span v-if="selected.created_at">__T_TASKS_CREATED__ ·  {{ fmtFullTime(selected.created_at) }}</span>
                <span v-if="selected.finished_at">__T_TASKS_FINISHED__ ·  {{ fmtFullTime(selected.finished_at) }}</span>
                <span v-if="selected.conversation_id" class="font-mono">{{ selected.conversation_id }}</span>
            </div>

            <div v-if="selected.error" class="mt-5 rounded-lg px-3 py-2 text-[12.5px] text-bad"
                 style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                <div class="text-[10.5px] font-medium uppercase tracking-wider opacity-80">__T_TASKDETAIL_ERROR_LABEL__</div>
                <div class="mt-1 whitespace-pre-wrap leading-[1.55]">{{ selected.error }}</div>
            </div>

            <template v-if="selected.prompt">
                <div class="mt-5 mb-1.5 text-[11.5px] font-medium uppercase tracking-wider text-faint">__T_TASKDETAIL_PROMPT_LABEL__</div>
                <pre class="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-bg-elev px-3 py-2.5 font-mono text-[12.5px] leading-[1.6] text-ink">{{ selected.prompt }}</pre>
            </template>

            <template v-if="selected.response">
                <div class="mt-5 mb-1.5 text-[11.5px] font-medium uppercase tracking-wider text-faint">__T_TASKS_RESPONSE__</div>
                <div class="whitespace-pre-wrap break-words rounded-lg border border-line bg-bg-elev px-3 py-2.5 text-[13.5px] leading-[1.65] text-ink">{{ selected.response }}</div>
            </template>

            <template v-if="selected.schema">
                <div class="mt-5 mb-1.5 text-[11.5px] font-medium uppercase tracking-wider text-faint">Schema</div>
                <pre class="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-bg-elev px-3 py-2.5 font-mono text-[11.5px] leading-[1.55] text-muted">{{ selected.schema }}</pre>
            </template>

            <template v-if="selected.meta">
                <div class="mt-5 mb-1.5 text-[11.5px] font-medium uppercase tracking-wider text-faint">Meta</div>
                <pre class="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-bg-elev px-3 py-2.5 font-mono text-[11.5px] leading-[1.55] text-muted">{{ typeof selected.meta === 'string' ? selected.meta : JSON.stringify(selected.meta, null, 2) }}</pre>
            </template>

            <template v-if="detailMessages.length">
                <details class="mt-6 rounded-[12px] border border-line bg-bg-elev">
                    <summary class="cursor-pointer select-none list-none px-3.5 py-2.5 text-[12px] text-muted hover:text-ink">
                        <span class="msi align-[-2px]" style="font-size:14px">unfold_more</span>
                        __T_TASKDETAIL_MESSAGES_TITLE__
                        <span class="text-faint">·  {{ '__T_TASKDETAIL_MESSAGES_COUNT__'.replace('{count}', detailMessages.length) }}</span>
                    </summary>
                    <ol class="m-0 flex list-none flex-col gap-2 px-3 pb-3 pt-1">
                        <li v-for="row in detailMessages" :key="row.id" class="rounded-lg border border-line bg-bg px-3 py-2.5">
                            <div class="mb-1.5 flex flex-wrap items-center gap-2 text-[11.5px]">
                                <span class="font-medium text-ink">{{ messageRoleLabel(row.message?.role) }}</span>
                                <span class="text-faint">#{{ row.id }}</span>
                                <span v-if="row.createdAt" class="text-faint">{{ fmtFullTime(row.createdAt) }}</span>
                                <span v-if="row.message?.tool_call_id" class="font-mono text-faint">{{ row.message.tool_call_id }}</span>
                            </div>
                            <template v-if="row.message?.tool_calls?.length">
                                <div class="mb-1.5 text-[12.5px] text-muted">
                                    __T_TASKS_TOOL_CALL__ <span class="font-mono text-ink">{{ toolCallName(row.message) }}</span>
                                </div>
                                <pre class="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[1.55] text-muted">{{ toolCallArgs(row.message) }}</pre>
                            </template>
                            <div v-if="messageText(row.message)"
                                 class="whitespace-pre-wrap break-words text-[12.5px] leading-[1.6] text-muted">
                                {{ messageText(row.message) }}
                            </div>
                        </li>
                    </ol>
                </details>
            </template>
        </div>
    </div>

    <!-- list -->
    <div v-else class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col bg-bg">
        <header class="flex flex-none items-baseline gap-3 px-8 pb-2 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">__T_TASKS_TITLE__</h1>
            <span class="text-[12.5px] text-faint">__T_TASKS_SUBTITLE__</span>
            <div class="ml-auto flex items-center gap-2">
                <button class="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink disabled:cursor-default disabled:opacity-60"
                    :disabled="tasks.loading"
                    @click="tasks.fetch"
                    :title="'__T_TASKS_REFRESH__'">
                    <span class="msi" :class="{ 'animate-spin': tasks.loading }" style="font-size:18px">refresh</span>
                </button>
                <AppLauncher />
            </div>
        </header>

        <!-- Search + filter chips -->
        <div class="mx-8 mb-3 flex flex-none flex-wrap items-center gap-2 max-md:mx-3">
            <div class="search-box flex min-w-0 flex-1 items-center gap-2 rounded-full bg-card px-3.5 py-1.5 transition-colors focus-within:bg-card-hi">
                <span class="msi text-faint" style="font-size:18px">search</span>
                <input v-model="search" placeholder="__T_TASKS_SEARCH_PLACEHOLDER__"
                    class="search-input min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-ink outline-none" />
                <button v-if="search" @click="search = ''" :title="'__T_TASKS_CLEAR_SEARCH__'"
                    class="grid h-5 w-5 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:text-ink">
                    <span class="msi" style="font-size:14px">close</span>
                </button>
            </div>
            <div class="flex flex-none items-center gap-1 rounded-full bg-card-sub p-0.5">
                <button v-for="opt in [
                    { v: 'all',    k: '__T_TASKS_FILTER_ALL__' },
                    { v: 'active', k: '__T_TASKS_FILTER_ACTIVE__' },
                    { v: 'failed', k: '__T_TASKS_FILTER_FAILED__' }
                ]" :key="opt.v"
                    class="cursor-pointer rounded-full border-0 bg-transparent px-3 py-1 text-[12.5px] font-medium text-muted transition-colors"
                    :class="filter === opt.v ? '!bg-bg !text-ink shadow-[0_1px_2px_var(--color-shadow)]' : 'hover:text-ink'"
                    @click="filter = opt.v">{{ opt.k }}</button>
            </div>
        </div>

        <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-1 max-md:px-3 max-md:pb-10">
            <!-- Empty -->
            <div v-if="!tasks.tasks.length" class="flex flex-col items-center gap-2 py-20 text-muted">
                <span class="msi text-faint" style="font-size:32px">inbox</span>
                <div class="text-[14px]">{{ tasks.loading ? '__T_TASKS_LOADING__' : '__T_TASKS_EMPTY_PLAIN__' }}</div>
                <div v-if="!tasks.loading" class="text-[12px] text-faint">__T_TASKS_EMPTY_HINT__</div>
            </div>

            <!-- No match -->
            <div v-else-if="!filteredAll.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                <span class="msi text-faint" style="font-size:28px">search_off</span>
                <div class="text-[13px]">__T_TASKS_SEARCH_NO_MATCH__</div>
            </div>

            <template v-else>
                <!-- Active group -->
                <section v-if="grouped.active.length" class="mb-5">
                    <div class="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
                        <span class="h-1.5 w-1.5 rounded-full bg-accent animate-status-pulse"></span>
                        __T_TASKS_SECTION_ACTIVE__
                        <span class="font-normal text-faint">·  {{ grouped.active.length }}</span>
                    </div>
                    <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
                        <li v-for="t in grouped.active" :key="t.id"
                            class="group flex cursor-pointer items-start gap-3 rounded-[14px] bg-card px-4 py-3 transition-colors hover:bg-card-hi shadow-[inset_3px_0_0_0_var(--color-accent)] max-md:gap-2.5 max-md:rounded-xl max-md:px-3 max-md:py-2.5"
                            @click="openDetail(t.id)">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-baseline gap-3 max-md:flex-wrap">
                                    <span class="flex-1 truncate text-[14px] font-medium text-ink">
                                        {{ t.title || t.prompt?.slice(0, 60) || `__T_TASKS_TASK_NUMBER__ #${t.id}` }}
                                    </span>
                                    <span class="flex-none text-[12px] text-faint">{{ fmtTime(t.created_at) }}</span>
                                </div>
                                <div class="mt-1 flex items-center gap-2 text-[12px]">
                                    <span class="rounded-md border border-line bg-bg-elev px-1.5 py-px text-[11px] font-medium uppercase tracking-[0.04em] text-ink">
                                        {{ t.app || 'unknown' }}
                                    </span>
                                    <span class="text-faint">{{ t.mode || '—' }}</span>
                                    <span class="text-faint">·</span>
                                    <span class="inline-flex items-center gap-1 font-medium" :class="TONE_TEXT[statusMeta(t.status).tone]">
                                        <span class="h-1.5 w-1.5 rounded-full animate-status-pulse" :class="TONE_BG[statusMeta(t.status).tone]"></span>
                                        {{ statusMeta(t.status).label }}
                                    </span>
                                </div>
                            </div>
                            <button class="inline-flex flex-none cursor-pointer items-center gap-1 rounded-full border border-line-hi bg-transparent px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-bad hover:bg-bg-hi hover:text-bad"
                                :title="'__T_TASKS_STOP__'"
                                @click.stop="tasks.stop(t.id)">
                                <span class="msi" style="font-size:15px">stop_circle</span>
                                __T_TASKS_STOP__
                            </button>
                        </li>
                    </ul>
                </section>

                <!-- Recent group -->
                <section v-if="grouped.recent.length">
                    <div v-if="grouped.active.length" class="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                        __T_TASKS_SECTION_RECENT__
                        <span class="font-normal">·  {{ grouped.recent.length }}</span>
                    </div>
                    <ul class="m-0 flex list-none flex-col gap-1.5 p-0">
                        <li v-for="t in grouped.recent" :key="t.id"
                            class="flex cursor-pointer items-center gap-3 rounded-[14px] px-4 py-2.5 transition-colors hover:bg-bg-hi max-md:gap-2.5 max-md:px-3 max-md:py-2.5"
                            @click="openDetail(t.id)">
                            <span class="msi flex-none" style="font-size:16px"
                                :class="TONE_TEXT[statusMeta(t.status).tone]">{{ statusMeta(t.status).icon || 'circle' }}</span>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-baseline gap-3 max-md:flex-wrap">
                                    <span class="flex-1 truncate text-[13.5px] text-ink">
                                        {{ t.title || t.prompt?.slice(0, 60) || `__T_TASKS_TASK_NUMBER__ #${t.id}` }}
                                    </span>
                                    <span class="flex-none text-[12px] text-faint">{{ fmtTime(t.created_at) }}</span>
                                </div>
                                <div class="mt-0.5 flex items-center gap-2 text-[12px] text-faint">
                                    <span class="font-medium uppercase tracking-[0.04em] text-muted">{{ t.app || 'unknown' }}</span>
                                    <span>·</span>
                                    <span class="font-medium" :class="TONE_TEXT[statusMeta(t.status).tone]">{{ statusMeta(t.status).label }}</span>
                                </div>
                            </div>
                        </li>
                    </ul>
                </section>
            </template>
        </div>
    </div>
</template>

<style scoped>
.search-input::placeholder { color: var(--color-faint); }

.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
</style>
