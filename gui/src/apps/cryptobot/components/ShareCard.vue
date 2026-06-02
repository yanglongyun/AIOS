<script setup>
// 可截图分享的成绩卡 — 自传播钩子。
import { computed } from 'vue';
import { fmtMoney, fmtPct } from '../utils.js';

const props = defineProps({
    agent: { type: Object, default: null },
    eqPnl: { type: Number, default: 0 },
    eqPnlRatio: { type: Number, default: 0 }
});
defineEmits(['close']);

const up = computed(() => props.eqPnl >= 0);
const todayStr = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
});
</script>

<template>
    <div class="sc-mask" @click.self="$emit('close')">
        <div class="sc-card" :class="up ? 'up' : 'down'">
            <div class="sc-glow"></div>
            <div class="sc-head">
                <span class="sc-logo">₿</span>
                <span class="sc-brand">炒币机 · AIOS</span>
                <span class="sc-date">{{ todayStr }}</span>
            </div>

            <div class="sc-mid">
                <div class="sc-label">AI 自主交易 · 累计收益率</div>
                <div class="sc-pct" :class="up ? 'up' : 'down'">{{ fmtPct(eqPnlRatio) }}</div>
                <div class="sc-pnl" :class="up ? 'up' : 'down'">
                    {{ up ? '▲' : '▼' }} {{ fmtMoney(eqPnl, true) }}
                </div>
            </div>

            <div class="sc-foot">
                <div class="sc-kv"><span>当前净值</span><b>{{ fmtMoney(agent?.equity?.current) }}</b></div>
                <div class="sc-kv"><span>初始本金</span><b>{{ fmtMoney(agent?.equity?.initial) }}</b></div>
            </div>

            <div class="sc-tag">让 AI 替你盯盘 · 全程自主决策</div>
        </div>

        <div class="sc-hint">截图分享你的 AI 战绩 📸</div>
        <button class="sc-close" @click="$emit('close')"><span class="msi">close</span></button>
    </div>
</template>

<style scoped>
.sc-mask {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(6px);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
}
.sc-card {
    position: relative; width: 340px; padding: 28px 26px 22px;
    border-radius: 20px; overflow: hidden;
    background: linear-gradient(165deg, #161b27, #0b0e15);
    border: 1px solid var(--c-line);
    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
}
.sc-card.up { box-shadow: 0 30px 80px rgba(0,0,0,0.6), inset 0 0 60px rgba(14,203,129,0.08); }
.sc-card.down { box-shadow: 0 30px 80px rgba(0,0,0,0.6), inset 0 0 60px rgba(246,70,93,0.08); }
.sc-glow {
    position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, rgba(240,185,11,0.25), transparent 70%); filter: blur(20px);
}

.sc-head { display: flex; align-items: center; gap: 8px; position: relative; }
.sc-logo {
    width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px;
    background: linear-gradient(135deg, #fde293, var(--c-gold)); color: #1a1500; font-weight: 800; font-size: 17px;
}
.sc-brand { font-weight: 700; color: var(--c-text); font-size: 14px; letter-spacing: 0.02em; }
.sc-date { margin-left: auto; font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 11px; color: var(--c-text-3); }

.sc-mid { text-align: center; padding: 26px 0 22px; position: relative; }
.sc-label {
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11px; letter-spacing: 0.1em; color: var(--c-text-3); text-transform: uppercase;
}
.sc-pct {
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 56px; font-weight: 700; line-height: 1.05; margin-top: 8px;
}
.sc-pct.up { color: var(--c-bull); text-shadow: 0 0 30px rgba(14,203,129,0.4); }
.sc-pct.down { color: var(--c-bear); text-shadow: 0 0 30px rgba(246,70,93,0.4); }
.sc-pnl { margin-top: 6px; font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 15px; font-weight: 600; }
.sc-pnl.up { color: var(--c-bull); }
.sc-pnl.down { color: var(--c-bear); }

.sc-foot { display: flex; gap: 10px; }
.sc-kv {
    flex: 1; padding: 10px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.03); border: 1px solid var(--c-line-soft);
}
.sc-kv span { display: block; font-size: 10px; color: var(--c-text-3); letter-spacing: 0.06em; text-transform: uppercase; font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; }
.sc-kv b { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 15px; color: var(--c-text); }

.sc-tag {
    margin-top: 18px; text-align: center; font-size: 11px; color: var(--c-text-3);
    padding-top: 14px; border-top: 1px dashed var(--c-line);
}
.sc-hint { color: var(--c-text-2); font-size: 13px; }
.sc-close {
    position: fixed; top: 20px; right: 20px; border: 0; cursor: pointer;
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,0.08); color: var(--c-text); display: grid; place-items: center;
}
.sc-close:hover { background: rgba(255,255,255,0.15); }
</style>
