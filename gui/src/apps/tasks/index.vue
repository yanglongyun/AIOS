<script setup>
import AppLauncher from '@/components/AppLauncher.vue';
import { ref, computed, nextTick, onMounted, onUnmounted, watchEffect } from 'vue';
import { useTasksStore } from '@/stores/tasks';
import { useQuickChatStore } from '@/stores/quickChat';
import * as api from '@/utils/api';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

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
const TERMINAL = new Set(['done', 'completed', 'aborted', 'stopped', 'error']);
const isActive = (t) => t && (t.status === 'running' || t.status === 'pending');
const isFailed = (t) => t && t.status === 'error';

const TONE_BG = { accent: 'bg-accent', good: 'bg-good', bad: 'bg-bad', muted: 'bg-muted' };

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

// ---- Composer ----------------------------------------------------------
const newPrompt = ref('');
const composerRef = ref(null);
const submitting = ref(false);
const composerError = ref('');
// 中文输入法状态:Enter 选词时绝不提交
const composerComposing = ref(false);
const COMPOSER_MAX_H = 240; // 自动增高上限,超出滚动

function autosizeComposer() {
    nextTick(() => {
        const el = composerRef.value;
        if (!el) return;
        el.style.height = 'auto';
        const next = Math.min(el.scrollHeight, COMPOSER_MAX_H);
        el.style.height = next + 'px';
        el.style.overflowY = el.scrollHeight > COMPOSER_MAX_H ? 'auto' : 'hidden';
    });
}

async function submitCompose() {
    const text = newPrompt.value.trim();
    if (!text || submitting.value) return;
    submitting.value = true;
    composerError.value = '';
    try {
        await tasks.create({ prompt: text });
        newPrompt.value = '';
        await nextTick();
        autosizeComposer();
        composerRef.value?.focus();
    } catch (e) {
        composerError.value = e?.body?.message || e.message || '__T_TASKS_LOAD_FAIL__';
    } finally {
        submitting.value = false;
    }
}

function composerKeydown(e) {
    // IME 输入中(中文/日文/韩文输入法选词):Enter 仅用于选词,不提交
    if (composerComposing.value || e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitCompose();
    }
}

// ---- Filtering & grouping ---------------------------------------------
const filter = ref('all');

const filteredAll = computed(() => {
    let list = tasks.tasks || [];
    if (filter.value === 'active') list = list.filter(isActive);
    else if (filter.value === 'failed') list = list.filter(isFailed);
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
    try {
        const [data, msgData] = await Promise.all([
            api.get('/api/task/detail', { query: { id: selectedId.value } }),
            api.get('/api/task/messages', { query: { id: selectedId.value } }),
        ]);
        detail.value = data?.task || null;
        detailMessages.value = Array.isArray(msgData?.messages) ? msgData.messages : [];
    } catch (err) {
        detailError.value = err?.body?.message || err.message || '__T_TASKS_LOAD_FAIL__';
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

async function rerunFromDetail() {
    if (!detail.value?.prompt) return;
    try {
        await tasks.rerun(detail.value);
        backToList();
    } catch (e) {
        detailError.value = e?.body?.message || e.message || '__T_TASKS_LOAD_FAIL__';
    }
}

// ---- Lifecycle ---------------------------------------------------------
let listPoller = null;
onMounted(() => {
    tasks.fetch();
    nextTick(() => {
        composerRef.value?.focus();
        autosizeComposer();
    });
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
    if (role === 'tool')      return '__T_TASKDETAIL_ROLE_TOOL_RESULT__';
    if (role === 'user')      return '__T_TASKDETAIL_ROLE_USER__';
    if (role === 'system')    return '__T_TASKS_ROLE_SYSTEM__';
    return role || '__T_TASKS_ROLE_MESSAGE__';
}
</script>

<template>
    <div class="tasks-shell flex h-full flex-col">

        <!-- ============== DETAIL ============== -->
        <div v-if="selectedId" class="mx-auto flex h-full w-full min-w-0 max-w-[720px] flex-col">
            <header class="flex flex-none items-center gap-2 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
                <button class="header-icon" @click="backToList" :title="'__T_TASKDETAIL_BACK__'">
                    <span class="msi" style="font-size:20px">arrow_back</span>
                </button>
                <AppLauncher class="ml-auto flex-none" />
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

                <!-- Title -->
                <h2 class="m-0 mb-2 break-words text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink max-md:text-[22px]">
                    {{ selected.title || '__T_TASKS_NO_TITLE__' }}
                </h2>

                <!-- Status meta line -->
                <div class="mb-4 flex flex-wrap items-center gap-2">
                    <span class="status-pill" :class="['tone-' + statusMeta(selected.status).tone]">
                        <span v-if="statusMeta(selected.status).dot"
                            class="h-1.5 w-1.5 rounded-full animate-status-pulse"
                            :class="TONE_BG[statusMeta(selected.status).tone]"></span>
                        <span v-else class="msi" style="font-size:13px">{{ statusMeta(selected.status).icon }}</span>
                        {{ statusMeta(selected.status).label }}
                    </span>
                    <span v-if="selected.app && selected.app !== 'tasks'" class="app-tag">{{ selected.app }}</span>
                    <span class="text-[12px] text-faint">#{{ selected.id }}</span>
                    <span v-if="selected.created_at" class="text-[12px] text-faint">·  {{ fmtFullTime(selected.created_at) }}</span>
                </div>

                <!-- Hero run card -->
                <div class="run-card mb-7" :class="{ 'is-active': isActive(selected) }">
                    <div class="run-card-body">
                        <div class="run-card-title">
                            <span v-if="isActive(selected)">__T_TASKS_RUNCARD_TITLE_RUNNING__</span>
                            <span v-else-if="selected.status === 'error'">__T_TASKS_RUNCARD_TITLE_FAILED__</span>
                            <span v-else>__T_TASKS_RUNCARD_TITLE_DONE__</span>
                        </div>
                        <div class="run-card-sub">
                            <span v-if="isActive(selected)">__T_TASKS_RUNCARD_SUB_RUNNING__</span>
                            <span v-else-if="selected.status === 'error'">__T_TASKS_RUNCARD_SUB_FAILED__</span>
                            <span v-else>__T_TASKS_RUNCARD_SUB_DONE__</span>
                        </div>
                    </div>
                    <button v-if="isActive(selected)" class="run-btn is-stop" @click="stopFromDetail">
                        <span class="msi" style="font-size:22px">stop_circle</span>
                        <span>__T_TASKS_STOP__</span>
                    </button>
                    <button v-else class="run-btn is-go" @click="rerunFromDetail">
                        <span class="msi" style="font-size:22px">replay</span>
                        <span>__T_TASKS_RUN_AGAIN__</span>
                    </button>
                </div>

                <!-- Error -->
                <div v-if="selected.error" class="mb-5 rounded-lg px-3 py-2 text-[12.5px] text-bad"
                     style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                    <div class="text-[10.5px] font-medium uppercase tracking-wider opacity-80">__T_TASKDETAIL_ERROR_LABEL__</div>
                    <div class="mt-1 whitespace-pre-wrap leading-[1.55]">{{ selected.error }}</div>
                </div>

                <!-- Prompt -->
                <section v-if="selected.prompt" class="mb-7">
                    <div class="section-label">__T_TASKDETAIL_PROMPT_LABEL__</div>
                    <pre class="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-[12px] border border-line bg-card px-4 py-3 text-[13px] leading-[1.6] text-ink">{{ selected.prompt }}</pre>
                </section>

                <!-- Result -->
                <section v-if="selected.response" class="mb-7">
                    <div class="section-label">__T_TASKS_RESPONSE__</div>
                    <div class="md rounded-[12px] border border-line bg-card px-4 py-3.5 text-[13.5px] leading-[1.65] text-ink break-words"
                         v-html="renderMd(selected.response)"></div>
                </section>

                <!-- Run history -->
                <details v-if="detailMessages.length" class="mt-2 rounded-[12px] border border-line bg-bg-elev">
                    <summary class="cursor-pointer select-none list-none px-3.5 py-2.5 text-[12px] text-muted hover:text-ink">
                        <span class="msi align-[-2px]" style="font-size:14px">unfold_more</span>
                        __T_TASKDETAIL_MESSAGES_TITLE__
                        <span class="text-faint">·  {{ '__T_TASKDETAIL_MESSAGES_COUNT__'.replace('{count}', detailMessages.length) }}</span>
                    </summary>
                    <ol class="m-0 flex list-none flex-col gap-2 px-3 pb-3 pt-1">
                        <li v-for="row in detailMessages" :key="row.id" class="rounded-lg border border-line bg-bg px-3 py-2.5">
                            <div class="mb-1 flex items-center gap-2 text-[11px] text-faint">
                                <span class="font-medium text-ink">{{ messageRoleLabel(row.message?.role) }}</span>
                                <span v-if="row.message?.tool_calls?.length">·  __T_TASKS_TOOL_CALL__ <span class="font-mono text-ink">{{ toolCallName(row.message) }}</span></span>
                            </div>
                            <pre v-if="row.message?.tool_calls?.length"
                                class="m-0 max-w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-[1.5] text-muted">{{ toolCallArgs(row.message) }}</pre>
                            <div v-if="messageText(row.message)"
                                class="whitespace-pre-wrap break-words text-[12.5px] leading-[1.55] text-muted">{{ messageText(row.message) }}</div>
                        </li>
                    </ol>
                </details>
            </div>
        </div>

        <!-- ============== LIST ============== -->
        <div v-else class="mx-auto flex h-full w-full min-w-0 max-w-[720px] flex-col">
            <header class="flex flex-none items-center gap-3 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
                <h1 class="m-0 text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink max-md:text-[19px]">__T_TASKS_TITLE__</h1>
                <div class="ml-auto flex items-center gap-2">
                    <button class="header-icon"
                        :disabled="tasks.loading"
                        @click="tasks.fetch"
                        :title="'__T_TASKS_REFRESH__'">
                        <span class="msi" :class="{ 'animate-spin': tasks.loading }" style="font-size:18px">refresh</span>
                    </button>
                    <AppLauncher />
                </div>
            </header>

            <!-- Composer -->
            <div class="composer-card mx-8 mb-3 flex flex-none items-end gap-2.5 px-4 py-3 max-md:mx-3 max-md:px-3.5">
                <textarea ref="composerRef" v-model="newPrompt"
                    @keydown="composerKeydown"
                    @input="autosizeComposer"
                    @compositionstart="composerComposing = true"
                    @compositionend="composerComposing = false; autosizeComposer()"
                    rows="1"
                    placeholder="__T_TASKS_COMPOSER_PLACEHOLDER__"
                    class="composer-input min-w-0 flex-1 resize-none border-0 bg-transparent py-1 text-[15px] leading-[1.55] text-ink outline-none"></textarea>
                <button class="composer-btn cursor-pointer rounded-full border-0 px-4 py-1.5 text-[13px] font-semibold text-white disabled:cursor-default disabled:opacity-45"
                    :disabled="submitting || !newPrompt.trim()" @click="submitCompose">
                    {{ submitting ? '__T_TASKS_LOADING__' : '__T_TASKS_COMPOSER_SUBMIT__' }}
                </button>
            </div>

            <div v-if="composerError" class="mx-8 mb-3 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-3"
                 style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                {{ composerError }}
            </div>

            <!-- Filter chips -->
            <div class="mx-8 mb-3 flex flex-none items-center gap-2 max-md:mx-3">
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

                <!-- No match for filter -->
                <div v-else-if="!filteredAll.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                    <span class="msi text-faint" style="font-size:28px">filter_alt_off</span>
                    <div class="text-[13px]">__T_TASKS_FILTER_NO_MATCH__</div>
                </div>

                <template v-else>
                    <!-- Active group -->
                    <section v-if="grouped.active.length" class="mb-5">
                        <div class="section-h text-accent">
                            <span class="h-1.5 w-1.5 rounded-full bg-accent animate-status-pulse"></span>
                            __T_TASKS_SECTION_ACTIVE__
                            <span class="ct">{{ grouped.active.length }}</span>
                        </div>
                        <ul class="task-card m-0 flex list-none flex-col p-0">
                            <li v-for="t in grouped.active" :key="t.id"
                                class="task-row is-active group flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors max-md:gap-2.5 max-md:px-3 max-md:py-3"
                                @click="openDetail(t.id)">
                                <span class="task-spinner flex-none"></span>
                                <div class="min-w-0 flex-1">
                                    <div class="break-words text-[14.5px] font-medium text-ink truncate">
                                        {{ t.title || (t.prompt && t.prompt.slice(0, 80)) || '__T_TASKS_NO_TITLE__' }}
                                    </div>
                                    <div class="mt-1.5 flex items-center gap-2">
                                        <span class="status-pill" :class="['tone-' + statusMeta(t.status).tone]">
                                            <span class="h-1.5 w-1.5 rounded-full animate-status-pulse"
                                                :class="TONE_BG[statusMeta(t.status).tone]"></span>
                                            {{ statusMeta(t.status).label }}
                                        </span>
                                        <span v-if="t.app && t.app !== 'tasks'" class="app-tag">{{ t.app }}</span>
                                        <span class="text-[11.5px] text-faint">{{ fmtTime(t.created_at) }}</span>
                                    </div>
                                </div>
                                <button class="row-stop"
                                    :title="'__T_TASKS_STOP__'"
                                    @click.stop="tasks.stop(t.id)">
                                    <span class="msi" style="font-size:15px">stop_circle</span>
                                    __T_TASKS_STOP__
                                </button>
                            </li>
                        </ul>
                    </section>

                    <!-- Recent group -->
                    <section v-if="grouped.recent.length" class="mb-5">
                        <div v-if="grouped.active.length" class="section-h">
                            <span class="msi text-faint" style="font-size:14px">history</span>
                            __T_TASKS_SECTION_RECENT__
                            <span class="ct">{{ grouped.recent.length }}</span>
                        </div>
                        <ul class="task-card m-0 flex list-none flex-col p-0">
                            <li v-for="t in grouped.recent" :key="t.id"
                                class="task-row group flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors max-md:gap-2.5 max-md:px-3 max-md:py-3"
                                @click="openDetail(t.id)">
                                <span class="task-status-dot flex-none"
                                    :class="['tone-' + statusMeta(t.status).tone]">
                                    <span v-if="statusMeta(t.status).icon" class="msi" style="font-size:14px">{{ statusMeta(t.status).icon }}</span>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="break-words text-[14px] text-ink truncate">
                                        {{ t.title || (t.prompt && t.prompt.slice(0, 80)) || '__T_TASKS_NO_TITLE__' }}
                                    </div>
                                    <div class="mt-1 flex items-center gap-2">
                                        <span class="status-pill is-tight" :class="['tone-' + statusMeta(t.status).tone]">
                                            {{ statusMeta(t.status).label }}
                                        </span>
                                        <span v-if="t.app && t.app !== 'tasks'" class="app-tag">{{ t.app }}</span>
                                        <span class="text-[11.5px] text-faint">{{ fmtTime(t.created_at) }}</span>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <!-- Bottom tip -->
                    <div class="tip-card">
                        <span class="ic">💡</span>
                        <span>__T_TASKS_TIP_FOOTER__</span>
                    </div>
                </template>
            </div>
        </div>

    </div>
</template>

<style scoped>
/* Things 3 风 palette —— 仅 light 模式下作用于 tasks app;dark 模式落回全局 dark 主题 */
.tasks-shell {
    color: var(--color-ink);
    background: var(--color-bg);
}
:root.light .tasks-shell {
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
}

.composer-input::placeholder { color: var(--color-faint); }

.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Composer card */
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
.composer-btn {
    background: var(--color-accent);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--color-accent) 35%, transparent);
}
.composer-btn:hover:not(:disabled) {
    background: var(--color-accent-hi);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--color-accent) 45%, transparent);
}

/* Section header */
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

/* List card */
.task-card {
    background: var(--color-card);
    border: 1px solid var(--color-line);
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.04);
    overflow: hidden;
}

.task-row + .task-row { border-top: 1px solid var(--color-line); }
.task-row:hover { background: color-mix(in srgb, var(--color-bg) 60%, var(--color-card)); }
.task-row.is-active { box-shadow: inset 3px 0 0 0 var(--color-accent); background: color-mix(in srgb, var(--color-blue-bg) 30%, transparent); }
.task-row.is-active:hover { background: color-mix(in srgb, var(--color-blue-bg) 50%, transparent); }

/* Spinner ring for active row */
.task-spinner {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, var(--color-accent) 0%, var(--color-accent) 70%, transparent 70%);
    animation: spin 1.2s linear infinite;
    display: grid; place-items: center;
    flex: none;
    position: relative;
}
.task-spinner::after {
    content: '';
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--color-card);
}

/* Status dot for recent rows */
.task-status-dot {
    width: 22px; height: 22px;
    border-radius: 50%;
    display: grid; place-items: center;
    flex: none;
}
.task-status-dot.tone-good {
    background: color-mix(in srgb, var(--color-good) 14%, transparent);
    color: var(--color-good);
}
.task-status-dot.tone-bad {
    background: color-mix(in srgb, var(--color-bad) 14%, transparent);
    color: var(--color-bad);
}
.task-status-dot.tone-muted {
    background: var(--color-bg-hi);
    color: var(--color-muted);
}

/* Status pill */
.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
}
.status-pill.is-tight { padding: 1px 8px; font-size: 10.5px; }
.status-pill.tone-accent { background: var(--color-blue-bg); color: var(--color-blue-fg); }
.status-pill.tone-good   { background: color-mix(in srgb, var(--color-good) 14%, transparent); color: var(--color-good); }
.status-pill.tone-bad    { background: color-mix(in srgb, var(--color-bad) 12%, transparent); color: var(--color-bad); }
.status-pill.tone-muted  { background: var(--color-bg-hi); color: var(--color-muted); }

/* App tag */
.app-tag {
    display: inline-block;
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--color-bg-hi);
    color: var(--color-muted);
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.02em;
}

/* Row-level Stop button (only for active rows) */
.row-stop {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid color-mix(in srgb, var(--color-bad) 35%, transparent);
    border-radius: 999px;
    background: transparent;
    color: var(--color-bad);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background .12s, border-color .12s;
    flex: none;
    opacity: 0;
}
.task-row:hover .row-stop { opacity: 1; }
.row-stop:hover { background: color-mix(in srgb, var(--color-bad) 12%, transparent); border-color: var(--color-bad); }
@media (max-width: 768px) {
    .row-stop { opacity: 1; }
}

/* Header icon button */
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
.header-icon:disabled { opacity: 0.45; cursor: default; }

/* Section labels (detail page) */
.section-label {
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-faint);
}

/* Hero run card (detail page) */
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
    transition: background .14s, box-shadow .14s;
}
.run-btn.is-go { background: var(--color-accent); box-shadow: 0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent); }
.run-btn.is-go:hover {
    background: var(--color-accent-hi);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--color-accent) 45%, transparent);
}
.run-btn.is-stop { background: var(--color-bad); box-shadow: 0 4px 12px color-mix(in srgb, var(--color-bad) 30%, transparent); }
.run-btn.is-stop:hover { background: #991b1b; box-shadow: 0 6px 16px color-mix(in srgb, var(--color-bad) 45%, transparent); }

/* Tip card */
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
</style>
