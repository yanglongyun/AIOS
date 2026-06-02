<script setup>
// 英雄净值卡:大数 + 真实可交互曲线 + 区间切换。
import { ref, computed, watch, onMounted } from 'vue';
import * as cb from './api.js';
import { fmtPct } from './utils.js';
import EquityChart from './components/EquityChart.vue';
import RollingNumber from './components/RollingNumber.vue';

const props = defineProps({
    agent: { type: Object, default: null },
    eqPnl: { type: Number, default: 0 },
    eqPnlRatio: { type: Number, default: 0 },
    todayChange: { type: Number, default: 0 },
    refreshKey: { type: Number, default: 0 }   // 父级轮询变化时触发刷新
});

const ranges = [
    { key: '1D', label: '日' },
    { key: '1W', label: '周' },
    { key: '1M', label: '月' },
    { key: 'ALL', label: '全部' }
];
const range = ref('ALL');

const points = ref([]);
const initial = ref(0);
const loading = ref(false);

async function loadHistory() {
    loading.value = true;
    try {
        const r = await cb.getEquityHistory(range.value);
        points.value = (r?.points || []).map((p) => ({ t: p.t, v: Number(p.v) || 0 }));
        initial.value = Number(r?.initial) || 0;
    } catch { points.value = []; }
    loading.value = false;
}

watch(range, loadHistory);
watch(() => props.refreshKey, loadHistory);
onMounted(loadHistory);

const up = computed(() => props.eqPnl >= 0);
const enoughPoints = computed(() => points.value.length >= 2);
</script>

<template>
    <article class="cb-card cb-equity-card">
        <div class="cb-eq-top">
            <div class="min-w-0">
                <div class="cb-eyebrow">账户净值</div>
                <div class="cb-big-num">
                    <RollingNumber :value="agent.equity?.current || 0" :decimals="2" prefix="$" />
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-3 font-mono text-[12px]">
                    <span class="cb-pnl-pill" :class="up ? 'pos' : 'neg'">
                        <span class="msi xxs">{{ up ? 'trending_up' : 'trending_down' }}</span>
                        {{ fmtPct(eqPnlRatio) }} ·
                        <RollingNumber :value="eqPnl" :decimals="2" prefix="$" :sign="true" />
                    </span>
                    <span v-if="todayChange !== 0" class="text-[var(--c-text-3)]">
                        今日
                        <strong class="font-semibold" :class="todayChange >= 0 ? 'text-[var(--c-bull)]' : 'text-[var(--c-bear)]'">
                            <RollingNumber :value="todayChange" :decimals="2" prefix="$" :sign="true" />
                        </strong>
                    </span>
                </div>
            </div>

            <div class="cb-range">
                <button v-for="r in ranges" :key="r.key"
                        class="cb-range-btn" :class="{ on: range === r.key }"
                        @click="range = r.key">{{ r.label }}</button>
            </div>
        </div>

        <div class="cb-eq-chart">
            <EquityChart v-if="enoughPoints" :points="points" :initial="initial" :up="up" />
            <div v-else class="cb-eq-empty">
                <span class="msi" style="font-size:28px;opacity:0.4">show_chart</span>
                <span>{{ loading ? '加载中…' : '净值曲线会在机器人运行后逐步生成' }}</span>
            </div>
        </div>
    </article>
</template>

<style scoped>
.cb-equity-card {
    background:
        radial-gradient(900px 240px at 100% 0%, rgba(14,203,129,0.05), transparent 70%),
        var(--c-card);
    position: relative;
    overflow: hidden;
}
.cb-equity-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--c-gold), transparent);
}

.cb-eq-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.cb-eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--c-text-3);
}
.cb-big-num {
    margin-top: 6px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 42px;
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.01em;
    color: var(--c-text);
    text-shadow: 0 0 24px rgba(238,240,245,0.15);
}

.cb-pnl-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 12.5px;
    font-weight: 600;
}
.cb-pnl-pill.pos { background: var(--c-bull-soft); color: var(--c-bull); border: 1px solid rgba(14,203,129,0.3); box-shadow: 0 0 12px rgba(14,203,129,0.18); }
.cb-pnl-pill.neg { background: var(--c-bear-soft); color: var(--c-bear); border: 1px solid rgba(246,70,93,0.3); box-shadow: 0 0 12px rgba(246,70,93,0.18); }

.cb-range { display: flex; gap: 2px; padding: 3px; background: rgba(0,0,0,0.3); border: 1px solid var(--c-line); border-radius: 6px; flex: none; }
.cb-range-btn {
    padding: 4px 11px;
    border: 0; background: transparent; cursor: pointer;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11px; font-weight: 600; color: var(--c-text-3);
    border-radius: 4px; transition: all 0.15s;
}
.cb-range-btn:hover { color: var(--c-text-2); }
.cb-range-btn.on { background: rgba(240,185,11,0.14); color: var(--c-gold); }

.cb-eq-chart { margin-top: 14px; min-height: 200px; }
.cb-eq-empty {
    height: 200px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
    color: var(--c-text-3);
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 12.5px;
    border: 1px dashed var(--c-line);
    border-radius: 8px;
}

@media (max-width: 760px) {
    .cb-eq-top { flex-direction: column; }
    .cb-range { align-self: flex-start; }
    .cb-big-num { font-size: 34px; }
    .cb-eq-chart { min-height: 160px; }
}
</style>
