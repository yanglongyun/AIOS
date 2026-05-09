<script setup>
import { fmtTime } from '../utils.js';

const props = defineProps({
    kpis: { type: Array, default: () => [] },
    recentDecisions: { type: Array, default: () => [] }
});

defineEmits(['go-decisions']);
</script>

<template>
    <div class="mx-auto mb-3 grid max-w-[1180px] grid-cols-4 gap-2.5 max-md:grid-cols-2">
        <div v-for="k in kpis" :key="k.label" class="cb-card flex items-center gap-3 !m-0 !p-[14px_16px]">
            <span class="cb-kic msi sm">{{ k.icon }}</span>
            <div class="min-w-0">
                <div class="cb-kpi-label">{{ k.label }}</div>
                <div class="cb-kpi-num">{{ k.value }}</div>
            </div>
        </div>
    </div>

    <article class="cb-card">
        <header class="cb-sec-head">
            <div>
                <div class="cb-sec-title">最近决策</div>
                <div class="cb-sec-sub">AI 每个采样周期都会输出一段操作意图。</div>
            </div>
            <button class="cb-btn cb-btn-small cb-btn-ghost" @click="$emit('go-decisions')">查看全部 →</button>
        </header>
        <div v-if="!recentDecisions.length" class="cb-empty">暂无决策</div>
        <div v-else class="flex flex-col">
            <article v-for="d in recentDecisions" :key="d.id" class="cb-dec">
                <span class="cb-dec-dot" :class="d.ok ? 'ok' : 'bad'"></span>
                <div class="min-w-0 flex-1">
                    <div class="break-words text-[13px] leading-[1.55] text-[var(--c-text)]">
                        {{ d.summary || (d.ok ? '(无摘要)' : (d.error || '失败')) }}
                    </div>
                    <div class="cb-dec-meta">
                        <span class="font-mono">#{{ d.id }}</span>
                        <span v-if="d.task_id">· task #{{ d.task_id }}</span>
                        <span class="ml-auto">{{ fmtTime(d.created_at) }}</span>
                    </div>
                </div>
            </article>
        </div>
    </article>
</template>

<style scoped>
.cb-kic {
    width: 36px; height: 36px;
    background: rgba(240,185,11,0.1);
    color: var(--c-gold);
    border: 1px solid rgba(240,185,11,0.25);
    border-radius: 8px;
    display: grid; place-items: center;
    flex: none;
}
.cb-kpi-label {
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--c-text-3);
}
.cb-kpi-num {
    margin-top: 4px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums;
    color: var(--c-text);
}

.cb-dec {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 11px 4px;
    border-bottom: 1px solid var(--c-line-soft);
    transition: background 0.12s;
}
.cb-dec:hover { background: rgba(255,255,255,0.02); }
.cb-dec:last-child { border-bottom: 0; }

.cb-dec-dot {
    width: 8px; height: 8px;
    margin-top: 8px;
    border-radius: 50%;
    flex: none;
    background: var(--c-text-3);
}
.cb-dec-dot.ok  { background: var(--c-bull); box-shadow: 0 0 6px rgba(14,203,129,0.6); }
.cb-dec-dot.bad { background: var(--c-bear); box-shadow: 0 0 6px rgba(246,70,93,0.6); }

.cb-dec-meta {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11px;
    color: var(--c-text-3);
}
</style>
