<script setup>
// AI 决策流 — 终端右栏主角。最新决策从顶部流入;agent 执行中时显示"思考中"。
import { computed } from 'vue';
import DecisionCard from './DecisionCard.vue';

const props = defineProps({
    decisions: { type: Array, default: () => [] },
    agent: { type: Object, default: null }
});
defineEmits(['refresh']);

const running = computed(() => Boolean(props.agent?.state?.running));
const executing = computed(() => Boolean(props.agent?.state?.executing));
const hasKeys = computed(() => Boolean(props.agent?.config?.has_keys));
</script>

<template>
    <section class="af">
        <header class="af-h">
            <div class="af-badge msi sm">smart_toy</div>
            <div class="min-w-0 flex-1">
                <div class="af-t">AI 决策流</div>
                <div class="af-s">
                    <span class="af-dot" :class="{ live: running }"></span>
                    {{ running ? '自主交易中 · 每周期实时' : '已停止 · 启动后开始决策' }}
                </div>
            </div>
            <button class="af-refresh msi xs" title="刷新" @click="$emit('refresh')">refresh</button>
        </header>

        <div class="af-feed">
            <div v-if="executing" class="af-think">
                <span>AI 正在分析市场并执行</span>
                <span class="af-tdots"><i></i><i></i><i></i></span>
            </div>

            <DecisionCard v-for="d in decisions" :key="d.id" :decision="d" />

            <div v-if="!decisions.length && !executing" class="af-empty">
                <span class="msi af-empty-ic">smart_toy</span>
                <p class="af-empty-t">{{ hasKeys ? '还没有决策' : '配置 OKX 后启动机器人' }}</p>
                <p class="af-empty-s">AI 每个采样周期都会在这里留下它的判断、真实交易动作与推理。</p>
            </div>
        </div>

        <div class="af-foot">每条决策都是 AI 真实调用 OKX 后的判断与动作</div>
    </section>
</template>

<style scoped>
.af {
    flex: 1; min-height: 0; display: flex; flex-direction: column; border-radius: 16px; overflow: hidden;
    border: 1px solid var(--c-ai-line);
    background:
        radial-gradient(420px 220px at 100% 0%, var(--c-ai-soft), transparent 70%),
        linear-gradient(180deg, #13151f, #0f111a);
}
.af-h { flex: none; padding: 16px 18px; border-bottom: 1px solid var(--c-ai-line); display: flex; align-items: center; gap: 11px; }
.af-badge { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; flex: none; color: var(--c-ai); background: var(--c-ai-soft); border: 1px solid var(--c-ai-line); }
.af-t { font-size: 13.5px; font-weight: 600; color: var(--c-text); }
.af-s { font-size: 10.5px; color: var(--c-ai); font-family: var(--font-mono, monospace); letter-spacing: 0.04em; margin-top: 2px; display: flex; align-items: center; gap: 6px; }
.af-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-text-3); }
.af-dot.live { background: var(--c-ai); box-shadow: 0 0 8px var(--c-ai); animation: af-blink 1.4s infinite; }
@keyframes af-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.af-refresh { border: 0; background: transparent; color: var(--c-text-3); cursor: pointer; padding: 4px; border-radius: 6px; }
.af-refresh:hover { color: var(--c-text); background: rgba(255, 255, 255, 0.06); }

.af-feed { flex: 1; min-height: 0; overflow-y: auto; padding: 14px; }
.af-feed::-webkit-scrollbar { width: 7px; }
.af-feed::-webkit-scrollbar-thumb { background: #262a3a; border-radius: 7px; }

.af-think {
    display: flex; align-items: center; gap: 9px; padding: 11px 13px; border-radius: 11px; margin-bottom: 12px;
    background: var(--c-ai-soft); border: 1px solid var(--c-ai-line); color: var(--c-ai); font-size: 12px;
}
.af-tdots { display: inline-flex; gap: 3px; }
.af-tdots i { width: 5px; height: 5px; border-radius: 50%; background: var(--c-ai); animation: af-td 1.2s infinite; }
.af-tdots i:nth-child(2) { animation-delay: 0.2s; }
.af-tdots i:nth-child(3) { animation-delay: 0.4s; }
@keyframes af-td { 0%, 60%, 100% { opacity: 0.25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }

.af-empty { text-align: center; padding: 40px 18px; color: var(--c-text-3); }
.af-empty-ic { font-size: 34px; opacity: 0.4; }
.af-empty-t { margin-top: 10px; font-size: 13px; color: var(--c-text-2); font-weight: 600; }
.af-empty-s { margin-top: 6px; font-size: 11.5px; line-height: 1.6; }

.af-foot { flex: none; padding: 8px 14px; text-align: center; font-size: 10.5px; color: var(--c-text-3); font-family: var(--font-mono, monospace); border-top: 1px solid var(--c-line-soft); }
</style>
