<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLauncher from '@/components/AppLauncher.vue';

const router = useRouter();

const notes   = ref([]);
const loading = ref(false);
const error   = ref('');
const query   = ref('');

const api = async (path, options = {}) => {
    const res = await fetch(`/apps/notebook${path}`, {
        ...options,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
    return data;
};

const fetchAll = async () => {
    loading.value = true;
    error.value = '';
    try {
        const data = await api('/list');
        notes.value = data.items || [];
    } catch (e) { error.value = e.message; }
    finally { loading.value = false; }
};

onMounted(fetchAll);

// ---- search ----
const matches = (n, q) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [n.title, n.summary, n.content].some((t) => (t || '').toLowerCase().includes(s));
};
const visible = computed(() => notes.value.filter((n) => matches(n, query.value.trim())));
const pinned  = computed(() => visible.value.filter((n) => n.pinned));
const others  = computed(() => visible.value.filter((n) => !n.pinned));

// ---- actions ----
const goNew  = () => router.push('/app/notebook/new');
const goEdit = (id) => router.push(`/app/notebook/${id}`);
const togglePin = async (n) => {
    try {
        const data = await api('/update', { method: 'POST', body: JSON.stringify({ id: n.id, pinned: !n.pinned }) });
        const idx = notes.value.findIndex((x) => x.id === n.id);
        if (idx >= 0) notes.value[idx] = data.item;
    } catch (e) { error.value = e.message; }
};

// ---- preview ----
const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso.replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) return iso;
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (sameDay) return d.toTimeString().slice(0, 5);
    if (d.toDateString() === yesterday.toDateString()) return '昨天';
    if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日`;
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden">

        <!-- Top bar -->
        <header class="flex flex-none items-center gap-3 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <h1 class="m-0 text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink max-md:text-[19px]">笔记</h1>
            <AppLauncher class="ml-auto flex-none" />
        </header>

        <div class="px-8 pb-3 pt-1 max-md:px-4">
            <div class="search-box flex max-w-[480px] items-center gap-2 rounded-[10px] px-3.5 py-2 text-[14px]">
                <span class="msi text-faint" style="font-size:17px">search</span>
                <input v-model="query" placeholder="搜索笔记" class="min-w-0 flex-1 border-0 bg-transparent text-ink outline-none placeholder:text-faint" />
                <button v-if="query" class="text-faint hover:text-ink" @click="query = ''" title="清除">
                    <span class="msi" style="font-size:16px">close</span>
                </button>
            </div>
        </div>

        <div v-if="error" class="mx-8 my-2 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-4"
             style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
            {{ error }}
        </div>

        <!-- Body -->
        <div class="min-h-0 flex-1 overflow-auto px-8 pb-24 pt-2 max-md:px-4 max-md:pb-24">

            <div v-if="loading && !notes.length" class="flex h-full items-center justify-center text-muted">
                <span class="msi" style="font-size:22px;animation:spin 1s linear infinite">progress_activity</span>
            </div>

            <div v-else-if="!visible.length && !loading" class="empty-card mx-auto mt-16 max-w-[420px] rounded-2xl p-8 text-center">
                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                     style="background: var(--color-accent-bg); color: var(--color-accent-hi)">
                    <span class="msi" style="font-size:24px">edit_note</span>
                </div>
                <div class="mb-1 text-[16px] font-semibold text-ink">{{ query ? '没有匹配的笔记' : '还没有笔记' }}</div>
                <div class="text-[13px] text-muted">{{ query ? '换个词试试。' : '点右下角 + 写第一条。' }}</div>
            </div>

            <template v-else>
                <!-- Pinned -->
                <template v-if="pinned.length">
                    <div class="sec-h">已固定</div>
                    <div class="grid">
                        <article v-for="n in pinned" :key="'p-' + n.id"
                                 class="note"
                                 :class="[n.pinned ? 'is-pinned' : '']"
                                 @click="goEdit(n.id)">
                            <button class="pin-btn" @click.stop="togglePin(n)" title="取消置顶">
                                <span class="msi" style="font-size:16px">push_pin</span>
                            </button>
                            <h3 v-if="n.title" class="title-line">{{ n.title }}</h3>
                            <div v-if="n.summary" class="summary-line">{{ n.summary }}</div>
                            <div v-if="!n.title && !n.summary" class="text-[13px] italic text-faint">空笔记</div>
                            <div class="meta-line">
                                <span>{{ formatDate(n.updatedAt) }}</span>
                            </div>
                        </article>
                    </div>
                </template>

                <!-- Others -->
                <template v-if="others.length">
                    <div class="sec-h" :style="pinned.length ? 'margin-top:22px' : ''">{{ pinned.length ? '其他' : '全部笔记' }}</div>
                    <div class="grid">
                        <article v-for="n in others" :key="n.id"
                                 class="note"
                                 @click="goEdit(n.id)">
                            <button class="pin-btn" @click.stop="togglePin(n)" title="置顶">
                                <span class="msi" style="font-size:16px">push_pin</span>
                            </button>
                            <h3 v-if="n.title" class="title-line">{{ n.title }}</h3>
                            <div v-if="n.summary" class="summary-line">{{ n.summary }}</div>
                            <div v-if="!n.title && !n.summary" class="text-[13px] italic text-faint">空笔记</div>
                            <div class="meta-line">
                                <span>{{ formatDate(n.updatedAt) }}</span>
                            </div>
                        </article>
                    </div>
                </template>
            </template>
        </div>

        <!-- Floating + button -->
        <button class="fab" @click="goNew" title="新建笔记">
            <span class="msi" style="font-size:26px">add</span>
        </button>

    </div>
</template>

<style scoped>
.search-box {
    background: var(--color-bg-hi);
    transition: background .15s, box-shadow .15s;
}
.search-box:focus-within {
    background: #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.kbd {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--color-bg-hi);
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 600;
    margin: 0 2px;
}
.ai-em { color: var(--color-accent); font-weight: 700; }

.sec-h {
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    margin: 12px 6px 14px;
    text-transform: uppercase;
}

/* Masonry */
.grid {
    column-count: 5;
    column-gap: 14px;
}
@media (max-width: 1500px) { .grid { column-count: 4; } }
@media (max-width: 1200px) { .grid { column-count: 3; } }
@media (max-width: 900px)  { .grid { column-count: 2; } }
@media (max-width: 600px)  { .grid { column-count: 1; } }

.note {
    break-inside: avoid;
    margin-bottom: 14px;
    border: 1px solid var(--color-line);
    border-radius: 12px;
    padding: 14px 16px 12px;
    background: var(--color-card);
    position: relative;
    cursor: pointer;
    transition: box-shadow .15s, border-color .15s, transform .15s;
}
.note:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 6px 18px rgba(0,0,0,0.04);
    border-color: var(--color-line-hi);
}

.pin-btn {
    position: absolute;
    top: 8px; right: 10px;
    width: 28px; height: 28px;
    border-radius: 50%;
    color: var(--color-ink);
    display: flex; align-items: center; justify-content: center;
    opacity: 0;
    transition: opacity .15s, background .12s;
    border: none;
    background: transparent;
    cursor: pointer;
}
.note:hover .pin-btn { opacity: 0.55; }
.pin-btn:hover { opacity: 1 !important; background: rgba(0,0,0,0.08); }
.note.is-pinned .pin-btn { opacity: 1; color: var(--color-accent-hi); }
.note.is-pinned .pin-btn .msi { font-variation-settings: 'FILL' 1; }

.title-line {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-ink);
    margin: 0 28px 5px 0;
    letter-spacing: -0.005em;
    line-height: 1.3;
    word-break: break-word;
}
.summary-line {
    font-size: 13px;
    color: var(--color-muted);
    font-style: italic;
    border-left: 2px solid rgba(0,0,0,0.10);
    padding-left: 9px;
    margin-bottom: 8px;
    word-break: break-word;
}
.meta-line {
    display: flex;
    margin-top: 10px;
    color: var(--color-faint);
    font-size: 11.5px;
    font-weight: 500;
}
.empty-card {
    background: var(--color-card);
    border: 1px solid var(--color-line);
}

.fab {
    position: absolute;
    right: 28px;
    bottom: 28px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--color-accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--color-accent) 35%, transparent),
                0 2px 6px rgba(0,0,0,0.10);
    transition: background .15s, transform .15s, box-shadow .15s;
    z-index: 10;
}
.fab:hover {
    background: var(--color-accent-hi);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--color-accent) 45%, transparent),
                0 3px 8px rgba(0,0,0,0.12);
}
.fab:active { transform: translateY(0); }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
