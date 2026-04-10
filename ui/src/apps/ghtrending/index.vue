<template>
  <div class="flex h-full flex-col bg-[#0d1117] text-[#c9d1d9]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <!-- Header -->
    <div class="px-5 py-4 shrink-0 bg-[#0d1117] border-b border-[#21262d] flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <svg class="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>
          </div>
          <template v-if="view === 'history'">
            <button @click="view = 'list'" class="text-[#8b949e] hover:text-[#c9d1d9] text-[13px] font-medium transition-colors">← __T_GH_BACK__</button>
          </template>
          <template v-else>
            <span class="font-bold text-[15px] tracking-wide text-white">__T_GH_TITLE__</span>
          </template>
        </div>
        
        <button v-if="view !== 'history'" @click="loadHistory" class="text-[11px] font-medium text-[#8b949e] hover:text-white transition-colors bg-[#21262d]/50 hover:bg-[#30363d] px-3 py-1.5 rounded-full border border-[#30363d]/50 shadow-sm flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          __T_GH_HISTORY__
        </button>
      </div>

      <div v-if="view !== 'history'" class="flex items-center gap-3 overflow-hidden">
        <div class="flex shrink-0 bg-[#161b22] rounded-lg p-0.5 border border-[#30363d] shadow-sm">
          <button v-for="t in timeFilters" :key="t.id" @click="since = t.id; digestText = ''; loadRepos()"
            class="px-3 py-1.5 text-[11px] font-medium rounded-md transition-all"
            :class="since === t.id ? 'bg-[#21262d] text-[#c9d1d9] shadow-sm ring-1 ring-white/10' : 'text-[#8b949e] hover:text-[#c9d1d9]'">
            {{ t.label }}
          </button>
        </div>
        <div class="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div class="flex min-w-max items-center gap-2 pr-2">
          <button
            type="button"
            @click="setLanguage('')"
            class="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all"
            :class="language === '' ? 'border-[#388bfd]/40 bg-[#388bfd]/10 text-[#58a6ff]' : 'border-[#30363d] bg-[#161b22] text-[#8b949e] hover:border-[#8b949e] hover:text-[#c9d1d9]'"
          >
            __T_GH_ALL_LANGUAGES__
          </button>
          <button
            v-for="l in langs"
            :key="l"
            type="button"
            @click="setLanguage(l)"
            class="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all"
            :class="language === l ? 'border-[#388bfd]/40 bg-[#388bfd]/10 text-[#58a6ff]' : 'border-[#30363d] bg-[#161b22] text-[#8b949e] hover:border-[#8b949e] hover:text-[#c9d1d9]'"
          >
            {{ l }}
          </button>
        </div>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div v-if="view === 'list'" class="flex-1 overflow-y-auto">
      <div v-if="loading" class="text-center text-[#484f58] text-sm py-16">__T_GH_LOADING__</div>
      <div v-else class="p-4 space-y-3">
        <!-- Digest Banner -->
        <div class="mb-3">
          <div v-if="!digestText" class="bg-[#388bfd]/10 border border-[#388bfd]/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div class="text-[13px] font-bold text-[#58a6ff] mb-1">__T_GH_DIGEST_TITLE__</div>
              <div class="text-[11px] text-[#58a6ff]/70">__T_GH_DIGEST_DESC__</div>
            </div>
            <button @click="doDigest" :disabled="digesting"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium rounded-lg transition-all disabled:opacity-40 bg-[#238636] text-white hover:bg-[#2ea043] shrink-0 transform active:scale-95">
              <svg v-if="digesting" class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-else>✦</span>
              {{ digesting ? '__T_GH_DIGESTING__' : '__T_GH_DIGEST__' }}
            </button>
          </div>
          <div v-else class="bg-[#161b22] border border-[#21262d] rounded-xl p-5 text-xs text-[#8b949e] leading-relaxed">
            <div class="flex items-center justify-between mb-4 border-b border-[#21262d] pb-3">
              <span class="text-[11px] font-bold text-[#58a6ff] uppercase tracking-wider flex items-center gap-1.5"><span class="text-[14px]">✦</span> __T_GH_DIGEST__</span>
              <button @click="digestText = ''" class="text-[12px] text-[#484f58] hover:text-[#c9d1d9] transition-colors">✕</button>
            </div>
            <div class="prose prose-sm prose-invert max-w-none text-[#8b949e]" v-html="renderMd(digestText)"></div>
          </div>
        </div>

        <!-- Repo cards -->
        <div v-for="repo in repos" :key="repo.id"
          class="bg-[#161b22] border border-[#21262d] rounded-xl p-4 hover:border-[#30363d] transition-colors">
          <div class="flex items-start gap-3">
            <img :src="repo.avatar" class="w-8 h-8 rounded-full mt-0.5 shrink-0" />
            <div class="flex-1 min-w-0">
              <a :href="repo.url" target="_blank" class="text-[#58a6ff] text-sm font-semibold hover:underline truncate block mb-1">{{ repo.name }}</a>
              <p v-if="repo.description" class="text-[#8b949e] text-xs leading-relaxed mb-3">{{ repo.description }}</p>
              <div class="flex items-center gap-4 text-[11px] text-[#484f58]">
                <span v-if="repo.language" class="flex items-center gap-1">
                  <span class="w-2.5 h-2.5 rounded-full" :style="{ background: langClr(repo.language) }"></span>
                  {{ repo.language }}
                </span>
                <span>⭐ {{ fmtNum(repo.stars) }}</span>
                <span>🍴 {{ fmtNum(repo.forks) }}</span>
              </div>
            </div>
            <button @click="analyzeRepo(repo)" :disabled="analyzingId === repo.id || analyses[repo.id]"
              class="shrink-0 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all disabled:opacity-40"
              :class="analyses[repo.id] ? 'bg-[#238636]/15 text-[#3fb950]' : 'bg-[#21262d] text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#388bfd]/10'">
              {{ analyses[repo.id] ? '✦ __T_GH_ANALYZED__' : '✦ __T_GH_ANALYZE__' }}
            </button>
          </div>
          <!-- Show loading animation when analyzing this repo -->
          <div v-if="analyzingId === repo.id && !analyses[repo.id]" class="flex items-center gap-2 mt-4 pt-4 border-t border-[#21262d] text-xs text-[#8b949e]">
            <svg class="animate-spin h-4 w-4 text-[#58a6ff]" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="animate-pulse">__T_GH_ANALYZING_DETAILS__</span>
          </div>
          <!-- Show actual analysis when done -->
          <div v-else-if="analyses[repo.id]" class="mt-3 pt-3 border-t border-[#21262d] text-xs text-[#8b949e] leading-relaxed" v-html="renderMd(analyses[repo.id])"></div>
        </div>
      </div>
    </div>

    <!-- History view -->
    <div v-if="view === 'history'" class="flex-1 overflow-y-auto">
      <div v-if="!historyItems.length" class="text-center text-[#484f58] text-sm py-16">__T_GH_HISTORY_EMPTY__</div>
      <div v-else class="p-4 space-y-3">
        <div v-for="item in historyItems" :key="item.id"
          class="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
          <div class="flex items-start gap-3 mb-3">
            <img :src="item.repo_avatar" class="w-7 h-7 rounded-full mt-0.5 shrink-0" />
            <div class="flex-1 min-w-0">
              <a :href="item.repo_url" target="_blank" class="text-[#58a6ff] text-sm font-semibold hover:underline">{{ item.repo_name }}</a>
              <div class="flex items-center gap-3 text-[11px] text-[#484f58] mt-0.5">
                <span v-if="item.repo_language" class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full" :style="{ background: langClr(item.repo_language) }"></span>
                  {{ item.repo_language }}
                </span>
                <span>⭐ {{ fmtNum(item.repo_stars) }}</span>
                <span class="text-[#30363d]">{{ item.created_at?.slice(0, 10) }}</span>
              </div>
            </div>
          </div>
          <div class="text-xs text-[#8b949e] leading-relaxed" v-html="renderMd(item.analysis)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { marked } from 'marked';
import { LOCALE } from '../../system/locale.js';
marked.setOptions({ breaks: true, gfm: true });
const renderMd = (t) => marked.parse(t || '');

const view = ref('list');
const repos = ref([]); const loading = ref(false); const since = ref('weekly'); const language = ref('');
const analyzingId = ref(null); const analyses = reactive({});
const digesting = ref(false); const digestText = ref('');
const historyItems = ref([]);
const langs = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Swift', 'Kotlin'];
const timeFilters = [{ id: 'weekly', label: '__T_GH_WEEKLY__' }, { id: 'monthly', label: '__T_GH_MONTHLY__' }];
const langClr = (l) => ({ JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572a5', Rust: '#dea584', Go: '#00add8', Java: '#b07219', 'C++': '#f34b7d', Swift: '#f05138', Kotlin: '#A97BFF' })[l] || '#8b949e';
const fmtNum = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
const api = async (p, o) => (await fetch(`/apps/ghtrending/${p}`, o)).json();

const loadRepos = async () => {
  loading.value = true;
  try {
    repos.value = (await api(`list?since=${since.value}&language=${language.value}`)).repos || [];
    // Batch check existing analyses
    const ids = repos.value.map(r => r.id).filter(Boolean);
    if (ids.length) {
      const cached = (await api('check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })).analyses || {};
      for (const [id, text] of Object.entries(cached)) analyses[id] = text;
    }
  } catch {}
  loading.value = false;
};

const analyzeRepo = async (repo) => {
  if (analyses[repo.id]) return;
  analyzingId.value = repo.id;
  try { analyses[repo.id] = (await api('analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repo, locale: LOCALE }) })).analysis || ''; }
  catch { analyses[repo.id] = '__T_GH_FAILED__'; }
  analyzingId.value = null;
};

const doDigest = async () => {
  digesting.value = true;
  try {
    const list = repos.value.slice(0, 15).map((r, i) => `${i + 1}. ${r.name} - ${r.description || 'N/A'} (⭐${r.stars}, ${r.language || 'N/A'})`).join('\n');
    digestText.value = (await api('analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repo: { name: 'GitHub Trending Digest', description: list, language: '', stars: 0, url: '', id: 0 }, locale: LOCALE }) })).analysis || '';
  } catch { digestText.value = '__T_GH_FAILED__'; }
  digesting.value = false;
};

const loadHistory = async () => {
  try { historyItems.value = (await api('history')).analyses || []; } catch {}
  view.value = 'history';
};

const setLanguage = (value) => {
  language.value = value;
  loadRepos();
};

onMounted(() => loadRepos());
</script>
