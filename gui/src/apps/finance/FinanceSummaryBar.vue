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
  <section class="mb-3">
    <!-- Month nav -->
    <div class="mb-3 flex flex-wrap items-center gap-3">
      <div class="inline-flex items-center gap-1 rounded-full bg-card-sub p-1">
        <button class="grid h-7 w-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg hover:text-ink"
          @click="$emit('prev-month')">
          <span class="msi" style="font-size:16px">chevron_left</span>
        </button>
        <div class="min-w-[100px] text-center font-mono text-[13px] font-semibold text-ink">{{ displayMonth }}</div>
        <button class="grid h-7 w-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg hover:text-ink disabled:cursor-default disabled:opacity-35"
          :disabled="isCurrentMonth"
          @click="$emit('next-month')">
          <span class="msi" style="font-size:16px">chevron_right</span>
        </button>
      </div>
      <div class="text-[12px] text-faint">__T_FINANCE_MONTH_HINT__</div>
    </div>

    <!-- Stats: 3 cards with left accent bar -->
    <div class="grid grid-cols-3 gap-2 max-md:grid-cols-1">
      <div class="stat stat-income rounded-[14px] bg-card px-4 py-3">
        <div class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">__T_FINANCE_INCOME__</div>
        <div class="mt-1 font-mono text-[22px] font-semibold leading-tight text-good">+ {{ fmtAmt(totalIncome) }}</div>
      </div>
      <div class="stat stat-expense rounded-[14px] bg-card px-4 py-3">
        <div class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">__T_FINANCE_EXPENSE__</div>
        <div class="mt-1 font-mono text-[22px] font-semibold leading-tight text-bad">- {{ fmtAmt(totalExpense) }}</div>
      </div>
      <div class="stat stat-balance rounded-[14px] bg-card px-4 py-3">
        <div class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">__T_FINANCE_BALANCE__</div>
        <div class="mt-1 font-mono text-[22px] font-semibold leading-tight" :class="endingBalance >= 0 ? 'text-ink' : 'text-bad'">
          {{ fmtAmt(endingBalance) }}
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stat {
  position: relative;
  overflow: hidden;
}
.stat::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
}
.stat-income::before  { background: var(--color-good); }
.stat-expense::before { background: var(--color-bad); }
.stat-balance::before { background: var(--color-accent); }
</style>
