<template>
  <div class="lg-app absolute inset-0 overflow-y-auto dot-grid" :data-theme="themeName">
    <MainView
      v-model:smart-text="smartText"
      :month-label="monthLabel"
      :summary="summary"
      :entries="filteredEntries"
      :cat="cat"
      :smart-busy="smartBusy"
      :smart-error="smartError"
      @shift-month="shiftMonth"
      @smart-send="smartSend"
      @open="openSheet"
    />

    <EntrySheet
      :open="sheetOpen"
      :form="form"
      :categories="availableCategories"
      :editing-id="editingId"
      :from-ai="fromAi"
      @close="closeSheet"
      @normalize="normalizeCategory"
      @save="saveEntry"
      @delete="deleteCurrent"
    />
    <div class="toast" :class="{ show: toastText }">{{ toastText }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useThemeStore } from '../../stores/theme.js';
import MainView from './views/MainView.vue';
import EntrySheet from './components/EntrySheet.vue';
import { request } from './lib/api.js';
import { money } from './lib/format.js';

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
const smartText = ref('');
const smartBusy = ref(false);
const smartError = ref('');
let smartErrTimer = null;
const form = reactive({ type: 'expense', amount: '', category: '餐饮', note: '', occurredOn: new Date().toISOString().slice(0, 10) });
let toastTimer = null;

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

const cat = (name) => categories.value.find((x) => x.name === name) || { name: '其他', emoji: '✨', color: '#8e8e96' };
const showToast = (text) => { toastText.value = text; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastText.value = ''; }, 1800); };
const shiftMonth = async (n) => {
  const [y, m] = curMonth.value.split('-').map(Number);
  curMonth.value = new Date(y, m - 1 + n, 1).toISOString().slice(0, 7);
  await load();
};
const goThisMonth = async () => { curMonth.value = new Date().toISOString().slice(0, 7); await load(); };
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
const showSmartError = (text) => {
  smartError.value = text;
  clearTimeout(smartErrTimer);
  smartErrTimer = setTimeout(() => { smartError.value = ''; }, 3000);
};
const smartSend = async () => {
  const text = smartText.value.trim();
  if (!text || smartBusy.value) return;
  smartBusy.value = true;
  smartError.value = '';
  try {
    const data = await request('/apps/ledger/smart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const list = data.entries || [];
    if (!list.length) { showSmartError('没解析出账目,换个说法试试'); return; }
    smartText.value = '';
    await load();
    showToast(list.length > 1 ? `已记录 ${list.length} 笔` : `已记录:${list[0].note || list[0].category} ¥${money(list[0].amount)}`);
  } catch (err) {
    showSmartError(err.message || '记录失败,稍后再试');
  } finally {
    smartBusy.value = false;
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
.lg-app{--panel:var(--color-bg-elev);--ink:var(--color-ink);--ink2:var(--color-muted);--muted:var(--color-faint);--line:var(--color-line);--line2:var(--color-line-hi);--accent:var(--color-accent);--green:var(--color-good);--red:var(--color-bad);color:var(--ink)}
.toast{position:fixed;top:12px;left:50%;transform:translate(-50%,-180%);opacity:0;visibility:hidden;transition:transform .25s,opacity .25s,visibility .25s;z-index:30;background:var(--color-ink);color:var(--color-bg);border-radius:999px;padding:8px 14px;font-size:12px;font-weight:600}
.toast.show{transform:translate(-50%,0);opacity:1;visibility:visible}
</style>
