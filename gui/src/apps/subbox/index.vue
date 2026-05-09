<script setup>
// subbox 应用根 — 协调器
// ─────────────────────────────────────
// api.js     ← 请求层
// utils.js   ← 时间/文本格式化
// Topbar     ← 顶栏
// Masthead   ← 报刊头
// SubCard    ← 订阅配置卡 (view + edit)
// Reports    ← 早报时间线

import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue';
import * as sb from './api.js';

import Topbar from './Topbar.vue';
import Masthead from './Masthead.vue';
import SubCard from './SubCard.vue';
import Reports from './Reports.vue';

// ── 主状态 ──────────────────────────
const config = ref(null);
const reports = ref([]);
const errMsg = ref('');

const subCardRef = ref(null);
const hasTopic = computed(() => !!(config.value && config.value.topic));

// ── 时间 tick(分钟级别就够了) ─────
const now = ref(new Date());
let nowTicker = null;

// ── notice flash ────────────────────
const notice = ref({ kind: '', text: '' });
let noticeTimer = null;
function flash(kind, text, ms = 2200) {
    notice.value = { kind, text };
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.value = { kind: '', text: '' }; }, ms);
}

// ── 加载 ────────────────────────────
async function loadConfig() {
    try {
        const r = await sb.getConfig();
        config.value = r?.config || null;
    } catch (e) {
        errMsg.value = '获取订阅失败: ' + (e?.body?.message || e.message || e);
    }
}
async function loadReports() {
    try {
        const r = await sb.getReports(100);
        reports.value = r?.items || [];
    } catch {
        reports.value = [];
    }
}
async function loadAll() {
    await Promise.all([loadConfig(), loadReports()]);
}

// ── 操作 ────────────────────────────
async function handleSave(draft) {
    try {
        const r = await sb.saveConfig(draft);
        config.value = r?.config || null;
        subCardRef.value?.exitEditMode();
        flash('ok', '已保存');
    } catch (e) {
        flash('err', '保存失败: ' + (e?.body?.message || e.message));
    }
}
async function handleToggleEnabled() {
    if (!config.value || !config.value.topic) return;
    try {
        const r = await sb.saveConfig({ enabled: !config.value.enabled });
        config.value = r?.config || null;
        flash('ok', config.value.enabled ? '已开启每日派送' : '已暂停');
    } catch (e) {
        flash('err', '切换失败: ' + (e?.body?.message || e.message));
    }
}
async function handleRunNow() {
    try {
        await sb.runNow();
        flash('ok', '已开始派送,稍候刷新');
        await loadConfig();
        setTimeout(loadAll, 6000);
    } catch (e) {
        flash('err', '派送失败: ' + (e?.body?.message || e.message));
    }
}
async function handleClear() {
    if (!reports.value.length) return;
    if (!confirm(`清空全部 ${reports.value.length} 份历史早报?此操作不可撤销。`)) return;
    try {
        await sb.clearReports();
        await loadReports();
        flash('ok', '已清空');
    } catch (e) {
        flash('err', '清空失败: ' + (e?.body?.message || e.message));
    }
}

// ── 轮询 ────────────────────────────
let pollTimer = null;
function startPoll() {
    if (pollTimer) return;
    pollTimer = setInterval(loadAll, 15000);
}
function stopPoll() {
    clearInterval(pollTimer);
    pollTimer = null;
}

onMounted(() => {
    loadAll();
    startPoll();
    nowTicker = setInterval(() => { now.value = new Date(); }, 30 * 1000);
});
onActivated(() => { loadAll(); startPoll(); });
onDeactivated(stopPoll);
onBeforeUnmount(() => {
    stopPoll();
    clearInterval(nowTicker);
});
</script>

<template>
    <div class="app-frame bg-bg">
        <Topbar />

        <!-- 通知 + 错误条 -->
        <transition name="fade">
            <div v-if="notice.text"
                 class="mx-6 mt-2 rounded-lg px-3.5 py-2.5 text-[13px]"
                 :class="notice.kind === 'ok' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fce8e6] text-bad'">
                {{ notice.text }}
            </div>
        </transition>
        <div v-if="errMsg" class="mx-6 mt-2 rounded-lg bg-[#fce8e6] px-3.5 py-2.5 text-[13px] text-bad">
            {{ errMsg }}
        </div>

        <section class="flex-1 min-h-0 overflow-y-auto bg-[#f7f9fc] px-8 pb-15 pt-6 max-md:px-3.5 max-md:pb-10 max-md:pt-4">
            <Masthead :now="now" />

            <SubCard
                ref="subCardRef"
                :config="config"
                :now="now"
                @save="handleSave"
                @toggle-enabled="handleToggleEnabled"
                @run-now="handleRunNow"
                @invalid="(msg) => flash('err', msg)" />

            <Reports
                v-if="hasTopic"
                :reports="reports"
                :now="now"
                @clear="handleClear"
                @refresh="loadAll" />
        </section>
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .18s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
