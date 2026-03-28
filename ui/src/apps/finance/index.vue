<template>
  <div class="passbook-bg flex h-full w-full items-center justify-center overflow-hidden px-5 py-8 font-['PingFang_SC','Microsoft_YaHei',sans-serif]">
    <div class="passbook-container flex h-full w-full max-h-[900px] max-w-[1400px] rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
      <div class="passbook-cover relative flex w-[25px] shrink-0 items-center justify-center rounded-l-xl">
        <div class="cover-stripe absolute bottom-0 left-[5px] top-0 w-[10px] opacity-80"></div>
      </div>

      <div class="passbook-pages relative flex flex-1 flex-col rounded-r-xl">
        <div class="spine-crease pointer-events-none absolute bottom-0 left-0 top-0 z-50 w-10"></div>

        <FinanceHeader
          :display-month="displayMonth"
          :is-current-month="isCurrentMonth"
          :total-income="totalIncome"
          :total-expense="totalExpense"
          :ending-balance="endingBalance"
          :fmt-amt="fmtAmt"
          @prev-month="prevMonth"
          @next-month="nextMonth"
        />

        <FinanceLedgerTable
          :rows="rows"
          :editing="editing"
          :form="form"
          :today-str="todayStr"
          :saving="saving"
          :fmt-date="fmtDate"
          :fmt-amt="fmtAmt"
          :start-edit="startEdit"
          :save-edit="saveEdit"
          :cancel-edit="cancelEdit"
          :remove="remove"
          :save="save"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { chatPanel } from '../../stores/chatPanel.ts';
import { LOCALE_FULL } from '../../locale.ts';
import FinanceHeader from './FinanceHeader.vue';
import FinanceLedgerTable from './FinanceLedgerTable.vue';

const API_BASE = '/aios/apps/finance';

const now = new Date();
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
const items = ref([]);
const totalIncome = ref(0);
const totalExpense = ref(0);
const saving = ref(false);

const form = reactive({
  newDate: '',
  newNote: '',
  newWithdraw: '',
  newDeposit: ''
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

const fetchData = async () => {
  try {
    const res = await fetch(`${API_BASE}/list?month=${month.value}`);
    const data = await res.json();
    items.value = data.items || [];
    totalIncome.value = Number(data.totalIncome || 0);
    totalExpense.value = Number(data.totalExpense || 0);
  } catch (e) {
    console.error(e);
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
  const withdraw = parseFloat(form.newWithdraw) || 0;
  const deposit = parseFloat(form.newDeposit) || 0;
  if (!withdraw && !deposit) return;
  if (saving.value) return;

  saving.value = true;
  try {
    const type = deposit > 0 ? 'income' : 'expense';
    const amount = deposit > 0 ? deposit : withdraw;
    const note = form.newNote.trim();
    const dateInput = form.newDate.trim() || todayStr.value;
    const dayPart = dateInput.includes('-') ? dateInput.split('-').pop() : dateInput;
    const fullDate = `${month.value}-${dayPart.padStart(2, '0')}T12:00:00`;

    await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount, note, date: fullDate })
    });

    form.newDate = '';
    form.newNote = '';
    form.newWithdraw = '';
    form.newDeposit = '';
    await fetchData();
  } catch (e) {
    console.error(e);
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
  try {
    await fetch(`${API_BASE}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    await fetchData();
  } catch (e) {
    console.error(e);
  }
};

const remove = async (id) => {
  try {
    await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await fetchData();
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchData();
  chatPanel.setContext({ scene: 'finance', label: '__T_APP_SIDEBAR_FINANCE__' });
  chatPanel.setQuickMessages(['__T_FINANCE_CHAT_QUICK_1__', '__T_FINANCE_CHAT_QUICK_2__', '__T_FINANCE_CHAT_QUICK_3__']);
});
onUnmounted(() => { chatPanel.clearContext(); chatPanel.setQuickMessages([]); });
</script>

<style scoped>
.passbook-bg {
  background-color: #1a1a1a;
  background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, transparent 1px, transparent 10px);
}

.passbook-cover {
  background: linear-gradient(135deg, #a41b1b, #7d1010);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.2'/%3E%3C/svg%3E");
  box-shadow: inset 4px 0 10px rgba(0,0,0,0.5), inset -2px 0 8px rgba(0,0,0,0.8);
}

.cover-stripe {
  background: linear-gradient(90deg, #111, #333, #111);
  box-shadow: inset 0 0 3px rgba(0,0,0,0.8);
}

.passbook-pages {
  background-color: #f0f4f8;
  background-image:
    repeating-linear-gradient(45deg, rgba(82,113,255,0.03) 0, rgba(82,113,255,0.03) 1px, transparent 1px, transparent 12px),
    repeating-linear-gradient(-45deg, rgba(82,113,255,0.03) 0, rgba(82,113,255,0.03) 1px, transparent 1px, transparent 12px);
  box-shadow: inset 15px 0 25px rgba(0,0,0,0.15);
}

.spine-crease {
  background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 40%, transparent 100%);
}

.dot-matrix {
  font-family: 'Courier New', Courier, monospace;
  color: #0b1c67;
  text-shadow: 0 0 1px rgba(11,28,103,0.4);
  letter-spacing: 0.5px;
}

@media (max-width: 640px) {
  .passbook-container { margin: 0 !important; border-radius: 0 !important; max-height: none !important; }
  .passbook-cover { width: 12px !important; border-radius: 0 !important; }
  .passbook-pages { border-radius: 0 !important; }
  .spine-crease { width: 20px !important; }
}
</style>
