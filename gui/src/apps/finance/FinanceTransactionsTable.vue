<script setup>
defineProps({
    rows:          { type: Array,   required: true },
    editing:       { type: Object,  required: true },
    loading:       { type: Boolean, default: false },
    fmtDate:       { type: Function, required: true },
    fmtAmt:        { type: Function, required: true },
    startEdit:     { type: Function, required: true },
    saveEdit:      { type: Function, required: true },
    cancelEdit:    { type: Function, required: true },
    remove:        { type: Function, required: true }
});

const noteText = (row) => row.note
    || (row.type === 'income' ? '__T_FINANCE_DEPOSIT__' : '__T_FINANCE_EXPENSE__');

const amountText = (row) => `${row.type === 'income' ? '+' : '-'}¥${row.amount}`;
</script>

<template>
    <!-- Transactions list -->
    <section>
        <div class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">__T_FINANCE_SECTION_TRANSACTIONS__</div>

        <div v-if="loading && !rows.length" class="rounded-2xl bg-card py-16 text-center text-muted shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <span class="msi block text-faint" style="font-size:30px">hourglass_empty</span>
            <div class="mt-2 text-[13px]">__T_COMMON_LOADING__</div>
        </div>

        <div v-else-if="!rows.length" class="rounded-2xl bg-card py-16 text-center text-muted shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <span class="msi block text-faint" style="font-size:32px">savings</span>
            <div class="mt-2 text-[13px]">__T_FINANCE_EMPTY__</div>
        </div>

        <div v-else class="overflow-hidden rounded-2xl bg-card p-2 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
            <div v-for="row in rows" :key="row.id"
                class="tx-row group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-bg-hi max-md:px-2.5">
                <div class="grid h-10 w-10 flex-none place-items-center rounded-xl text-[18px]"
                    :style="{ background: row.type === 'income' ? '#d1fae5' : '#ecfdf5' }">
                    {{ row.category.icon }}
                </div>

                <div class="min-w-0 flex-1">
                    <input v-if="editing.active && editing.id === row.id && editing.field === 'note'"
                        v-model="editing.value"
                        class="block w-full rounded-md border-0 bg-bg-hi px-2 py-1 text-[14px] text-ink outline-none focus:ring-2 focus:ring-accent/40"
                        autofocus
                        @blur="saveEdit"
                        @keyup.enter="saveEdit"
                        @keyup.escape="cancelEdit" />
                    <button v-else
                        class="block w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-[14px] font-semibold text-ink"
                        @click="startEdit(row, 'note')">
                        {{ noteText(row) }}
                    </button>

                    <div class="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted">
                        <input v-if="editing.active && editing.id === row.id && editing.field === 'date'"
                            v-model="editing.value"
                            class="h-6 w-20 rounded-md border-0 bg-bg-hi px-2 font-mono text-[11.5px] text-ink outline-none focus:ring-2 focus:ring-accent/40"
                            autofocus
                            @blur="saveEdit"
                            @keyup.enter="saveEdit"
                            @keyup.escape="cancelEdit" />
                        <button v-else
                            class="cursor-pointer border-0 bg-transparent p-0 font-mono text-muted"
                            @click="startEdit(row, 'date')">
                            {{ fmtDate(row.date) }}
                        </button>
                        <span class="text-faint">·</span>
                        <span>{{ row.category.labelKey }}</span>
                    </div>
                </div>

                <div class="flex flex-none items-center gap-1">
                    <input v-if="editing.active && editing.id === row.id && editing.field === 'amount'"
                        v-model="editing.value"
                        class="h-9 w-24 rounded-md border-0 bg-bg-hi px-2 text-right font-mono text-[14px] outline-none focus:ring-2 focus:ring-accent/40"
                        :class="row.type === 'income' ? 'text-blue-fg' : 'text-bad'"
                        autofocus
                        @blur="saveEdit"
                        @keyup.enter="saveEdit"
                        @keyup.escape="cancelEdit" />
                    <button v-else
                        class="cursor-pointer border-0 bg-transparent p-0 font-mono text-[15px] font-bold"
                        :class="row.type === 'income' ? 'text-blue-fg' : 'text-bad'"
                        @click="startEdit(row, 'amount')">
                        {{ row.type === 'income' ? '+' : '-' }}¥{{ fmtAmt(row.amount) }}
                    </button>
                    <button class="grid h-7 w-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint opacity-0 transition-all hover:bg-bg-hi hover:!text-bad group-hover:opacity-100 max-md:opacity-100"
                        :title="'__T_COMMON_DELETE__'"
                        @click="remove(row.id)">
                        <span class="msi" style="font-size:15px">delete_outline</span>
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
