<script setup>
import AppLauncher from '@/components/AppLauncher.vue';
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuickChatStore } from '@/stores/quickChat';

const qc = useQuickChatStore();
const route = useRoute();
const router = useRouter();

const items = ref([]);
const loading = ref(false);
const error = ref('');
const detailHtml = ref('');
const detailMeta = ref(null);
const detailLoading = ref(false);

const view = computed(() => route.params.p1 ? 'detail' : 'list');
const routeSlug = computed(() => route.params.p1 || null);

const goList = () => router.push('/app/demo');
const goDetail = (slug) => router.push(`/app/demo/${slug}`);

const api = async (path) => {
    const res = await fetch(`/apps/demo${path}`, { credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
    return data;
};

const fetchList = async () => {
    loading.value = true;
    error.value = '';
    try {
        const data = await api('/list');
        items.value = data.items || [];
    } catch (e) { error.value = e.message; }
    finally { loading.value = false; }
};

const fetchDetail = async (slug) => {
    if (!slug) return;
    detailLoading.value = true;
    detailHtml.value = '';
    detailMeta.value = null;
    try {
        const data = await api(`/get?slug=${encodeURIComponent(slug)}`);
        detailHtml.value = data.html || '';
        detailMeta.value = { title: data.title, description: data.description };
    } catch (e) { error.value = e.message; }
    finally { detailLoading.value = false; }
};

onMounted(fetchList);

watchEffect(() => {
    if (view.value === 'detail' && routeSlug.value) {
        fetchDetail(routeSlug.value);
    }
});

watchEffect(() => {
    qc.setContext({
        scope: `demo:${view.value === 'detail' ? routeSlug.value : 'list'}`,
        label: '__T_APP_DEMO__',
        snapshot: view.value === 'detail' && detailMeta.value
            ? `${detailMeta.value.title}\n${detailMeta.value.description || ''}`
            : `${items.value.length} demos`,
    });
});
</script>

<template>
    <!-- ============== DETAIL ============== -->
    <div v-if="view === 'detail'" class="flex h-full flex-col bg-bg">
        <header class="mx-auto flex w-full max-w-[1100px] flex-none items-center gap-3 px-6 pb-2 pt-5 max-md:px-3 max-md:pt-3">
            <button class="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                @click="goList" :title="'__T_COMMON_BACK__'">
                <span class="msi" style="font-size:20px">arrow_back</span>
            </button>
            <div class="min-w-0 flex-1">
                <div class="truncate text-[14px] font-semibold text-ink">{{ detailMeta?.title || '__T_DEMO_LOADING__' }}</div>
                <div v-if="detailMeta?.description" class="truncate text-[12px] text-faint">{{ detailMeta.description }}</div>
            </div>
            <AppLauncher />
        </header>

        <div class="mx-auto w-full max-w-[1100px] flex-none px-6 pb-3 max-md:px-3">
            <div class="rounded-md border border-line bg-bg-elev px-3 py-1.5 text-[11px] text-faint">
                <span class="msi align-[-2px]" style="font-size:13px">info</span>
                __T_DEMO_IFRAME_HINT__
            </div>
        </div>

        <div class="mx-auto w-full max-w-[1100px] min-h-0 flex-1 px-6 pb-6 max-md:px-3 max-md:pb-3">
            <div v-if="detailLoading" class="flex h-full flex-col items-center justify-center gap-2 text-muted">
                <span class="msi text-faint" style="font-size:30px">hourglass_empty</span>
                <div class="text-[14px]">__T_DEMO_LOADING__</div>
            </div>
            <iframe v-else
                :srcdoc="detailHtml"
                sandbox="allow-same-origin"
                class="block h-full w-full rounded-xl border border-line bg-bg-elev"
                :title="detailMeta?.title || 'demo'"></iframe>
        </div>
    </div>

    <!-- ============== LIST ============== -->
    <div v-else class="flex h-full flex-col bg-bg">
        <header class="mx-auto flex w-full max-w-[820px] flex-none items-baseline gap-3 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <h1 class="m-0 text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink max-md:text-[19px]">__T_APP_DEMO__</h1>
            <AppLauncher class="ml-auto self-center" />
        </header>

        <div class="mx-auto w-full max-w-[820px] min-h-0 flex-1 overflow-auto px-8 pb-15 pt-2 max-md:px-3 max-md:pb-10">
            <div v-if="error" class="mb-3 rounded-[10px] px-3.5 py-2 text-[13px] text-bad"
                style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                {{ error }}
            </div>

            <div v-if="loading && !items.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                <span class="msi text-faint" style="font-size:30px">hourglass_empty</span>
                <div class="text-[14px]">__T_DEMO_LOADING__</div>
            </div>

            <div v-else-if="!items.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                <span class="msi text-faint" style="font-size:32px">deployed_code</span>
                <div class="text-[14px]">__T_DEMO_EMPTY__</div>
            </div>

            <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
                <li v-for="d in items" :key="d.slug">
                    <button class="flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-line bg-card px-4 py-3 text-left transition-colors hover:border-line-hi hover:bg-card-hi"
                        @click="goDetail(d.slug)">
                        <span class="grid h-10 w-10 flex-none place-items-center rounded-lg bg-bg-hi font-mono text-[12px] font-bold text-muted">
                            {{ d.slug.split('-').pop()?.toUpperCase() || '·' }}
                        </span>
                        <div class="min-w-0 flex-1">
                            <div class="truncate text-[14.5px] font-semibold text-ink">{{ d.title }}</div>
                            <div v-if="d.description" class="mt-0.5 line-clamp-2 text-[12.5px] leading-[1.5] text-muted">{{ d.description }}</div>
                            <div class="mt-1 font-mono text-[11px] text-faint">{{ d.slug }}</div>
                        </div>
                        <span class="msi flex-none text-faint" style="font-size:18px">chevron_right</span>
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>
