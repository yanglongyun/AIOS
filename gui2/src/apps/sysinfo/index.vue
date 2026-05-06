<script setup>
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue';
import * as api from '@/lib/api.js';

const loading = ref(false);
const errMsg = ref('');
const snap = ref(null);
let timer = null;

async function tick() {
  try {
    loading.value = !snap.value;
    snap.value = await api.get('/apps/sysinfo/snapshot');
    errMsg.value = '';
  } catch (e) {
    errMsg.value = '获取系统状态失败: ' + (e?.body?.error || e.message || e);
  }
  loading.value = false;
}
function start() {
  if (timer) return;
  tick();
  timer = setInterval(tick, 5000);
}
function stop() {
  clearInterval(timer); timer = null;
}

onMounted(start);
onActivated(start);
onDeactivated(stop);
onBeforeUnmount(stop);

function pct(x) { return Math.round((x || 0) * 100); }
function gb(b) { return (b / (1024 ** 3)).toFixed(1) + ' GB'; }
function fmtUptime(s) {
  if (!s) return '';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [d && `${d}天`, h && `${h}小时`, `${m}分`].filter(Boolean).join(' ');
}
</script>

<template>
  <section class="page">
    <div v-if="errMsg" class="err">{{ errMsg }}</div>
    <div v-if="loading && !snap" class="placeholder">读取中...</div>

    <template v-if="snap">
      <header class="page-head">
        <div>
          <div class="h1">{{ snap.sys?.hostname }}</div>
          <div class="sub">{{ snap.sys?.platform }} · {{ snap.sys?.arch }} · 内核 {{ snap.sys?.release }} · Node {{ snap.sys?.nodeVersion }}</div>
        </div>
        <div class="up">运行 {{ fmtUptime(snap.sys?.uptime) }}</div>
      </header>

      <div class="grid">
        <div class="card">
          <div class="ch">CPU</div>
          <div class="big">{{ pct(snap.cpu?.usage) }}<span class="u">%</span></div>
          <div class="bar"><div class="fill" :style="{ width: pct(snap.cpu?.usage) + '%' }"></div></div>
          <div class="row">
            <span>{{ snap.cpu?.cores }} 核</span>
            <span>{{ snap.cpu?.model }}</span>
          </div>
          <div class="row">负载 {{ snap.sys?.loadavg?.map((n) => n.toFixed(2)).join(' / ') }}</div>
        </div>

        <div class="card">
          <div class="ch">内存</div>
          <div class="big">{{ pct(snap.mem?.usage) }}<span class="u">%</span></div>
          <div class="bar"><div class="fill mem" :style="{ width: pct(snap.mem?.usage) + '%' }"></div></div>
          <div class="row">
            <span>已用 {{ gb(snap.mem?.used) }}</span>
            <span>总计 {{ gb(snap.mem?.total) }}</span>
          </div>
        </div>

        <div class="card wide">
          <div class="ch">磁盘</div>
          <div v-for="d in snap.disk" :key="d.mountPoint" class="disk">
            <div class="d-row">
              <span class="mount">{{ d.mountPoint }}</span>
              <span class="cap">{{ pct(d.capacity) }}% · {{ gb(d.used) }} / {{ gb(d.total) }}</span>
            </div>
            <div class="bar sm"><div class="fill disk-fill" :style="{ width: pct(d.capacity) + '%' }"></div></div>
          </div>
        </div>

        <div class="card wide">
          <div class="ch">进程 Top 20 (CPU)</div>
          <div class="proc-table">
            <div class="row head"><span>PID</span><span>CPU%</span><span>内存%</span><span>用户</span><span>命令</span></div>
            <div v-for="p in snap.processes" :key="p.pid" class="row">
              <span class="num">{{ p.pid }}</span>
              <span class="num">{{ p.cpu.toFixed(1) }}</span>
              <span class="num">{{ p.mem.toFixed(1) }}</span>
              <span>{{ p.user }}</span>
              <span class="cmd" :title="p.command">{{ p.command }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.page { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; padding: 20px 24px 32px; background: #f7f9fc; }
.err { padding: 8px 12px; background: #fce8e6; color: var(--bad); border-radius: 8px; font-size: 12.5px; margin-bottom: 16px; }
.placeholder { padding: 60px; text-align: center; color: var(--text-3); }

.page-head { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 18px; }
.page-head .h1 { font-size: 22px; font-weight: 500; letter-spacing: -0.01em; }
.page-head .sub { font-size: 12.5px; color: var(--text-2); margin-top: 2px; }
.page-head .up { margin-left: auto; font-size: 12.5px; color: var(--text-2); }

.grid { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); max-width: 1100px; }
.card { background: #fff; border: 1px solid var(--line-soft); border-radius: 12px; padding: 16px 18px; }
.card.wide { grid-column: 1 / -1; }
.ch { font-size: 11.5px; color: var(--text-3); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
.big { font-size: 32px; font-weight: 500; line-height: 1.1; letter-spacing: -0.02em; }
.big .u { font-size: 18px; color: var(--text-3); margin-left: 2px; }

.bar { background: var(--bg-elev); border-radius: 999px; height: 6px; overflow: hidden; margin: 10px 0; }
.bar.sm { height: 4px; }
.fill { background: var(--accent); height: 100%; border-radius: 999px; transition: width .25s; }
.fill.mem { background: #9334e6; }
.fill.disk-fill { background: var(--warn); }

.row { display: flex; gap: 14px; font-size: 12.5px; color: var(--text-2); margin-top: 4px; }

.disk { margin: 8px 0 12px; }
.d-row { display: flex; align-items: center; gap: 12px; font-size: 12.5px; }
.mount { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; }
.cap { margin-left: auto; color: var(--text-2); }

.proc-table { display: flex; flex-direction: column; gap: 0; }
.proc-table .row { display: grid; grid-template-columns: 70px 70px 70px 90px minmax(0, 1fr); align-items: center; padding: 6px 0; border-bottom: 1px solid var(--line-soft); margin: 0; font-size: 12.5px; }
.proc-table .row.head { color: var(--text-3); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
.proc-table .num { font-variant-numeric: tabular-nums; }
.proc-table .cmd { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
</style>
