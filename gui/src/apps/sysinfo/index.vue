<script setup>
// 系统状态:HTTP 轮询 /apps/sysinfo/snapshot,每 2 秒一次.
// 不走 ws 因为采样本身就是同步快照,polling 简单可控.
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import * as api from '@/utils/api';
const loading = ref(true);
const error = ref('');
const snap = ref(null);
let timer = null;

async function fetchOnce() {
    try {
        const data = await api.get('/apps/sysinfo/snapshot');
        snap.value = data;
        error.value = '';
    } catch (e) {
        error.value = e?.body?.message || e.message || '获取失败';
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchOnce();
    timer = setInterval(fetchOnce, 2000);
});
onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
});

const fmtBytes = (n) => {
    if (n == null) return '';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    let v = n; let i = 0;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
};

const fmtUptime = (sec) => {
    if (sec == null) return '';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d) return `${d}天 ${h}时 ${m}分`;
    if (h) return `${h}时 ${m}分`;
    return `${m}分`;
};

const fmtPct = (x) => `${(x * 100).toFixed(0)}%`;

const cpuPct = computed(() => snap.value?.cpu?.usage ?? 0);
const memPct = computed(() => snap.value?.mem?.usage ?? 0);

const barColor = (pct) => {
    if (pct < 0.5) return 'var(--color-good)';
    if (pct < 0.8) return 'var(--color-accent)';
    return 'var(--color-bad)';
};
</script>

<template>
    <div class="flex h-full min-h-0 flex-col bg-bg text-ink">
        <!-- header -->
        <header class="shrink-0 border-b border-line bg-bg">
            <div class="app-content flex items-center gap-3 px-4 py-3">
                <div class="min-w-0 flex-1">
                    <div class="font-serif font-bold text-[15px] tracking-tight text-ink">系统状态</div>
                    <div class="mt-0.5 truncate text-[11px] text-faint">
                        <template v-if="snap">
                            {{ snap.sys.hostname }} · {{ snap.sys.platform }} {{ snap.sys.arch }} · 运行 {{ fmtUptime(snap.sys.uptime) }}
                        </template>
                        <template v-else>—</template>
                    </div>
                </div>
            </div>
        </header>

        <!-- body -->
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="app-content p-4">
            <div v-if="error" class="mb-4 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-[12px] text-red-300">
                {{ error }}
            </div>

            <div v-if="loading && !snap" class="text-center text-[13px] text-faint py-8">加载中…</div>

            <template v-else-if="snap">
                <!-- 上排 4 个核心卡片 -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <!-- CPU -->
                    <div class="rounded-xl border border-line bg-bg-elev p-3">
                        <div class="text-[11px] text-faint uppercase tracking-wider">CPU</div>
                        <div class="mt-1 flex items-baseline gap-2">
                            <div class="text-[22px] font-serif font-semibold text-ink leading-none">{{ fmtPct(cpuPct) }}</div>
                            <div class="text-[11px] text-faint">{{ snap.cpu.cores }} 核</div>
                        </div>
                        <div class="mt-2 h-1.5 w-full rounded-full bg-bg-hi overflow-hidden">
                            <div class="h-full rounded-full transition-[width]"
                                :style="{ width: (cpuPct * 100) + '%', background: barColor(cpuPct) }"></div>
                        </div>
                        <div class="mt-2 truncate text-[10px] text-faint" :title="snap.cpu.model">{{ snap.cpu.model }}</div>
                    </div>

                    <!-- Memory -->
                    <div class="rounded-xl border border-line bg-bg-elev p-3">
                        <div class="text-[11px] text-faint uppercase tracking-wider">内存</div>
                        <div class="mt-1 flex items-baseline gap-2">
                            <div class="text-[22px] font-serif font-semibold text-ink leading-none">{{ fmtPct(memPct) }}</div>
                            <div class="text-[11px] text-faint">{{ fmtBytes(snap.mem.used) }} / {{ fmtBytes(snap.mem.total) }}</div>
                        </div>
                        <div class="mt-2 h-1.5 w-full rounded-full bg-bg-hi overflow-hidden">
                            <div class="h-full rounded-full transition-[width]"
                                :style="{ width: (memPct * 100) + '%', background: barColor(memPct) }"></div>
                        </div>
                        <div class="mt-2 text-[10px] text-faint">空闲 {{ fmtBytes(snap.mem.free) }}</div>
                    </div>

                    <!-- Load -->
                    <div class="rounded-xl border border-line bg-bg-elev p-3">
                        <div class="text-[11px] text-faint uppercase tracking-wider">负载</div>
                        <div class="mt-1 flex items-baseline gap-2">
                            <div class="text-[22px] font-serif font-semibold text-ink leading-none">{{ snap.sys.loadavg[0].toFixed(2) }}</div>
                            <div class="text-[11px] text-faint">1 分钟</div>
                        </div>
                        <div class="mt-2 text-[11px] text-muted">
                            5m {{ snap.sys.loadavg[1].toFixed(2) }} ·
                            15m {{ snap.sys.loadavg[2].toFixed(2) }}
                        </div>
                    </div>

                    <!-- Uptime / Node -->
                    <div class="rounded-xl border border-line bg-bg-elev p-3">
                        <div class="text-[11px] text-faint uppercase tracking-wider">运行时</div>
                        <div class="mt-1 text-[18px] font-serif font-semibold text-ink leading-tight">
                            {{ fmtUptime(snap.sys.uptime) }}
                        </div>
                        <div class="mt-1.5 text-[11px] text-muted">Node {{ snap.sys.nodeVersion }}</div>
                        <div class="text-[11px] text-faint truncate">{{ snap.sys.release }}</div>
                    </div>
                </div>

                <!-- Disk -->
                <section v-if="snap.disk?.length" class="mb-4 rounded-xl border border-line bg-bg-elev">
                    <header class="flex items-center justify-between border-b border-line px-3 py-2">
                        <div class="text-[12px] font-medium text-ink">磁盘</div>
                        <div class="text-[11px] text-faint">{{ snap.disk.length }} 个挂载点</div>
                    </header>
                    <ul class="divide-y divide-line">
                        <li v-for="d in snap.disk" :key="d.mountPoint" class="px-3 py-2.5">
                            <div class="flex items-center gap-3">
                                <div class="min-w-0 flex-1">
                                    <div class="truncate text-[13px] text-ink">{{ d.mountPoint }}</div>
                                    <div class="truncate text-[11px] text-faint">{{ d.filesystem }}</div>
                                </div>
                                <div class="shrink-0 text-right">
                                    <div class="text-[12px] text-ink">{{ fmtBytes(d.used) }} / {{ fmtBytes(d.total) }}</div>
                                    <div class="text-[11px] text-muted">{{ fmtPct(d.capacity) }}</div>
                                </div>
                            </div>
                            <div class="mt-2 h-1 w-full rounded-full bg-bg-hi overflow-hidden">
                                <div class="h-full rounded-full"
                                    :style="{ width: (d.capacity * 100) + '%', background: barColor(d.capacity) }"></div>
                            </div>
                        </li>
                    </ul>
                </section>

                <!-- Top processes -->
                <section class="rounded-xl border border-line bg-bg-elev overflow-hidden">
                    <header class="flex items-center justify-between border-b border-line px-3 py-2">
                        <div class="text-[12px] font-medium text-ink">进程 · 按 CPU 排</div>
                        <div class="text-[11px] text-faint">前 {{ snap.processes.length }}</div>
                    </header>
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[520px] text-[12px]">
                            <thead class="text-[10px] uppercase tracking-wider text-faint">
                                <tr>
                                    <th class="px-3 py-1.5 text-left font-normal w-16">PID</th>
                                    <th class="px-3 py-1.5 text-left font-normal w-24">用户</th>
                                    <th class="px-3 py-1.5 text-right font-normal w-14">CPU</th>
                                    <th class="px-3 py-1.5 text-right font-normal w-14">MEM</th>
                                    <th class="px-3 py-1.5 text-left font-normal">命令</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="p in snap.processes" :key="p.pid"
                                    class="border-t border-line">
                                    <td class="px-3 py-1.5 font-mono text-faint">{{ p.pid }}</td>
                                    <td class="px-3 py-1.5 text-muted truncate">{{ p.user }}</td>
                                    <td class="px-3 py-1.5 text-right tabular-nums"
                                        :class="p.cpu > 50 ? 'text-bad' : p.cpu > 20 ? 'text-accent' : 'text-ink'">
                                        {{ p.cpu.toFixed(1) }}
                                    </td>
                                    <td class="px-3 py-1.5 text-right tabular-nums text-muted">{{ p.mem.toFixed(1) }}</td>
                                    <td class="px-3 py-1.5 text-ink truncate">{{ p.command }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </template>
          </div>
        </div>
    </div>
</template>
