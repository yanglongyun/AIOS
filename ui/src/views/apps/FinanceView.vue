<template>
  <div class="fin-root">

    <!-- 顶部 -->
    <div class="fin-header">
      <h1>记账本</h1>
      <span class="fin-date-tag">{{ currentMonth }}</span>
    </div>

    <!-- 统计卡片 -->
    <div class="fin-balance">
      <div class="fin-box income-box">
        <div class="fin-box-label">收入</div>
        <div class="fin-box-value">+{{ totalIncome.toLocaleString() }}</div>
      </div>
      <div class="fin-box expense-box">
        <div class="fin-box-label">支出</div>
        <div class="fin-box-value">-{{ totalExpense.toLocaleString() }}</div>
      </div>
      <div class="fin-box net-box">
        <div class="fin-box-label">结余</div>
        <div class="fin-box-value">{{ (totalIncome - totalExpense).toLocaleString() }}</div>
      </div>
    </div>

    <!-- 流水列表 -->
    <div class="fin-scroll">
      <div v-if="items.length === 0" class="fin-empty">
        <span class="fin-empty-icon">📒</span>
        <p>暂无流水记录</p>
      </div>
      <template v-else>
        <template v-for="(group, gi) in groupedItems" :key="gi">
          <div class="fin-day-label">{{ group.label }}</div>
          <div
            v-for="item in group.items" :key="item.id"
            class="fin-tx-item"
          >
            <div class="fin-tx-tag" :class="getCategoryClass(item.category)">
              {{ getCategoryEmoji(item.category) }}
            </div>
            <div class="fin-tx-info">
              <div class="fin-tx-name">{{ item.note || item.category }}</div>
              <div class="fin-tx-meta">{{ item.category }} · {{ formatTime(item.date) }}</div>
            </div>
            <div class="fin-tx-amount" :class="item.type === 'income' ? 'up' : 'down'">
              {{ item.type === 'income' ? '+' : '-' }}{{ item.amount.toLocaleString() }}
            </div>
            <button class="fin-tx-del" @click="remove(item.id)">×</button>
          </div>
        </template>
      </template>
    </div>

    <!-- 错误 -->
    <div v-if="error" class="fin-error">{{ error }}</div>

    <!-- 底部输入 -->
    <div class="fin-input-bar">
      <div class="fin-smart-row">
        <input
          v-model="smartInput"
          placeholder="说句话记账：午饭花了58块"
          @keyup.enter="smartFill"
        />
        <button class="fin-btn-smart" :disabled="smartFilling || !smartInput.trim()" @click="smartFill">
          {{ smartFilling ? '识别中...' : '✨ 智能识别' }}
        </button>
      </div>
      <div class="fin-form-row">
        <select v-model="newItem.type">
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
        <input v-model="newItem.amount" type="number" placeholder="金额" class="fin-input-amount" />
        <input v-model="newItem.category" placeholder="分类" class="fin-input-cat" />
        <input v-model="newItem.note" placeholder="备注" @keyup.enter="add" />
        <button class="fin-btn-add" :disabled="!newItem.amount || !newItem.category" @click="add">+</button>
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

// 按日期分组
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
  '餐饮': 'food', '午餐': 'food', '晚餐': 'food', '早餐': 'food',
  '交通': 'transport', '出行': 'transport',
  '饮品': 'drink', '咖啡': 'drink', '奶茶': 'drink',
  '购物': 'shopping', '生活': 'life',
  '收入': 'income', '工资': 'income', '奖金': 'income',
  '娱乐': 'fun', '游戏': 'fun',
  '医疗': 'life', '教育': 'life', '通讯': 'life', '住房': 'life',
}

const getCategoryEmoji = (cat) => emojiMap[cat] || '📝'
const getCategoryClass = (cat) => classMap[cat] || 'life'

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

<style scoped>
.fin-root {
  font-family: 'PingFang SC', -apple-system, sans-serif;
  background: #f9f5ef;
  color: #4a3f35;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 纸张纹理 */
.fin-root::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: repeating-linear-gradient(
    transparent,
    transparent 31px,
    #e8ddd0 31px,
    #e8ddd0 32px
  );
  background-position: 0 100px;
  pointer-events: none;
  opacity: 0.3;
}

/* 顶部 */
.fin-header {
  padding: 24px 24px 8px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.fin-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #5a4030;
  font-style: italic;
}
.fin-date-tag {
  font-size: 12px;
  color: #b8a090;
  background: #f0e8dd;
  padding: 4px 12px;
  border-radius: 20px;
}

/* 统计 */
.fin-balance {
  padding: 16px 24px 20px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.fin-balance .fin-box {
  display: inline-flex;
  flex-direction: column;
}
.fin-balance {
  display: flex;
  gap: 12px;
}
.fin-box {
  flex: 1;
  padding: 16px;
  border-radius: 16px;
  border: 2px dashed;
}
.fin-box.income-box { border-color: #b8d8b0; background: #f5faf3; }
.fin-box.expense-box { border-color: #e8b8a0; background: #fdf5f0; }
.fin-box.net-box { border-color: #c0b8d8; background: #f5f3fa; }
.fin-box-label {
  font-size: 11px;
  color: #a09080;
  font-weight: 500;
}
.fin-box-value {
  font-size: 20px;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  margin-top: 4px;
}
.fin-box.income-box .fin-box-value { color: #5a9a4a; }
.fin-box.expense-box .fin-box-value { color: #c06040; }
.fin-box.net-box .fin-box-value { color: #6a5a8a; }

/* 流水 */
.fin-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 16px;
  position: relative;
  z-index: 1;
}
.fin-scroll::-webkit-scrollbar { width: 0; }

.fin-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c4b8a8;
  gap: 8px;
}
.fin-empty-icon { font-size: 36px; opacity: 0.5; }
.fin-empty p { font-size: 14px; }

.fin-day-label {
  font-size: 13px;
  font-weight: 700;
  color: #c09060;
  padding: 14px 0 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.fin-day-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0d4c4;
}

.fin-tx-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dotted #e0d8cc;
  cursor: default;
}
.fin-tx-item:last-child { border-bottom: none; }

.fin-tx-tag {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
  border: 1.5px solid;
}
.fin-tx-tag.food { background: #fef9f0; border-color: #e8d8c0; }
.fin-tx-tag.transport { background: #f0f6fe; border-color: #c0d4e8; }
.fin-tx-tag.drink { background: #fef0f4; border-color: #e8c0cc; }
.fin-tx-tag.income { background: #f0fef4; border-color: #b8d8b8; }
.fin-tx-tag.shopping { background: #f8f0fe; border-color: #d0c0e8; }
.fin-tx-tag.life { background: #f0fefe; border-color: #b8d8d8; }
.fin-tx-tag.fun { background: #fef0fe; border-color: #d8b8d8; }

.fin-tx-info { flex: 1; }
.fin-tx-name { font-size: 14px; font-weight: 600; }
.fin-tx-meta { font-size: 11px; color: #b8a898; margin-top: 1px; }

.fin-tx-amount {
  font-size: 15px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}
.fin-tx-amount.up { color: #5a9a4a; }
.fin-tx-amount.down { color: #4a3f35; }

.fin-tx-del {
  margin-left: 8px;
  opacity: 0;
  border: none; background: none;
  cursor: pointer; color: #d0c0b0;
  font-size: 14px;
  transition: all 0.15s;
}
.fin-tx-item:hover .fin-tx-del { opacity: 1; }
.fin-tx-del:hover { color: #c06040; }

/* 错误 */
.fin-error {
  flex-shrink: 0;
  margin: 0 24px 8px;
  font-size: 12px;
  color: #c06040;
  background: #fdf5f0;
  border: 1px dashed #e8b8a0;
  border-radius: 8px;
  padding: 8px 12px;
  position: relative;
  z-index: 1;
}

/* 底部输入 */
.fin-input-bar {
  flex-shrink: 0;
  padding: 12px 24px 24px;
  background: #f0e8dd;
  border-top: 2px solid #e0d4c4;
  position: relative;
  z-index: 1;
}
.fin-smart-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.fin-smart-row input {
  flex: 1;
  padding: 12px 16px;
  background: #fff;
  border: 1.5px dashed #d4c8b8;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  color: #4a3f35;
  font-family: inherit;
  transition: border 0.15s;
}
.fin-smart-row input::placeholder { color: #c4b8a8; }
.fin-smart-row input:focus { border-style: solid; border-color: #c09060; }
.fin-btn-smart {
  padding: 0 16px;
  background: #5a4030;
  color: #f5efe8;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.fin-btn-smart:hover { background: #6a5040; }
.fin-btn-smart:disabled { opacity: 0.4; cursor: not-allowed; }

.fin-form-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.fin-form-row select,
.fin-form-row input {
  padding: 10px 12px;
  background: #fff;
  border: 1.5px solid #e0d4c4;
  border-radius: 10px;
  font-size: 13px;
  outline: none;
  color: #4a3f35;
  font-family: inherit;
}
.fin-form-row select { width: 72px; }
.fin-form-row input { flex: 1; min-width: 0; }
.fin-form-row input::placeholder { color: #c4b8a8; }
.fin-input-amount { max-width: 80px; }
.fin-input-cat { max-width: 80px; }

.fin-btn-add {
  width: 38px; height: 38px;
  border: 2px solid #5a4030;
  border-radius: 50%;
  background: transparent; color: #5a4030;
  font-size: 20px; cursor: pointer;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.fin-btn-add:hover { background: #5a4030; color: #f5efe8; }
.fin-btn-add:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
