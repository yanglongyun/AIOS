<script setup>
// 真实净值曲线 — 接收 points/initial,画交互式区域图。
// 不再有任何写死坐标:全部来自后端 cryptobot_equity 采样。
import { computed, ref } from 'vue';

const props = defineProps({
    points: { type: Array, default: () => [] },     // [{ t, v }]
    initial: { type: Number, default: 0 },
    up: { type: Boolean, default: true }
});

const W = 1000;
const H = 260;
const PAD_Y = 18;

// 数值域:把 initial 也纳入,保证基准线落在画面内
const domain = computed(() => {
    const vals = props.points.map((p) => p.v);
    if (props.initial > 0) vals.push(props.initial);
    if (!vals.length) return { min: 0, max: 1 };
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    if (min === max) { min -= 1; max += 1; }
    const pad = (max - min) * 0.08;
    return { min: min - pad, max: max + pad };
});

const xAt = (i) => {
    const n = props.points.length;
    return n <= 1 ? W : (i / (n - 1)) * W;
};
const yAt = (v) => {
    const { min, max } = domain.value;
    const ratio = (v - min) / (max - min);
    return H - PAD_Y - ratio * (H - PAD_Y * 2);
};

const linePath = computed(() => {
    const pts = props.points;
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(p.v).toFixed(1)}`).join(' ');
});
const areaPath = computed(() => {
    if (!linePath.value) return '';
    return `${linePath.value} L${W},${H} L0,${H} Z`;
});
const baselineY = computed(() => (props.initial > 0 ? yAt(props.initial) : null));

const stroke = computed(() => (props.up ? '#2bd4a4' : '#ff5470'));

// ── 悬停交互 ──
const hover = ref(-1);
const svgEl = ref(null);
function onMove(e) {
    const pts = props.points;
    if (!pts.length || !svgEl.value) return;
    const rect = svgEl.value.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bd = Infinity;
    for (let i = 0; i < pts.length; i++) {
        const d = Math.abs(xAt(i) - x);
        if (d < bd) { bd = d; best = i; }
    }
    hover.value = best;
}
function onLeave() { hover.value = -1; }

const hoverPt = computed(() => (hover.value >= 0 ? props.points[hover.value] : null));
const hoverX = computed(() => (hover.value >= 0 ? xAt(hover.value) : 0));
const hoverY = computed(() => (hoverPt.value ? yAt(hoverPt.value.v) : 0));
const lastX = computed(() => (props.points.length ? xAt(props.points.length - 1) : 0));
const lastY = computed(() => (props.points.length ? yAt(props.points[props.points.length - 1].v) : 0));

const fmtV = (v) => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const fmtT = (t) => {
    const d = new Date(typeof t === 'string' ? t.replace(' ', 'T') + 'Z' : t);
    if (isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}/${d.getDate()} ${d.toTimeString().slice(0, 5)}`;
};

const gid = computed(() => 'eqg-' + (props.up ? 'u' : 'd'));
</script>

<template>
    <div class="eqc-wrap">
        <svg ref="svgEl" :viewBox="`0 0 ${W} ${H}`" class="eqc-svg" preserveAspectRatio="none"
             @mousemove="onMove" @mouseleave="onLeave">
            <defs>
                <linearGradient :id="gid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="stroke" stop-opacity="0.28" />
                    <stop offset="100%" :stop-color="stroke" stop-opacity="0" />
                </linearGradient>
            </defs>

            <!-- 基准本金虚线 -->
            <line v-if="baselineY !== null" x1="0" :y1="baselineY" :x2="W" :y2="baselineY"
                  stroke="rgba(160,164,179,0.35)" stroke-width="1" stroke-dasharray="4 5" />

            <path :d="areaPath" :fill="`url(#${gid})`" />
            <path :d="linePath" fill="none" :stroke="stroke" stroke-width="2.5"
                  stroke-linejoin="round" stroke-linecap="round" class="eqc-line" />

            <!-- 末端脉冲点 -->
            <circle v-if="points.length" :cx="lastX" :cy="lastY" r="4" :fill="stroke" class="eqc-last" />

            <!-- 悬停 -->
            <template v-if="hoverPt">
                <line :x1="hoverX" y1="0" :x2="hoverX" :y2="H" stroke="rgba(255,255,255,0.18)" stroke-width="1" />
                <circle :cx="hoverX" :cy="hoverY" r="5" :fill="stroke" stroke="#0b0e15" stroke-width="2" />
            </template>
        </svg>

        <div v-if="hoverPt" class="eqc-tip" :style="{ left: (hoverX / W * 100) + '%' }">
            <div class="eqc-tip-v">{{ fmtV(hoverPt.v) }}</div>
            <div class="eqc-tip-t">{{ fmtT(hoverPt.t) }}</div>
        </div>

        <div v-if="initial > 0" class="eqc-baseline-tag">本金 {{ fmtV(initial) }}</div>
    </div>
</template>

<style scoped>
.eqc-wrap { position: relative; width: 100%; }
.eqc-svg {
    width: 100%;
    height: 200px;
    display: block;
    overflow: visible;
}
.eqc-line { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4)); }
.eqc-last { filter: drop-shadow(0 0 6px currentColor); animation: eqc-pulse 1.8s ease-in-out infinite; }
@keyframes eqc-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

.eqc-tip {
    position: absolute;
    top: -4px;
    transform: translateX(-50%);
    pointer-events: none;
    background: rgba(10,13,20,0.92);
    border: 1px solid var(--c-line);
    border-radius: 6px;
    padding: 5px 9px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    white-space: nowrap;
    box-shadow: 0 6px 18px rgba(0,0,0,0.5);
    z-index: 3;
}
.eqc-tip-v { font-size: 13px; font-weight: 600; color: var(--c-text); }
.eqc-tip-t { font-size: 10px; color: var(--c-text-3); margin-top: 2px; }

.eqc-baseline-tag {
    position: absolute;
    right: 0; bottom: 4px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 10px;
    color: var(--c-text-3);
    background: rgba(11,14,21,0.7);
    padding: 1px 6px;
    border-radius: 3px;
}
@media (max-width: 760px) { .eqc-svg { height: 160px; } }
</style>
