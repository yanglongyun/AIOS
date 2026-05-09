<script setup>
import { fmtTime } from '../utils.js';

const props = defineProps({
    decisions: { type: Array, default: () => [] }
});

defineEmits(['refresh']);
</script>

<template>
    <article class="cb-card">
        <header class="cb-sec-head">
            <div>
                <div class="cb-sec-title">决策记录</div>
                <div class="cb-sec-sub">每次采样后 AI 输出的操作意图与结果。</div>
            </div>
            <button class="cb-btn cb-btn-small cb-btn-ghost" @click="$emit('refresh')">
                <span class="msi xxs">refresh</span> 刷新
            </button>
        </header>

        <div v-if="!decisions.length" class="cb-empty">还没有决策</div>
        <div v-else class="flex flex-col">
            <article v-for="d in decisions" :key="d.id" class="cb-dec cb-dec-full">
                <span class="cb-dec-dot" :class="d.ok ? 'ok' : 'bad'"></span>
                <div class="min-w-0 flex-1">
                    <div class="break-words text-[13px] leading-[1.55] text-[var(--c-text)]">
                        {{ d.summary || (d.ok ? '(无摘要)' : '失败') }}
                    </div>
                    <pre v-if="d.error" class="cb-dec-err">{{ d.error }}</pre>
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
.cb-dec-full { padding: 14px 4px; }

.cb-dec-dot {
    width: 8px; height: 8px;
    margin-top: 8px;
    border-radius: 50%;
    flex: none;
    background: var(--c-text-3);
}
.cb-dec-dot.ok  { background: var(--c-bull); box-shadow: 0 0 6px rgba(14,203,129,0.6); }
.cb-dec-dot.bad { background: var(--c-bear); box-shadow: 0 0 6px rgba(246,70,93,0.6); }

.cb-dec-err {
    margin: 6px 0 0;
    padding: 8px 10px;
    background: rgba(246,70,93,0.06);
    color: var(--c-bear);
    border: 1px solid rgba(246,70,93,0.25);
    border-radius: 4px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11.5px;
    line-height: 1.5;
    white-space: pre-wrap;
    max-height: 160px;
    overflow-y: auto;
}

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
