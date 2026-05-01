<script setup>
import { computed, onMounted, ref } from 'vue';

const CATALOG_URL = 'https://iimos.ai/apps/catalog.json';

const items = ref([]);
const loading = ref(false);
const error = ref('');
const query = ref('');
const category = ref('all');
const selected = ref(null);

const CATEGORY_LABELS = {
    core: '__T_STORE_CATEGORY_CORE__',
    creation: '__T_STORE_CATEGORY_CREATION__',
    developer: '__T_STORE_CATEGORY_DEVELOPER__',
    finance: '__T_STORE_CATEGORY_FINANCE__',
    game: '__T_STORE_CATEGORY_GAME__',
    knowledge: '__T_STORE_CATEGORY_KNOWLEDGE__',
    life: '__T_STORE_CATEGORY_LIFE__',
    news: '__T_STORE_CATEGORY_NEWS__',
    productivity: '__T_STORE_CATEGORY_PRODUCTIVITY__',
    system: '__T_STORE_CATEGORY_SYSTEM__',
    tools: '__T_STORE_CATEGORY_TOOLS__'
};

const loadCatalog = async () => {
    loading.value = true;
    error.value = '';
    try {
        const res = await fetch(CATALOG_URL);
        const data = await res.json();
        if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);
        items.value = Array.isArray(data.items) ? data.items : [];
        if (selected.value) {
            selected.value = items.value.find((item) => item.id === selected.value.id) || null;
        }
    } catch (e) {
        error.value = e.message || '__T_STORE_LOAD_FAILED__';
    } finally {
        loading.value = false;
    }
};

const categories = computed(() => {
    const counts = new Map();
    for (const item of items.value) {
        const key = item.category || 'tools';
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [
        { key: 'all', label: '__T_STORE_CATEGORY_ALL__', count: items.value.length },
        ...Array.from(counts.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, count]) => ({ key, label: CATEGORY_LABELS[key] || key, count }))
    ];
});

const filteredItems = computed(() => {
    const q = query.value.trim().toLowerCase();
    return items.value.filter((item) => {
        if (category.value !== 'all' && item.category !== category.value) return false;
        if (!q) return true;
        return [item.id, item.title, item.description, item.summary, item.category]
            .some((value) => String(value || '').toLowerCase().includes(q));
    });
});

const stats = computed(() => ({
    total: items.value.length,
    categories: categories.value.length > 0 ? categories.value.length - 1 : 0,
    packaged: items.value.filter((item) => item.packageUrl || item.packageKey).length
}));

const iconFor = (item) => item.icon || 'apps';
const categoryLabel = (key) => CATEGORY_LABELS[key] || key || 'tools';
const packageState = (item) => item.packageUrl || item.packageKey ? '__T_STORE_PACKAGE_READY__' : '__T_STORE_PACKAGE_PENDING__';

onMounted(loadCatalog);
</script>

<template>
    <div class="flex h-full flex-col bg-bg">
        <header class="flex flex-none items-end justify-between gap-4 px-8 pb-4 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
            <div>
                <h1 class="m-0 text-[30px] font-semibold leading-[1.15] text-ink max-md:text-[24px]">__T_STORE_TITLE__</h1>
                <div class="mt-1 text-[12px] text-faint">__T_STORE_SUBTITLE__</div>
            </div>
            <button
                class="inline-flex items-center gap-1.5 rounded-full border-0 bg-bg-hi px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-line-hi hover:text-ink disabled:opacity-60"
                :disabled="loading"
                @click="loadCatalog">
                <span class="msi sm" :class="{ spin: loading }">refresh</span>
                <span>__T_COMMON_REFRESH__</span>
            </button>
        </header>

        <div class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px] gap-4 px-8 pb-10 max-lg:grid-cols-1 max-md:px-3">
            <main class="min-h-0 overflow-auto">
                <section class="mb-4 grid grid-cols-3 gap-2 max-sm:grid-cols-1">
                    <div class="rounded-lg border border-line bg-bg-elev px-4 py-3">
                        <div class="text-[11px] font-medium uppercase text-faint">__T_STORE_TOTAL__</div>
                        <div class="mt-1 text-[24px] font-semibold text-ink">{{ stats.total }}</div>
                    </div>
                    <div class="rounded-lg border border-line bg-bg-elev px-4 py-3">
                        <div class="text-[11px] font-medium uppercase text-faint">__T_STORE_CATEGORIES__</div>
                        <div class="mt-1 text-[24px] font-semibold text-ink">{{ stats.categories }}</div>
                    </div>
                    <div class="rounded-lg border border-line bg-bg-elev px-4 py-3">
                        <div class="text-[11px] font-medium uppercase text-faint">__T_STORE_PACKAGES__</div>
                        <div class="mt-1 text-[24px] font-semibold text-ink">{{ stats.packaged }}</div>
                    </div>
                </section>

                <section class="mb-3 flex flex-wrap items-center gap-2">
                    <label class="relative min-w-[220px] flex-1">
                        <span class="msi sm absolute left-3 top-1/2 -translate-y-1/2 text-faint">search</span>
                        <input
                            v-model="query"
                            class="h-10 w-full rounded-lg border border-line-hi bg-bg-elev pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent"
                            placeholder="__T_STORE_SEARCH_PLACEHOLDER__" />
                    </label>
                    <nav class="flex flex-wrap gap-1">
                        <button
                            v-for="cat in categories"
                            :key="cat.key"
                            class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors"
                            :class="category === cat.key ? 'border-transparent bg-blue-bg text-blue-fg' : 'border-line-hi bg-bg text-muted hover:bg-bg-hi hover:text-ink'"
                            @click="category = cat.key">
                            <span>{{ cat.label }}</span>
                            <span class="text-[11px] opacity-70">{{ cat.count }}</span>
                        </button>
                    </nav>
                </section>

                <div v-if="error" class="mb-3 rounded-lg px-3.5 py-2 text-[13px] text-bad"
                    style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                    {{ error }}
                </div>

                <div v-if="loading && !items.length" class="flex flex-col items-center gap-2 py-16 text-muted">
                    <span class="msi" style="font-size:32px;color:var(--color-faint)">hourglass_empty</span>
                    <div class="text-[14px]">__T_COMMON_LOADING__</div>
                </div>

                <div v-else-if="!filteredItems.length" class="rounded-lg border border-line bg-bg-elev py-12 text-center text-[13px] text-faint">
                    __T_STORE_EMPTY__
                </div>

                <ul v-else class="m-0 grid list-none grid-cols-2 gap-2 p-0 max-xl:grid-cols-1">
                    <li v-for="item in filteredItems" :key="item.id">
                        <button
                            class="flex h-full w-full cursor-pointer items-start gap-3 rounded-lg border border-line bg-bg-elev px-4 py-3 text-left transition-colors hover:bg-card-hi"
                            :class="selected?.id === item.id ? 'border-accent' : ''"
                            @click="selected = item">
                            <span class="mt-0.5 grid h-10 w-10 flex-none place-items-center rounded-lg bg-bg-hi text-ink">
                                <span class="msi">{{ iconFor(item) }}</span>
                            </span>
                            <span class="min-w-0 flex-1">
                                <span class="flex items-baseline gap-2">
                                    <span class="truncate text-[14px] font-semibold text-ink">{{ item.title || item.name || item.id }}</span>
                                    <span class="shrink-0 rounded border border-line px-1.5 py-px text-[10.5px] text-faint">{{ categoryLabel(item.category) }}</span>
                                </span>
                                <span class="mt-1 line-clamp-2 block text-[12px] leading-[1.5] text-muted">{{ item.summary || item.description || item.id }}</span>
                                <span class="mt-2 flex items-center gap-2 text-[11px] text-faint">
                                    <span class="font-mono">{{ item.id }}</span>
                                    <span>·</span>
                                    <span>{{ item.latestVersion || '0.1.0' }}</span>
                                    <span>·</span>
                                    <span>{{ packageState(item) }}</span>
                                </span>
                            </span>
                        </button>
                    </li>
                </ul>
            </main>

            <aside class="min-h-0 overflow-auto rounded-lg border border-line bg-bg-elev px-4 py-4 max-lg:hidden">
                <div v-if="!selected" class="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 text-center text-muted">
                    <span class="msi" style="font-size:34px;color:var(--color-faint)">apps</span>
                    <div class="text-[13px]">__T_STORE_SELECT_HINT__</div>
                </div>
                <div v-else>
                    <div class="flex items-start gap-3">
                        <span class="grid h-11 w-11 flex-none place-items-center rounded-lg bg-bg-hi text-ink">
                            <span class="msi">{{ iconFor(selected) }}</span>
                        </span>
                        <div class="min-w-0">
                            <h2 class="m-0 truncate text-[18px] font-semibold text-ink">{{ selected.title || selected.name || selected.id }}</h2>
                            <div class="mt-1 font-mono text-[11px] text-faint">{{ selected.id }}</div>
                        </div>
                    </div>

                    <p class="mt-4 whitespace-pre-wrap text-[13px] leading-[1.65] text-muted">{{ selected.description || selected.summary || selected.id }}</p>

                    <dl class="mt-4 grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[12px]">
                        <dt class="text-faint">__T_STORE_CATEGORY__</dt>
                        <dd class="m-0 text-ink">{{ categoryLabel(selected.category) }}</dd>
                        <dt class="text-faint">__T_STORE_VERSION__</dt>
                        <dd class="m-0 text-ink">{{ selected.latestVersion || '0.1.0' }}</dd>
                        <dt class="text-faint">__T_STORE_SOURCE__</dt>
                        <dd class="m-0 text-ink">{{ selected.source || '-' }}</dd>
                        <dt class="text-faint">__T_STORE_FRONTEND__</dt>
                        <dd class="m-0 break-all font-mono text-ink">{{ selected.frontend || '-' }}</dd>
                        <dt class="text-faint">__T_STORE_BACKEND__</dt>
                        <dd class="m-0 break-all font-mono text-ink">{{ selected.backend || '-' }}</dd>
                        <dt class="text-faint">__T_STORE_DATABASE__</dt>
                        <dd class="m-0 break-all font-mono text-ink">{{ selected.database || '-' }}</dd>
                    </dl>

                    <a v-if="selected.packageUrl"
                        class="mt-5 inline-flex items-center gap-1.5 rounded-full bg-blue-bg px-3 py-2 text-[12.5px] font-semibold text-blue-fg"
                        :href="selected.packageUrl"
                        target="_blank"
                        rel="noreferrer">
                        <span class="msi sm">download</span>
                        <span>__T_STORE_DOWNLOAD_PACKAGE__</span>
                    </a>
                    <div v-else class="mt-5 rounded-lg border border-line bg-bg px-3 py-2 text-[12px] text-faint">
                        __T_STORE_PACKAGE_NOT_READY__
                    </div>
                </div>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.spin { animation: store-spin 1s linear infinite; }
@keyframes store-spin { to { transform: rotate(360deg); } }
</style>
