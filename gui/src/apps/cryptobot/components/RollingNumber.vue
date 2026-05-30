<script setup>
// 数字滚动动画 — 值变化时在旧值到新值之间补间,让界面"活"起来。
import { ref, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
    value: { type: Number, default: 0 },
    decimals: { type: Number, default: 2 },
    prefix: { type: String, default: '' },
    sign: { type: Boolean, default: false },
    duration: { type: Number, default: 600 }
});

const shown = ref(Number(props.value) || 0);
let raf = null;
let startV = 0, startT = 0;

function animate(to) {
    cancelAnimationFrame(raf);
    startV = shown.value;
    startT = performance.now();
    const step = (now) => {
        const p = Math.min(1, (now - startT) / props.duration);
        const eased = 1 - Math.pow(1 - p, 3);
        shown.value = startV + (to - startV) * eased;
        if (p < 1) raf = requestAnimationFrame(step);
        else shown.value = to;
    };
    raf = requestAnimationFrame(step);
}

watch(() => props.value, (v) => animate(Number(v) || 0));
onBeforeUnmount(() => cancelAnimationFrame(raf));

const fmt = (n) => {
    const s = props.sign && n > 0 ? '+' : '';
    return s + props.prefix + n.toLocaleString('en-US', {
        minimumFractionDigits: props.decimals,
        maximumFractionDigits: props.decimals
    });
};
</script>

<template>
    <span class="tabular-nums">{{ fmt(shown) }}</span>
</template>
