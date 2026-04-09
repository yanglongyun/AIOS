<template>
  <div class="flex h-full flex-col bg-[#dfdfdf] text-[#000] font-sans" style="font-family: 'MS Sans Serif', Tahoma, sans-serif; font-size: 12px; -webkit-font-smoothing: none;">
    
    <!-- Menu Bar -->
    <div class="flex items-center space-x-3 px-1 py-1 border-b border-[#dfdfdf] shadow-[0_1px_0_#fff]">
      <span class="px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-default text-[#000]"><span class="underline underline-offset-1">F</span>ile</span>
      <span class="px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-default text-[#000]"><span class="underline underline-offset-1">E</span>dit</span>
      <span class="px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-default text-[#000]"><span class="underline underline-offset-1">V</span>iew</span>
      <span class="px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-default text-[#000]">F<span class="underline underline-offset-1">a</span>vorites</span>
      <span class="px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-default text-[#000]"><span class="underline underline-offset-1">H</span>elp</span>
    </div>

    <!-- Toolbar: Home | History | Favorites | [address bar] | Go | ★ -->
    <div class="flex items-center px-1 py-1 gap-1 border-b border-[#808080] shadow-[0_1px_0_#fff]">
      <button class="win95-btn px-2 py-1 flex items-center gap-1 text-[#000]" @click="goHome" title="Home"><span class="text-[14px] leading-[14px]">🏠</span> Home</button>
      <div class="h-5 w-px bg-[#808080] border-r border-[#fff] mx-0.5"></div>
      <button class="win95-btn px-2 py-1 flex items-center gap-1" :class="sidePanel==='history' ? 'win95-btn-active text-[#000]' : 'text-[#000]'" @click="togglePanel('history')"><span class="text-[14px] leading-[14px]">🕒</span> History</button>
      <button class="win95-btn px-2 py-1 flex items-center gap-1" :class="sidePanel==='favorites' ? 'win95-btn-active text-[#000]' : 'text-[#000]'" @click="togglePanel('favorites')"><span class="text-[14px] leading-[14px]">⭐</span> Favorites</button>
      <div class="h-5 w-px bg-[#808080] border-r border-[#fff] mx-0.5"></div>
      <!-- Address Bar -->
      <div class="flex-1 bg-white border-t border-l border-[#808080] border-r border-b border-[#dfdfdf] flex items-center px-1.5 h-6 shadow-[inset_1px_1px_0_#000]">
        <img v-if="activeNode" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23000080' d='M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12z'/%3E%3C/svg%3E" class="w-3 h-3 mr-1 opacity-70 shrink-0" />
        <input v-model="startQuery" @keydown.enter="jump(startQuery, null)" class="w-full h-full outline-none text-[12px] bg-transparent text-[#000]" placeholder="__T_WT_START_PLACEHOLDER__" />
      </div>
      <button @click="jump(startQuery, null)" class="win95-btn px-3 py-0.5 text-[#000]">__T_WT_EXPLORE__</button>
      <button class="win95-btn px-2 py-1 flex items-center gap-1 text-[#000]" :class="{'opacity-40': !activeNode}" @click="regenerate" :disabled="!activeNode" title="Refresh/Regenerate"><span class="text-[14px] leading-[14px]">🔄</span></button>
      <div class="h-5 w-px bg-[#808080] border-r border-[#fff] mx-0.5"></div>
      <button class="win95-btn px-2 py-1 flex items-center gap-1 text-[#000]" :class="isCurrentFavorited ? 'win95-btn-active' : ''" @click="toggleFavorite" :disabled="!activeNode" :title="isCurrentFavorited ? 'Remove from Favorites' : 'Add to Favorites'">
        <span class="text-[14px] leading-[14px]">{{ isCurrentFavorited ? '★' : '☆' }}</span>
      </button>
    </div>

    <!-- Content Area Split -->
    <div class="flex-1 overflow-hidden flex relative p-1 pb-0 bg-[#dfdfdf]">
      
      <!-- Side Panel (History or Favorites) LEFT -->
      <div v-show="sidePanel" class="w-64 bg-[#dfdfdf] flex flex-col mr-1 h-full border-r border-[#808080]">
         <div class="bg-[#000080] text-white px-2 py-0.5 font-bold flex items-center justify-between">
           <span class="flex-1 text-[11px] uppercase tracking-wide">
             {{ sidePanel === 'history' ? '__T_WT_HISTORY_TREE__' : 'Favorites' }}
           </span>
           <button @click="sidePanel=null" class="bg-[#dfdfdf] text-[#000] px-1 border-t border-l border-[#fff] border-b border-r border-[#808080] shadow-[inset_-1px_-1px_0_#000] text-[10px] my-0.5 leading-none">X</button>
         </div>
         <!-- History list -->
         <div v-if="sidePanel==='history'" class="flex-1 overflow-y-auto p-1.5 bg-white m-1 border-t border-l border-[#808080] border-r border-b border-[#dfdfdf] shadow-[inset_1px_1px_0_#000]">
           <div v-if="!nodes.length" class="text-[#808080] text-center mt-4">__T_WT_EMPTY__</div>
           <div class="space-y-0.5 flex flex-col">
              <button v-for="node in nodes" :key="node.id" @click="loadNode(node.id)" class="text-left px-1.5 py-1 hover:bg-[#000080] hover:text-white truncate cursor-default flex items-center gap-1.5 border border-transparent" :class="activeNode?.id === node.id ? 'bg-[#000080] text-white' : 'text-[#000]'">
                <span class="opacity-70 shrink-0">📄</span> {{ node.title }}
              </button>
           </div>
         </div>
         <!-- Favorites list -->
         <div v-if="sidePanel==='favorites'" class="flex-1 overflow-y-auto p-1.5 bg-white m-1 border-t border-l border-[#808080] border-r border-b border-[#dfdfdf] shadow-[inset_1px_1px_0_#000]">
           <div v-if="!favorites.length" class="text-[#808080] text-center mt-4">No favorites yet</div>
           <div class="space-y-0.5 flex flex-col">
              <div v-for="fav in favorites" :key="fav.id" class="flex items-center gap-1 group">
                <button @click="loadNode(fav.node_id)" class="flex-1 text-left px-1.5 py-1 hover:bg-[#000080] hover:text-white truncate cursor-default flex items-center gap-1.5 border border-transparent" :class="activeNode?.id === fav.node_id ? 'bg-[#000080] text-white' : 'text-[#000]'">
                  <span class="opacity-70 shrink-0">⭐</span> {{ fav.title }}
                </button>
                <button @click="deleteFavorite(fav.id)" class="shrink-0 px-1 text-[#808080] hover:text-red-600 opacity-0 group-hover:opacity-100 text-[10px]">✕</button>
              </div>
           </div>
         </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 overflow-y-auto bg-white border-t border-l border-[#808080] border-r border-b border-[#dfdfdf] shadow-[inset_1px_1px_0_#000]" relative ref="scrollContainer">
        
        <div v-if="loading" class="flex flex-col items-center justify-center p-20 text-[#000] h-full relative font-sans">
           <div class="ie-progress mb-2"></div>
           <div class="text-[12px] font-bold tracking-wide">__T_WT_GENERATING__ {{ currentTitle }}...</div>
        </div>
        
        <div v-else-if="!activeNode" class="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-4">
           <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23000080' d='M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12z'/%3E%3C/svg%3E" class="w-16 h-16 opacity-80 mb-2" />
           <h2 class="text-xl font-bold font-sans">__T_WT_WELCOME__</h2>
           <p class="text-[#000] leading-relaxed">__T_WT_DESC__</p>
           <div class="text-left border border-[#808080] bg-[#ffffe1] p-2 text-[11px] shadow-[1px_1px_0_#fff] mt-4 w-full">
              💡 Hint: Try searching for "Roman Empire", "Quantum Computing", or "Dinosaur Extinction"
           </div>
        </div>
        
        <div v-else class="max-w-3xl mx-auto p-6 md:p-10 pb-20">
           <h1 class="text-3xl font-bold mb-4 pb-2 border-b-2 border-[#dfdfdf] text-[#000]" style="font-family: 'Times New Roman', Times, serif;">{{ activeNode.title }}</h1>
           <div class="prose max-w-none prose-p:my-4 prose-a:text-[#0000ff] prose-a:underline hover:prose-a:text-[#ff0000] text-[#000] leading-relaxed article-content" style="font-family: 'Times New Roman', Times, serif; font-size: 16px;" v-html="renderContent(activeNode.content)" @click="handleLinkClick"></div>
        </div>

      </div>
    </div>
    
    <!-- Status Bar -->
    <div class="h-6 shrink-0 bg-[#dfdfdf] border-t border-[#dfdfdf] shadow-[inset_0_1px_0_#fff] flex items-center px-1 py-0.5 gap-1 text-[11px] text-[#000]">
      <div class="flex-1 border-t border-l border-[#808080] border-b border-r border-[#fff] px-2 flex items-center shadow-[inset_1px_1px_0_#000]">
        Done
      </div>
      <div class="w-48 border-t border-l border-[#808080] border-b border-r border-[#fff] px-2 flex items-center shadow-[inset_1px_1px_0_#000]">
        <span v-if="loading" class="flex items-center gap-1 font-bold">Downloading picture...</span>
        <span v-else class="flex items-center gap-1"><span class="w-3 h-3 bg-blue-700 inline-block border border-[#808080]"></span> Local Intranet</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { marked } from 'marked';
import { LOCALE } from '../../locale.js';
marked.setOptions({ breaks: true, gfm: true });

const showTree = ref(false); // kept for compat but replaced by sidePanel
const sidePanel = ref(null); // 'history' | 'favorites' | null
const loading = ref(false);
const activeNode = ref(null);
const currentTitle = ref('');
const startQuery = ref('');
const nodes = ref([]);
const favorites = ref([]);
const trace = ref(JSON.parse(localStorage.getItem('wt_trace') || '[]'));
const scrollContainer = ref(null);

const isCurrentFavorited = computed(() => activeNode.value && favorites.value.some(f => f.node_id === activeNode.value.id));

watch(trace, (val) => { localStorage.setItem('wt_trace', JSON.stringify(val)); }, { deep: true });

const api = async (p, o) => {
  const r = await fetch(`/aios/apps/wikitree/${p}`, o);
  return r.json();
};

const loadNodes = async () => {
  try {
    const res = await api('list');
    nodes.value = res.nodes || [];
  } catch {}
};

const loadFavorites = async () => {
  try {
    const res = await api('favorites');
    favorites.value = res.favorites || [];
  } catch {}
};

const togglePanel = (panel) => {
  sidePanel.value = sidePanel.value === panel ? null : panel;
};

const goHome = () => {
  activeNode.value = null;
  startQuery.value = '';
};

const toggleFavorite = async () => {
  if (!activeNode.value) return;
  const existing = favorites.value.find(f => f.node_id === activeNode.value.id);
  if (existing) {
    await api(`favorite?id=${existing.id}`, { method: 'DELETE' });
  } else {
    await api('favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: activeNode.value.id, title: activeNode.value.title })
    });
  }
  await loadFavorites();
};

const deleteFavorite = async (id) => {
  await api(`favorite?id=${id}`, { method: 'DELETE' });
  await loadFavorites();
};

const renderContent = (text) => {
  let html = text || '';
  html = html.replace(/\[\[(.*?)\]\]/g, '<a data-wiki-link="$1" class="text-[#0000ff] underline cursor-pointer hover:text-red-500">$1</a>');
  html = marked.parse(html);
  return html;
};

const handleLinkClick = (e) => {
  const target = e.target.closest('a');
  if(target && target.dataset.wikiLink) {
    startQuery.value = target.dataset.wikiLink;
    jump(target.dataset.wikiLink, activeNode.value?.id);
  }
};

const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }
};

const loadNode = async (id) => {
  loading.value = true;
  activeNode.value = null; // hide content to center the loader
  try {
    const res = await api(`node?id=${id}`);
    if(res.node) {
      activeNode.value = res.node;
      trace.value.push(activeNode.value.title);
      startQuery.value = activeNode.value.title;
      scrollToTop();
    }
  } catch {}
  loading.value = false;
};

const jump = async (title, parentId) => {
  if(!title) return;
  loading.value = true;
  currentTitle.value = title;
  const prevContent = activeNode.value?.content || '';
  activeNode.value = null;
  try {
    const res = await api('generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, parentId, trace: trace.value, locale: LOCALE, currentContent: prevContent })
    });
    if(res.node) {
      activeNode.value = res.node;
      trace.value.push(title);
      startQuery.value = title;
      await loadNodes();
      scrollToTop();
    }
  } catch {}
  loading.value = false;
};

const regenerate = async () => {
  if (!activeNode.value) return;
  const title = activeNode.value.title;
  const parentId = activeNode.value.parent_id;
  startQuery.value = title;
  await jump(title, parentId);
};

onMounted(() => { loadNodes(); loadFavorites(); });
</script>

<style>
/* Windows 95/IE classic progress bar */
.ie-progress {
  width: 180px;
  height: 18px;
  background-color: #dfdfdf;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-bottom: 1px solid #ffffff;
  border-right: 1px solid #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: inset 1px 1px 0 #000;
}
.ie-progress::after {
  content: '';
  position: absolute;
  top: 1px; bottom: 1px; left: -100px;
  width: 60px;
  background: repeating-linear-gradient(90deg, #000080 0px, #000080 10px, transparent 10px, transparent 13px);
  animation: ieLoader 1.5s infinite linear;
}
@keyframes ieLoader {
  0% { left: -80px; }
  100% { left: 180px; }
}

.win95-btn {
  background: #dfdfdf;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-bottom: 1px solid #808080;
  border-right: 1px solid #808080;
  box-shadow: inset -1px -1px 0 #000, 0 0 0 1px #dfdfdf;
  transition: none;
  font-family: "MS Sans Serif", sans-serif;
  font-size: 11px;
}
.win95-btn:active, .win95-btn-active {
  border-top: 1px solid #000;
  border-left: 1px solid #000;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
  box-shadow: inset 1px 1px 0 #808080, 0 0 0 1px #dfdfdf;
  padding-top: 2px;
  padding-left: 3px;
  padding-bottom: 0px;
  padding-right: 1px;
}

/* Hide scrollbar for breadcrumbs */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.article-content a {
  transition: all 0.1s;
}
</style>
