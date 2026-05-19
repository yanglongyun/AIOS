<script setup>
import { computed } from 'vue';
import { relTime, snippet } from './utils.js';

const props = defineProps({
    items: { type: Array, default: () => [] },
    search: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    errMsg: { type: String, default: '' }
});

defineEmits(['new', 'open', 'pin', 'remove']);

const filtered = computed(() => {
    const q = props.search.trim().toLowerCase();
    if (!q) return props.items;
    return props.items.filter(
        (n) => (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q)
    );
});
const pinned = computed(() => filtered.value.filter((n) => n.pinned));
const others = computed(() => filtered.value.filter((n) => !n.pinned));
</script>

<template>
    <div class="mx-auto w-full max-w-[920px] px-6 pt-4 pb-15 max-md:px-3 max-md:pb-10">

        <div class="pt-1 pb-4">
            <button
                class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[22px] border border-line bg-white px-[18px] text-[14px] font-medium text-ink shadow-[var(--shadow-1)] transition-[background,box-shadow] hover:bg-[#fafbfc] hover:shadow-[var(--shadow-2)]"
                @click="$emit('new')">
                <span class="msi sm text-accent">edit</span>
                <span>新建笔记</span>
            </button>
        </div>

        <div v-if="errMsg" class="mb-3 rounded-lg bg-[#fce8e6] px-3.5 py-2.5 text-[13px] text-bad">
            {{ errMsg }}
        </div>

        <div v-if="loading && !items.length" class="px-5 py-20 text-center text-muted">加载中...</div>

        <div v-else-if="!filtered.length" class="px-5 py-20 text-center text-muted">
            <span class="msi mx-auto mb-3 block text-faint" style="font-size:42px">edit_note</span>
            <div class="text-[16px] font-medium text-ink">{{ search ? '没有匹配的笔记' : '还没有笔记' }}</div>
            <div v-if="!search" class="mt-1 text-[13px] text-faint">点上方「新笔记」开始</div>
        </div>

        <template v-else>
            <section v-if="pinned.length" class="mb-6">
                <div class="mx-1 mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">置顶</div>
                <ul class="m-0 list-none overflow-hidden rounded-xl border border-line bg-white p-0">
                    <li v-for="n in pinned" :key="`p-${n.id}`"
                        class="group flex cursor-pointer items-start gap-2 border-b border-line-soft px-[18px] py-3.5 transition-colors hover:bg-bg-hi last:border-b-0"
                        @click="$emit('open', n)">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5">
                                <span v-if="n.pinned" class="msi xxs flex-none text-accent">push_pin</span>
                                <h3 class="m-0 truncate text-[15px] font-semibold leading-[1.4] text-ink">{{ n.title || '未命名' }}</h3>
                            </div>
                            <p v-if="n.body"
                               class="line-clamp-2 m-0 mt-0.5 text-[13px] leading-[1.55] text-muted overflow-hidden">
                                {{ snippet(n.body) }}
                            </p>
                            <div class="mt-1.5 flex items-center gap-2.5 text-[11.5px] text-faint">
                                <span class="tabular-nums">{{ relTime(n.updated_at) }}</span>
                            </div>
                        </div>
                        <div class="flex flex-none gap-0 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100"
                             @click.stop>
                            <button class="row-act"
                                    :title="n.pinned ? '取消置顶' : '置顶'"
                                    @click="$emit('pin', n, $event)">
                                <span class="msi xs">push_pin</span>
                            </button>
                            <button class="row-act danger" title="删除" @click="$emit('remove', n, $event)">
                                <span class="msi xs">delete</span>
                            </button>
                        </div>
                    </li>
                </ul>
            </section>

            <section v-if="others.length">
                <div v-if="pinned.length" class="mx-1 mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">其它</div>
                <ul class="m-0 list-none overflow-hidden rounded-xl border border-line bg-white p-0">
                    <li v-for="n in others" :key="n.id"
                        class="group flex cursor-pointer items-start gap-2 border-b border-line-soft px-[18px] py-3.5 transition-colors hover:bg-bg-hi last:border-b-0"
                        @click="$emit('open', n)">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5">
                                <h3 class="m-0 truncate text-[15px] font-semibold leading-[1.4] text-ink">{{ n.title || '未命名' }}</h3>
                            </div>
                            <p v-if="n.body"
                               class="line-clamp-2 m-0 mt-0.5 text-[13px] leading-[1.55] text-muted overflow-hidden">
                                {{ snippet(n.body) }}
                            </p>
                            <div class="mt-1.5 flex items-center gap-2.5 text-[11.5px] text-faint">
                                <span class="tabular-nums">{{ relTime(n.updated_at) }}</span>
                            </div>
                        </div>
                        <div class="flex flex-none gap-0 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100"
                             @click.stop>
                            <button class="row-act" title="置顶" @click="$emit('pin', n, $event)">
                                <span class="msi xs">push_pin</span>
                            </button>
                            <button class="row-act danger" title="删除" @click="$emit('remove', n, $event)">
                                <span class="msi xs">delete</span>
                            </button>
                        </div>
                    </li>
                </ul>
            </section>
        </template>
    </div>
</template>

<style scoped>
.row-act {
    width: 30px; height: 30px;
    display: grid; place-items: center;
    border: 0;
    background: transparent;
    border-radius: 50%;
    color: var(--text-3);
    cursor: pointer;
    transition: background .12s, color .12s;
}
.row-act:hover { background: rgba(0, 0, 0, 0.06); color: var(--text); }
.row-act.danger:hover {
    background: color-mix(in srgb, var(--bad) 12%, transparent);
    color: var(--bad);
}
@media (max-width: 720px) {
    .row-act { width: 28px; height: 28px; }
}
</style>
