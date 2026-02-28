<template>
  <div class="p-6 w-full max-w-4xl mx-auto h-full overflow-y-auto">
    <!-- 顶部标题 -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-neutral-800 dark:text-neutral-100 italic tracking-tight">Finance.</h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">管理你的收入与支出</p>
      </div>
      <div class="flex gap-4">
        <div class="text-right">
          <p class="text-[10px] uppercase tracking-widest text-neutral-400">总支出</p>
          <p class="text-2xl font-mono font-bold text-rose-500">-￥{{ Math.abs(totalExpense).toLocaleString() }}</p>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">本月收入</span>
        </div>
        <p class="text-2xl font-mono font-semibold">+{{ totalIncome.toLocaleString() }}</p>
      </div>

      <div class="bg-white dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12H4" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">本月支出</span>
        </div>
        <p class="text-2xl font-mono font-semibold">-{{ totalExpense.toLocaleString() }}</p>
      </div>

      <div class="bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
        <div class="flex items-center gap-3 mb-3 text-indigo-100">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" stroke-width="2"/></svg>
          <span class="text-sm font-medium">净头寸</span>
        </div>
        <p class="text-2xl font-mono font-bold">￥{{ (totalIncome - totalExpense).toLocaleString() }}</p>
      </div>
    </div>

    <!-- 智能记录 -->
    <div class="bg-neutral-100 dark:bg-neutral-800/30 p-2 rounded-2xl mb-4">
      <div class="flex flex-wrap gap-2 items-center">
        <input
          v-model="smartInput"
          @keyup.enter="smartFill"
          placeholder="例如：今天午饭 58 元，分类餐饮；或：工资到账 12000 元"
          class="flex-1 min-w-[280px] bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          @click="smartFill"
          :disabled="smartFilling || !smartInput.trim()"
          class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-500 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ smartFilling ? '识别中...' : '智能填充' }}
        </button>
      </div>
      <p v-if="smartError" class="mt-2 text-xs text-rose-500 px-2">{{ smartError }}</p>
    </div>

    <!-- 记账表单 -->
    <div class="bg-neutral-100 dark:bg-neutral-800/30 p-2 rounded-2xl mb-8 flex flex-wrap gap-2 items-center">
      <select v-model="newItem.type" class="bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="expense">支出</option>
        <option value="income">收入</option>
      </select>
      <input v-model="newItem.amount" type="number" placeholder="金额" class="flex-1 min-w-[120px] bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      <input v-model="newItem.category" placeholder="分类 (如: 餐饮, 交通)" class="flex-1 min-w-[120px] bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      <input v-model="newItem.note" @keyup.enter="add" placeholder="备注..." class="flex-[2] min-w-[200px] bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      <button @click="add" class="bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all active:scale-95">记录</button>
    </div>

    <!-- 列表记录 -->
    <div class="bg-white dark:bg-transparent rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      <div class="px-6 py-4 border-b border-neutral-50 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50">
        <h3 class="text-sm font-bold uppercase tracking-widest text-neutral-400">最近流水</h3>
        <span class="text-[10px] text-neutral-400">{{ items.length }} 条记录</span>
      </div>
      <div class="divide-y divide-neutral-50 dark:divide-neutral-800">
        <div v-for="item in items" :key="item.id" class="px-6 py-4 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
          <div :class="item.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'" class="w-10 h-10 rounded-xl flex items-center justify-center font-bold mr-4 shrink-0">
            {{ item.category.slice(0, 1) }}
          </div>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{{ item.note || item.category }}</h4>
            <div class="flex gap-3 mt-0.5">
              <span class="text-[11px] text-neutral-400">{{ item.category }}</span>
              <span class="text-[11px] text-neutral-300 dark:text-neutral-600">•</span>
              <span class="text-[11px] text-neutral-400">{{ formatDate(item.date) }}</span>
            </div>
          </div>
          <div class="text-right mr-4">
            <p :class="item.type === 'income' ? 'text-emerald-500' : 'text-neutral-800 dark:text-neutral-200'" class="font-mono font-bold">
              {{ item.type === 'income' ? '+' : '-' }}{{ item.amount.toLocaleString() }}
            </p>
          </div>
          <button @click="remove(item.id)" class="opacity-0 group-hover:opacity-100 p-2 text-neutral-300 hover:text-rose-500 transition-all cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div v-if="items.length === 0" class="py-20 text-center text-neutral-400 text-sm">暂无流水记录</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const items = ref([])
const newItem = ref({ type: 'expense', amount: '', category: '', note: '' })
const smartInput = ref('')
const smartFilling = ref(false)
const smartError = ref('')
const API_BASE = 'http://localhost:9701/api/apps/finance'

const totalIncome = computed(() => items.value.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0))
const totalExpense = computed(() => items.value.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0))

const fetchItems = async () => {
  try {
    const res = await fetch(`${API_BASE}/list`)
    const result = await res.json(); items.value = (result.data || []).reverse()
  } catch (e) { console.error(e) }
}

const add = async () => {
  if (!newItem.value.amount || !newItem.value.category) return
  try {
    await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem.value)
    })
    newItem.value = { type: 'expense', amount: '', category: '', note: '' }
    fetchItems()
  } catch (e) { console.error(e) }
}

const smartFill = async () => {
  const text = smartInput.value.trim()
  if (!text || smartFilling.value) return

  smartFilling.value = true
  smartError.value = ''
  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '你是记账助手。把用户的一句话记账描述提取成 JSON：{"type":"income|expense","amount":数字,"category":"分类","note":"备注"}。只返回 JSON，不要解释，不要代码块。'
          },
          { role: 'user', content: text }
        ]
      })
    })
    const data = await res.json()
    if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`)

    const raw = String(data.message?.content || '').trim().replace(/^```json\s*|```$/g, '')
    const parsed = JSON.parse(raw)
    const type = parsed.type === 'income' ? 'income' : 'expense'
    const amount = Number(parsed.amount)
    const category = String(parsed.category || '').trim()
    const note = String(parsed.note || '').trim()

    if (!Number.isFinite(amount) || amount <= 0 || !category) {
      throw new Error('识别结果不完整，请补充金额和分类')
    }

    newItem.value = { type, amount: String(amount), category, note }
  } catch (e) {
    smartError.value = e.message || '智能填充失败'
  } finally {
    smartFilling.value = false
  }
}

const remove = async (id) => {
  try {
    await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchItems()
  } catch (e) { console.error(e) }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

onMounted(fetchItems)
</script>
