<script setup>
import AppLauncher from '@/components/AppLauncher.vue';
import { computed, onMounted, reactive, ref, watchEffect } from 'vue';
import { LOCALE_FULL } from '../../system/locale.js';
import { useQuickChatStore } from '@/stores/quickChat';
import { categorize, CATEGORY_COLOR } from './categories.js';

const qc = useQuickChatStore();
import FinanceEntryForm from './FinanceEntryForm.vue';
import FinanceSummaryBar from './FinanceSummaryBar.vue';
import FinanceTransactionsTable from './FinanceTransactionsTable.vue';

const API_BASE = '/apps/finance';

const now = new Date();
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
const items = ref([]);
const totalIncome = ref(0);
const totalExpense = ref(0);
const loading = ref(false);
const saving = ref(false);
const error = ref('');

const form = reactive({
    newType: 'expense',
    newDate: '',
    newNote: '',
    newAmount: ''
});

const editing = reactive({
    active: false,
    id: null,
    field: '',
    value: '',
    original: ''
});

const displayMonth = computed(() => month.value.replace('-', ' / '));
const isCurrentMonth = computed(() => {
    const d = new Date();
    return month.value === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});
const todayStr = computed(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});
const rows = computed(() => items.value);
const endingBalance = computed(() => totalIncome.value - totalExpense.value);

const fmtAmt = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString(LOCALE_FULL, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Aggregate expense rows by inferred category for the donut + breakdown bars.
const categoryStats = computed(() => {
    const buckets = new Map();
    for (const r of items.value) {
        if (r.type !== 'expense') continue;
        const cat = categorize(r.note, r.type);
        const cur = buckets.get(cat.key) || { ...cat, total: 0, count: 0 };
        cur.total += Number(r.amount) || 0;
        cur.count += 1;
        buckets.set(cat.key, cur);
    }
    const list = [...buckets.values()].sort((a, b) => b.total - a.total);
    const total = list.reduce((s, c) => s + c.total, 0);
    return list.map((c) => ({
        ...c,
        pct: total > 0 ? c.total / total : 0,
        color: CATEGORY_COLOR[c.key] || '#10b981',
    }));
});

const enrichedRows = computed(() =>
    items.value
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((r) => {
            const cat = categorize(r.note, r.type);
            return { ...r, category: cat, color: CATEGORY_COLOR[cat.key] || '#10b981' };
        })
);

const fetchData = async () => {
    loading.value = true;
    error.value = '';
    try {
        const res = await fetch(`${API_BASE}/list?month=${month.value}`);
        const data = await res.json();
        if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);
        items.value = data.items || [];
        totalIncome.value = Number(data.totalIncome || 0);
        totalExpense.value = Number(data.totalExpense || 0);
    } catch (e) {
        error.value = e.message || '__T_FINANCE_LOAD_FAILED__';
    } finally {
        loading.value = false;
    }
};

const prevMonth = () => {
    const [y, m] = month.value.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    month.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    fetchData();
};

const nextMonth = () => {
    if (isCurrentMonth.value) return;
    const [y, m] = month.value.split('-').map(Number);
    const d = new Date(y, m, 1);
    month.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    fetchData();
};

const save = async () => {
    const amount = parseFloat(form.newAmount) || 0;
    if (!amount || amount <= 0) return;
    if (saving.value) return;

    saving.value = true;
    error.value = '';
    try {
        const type = form.newType;
        const note = form.newNote.trim();
        const dateInput = form.newDate.trim() || todayStr.value;
        const dayPart = dateInput.includes('-') ? dateInput.split('-').pop() : dateInput;
        const fullDate = `${month.value}-${dayPart.padStart(2, '0')}T12:00:00`;

        const res = await fetch(`${API_BASE}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, amount, note, date: fullDate })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || '__T_FINANCE_CREATE_FAILED__');

        form.newDate = '';
        form.newNote = '';
        form.newAmount = '';
        await fetchData();
    } catch (e) {
        error.value = e.message || '__T_FINANCE_CREATE_FAILED__';
    } finally {
        saving.value = false;
    }
};

const startEdit = (row, field) => {
    let value;
    if (field === 'date') value = fmtDate(row.date);
    else if (field === 'amount') value = String(row.amount);
    else value = row.note || '';

    editing.active = true;
    editing.id = row.id;
    editing.field = field;
    editing.value = value;
    editing.original = value;
};

const cancelEdit = () => {
    editing.active = false;
    editing.id = null;
    editing.field = '';
    editing.value = '';
    editing.original = '';
};

const saveEdit = async () => {
    if (!editing.active) return;
    if (editing.value === editing.original) {
        cancelEdit();
        return;
    }

    const body = { id: editing.id };
    if (editing.field === 'date') {
        const dayPart = editing.value.includes('-') ? editing.value.split('-').pop() : editing.value;
        body.date = `${month.value}-${dayPart.padStart(2, '0')}T12:00:00`;
    } else if (editing.field === 'amount') {
        const amt = parseFloat(editing.value);
        if (!amt || amt <= 0) {
            cancelEdit();
            return;
        }
        body.amount = amt;
    } else {
        body.note = editing.value;
    }

    cancelEdit();
    error.value = '';
    try {
        const res = await fetch(`${API_BASE}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || '__T_FINANCE_UPDATE_FAILED__');
        await fetchData();
    } catch (e) {
        error.value = e.message || '__T_FINANCE_UPDATE_FAILED__';
    }
};

const remove = async (id) => {
    error.value = '';
    try {
        const res = await fetch(`${API_BASE}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || '__T_FINANCE_DELETE_FAILED__');
        await fetchData();
    } catch (e) {
        error.value = e.message || '__T_FINANCE_DELETE_FAILED__';
    }
};

onMounted(fetchData);

watchEffect(() => {
    const lines = [
        '__T_QC_FIELD_MONTH__'.replace('{value}', displayMonth.value),
        '__T_QC_FIELD_INCOME__'.replace('{value}', fmtAmt(totalIncome.value)),
        '__T_QC_FIELD_EXPENSE__'.replace('{value}', fmtAmt(totalExpense.value)),
        '__T_QC_FIELD_BALANCE__'.replace('{value}', fmtAmt(endingBalance.value)),
        '__T_QC_FIELD_ENTRIES__'.replace('{count}', items.value.length),
    ];
    qc.setContext({
        scope: `finance:${month.value}`,
        label: '__T_QC_LABEL_FINANCE__'.replace('{month}', displayMonth.value),
        snapshot: lines.join('\n'),
    });
});
</script>

<template>
    <div class="finance-shell flex h-full flex-col">
        <header class="mx-auto flex w-full max-w-[860px] flex-none items-center gap-3 px-6 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <h1 class="m-0 text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink max-md:text-[20px]">__T_FINANCE_TITLE__</h1>

            <!-- Month nav (pill) -->
            <div class="ml-auto flex items-center gap-2">
                <div class="inline-flex items-center rounded-full bg-card p-1 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                    <button class="grid h-7 w-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                        @click="prevMonth">
                        <span class="msi" style="font-size:16px">chevron_left</span>
                    </button>
                    <span class="px-3 font-mono text-[13px] font-semibold text-ink">{{ displayMonth }}</span>
                    <button class="grid h-7 w-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink disabled:cursor-default disabled:opacity-35"
                        :disabled="isCurrentMonth"
                        @click="nextMonth">
                        <span class="msi" style="font-size:16px">chevron_right</span>
                    </button>
                </div>
                <AppLauncher />
            </div>
        </header>

        <div class="mx-auto w-full max-w-[860px] min-h-0 flex-1 overflow-auto px-6 pb-10 max-md:px-3">
            <FinanceSummaryBar
                :total-income="totalIncome"
                :total-expense="totalExpense"
                :ending-balance="endingBalance"
                :fmt-amt="fmtAmt" />

            <FinanceEntryForm
                :form="form"
                :today-str="todayStr"
                :saving="saving"
                @save="save" />

            <div v-if="error" class="mb-3 rounded-xl px-3.5 py-2 text-[13px] text-bad"
                style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                {{ error }}
            </div>

            <FinanceTransactionsTable
                :rows="enrichedRows"
                :editing="editing"
                :loading="loading"
                :fmt-date="fmtDate"
                :fmt-amt="fmtAmt"
                :start-edit="startEdit"
                :save-edit="saveEdit"
                :cancel-edit="cancelEdit"
                :remove="remove" />
        </div>
    </div>
</template>

<style scoped>
/* Mint trust palette — overrides system tokens locally so children get the
   garden-y feel. Other apps unaffected. */
.finance-shell {
    --color-bg:        #f0fdf4;
    --color-bg-elev:   #ffffff;
    --color-bg-hi:     #ecfdf5;
    --color-line:      #e5e7eb;
    --color-line-hi:   #d1d5db;
    --color-ink:       #064e3b;
    --color-muted:     #047857;
    --color-faint:     #6b7280;
    --color-accent:    #10b981;
    --color-accent-hi: #059669;
    --color-good:      #047857;
    --color-bad:       #dc2626;
    --color-card:      #ffffff;
    --color-card-hi:   #f0fdf4;
    --color-card-sub:  #ecfdf5;
    --color-blue-bg:   #d1fae5;
    --color-blue-soft: #a7f3d0;
    --color-blue-fg:   #047857;
    color: var(--color-ink);

    background:
        radial-gradient(circle at 0% 0%, #d1fae5 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, #fef3c7 0%, transparent 55%),
        var(--color-bg);
}
</style>
