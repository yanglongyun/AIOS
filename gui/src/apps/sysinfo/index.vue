<script setup>
// sysinfo 应用根 — 协调器
// ─────────────────────
// utils.js     格式化(pct/gb/fmtUptime/ringOffset/loadColor)
// Topbar       顶栏
// HeaderCard   主机信息卡
// RingCard     CPU/内存 环卡(reusable,通过 slot 注入 kv 列表)
// DiskCard     磁盘
// ProcessCard  进程

import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue';
import * as api from '@/utils/api.js';
import { gb, loadColor, pct } from './utils.js';

import Topbar from './Topbar.vue';
import HeaderCard from './HeaderCard.vue';
import RingCard from './RingCard.vue';
import DiskCard from './DiskCard.vue';
import ProcessCard from './ProcessCard.vue';

// ── 主状态 ──────────────────────────
const loading = ref(false);
const errMsg = ref('');
const snap = ref(null);
const lastAt = ref(0);

// ── 拉数据 ──────────────────────────
let timer = null;
async function tick() {
    try {
        loading.value = !snap.value;
        snap.value = await api.get('/apps/sysinfo/snapshot');
        lastAt.value = Date.now();
        errMsg.value = '';
    } catch (e) {
        errMsg.value = '获取系统状态失败: ' + (e?.body?.error || e.message || e);
    }
    loading.value = false;
}
function start() { if (timer) return; tick(); timer = setInterval(tick, 5000); }
function stop()  { clearInterval(timer); timer = null; }

onMounted(start);
onActivated(start);
onDeactivated(stop);
onBeforeUnmount(stop);

// ── "更新于 Xs 前" ────────────────────
const sinceText = ref('');
let sinceTimer = null;
onMounted(() => {
    sinceTimer = setInterval(() => {
        if (!lastAt.value) { sinceText.value = ''; return; }
        const s = Math.max(0, Math.round((Date.now() - lastAt.value) / 1000));
        sinceText.value = s < 2 ? '刚刚' : `${s}s 前`;
    }, 500);
});
onBeforeUnmount(() => clearInterval(sinceTimer));

// ── 派生 ────────────────────────────
const cpuUsage = computed(() => snap.value?.cpu?.usage || 0);
const memUsage = computed(() => snap.value?.mem?.usage || 0);
</script>

<template>
    <div class="app-frame">
        <Topbar />

        <section class="flex-1 min-w-0 min-h-0 overflow-y-auto bg-[#f7f9fc] px-8 pb-15 pt-6 max-md:px-3.5 max-md:pb-10 max-md:pt-4">
            <div v-if="errMsg"
                 class="mx-auto mb-3.5 max-w-[1100px] rounded-[10px] bg-[#fce8e6] px-3.5 py-2.5 text-[13px] text-bad">
                {{ errMsg }}
            </div>
            <div v-if="loading && !snap" class="py-15 text-center text-faint">加载中...</div>

            <template v-if="snap">
                <HeaderCard :sys="snap.sys" :since-text="sinceText" />

                <!-- CPU / 内存 环 -->
                <div class="mx-auto mb-3.5 grid max-w-[1100px] grid-cols-2 gap-3 max-md:grid-cols-1">
                    <RingCard :usage="cpuUsage" label="CPU" color="var(--accent)">
                        <div class="kv"><span>核心</span><span>{{ snap.cpu?.cores }} 核</span></div>
                        <div class="kv">
                            <span>负载 1m / 5m / 15m</span>
                            <span :class="{
                                'text-good': loadColor(snap.sys?.loadavg?.[0] || 0, snap.cpu?.cores || 1) === 'good',
                                'text-warn': loadColor(snap.sys?.loadavg?.[0] || 0, snap.cpu?.cores || 1) === 'warn',
                                'text-bad':  loadColor(snap.sys?.loadavg?.[0] || 0, snap.cpu?.cores || 1) === 'bad'
                            }">
                                {{ snap.sys?.loadavg?.map((n) => n.toFixed(2)).join(' / ') }}
                            </span>
                        </div>
                        <div class="kv kv-model" :title="snap.cpu?.model">
                            <span>型号</span><span>{{ snap.cpu?.model }}</span>
                        </div>
                    </RingCard>

                    <RingCard :usage="memUsage" label="内存" color="#9334e6">
                        <div class="kv"><span>已用</span><span>{{ gb(snap.mem?.used) }}</span></div>
                        <div class="kv"><span>空闲</span><span>{{ gb(snap.mem?.free) }}</span></div>
                        <div class="kv"><span>总计</span><span>{{ gb(snap.mem?.total) }}</span></div>
                    </RingCard>
                </div>

                <DiskCard :disks="snap.disk || []" />
                <ProcessCard :processes="snap.processes || []" />
            </template>
        </section>
    </div>
</template>

<!-- 跨子组件复用类:卡片底盒 + kv 行 -->
<style>
.si-card {
    background: #fff;
    border-radius: 16px;
    padding: 22px 24px;
    margin: 0 auto 14px;
    max-width: 1100px;
    box-shadow:
        0 1px 2px rgba(60, 64, 67, 0.06),
        0 4px 12px rgba(60, 64, 67, 0.04);
}
.si-card .kv {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line-soft);
    font-size: 12.5px;
}
.si-card .kv:last-child { border-bottom: 0; }
.si-card .kv > span:first-child { color: var(--text-2); }
.si-card .kv > span:last-child {
    color: var(--text);
    font-variant-numeric: tabular-nums;
    text-align: right;
}
.si-card .kv-model > span:last-child {
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}
</style>
