<script setup>
import { computed } from 'vue';

const props = defineProps({
    totalIncome:   { type: Number, required: true },
    totalExpense:  { type: Number, required: true },
    endingBalance: { type: Number, required: true },
    fmtAmt:        { type: Function, required: true }
});

const balanceWhole = computed(() => Math.trunc(props.endingBalance).toLocaleString());
const balanceCents = computed(() => {
    const v = Math.abs(props.endingBalance);
    const cents = Math.round((v - Math.trunc(v)) * 100);
    return String(cents).padStart(2, '0');
});
</script>

<template>
    <section class="hero mb-3 rounded-3xl bg-card p-7 shadow-[0_10px_30px_rgba(0,0,0,0.06)] max-md:p-5">
        <div class="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">__T_FINANCE_BALANCE_LABEL__</div>
        <div class="mt-1.5 text-[42px] font-bold leading-none tracking-[-0.025em] text-ink max-md:text-[34px]">
            ¥<span>{{ balanceWhole }}</span><span class="text-[24px] text-good max-md:text-[20px]">.{{ balanceCents }}</span>
        </div>
        <div v-if="totalIncome > 0 || totalExpense > 0"
            class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-bg px-3 py-1 text-[12.5px] font-semibold text-blue-fg">
            ↑ ¥{{ fmtAmt(totalIncome) }} <span class="opacity-70">·</span> ↓ ¥{{ fmtAmt(totalExpense) }}
        </div>
    </section>
</template>
