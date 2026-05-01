<script setup>
defineProps({
  displayMonth: { type: String, required: true },
  isCurrentMonth: { type: Boolean, required: true },
  totalIncome: { type: Number, required: true },
  totalExpense: { type: Number, required: true },
  endingBalance: { type: Number, required: true },
  fmtAmt: { type: Function, required: true }
});

defineEmits(['prev-month', 'next-month']);
</script>

<template>
  <section class="mb-3 rounded-lg border border-line bg-bg-elev px-4 py-4">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex items-center gap-2">
        <button
          class="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-bg-hi text-muted transition-colors hover:bg-line-hi hover:text-ink"
          @click="$emit('prev-month')">
          <span class="msi sm">chevron_left</span>
        </button>
        <div class="min-w-[128px] text-center font-mono text-[15px] font-semibold text-ink">{{ displayMonth }}</div>
        <button
          class="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-bg-hi text-muted transition-colors hover:bg-line-hi hover:text-ink disabled:cursor-default disabled:opacity-35"
          :disabled="isCurrentMonth"
          @click="$emit('next-month')">
          <span class="msi sm">chevron_right</span>
        </button>
      </div>
      <div class="text-[12px] text-faint">__T_FINANCE_MONTH_HINT__</div>
    </div>

    <div class="grid grid-cols-3 gap-2 max-md:grid-cols-1">
      <div class="rounded-lg bg-bg px-4 py-3">
        <div class="text-[11px] font-medium uppercase tracking-wider text-faint">__T_FINANCE_INCOME__</div>
        <div class="mt-1 font-mono text-[22px] font-semibold text-good">+ {{ fmtAmt(totalIncome) }}</div>
      </div>
      <div class="rounded-lg bg-bg px-4 py-3">
        <div class="text-[11px] font-medium uppercase tracking-wider text-faint">__T_FINANCE_EXPENSE__</div>
        <div class="mt-1 font-mono text-[22px] font-semibold text-bad">- {{ fmtAmt(totalExpense) }}</div>
      </div>
      <div class="rounded-lg bg-bg px-4 py-3">
        <div class="text-[11px] font-medium uppercase tracking-wider text-faint">__T_FINANCE_BALANCE__</div>
        <div class="mt-1 font-mono text-[22px] font-semibold" :class="endingBalance >= 0 ? 'text-ink' : 'text-bad'">
          {{ fmtAmt(endingBalance) }}
        </div>
      </div>
    </div>
  </section>
</template>
