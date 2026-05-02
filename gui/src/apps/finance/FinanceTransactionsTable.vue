<script setup>
import { computed } from 'vue';

const props = defineProps({
  rows: { type: Array, required: true },
  editing: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  fmtDate: { type: Function, required: true },
  fmtAmt: { type: Function, required: true },
  startEdit: { type: Function, required: true },
  saveEdit: { type: Function, required: true },
  cancelEdit: { type: Function, required: true },
  remove: { type: Function, required: true }
});

const groups = computed(() => {
  const byDate = new Map();
  for (const row of props.rows) {
    const key = props.fmtDate(row.date) || '--';
    if (!byDate.has(key)) byDate.set(key, { key, rows: [], income: 0, expense: 0 });
    const group = byDate.get(key);
    group.rows.push(row);
    if (row.type === 'income') group.income += Number(row.amount || 0);
    else group.expense += Number(row.amount || 0);
  }
  return [...byDate.values()];
});

const noteText = (row) => {
  return row.note || (row.type === 'income' ? '__T_FINANCE_DEPOSIT__' : '__T_FINANCE_EXPENSE__');
};

const amountText = (row) => {
  return `${row.type === 'income' ? '+' : '-'}${props.fmtAmt(row.amount)}`;
};
</script>

<template>
  <section class="finance-ledger">
    <div class="finance-ledger-head flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <h2 class="m-0 text-[15px] font-semibold text-ink">__T_FINANCE_LEDGER__</h2>
        <div class="mt-0.5 text-[11.5px] text-faint">__T_FINANCE_EDIT_HINT__</div>
      </div>
      <span class="text-[12px] text-faint">{{ rows.length }} __T_FINANCE_RECORD_UNIT__</span>
    </div>

    <div v-if="loading && !rows.length" class="flex flex-col items-center gap-2 py-16 text-muted">
      <span class="msi" style="font-size:30px;color:var(--color-faint)">hourglass_empty</span>
      <div class="text-[14px]">__T_COMMON_LOADING__</div>
    </div>

    <div v-else-if="!rows.length" class="flex flex-col items-center gap-2 py-16 text-muted">
      <span class="msi" style="font-size:32px;color:var(--color-faint)">receipt_long</span>
      <div class="text-[13px]">__T_FINANCE_EMPTY__</div>
    </div>

    <div v-else class="finance-ledger-body">
      <section v-for="group in groups" :key="group.key" class="finance-day">
        <div class="finance-day-head flex items-center justify-between gap-3 px-4 py-2.5">
          <div class="font-mono text-[12px] font-semibold text-muted">{{ group.key }}</div>
          <div class="flex min-w-0 items-center gap-3 text-[11px] text-faint">
            <span v-if="group.expense" class="font-mono text-bad">-{{ fmtAmt(group.expense) }}</span>
            <span v-if="group.income" class="font-mono text-good">+{{ fmtAmt(group.income) }}</span>
          </div>
        </div>

        <div class="divide-y divide-line/50">
          <article
            v-for="row in group.rows"
            :key="row.id"
            class="finance-row group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors max-md:px-3">
            <button
              class="finance-row-icon grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 text-muted transition-colors hover:text-ink"
              title="__T_FINANCE_DATE__"
              @click="startEdit(row, 'date')">
              <span class="msi sm">{{ row.type === 'income' ? 'south_west' : 'north_east' }}</span>
            </button>

            <div class="min-w-0">
              <input
                v-if="editing.active && editing.id === row.id && editing.field === 'date'"
                v-model="editing.value"
                class="finance-edit mb-2 h-9 w-28 border-0 px-2 font-mono text-[13px] text-ink outline-none focus:ring-2 focus:ring-accent/30"
                autofocus
                @blur="saveEdit"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit" />
              <input
                v-else-if="editing.active && editing.id === row.id && editing.field === 'note'"
                v-model="editing.value"
                class="finance-edit h-9 w-full border-0 px-2 text-[14px] text-ink outline-none focus:ring-2 focus:ring-accent/30"
                autofocus
                @blur="saveEdit"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit" />
              <button
                v-else
                class="block w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-[14px] font-medium text-ink"
                @click="startEdit(row, 'note')">
                {{ noteText(row) }}
              </button>
              <div class="mt-1 flex items-center gap-2 text-[11.5px] text-faint">
                <span>{{ row.type === 'income' ? '__T_FINANCE_INCOME__' : '__T_FINANCE_EXPENSE__' }}</span>
                <span class="font-mono">{{ fmtDate(row.date) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <input
                v-if="editing.active && editing.id === row.id && editing.field === 'amount'"
                v-model="editing.value"
                class="finance-edit h-9 w-24 border-0 px-2 text-right font-mono text-[13px] outline-none focus:ring-2 focus:ring-accent/30"
                :class="row.type === 'income' ? 'text-good' : 'text-bad'"
                autofocus
                @blur="saveEdit"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit" />
              <button
                v-else
                class="cursor-pointer border-0 bg-transparent p-0 text-right font-mono text-[14px] font-semibold"
                :class="row.type === 'income' ? 'text-good' : 'text-bad'"
                @click="startEdit(row, 'amount')">
                {{ amountText(row) }}
              </button>
              <button
                class="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg hover:text-bad"
                title="__T_COMMON_DELETE__"
                @click="remove(row.id)">
                <span class="msi sm">delete</span>
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.finance-ledger {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-line) 86%, white);
  border-radius: 18px;
  background:
    linear-gradient(150deg, color-mix(in srgb, white 34%, transparent), transparent 42%),
    var(--color-bg-elev);
  box-shadow:
    0 16px 38px color-mix(in srgb, var(--color-ink) 8%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 52%, transparent);
}
.finance-ledger-head {
  border-bottom: 1px solid color-mix(in srgb, var(--color-line) 72%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-hi) 76%, transparent), transparent);
}
.finance-ledger-body {
  padding: 8px;
}
.finance-day {
  overflow: hidden;
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-bg) 72%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 42%, transparent),
    0 8px 18px color-mix(in srgb, var(--color-ink) 5%, transparent);
}
.finance-day + .finance-day {
  margin-top: 8px;
}
.finance-day-head {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-bg-hi) 72%, transparent), color-mix(in srgb, var(--color-bg) 88%, transparent));
}
.finance-row {
  background: color-mix(in srgb, var(--color-bg-elev) 70%, transparent);
}
.finance-row:hover {
  background: color-mix(in srgb, var(--color-bg-hi) 72%, transparent);
}
.finance-row-icon {
  background: linear-gradient(145deg, var(--color-bg-elev), color-mix(in srgb, var(--color-bg-hi) 86%, white));
  box-shadow:
    0 7px 14px color-mix(in srgb, var(--color-ink) 7%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 52%, transparent);
}
.finance-row-icon:active {
  transform: translateY(1px);
  box-shadow: inset 0 2px 6px color-mix(in srgb, var(--color-ink) 12%, transparent);
}
.finance-edit {
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-bg) 90%, var(--color-bg-hi));
  box-shadow: inset 0 2px 7px color-mix(in srgb, var(--color-ink) 8%, transparent);
}
</style>
