<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTasksStore } from '@/stores/tasks';
import * as api from '@/utils/api';

const tasks = useTasksStore();

const STATUS_META = {
    running:   { label: '__T_TASKS_STATUS_RUNNING__', color: 'var(--color-accent)' },
    pending:   { label: '__T_TASKS_STATUS_PENDING_SHORT__', color: 'var(--color-accent)' },
    done:      { label: '__T_TASKS_STATUS_DONE_SHORT__', color: 'var(--color-good)' },
    completed: { label: '__T_TASKS_STATUS_DONE_SHORT__', color: 'var(--color-good)' },
    aborted:   { label: '__T_TASKS_STATUS_STOPPED_SHORT__', color: 'var(--color-muted)' },
    stopped:   { label: '__T_TASKS_STATUS_STOPPED_SHORT__', color: 'var(--color-muted)' },
    error:     { label: '__T_TASKS_STATUS_ERROR__', color: 'var(--color-bad)' },
};
const statusMeta = (s) => STATUS_META[s] || { label: s || '__T_TASKDETAIL_ROLE_UNKNOWN__', color: 'var(--color-muted)' };
const isActive = (t) => t.status === 'running' || t.status === 'pending';

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
    // Keep polling while the task is still active.
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

function toolCallName(msg) {
    return msg?.tool_calls?.[0]?.function?.name || 'tool';
}
function toolCallArgs(msg) {
    return msg?.tool_calls?.[0]?.function?.arguments || '';
}
function messageText(msg) {
    return msg?.content == null ? '' : String(msg.content);
}
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
    <div v-if="selectedId" class="flex h-full flex-col bg-bg">
        <header class="flex flex-none items-center gap-2 px-4 pt-4 max-md:px-3 max-md:pt-3">
            <button
                class="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                @click="backToList"
                title="__T_TASKDETAIL_BACK__">
                <span class="msi sm">arrow_back</span>
            </button>
            <span class="text-[12px] text-muted">__T_TASKDETAIL_BACK__</span>
            <button
                v-if="selected && isActive(selected)"
                class="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line-hi bg-transparent px-3 py-1 text-[12.5px] text-muted transition-colors hover:border-bad hover:bg-bg-hi hover:text-bad"
                @click="stopFromDetail">
                <span class="msi sm">stop_circle</span>
                <span>__T_TASKS_STOP__</span>
            </button>
        </header>

        <div v-if="detailError" class="mx-8 mt-3 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-4"
             style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
            {{ detailError }}
        </div>

        <div v-if="!selected && !detailError" class="flex flex-1 flex-col items-center gap-2 py-15 text-muted">
            <span class="msi" style="font-size:30px;color:var(--color-faint)">hourglass_empty</span>
            <div class="text-[14px]">__T_TASKS_LOADING__</div>
        </div>

        <div v-else-if="selected" class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-4 max-md:px-4 max-md:pb-10">
            <div class="mb-3 flex flex-wrap items-center gap-2">
                <span class="rounded-md border border-line bg-bg-elev px-1.5 py-px text-[11px] font-medium uppercase tracking-[0.04em] text-ink">
                    {{ selected.app || 'unknown' }}
                </span>
                <span class="text-[12px] text-faint">·</span>
                <span class="text-[12px] text-muted">{{ selected.mode || '—' }}</span>
                <span class="text-[12px] text-faint">·</span>
                <span class="inline-flex items-center gap-1.5 text-[12px] font-medium"
                      :style="{ color: statusMeta(selected.status).color }">
                    <span class="h-1.5 w-1.5 rounded-full"
                          :class="{ 'animate-status-pulse': isActive(selected) }"
                          :style="{ background: statusMeta(selected.status).color }"></span>
                    {{ statusMeta(selected.status).label }}
                </span>
                <span class="text-[12px] text-faint">·</span>
                <span class="text-[12px] text-faint">#{{ selected.id }}</span>
            </div>

            <h2 class="m-0 break-words text-[24px] font-semibold leading-[1.25] tracking-[-0.01em] text-ink max-md:text-[19px]">
                {{ selected.title || `__T_TASKS_TASK_NUMBER__ #${selected.id}` }}
            </h2>

            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-faint">
                <span v-if="selected.created_at">__T_TASKS_CREATED__ {{ fmtFullTime(selected.created_at) }}</span>
                <span v-if="selected.finished_at">__T_TASKS_FINISHED__ {{ fmtFullTime(selected.finished_at) }}</span>
                <span v-if="selected.conversation_id" class="font-mono">{{ selected.conversation_id }}</span>
            </div>

            <div v-if="selected.error" class="mt-4 rounded-lg px-3 py-2 text-[12.5px] text-bad"
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
                <div class="mt-5 mb-1.5 flex items-center justify-between gap-3">
                    <div class="text-[11.5px] font-medium uppercase tracking-wider text-faint">__T_TASKDETAIL_MESSAGES_TITLE__</div>
                    <div class="text-[11.5px] text-faint">{{ '__T_TASKDETAIL_MESSAGES_COUNT__'.replace('{count}', detailMessages.length) }}</div>
                </div>
                <ol class="m-0 flex list-none flex-col gap-2 p-0">
                    <li v-for="row in detailMessages" :key="row.id"
                        class="rounded-lg border border-line bg-bg-elev px-3 py-2.5">
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
            </template>
        </div>
    </div>

    <!-- list -->
    <div v-else class="flex h-full flex-col bg-bg">
        <header class="flex flex-none items-end justify-between gap-4 px-8 pb-5 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
            <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">__T_TASKS_TITLE__</h1>
            <button
                class="inline-flex items-center gap-1.5 rounded-full border-0 bg-bg-hi py-2 pl-3 pr-3.5 text-[13px] font-medium text-muted transition-colors hover:enabled:bg-line-hi hover:enabled:text-ink disabled:cursor-default disabled:opacity-60"
                :disabled="tasks.loading"
                @click="tasks.fetch"
                title="__T_TASKS_REFRESH__">
                <span class="msi sm" :class="{ spin: tasks.loading }">refresh</span>
                <span>__T_TASKS_REFRESH__</span>
            </button>
        </header>

        <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 max-md:px-3 max-md:pb-10">
            <div v-if="tasks.tasks.length === 0" class="flex flex-col items-center gap-2 py-20 text-muted">
                <span class="msi" style="font-size:32px;color:var(--color-faint)">inbox</span>
                <div class="text-[14px]">{{ tasks.loading ? '__T_TASKS_LOADING__' : '__T_TASKS_EMPTY_PLAIN__' }}</div>
                <div v-if="!tasks.loading" class="text-[12px] text-faint">__T_TASKS_EMPTY_HINT__</div>
            </div>

            <ul v-else class="m-0 flex list-none flex-col gap-1.5 p-0">
                <li v-for="t in tasks.tasks" :key="t.id"
                    class="flex cursor-pointer items-start gap-3.5 rounded-[14px] bg-card px-4.5 py-3.5 transition-colors hover:bg-card-hi max-md:gap-2.5 max-md:rounded-xl max-md:px-3.5 max-md:py-3"
                    @click="openDetail(t.id)">
                    <span class="mt-[7px] h-2 w-2 flex-none rounded-full"
                          :class="{ 'animate-status-pulse': isActive(t) }"
                          :style="{ background: statusMeta(t.status).color }"></span>

                    <div class="min-w-0 flex-1">
                        <div class="flex items-baseline gap-3 max-md:flex-wrap">
                            <span class="flex-1 truncate text-[14px] font-medium text-ink">
                                {{ t.title || t.prompt?.slice(0, 60) || `#${t.id}` }}
                            </span>
                            <span class="flex-none text-[12px] text-faint">{{ fmtTime(t.created_at) }}</span>
                        </div>
                        <div class="mt-1 flex items-center gap-2 text-[12px] text-muted">
                            <span class="rounded-md border border-line bg-bg-elev px-1.5 py-px text-[11px] font-medium uppercase tracking-[0.04em] text-ink">
                                {{ t.app || 'unknown' }}
                            </span>
                            <span class="text-faint">·</span>
                            <span>{{ t.mode || '—' }}</span>
                            <span class="text-faint">·</span>
                            <span class="font-medium" :style="{ color: statusMeta(t.status).color }">
                                {{ statusMeta(t.status).label }}
                            </span>
                        </div>
                    </div>

                    <button v-if="isActive(t)"
                        class="stop-btn inline-flex flex-none cursor-pointer items-center gap-1 rounded-full border border-line-hi bg-transparent px-2.5 py-1 text-[12px] text-muted transition-colors"
                        title="__T_TASKS_STOP__"
                        @click.stop="tasks.stop(t.id)">
                        <span class="msi sm">stop_circle</span>
                        __T_TASKS_STOP__
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

.stop-btn:hover {
    color: var(--color-bad);
    border-color: var(--color-bad);
    background: var(--color-bg-hi);
}
</style>
