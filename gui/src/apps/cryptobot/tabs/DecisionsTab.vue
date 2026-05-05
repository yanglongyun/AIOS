<script setup>
import { ChevronDown, ChevronRight, History } from 'lucide-vue-next';
import { fmtTime } from '../formatters';

defineProps({
    decisions: { type: Array, default: () => [] },
    hasMore: { type: Boolean, default: false },
});

defineEmits(['more', 'select']);
</script>

<template>
    <section>
        <div v-if="!decisions.length" class="flex flex-col items-center gap-2 rounded-2xl border border-line bg-bg-elev py-10 text-muted">
            <History :size="32" :stroke-width="1.6" class="text-faint" />
            <div class="text-[13px]">__T_CRYPTOBOT_LOGS_EMPTY__</div>
        </div>
        <ul v-else class="m-0 flex list-none flex-col gap-1 p-0">
            <li v-for="d in decisions" :key="d.id">
                <button class="flex w-full cursor-pointer items-start gap-3.5 rounded-xl border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-bg-hi"
                    @click="$emit('select', d)">
                    <span class="mt-[7px] h-2 w-2 flex-none rounded-full" :class="d.ok ? 'bg-good' : 'bg-bad'"></span>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-baseline gap-2.5">
                            <span class="line-clamp-1 flex-1 text-[13.5px] text-ink">{{ d.summary || '__T_CRYPTOBOT_EMPTY_SUMMARY__' }}</span>
                            <span class="flex-none text-[11.5px] text-faint">{{ fmtTime(d.created_at) }}</span>
                        </div>
                        <div class="mt-1 flex items-center gap-2 text-[11px] text-muted">
                            <span class="rounded-md border border-line bg-bg-elev px-1.5 py-px text-faint">#{{ d.id }}</span>
                            <span>__T_CRYPTOBOT_TASK__ {{ d.task_id || '—' }}</span>
                        </div>
                    </div>
                    <ChevronRight :size="16" :stroke-width="1.8" class="mt-[3px] flex-none text-faint" />
                </button>
            </li>
        </ul>
        <button v-if="hasMore"
            class="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl border-0 bg-bg-hi px-3 py-2 text-[12.5px] font-medium text-muted transition-colors hover:bg-line-hi hover:text-ink"
            @click="$emit('more')">
            <ChevronDown :size="14" :stroke-width="1.8" />
            <span>__T_CRYPTOBOT_LOAD_MORE__</span>
        </button>
    </section>
</template>
