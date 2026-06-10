<template>
  <div class="lg-app" :data-theme="themeName">
    <header class="lg-head">
      <div>
        <div class="greet">{{ greeting }} · 本月 {{ entries.length }} 笔</div>
        <h1 class="serif">账本</h1>
      </div>
      <button class="icon" title="导出 CSV" @click="exportCsv">⇩</button>
    </header>

    <div class="month">
      <button @click="shiftMonth(-1)">‹</button>
      <b class="mono">{{ monthLabel }}</b>
      <button @click="shiftMonth(1)">›</button>
      <button class="today" @click="goThisMonth">回本月</button>
    </div>

    <main class="scroll">
      <section class="hero">
        <small>月结余 · BALANCE</small>
        <div class="bal mono" :class="{ neg: summary.balance < 0 }">¥ {{ money(summary.balance) }}</div>
        <div class="io"><span class="in">↘ 收入 <b>¥{{ money(summary.income) }}</b></span><span class="out">↗ 支出 <b>¥{{ money(summary.expense) }}</b></span></div>
        <div class="budget" :class="budgetState" @click="editBudget">
          <div><span>{{ summary.expense > budget ? `月预算 · 已超支 ¥${money(summary.expense - budget)}` : '月预算' }}</span><b class="mono">¥{{ money(summary.expense) }} / ¥{{ money(budget) }}</b></div>
          <i><em :style="{ width: `${budgetPct * 100}%` }"></em></i>
        </div>
      </section>

      <section class="card">
        <h2>支出去向 <button v-if="activeCat" @click="activeCat = ''">清除筛选</button></h2>
        <div v-if="categoryRows.length" class="donut-wrap">
          <svg class="donut" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="rgba(120,90,40,.12)" stroke-width="7"></circle>
            <circle
              v-for="seg in donutSegments"
              :key="seg.name"
              cx="21" cy="21" r="15.9" fill="none" stroke-width="7"
              :stroke="seg.color"
              :stroke-dasharray="`${seg.value} ${100 - seg.value}`"
              :stroke-dashoffset="seg.offset"
              :class="{ dim: activeCat && activeCat !== seg.name }"
            ></circle>
          </svg>
          <div class="center"><b class="mono">¥{{ money(summary.expense) }}</b><span>本月支出</span></div>
          <div class="legend">
            <button v-for="row in categoryRows.slice(0, 5)" :key="row.name" :class="{ dim: activeCat && activeCat !== row.name }" @click="activeCat = activeCat === row.name ? '' : row.name">
              <i :style="{ background: row.color }"></i><span>{{ row.emoji }} {{ row.name }}</span><b class="mono">¥{{ money(row.amount) }}</b><em>{{ Math.round(row.amount / summary.expense * 100) }}%</em>
            </button>
          </div>
        </div>
        <div v-else class="empty small">这个月还没有支出记录</div>
      </section>

      <section class="card">
        <h2>近 14 天支出</h2>
        <div class="trend">
          <div v-for="(day, index) in trendDays" :key="day.date" :title="`${day.date} · ¥${money(day.amount)}`">
            <i :class="{ zero: !day.amount }" :style="{ height: `${Math.max(4, day.amount / maxTrend * 100)}%` }"></i>
            <span v-if="index % 2" class="mono">{{ Number(day.date.slice(-2)) }}</span><span v-else></span>
          </div>
        </div>
      </section>

      <section class="entries">
        <template v-if="groupedEntries.length">
          <div v-for="group in groupedEntries" :key="group.date">
            <h3>{{ dayLabel(group.date) }}<span>{{ daySum(group.items) }}</span></h3>
            <button v-for="(entry, index) in group.items" :key="entry.id" class="entry" :style="{ animationDelay: `${index * 30}ms` }" @click="openSheet(entry)">
              <i :style="{ background: cat(entry.category).color + '22' }">{{ cat(entry.category).emoji }}</i>
              <span><b>{{ entry.category }}</b><small>{{ entry.note || '无备注' }}</small></span>
              <strong class="mono" :class="entry.type">{{ entry.type === 'income' ? '+' : '-' }}¥{{ money(entry.amount) }}</strong>
            </button>
          </div>
        </template>
        <div v-else class="empty"><b>{{ activeCat ? '这个分类没有记录' : '这个月还没有账目' }}</b><p>试试下面一句话记账</p></div>
      </section>
    </main>

    <footer class="dock">
      <input v-model="nlInput" placeholder="昨天打车 26" @keydown.enter="parseInput" />
      <button class="manual" @click="openSheet()">手动</button>
      <button class="go" @click="parseInput">AI</button>
    </footer>

    <div class="mask" :class="{ show: sheetOpen }" @click="closeSheet"></div>
    <aside class="sheet" :class="{ show: sheetOpen }">
      <div class="grip"></div>
      <header><b>{{ editingId ? '编辑账目' : '记一笔' }}</b><span v-if="fromAi">AI 识别</span><button @click="closeSheet">×</button></header>
      <div class="form">
        <div class="seg"><button :class="{ on: form.type === 'expense' }" @click="form.type = 'expense'; normalizeCategory()">支出</button><button :class="{ on: form.type === 'income' }" @click="form.type = 'income'; normalizeCategory()">收入</button></div>
        <label class="amount"><span class="mono">¥</span><input v-model.number="form.amount" class="mono" type="number" inputmode="decimal" placeholder="0.00" /></label>
        <div class="label">分类</div>
        <div class="cat-grid">
          <button v-for="c in availableCategories" :key="c.name" :class="{ on: form.category === c.name }" @click="form.category = c.name"><span>{{ c.emoji }}</span>{{ c.name }}</button>
        </div>
        <div class="row"><input v-model="form.note" placeholder="备注(选填)" /><input v-model="form.occurredOn" type="date" /></div>
      </div>
      <footer><button v-if="editingId" class="danger" @click="deleteCurrent">删除</button><button class="primary" @click="saveEntry">确认记账</button></footer>
    </aside>
    <div class="toast" :class="{ show: toastText }">{{ toastText }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useThemeStore } from '../../stores/theme.js';

const theme = useThemeStore();
const themeName = computed(() => theme.resolved === 'dark' ? 'dark' : 'light');
const entries = ref([]);
const categories = ref([]);
const budget = ref(3000);
const curMonth = ref(new Date().toISOString().slice(0, 7));
const activeCat = ref('');
const nlInput = ref('');
const sheetOpen = ref(false);
const fromAi = ref(false);
const editingId = ref(null);
const toastText = ref('');
const form = reactive({ type: 'expense', amount: '', category: '餐饮', note: '', occurredOn: new Date().toISOString().slice(0, 10) });
let toastTimer = null;

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};
const load = async () => {
  const [meta, data] = await Promise.all([
    request('/apps/ledger/meta'),
    request(`/apps/ledger/entries?month=${curMonth.value}`),
  ]);
  categories.value = meta.categories || [];
  budget.value = Number(meta.budget || 3000);
  entries.value = data.entries || [];
};
const summary = computed(() => {
  const income = entries.value.filter((x) => x.type === 'income').reduce((s, x) => s + Number(x.amount), 0);
  const expense = entries.value.filter((x) => x.type === 'expense').reduce((s, x) => s + Number(x.amount), 0);
  return { income, expense, balance: income - expense };
});
const greeting = computed(() => new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好');
const monthLabel = computed(() => {
  const [y, m] = curMonth.value.split('-');
  return `${y}年${Number(m)}月`;
});
const budgetPct = computed(() => Math.min(1, budget.value ? summary.value.expense / budget.value : 0));
const budgetState = computed(() => summary.value.expense > budget.value ? 'over' : budgetPct.value >= 0.8 ? 'warn' : '');
const filteredEntries = computed(() => activeCat.value ? entries.value.filter((x) => x.category === activeCat.value) : entries.value);
const groupedEntries = computed(() => {
  const map = new Map();
  for (const entry of filteredEntries.value) {
    const day = entry.occurredOn || entry.occurred_on;
    if (!map.has(day)) map.set(day, []);
    map.get(day).push(entry);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => ({ date, items }));
});
const categoryRows = computed(() => {
  const totals = {};
  for (const entry of entries.value.filter((x) => x.type === 'expense')) totals[entry.category] = (totals[entry.category] || 0) + Number(entry.amount);
  return Object.entries(totals).map(([name, amount]) => ({ ...cat(name), name, amount })).sort((a, b) => b.amount - a.amount);
});
const donutSegments = computed(() => {
  let acc = 25;
  return categoryRows.value.map((row) => {
    const value = summary.value.expense ? row.amount / summary.value.expense * 100 : 0;
    const seg = { ...row, value, offset: -acc };
    acc += value;
    return seg;
  });
});
const trendDays = computed(() => Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const date = d.toISOString().slice(0, 10);
  const amount = entries.value.filter((x) => x.type === 'expense' && (x.occurredOn || x.occurred_on) === date).reduce((s, x) => s + Number(x.amount), 0);
  return { date, amount };
}));
const maxTrend = computed(() => Math.max(1, ...trendDays.value.map((x) => x.amount)));
const availableCategories = computed(() => form.type === 'income' ? categories.value.filter((x) => x.name === '工资' || x.name === '其他') : categories.value);

const cat = (name) => categories.value.find((x) => x.name === name) || { name: '其他', emoji: '✨', color: '#b89545' };
const money = (n) => Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const showToast = (text) => { toastText.value = text; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastText.value = ''; }, 1800); };
const shiftMonth = async (n) => {
  const [y, m] = curMonth.value.split('-').map(Number);
  curMonth.value = new Date(y, m - 1 + n, 1).toISOString().slice(0, 7);
  await load();
};
const goThisMonth = async () => { curMonth.value = new Date().toISOString().slice(0, 7); await load(); };
const dayLabel = (date) => {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(date);
  const diff = Math.round((new Date(today) - d) / 86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' });
};
const daySum = (items) => {
  const out = items.filter((x) => x.type === 'expense').reduce((s, x) => s + Number(x.amount), 0);
  const inc = items.filter((x) => x.type === 'income').reduce((s, x) => s + Number(x.amount), 0);
  return [out ? `支出 ¥${money(out)}` : '', inc ? `收入 ¥${money(inc)}` : ''].filter(Boolean).join(' · ');
};
const editBudget = async () => {
  const value = prompt('设置月预算(元)', String(budget.value));
  if (!value) return;
  await request('/apps/ledger/budget', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(value) }) });
  await load();
};
const normalizeCategory = () => {
  if (!availableCategories.value.some((x) => x.name === form.category)) form.category = availableCategories.value[0]?.name || '其他';
};
const openSheet = (entry = null, ai = false) => {
  fromAi.value = ai;
  editingId.value = entry?.id || null;
  Object.assign(form, {
    type: entry?.type || 'expense',
    amount: entry?.amount || '',
    category: entry?.category || '餐饮',
    note: entry?.note || '',
    occurredOn: entry?.occurredOn || entry?.occurred_on || new Date().toISOString().slice(0, 10),
  });
  normalizeCategory();
  sheetOpen.value = true;
};
const closeSheet = () => { sheetOpen.value = false; };
const parseInput = async () => {
  const text = nlInput.value.trim();
  if (!text) return showToast('先说一句,比如:午餐面馆 38');
  try {
    const data = await request('/apps/ledger/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    openSheet(data.entry, true);
  } catch (err) {
    showToast(err.message || '没识别出来');
  }
};
const saveEntry = async () => {
  if (!Number(form.amount)) return showToast('金额要大于 0');
  const body = { ...form, amount: Number(form.amount) };
  const url = editingId.value ? `/apps/ledger/entries?id=${editingId.value}&month=${curMonth.value}` : `/apps/ledger/entries?month=${curMonth.value}`;
  await request(url, { method: editingId.value ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  nlInput.value = '';
  closeSheet();
  await load();
  showToast(editingId.value ? '已保存修改' : '已记一笔');
};
const deleteCurrent = async () => {
  if (!editingId.value) return;
  await request(`/apps/ledger/entries?id=${editingId.value}&month=${curMonth.value}`, { method: 'DELETE' });
  closeSheet();
  await load();
  showToast('已删除');
};
const exportCsv = () => {
  if (!entries.value.length) return showToast('本月没有数据');
  const head = '日期,类型,分类,金额,备注\n';
  const body = entries.value.map((x) => [x.occurredOn || x.occurred_on, x.type === 'income' ? '收入' : '支出', x.category, x.amount, `"${String(x.note || '').replace(/"/g, '""')}"`].join(',')).join('\n');
  const blob = new Blob(['\ufeff' + head + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `账本-${curMonth.value}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};
onMounted(load);
</script>

<style scoped>
.lg-app{--bg0:#f4eddc;--bg1:#e6dabc;--panel:#fbf7ec;--panel2:#fffaf0;--ink:#33241a;--ink2:#6b5742;--muted:#9a8468;--line:rgba(140,110,60,.18);--line2:rgba(140,110,60,.32);--accent:#c8941c;--green:#4b8f58;--red:#d85f43;--shadow:0 4px 18px rgba(90,60,20,.12);height:100%;position:relative;overflow:hidden;background:linear-gradient(160deg,var(--bg0),var(--bg1));background-image:radial-gradient(rgba(140,100,40,.05) 1px,transparent 1px);background-size:7px 7px;color:var(--ink)}
.lg-app[data-theme=dark]{--bg0:#201811;--bg1:#302416;--panel:#2b2118;--panel2:#35281c;--ink:#f3eadb;--ink2:#d0bea2;--muted:#9f8968;--line:rgba(230,200,150,.12);--line2:rgba(230,200,150,.24);--shadow:0 4px 18px rgba(0,0,0,.28)}.serif{font-family:"Songti SC","Noto Serif SC",serif}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.lg-head{display:flex;align-items:center;gap:10px;padding:14px 18px 8px}.greet{font-size:11px;color:var(--muted)}h1{font-size:28px;font-weight:900}.icon{margin-left:auto;width:38px;height:38px;border:1px solid var(--line);background:var(--panel);box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.65);border-radius:13px;color:var(--ink);font-weight:900}.month{display:flex;align-items:center;gap:8px;padding:0 18px 8px}.month button{border:1px solid var(--line);background:rgba(255,255,255,.45);border-radius:10px;padding:7px 10px;color:var(--ink);font-weight:900}.month b{flex:1;text-align:center}.today{font-size:11px}.scroll{height:calc(100% - 162px);overflow:auto;padding:0 18px 96px}.hero{border-radius:23px;padding:18px;color:#edf8df;background:linear-gradient(145deg,#234d31,#4a7f42);box-shadow:var(--shadow);position:relative;overflow:hidden}.hero:after{content:"";position:absolute;inset:-35%;background:radial-gradient(circle,rgba(255,255,255,.16),transparent 45%);transform:translateX(36%)}.hero>*{position:relative;z-index:1}.hero small{font-size:10px;font-weight:900;letter-spacing:3px;color:rgba(230,245,200,.6)}.bal{font-size:34px;font-weight:900;margin-top:3px}.bal.neg{color:#ffb09a}.io{display:flex;gap:16px;margin-top:8px;font-size:12px;font-weight:800}.io .in{color:#a8e890}.io .out{color:#ffb09a}.budget{margin-top:13px;padding-top:11px;border-top:1px solid rgba(230,245,200,.14)}.budget div{display:flex;font-size:11px;color:rgba(230,245,200,.78)}.budget b{margin-left:auto}.budget i{display:block;height:6px;border-radius:99px;background:rgba(230,245,200,.15);margin-top:6px;overflow:hidden}.budget em{display:block;height:100%;background:linear-gradient(90deg,#a8e890,#d9e878)}.budget.warn em{background:linear-gradient(90deg,#f0b860,#e87850)}.budget.over em{background:linear-gradient(90deg,#e87850,#d84830)}.card{border:1px solid var(--line);background:linear-gradient(160deg,var(--panel),var(--panel2));border-radius:18px;box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.7);padding:14px;margin-top:12px;animation:pop .35s both}.card h2{display:flex;font-size:11px;letter-spacing:2px;color:var(--muted);font-weight:900}.card h2 button{margin-left:auto;border:0;background:transparent;color:var(--accent);font-weight:900}.donut-wrap{position:relative;display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:center}.donut{width:120px;height:120px;transform:rotate(-90deg)}.donut circle{transition:.25s}.donut .dim{opacity:.18}.center{position:absolute;left:0;top:31px;width:120px;text-align:center}.center b{display:block;font-size:17px}.center span{font-size:10px;color:var(--muted)}.legend button{display:grid;grid-template-columns:8px 1fr auto 34px;gap:7px;align-items:center;width:100%;border:0;background:transparent;color:var(--ink2);padding:5px 0;text-align:left}.legend button.dim{opacity:.35}.legend i{width:8px;height:8px;border-radius:50%}.legend b{color:var(--ink)}.legend em{font-style:normal;color:var(--muted);font-size:11px}.trend{height:82px;display:flex;align-items:end;gap:5px}.trend div{flex:1;height:100%;display:flex;flex-direction:column;justify-content:end;align-items:center}.trend i{width:100%;border-radius:7px 7px 2px 2px;background:linear-gradient(180deg,#d9b25c,#c8941c)}.trend i.zero{opacity:.22}.trend span{height:16px;font-size:9px;color:var(--muted)}.entries h3{display:flex;margin:14px 0 8px;font-size:12px;color:var(--muted)}.entries h3 span{margin-left:auto}.entry{display:flex;align-items:center;gap:11px;width:100%;border:1px solid var(--line);background:linear-gradient(160deg,var(--panel),var(--panel2));border-radius:16px;box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.7);padding:11px 13px;margin-bottom:8px;text-align:left;animation:pop .35s both}.entry i{display:grid;place-items:center;width:38px;height:38px;border-radius:13px;font-style:normal}.entry span{min-width:0;flex:1}.entry span b{display:block}.entry span small{display:block;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.entry strong.income{color:var(--green)}.entry strong.expense{color:var(--red)}.empty{text-align:center;color:var(--muted);padding:9vh 20px}.empty.small{padding:28px}.empty b{display:block;color:var(--ink);font-size:18px}.dock{position:absolute;left:14px;right:14px;bottom:14px;display:flex;gap:8px;border:1px solid var(--line2);border-radius:18px;padding:10px;background:var(--panel);box-shadow:var(--shadow)}.dock input{flex:1;border:0;outline:0;background:transparent;color:var(--ink);min-width:0}.dock button{border:0;border-radius:13px;font-weight:900}.manual{background:var(--panel2);color:var(--ink2);padding:0 12px}.go{width:38px;background:var(--accent);color:white}.mask{position:absolute;inset:0;background:rgba(25,16,2,.45);opacity:0;pointer-events:none;transition:.22s;z-index:20}.mask.show{opacity:1;pointer-events:auto}.sheet{position:absolute;left:0;right:0;bottom:0;max-height:82%;transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.9,.2,1);z-index:21;background:var(--panel);border-radius:22px 22px 0 0;box-shadow:0 -18px 50px rgba(0,0,0,.22);display:flex;flex-direction:column}.sheet.show{transform:translateY(0)}.grip{width:40px;height:5px;border-radius:99px;background:var(--line2);margin:10px auto}.sheet header,.sheet footer{display:flex;gap:9px;align-items:center;padding:10px 18px}.sheet header span{font-size:10px;font-weight:900;letter-spacing:1px;color:var(--accent);border:1px solid var(--line2);border-radius:999px;padding:2px 8px}.sheet header button{margin-left:auto}.form{padding:4px 20px 8px;overflow:auto}.seg{display:flex;background:var(--panel2);border-radius:13px;padding:3px;margin-bottom:13px}.seg button{flex:1;border:0;border-radius:10px;padding:9px;font-weight:900;color:var(--muted);background:transparent}.seg button.on{background:var(--panel);color:var(--accent);box-shadow:0 1px 4px rgba(0,0,0,.08)}.amount{display:flex;align-items:baseline;gap:6px;padding-bottom:12px;border-bottom:1px dashed var(--line2);margin-bottom:13px}.amount span{font-size:22px;color:var(--accent)}.amount input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--ink);font-size:34px;font-weight:900}.label{font-size:11px;color:var(--muted);font-weight:900;margin-bottom:8px}.cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:13px}.cat-grid button{border:1px solid var(--line);background:var(--panel2);border-radius:13px;padding:9px 4px;font-size:11px;font-weight:900;color:var(--ink2)}.cat-grid button span{display:block;font-size:20px}.cat-grid button.on{border-color:var(--accent);color:var(--accent);background:rgba(200,148,28,.1)}.row{display:flex;gap:9px}.row input{min-width:0;flex:1;border:1px solid var(--line);background:var(--panel2);border-radius:12px;padding:11px;color:var(--ink)}.sheet button{border:1px solid var(--line);background:var(--panel2);border-radius:11px;padding:9px 12px;font-weight:900;color:var(--ink)}.sheet .primary{margin-left:auto;background:var(--accent);color:white}.sheet .danger{color:var(--red)}.toast{position:absolute;top:12px;left:50%;transform:translate(-50%,-140%);transition:.25s;z-index:30;background:var(--ink);color:var(--bg0);border-radius:999px;padding:9px 14px;font-size:12px;font-weight:900}.toast.show{transform:translate(-50%,0)}@keyframes pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
</style>
