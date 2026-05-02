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
  <section class="finance-summary mb-3 px-4 py-4">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex items-center gap-2">
        <button
          class="finance-round-btn grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 text-muted transition-colors hover:text-ink"
          @click="$emit('prev-month')">
          <span class="msi sm">chevron_left</span>
        </button>
        <div class="finance-month min-w-[128px] text-center font-mono text-[15px] font-semibold text-ink">{{ displayMonth }}</div>
        <button
          class="finance-round-btn grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 text-muted transition-colors hover:text-ink disabled:cursor-default disabled:opacity-35"
          :disabled="isCurrentMonth"
          @click="$emit('next-month')">
          <span class="msi sm">chevron_right</span>
        </button>
      </div>
      <div class="text-[12px] text-faint">__T_FINANCE_MONTH_HINT__</div>
    </div>

    <div class="grid grid-cols-3 gap-2 max-md:grid-cols-1">
      <div class="finance-stat finance-stat-income px-4 py-3">
        <div class="text-[11px] font-medium uppercase tracking-wider text-faint">__T_FINANCE_INCOME__</div>
        <div class="mt-1 font-mono text-[22px] font-semibold text-good">+ {{ fmtAmt(totalIncome) }}</div>
      </div>
      <div class="finance-stat finance-stat-expense px-4 py-3">
        <div class="text-[11px] font-medium uppercase tracking-wider text-faint">__T_FINANCE_EXPENSE__</div>
        <div class="mt-1 font-mono text-[22px] font-semibold text-bad">- {{ fmtAmt(totalExpense) }}</div>
      </div>
      <div class="finance-stat finance-stat-balance px-4 py-3">
        <div class="text-[11px] font-medium uppercase tracking-wider text-faint">__T_FINANCE_BALANCE__</div>
        <div class="mt-1 font-mono text-[22px] font-semibold" :class="endingBalance >= 0 ? 'text-ink' : 'text-bad'">
          {{ fmtAmt(endingBalance) }}
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.finance-summary {
  position: relative;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-line) 82%, white);
  border-radius: 18px;
  background:
    linear-gradient(140deg, color-mix(in srgb, white 46%, transparent), transparent 38%),
    linear-gradient(180deg, var(--color-bg-elev), color-mix(in srgb, var(--color-bg-hi) 72%, var(--color-bg)));
  box-shadow:
    0 18px 45px color-mix(in srgb, var(--color-ink) 9%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 60%, transparent);
}
.finance-summary::after {
  content: "";
  position: absolute;
  inset: 10px;
  pointer-events: none;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, white 38%, transparent);
}
.finance-round-btn,
.finance-month,
.finance-stat {
  position: relative;
  z-index: 1;
}
.finance-round-btn {
  background: linear-gradient(145deg, var(--color-bg-elev), color-mix(in srgb, var(--color-bg-hi) 88%, white));
  box-shadow:
    0 7px 14px color-mix(in srgb, var(--color-ink) 8%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 58%, transparent);
}
.finance-round-btn:active {
  transform: translateY(1px);
  box-shadow: inset 0 2px 6px color-mix(in srgb, var(--color-ink) 12%, transparent);
}
.finance-month {
  border-radius: 999px;
  padding: 7px 14px;
  background: color-mix(in srgb, var(--color-bg) 70%, transparent);
  box-shadow: inset 0 2px 8px color-mix(in srgb, var(--color-ink) 7%, transparent);
}
.finance-stat {
  border-radius: 16px;
  background:
    linear-gradient(150deg, color-mix(in srgb, white 45%, transparent), transparent 48%),
    var(--color-bg);
  box-shadow:
    0 12px 24px color-mix(in srgb, var(--color-ink) 7%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 54%, transparent);
}
.finance-stat-income {
  border: 1px solid color-mix(in srgb, var(--color-good) 24%, var(--color-line));
}
.finance-stat-expense {
  border: 1px solid color-mix(in srgb, var(--color-bad) 22%, var(--color-line));
}
.finance-stat-balance {
  border: 1px solid color-mix(in srgb, var(--color-accent) 22%, var(--color-line));
}
</style>
