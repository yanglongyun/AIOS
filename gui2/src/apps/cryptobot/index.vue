<script setup>
import { ref } from 'vue';

const tabs = [
  { key: 'overview',  label: '概览' },
  { key: 'positions', label: '持仓' },
  { key: 'orders',    label: '订单' },
  { key: 'agent',     label: '代理' }
];
const active = ref('overview');
const running = ref(true);

const equity = { initial: 10000, current: 10847.32 };
const pnl = ((equity.current - equity.initial) / equity.initial) * 100;

const positions = [
  { sym: 'BTC-USDT-SWAP', side: 'long',  size: 0.05, entry: 67200, mark: 68420, pnl: +61.0,  pnlPct: 1.81 },
  { sym: 'ETH-USDT-SWAP', side: 'short', size: 0.30, entry: 3450,  mark: 3380,  pnl: +21.0,  pnlPct: 2.03 }
];
const decisions = [
  { id: 1, ok: true,  summary: '加仓 BTC 多 0.02 张,价格 67200 进', when: '今天 14:21' },
  { id: 2, ok: true,  summary: '平掉 ETH 短 0.10 张,锁住 +18.5 利润', when: '今天 13:45' },
  { id: 3, ok: false, summary: '想开 SOL 多但 API 超时,跳过', when: '今天 13:12' },
  { id: 4, ok: true,  summary: '观望:大盘横盘,等突破', when: '今天 12:30' }
];

function toggleRun() { running.value = !running.value; }
</script>

<template>
  <div class="page">
    <header class="head">
      <div class="brand">
        <span class="ico">₿</span>
        <h1>炒币机</h1>
        <span class="status" :class="running ? 'on' : 'off'">
          <span class="dot"></span>
          {{ running ? '运行中' : '已停止' }}
        </span>
      </div>
      <button class="pill-btn" :class="{ solid: !running }" @click="toggleRun">
        <span class="msi sm">{{ running ? 'pause' : 'play_arrow' }}</span>
        <span>{{ running ? '暂停' : '启动' }}</span>
      </button>
    </header>

    <section class="equity">
      <div class="eq-l">
        <div class="lbl">账户净值</div>
        <div class="big">${{ equity.current.toFixed(2) }}</div>
        <div class="pnl" :class="pnl >= 0 ? 'pos' : 'neg'">
          {{ pnl >= 0 ? '+' : '' }}{{ pnl.toFixed(2) }}% · 初始 ${{ equity.initial }}
        </div>
      </div>
      <div class="eq-r">
        <svg viewBox="0 0 200 60" class="spark">
          <polyline points="0,40 20,38 40,42 60,30 80,32 100,25 120,28 140,18 160,20 180,12 200,8"
            fill="none" stroke="#34a853" stroke-width="2"/>
          <polyline points="0,40 20,38 40,42 60,30 80,32 100,25 120,28 140,18 160,20 180,12 200,8 200,60 0,60"
            fill="rgba(52,168,83,0.12)" stroke="none"/>
        </svg>
      </div>
    </section>

    <nav class="tabs">
      <button v-for="t in tabs" :key="t.key"
        class="tab" :class="{ active: active === t.key }"
        @click="active = t.key">{{ t.label }}</button>
    </nav>

    <div v-if="active === 'overview'">
      <section class="card-section">
        <header class="ch"><span>最近决策</span><span class="count">{{ decisions.length }}</span></header>
        <div v-for="d in decisions" :key="d.id" class="dec">
          <span class="dot" :class="d.ok ? 'ok' : 'bad'"></span>
          <div class="body">
            <div class="t">{{ d.summary }}</div>
            <div class="m">#{{ d.id }} · {{ d.when }}</div>
          </div>
          <span class="msi sm chev">chevron_right</span>
        </div>
      </section>
    </div>

    <div v-if="active === 'positions'">
      <section class="card-section">
        <header class="ch"><span>持仓</span><span class="count">{{ positions.length }} 个</span></header>
        <div class="pos-table">
          <div class="ph">
            <div>合约</div><div>方向</div><div class="num">仓位</div>
            <div class="num">开仓价</div><div class="num">标记价</div><div class="num">未实现盈亏</div>
          </div>
          <div v-for="p in positions" :key="p.sym" class="pr">
            <div class="mono">{{ p.sym }}</div>
            <div><span class="side" :class="p.side">{{ p.side === 'long' ? '多' : '空' }}</span></div>
            <div class="num mono">{{ p.size }}</div>
            <div class="num mono dim">{{ p.entry }}</div>
            <div class="num mono">{{ p.mark }}</div>
            <div class="num mono" :class="p.pnl >= 0 ? 'pos' : 'neg'">
              {{ p.pnl >= 0 ? '+' : '' }}${{ p.pnl.toFixed(1) }} · {{ p.pnlPct.toFixed(2) }}%
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="active === 'orders'">
      <div class="empty">暂无未结订单</div>
    </div>

    <div v-if="active === 'agent'">
      <section class="card-section">
        <header class="ch"><span>策略目标</span></header>
        <div class="agent-form">
          <textarea class="text-input" rows="3" placeholder="例:24h 内净值波动控制在 ±2%"
            >24h 内净值波动控制在 ±2%,杠杆不超过 3x,优先做主流币的趋势跟踪。</textarea>
          <div class="row">
            <label>采样间隔(秒)</label>
            <input class="text-input" type="number" value="300" style="width:100px" />
          </div>
          <button class="pill-btn solid">保存目标</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 16px 24px 80px; max-width: 1080px; margin: 0 auto; width: 100%; }
.head { display: flex; align-items: center; gap: 16px; padding: 8px 0 16px; }
.brand { display: flex; align-items: center; gap: 12px; flex: 1; }
.brand .ico {
  width: 32px; height: 32px;
  background: linear-gradient(135deg,#fcd535,#f0b90b);
  color: #fff; font-weight: 700;
  border-radius: 8px;
  display: grid; place-items: center;
  font-family: 'Roboto', sans-serif;
}
.brand h1 { margin: 0; font-size: 22px; font-weight: 500; }
.status {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.status.on { background: #e6f4ea; color: #1e8e3e; }
.status.off { background: var(--bg-elev); color: var(--text-2); }
.status .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

.equity {
  display: flex; align-items: center; gap: 16px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.eq-l { flex: 1; }
.eq-l .lbl { font-size: 11px; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.06em; }
.eq-l .big { font-size: 30px; font-weight: 500; line-height: 1.1; margin-top: 4px; }
.eq-l .pnl { font-size: 13px; margin-top: 4px; }
.eq-l .pnl.pos { color: var(--good); }
.eq-l .pnl.neg { color: var(--bad); }
.spark { width: 200px; height: 60px; }

.tabs { display: flex; gap: 0; border-bottom: 1px solid var(--line-soft); margin-bottom: 16px; }
.tab {
  padding: 12px 16px;
  border: 0; background: transparent;
  color: var(--text-2);
  font-size: 13.5px; font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color .15s, border-color .15s;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }

.card-section {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}
.ch {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line-soft);
  font-size: 13px; font-weight: 500;
}
.ch .count { font-size: 12px; color: var(--text-2); font-weight: 400; }

.dec {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line-soft);
  cursor: pointer;
}
.dec:hover { background: var(--bg-hover); }
.dec:last-child { border-bottom: 0; }
.dec .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.dec .dot.ok { background: var(--good); }
.dec .dot.bad { background: var(--bad); }
.dec .body { flex: 1; min-width: 0; }
.dec .t { font-size: 13.5px; }
.dec .m { font-size: 11.5px; color: var(--text-2); margin-top: 2px; }
.dec .chev { color: var(--text-3); }

.pos-table { font-size: 12.5px; }
.ph, .pr {
  display: grid;
  grid-template-columns: 1.4fr 60px 70px 90px 90px 1.6fr;
  gap: 12px; padding: 10px 16px;
  align-items: center;
  border-bottom: 1px solid var(--line-soft);
}
.ph { font-size: 11px; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.05em; }
.pr:last-child { border-bottom: 0; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.mono { font-family: 'JetBrains Mono', monospace; }
.dim { color: var(--text-2); }
.pos { color: var(--good); }
.neg { color: var(--bad); }
.side {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}
.side.long { background: #e6f4ea; color: var(--good); }
.side.short { background: #fce8e6; color: var(--bad); }

.empty { padding: 60px 0; text-align: center; color: var(--text-2); }
.agent-form { padding: 16px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.agent-form .row { display: flex; align-items: center; gap: 12px; }

@media (max-width: 720px) {
  .page { padding: 12px 12px 80px; }
  .equity { flex-direction: column; align-items: stretch; }
  .ph, .pr { grid-template-columns: 1.2fr 50px 70px 1fr; }
  .ph > :nth-child(4), .ph > :nth-child(5),
  .pr > :nth-child(4), .pr > :nth-child(5) { display: none; }
}
</style>
