<template>
  <div class="h-full flex flex-col bg-white dark:bg-neutral-900 font-sans">
    <!-- Top bar: mobile wraps; desktop stays single-row -->
    <div
      class="shrink-0 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-6 py-3 sm:py-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md z-10"
    >
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-neutral-800 dark:text-neutral-100">智能列表</h1>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
        <input
          v-model="newTopic"
          @keyup.enter="generateList"
          type="text"
          placeholder="输入主题，回车生成..."
          class="w-full sm:w-64 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
        />
        <button
          @click="generateList"
          :disabled="generating || !newTopic.trim()"
          class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full text-sm font-bold transition-all inline-flex items-center justify-center gap-2 shadow-lg active:scale-95 h-10 min-w-24"
        >
          <svg v-if="!generating" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" stroke-width="3" stroke-linecap="round" />
          </svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ generating ? '生成中...' : '生成' }}
        </button>
      </div>
    </div>

    <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
      <!-- Left list: becomes top section on mobile -->
      <div class="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-800 flex flex-col bg-neutral-50/50 dark:bg-black/10 overflow-hidden">
        <div class="p-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索列表..."
            class="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div class="flex-1 overflow-y-auto">
          <div
            v-for="list in filteredLists"
            :key="list.id"
            @click="selectList(list)"
            :class="
              activeList?.id === list.id
                ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50 border-transparent'
            "
            class="mx-2 mb-1 p-3 rounded-xl cursor-pointer border transition-all group relative"
          >
            <h3 class="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate pr-10">{{ list.topic }}</h3>
            <p class="text-xs text-neutral-400 mt-1">{{ list.item_count || 0 }} 个项目</p>
            <!-- On mobile keep delete always visible (no hover) -->
            <button
              @click.stop="deleteList(list.id)"
              class="absolute right-1 top-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-500 transition-all h-10 w-10 inline-flex items-center justify-center"
              aria-label="删除列表"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
          <div v-if="lists.length === 0" class="text-center py-8 text-neutral-400 text-sm">暂无列表，输入主题生成</div>
        </div>
      </div>

      <!-- Right detail -->
      <div class="flex-1 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden">
        <div v-if="activeList" class="h-full flex flex-col">
          <div class="p-4 sm:p-6 border-b border-neutral-50 dark:border-neutral-800">
            <h2 class="text-xl font-bold text-neutral-800 dark:text-neutral-100">{{ activeList.topic }}</h2>
            <p class="text-xs text-neutral-400 mt-1">{{ activeList.items?.length || 0 }} 个项目 · 点击星星收藏</p>
          </div>
          <div class="flex-1 overflow-y-auto p-3 sm:p-6">
            <div
              v-for="item in activeList.items"
              :key="item.id"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all group"
            >
              <button
                @click="toggleStar(item)"
                :class="item.starred ? 'text-yellow-400' : 'text-neutral-300 dark:text-neutral-600 hover:text-yellow-400'"
                class="transition-all h-10 w-10 inline-flex items-center justify-center"
                aria-label="收藏"
              >
                <svg class="w-5 h-5" :fill="item.starred ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
              <span class="flex-1 text-sm sm:text-base text-neutral-700 dark:text-neutral-200">{{ item.content }}</span>
              <button
                @click="deleteItem(item.id)"
                class="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-500 transition-all h-10 w-10 inline-flex items-center justify-center"
                aria-label="删除项目"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-600 space-y-4 p-6">
          <div class="w-20 h-20 bg-neutral-50 dark:bg-neutral-800/50 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <p class="text-sm">从上方选择一个列表或输入主题生成</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
const API_BASE = 'http://localhost:9701/api/apps/smartlist'

const lists = ref([])
const activeList = ref(null)
const searchQuery = ref('')
const newTopic = ref('')
const generating = ref(false)

const filteredLists = computed(() => {
  if (!searchQuery.value) return lists.value
  return lists.value.filter(l => l.topic?.toLowerCase().includes(searchQuery.value.toLowerCase()))
})
const fetchLists = async () => {
  try {
    const res = await fetch(`/list`)
    const data = await res.json()
    if (data?.success) lists.value = data.data
  } catch (e) {
    console.error(e)
  }
}

const selectList = async (list) => {
  try {
    const res = await fetch(`${API_BASE}/detail?id=${list.id}`)
    const data = await res.json()
    if (data.success) {
      activeList.value = data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const generateList = async () => {
  if (!newTopic.value.trim() || generating.value) return
  generating.value = true
  try {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: newTopic.value.trim() })
    })
    const data = await res.json()
    if (data.success) {
      await fetchLists()
      // 选中新创建的列表
      const newList = lists.value.find(l => l.topic === newTopic.value.trim())
      if (newList) {
        await selectList(newList)
      }
      newTopic.value = ''
    }
  } catch (e) {
    console.error(e)
  }
  generating.value = false
}

const toggleStar = async (item) => {
  try {
    await fetch(`${API_BASE}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id })
    })
    item.starred = !item.starred
    // 重新排序：星星的在前面
    activeList.value.items.sort((a, b) => b.starred - a.starred)
  } catch (e) {
    console.error(e)
  }
}

const deleteList = async (id) => {
  if (activeList.value?.id === id) activeList.value = null
  try {
    await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    await fetchLists()
  } catch (e) {
    console.error(e)
  }
}

const deleteItem = async (id) => {
  try {
    await fetch(`${API_BASE}/delete-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    activeList.value.items = activeList.value.items.filter(i => i.id !== id)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => fetchLists())
</script>
