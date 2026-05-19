<script setup>
// ghtrending 应用根 — 协调器
// ────────────────────────────
// api.js          请求层
// utils.js        renderMd / fmtNum / langClr / LANGS / TIME_FILTERS
// Topbar          顶栏 (深色)
// Sidebar         语言/历史导航
// ListView        列表视图(digest + repo cards)
// HistoryView     历史视图

import { onBeforeUnmount, onMounted, reactive, ref, watchEffect } from 'vue';
import { useViewStore } from '@/stores/view.js';
import { useAppContext } from '@/stores/appContext.js';
import * as gh from './api.js';

import Topbar from './Topbar.vue';
import Sidebar from './Sidebar.vue';
import ListView from './ListView.vue';
import HistoryView from './HistoryView.vue';

const view = useViewStore();
const appCtx = useAppContext();

// ── 主状态 ──────────────────────────
const mode = ref('list');     // 'list' | 'history'
const repos = ref([]);
const loading = ref(false);
const since = ref('weekly');
const language = ref('');
const analyzingId = ref(null);
const analyses = reactive({});
const digesting = ref(false);
const digestText = ref('');
const historyItems = ref([]);

// ── 加载 ────────────────────────────
async function loadRepos() {
    loading.value = true;
    try {
        const r = await gh.listRepos(since.value, language.value);
        repos.value = r.repos || [];
        const ids = repos.value.map((x) => x.id).filter(Boolean);
        if (ids.length) {
            const cached = (await gh.checkAnalyses(ids)).analyses || {};
            for (const [id, text] of Object.entries(cached)) analyses[id] = text;
        }
    } catch {}
    loading.value = false;
}

async function analyzeRepo(repo) {
    if (analyses[repo.id]) return;
    analyzingId.value = repo.id;
    try {
        analyses[repo.id] = (await gh.analyzeRepo(repo)).analysis || '';
    } catch {
        analyses[repo.id] = '加载失败,稍后重试';
    }
    analyzingId.value = null;
}

async function doDigest() {
    digesting.value = true;
    try {
        const list = repos.value.slice(0, 15)
            .map((r, i) => `${i + 1}. ${r.name} - ${r.description || 'N/A'} (⭐${r.stars}, ${r.language || 'N/A'})`)
            .join('\n');
        digestText.value = (await gh.digestList(list)).analysis || '';
    } catch {
        digestText.value = '加载失败,稍后重试';
    }
    digesting.value = false;
}

async function loadHistory() {
    try {
        historyItems.value = (await gh.getHistory()).analyses || [];
    } catch {}
}

// ── 视图切换 ─────────────────────────
function pickTime(id) {
    since.value = id;
    digestText.value = '';
    mode.value = 'list';
    if (window.innerWidth < 720) view.closeAppDrawer();
    loadRepos();
}
function pickLang(value) {
    language.value = value;
    mode.value = 'list';
    if (window.innerWidth < 720) view.closeAppDrawer();
    loadRepos();
}
function pickHistory() {
    mode.value = 'history';
    if (window.innerWidth < 720) view.closeAppDrawer();
    loadHistory();
}

// QuickChat 上下文:让 AI 知道用户在看哪条时间范围、哪种语言、列表里都有什么项目。
const stopAppCtx = watchEffect(() => {
  if (mode.value === 'history') {
    appCtx.set({
      context: `用户在 GH 热榜的历史视图,共 ${historyItems.value.length} 条历史分析记录。`,
      prompts: [
        { label: '今天热门的主要是哪些方向', text: '今天热门的主要是哪些方向' },
        { label: '哪些和 AI 相关', text: '哪些和 AI 相关' }
      ]
    });
    return;
  }
  const top = repos.value.slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.name} (${r.language || '未知'}, ⭐${r.stars}) - ${r.description || ''}`)
    .join('\n');
  appCtx.set({
    context: [
      `用户在 GH 热榜列表视图,时间范围:${since.value}${language.value ? `,语言筛选:${language.value}` : ''}。`,
      `共 ${repos.value.length} 个项目${top ? `,前 5 个:\n${top}` : '。'}`
    ].join('\n'),
    prompts: [
      { label: '今天热门的主要是哪些方向', text: '今天热门的主要是哪些方向' },
      { label: '挑一个适合学习的项目', text: '挑一个适合学习的项目' },
      { label: '哪些和 AI 相关', text: '哪些和 AI 相关' }
    ]
  });
});

onMounted(loadRepos);
onBeforeUnmount(() => { stopAppCtx(); appCtx.clear(); });
</script>

<template>
    <div class="app-frame h-full w-full overflow-hidden bg-[#0d1117] text-[#c9d1d9]"
         style="font-family: -apple-system, 'PingFang SC', sans-serif">

        <Topbar />

        <div class="app-body bg-[#0d1117]">
            <Transition name="mask">
                <div v-if="view.appDrawerOpen" class="app-side-mask" @click="view.closeAppDrawer()" />
            </Transition>

            <aside class="app-side !bg-[#0d1117] !border-r-[#21262d]"
                   :class="{ collapsed: !view.appDrawerOpen }">
                <div class="app-side-inner">
                    <Sidebar
                        :mode="mode"
                        :language="language"
                        :history-count="historyItems.length"
                        @pick-history="pickHistory"
                        @pick-lang="pickLang" />
                </div>
            </aside>

            <section class="flex-1 min-w-0 min-h-0 overflow-y-auto bg-[#0d1117]">
                <ListView v-if="mode === 'list'"
                          :repos="repos"
                          :analyses="analyses"
                          :analyzing-id="analyzingId"
                          :since="since"
                          :loading="loading"
                          :digest-text="digestText"
                          :digesting="digesting"
                          @pick-time="pickTime"
                          @analyze="analyzeRepo"
                          @digest="doDigest"
                          @clear-digest="digestText = ''" />
                <HistoryView v-else :items="historyItems" />
            </section>
        </div>
    </div>
</template>
