<template>
  <div class="flex h-full flex-col bg-[#0d1117] text-[#e6edf3]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <div class="flex items-center gap-3 px-4 py-3 border-b border-[#21262d] shrink-0">
      <svg class="w-5 h-5 text-[#e6edf3]" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>
      <span class="font-semibold text-sm">__T_GH_TITLE__</span>
      <div class="flex gap-1 ml-3">
        <button v-for="t in timeFilters" :key="t.id" @click="since = t.id; loadRepos()"
          class="px-2.5 py-1 text-xs rounded-full transition-colors"
          :class="since === t.id ? 'bg-[#238636] text-white' : 'text-[#8b949e] hover:bg-[#21262d]'">
          {{ t.label }}
        </button>
      </div>
      <div class="ml-auto flex gap-2">
        <select v-model="language" @change="loadRepos()"
          class="bg-[#21262d] border border-[#30363d] text-[#8b949e] text-xs rounded px-2 py-1 outline-none">
          <option value="">__T_GH_ALL__</option>
          <option v-for="l in langs" :key="l" :value="l">{{ l }}</option>
        </select>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="text-center text-[#484f58] text-sm py-12">__T_GH_LOADING__</div>
      <div v-for="repo in repos" :key="repo.id"
        class="px-4 py-3 border-b border-[#161b22] hover:bg-[#161b22] transition-colors">
        <div class="flex items-start gap-3">
          <img :src="repo.avatar" class="w-6 h-6 rounded-full mt-0.5" />
          <div class="flex-1 min-w-0">
            <a :href="repo.url" target="_blank" class="text-[#58a6ff] text-sm font-medium hover:underline">{{ repo.name }}</a>
            <p class="text-[#8b949e] text-xs mt-1 leading-relaxed">{{ repo.description }}</p>
            <div class="flex items-center gap-4 mt-2 text-[11px] text-[#484f58]">
              <span v-if="repo.language" class="flex items-center gap-1"><span class="w-2 h-2 rounded-full" :style="{ background: langColor(repo.language) }"></span>{{ repo.language }}</span>
              <span>⭐ {{ repo.stars }} __T_GH_STARS__</span>
              <span>🍴 {{ repo.forks }} __T_GH_FORKS__</span>
            </div>
          </div>
          <button @click="analyzeRepo(repo)" :disabled="analyzingId === repo.id"
            class="shrink-0 px-2.5 py-1 text-[11px] rounded-full border border-[#30363d] text-[#8b949e] hover:border-[#238636] hover:text-[#3fb950] disabled:opacity-40 transition-colors">
            {{ analyzingId === repo.id ? '__T_GH_ANALYZING__' : '✦ __T_GH_ANALYZE__' }}
          </button>
        </div>
        <div v-if="analyses[repo.id]" class="mt-2 ml-9 bg-[#161b22] border border-[#21262d] rounded-lg p-3 text-xs text-[#8b949e] leading-relaxed whitespace-pre-wrap">{{ analyses[repo.id] }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { chatPanel } from '../../stores/chatPanel.js';
import { LOCALE } from '../../locale.js';
const repos = ref([]); const loading = ref(false); const since = ref('daily'); const language = ref(''); const analyzingId = ref(null); const analyses = reactive({});
const langs = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Swift'];
const timeFilters = [{ id: 'daily', label: '__T_GH_DAILY__' }, { id: 'weekly', label: '__T_GH_WEEKLY__' }, { id: 'monthly', label: '__T_GH_MONTHLY__' }];
const langColor = (l) => ({ JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572a5', Rust: '#dea584', Go: '#00add8', Java: '#b07219', 'C++': '#f34b7d', Swift: '#f05138' })[l] || '#8b949e';
const loadRepos = async () => { loading.value = true; try { const res = await fetch(`/aios/apps/ghtrending/list?since=${since.value}&language=${language.value}`); const data = await res.json(); repos.value = data.repos || []; } catch {} loading.value = false; };
const analyzeRepo = async (repo) => { analyzingId.value = repo.id; try { const res = await fetch('/aios/apps/ghtrending/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repo, locale: LOCALE }) }); const data = await res.json(); analyses[repo.id] = data.analysis || ''; } catch { analyses[repo.id] = 'Failed'; } analyzingId.value = null; };
onMounted(() => { loadRepos(); chatPanel.setContext({ scene: 'ghtrending', label: '__T_APP_SIDEBAR_GHTRENDING__' }); chatPanel.setQuickMessages(['__T_GH_CHAT_QUICK_1__', '__T_GH_CHAT_QUICK_2__', '__T_GH_CHAT_QUICK_3__']); });
</script>
