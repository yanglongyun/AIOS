<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
    ArrowLeft, ChevronRight, Hourglass, LayoutGrid, Lightbulb, Loader2,
    Minus, Package, Plus, RotateCcw, Sparkles, Trash2, X,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

// 视图三态:list / project / plan
const view = computed(() => {
    if (route.params.p2) return 'plan';
    if (route.params.p1) return 'project';
    return 'list';
});
const routeProjectId = computed(() => Number(route.params.p1) || null);
const routePlanId = computed(() => Number(route.params.p2) || null);

const goList = () => router.push('/app/workshop');
const goProject = (id) => router.push(`/app/workshop/${id}`);
const goPlan = (projectId, planId) => router.push(`/app/workshop/${projectId}/${planId}`);

const api = async (path, options = {}) => {
    const res = await fetch(`/apps/workshop${path}`, {
        ...options,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
    return data;
};

// === ideas (灵感库) ===
const ideas = ref([]);
const ideasOpen = ref(false);
const fetchIdeas = async () => {
    try {
        const data = await api('/ideas');
        ideas.value = Array.isArray(data.items) ? data.items : [];
    } catch { /* 静默 */ }
};
const useIdea = (idea) => {
    topic.value = idea.prompt || idea.summary || idea.title;
    ideasOpen.value = false;
};

// === list state ===
const projects = ref([]);
const loadingList = ref(false);
const error = ref('');

const fetchList = async () => {
    loadingList.value = true;
    error.value = '';
    try {
        const data = await api('/project/list');
        projects.value = data.items || [];
    } catch (e) { error.value = e.message; }
    finally { loadingList.value = false; }
};

// === composer ===
const topic = ref('');
const count = ref(3);
const creating = ref(false);
const composing = ref(false);

const createProject = async () => {
    const t = topic.value.trim();
    const n = Math.max(1, Math.min(6, Number(count.value) || 3));
    if (!t || creating.value) return;
    creating.value = true;
    error.value = '';
    try {
        const data = await api('/project/create', {
            method: 'POST',
            body: JSON.stringify({ topic: t, count: n }),
        });
        topic.value = '';
        if (data.project?.id) goProject(data.project.id);
        else await fetchList();
    } catch (e) { error.value = e.message; }
    finally { creating.value = false; }
};

const onTopicKey = (e) => {
    if (composing.value || e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createProject(); }
};

const removeProject = async (id, e) => {
    e?.stopPropagation();
    if (!confirm(`删除这个项目?`)) return;
    try {
        await api('/project/delete', { method: 'POST', body: JSON.stringify({ id }) });
        projects.value = projects.value.filter(p => p.id !== id);
    } catch (e) { error.value = e.message; }
};

// === project detail ===
const project = ref(null);
const plans = ref([]);
const loadingProject = ref(false);

const fetchProject = async (id) => {
    if (!id) return;
    try {
        const data = await api(`/project/get?id=${id}`);
        project.value = data.project || null;
        plans.value = data.plans || [];
    } catch (e) { error.value = e.message; }
};

const loadProject = async (id) => {
    loadingProject.value = true;
    project.value = null;
    plans.value = [];
    try { await fetchProject(id); }
    finally { loadingProject.value = false; }
};

const hasActive = computed(() => plans.value.some(p => {
    const s = p.latestTask?.status;
    return s === 'pending' || s === 'running';
}));

let pollTimer = null;
const stopPoll = () => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } };
const startPoll = () => {
    stopPoll();
    pollTimer = setInterval(() => {
        if (view.value !== 'project' || !routeProjectId.value) { stopPoll(); return; }
        if (!hasActive.value) { stopPoll(); return; }
        fetchProject(routeProjectId.value);
    }, 2500);
};

const regenerate = async (planId, e) => {
    e?.stopPropagation();
    try {
        await api('/plan/regenerate', { method: 'POST', body: JSON.stringify({ planId }) });
        await fetchProject(routeProjectId.value);
        startPoll();
    } catch (e) { error.value = e.message; }
};

// === plan detail (iframe) ===
const planHtml = ref('');
const planMeta = ref(null);
const planLoading = ref(false);

const loadPlanResult = async (planId) => {
    planLoading.value = true;
    planHtml.value = '';
    planMeta.value = null;
    try {
        const data = await api(`/result/get?planId=${planId}`);
        planHtml.value = data.html || '';
        planMeta.value = {
            title: data.plan?.title,
            description: data.plan?.description,
            projectId: data.plan?.projectId,
        };
    } catch (e) { error.value = e.message; }
    finally { planLoading.value = false; }
};

// === lifecycle ===
onMounted(() => { fetchList(); fetchIdeas(); });
onUnmounted(stopPoll);

watch([view, routeProjectId, routePlanId], async ([v, pid, planId]) => {
    error.value = '';
    if (v === 'list') {
        stopPoll();
        await fetchList();
    } else if (v === 'project' && pid) {
        stopPoll();
        await loadProject(pid);
        if (hasActive.value) startPoll();
    } else if (v === 'plan' && planId) {
        stopPoll();
        await loadPlanResult(planId);
    }
}, { immediate: true });

const statusLabel = (s) => ({
    pending: '排队中',
    running: '生成中',
    done: '已完成',
    failed: '失败',
}[s] || s || '未知');

const statusClass = (s) => ({
    pending: 'bg-bg-hi text-muted',
    running: 'text-accent border border-accent/30',
    done: 'text-good border border-good/30',
    failed: 'text-bad border border-bad/30',
}[s] || 'bg-bg-hi text-muted');

</script>

<template>
    <!-- ============== PLAN (iframe) ============== -->
    <div v-if="view === 'plan'" class="flex h-full flex-col bg-bg">
        <header class="mx-auto flex w-full max-w-[1100px] flex-none items-center gap-3 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <button class="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                @click="goProject(planMeta?.projectId || routeProjectId)" title="__T_COMMON_BACK__">
                <ArrowLeft :size="20" :stroke-width="1.8" />
            </button>
            <div class="min-w-0 flex-1">
                <div class="truncate text-[14px] font-semibold text-ink">{{ planMeta?.title || '__T_COMMON_LOADING__' }}</div>
                <div v-if="planMeta?.description" class="truncate text-[12px] text-faint">{{ planMeta.description }}</div>
            </div>
        </header>

        <div class="mx-auto w-full max-w-[1100px] min-h-0 flex-1 px-6 pb-6 pt-1 max-md:px-3 max-md:pb-3">
            <div v-if="planLoading" class="flex h-full flex-col items-center justify-center gap-2 text-muted">
                <Hourglass :size="30" :stroke-width="1.6" class="text-faint" />
                <div class="text-[14px]">__T_COMMON_LOADING__</div>
            </div>
            <iframe v-else
                :srcdoc="planHtml"
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                referrerpolicy="no-referrer"
                class="block h-full w-full rounded-xl border border-line bg-bg-elev"
                :title="planMeta?.title || 'workshop'"></iframe>
        </div>
    </div>

    <!-- ============== PROJECT DETAIL ============== -->
    <div v-else-if="view === 'project'" class="flex h-full flex-col bg-bg">
        <header class="mx-auto flex w-full max-w-[1100px] flex-none items-center gap-3 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <button class="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                @click="goList" title="__T_COMMON_BACK__">
                <ArrowLeft :size="20" :stroke-width="1.8" />
            </button>
            <div class="min-w-0 flex-1">
                <div class="truncate text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink max-md:text-[19px]">
                    {{ project?.topic || '__T_COMMON_LOADING__' }}
                </div>
            </div>
        </header>

        <div class="mx-auto w-full max-w-[1100px] min-h-0 flex-1 overflow-auto px-8 pb-15 pt-2 max-md:px-3 max-md:pb-10">
            <div v-if="error" class="mb-3 rounded-[10px] px-3.5 py-2 text-[13px] text-bad"
                style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                {{ error }}
            </div>

            <div v-if="loadingProject && !plans.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                <Hourglass :size="30" :stroke-width="1.6" class="text-faint" />
                <div class="text-[14px]">__T_COMMON_LOADING__</div>
            </div>

            <ul v-else class="m-0 grid list-none gap-3 p-0"
                style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                <li v-for="p in plans" :key="p.id">
                    <div class="group flex h-full flex-col gap-2 rounded-[14px] border border-line bg-card p-4 transition-colors hover:border-line-hi hover:bg-card-hi"
                        :class="{ 'cursor-pointer': p.hasResult }"
                        @click="p.hasResult && goPlan(project.id, p.id)">
                        <div class="flex items-start gap-2">
                            <div class="min-w-0 flex-1">
                                <div class="truncate text-[14.5px] font-semibold text-ink">{{ p.title }}</div>
                                <div v-if="p.description" class="mt-0.5 line-clamp-2 text-[12.5px] leading-[1.5] text-muted">{{ p.description }}</div>
                            </div>
                            <span class="flex-none inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                                :class="statusClass(p.latestTask?.status)">
                                <Loader2 v-if="p.latestTask?.status === 'running'" :size="12" :stroke-width="1.8" class="spin" />
                                {{ statusLabel(p.latestTask?.status) }}
                            </span>
                        </div>
                        <div v-if="p.latestTask?.status === 'failed' && p.latestTask?.error"
                            class="line-clamp-2 text-[11.5px] text-bad">
                            {{ p.latestTask.error }}
                        </div>
                        <div class="mt-auto flex items-center gap-2 pt-1">
                            <span class="font-mono text-[11px] text-faint">{{ p.slug }}</span>
                            <button v-if="p.latestTask?.status === 'failed' || p.hasResult"
                                class="ml-auto inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border-0 bg-bg-hi px-2 text-[11.5px] text-muted hover:bg-bg-elev hover:text-ink"
                                @click="regenerate(p.id, $event)" title="再生成">
                                <RotateCcw :size="13" :stroke-width="1.8" />
                                <span>再生成</span>
                            </button>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>

    <!-- ============== LIST ============== -->
    <div v-else class="flex h-full flex-col bg-bg">
        <header class="mx-auto flex w-full max-w-[820px] flex-none items-center gap-3 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <h1 class="m-0 text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink max-md:text-[19px]">__T_APP_WORKSHOP__</h1>
        </header>

        <div class="mx-auto w-full max-w-[820px] min-h-0 flex-1 overflow-auto px-8 pb-15 pt-2 max-md:px-3 max-md:pb-10">

            <!-- composer -->
            <div class="mb-3 rounded-2xl border border-line bg-card p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <textarea v-model="topic"
                    @keydown="onTopicKey"
                    @compositionstart="composing = true"
                    @compositionend="composing = false"
                    rows="2"
                    placeholder="描述要做的样稿主题,例如:购物车页面 / 项目看板 / 个人主页"
                    class="block w-full resize-none rounded-xl border-0 bg-bg-hi px-3.5 py-2 text-[13.5px] leading-[1.55] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/40"></textarea>
                <div class="mt-2 flex items-center gap-2">
                    <div class="inline-flex h-9 items-center gap-1 rounded-xl bg-bg-hi px-1">
                        <button class="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent text-muted hover:bg-bg-elev hover:text-ink disabled:opacity-40"
                            :disabled="count <= 1 || creating"
                            @click="count = Math.max(1, (Number(count) || 1) - 1)">
                            <Minus :size="14" :stroke-width="1.8" class="mx-auto" />
                        </button>
                        <span class="w-6 text-center font-mono text-[13px] font-semibold text-ink">{{ count }}</span>
                        <button class="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent text-muted hover:bg-bg-elev hover:text-ink disabled:opacity-40"
                            :disabled="count >= 6 || creating"
                            @click="count = Math.min(6, (Number(count) || 1) + 1)">
                            <Plus :size="14" :stroke-width="1.8" class="mx-auto" />
                        </button>
                    </div>
                    <button class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-bg-hi px-3 text-[12.5px] text-muted hover:bg-bg-elev hover:text-ink"
                        @click="ideasOpen = !ideasOpen" title="灵感库">
                        <Lightbulb :size="14" :stroke-width="1.8" />
                        <span>灵感</span>
                        <span class="font-mono text-[11px] text-faint">{{ ideas.length }}</span>
                    </button>
                    <button class="ml-auto inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 px-4 text-[13px] font-semibold text-white disabled:cursor-default disabled:opacity-45"
                        :disabled="creating || !topic.trim()"
                        @click="createProject"
                        style="background: var(--color-accent); transition: background .12s, box-shadow .12s; box-shadow: 0 1px 2px color-mix(in srgb, var(--color-accent) 30%, transparent);">
                        <Loader2 v-if="creating" :size="15" :stroke-width="1.9" class="spin" />
                        <Sparkles v-else :size="15" :stroke-width="1.9" />
                        <span>{{ creating ? '规划中…' : '创建项目' }}</span>
                    </button>
                </div>
            </div>

            <!-- ideas drawer -->
            <transition name="ideas">
                <div v-if="ideasOpen" class="mb-3 rounded-2xl border border-line bg-bg-elev p-3">
                    <div class="mb-2 flex items-center gap-2">
                        <Lightbulb :size="14" :stroke-width="1.8" class="text-accent" />
                        <span class="text-[12.5px] font-semibold text-ink">灵感库</span>
                        <span class="text-[11px] text-faint">点一个把它当起点</span>
                        <button class="ml-auto h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent text-faint hover:bg-bg-hi hover:text-ink"
                            @click="ideasOpen = false">
                            <X :size="14" :stroke-width="1.8" class="mx-auto" />
                        </button>
                    </div>
                    <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0 max-md:grid-cols-1">
                        <li v-for="idea in ideas" :key="idea.id">
                            <button class="group flex h-full w-full cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-bg px-3 py-2.5 text-left transition-colors hover:border-line-hi hover:bg-card-hi"
                                @click="useIdea(idea)">
                                <span class="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-bg-hi text-accent">
                                    <Sparkles :size="16" :stroke-width="1.7" />
                                </span>
                                <span class="min-w-0 flex-1">
                                    <span class="flex items-baseline gap-2">
                                        <span class="truncate text-[13px] font-semibold text-ink">{{ idea.title }}</span>
                                        <span class="shrink-0 rounded border border-line px-1 py-px text-[10px] text-faint">{{ idea.category }}</span>
                                    </span>
                                    <span class="mt-0.5 line-clamp-2 block text-[11.5px] leading-[1.5] text-muted">{{ idea.summary }}</span>
                                </span>
                            </button>
                        </li>
                    </ul>
                </div>
            </transition>

            <div v-if="error" class="mb-3 rounded-[10px] px-3.5 py-2 text-[13px] text-bad"
                style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                {{ error }}
            </div>

            <div v-if="loadingList && !projects.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                <Hourglass :size="30" :stroke-width="1.6" class="text-faint" />
                <div class="text-[14px]">__T_COMMON_LOADING__</div>
            </div>

            <div v-else-if="!projects.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                <Package :size="32" :stroke-width="1.5" class="text-faint" />
                <div class="text-[14px]">__T_WORKSHOP_EMPTY__</div>
            </div>

            <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
                <li v-for="p in projects" :key="p.id">
                    <div class="group relative flex w-full items-center gap-3 rounded-[14px] border border-line bg-card px-4 py-3 transition-colors hover:border-line-hi hover:bg-card-hi">
                        <button class="flex flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent text-left p-0"
                            @click="goProject(p.id)">
                            <span class="grid h-10 w-10 flex-none place-items-center rounded-lg bg-bg-hi text-muted">
                                <LayoutGrid :size="18" :stroke-width="1.7" />
                            </span>
                            <div class="min-w-0 flex-1">
                                <div class="truncate text-[14.5px] font-semibold text-ink">{{ p.topic }}</div>
                                <div class="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                                    <span class="text-faint">{{ p.counts?.plans || 0 }} 个方向</span>
                                    <span v-if="p.counts?.running" class="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-accent border border-accent/30">
                                        <Loader2 :size="11" :stroke-width="1.8" class="spin" />
                                        {{ p.counts.running }} 生成中
                                    </span>
                                    <span v-if="p.counts?.pending" class="rounded-full bg-bg-hi px-1.5 py-px text-muted">
                                        {{ p.counts.pending }} 排队
                                    </span>
                                    <span v-if="p.counts?.done" class="rounded-full px-1.5 py-px text-good border border-good/30">
                                        {{ p.counts.done }} 完成
                                    </span>
                                    <span v-if="p.counts?.failed" class="rounded-full px-1.5 py-px text-bad border border-bad/30">
                                        {{ p.counts.failed }} 失败
                                    </span>
                                </div>
                            </div>
                        </button>
                        <button class="ml-2 grid h-9 w-9 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-bg-hi hover:text-bad"
                            @click="removeProject(p.id, $event)" title="删除">
                            <Trash2 :size="16" :stroke-width="1.7" />
                        </button>
                        <ChevronRight :size="18" :stroke-width="1.6" class="flex-none text-faint" />
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.ideas-enter-active, .ideas-leave-active { transition: opacity .15s, transform .15s; }
.ideas-enter-from, .ideas-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
