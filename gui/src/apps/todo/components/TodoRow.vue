<script setup>
const props = defineProps({
    t:        { type: Object,  required: true },
    live:     { type: String,  default: '' },
    meta:     { type: Object,  default: null },
    toneText: { type: Object,  required: true },
    toneBg:   { type: Object,  required: true },
    isActive: { type: Boolean, default: false },
});
const emit = defineEmits(['open', 'toggleDone', 'run', 'stop', 'togglePinned', 'remove']);
</script>

<template>
    <li class="group relative flex items-center gap-3 rounded-[14px] px-3.5 py-3 cursor-pointer transition-colors hover:bg-bg-hi max-md:gap-2.5 max-md:px-3 max-md:py-2.5"
        :class="{
            'bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]': t.pinned && !isActive,
            'shadow-[inset_3px_0_0_0_var(--color-accent)]': isActive,
        }"
        @click="emit('open', t)">

        <!-- Checkbox -->
        <button class="grid h-[22px] w-[22px] flex-none cursor-pointer place-items-center rounded-full border-[1.5px] border-line-hi bg-transparent transition-colors hover:border-accent"
            :class="{ '!border-accent !bg-accent': t.done }"
            @click.stop="emit('toggleDone', t)">
            <span v-if="t.done" class="msi text-bg" style="font-size:14px">check</span>
        </button>

        <!-- Title + status -->
        <div class="min-w-0 flex-1">
            <div class="break-words text-[14.5px] text-ink"
                 :class="{ 'text-faint line-through': t.done }">{{ t.title }}</div>
            <div v-if="meta" class="mt-0.5 inline-flex items-center gap-1.5 text-[12px]"
                :class="toneText[meta.tone]">
                <span v-if="meta.dot" class="h-1.5 w-1.5 rounded-full animate-status-pulse"
                    :class="toneBg[meta.tone]"></span>
                <span v-else class="msi" style="font-size:13px">{{ meta.icon }}</span>
                {{ meta.labelKey }}
            </div>
        </div>

        <!-- Actions: only Run/Stop is visible always; pin/remove appear on hover -->
        <div class="flex flex-none items-center gap-1">
            <button v-if="isActive"
                class="row-chip is-stop" @click.stop="emit('stop', t)">
                <span class="msi" style="font-size:15px">stop_circle</span>
                __T_TODO_ACTION_STOP__
            </button>
            <button v-else-if="!t.done"
                class="row-chip is-primary" @click.stop="emit('run', t)">
                <span class="msi" style="font-size:15px">auto_awesome</span>
                {{ t.taskId ? '__T_TODO_ACTION_RUN_AGAIN__' : '__T_TODO_ACTION_RUN__' }}
            </button>

            <button class="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-accent opacity-0 group-hover:opacity-100 max-md:opacity-100"
                :class="{ '!opacity-100 !text-accent': t.pinned }"
                @click.stop="emit('togglePinned', t)"
                :title="t.pinned ? '__T_TODO_ACTION_UNPIN__' : '__T_TODO_ACTION_PIN__'">
                <span class="msi" :class="{ filled: t.pinned }" style="font-size:15px">push_pin</span>
            </button>
            <button class="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-bad opacity-0 group-hover:opacity-100 max-md:opacity-100"
                @click.stop="emit('remove', t)" :title="'__T_TODO_ACTION_REMOVE__'">
                <span class="msi" style="font-size:15px">close</span>
            </button>
        </div>
    </li>
</template>

<style scoped>
.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

.row-chip {
    display: inline-flex; align-items: center; gap: 5px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background .12s, color .12s, border-color .12s;
    white-space: nowrap;
}
.row-chip:hover:not(:disabled) { background: var(--color-bg-hi); color: var(--color-ink); border-color: var(--color-line-hi); }
.row-chip.is-primary {
    background: var(--color-blue-bg);
    color: var(--color-blue-fg);
    border-color: transparent;
}
.row-chip.is-primary:hover { background: var(--color-blue-soft); }
.row-chip.is-stop {
    color: var(--color-bad);
    border-color: color-mix(in srgb, var(--color-bad) 45%, transparent);
}
.row-chip.is-stop:hover { background: color-mix(in srgb, var(--color-bad) 12%, transparent); border-color: var(--color-bad); }
</style>
