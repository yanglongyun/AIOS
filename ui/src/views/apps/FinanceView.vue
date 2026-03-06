<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden bg-[#f9f5ef] font-['PingFang_SC',-apple-system,sans-serif] text-[#4a3f35]">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute inset-0 [background-image:repeating-linear-gradient(transparent,transparent_31px,#e8ddd0_31px,#e8ddd0_32px)] [background-position:0_100px] opacity-30"></div>
    </div>
    <div class="relative z-[1] flex shrink-0 items-end px-6 pb-2 pt-6">
      <h1 class="text-2xl font-extrabold text-[#5a4030]">{{ t('finance_title') }}</h1>
    </div>

    <div class="relative z-[1] flex shrink-0 gap-3 px-6 pb-5 pt-4">
      <div class="min-w-0 flex-1 rounded-2xl border-2 border-dashed border-[#b8d8b0] bg-[#f5faf3] p-4">
        <div class="text-[11px] font-medium text-[#a09080]">{{ t('finance_income') }}</div>
        <div class="mt-1 break-all font-mono text-[20px] font-extrabold leading-tight text-[#5a9a4a]">+{{ totalIncome.toLocaleString() }}</div>
      </div>
      <div class="min-w-0 flex-1 rounded-2xl border-2 border-dashed border-[#e8b8a0] bg-[#fdf5f0] p-4">
        <div class="text-[11px] font-medium text-[#a09080]">{{ t('finance_expense') }}</div>
        <div class="mt-1 break-all font-mono text-[20px] font-extrabold leading-tight text-[#c06040]">-{{ totalExpense.toLocaleString() }}</div>
      </div>
      <div class="min-w-0 flex-1 rounded-2xl border-2 border-dashed border-[#c0b8d8] bg-[#f5f3fa] p-4">
        <div class="text-[11px] font-medium text-[#a09080]">{{ t('finance_balance') }}</div>
        <div class="mt-1 break-all font-mono text-[20px] font-extrabold leading-tight text-[#6a5a8a]">{{ (totalIncome - totalExpense).toLocaleString() }}</div>
      </div>
    </div>

    <div class="relative z-[1] flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div v-if="items.length === 0" class="flex h-full flex-col items-center justify-center gap-2 text-[#c4b8a8]">
        <span class="text-4xl opacity-50">📒</span>
        <p class="text-sm">{{ t('finance_empty') }}</p>
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
            <div class="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] font-mono text-base font-bold" :class="item.type === 'income' ? 'bg-[#f0fef4] border-[#b8d8b8] text-[#5a9a4a]' : 'bg-[#fef9f0] border-[#e8d8c0] text-[#c06040]'">
              {{ item.type === 'income' ? '+' : '-' }}
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold">{{ item.note || (item.type === 'income' ? t('finance_income') : t('finance_expense')) }}</div>
              <div class="mt-px text-[11px] text-[#b8a898]">{{ formatTime(item.date) }}</div>
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
          :placeholder="t('finance_smart_placeholder')"
          @keyup.enter="smartFill"
          class="flex-1 rounded-xl border-[1.5px] border-dashed border-[#d4c8b8] bg-white px-4 py-3 text-sm text-[#4a3f35] outline-none transition-colors placeholder:text-[#c4b8a8] focus:border-solid focus:border-[#c09060]"
        />
        <button class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#5a4030] bg-transparent px-4 text-[13px] font-semibold text-[#5a4030] transition-colors hover:bg-[#f3ece2] disabled:cursor-not-allowed disabled:opacity-40" :disabled="smartFilling || !smartInput.trim()" @click="smartFill">
          <Zap v-if="!smartFilling" class="h-3.5 w-3.5" />
          {{ smartFilling ? t('finance_recognizing') : t('finance_smart_detect') }}
        </button>
      </div>

      <div class="flex items-center gap-1.5">
        <select v-model="newItem.type" class="w-[72px] rounded-[10px] border-[1.5px] border-[#e0d4c4] bg-white px-3 py-2.5 text-[13px] outline-none">
          <option value="expense">{{ t('finance_expense') }}</option>
          <option value="income">{{ t('finance_income') }}</option>
        </select>
        <input v-model="newItem.amount" type="number" :placeholder="t('finance_amount')" class="w-20 rounded-[10px] border-[1.5px] border-[#e0d4c4] bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-[#c4b8a8]" />
        <input v-model="newItem.note" :placeholder="t('finance_note')" @keyup.enter="add" class="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-[#e0d4c4] bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-[#c4b8a8]" />
        <button class="shrink-0 rounded-[10px] border-2 border-[#5a4030] bg-[#5a4030] px-3 py-2.5 text-[13px] font-semibold text-[#f5efe8] transition-all hover:bg-[#6a5040] hover:border-[#6a5040] disabled:cursor-not-allowed disabled:opacity-30" :disabled="!newItem.amount" @click="add">{{ t('common_save') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Zap } from 'lucide-vue-next'
import { useI18n } from '../../i18n/index.js';

const { t, locale } = useI18n();

const items = ref([])
const newItem = ref({ type: 'expense', amount: '', note: '' })
const smartInput = ref('')
const smartFilling = ref(false)
const error = ref('')
const API_BASE = '/apps/finance'

const totalIncome = computed(() => items.value.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0))
const totalExpense = computed(() => items.value.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0))

const groupedItems = computed(() => {
  const groups = {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000

  for (const item of items.value) {
    const d = new Date(item.date)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    let label
    if (dayStart === today) label = t('finance_today')
    else if (dayStart === yesterday) label = t('finance_yesterday')
    else label = locale.value === 'en'
      ? `${d.getMonth() + 1}/${d.getDate()}`
      : `${d.getMonth() + 1}月${d.getDate()}日`

    if (!groups[label]) groups[label] = { label, items: [] }
    groups[label].items.push(item)
  }
  return Object.values(groups)
})

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
  if (!newItem.value.amount) return
  error.value = ''
  try {
    await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem.value)
    })
    newItem.value = { type: 'expense', amount: '', note: '' }
    fetchItems()
  } catch (e) {
    error.value = e.message || t('finance_create_failed')
  }
}

const smartFill = async () => {
  const text = smartInput.value.trim()
  if (!text || smartFilling.value) return

  smartFilling.value = true
  error.value = ''
  try {
    const res = await fetch('/api/task/create/instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app: 'finance',
        title: t('finance_ai_title'),
        prompt: t('finance_ai_prompt'),
        schema: { required: ['type', 'amount', 'note'] },
        messages: [
          {
            role: 'system',
            content: t('finance_ai_json_hint')
          },
          {
            role: 'system',
            content: t('finance_ai_system_prompt')
          },
          { role: 'user', content: text }
        ]
      })
    })
    const data = await res.json()
    if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`)

    const parsed = JSON.parse(String(data.response || '{}'))
    const type = parsed.type === 'income' ? 'income' : 'expense'
    const amount = Number(parsed.amount)
    const note = String(parsed.note || '').trim()

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(t('finance_ai_incomplete'))
    }

    newItem.value = { type, amount: String(amount), note }
  } catch (e) {
    error.value = e.message || t('finance_ai_failed')
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
