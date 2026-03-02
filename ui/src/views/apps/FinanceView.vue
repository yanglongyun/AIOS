<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden bg-[#f9f5ef] font-['PingFang_SC',-apple-system,sans-serif] text-[#4a3f35]">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute inset-0 [background-image:repeating-linear-gradient(transparent,transparent_31px,#e8ddd0_31px,#e8ddd0_32px)] [background-position:0_100px] opacity-30"></div>
    </div>
    <div class="relative z-[1] flex shrink-0 items-end justify-between px-6 pb-2 pt-6">
      <h1 class="text-2xl font-extrabold italic text-[#5a4030]">记账本</h1>
      <span class="rounded-full bg-[#f0e8dd] px-3 py-1 text-xs text-[#b8a090]">{{ currentMonth }}</span>
    </div>

    <div class="relative z-[1] flex shrink-0 gap-3 px-6 pb-5 pt-4">
      <div class="flex-1 rounded-2xl border-2 border-dashed border-[#b8d8b0] bg-[#f5faf3] p-4">
        <div class="text-[11px] font-medium text-[#a09080]">收入</div>
        <div class="mt-1 font-mono text-[20px] font-extrabold text-[#5a9a4a]">+{{ totalIncome.toLocaleString() }}</div>
      </div>
      <div class="flex-1 rounded-2xl border-2 border-dashed border-[#e8b8a0] bg-[#fdf5f0] p-4">
        <div class="text-[11px] font-medium text-[#a09080]">支出</div>
        <div class="mt-1 font-mono text-[20px] font-extrabold text-[#c06040]">-{{ totalExpense.toLocaleString() }}</div>
      </div>
      <div class="flex-1 rounded-2xl border-2 border-dashed border-[#c0b8d8] bg-[#f5f3fa] p-4">
        <div class="text-[11px] font-medium text-[#a09080]">结余</div>
        <div class="mt-1 font-mono text-[20px] font-extrabold text-[#6a5a8a]">{{ (totalIncome - totalExpense).toLocaleString() }}</div>
      </div>
    </div>

    <div class="relative z-[1] flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div v-if="items.length === 0" class="flex h-full flex-col items-center justify-center gap-2 text-[#c4b8a8]">
        <span class="text-4xl opacity-50">📒</span>
        <p class="text-sm">暂无流水记录</p>
      </div>
      <template v-else>
        <template v-for="(group, gi) in groupedItems" :key="gi">
          <div class="flex items-center gap-2 py-[14px] pb-[6px] text-[13px] font-bold text-[#c09060]">
            <span>{{ group.label }}</span>
            <span class="h-px flex-1 bg-[#e0d4c4]" />
          </div>

          <div
            v-for="item in group.items"
            :key="item.id"
            class="group flex items-center border-b border-b-[dotted] border-b-[#e0d8cc] py-3 last:border-b-0"
          >
            <div class="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] text-base" :class="getCategoryClass(item.category)">
              {{ getCategoryEmoji(item.category) }}
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold">{{ item.note || item.category }}</div>
              <div class="mt-px text-[11px] text-[#b8a898]">{{ item.category }} · {{ formatTime(item.date) }}</div>
            </div>
            <div class="font-mono text-[15px] font-bold" :class="item.type === 'income' ? 'text-[#5a9a4a]' : 'text-[#4a3f35]'">
              {{ item.type === 'income' ? '+' : '-' }}{{ item.amount.toLocaleString() }}
            </div>
            <button class="ml-2 border-none bg-transparent text-sm text-[#d0c0b0] opacity-0 transition-all group-hover:opacity-100 hover:text-[#c06040]" @click="remove(item.id)">×</button>
          </div>
        </template>
      </template>
    </div>

    <div v-if="error" class="relative z-[1] mx-6 mb-2 shrink-0 rounded-lg border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">{{ error }}</div>

    <div class="relative z-[1] shrink-0 border-t-2 border-[#e0d4c4] bg-[#f0e8dd] px-6 pb-6 pt-3">
      <div class="mb-2.5 flex gap-2">
        <input
          v-model="smartInput"
          placeholder="说句话记账：午饭花了58块"
          @keyup.enter="smartFill"
          class="flex-1 rounded-xl border-[1.5px] border-dashed border-[#d4c8b8] bg-white px-4 py-3 text-sm text-[#4a3f35] outline-none transition-colors placeholder:text-[#c4b8a8] focus:border-solid focus:border-[#c09060]"
        />
        <button class="whitespace-nowrap rounded-xl bg-[#5a4030] px-4 text-[13px] font-semibold text-[#f5efe8] transition-colors hover:bg-[#6a5040] disabled:cursor-not-allowed disabled:opacity-40" :disabled="smartFilling || !smartInput.trim()" @click="smartFill">
          {{ smartFilling ? '识别中...' : '✨ 智能识别' }}
        </button>
      </div>

      <div class="flex items-center gap-1.5">
        <select v-model="newItem.type" class="w-[72px] rounded-[10px] border-[1.5px] border-[#e0d4c4] bg-white px-3 py-2.5 text-[13px] outline-none">
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
        <input v-model="newItem.amount" type="number" placeholder="金额" class="w-20 rounded-[10px] border-[1.5px] border-[#e0d4c4] bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-[#c4b8a8]" />
        <input v-model="newItem.category" placeholder="分类" class="w-20 rounded-[10px] border-[1.5px] border-[#e0d4c4] bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-[#c4b8a8]" />
        <input v-model="newItem.note" placeholder="备注" @keyup.enter="add" class="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-[#e0d4c4] bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-[#c4b8a8]" />
        <button class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-2 border-[#5a4030] bg-transparent text-xl text-[#5a4030] transition-all hover:bg-[#5a4030] hover:text-[#f5efe8] disabled:cursor-not-allowed disabled:opacity-30" :disabled="!newItem.amount || !newItem.category" @click="add">+</button>
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
const error = ref('')
const API_BASE = 'http://localhost:9701/api/apps/finance'

const totalIncome = computed(() => items.value.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0))
const totalExpense = computed(() => items.value.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0))

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`
})

const groupedItems = computed(() => {
  const groups = {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000

  for (const item of items.value) {
    const d = new Date(item.date)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    let label
    if (dayStart === today) label = '今天'
    else if (dayStart === yesterday) label = '昨天'
    else label = `${d.getMonth() + 1}月${d.getDate()}日`

    if (!groups[label]) groups[label] = { label, items: [] }
    groups[label].items.push(item)
  }
  return Object.values(groups)
})

const emojiMap = {
  '餐饮': '🍜', '午餐': '🍜', '晚餐': '🍱', '早餐': '🥐',
  '交通': '🚇', '出行': '🚇',
  '饮品': '☕', '咖啡': '☕', '奶茶': '🧋',
  '购物': '🛒', '生活': '🛒',
  '收入': '💰', '工资': '💰', '奖金': '💰',
  '娱乐': '🎮', '游戏': '🎮',
  '医疗': '💊', '教育': '📚', '通讯': '📱', '住房': '🏠',
}

const classMap = {
  '餐饮': 'bg-[#fef9f0] border-[#e8d8c0]', '午餐': 'bg-[#fef9f0] border-[#e8d8c0]', '晚餐': 'bg-[#fef9f0] border-[#e8d8c0]', '早餐': 'bg-[#fef9f0] border-[#e8d8c0]',
  '交通': 'bg-[#f0f6fe] border-[#c0d4e8]', '出行': 'bg-[#f0f6fe] border-[#c0d4e8]',
  '饮品': 'bg-[#fef0f4] border-[#e8c0cc]', '咖啡': 'bg-[#fef0f4] border-[#e8c0cc]', '奶茶': 'bg-[#fef0f4] border-[#e8c0cc]',
  '收入': 'bg-[#f0fef4] border-[#b8d8b8]', '工资': 'bg-[#f0fef4] border-[#b8d8b8]', '奖金': 'bg-[#f0fef4] border-[#b8d8b8]',
  '购物': 'bg-[#f8f0fe] border-[#d0c0e8]',
  '生活': 'bg-[#f0fefe] border-[#b8d8d8]', '医疗': 'bg-[#f0fefe] border-[#b8d8d8]', '教育': 'bg-[#f0fefe] border-[#b8d8d8]', '通讯': 'bg-[#f0fefe] border-[#b8d8d8]', '住房': 'bg-[#f0fefe] border-[#b8d8d8]',
  '娱乐': 'bg-[#fef0fe] border-[#d8b8d8]', '游戏': 'bg-[#fef0fe] border-[#d8b8d8]'
}

const getCategoryEmoji = (cat) => emojiMap[cat] || '📝'
const getCategoryClass = (cat) => classMap[cat] || 'bg-[#f0fefe] border-[#b8d8d8]'

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const fetchItems = async () => {
  try {
    const res = await fetch(`${API_BASE}/list`)
    const result = await res.json()
    items.value = (result.data || []).reverse()
  } catch (e) { console.error(e) }
}

const add = async () => {
  if (!newItem.value.amount || !newItem.value.category) return
  error.value = ''
  try {
    await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem.value)
    })
    newItem.value = { type: 'expense', amount: '', category: '', note: '' }
    fetchItems()
  } catch (e) {
    error.value = e.message || '记录失败'
  }
}

const smartFill = async () => {
  const text = smartInput.value.trim()
  if (!text || smartFilling.value) return

  smartFilling.value = true
  error.value = ''
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
    error.value = e.message || '智能填充失败'
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

onMounted(fetchItems)
</script>
