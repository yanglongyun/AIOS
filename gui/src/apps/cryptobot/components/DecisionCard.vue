<script setup>
// 一条 AI 决策 = 一张交易卡:立场 + 一句话标题 + 动作链 + 可展开的推理。
import { ref, computed } from 'vue';
import { fmtTime, stanceMeta, actionMeta, num } from '../utils.js';

const props = defineProps({
    decision: { type: Object, required: true },
    compact: { type: Boolean, default: false }   // 概览里用紧凑版,不展开正文
});

const d = computed(() => props.decision);
const stance = computed(() => stanceMeta(d.value.stance));
const actions = computed(() => (Array.isArray(d.value.actions) ? d.value.actions : []));
const tradeActions = computed(() => actions.value.filter((a) => a.type !== 'hold'));
const headline = computed(() => d.value.headline || d.value.summary?.slice(0, 24) || (d.value.ok ? '本轮无摘要' : '运行失败'));

const open = ref(false);
const hasBody = computed(() => Boolean(d.value.summary && !props.compact));
</script>

<template>
    <article class="dc" :class="{ bad: !d.ok }">
        <div class="dc-rail" :class="d.ok ? stance.cls : 'bear'"></div>

        <div class="min-w-0 flex-1">
            <div class="dc-top">
                <span class="dc-stance" :class="d.ok ? stance.cls : 'bear'">
                    <span class="msi xxs">{{ d.ok ? stance.icon : 'error' }}</span>
                    {{ d.ok ? stance.label : '失败' }}
                </span>
                <span class="dc-headline">{{ headline }}</span>
                <span class="dc-time">{{ fmtTime(d.created_at) }}</span>
            </div>

            <!-- 动作链 -->
            <div v-if="tradeActions.length" class="dc-actions">
                <span v-for="(a, i) in tradeActions" :key="i" class="dc-act" :class="actionMeta(a.type).cls">
                    <b>{{ actionMeta(a.type).label }}</b>
                    <span class="dc-act-inst">{{ a.instId }}</span>
                    <span v-if="a.size" class="dc-act-sz">{{ a.size }}</span>
                    <span v-if="a.price" class="dc-act-px">@ {{ num(a.price, 4) }}</span>
                </span>
            </div>
            <div v-else-if="d.ok && !compact" class="dc-noop">本轮未交易 · 持仓观望</div>

            <!-- 推理正文 -->
            <div v-if="hasBody" class="dc-body" :class="{ clamp: !open }">{{ d.summary }}</div>
            <pre v-if="d.error && !compact" class="dc-err">{{ d.error }}</pre>

            <div class="dc-foot">
                <span class="dc-id">#{{ d.id }}</span>
                <span v-if="d.task_id">· task #{{ d.task_id }}</span>
                <button v-if="hasBody && d.summary.length > 90" class="dc-more" @click="open = !open">
                    {{ open ? '收起' : '展开推理' }}
                </button>
            </div>
        </div>
    </article>
</template>

<style scoped>
.dc {
    display: flex;
    gap: 12px;
    padding: 13px 14px 11px;
    border-radius: 10px;
    background: rgba(255,255,255,0.015);
    border: 1px solid var(--c-line-soft);
    margin-bottom: 9px;
    transition: border-color 0.15s, background 0.15s;
}
.dc:hover { background: rgba(255,255,255,0.03); border-color: var(--c-line); }
.dc:last-child { margin-bottom: 0; }

.dc-rail { width: 3px; flex: none; border-radius: 3px; align-self: stretch; }
.dc-rail.bull { background: var(--c-bull); box-shadow: 0 0 8px rgba(14,203,129,0.5); }
.dc-rail.bear { background: var(--c-bear); box-shadow: 0 0 8px rgba(246,70,93,0.5); }
.dc-rail.mute { background: var(--c-text-3); }

.dc-top { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.dc-stance {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 8px; border-radius: 4px;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}
.dc-stance.bull { background: var(--c-bull-soft); color: var(--c-bull); }
.dc-stance.bear { background: var(--c-bear-soft); color: var(--c-bear); }
.dc-stance.mute { background: rgba(255,255,255,0.05); color: var(--c-text-2); }

.dc-headline { font-size: 13.5px; font-weight: 600; color: var(--c-text); flex: 1; min-width: 0; }
.dc-time { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 10.5px; color: var(--c-text-3); flex: none; }

.dc-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
.dc-act {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 5px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11px; border: 1px solid transparent;
}
.dc-act.bull { background: var(--c-bull-soft); color: var(--c-bull); border-color: rgba(14,203,129,0.25); }
.dc-act.bear { background: var(--c-bear-soft); color: var(--c-bear); border-color: rgba(246,70,93,0.25); }
.dc-act.mute { background: rgba(255,255,255,0.04); color: var(--c-text-2); border-color: var(--c-line); }
.dc-act b { font-weight: 700; }
.dc-act-inst { color: var(--c-text); font-weight: 600; }
.dc-act-sz { opacity: 0.85; }
.dc-act-px { color: var(--c-text-3); }

.dc-noop {
    margin-top: 8px; font-size: 11.5px; color: var(--c-text-3);
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}

.dc-body {
    margin-top: 9px; font-size: 12.5px; line-height: 1.6; color: var(--c-text-2);
    white-space: pre-wrap; word-break: break-word;
}
.dc-body.clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.dc-err {
    margin: 8px 0 0; padding: 8px 10px;
    background: rgba(246,70,93,0.06); color: var(--c-bear);
    border: 1px solid rgba(246,70,93,0.25); border-radius: 5px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11px; line-height: 1.5; white-space: pre-wrap;
    max-height: 140px; overflow-y: auto;
}

.dc-foot {
    margin-top: 8px; display: flex; align-items: center; gap: 8px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 10.5px; color: var(--c-text-3);
}
.dc-more {
    margin-left: auto; border: 0; background: transparent; cursor: pointer;
    color: var(--c-gold); font-size: 10.5px; font-weight: 600;
    font-family: inherit; letter-spacing: 0.04em;
}
.dc-more:hover { text-decoration: underline; }
</style>
