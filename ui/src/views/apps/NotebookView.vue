<template>
  <div class="h-full flex flex-col bg-white dark:bg-neutral-900 font-sans">
    <div class="h-16 shrink-0 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md z-10">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-neutral-800 dark:text-neutral-100">记事本</h1>
      </div>
      <button @click="createNewNote" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg active:scale-95">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-width="3" stroke-linecap="round"/></svg>
        新建笔记
      </button>
    </div>
    <div class="flex-1 flex overflow-hidden">
      <div class="w-72 shrink-0 border-r border-neutral-100 dark:border-neutral-800 flex flex-col bg-neutral-50/50 dark:bg-black/10">
        <div class="p-3">
          <input v-model="searchQuery" type="text" placeholder="搜索内容..." class="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-for="note in filteredNotes" :key="note.id" 
               @click="activeNote = note"
               :class="activeNote?.id === note.id ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50 border-transparent'"
               class="mx-2 mb-1 p-3 rounded-xl cursor-pointer border transition-all group relative">
            <h3 class="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate pr-6">{{ getTitle(note.content) }}</h3>
            <p class="text-xs text-neutral-400 mt-1 line-clamp-1 italic">{{ getContent(note.content) }}</p>
            <button @click.stop="deleteNote(note.id)" class="absolute right-2 top-3 opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="flex-1 flex flex-col bg-white dark:bg-neutral-900">
        <div v-if="activeNote" class="h-full flex flex-col">
          <div class="p-8 flex-1">
            <textarea v-model="activeNote.content" 
                  @input="debouncedUpdate"
                  class="w-full h-full bg-transparent border-none outline-none resize-none text-neutral-700 dark:text-neutral-200 text-lg leading-relaxed placeholder-neutral-300 dark:placeholder-neutral-700" 
                  placeholder="在这里输入内容，第一行会自动变为标题..."
                  autofocus></textarea>
          </div>
          <div class="px-8 py-3 border-t border-neutral-50 dark:border-neutral-800 flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
            <span>字符数: {{ activeNote.content?.length || 0 }}</span>
            <span>{{ saving ? '正在保存...' : '已自动保存' }}</span>
          </div>
        </div>
        <div v-else class="flex-1 flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-600 space-y-4">
          <div class="w-20 h-20 bg-neutral-50 dark:bg-neutral-800/50 rounded-full flex items-center justify-center italic text-4xl">?</div>
          <p class="text-sm">点击上方蓝色"新建笔记"按钮开始</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
const notes = ref([])
const activeNote = ref(null)
const searchQuery = ref('')
const saving = ref(false)
let timer = null
const API_BASE = 'http://localhost:9701/api/apps/notebook'
const fetchNotes = async (selectId = null) => {
  try {
    const res = await fetch(`${API_BASE}/list`)
    notes.value = await res.json()
    if (selectId) {
      const found = notes.value.find(n => n.id === selectId)
      if (found) activeNote.value = found
    }
  } catch (e) { console.error(e) }
}
const filteredNotes = computed(() => {
  if (!searchQuery.value) return notes.value
  return notes.value.filter(n => n.content?.toLowerCase().includes(searchQuery.value.toLowerCase()))
})
const getTitle = (content) => {
  if (!content || !content.trim()) return '新笔记'
  return content.trim().split('\n')[0].substring(0, 20)
}
const getContent = (content) => {
  if (!content || !content.trim()) return '暂无内容...'
  const lines = content.trim().split('\n')
  return lines.length > 1 ? lines.slice(1).join(' ').substring(0, 40) : '...'
}
const createNewNote = async () => {
  try {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' })
    })
    const result = await res.json()
    const newId = result?.id
    await fetchNotes(newId)
  } catch (e) { console.error(e) }
}
const debouncedUpdate = () => {
  if (!activeNote.value) return
  saving.value = true
  clearTimeout(timer)
  timer = setTimeout(async () => {
    try {
      await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeNote.value.id, content: activeNote.value.content })
      })
      saving.value = false
    } catch (e) { console.error(e) }
  }, 500)
}
const deleteNote = async (id) => {
  if (activeNote.value?.id === id) activeNote.value = null
  try {
    await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    await fetchNotes()
  } catch (e) { console.error(e) }
}
onMounted(() => fetchNotes())
</script>
<style scoped>
.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
</style>
