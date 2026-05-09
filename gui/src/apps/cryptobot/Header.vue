<script setup>
import { relTime } from './utils.js';

const props = defineProps({
    agent: { type: Object, default: null },
    busy: { type: Boolean, default: false },
    notice: { type: Object, default: () => ({ kind: '', text: '' }) }
});

defineEmits(['start', 'stop']);
</script>

<template>
    <header class="cb-card cb-head-card">
        <div class="flex flex-1 min-w-0 items-center gap-3.5">
            <div class="cb-logo grid h-[52px] w-[52px] flex-none place-items-center rounded-[14px] text-[28px] font-bold">
                ₿
            </div>
            <div class="min-w-0 flex-1">
                <h1 class="m-0 text-[20px] font-semibold tracking-[0.01em] text-[var(--c-text)]">炒币机</h1>
                <div class="mt-1 font-mono text-[11.5px] text-[var(--c-text-3)]">
                    OKX 自动交易 · 上次运行 {{ relTime(agent?.state?.last_run_at) }}
                    <template v-if="agent?.state?.last_error_at">
                        · <span class="text-[var(--c-bear)]">最近错误 {{ relTime(agent?.state?.last_error_at) }}</span>
                    </template>
                </div>
            </div>
        </div>

        <div class="flex flex-none items-center gap-2.5">
            <span class="cb-status" :class="agent?.state?.running ? 'on' : 'off'">
                <span class="cb-status-dot" :class="{ pulse: agent?.state?.running }"></span>
                {{ agent?.state?.running ? (agent?.state?.executing ? '执行中' : '运行中') : '已停止' }}
            </span>
            <button v-if="agent?.state?.running"
                    class="cb-btn cb-btn-danger"
                    :disabled="busy"
                    @click="$emit('stop')">
                <span class="msi xxs">stop</span> 暂停
            </button>
            <button v-else
                    class="cb-btn cb-btn-solid"
                    :disabled="busy || !agent?.config?.has_keys"
                    @click="$emit('start')">
                <span class="msi xxs">play_arrow</span> 启动
            </button>
            <Transition name="cb-fade">
                <span v-if="notice.text"
                      class="cb-notice"
                      :class="notice.kind">{{ notice.text }}</span>
            </Transition>
        </div>
    </header>
</template>

<style scoped>
/* 头部 brand 卡 — 渐变底,左竖条 */
.cb-head-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: linear-gradient(180deg, #181c28 0%, var(--c-card) 100%);
}

/* 比特币金色 logo */
.cb-logo {
    background: linear-gradient(135deg, #fde293 0%, var(--c-gold-hi) 35%, var(--c-gold) 70%, #b88a06 100%);
    color: #1a1500;
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.6),
        inset 0 -2px 4px rgba(0,0,0,0.2),
        0 4px 16px rgba(240,185,11,0.45),
        0 0 30px rgba(240,185,11,0.18);
}

/* 状态 pill */
.cb-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.cb-status.on  { background: var(--c-bull-soft); color: var(--c-bull); border: 1px solid rgba(14,203,129,0.35); }
.cb-status.off { background: rgba(108,113,128,0.12); color: var(--c-text-3); border: 1px solid var(--c-line); }
.cb-status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, currentColor, transparent 80%), currentColor;
    box-shadow: 0 0 8px currentColor;
}
.cb-status-dot.pulse { animation: cb-pulse 1.4s ease-in-out infinite; }
@keyframes cb-pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor, 0 0 12px currentColor; }
    50%      { opacity: 0.55; box-shadow: 0 0 3px currentColor; }
}

/* 通知 */
.cb-notice {
    padding: 5px 10px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}
.cb-notice.ok  { background: var(--c-bull-soft); color: var(--c-bull); }
.cb-notice.err { background: var(--c-bear-soft); color: var(--c-bear); }

.cb-fade-enter-active, .cb-fade-leave-active { transition: opacity 0.2s; }
.cb-fade-enter-from, .cb-fade-leave-to { opacity: 0; }

@media (max-width: 760px) {
    .cb-head-card { flex-direction: column; align-items: stretch; }
    .cb-head-card > :last-child { justify-content: flex-end; }
}
</style>
