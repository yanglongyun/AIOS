<template>
  <div class="h-full flex flex-col bg-white dark:bg-neutral-900">
    <!-- 顶部工具栏 -->
    <div class="h-16 shrink-0 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-6 bg-neutral-50/50 dark:bg-neutral-800/20 backdrop-blur-sm">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100 italic">Notes.</h1>
        <div class="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 mx-2"></div>
        <span class="text-xs text-neutral-400 font-mono uppercase tracking-widest">{{ activeNote ? 'Editing' : 'All Notes' }}</span>
      </div>
      <button @click="createNewNote" class="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-80 transition-all flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-width="2.5" stroke-linecap="round"/></svg>
        新建
      </button>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧列表 -->
      <div class="w-80 shrink-0 border-r border-neutral-100 dark:border-neutral-800 flex flex-col bg-neutral-50/30 dark:bg-transparent">
        <div class="p-4">
          <input v-model="searchQuery" type="text" placeholder="搜索笔记..." class="w-full bg-neutral-200/50 dark:bg-neutral-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-neutral-400 outline-none transition-all" />
        </div>
        <div class="flex-1 overflow-y-auto px-3 space-y-1 pb-10">
          <div v-for="note in filteredNotes" :key="note.id" 
               @click="selectNote(note)"
               :class="activeNote?.id === note.id ? 'bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700' : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/50'"
               class="p-4 rounded-2xl cursor-pointer border transition-all duration-200 group relative">
            <h3 class="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate pr-6">{{ note.title || '无标题' }}</h3>
            <p class="text-xs text-neutral-400 mt-1 line-clamp-1 leading-relaxed">{{ note.content || '暂无内容...' }}</p>
            <p class="text-[10px] text-neutral-300 dark:text-neutral-600 mt-2 font-mono uppercase">{{ formatDate(note.updated_at || note.created_at) }}</p>
            <button @click.stop="deleteNote(note.id)" class="absolute right-3 top-4 opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-rose-500 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧编辑器 -->
      <div class="flex-1 flex flex-col bg-white dark:bg-neutral-900 relative">
        <template v-if="activeNote">
          <div class="px-10 py-8 flex-1 overflow-y-auto">
            <input v-model="activeNote.title" 
                   @input="debouncedUpdate"
                   type="text" 
                   class="w-full text-4xl font-black bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-100 placeholder-neutral-200 dark:placeholder-neutral-800 mb-6 tracking-tight" 
                   placeholder="标题" />
            <textarea v-model="activeNote.content" 
                  @input="debouncedUpdate"
                  class="w-full h-[calc(100%-80px)] bg-transparent border-none outline-none resize-none text-neutral-600 dark:text-neutral-300 text-lg leading-relaxed placeholder-neutral-100 dark:placeholder-neutral-800/50" 
                  placeholder="开始写作..."></textarea>
          </div>
          <div class="absolute bottom-6 right-8 text-[10px] font-mono text-neutral-300 bg-white/80 dark:bg-neutral-900/80 px-2 py-1 rounded backdrop-blur-sm uppercase tracking-widest">
            {{ saving ? 'Saving...' : 'Draft saved' }}
          </div>
        </template>
        <template v-else>
          <div class="flex-1 flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-700 select-none">
            <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-width="1.5" stroke-linecap="round"/></svg>
            <p class="text-sm tracking-widest uppercase">选择一条笔记开始</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

const notes = ref([])
const activeNote = ref(null)
const searchQuery = ref('')
const saving = ref(false)
let timer = null

const API_BASE = 'http://localhost:9701/api/apps/notebook'

const fetchNotes = async () => {
  try {
    const res = await fetch(`${API_BASE}/list`)
    const result = await res.json()
    notes.value = (result.data || []).sort((a,b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
  } catch (e) { console.error(e) }
}

const filteredNotes = computed(() => {
  if (!searchQuery.value) return notes.value
  return notes.value.filter(n => 
    n.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    n.content?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const selectNote = (note) => {
  activeNote.value = { ...note } // Clone to avoid direct mutations
}

const createNewNote = async () => {
  try {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', content: '' })
    })
    await fetchNotes()
    const result = await res.json(); if (result.success && result.data) { await fetchNotes(); const newNote = notes.value.find(n => n.id === result.data.id); if (newNote) selectNote(newNote); } else { await fetchNotes(); if (notes.value.length > 0) selectNote(notes.value[0]); }
  } catch (e) { console.error(e) }
}

const debouncedUpdate = () => {
  saving.value = true
  clearTimeout(timer)
  timer = setTimeout(async () => {
    try {
      await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeNote.value.id,
          title: activeNote.value.title,
          content: activeNote.value.content
        })
      })
      await fetchNotes()
      // Keep track of the updated note in the list without re-selecting to avoid focus loss
      saving.value = false
    } catch (e) { console.error(e) }
  }, 1000)
}

const deleteNote = async (id) => {
  if (activeNote.value?.id === id) activeNote.value = null
  try {
    await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchNotes()
  } catch (e) { console.error(e) }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getMonth()+1}/${d.getDate()}`
}

onMounted(fetchNotes)
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>
