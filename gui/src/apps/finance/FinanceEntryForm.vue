<script setup>
defineProps({
    form:     { type: Object,  required: true },
    todayStr: { type: String,  required: true },
    saving:   { type: Boolean, default: false }
});

defineEmits(['save']);
</script>

<template>
    <section class="mb-4 rounded-2xl bg-card px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] max-md:px-3">
        <div class="mb-2 flex items-center gap-2">
            <span class="msi" style="font-size:18px;color:var(--color-accent)">add_circle</span>
            <span class="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted">__T_FINANCE_NEW_RECORD__</span>

            <!-- Type tabs -->
            <div class="ml-auto inline-flex items-center rounded-full bg-bg-hi p-0.5 text-[12px] font-semibold">
                <button class="type-tab cursor-pointer rounded-full border-0 px-3 py-1 transition-all"
                    :class="form.newType === 'expense' ? 'is-active text-bad' : 'bg-transparent text-muted hover:text-ink'"
                    @click="form.newType = 'expense'">
                    __T_FINANCE_EXPENSE__
                </button>
                <button class="type-tab cursor-pointer rounded-full border-0 px-3 py-1 transition-all"
                    :class="form.newType === 'income' ? 'is-active text-blue-fg' : 'bg-transparent text-muted hover:text-ink'"
                    @click="form.newType = 'income'">
                    __T_FINANCE_INCOME__
                </button>
            </div>
        </div>
        <div class="grid grid-cols-[110px_minmax(160px,1fr)_140px_auto] gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <label class="block">
                <span class="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">__T_FINANCE_DATE__</span>
                <input v-model="form.newDate" type="text"
                    class="entry-input h-9 w-full rounded-xl border-0 bg-bg-hi px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-accent/40"
                    :placeholder="todayStr" />
            </label>
            <label class="block">
                <span class="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">__T_FINANCE_NOTE__</span>
                <input v-model="form.newNote" type="text"
                    class="entry-input h-9 w-full rounded-xl border-0 bg-bg-hi px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-accent/40"
                    placeholder="__T_FINANCE_NOTE_PLACEHOLDER__"
                    @keyup.enter="$emit('save')" />
            </label>
            <label class="block">
                <span class="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">__T_FINANCE_AMOUNT__</span>
                <input v-model="form.newAmount" type="text"
                    class="entry-input h-9 w-full rounded-xl border-0 bg-bg-hi px-3 text-right font-mono text-[13px] outline-none focus:ring-2 focus:ring-accent/40"
                    :class="form.newType === 'income' ? 'text-blue-fg' : 'text-bad'"
                    placeholder="0.00"
                    @keyup.enter="$emit('save')" />
            </label>
            <button class="save-btn mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 px-4 text-[12.5px] font-semibold text-white transition-shadow disabled:cursor-default disabled:opacity-45 max-lg:mt-0 max-lg:self-end"
                :disabled="saving || !form.newAmount"
                @click="$emit('save')">
                <span class="msi" style="font-size:16px">check</span>
                <span>{{ saving ? '__T_FINANCE_SAVING__' : '__T_COMMON_SAVE__' }}</span>
            </button>
        </div>
    </section>
</template>

<style scoped>
.entry-input::placeholder { color: var(--color-faint); }

.type-tab.is-active {
    background: var(--color-card);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.save-btn {
    background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hi) 100%);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}
.save-btn:hover:not(:disabled) {
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}
</style>
