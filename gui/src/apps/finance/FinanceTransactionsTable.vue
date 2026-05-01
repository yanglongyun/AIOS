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
  return row.note || (row.type === 'income' ? '__T_FINANCE_DEFAULT_INCOME_NOTE__' : '__T_FINANCE_DEFAULT_EXPENSE_NOTE__');
};

const amountText = (row) => {
  return `${row.type === 'income' ? '+' : '-'}${props.fmtAmt(row.amount)}`;
};
</script>

<template>
  <section class="rounded-lg border border-line bg-bg-elev">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
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

    <div v-else class="divide-y divide-line">
      <section v-for="group in groups" :key="group.key" class="bg-bg-elev">
        <div class="flex items-center justify-between gap-3 bg-bg px-4 py-2.5">
          <div class="font-mono text-[12px] font-semibold text-muted">{{ group.key }}</div>
          <div class="flex min-w-0 items-center gap-3 text-[11px] text-faint">
            <span v-if="group.expense" class="font-mono text-bad">-{{ fmtAmt(group.expense) }}</span>
            <span v-if="group.income" class="font-mono text-good">+{{ fmtAmt(group.income) }}</span>
          </div>
        </div>

        <div class="divide-y divide-line/70">
          <article
            v-for="row in group.rows"
            :key="row.id"
            class="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-hi max-md:px-3">
            <button
              class="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 bg-bg text-muted transition-colors hover:bg-bg-hi hover:text-ink"
              title="__T_FINANCE_DATE__"
              @click="startEdit(row, 'date')">
              <span class="msi sm">{{ row.type === 'income' ? 'south_west' : 'north_east' }}</span>
            </button>

            <div class="min-w-0">
              <input
                v-if="editing.active && editing.id === row.id && editing.field === 'date'"
                v-model="editing.value"
                class="mb-2 h-9 w-28 rounded-md border border-line-hi bg-bg px-2 font-mono text-[13px] text-ink outline-none focus:border-accent"
                autofocus
                @blur="saveEdit"
                @keyup.enter="saveEdit"
                @keyup.escape="cancelEdit" />
              <input
                v-else-if="editing.active && editing.id === row.id && editing.field === 'note'"
                v-model="editing.value"
                class="h-9 w-full rounded-md border border-line-hi bg-bg px-2 text-[14px] text-ink outline-none focus:border-accent"
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
                class="h-9 w-24 rounded-md border border-line-hi bg-bg px-2 text-right font-mono text-[13px] outline-none focus:border-accent"
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
