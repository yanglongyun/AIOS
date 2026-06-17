<template>
  <div class="h-full overflow-y-auto px-6 pb-7 pt-[18px] dotgrid">
    <div class="mx-auto grid max-w-[860px] gap-4">
      <div class="flex items-center gap-3">
        <h2 class="flex-1 text-[17px] font-bold text-[var(--ink)]">记账本</h2>
        <div class="flex items-center rounded-full border border-[var(--line2)] bg-white px-1 py-1 text-[13px] text-[var(--ink2)] shadow-card">
          <button class="rounded-full px-2 py-1 hover:bg-[#f3f3f4]" type="button" @click="shiftMonth(-1)">‹</button>
          <b class="px-2 text-[12.5px]">{{ monthLabel }}</b>
          <button class="rounded-full px-2 py-1 hover:bg-[#f3f3f4]" type="button" @click="shiftMonth(1)">›</button>
        </div>
      </div>

      <section class="rounded-2xl border border-[var(--line2)] bg-white p-6 text-center shadow-card">
        <small class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Balance · 余额</small>
        <div class="my-2 font-mono text-[34px] font-bold tabular-nums" :class="summary.balance < 0 ? 'text-[#b91c1c]' : 'text-[var(--ink)]'">¥ {{ money(summary.balance) }}</div>
        <div class="flex justify-center gap-6 text-[12.5px]">
          <span class="text-[#43864e]">收入 ¥{{ money(summary.income) }}</span>
          <span class="text-[#b91c1c]">支出 ¥{{ money(summary.expense) }}</span>
        </div>
      </section>

      <section class="flex items-center gap-2 rounded-full border border-[var(--line2)] bg-white py-2 pl-4 pr-2 shadow-card">
        <input v-model="smartText" class="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]" :disabled="smartBusy" placeholder="一句话记账：午餐 38，打车 26，工资 8200" @keyup.enter="smartSend" />
        <button class="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-d)] text-white disabled:opacity-50" type="button" :disabled="smartBusy || !smartText.trim()" @click="smartSend">
          <LoaderCircle v-if="smartBusy" class="h-4 w-4 animate-spin" />
          <ArrowUp v-else class="h-4 w-4" />
        </button>
      </section>
      <div v-if="smartError" class="-mt-3 px-4 text-[12px] text-[#b91c1c]">{{ smartError }}</div>

      <div class="flex items-center justify-between gap-3">
        <button class="rounded-[10px] bg-[#f3f3f4] px-4 py-2 text-[13px] font-semibold text-[var(--ink2)] hover:bg-[#eef4fe] hover:text-[var(--accent-d)]" type="button" @click="openSheet()">手动记一笔</button>
        <button class="rounded-[10px] bg-[#f3f3f4] px-4 py-2 text-[13px] font-semibold text-[var(--ink2)] hover:bg-[#eef4fe] hover:text-[var(--accent-d)]" type="button" @click="editBudget">预算 ¥{{ money(budget) }}</button>
      </div>

      <template v-if="entries.length">
        <button
          v-for="entry in entries"
          :key="entry.id"
          class="flex items-center gap-3 rounded-xl border border-[var(--line2)] bg-white px-4 py-3 text-left shadow-card transition hover:border-[var(--accent)]"
          type="button"
          @click="openSheet(entry)"
        >
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl" :style="{ background: `${cat(entry.category).color}22`, color: cat(entry.category).color }">{{ cat(entry.category).emoji }}</span>
          <span class="min-w-0 flex-1">
            <b class="block truncate text-[13.5px] text-[var(--ink)]">{{ entry.note || entry.category }}</b>
            <small class="mt-1 block text-xs text-[var(--muted)]">{{ entry.category }} · {{ dayLabel(entry.occurredOn || entry.occurred_on) }}</small>
          </span>
          <b class="font-mono text-[14px] tabular-nums" :class="entry.type === 'income' ? 'text-[#43864e]' : 'text-[#b91c1c]'">{{ entry.type === 'income' ? '+' : '-' }}¥{{ money(entry.amount) }}</b>
        </button>
      </template>
      <div v-else class="rounded-xl border border-dashed border-[var(--line2)] bg-white p-10 text-center text-[13px] text-[var(--muted)]">
        <b class="mb-1 block text-[16px] text-[var(--ink)]">这个月还没有账目</b>
        用一句话或手动记录第一笔。
      </div>
    </div>

    <button v-if="sheetOpen" class="fixed inset-0 z-40 bg-black/35" type="button" aria-label="关闭" @click="closeSheet"></button>
    <aside class="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] translate-y-full rounded-t-2xl border-t border-[var(--line2)] bg-white shadow-[0_-20px_60px_-30px_rgba(0,0,0,0.45)] transition-transform" :class="{ 'translate-y-0': sheetOpen }">
      <div class="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--line2)]"></div>
      <header class="flex items-center gap-2 px-5 py-3">
        <b class="text-[15px]">{{ editingId ? '编辑账目' : '新账目' }}</b>
        <span v-if="fromAi" class="rounded-full border border-[var(--line2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-d)]">AI</span>
        <button class="ml-auto grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f3f3f4]" type="button" @click="closeSheet">×</button>
      </header>
      <div class="max-h-[62vh] overflow-auto px-5 pb-3">
        <div class="mb-3 flex rounded-xl bg-[#f7f7f8] p-1">
          <button class="flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold" :class="form.type === 'expense' ? 'bg-white text-[var(--accent-d)] shadow-sm' : 'text-[var(--muted)]'" type="button" @click="setType('expense')">支出</button>
          <button class="flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold" :class="form.type === 'income' ? 'bg-white text-[var(--accent-d)] shadow-sm' : 'text-[var(--muted)]'" type="button" @click="setType('income')">收入</button>
        </div>
        <label class="mb-4 flex items-baseline gap-2 border-b border-[var(--line)] pb-3">
          <span class="font-mono text-xl text-[var(--accent-d)]">¥</span>
          <input v-model.number="form.amount" class="min-w-0 flex-1 bg-transparent font-mono text-[30px] font-semibold outline-none" type="number" inputmode="decimal" placeholder="0.00" />
        </label>
        <div class="mb-2 text-[11px] font-semibold text-[var(--muted)]">分类</div>
        <div class="mb-4 grid grid-cols-4 gap-2">
          <button v-for="c in availableCategories" :key="c.name" class="rounded-xl border border-[var(--line2)] bg-white px-1 py-2 text-[11px] font-medium text-[var(--ink2)]" :class="{ 'border-[var(--accent-d)] bg-[#eef4fe] text-[var(--accent-d)]': form.category === c.name }" type="button" @click="form.category = c.name">
            <span class="mb-1 block text-xl">{{ c.emoji }}</span>{{ c.name }}
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2 max-[640px]:grid-cols-1">
          <input v-model="form.note" class="rounded-xl border border-[var(--line2)] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[var(--accent)]" placeholder="备注" />
          <input v-model="form.occurredOn" class="rounded-xl border border-[var(--line2)] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[var(--accent)]" type="date" />
        </div>
      </div>
      <footer class="flex items-center gap-2 border-t border-[var(--line)] px-5 py-3">
        <button v-if="editingId" class="rounded-[10px] px-4 py-2 text-[13px] font-semibold text-[#b91c1c] hover:bg-[#fef2f2]" type="button" @click="deleteCurrent">删除</button>
        <button class="ml-auto rounded-[10px] bg-[var(--accent-d)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#2563eb]" type="button" @click="saveEntry">保存</button>
      </footer>
    </aside>

    <div class="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white opacity-0 transition" :class="{ 'opacity-100': toast }">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ArrowUp, LoaderCircle } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';

const entries = ref([]);
const categories = ref([]);
const budget = ref(3000);
const curMonth = ref(new Date().toISOString().slice(0, 7));
const summary = ref({ income: 0, expense: 0, balance: 0 });
const smartText = ref('');
const smartBusy = ref(false);
const smartError = ref('');
const sheetOpen = ref(false);
const fromAi = ref(false);
const editingId = ref(null);
const toast = ref('');
const form = reactive({ type: 'expense', amount: '', category: '餐饮', note: '', occurredOn: new Date().toISOString().slice(0, 10) });
let toastTimer = null;
let smartErrTimer = null;

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};
const money = (n) => Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const monthLabel = computed(() => {
  const [y, m] = curMonth.value.split('-');
  return `${y}年${Number(m)}月`;
});
const availableCategories = computed(() => form.type === 'income' ? categories.value.filter((x) => x.name === '工资' || x.name === '其他') : categories.value.filter((x) => x.name !== '工资'));
const cat = (name) => categories.value.find((item) => item.name === name) || { name: '其他', emoji: '✨', color: '#8e8e96' };
const showToast = (text) => {
  toast.value = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = ''; }, 1800);
};
const showSmartError = (text) => {
  smartError.value = text;
  clearTimeout(smartErrTimer);
  smartErrTimer = setTimeout(() => { smartError.value = ''; }, 3000);
};
const load = async () => {
  const [meta, data] = await Promise.all([
    request('/apps/ledger/meta'),
    request(`/apps/ledger/entries?month=${curMonth.value}`),
  ]);
  categories.value = meta.categories || [];
  budget.value = Number(meta.budget || 3000);
  entries.value = data.entries || [];
  summary.value = data.summary || { income: 0, expense: 0, balance: 0 };
};
const shiftMonth = async (n) => {
  const [y, m] = curMonth.value.split('-').map(Number);
  curMonth.value = new Date(y, m - 1 + n, 1).toISOString().slice(0, 7);
  await load();
};
const normalizeCategory = () => {
  if (!availableCategories.value.some((x) => x.name === form.category)) {
    form.category = availableCategories.value[0]?.name || '其他';
  }
};
const setType = (type) => {
  form.type = type;
  normalizeCategory();
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
const smartSend = async () => {
  const text = smartText.value.trim();
  if (!text || smartBusy.value) return;
  smartBusy.value = true;
  smartError.value = '';
  try {
    const data = await request('/apps/ledger/smart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const list = data.entries || [];
    if (!list.length) {
      showSmartError('没有识别出可记录的账目');
      return;
    }
    smartText.value = '';
    await load();
    showToast(list.length > 1 ? `已记录 ${list.length} 笔` : `已记录 ${list[0].note || list[0].category} ¥${money(list[0].amount)}`);
  } catch (err) {
    showSmartError(err.message || '记录失败');
  } finally {
    smartBusy.value = false;
  }
};
const saveEntry = async () => {
  if (!Number(form.amount)) return showToast('金额不正确');
  const body = { ...form, amount: Number(form.amount) };
  const url = editingId.value ? `/apps/ledger/entries?id=${editingId.value}&month=${curMonth.value}` : `/apps/ledger/entries?month=${curMonth.value}`;
  await request(url, {
    method: editingId.value ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  closeSheet();
  await load();
  showToast(editingId.value ? '已保存' : '已记录');
};
const deleteCurrent = async () => {
  if (!editingId.value) return;
  await request(`/apps/ledger/entries?id=${editingId.value}&month=${curMonth.value}`, { method: 'DELETE' });
  closeSheet();
  await load();
  showToast('已删除');
};
const editBudget = async () => {
  const value = prompt('设置月预算', String(budget.value));
  if (!value) return;
  await request('/apps/ledger/budget', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Number(value) }),
  });
  await load();
  showToast('预算已更新');
};
const dayLabel = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

onMounted(load);
</script>
