<script setup>
import { computed, ref } from 'vue';
import { fmtClock, fmtRelDay, previewLine, todayStr } from './utils.js';

const props = defineProps({
    reports: { type: Array, default: () => [] },
    now: { type: Date, required: true }
});

defineEmits(['clear', 'refresh']);

const opened = ref(new Set());
const isOpen = (id) => opened.value.has(id);
const toggleOpen = (id) => {
    const next = new Set(opened.value);
    next.has(id) ? next.delete(id) : next.add(id);
    opened.value = next;
};

const todaysCount = computed(() => {
    const t = todayStr(props.now);
    return props.reports.filter((r) => (r.created_at || '').slice(0, 10) === t).length;
});
</script>

<template>
    <section class="mx-auto max-w-[880px]">
        <header class="flex items-center justify-between px-2 pb-3">
            <div class="flex flex-wrap items-baseline gap-2.5">
                <h2 class="m-0 text-[16px] font-medium tracking-[-0.005em] text-ink">早报历史</h2>
                <span class="font-mono text-[12.5px] text-faint">{{ reports.length }} 份</span>
                <span v-if="todaysCount" class="rounded-full bg-blue-soft px-2.5 py-0.5 text-[11.5px] font-medium text-blue-fg">
                    含 {{ todaysCount }} 份今日
                </span>
            </div>
            <div class="flex gap-0.5">
                <button v-if="reports.length" class="icon-btn" title="清空" @click="$emit('clear')">
                    <span class="msi sm">delete_sweep</span>
                </button>
                <button class="icon-btn" title="刷新" @click="$emit('refresh')">
                    <span class="msi sm">refresh</span>
                </button>
            </div>
        </header>

        <div v-if="!reports.length"
             class="rounded-2xl border border-dashed border-line bg-bg px-4 py-10 text-center text-muted">
            <span class="msi" style="font-size:44px; opacity:.25">drafts</span>
            <p class="mt-3 text-[13.5px]">
                还没有任何早报。到点会自动生成,也可以点 <span class="msi xxs">send</span> 立即派送一份。
            </p>
        </div>

        <div v-else class="flex flex-col gap-2">
            <article v-for="r in reports" :key="r.id"
                     class="overflow-hidden rounded-xl border bg-bg transition-[border-color,box-shadow]"
                     :class="[
                         !r.ok ? 'border-[rgba(217,48,37,0.25)] bg-[#fef7f6]' : 'border-line-soft hover:border-line',
                         isOpen(r.id) && '!border-accent shadow-[var(--shadow-1)]'
                     ]">
                <button
                    class="flex w-full cursor-pointer items-start gap-3.5 border-0 bg-transparent px-4 py-3.5 text-left transition-colors hover:bg-bg-hi"
                    @click="toggleOpen(r.id)">
                    <span class="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full"
                          :class="r.ok ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fce8e6] text-bad'">
                        <span class="msi xxs">{{ r.ok ? 'mark_email_read' : 'error' }}</span>
                    </span>
                    <div class="flex min-w-0 flex-1 flex-col gap-1">
                        <div class="flex flex-wrap items-baseline gap-2.5">
                            <span class="text-[13.5px] font-medium text-ink">{{ fmtRelDay(r.created_at) }}</span>
                            <span class="font-mono text-[12px] text-faint">{{ fmtClock(r.created_at) }}</span>
                            <span v-if="!r.ok" class="rounded-full bg-[#fce8e6] px-2 py-px text-[10.5px] font-medium text-bad">
                                失败
                            </span>
                        </div>
                        <div v-if="r.ok"
                             class="line-clamp-2 text-[13px] leading-[1.5] text-muted overflow-hidden">
                            {{ previewLine(r.summary) }}
                        </div>
                        <div v-else
                             class="line-clamp-2 text-[13px] leading-[1.5] text-bad overflow-hidden">
                            ⚠ {{ (r.error || '未知错误').slice(0, 80) }}
                        </div>
                    </div>
                    <span class="msi mt-0.5 flex-none text-[22px] text-faint transition-transform"
                          :class="{ 'rotate-180 !text-accent': isOpen(r.id) }">expand_more</span>
                </button>

                <transition name="reveal">
                    <div v-if="isOpen(r.id)"
                         class="border-t border-dashed border-line-soft px-[60px] py-3.5 pb-[18px] max-md:pl-[18px]">
                        <pre v-if="r.ok"
                             class="m-0 whitespace-pre-wrap break-words text-[14px] leading-[1.75] text-ink"
                             style="font-family: 'Google Sans', 'Roboto', sans-serif">{{ r.summary }}</pre>
                        <p v-else class="m-0 text-[13px] leading-[1.55] text-bad">⚠ {{ r.error || '未知错误' }}</p>
                    </div>
                </transition>
            </article>
        </div>
    </section>
</template>

<style scoped>
.reveal-enter-active, .reveal-leave-active {
    transition: max-height .25s ease, opacity .2s;
    overflow: hidden;
}
.reveal-enter-from, .reveal-leave-to { max-height: 0; opacity: 0; }
.reveal-enter-to, .reveal-leave-from { max-height: 1200px; opacity: 1; }
</style>
