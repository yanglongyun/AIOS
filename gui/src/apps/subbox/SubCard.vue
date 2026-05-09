<script setup>
import { computed, ref, watch } from 'vue';
import { fmtClock, fmtRelDay, todayStr } from './utils.js';

const props = defineProps({
    config: { type: Object, default: null },
    now: { type: Date, required: true }
});

const emit = defineEmits(['save', 'toggle-enabled', 'run-now', 'invalid']);

// ── 卡片模式: 阅读 / 编辑 ────────────
const mode = ref('view');
const draft = ref({ topic: '', schedule_time: '08:00', enabled: true });

function startEdit() {
    draft.value = props.config
        ? {
            topic: props.config.topic || '',
            schedule_time: props.config.schedule_time || '08:00',
            enabled: !!props.config.enabled
        }
        : { topic: '', schedule_time: '08:00', enabled: true };
    mode.value = 'edit';
}
function cancelEdit() { mode.value = 'view'; }
function doSave() {
    if (!draft.value.topic.trim()) {
        emit('invalid', '请填写订阅主题');
        return;
    }
    emit('save', { ...draft.value });
}

// ── 派生 ─────────────────────────────
const hasTopic = computed(() => !!(props.config && props.config.topic));
const isEnabled = computed(() => !!(props.config && props.config.enabled));
const isRunning = computed(() => !!(props.config && props.config.running));

const phase = computed(() => {
    if (!props.config || !props.config.topic) return 'empty';
    if (props.config.running) return 'running';
    if (!props.config.enabled) return 'paused';
    if (props.config.last_run_date === todayStr(props.now)) {
        return props.config.last_status === 'error' ? 'failed' : 'delivered';
    }
    return 'idle';
});

const PHASE_META = {
    empty:     { text: '尚未订阅',    icon: 'mark_email_unread' },
    delivered: { text: '今日已送达',  icon: 'mark_email_read' },
    running:   { text: '正在派送…',   icon: 'autorenew' },
    failed:    { text: '今日派送失败', icon: 'error' },
    paused:    { text: '已暂停',      icon: 'pause_circle' },
    idle:      { text: '等待下次派送', icon: 'schedule' }
};
const phaseMeta = computed(() => PHASE_META[phase.value]);

const countdownText = computed(() => {
    if (!hasTopic.value || !isEnabled.value) return '';
    const cfg = props.config;
    const today = todayStr(props.now);
    const [hh, mm] = String(cfg.schedule_time || '08:00').split(':').map((n) => parseInt(n, 10));
    const targetMin = (hh || 0) * 60 + (mm || 0);
    const nowMin = props.now.getHours() * 60 + props.now.getMinutes();
    let delta;
    let when;
    if (cfg.last_run_date !== today && targetMin >= nowMin) {
        delta = targetMin - nowMin; when = '今天';
    } else {
        delta = (24 * 60 - nowMin) + targetMin; when = '明天';
    }
    if (delta <= 0) return '即将送达';
    const h = Math.floor(delta / 60);
    const m = delta % 60;
    if (h === 0) return `${m} 分钟后送达`;
    if (h < 24) return `${h} 小时 ${m} 分钟后送达`;
    return `${when} ${cfg.schedule_time} 送达`;
});

// 暴露给外部:让父级在保存成功后重置 mode
defineExpose({ exitEditMode: () => { mode.value = 'view'; } });
</script>

<template>
    <article
        class="mx-auto mb-6 max-w-[880px] overflow-hidden rounded-2xl border bg-bg transition-[border-color,box-shadow] hover:shadow-[var(--shadow-1)]"
        :class="{
            'border-line': !['delivered','failed','running'].includes(phase),
            'border-[rgba(30,142,62,0.35)]': phase === 'delivered',
            'border-[rgba(217,48,37,0.35)]': phase === 'failed',
            'border-accent': phase === 'running'
        }">

        <!-- ─── 阅读态 ─── -->
        <template v-if="mode === 'view'">

            <!-- 空态 -->
            <div v-if="!hasTopic" class="px-7 py-12 text-center text-muted">
                <span class="msi text-accent opacity-55" style="font-size:56px">add_alert</span>
                <h3 class="m-0 mb-1 mt-3 text-lg font-medium text-ink">还没有订阅</h3>
                <p class="mx-auto mb-5 mt-0 max-w-[420px] text-[13.5px] leading-[1.55]">
                    设置一个订阅主题和每日时间,AI 就会每天到点送你一份早报。
                </p>
                <button class="m3-filled" @click="startEdit">
                    <span class="msi xxs">edit</span>设置我的订阅
                </button>
            </div>

            <!-- 已订阅 -->
            <template v-else>
                <header class="flex items-center justify-between border-b border-dashed border-line-soft px-6 py-4 max-md:px-4">
                    <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
                          :class="{
                              'bg-bg-elev text-muted': ['empty','idle','paused'].includes(phase),
                              'bg-[#e6f4ea] text-[#137333]': phase === 'delivered',
                              'bg-[#fce8e6] text-bad': phase === 'failed',
                              'bg-blue-soft text-blue-fg': phase === 'running'
                          }">
                        <span class="msi xxs" :class="{ 'animate-spin': phase === 'running' }">{{ phaseMeta.icon }}</span>
                        <span>{{ phaseMeta.text }}</span>
                    </span>
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-soft px-3 py-1 font-mono text-[12.5px] font-medium text-blue-fg">
                        <span class="msi xxs">schedule</span>
                        <span>每日 {{ config.schedule_time }}</span>
                    </span>
                </header>

                <div class="px-6 pt-5 pb-3 max-md:px-[18px] max-md:pt-4 max-md:pb-2">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">订阅主题</div>
                    <p class="m-0 mt-2 whitespace-pre-wrap break-words text-[17px] leading-[1.55] tracking-[-0.005em] text-ink max-md:text-[15px]">
                        {{ config.topic }}
                    </p>
                </div>

                <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft bg-[#fafbfd] px-5 py-3.5 pl-6 max-md:px-[18px]">
                    <div class="flex min-w-0 flex-wrap items-center gap-3.5">
                        <span v-if="countdownText" class="inline-flex items-center gap-1 text-[12.5px] font-medium text-blue-fg">
                            <span class="msi xxs">notifications_active</span>{{ countdownText }}
                        </span>
                        <span v-if="config.last_run_at" class="font-mono text-[12px] text-faint">
                            上次送达 {{ fmtRelDay(config.last_run_at) }} {{ fmtClock(config.last_run_at) }}
                        </span>
                    </div>
                    <div class="flex gap-0.5">
                        <button class="icon-btn"
                                :class="{ active: isEnabled }"
                                :title="isEnabled ? '暂停' : '开启'"
                                @click="$emit('toggle-enabled')">
                            <span class="msi sm">{{ isEnabled ? 'pause' : 'play_arrow' }}</span>
                        </button>
                        <button class="icon-btn"
                                title="立即派送一份"
                                :disabled="isRunning"
                                @click="$emit('run-now')">
                            <span class="msi sm" :class="{ 'animate-spin': isRunning }">
                                {{ isRunning ? 'autorenew' : 'send' }}
                            </span>
                        </button>
                        <button class="icon-btn" title="编辑" @click="startEdit">
                            <span class="msi sm">edit</span>
                        </button>
                    </div>
                </footer>
            </template>
        </template>

        <!-- ─── 编辑态 ─── -->
        <template v-else>
            <header class="flex items-center gap-3 px-6 pb-1.5 pt-[22px] max-md:px-[18px] max-md:pt-[18px]">
                <span class="msi text-accent" style="font-size:26px">{{ hasTopic ? 'edit_note' : 'add_circle' }}</span>
                <h3 class="m-0 text-[19px] font-medium tracking-[-0.01em] text-ink">{{ hasTopic ? '编辑订阅' : '设置订阅' }}</h3>
            </header>

            <div class="flex flex-col gap-4 px-6 pb-1 pt-3 max-md:px-[18px] max-md:pt-2.5">
                <label class="flex min-w-0 flex-col gap-1.5">
                    <span class="text-[12px] font-medium tracking-[0.02em] text-muted">
                        订阅主题 <em class="not-italic text-bad">*</em>
                    </span>
                    <textarea v-model="draft.topic" class="text-input" rows="3"
                              placeholder="例如:今天全球 AI 行业的重大进展和重要新闻;或:A 股大盘 + AAPL/TSLA 走势 + 美股盘前要闻"></textarea>
                    <span class="mt-0.5 text-[11.5px] text-faint">越具体效果越好,AI 会用 curl/搜索工具拉真实数据。</span>
                </label>
                <div class="flex items-end gap-4 max-md:flex-col max-md:items-stretch max-md:gap-3">
                    <label class="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span class="text-[12px] font-medium tracking-[0.02em] text-muted">每日派送时间</span>
                        <input v-model="draft.schedule_time" class="text-input" type="time" step="60" />
                    </label>
                    <label class="flex flex-none flex-col gap-1.5">
                        <span class="text-[12px] font-medium tracking-[0.02em] text-muted">启用</span>
                        <span class="m3-switch" :class="{ on: draft.enabled }"
                              @click.prevent="draft.enabled = !draft.enabled">
                            <span class="m3-thumb"></span>
                        </span>
                    </label>
                </div>
            </div>

            <footer class="flex justify-end gap-2 px-[22px] pb-[22px] pt-4 max-md:px-4 max-md:pb-[18px]">
                <button class="m3-text" @click="cancelEdit">取消</button>
                <button class="m3-filled" @click="doSave">
                    <span class="msi xxs">save</span>保存
                </button>
            </footer>
        </template>
    </article>
</template>

<style scoped>
/* M3 风格按钮 — 全 app 复用,样式细节较多,保留 */
.m3-filled {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    background: var(--accent);
    color: #fff;
    border: 0;
    border-radius: 999px;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background .15s, box-shadow .15s;
}
.m3-filled:hover { background: var(--accent-hi); box-shadow: var(--shadow-1); }

.m3-text {
    padding: 10px 22px;
    background: transparent;
    border: 0;
    color: var(--accent-fg);
    border-radius: 999px;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
}
.m3-text:hover { background: var(--accent-soft); }

/* M3 switch — 自定义滑动开关 */
.m3-switch {
    display: inline-block;
    position: relative;
    width: 52px; height: 32px;
    background: var(--bg-elev);
    border: 2px solid var(--line);
    border-radius: 999px;
    cursor: pointer;
    transition: background .18s, border-color .18s;
}
.m3-switch.on { background: var(--accent); border-color: var(--accent); }
.m3-thumb {
    position: absolute;
    left: 4px; top: 50%;
    transform: translateY(-50%);
    width: 16px; height: 16px;
    background: var(--text-2);
    border-radius: 50%;
    transition: left .18s, background .18s, width .18s, height .18s;
}
.m3-switch.on .m3-thumb { left: 26px; width: 20px; height: 20px; background: #fff; }

/* 输入框 focus 蓝色光晕 — 全局 .text-input 没有,本地补 */
.text-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
}
textarea.text-input { resize: vertical; line-height: 1.55; }
</style>
