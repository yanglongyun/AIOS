<template>
  <div class="passbook-bg flex h-full w-full items-center justify-center overflow-hidden font-['PingFang_SC','Microsoft_YaHei',sans-serif]">
    <div class="passbook-container flex h-full w-full max-h-[900px] max-w-[1400px] rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] m-5">

      <!-- 左侧红皮书脊 -->
      <div class="passbook-cover relative flex w-[25px] shrink-0 items-center justify-center rounded-l-xl">
        <div class="cover-stripe absolute left-[5px] top-0 bottom-0 w-[10px] opacity-80"></div>
      </div>

      <!-- 右侧内页 -->
      <div class="passbook-pages relative flex flex-1 flex-col rounded-r-xl">
        <!-- 折痕 -->
        <div class="spine-crease pointer-events-none absolute left-0 top-0 bottom-0 z-50 w-10"></div>

        <!-- 顶栏 -->
        <div class="dot-matrix top-panel flex shrink-0 flex-col gap-4 px-4 pb-4 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pl-[60px] sm:pb-5 sm:pt-[30px]">
          <!-- 月份翻页 -->
          <div class="flex items-center gap-3 text-xl font-bold text-[#1a2a40] sm:gap-4 sm:text-2xl">
            <button class="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-black/5 active:scale-90 sm:h-9 sm:w-9"
                    @click="prevMonth">◄</button>
            <span class="tracking-[0.15em]">{{ displayMonth }}</span>
            <button class="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-black/5 active:scale-90 sm:h-9 sm:w-9"
                    :class="{ 'opacity-30 cursor-not-allowed': isCurrentMonth }"
                    :disabled="isCurrentMonth"
                    @click="nextMonth">►</button>
          </div>

          <!-- 汇总框 -->
          <div class="summary-box flex justify-between gap-3 rounded border-2 border-dashed border-[rgba(82,113,255,0.4)] bg-white/60 px-3 py-2 shadow-[inset_0_0_10px_rgba(0,0,0,0.02)] sm:gap-[30px] sm:px-6 sm:py-3">
            <div class="flex flex-col items-end">
              <span class="mb-0.5 text-[10px] text-gray-500 sm:mb-1 sm:text-xs">进项</span>
              <span class="text-sm font-bold text-green-700 sm:text-lg">+ {{ fmtAmt(totalIncome) }}</span>
            </div>
            <div class="flex flex-col items-end border-l border-dashed border-[rgba(82,113,255,0.3)] pl-3 sm:pl-[30px]">
              <span class="mb-0.5 text-[10px] text-gray-500 sm:mb-1 sm:text-xs">划出</span>
              <span class="text-sm font-bold text-red-700 sm:text-lg">- {{ fmtAmt(totalExpense) }}</span>
            </div>
            <div class="flex flex-col items-end border-l border-dashed border-[rgba(82,113,255,0.3)] pl-3 sm:pl-[30px]">
              <span class="mb-0.5 text-[10px] font-bold text-blue-900 sm:mb-1 sm:text-xs">结余</span>
              <span class="text-base font-black text-black underline decoration-double sm:text-2xl">{{ fmtAmt(endingBalance) }}</span>
            </div>
          </div>
        </div>

        <!-- 表格 -->
        <div class="passbook-table-wrapper mx-3 mb-4 flex-1 overflow-y-auto rounded border border-[rgba(82,113,255,0.4)] bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sm:mx-10 sm:ml-[60px] sm:mb-10">
          <table class="dot-matrix w-full border-collapse">
            <thead>
              <tr>
                <th class="passbook-th w-[12%]">日期<br><span class="hidden text-[10px] font-normal opacity-60 sm:inline">DATE</span></th>
                <th class="passbook-th">摘要<br><span class="hidden text-[10px] font-normal opacity-60 sm:inline">NARRATIVE</span></th>
                <th class="passbook-th w-[15%]">支出<br><span class="hidden text-[10px] font-normal opacity-60 sm:inline">WITHDRAWAL</span></th>
                <th class="passbook-th w-[15%]">存入<br><span class="hidden text-[10px] font-normal opacity-60 sm:inline">DEPOSIT</span></th>
                <th class="passbook-th w-[10%]">操作<br><span class="hidden text-[10px] font-normal opacity-60 sm:inline">OPR</span></th>
              </tr>
            </thead>
            <tbody>
              <!-- 历史记录 -->
              <tr v-for="(row, i) in rows" :key="row.id" class="group transition-colors hover:bg-[rgba(82,113,255,0.05)]">
                <td class="passbook-td text-center">{{ fmtDate(row.date) }}</td>
                <td class="passbook-td text-center">{{ row.note || (row.type === 'income' ? '存入' : '支出') }}</td>
                <td class="passbook-td text-right font-bold" :class="row.type === 'expense' ? 'text-red-700' : ''">
                  {{ row.type === 'expense' ? '-' + fmtAmt(row.amount) : '' }}
                </td>
                <td class="passbook-td text-right font-bold" :class="row.type === 'income' ? 'text-green-700' : ''">
                  {{ row.type === 'income' ? '+' + fmtAmt(row.amount) : '' }}
                </td>
                <td class="passbook-td text-center">
                  <button class="print-btn border-red-700 text-red-700 opacity-100 transition-opacity hover:bg-red-700 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                          @click="remove(row.id)">删除</button>
                </td>
              </tr>

              <!-- 新建输入行 -->
              <tr class="bg-[rgba(82,113,255,0.08)]">
                <td class="passbook-td text-center">
                  <input v-model="newDate" type="text" class="inline-input text-center" :placeholder="todayStr" />
                </td>
                <td class="passbook-td text-center">
                  <input ref="noteInput" v-model="newNote" type="text" class="inline-input text-center" placeholder="摘要事由..." @keyup.enter="save" />
                </td>
                <td class="passbook-td text-right">
                  <input v-model="newWithdraw" type="text" class="inline-input text-right font-bold text-red-700" placeholder="0.00" @keyup.enter="save" />
                </td>
                <td class="passbook-td text-right">
                  <input v-model="newDeposit" type="text" class="inline-input text-right font-bold text-green-700" placeholder="0.00" @keyup.enter="save" />
                </td>
                <td class="passbook-td text-center">
                  <button class="print-btn" :disabled="saving || (!newWithdraw && !newDeposit)" @click="save">印字</button>
                </td>
              </tr>

              <!-- 空行缓冲 -->
              <tr v-for="n in 6" :key="'e'+n"><td class="passbook-td h-8" v-for="c in 5" :key="c"></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';

const API_BASE = '/apps/finance';

const now = new Date();
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
const items = ref([]);
const openingBalance = ref(0);
const totalIncome = ref(0);
const totalExpense = ref(0);
const loading = ref(false);
const saving = ref(false);

const newDate = ref('');
const newNote = ref('');
const newWithdraw = ref('');
const newDeposit = ref('');
const noteInput = ref(null);

const displayMonth = computed(() => month.value.replace('-', ' / '));
const isCurrentMonth = computed(() => {
  const d = new Date();
  return month.value === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const todayStr = computed(() => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

const rows = computed(() => items.value);
const runningBalances = computed(() => {
  let bal = openingBalance.value;
  return items.value.map(item => {
    bal += item.type === 'income' ? item.amount : -item.amount;
    return bal;
  });
});
const endingBalance = computed(() => totalIncome.value - totalExpense.value);

const fmtAmt = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/list?month=${month.value}`);
    const data = await res.json();
    items.value = data.items || [];
    openingBalance.value = Number(data.openingBalance || 0);
    totalIncome.value = Number(data.totalIncome || 0);
    totalExpense.value = Number(data.totalExpense || 0);
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
};

const prevMonth = () => {
  const [y, m] = month.value.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  month.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  fetchData();
};
const nextMonth = () => {
  if (isCurrentMonth.value) return;
  const [y, m] = month.value.split('-').map(Number);
  const d = new Date(y, m, 1);
  month.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  fetchData();
};

const save = async () => {
  const withdraw = parseFloat(newWithdraw.value) || 0;
  const deposit = parseFloat(newDeposit.value) || 0;
  if (!withdraw && !deposit) return;
  if (saving.value) return;

  saving.value = true;
  try {
    const type = deposit > 0 ? 'income' : 'expense';
    const amount = deposit > 0 ? deposit : withdraw;
    const note = newNote.value.trim();

    const dateInput = newDate.value.trim() || todayStr.value;
    const dayPart = dateInput.includes('-') ? dateInput.split('-').pop() : dateInput;
    const fullDate = `${month.value}-${dayPart.padStart(2, '0')}T12:00:00`;

    await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount, note, date: fullDate })
    });

    newDate.value = '';
    newNote.value = '';
    newWithdraw.value = '';
    newDeposit.value = '';
    await fetchData();
    nextTick(() => noteInput.value?.focus());
  } catch (e) { console.error(e); }
  finally { saving.value = false; }
};

const remove = async (id) => {
  try {
    await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await fetchData();
  } catch (e) { console.error(e); }
};

onMounted(fetchData);
</script>

<style scoped>
/* ── 背景：深灰斜纹 ── */
.passbook-bg {
  background-color: #1a1a1a;
  background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, transparent 1px, transparent 10px);
}

/* ── 红皮封面 ── */
.passbook-cover {
  background: linear-gradient(135deg, #a41b1b, #7d1010);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.2'/%3E%3C/svg%3E");
  box-shadow: inset 4px 0 10px rgba(0,0,0,0.5), inset -2px 0 8px rgba(0,0,0,0.8);
}
.cover-stripe {
  background: linear-gradient(90deg, #111, #333, #111);
  box-shadow: inset 0 0 3px rgba(0,0,0,0.8);
}

/* ── 内页：防伪底纹 ── */
.passbook-pages {
  background-color: #f0f4f8;
  background-image:
    repeating-linear-gradient(45deg, rgba(82,113,255,0.03) 0, rgba(82,113,255,0.03) 1px, transparent 1px, transparent 12px),
    repeating-linear-gradient(-45deg, rgba(82,113,255,0.03) 0, rgba(82,113,255,0.03) 1px, transparent 1px, transparent 12px);
  box-shadow: inset 15px 0 25px rgba(0,0,0,0.15);
}

/* ── 折痕 ── */
.spine-crease {
  background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 40%, transparent 100%);
}

/* ── 点阵字体 ── */
.dot-matrix {
  font-family: 'Courier New', Courier, monospace;
  color: #0b1c67;
  text-shadow: 0px 0px 1px rgba(11,28,103,0.4);
  letter-spacing: 0.5px;
}

/* ── 表格 ── */
.passbook-th {
  background-color: rgba(82,113,255,0.15);
  color: #1a2a40;
  font-weight: bold;
  text-align: center;
  font-size: 14px;
  padding: 12px 8px;
  border: 1px solid rgba(82,113,255,0.4);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(4px);
}
.passbook-td {
  border: 1px solid rgba(82,113,255,0.3);
  padding: 12px 16px;
  font-size: 15px;
}

/* ── 行内输入 ── */
.inline-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-shadow: inherit;
  border-bottom: 1px dashed rgba(11,28,103,0.3);
  padding: 2px 4px;
  transition: all 0.2s;
}
.inline-input:focus {
  border-bottom: 1px solid #0b1c67;
  background: rgba(255,255,255,0.5);
}
.inline-input::placeholder {
  color: rgba(11,28,103,0.3);
  font-style: italic;
}

/* ── 印字按钮 ── */
.print-btn {
  padding: 4px 12px;
  border: 1px solid #0b1c67;
  color: #0b1c67;
  background: transparent;
  border-radius: 4px;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.1s;
  text-shadow: none;
  white-space: nowrap;
}
.print-btn:hover {
  background: #0b1c67;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.print-btn:active {
  transform: translateY(1px);
}
.print-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── 自定义滚动条 ── */
.passbook-table-wrapper::-webkit-scrollbar { width: 8px; }
.passbook-table-wrapper::-webkit-scrollbar-track { background: transparent; }
.passbook-table-wrapper::-webkit-scrollbar-thumb { background: rgba(82,113,255,0.2); border-radius: 4px; }
.passbook-table-wrapper::-webkit-scrollbar-thumb:hover { background: rgba(82,113,255,0.4); }

/* ── 响应式 ── */
@media (max-width: 640px) {
  .passbook-container { margin: 0 !important; border-radius: 0 !important; max-height: none !important; }
  .passbook-cover { width: 12px !important; border-radius: 0 !important; }
  .passbook-pages { border-radius: 0 !important; }
  .spine-crease { width: 20px !important; }
  .passbook-th { padding: 8px 4px; font-size: 12px; }
  .passbook-td { padding: 8px 6px; font-size: 13px; }
  .inline-input { font-size: 13px; }
  .print-btn { padding: 3px 8px; font-size: 11px; }
}
</style>
