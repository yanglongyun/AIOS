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
    <li class="todo-row group relative flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors max-md:gap-2.5 max-md:px-3 max-md:py-3"
        :class="{
            'is-pinned': t.pinned && !isActive,
            'is-active': isActive,
        }"
        @click="emit('open', t)">

        <!-- Checkbox: 圆环，hover 圆环加深，done 实心带勾 -->
        <button class="todo-ck grid h-[24px] w-[24px] flex-none cursor-pointer place-items-center rounded-full"
            :class="{ 'is-running': isActive && !t.done, 'is-done': t.done }"
            @click.stop="emit('toggleDone', t)">
            <span v-if="t.done" class="msi text-bg" style="font-size:15px">check</span>
        </button>

        <!-- Title + status -->
        <div class="min-w-0 flex-1">
            <div class="break-words text-[14.5px] font-medium text-ink"
                 :class="{ 'text-muted line-through font-normal': t.done }">{{ t.title }}</div>
            <div v-if="meta && !t.done" class="status-pill mt-1.5 inline-flex items-center gap-1.5"
                :class="['tone-' + meta.tone]">
                <span v-if="meta.dot" class="h-1.5 w-1.5 rounded-full animate-status-pulse"
                    :class="toneBg[meta.tone]"></span>
                <span v-else class="msi" style="font-size:12px">{{ meta.icon }}</span>
                {{ meta.labelKey }}
            </div>
        </div>

        <!-- Actions: pin always visible (filled if pinned), star-style; run/stop primary; remove on hover -->
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

            <button class="row-icon-btn"
                :class="{ 'is-on': t.pinned }"
                @click.stop="emit('togglePinned', t)"
                :title="t.pinned ? '__T_TODO_ACTION_UNPIN__' : '__T_TODO_ACTION_PIN__'">
                <span class="msi" :class="{ filled: t.pinned }" style="font-size:16px">{{ t.pinned ? 'star' : 'star_outline' }}</span>
            </button>
            <button class="row-icon-btn hover-bad"
                @click.stop="emit('remove', t)" :title="'__T_TODO_ACTION_REMOVE__'">
                <span class="msi" style="font-size:15px">close</span>
            </button>
        </div>
    </li>
</template>

<style scoped>
.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

.todo-row + .todo-row { border-top: 1px solid var(--color-line); }
.todo-row:hover { background: color-mix(in srgb, var(--color-bg) 60%, var(--color-card)); }
.todo-row.is-pinned { background: color-mix(in srgb, #fef3c7 50%, transparent); }
.todo-row.is-pinned:hover { background: color-mix(in srgb, #fde68a 45%, transparent); }
.todo-row.is-active { box-shadow: inset 3px 0 0 0 var(--color-accent); background: color-mix(in srgb, var(--color-blue-bg) 35%, transparent); }
.todo-row.is-active:hover { background: color-mix(in srgb, var(--color-blue-bg) 55%, transparent); }

/* 状态药丸：彩色 bg-tinted 小胶囊 —— Things 风的关键视觉 */
.status-pill {
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
}
.status-pill.tone-accent { background: var(--color-blue-bg); color: var(--color-blue-fg); }
.status-pill.tone-good   { background: color-mix(in srgb, var(--color-good) 14%, transparent); color: var(--color-good); }
.status-pill.tone-bad    { background: color-mix(in srgb, var(--color-bad) 12%, transparent); color: var(--color-bad); }
.status-pill.tone-muted  { background: var(--color-bg-hi); color: var(--color-muted); }

/* Checkbox */
.todo-ck {
    border: 1.5px solid var(--color-line-hi);
    background: var(--color-bg-elev);
    transition: all .14s;
}
.todo-row:hover .todo-ck { border-color: var(--color-muted); }
.todo-ck.is-running {
    border-color: var(--color-accent);
    position: relative;
}
.todo-ck.is-running::after {
    content: '';
    position: absolute; inset: 3px;
    border: 1.5px solid var(--color-accent);
    border-top-color: transparent;
    border-radius: 50%;
    animation: ck-spin 1s linear infinite;
}
@keyframes ck-spin { to { transform: rotate(360deg); } }
.todo-ck.is-done {
    background: var(--color-accent);
    border-color: var(--color-accent);
}

/* Action chips */
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
    border-color: color-mix(in srgb, var(--color-bad) 40%, transparent);
}
.row-chip.is-stop:hover { background: color-mix(in srgb, var(--color-bad) 12%, transparent); border-color: var(--color-bad); }

/* Round icon buttons (pin star + close) */
.row-icon-btn {
    display: grid; place-items: center;
    height: 30px; width: 30px;
    border: 0; border-radius: 999px;
    background: transparent;
    color: var(--color-faint);
    cursor: pointer;
    opacity: 0;
    transition: opacity .12s, color .12s, background .12s;
}
.todo-row:hover .row-icon-btn { opacity: 1; }
.row-icon-btn:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.row-icon-btn.hover-bad:hover { color: var(--color-bad); }
.row-icon-btn.is-on { opacity: 1; color: #d4a72c; }
.row-icon-btn.is-on:hover { color: #b8780a; background: color-mix(in srgb, #d4a72c 14%, transparent); }
@media (max-width: 768px) {
    .row-icon-btn { opacity: 1; }
}
</style>
