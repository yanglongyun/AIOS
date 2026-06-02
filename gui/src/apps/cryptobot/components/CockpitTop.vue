<script setup>
// 终端顶栏:品牌 + 实时净值 + 盈亏 pill + 启停 + 分享 + 设置。
import { computed } from 'vue';
import { fmtMoney, fmtPct } from '../utils.js';
import RollingNumber from './RollingNumber.vue';
import AppHub from '@/components/AppHub.vue';
import AskAI from '@/components/AskAI.vue';

const props = defineProps({
    agent: { type: Object, default: null },
    eqPnl: { type: Number, default: 0 },
    eqPnlRatio: { type: Number, default: 0 },
    busy: { type: Boolean, default: false }
});
defineEmits(['start', 'stop', 'share', 'settings']);

const up = computed(() => props.eqPnl >= 0);
const running = computed(() => Boolean(props.agent?.state?.running));
const hasKeys = computed(() => Boolean(props.agent?.config?.has_keys));
</script>

<template>
    <header class="ct">
        <div class="ct-brand">
            <div class="ct-logo">₿</div>
            <div class="ct-name">
                <b>炒币机</b>
                <small>AI TRADING TERMINAL</small>
            </div>
        </div>

        <div v-if="agent?.equity?.current" class="ct-eq">
            <span class="ct-eq-lbl">净值</span>
            <span class="ct-eq-val"><RollingNumber :value="agent.equity.current" :decimals="2" prefix="$" /></span>
            <span class="ct-pill" :class="up ? 'up' : 'down'">
                {{ up ? '▲' : '▼' }} {{ fmtPct(eqPnlRatio) }}
                <span class="ct-pill-abs">{{ fmtMoney(eqPnl, true) }}</span>
            </span>
        </div>

        <div class="flex-1"></div>

        <button v-if="hasKeys" class="ct-ico" title="分享战绩" @click="$emit('share')">
            <span class="msi xs">ios_share</span>
        </button>
        <button class="ct-ico" title="设置" @click="$emit('settings')">
            <span class="msi xs">tune</span>
        </button>
        <button v-if="running" class="ct-run stop" :disabled="busy" @click="$emit('stop')">
            <span class="msi xxs">stop</span> <span class="ct-run-t">运行中</span>
        </button>
        <button v-else class="ct-run go" :disabled="busy || !hasKeys" @click="$emit('start')">
            <span class="msi xxs">play_arrow</span> <span class="ct-run-t">启动</span>
        </button>

        <div class="ct-sys dark-icons">
            <AskAI />
            <AppHub />
        </div>
    </header>
</template>

<style scoped>
.ct {
    height: 60px; flex: none; display: flex; align-items: center; gap: 16px; padding: 0 20px;
    border-bottom: 1px solid var(--c-line);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
}
.ct-brand { display: flex; align-items: center; gap: 11px; }
.ct-logo {
    width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center;
    font-weight: 800; font-size: 19px; color: #1a1500;
    background: linear-gradient(135deg, #ffe7a3, var(--c-gold) 60%, #c8920a);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 16px rgba(245, 183, 56, 0.4);
}
.ct-name b { font-size: 16px; letter-spacing: 0.02em; color: var(--c-text); display: block; line-height: 1.1; }
.ct-name small { font-size: 10px; color: var(--c-text-3); letter-spacing: 0.16em; font-family: var(--font-mono, monospace); }

.ct-eq { display: flex; align-items: baseline; gap: 10px; margin-left: 6px; }
.ct-eq-lbl { font-size: 10px; color: var(--c-text-3); letter-spacing: 0.14em; font-family: var(--font-mono, monospace); text-transform: uppercase; }
.ct-eq-val { font-family: var(--font-mono, monospace); font-size: 19px; font-weight: 600; color: var(--c-text); }
.ct-pill { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
.ct-pill.up { color: var(--c-bull); background: var(--c-bull-soft); border: 1px solid rgba(43, 212, 164, 0.3); }
.ct-pill.down { color: var(--c-bear); background: var(--c-bear-soft); border: 1px solid rgba(255, 84, 112, 0.3); }
.ct-pill-abs { opacity: 0.8; }

.ct-ico {
    width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 9px;
    border: 1px solid var(--c-line); background: rgba(255, 255, 255, 0.04); color: var(--c-text-2); cursor: pointer; transition: 0.15s;
}
.ct-ico:hover { background: rgba(255, 255, 255, 0.08); color: var(--c-text); }

.ct-run {
    display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border-radius: 9px;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.15s; border: 1px solid transparent;
}
.ct-run:disabled { opacity: 0.4; cursor: default; }
.ct-run.go { background: linear-gradient(180deg, var(--c-bull), #1eae86); color: #04130d; border-color: var(--c-bull); box-shadow: 0 2px 12px rgba(43, 212, 164, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4); }
.ct-run.go:hover:not(:disabled) { filter: brightness(1.07); }
.ct-run.stop { background: var(--c-bear-soft); color: var(--c-bear); border-color: rgba(255, 84, 112, 0.4); }
.ct-run.stop:hover:not(:disabled) { background: rgba(255, 84, 112, 0.2); }

.ct-sys { display: flex; align-items: center; gap: 2px; margin-left: 4px; }
.ct-sys :deep(.icon-btn) { color: var(--c-text-2); }
.ct-sys :deep(.icon-btn:hover) { background: rgba(255, 255, 255, 0.06); color: var(--c-text); }
.ct-sys :deep(.icon-btn.active) { background: rgba(245, 183, 56, 0.15); color: var(--c-gold); }

@media (max-width: 720px) { .ct-eq { display: none; } }
@media (max-width: 560px) {
    .ct { height: 54px; padding: 0 13px; gap: 8px; }
    .ct-name small { display: none; }
    .ct-run { height: 34px; padding: 0 13px; }
    .ct-run-t { display: none; }
}
</style>
