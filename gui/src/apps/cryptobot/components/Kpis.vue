<script setup>
// 四宫格 KPI 概览。值全部来自 useCryptoData 的真实数据。
defineProps({ kpis: { type: Array, default: () => [] } });
</script>

<template>
    <div class="kpis">
        <div v-for="k in kpis" :key="k.label" class="kpi cb-card">
            <span class="kpi-ic msi sm">{{ k.icon }}</span>
            <div class="min-w-0">
                <div class="kpi-lbl">{{ k.label }}</div>
                <div class="kpi-num tabular-nums">{{ k.value }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 0 auto 12px; max-width: 1180px; }
.kpi { display: flex; align-items: center; gap: 12px; padding: 14px 16px !important; margin: 0 !important; }
.kpi-ic { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; flex: none; color: var(--c-gold); background: rgba(245, 183, 56, 0.1); border: 1px solid rgba(245, 183, 56, 0.22); }
.kpi-lbl { font-family: var(--font-mono, monospace); font-size: 10px; letter-spacing: 0.1em; color: var(--c-text-3); text-transform: uppercase; }
.kpi-num { font-family: var(--font-mono, monospace); font-size: 18px; font-weight: 600; color: var(--c-text); margin-top: 3px; }
@media (max-width: 560px) { .kpis { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
</style>
