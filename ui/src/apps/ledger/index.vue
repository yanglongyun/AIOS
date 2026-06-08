<template>
  <div class="flex h-full min-h-0 flex-col" :style="bgStyle">
    <div class="m-3 rounded-[14px] px-4 py-3" :style="coverStyle">
      <div class="font-mono text-[10px] font-bold uppercase tracking-[3px] text-[rgba(255,235,180,0.55)]">BALANCE · 余额</div>
      <div class="mt-1 font-mono text-[28px] font-extrabold leading-none tabular-nums" :style="{ color: summary.balance >= 0 ? '#a8e890' : '#ff9080' }">
        ¥ {{ fmt(summary.balance) }}
      </div>
      <div class="mt-2 flex items-center gap-3 border-t border-[rgba(255,235,180,0.15)] pt-1.5 font-mono text-[10.5px]">
        <span class="text-[#a8e890]">收入 ¥{{ fmt(summary.income) }}</span>
        <span class="text-[rgba(255,235,180,0.30)]">/</span>
        <span class="text-[#ff9080]">支出 ¥{{ fmt(summary.expense) }}</span>
      </div>
    </div>

    <div class="mx-3 mb-3 rounded-[16px] px-3.5 py-3" :style="panelStyle">
      <div class="mb-2 text-[13px] font-extrabold text-[#3a2415]">智能记账 · 直接用一句话</div>
      <div class="flex items-center gap-2">
        <input
          v-model="smartText"
          class="min-w-0 flex-1 rounded-[11px] border border-[rgba(120,90,40,0.22)] bg-white/70 px-3 py-2 text-[14px] text-[#3a2415] outline-none placeholder:text-[#9a8060]"
          placeholder="如：午餐面馆 38 / 打车 26 / 工资 8200"
          @keyup.enter="parseSmart"
        />
        <button class="shrink-0 rounded-[11px] px-3 py-2 text-[12px] font-bold disabled:opacity-45" :style="buttonStyle" :disabled="parsing || !smartText.trim()" @click="parseSmart">
          {{ parsing ? '识别中' : '识别' }}
        </button>
      </div>

      <div v-if="error" class="mt-2 rounded-[10px] border border-[#d9987f] bg-[#fff5ef] px-3 py-2 text-[12px] font-bold text-[#9a3020]">{{ error }}</div>

      <div v-if="parsed" class="mt-3 rounded-[14px] border border-[rgba(180,150,80,0.22)] bg-white/55 p-3">
        <div class="flex items-center gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-[12px] text-[20px]" :style="{ background: categoryMeta(parsed.category).color + '22' }">
            {{ categoryMeta(parsed.category).icon }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-[14px] font-extrabold text-[#3a2415]">{{ parsed.category }}</span>
              <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="parsed.type === 'income' ? 'bg-[#d9f4d6] text-[#2d7a34]' : 'bg-[#f5ded8] text-[#9a3020]'">
                {{ parsed.type === 'income' ? '收入' : '支出' }}
              </span>
            </div>
            <div class="mt-0.5 truncate text-[11px] text-[#8a7058]">{{ parsed.note || '无备注' }}</div>
          </div>
          <div class="font-mono text-[16px] font-extrabold tabular-nums" :class="parsed.type === 'income' ? 'text-[#287a38]' : 'text-[#a83020]'">
            {{ parsed.type === 'income' ? '+' : '-' }}¥{{ fmt(parsed.amount) }}
          </div>
        </div>
        <button class="mt-3 w-full rounded-[11px] px-3 py-2 text-[13px] font-extrabold disabled:opacity-45" :style="buttonStyle" :disabled="savingParsed" @click="confirmParsed">
          {{ savingParsed ? '记录中' : '确认记账' }}
        </button>
      </div>
    </div>

    <div class="mx-3 mb-2 rounded-[14px] px-3 py-2" :style="panelStyle">
      <button class="flex w-full items-center justify-between py-1 text-left text-[13px] font-extrabold text-[#3a2415]" @click="manualOpen = !manualOpen">
        <span>手动记一笔</span>
        <span class="text-[16px] leading-none text-[#8a7058]">{{ manualOpen ? '−' : '+' }}</span>
      </button>
      <div v-if="manualOpen" class="mt-2">
        <div class="mb-2 flex rounded-[9px] bg-[rgba(120,90,40,0.10)] p-0.5 text-[12px] font-bold">
          <button class="flex-1 rounded-[7px] py-1" :class="form.type === 'expense' ? 'bg-[#a8483a] text-white' : 'text-[#7a3a2a]'" @click="setManualType('expense')">支出</button>
          <button class="flex-1 rounded-[7px] py-1" :class="form.type === 'income' ? 'bg-[#3a7a3a] text-white' : 'text-[#3a5a3a]'" @click="setManualType('income')">收入</button>
        </div>
        <div class="grid grid-cols-[1fr_96px] gap-2">
          <select v-model="form.category" class="rounded-[9px] border border-[rgba(120,90,40,0.18)] bg-white/70 px-2.5 py-1.5 text-[13px] outline-none">
            <option v-for="cat in manualCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <input v-model.number="form.amount" type="number" inputmode="decimal" class="rounded-[9px] border border-[rgba(120,90,40,0.18)] bg-white/70 px-2.5 py-1.5 text-right font-mono text-[13px] outline-none" placeholder="金额" />
        </div>
        <div class="mt-2 flex items-center gap-2">
          <input v-model="form.note" class="min-w-0 flex-1 rounded-[9px] border border-[rgba(120,90,40,0.18)] bg-white/70 px-2.5 py-1.5 text-[13px] outline-none" placeholder="备注" @keyup.enter="add" />
          <button class="rounded-[9px] px-3 py-1.5 text-[12px] font-bold disabled:opacity-45" :style="buttonStyle" :disabled="!form.amount" @click="add">记录</button>
        </div>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-5 [scrollbar-width:none]">
      <div v-if="!entries.length" class="py-16 text-center">
        <div class="text-[17px] font-extrabold text-[#4a2c18]">还没有账目</div>
        <div class="mt-2 text-[13px] text-[#9a8060]">用一句话记录第一笔收入或支出</div>
      </div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="entry in entries" :key="entry.id" class="flex items-center gap-3 rounded-[14px] px-3.5 py-3" :style="panelStyle">
          <span class="w-1 self-stretch rounded-full" :class="entry.type === 'income' ? 'bg-[#3a7a3a]' : 'bg-[#a83a28]'"></span>
          <div class="grid h-9 w-9 place-items-center rounded-[11px] text-[18px]" :style="{ background: categoryMeta(entry.category).color + '22' }">{{ categoryMeta(entry.category).icon }}</div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[13.5px] font-bold text-[#3a2415]">{{ entry.category || (entry.type === 'income' ? '收入' : '支出') }}</div>
            <div class="truncate text-[10.5px] text-[#8a7058]">{{ entry.note || entry.occurred_on }}</div>
          </div>
          <div class="font-mono text-[14px] font-bold tabular-nums" :class="entry.type === 'income' ? 'text-[#287a38]' : 'text-[#a83020]'">
            {{ entry.type === 'income' ? '+' : '-' }}¥{{ fmt(entry.amount) }}
          </div>
          <button class="text-[11px] font-bold text-[#9a3a2a]" @click="remove(entry.id)">删</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';

const entries = ref([]);
const summary = ref({ income: 0, expense: 0, balance: 0 });
const form = reactive({ type: 'expense', amount: '', category: '餐饮', note: '' });
const smartText = ref('');
const parsed = ref(null);
const parsing = ref(false);
const savingParsed = ref(false);
const manualOpen = ref(false);
const error = ref('');

const categories = [
  { name: '餐饮', icon: '🍜', color: '#c8941c' },
  { name: '交通', icon: '🚇', color: '#3a72b0' },
  { name: '购物', icon: '🛒', color: '#3c7a4e' },
  { name: '居住', icon: '🏠', color: '#b07a2a' },
  { name: '娱乐', icon: '🎮', color: '#c05a8a' },
  { name: '医疗', icon: '💊', color: '#a83a28' },
  { name: '工资', icon: '💰', color: '#3c7a4e' },
  { name: '其他', icon: '✨', color: '#7a5e40' },
];

const expenseCategories = ['餐饮', '交通', '购物', '居住', '娱乐', '医疗', '其他'];
const incomeCategories = ['工资', '其他'];
const manualCategories = computed(() => (form.type === 'income' ? incomeCategories : expenseCategories));

const fmt = (n) => Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const categoryMeta = (name) => categories.find((item) => item.name === name) || categories[categories.length - 1];

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const load = async () => {
  const data = await request('/apps/ledger/entries');
  entries.value = data.entries || [];
  summary.value = data.summary || { income: 0, expense: 0, balance: 0 };
};

const parseSmart = async () => {
  const text = smartText.value.trim();
  if (!text || parsing.value) return;
  parsing.value = true;
  parsed.value = null;
  error.value = '';
  try {
    const data = await request('/apps/ledger/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    parsed.value = data.entry;
  } catch (err) {
    error.value = err.message || '识别失败';
  } finally {
    parsing.value = false;
  }
};

const confirmParsed = async () => {
  if (!parsed.value || savingParsed.value) return;
  savingParsed.value = true;
  error.value = '';
  try {
    await request('/apps/ledger/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.value),
    });
    smartText.value = '';
    parsed.value = null;
    await load();
  } catch (err) {
    error.value = err.message || '记录失败';
  } finally {
    savingParsed.value = false;
  }
};

const add = async () => {
  if (!form.amount) return;
  await request('/apps/ledger/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  form.amount = '';
  form.note = '';
  await load();
};

const remove = async (id) => {
  await request(`/apps/ledger/entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  await load();
};

const setManualType = (type) => {
  form.type = type;
  form.category = type === 'income' ? '工资' : '餐饮';
};

onMounted(load);

const bgStyle = {
  background: 'linear-gradient(180deg,#f0e8d5 0%,#e8dfca 100%)',
};
const coverStyle = {
  background: 'linear-gradient(160deg,#244225 0%,#102414 100%)',
  boxShadow: '0 4px 14px rgba(30,60,30,0.25),inset 0 1px 0 rgba(255,255,255,0.18)',
  border: '1px solid rgba(50,90,60,0.25)',
};
const panelStyle = {
  background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)',
  boxShadow: '0 2px 8px rgba(90,60,20,0.1),inset 0 1px 0 rgba(255,255,255,0.8)',
  border: '1px solid rgba(180,150,80,0.18)',
};
const buttonStyle = {
  background: 'linear-gradient(180deg,#d4981e 0%,#a07010 100%)',
  boxShadow: '0 3px 0 #6a4800,0 4px 10px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,215,80,0.35)',
  color: 'rgba(255,245,190,0.95)',
};
</script>
