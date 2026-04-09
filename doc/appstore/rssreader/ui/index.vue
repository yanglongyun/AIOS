<template>
  <div
    class="h-full bg-[#f8f7f4] text-[#333]"
    :class="isMobile ? 'flex flex-col' : 'flex'"
    style="font-family: -apple-system, 'PingFang SC', sans-serif;"
  >
    <!-- Sidebar -->
    <div
      v-if="!isMobile || mobilePage === 'feeds'"
      class="bg-[#eae8e2] flex flex-col"
      :class="isMobile ? 'flex-1 min-h-0' : 'w-[200px] shrink-0 border-r border-[#ddd8ce]'"
    >
      <div class="px-3 py-3 text-[11px] font-bold text-[#999] uppercase tracking-wider">__T_RSS_FEEDS__</div>
      <!-- Feed list -->
      <div class="flex-1 overflow-y-auto">
        <div v-for="feed in feeds" :key="feed.id"
          class="group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
          :class="activeFeed?.id === feed.id ? 'bg-[#d4a574]/15 text-[#8b5e3c]' : 'hover:bg-[#e2dfd6]'"
          @click="openFeed(feed)">
          <span class="text-xs">📡</span>
          <span class="flex-1 text-[12px] truncate">{{ feed.name }}</span>
          <button @click.stop="doRemoveFeed(feed.id)" class="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-[#e74c3c] text-[10px] transition-opacity">✕</button>
        </div>
      </div>
      <!-- Add feed -->
      <div class="p-2 border-t border-[#ddd8ce]">
        <button v-if="!showAdd" @click="showAdd = true" class="w-full text-[11px] text-[#999] hover:text-[#666] py-1.5 transition-colors">+ __T_RSS_ADD_FEED__</button>
        <div v-else class="space-y-1.5">
          <input v-model="newUrl" :placeholder="'__T_RSS_ADD_FEED_PLACEHOLDER__'" @keydown.enter="doAddFeed"
            class="w-full bg-white border border-[#ddd] rounded px-2 py-1 text-[11px] outline-none focus:border-[#d4a574]" />
          <div class="flex gap-1">
            <input v-model="newName" :placeholder="'__T_RSS_NAME_PLACEHOLDER__'" class="flex-1 bg-white border border-[#ddd] rounded px-2 py-1 text-[11px] outline-none focus:border-[#d4a574]" />
            <button @click="showAdd = false; newUrl = ''; newName = ''" class="px-2 py-1 bg-[#e8e5d8] text-[#999] text-[10px] rounded hover:bg-[#ddd8ce]">__T_RSS_CANCEL__</button>
            <button @click="doAddFeed" class="px-2 py-1 bg-[#d4a574] text-white text-[10px] rounded hover:bg-[#c49464]">__T_RSS_ADD__</button>
          </div>
        </div>
      </div>
      <!-- Bookmarks -->
      <div class="border-t border-[#ddd8ce]">
        <button @click="showBookmarks" class="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] hover:bg-[#e2dfd6] transition-colors"
          :class="view === 'bookmarks' ? 'bg-[#d4a574]/15 text-[#8b5e3c]' : 'text-[#999]'">
          <span>★</span> __T_RSS_BOOKMARKS__ <span class="ml-auto text-[10px] text-[#ccc]">{{ bookmarks.length }}</span>
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div
      v-if="!isMobile || mobilePage !== 'feeds'"
      class="flex-1 flex flex-col overflow-hidden"
    >
      <!-- Articles header -->
      <div v-if="activeFeed || view === 'bookmarks'" class="px-4 py-2.5 border-b border-[#e8e5d8] bg-white shrink-0">
        <div class="flex items-center gap-3">
          <button
            v-if="isMobile"
            @click="goBackToFeeds"
            class="text-[12px] text-[#a88864] hover:text-[#8b5e3c] transition-colors"
          >
            ← __T_RSS_BACK__
          </button>
          <div class="text-sm font-semibold truncate">{{ view === 'bookmarks' ? '__T_RSS_BOOKMARKS__' : activeFeed?.name }}</div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!activeFeed && view !== 'bookmarks'" class="flex-1 flex flex-col items-center justify-center text-[#ccc]">
        <div class="text-4xl mb-3 opacity-40">📡</div>
        <div class="text-sm">__T_RSS_EMPTY__</div>
      </div>

      <!-- Article list -->
      <div v-if="view === 'articles'" class="flex-1 overflow-y-auto">
        <div v-if="articlesLoading" class="text-center text-[#ccc] text-sm py-12">__T_RSS_LOADING__</div>
        <div v-for="item in articles" :key="item.url" class="border-b border-[#f0ede4]">
          <div class="px-4 py-3 hover:bg-[#f2f0ea] transition-colors">
            <div class="flex items-start gap-2">
              <div class="flex-1 min-w-0">
                <a :href="item.url" target="_blank" class="text-[13px] font-medium text-[#333] hover:text-[#d4a574] leading-snug">{{ item.title }}</a>
                <p class="text-[#aaa] text-[11px] mt-1 leading-relaxed line-clamp-2">{{ item.description }}</p>
                <div class="text-[10px] text-[#ccc] mt-1">{{ item.pubDate }}</div>
                <div class="mt-1.5 flex items-center gap-2">
                  <button v-if="!summaries[item.url]" @click="doSummarize(item)" :disabled="summarizingUrl === item.url"
                    class="text-[11px] text-[#d4a574] hover:text-[#c49464] transition-colors disabled:text-[#ccc]">
                    {{ summarizingUrl === item.url ? '__T_RSS_SUMMARIZING__' : '__T_RSS_QUICK_LOOK__' }}
                  </button>
                  <button v-if="!summaries[item.url] && summarizingUrl !== item.url" @click="doBookmark(item)"
                    class="text-[11px] text-[#bbb] hover:text-[#d4a574] transition-colors">__T_RSS_SAVE__</button>
                </div>
              </div>
              <div v-if="summaries[item.url]" class="flex gap-1 shrink-0 pt-0.5">
                <button @click="doBookmark(item)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] bg-[#f5f5f2] text-[#bbb] hover:text-[#d4a574] hover:bg-[#faf5ef] transition-all">
                  ★
                </button>
              </div>
            </div>
            <!-- Summary -->
            <div v-if="summaries[item.url]" class="mt-2 bg-white border border-[#e8e5d8] rounded-lg p-3 text-[12px] text-[#666] leading-relaxed" v-html="renderMd(summaries[item.url])"></div>
          </div>
        </div>
      </div>

      <!-- Bookmarks list -->
      <div v-if="view === 'bookmarks'" class="flex-1 overflow-y-auto">
        <div v-if="!bookmarks.length" class="text-center text-[#ccc] text-sm py-12">__T_RSS_NO_BOOKMARKS__</div>
        <div v-for="bm in bookmarks" :key="bm.id" class="flex items-center gap-3 px-4 py-3 border-b border-[#f0ede4] hover:bg-[#f2f0ea] transition-colors">
          <div class="flex-1 min-w-0">
            <a :href="bm.url" target="_blank" class="text-[13px] font-medium text-[#333] hover:text-[#d4a574]">{{ bm.title }}</a>
            <p v-if="bm.summary" class="text-[#aaa] text-[11px] mt-0.5 line-clamp-1">{{ bm.summary }}</p>
          </div>
          <button @click="doRemoveBookmark(bm.id)" class="text-[#ddd] hover:text-[#e74c3c] text-xs shrink-0">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { marked } from 'marked';
import { LOCALE } from '../../locale.js';
marked.setOptions({ breaks: true, gfm: true });
const renderMd = (t) => marked.parse(t || '');

const view = ref('empty'); const feeds = ref([]); const bookmarks = ref([]);
const activeFeed = ref(null); const articles = ref([]); const articlesLoading = ref(false);
const showAdd = ref(false); const newUrl = ref(''); const newName = ref('');
const summarizingUrl = ref(null); const summaries = reactive({});
const isMobile = ref(false);
const mobilePage = ref('feeds');

const syncViewport = () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) mobilePage.value = 'content';
  else if (mobilePage.value !== 'bookmarks' && mobilePage.value !== 'articles') mobilePage.value = 'feeds';
};

const api = async (p, o) => (await fetch(`/aios/apps/rssreader/${p}`, o)).json();
const loadFeeds = async () => { try { feeds.value = (await api('feeds')).feeds || []; } catch {} };
const loadBookmarks = async () => { try { bookmarks.value = (await api('bookmarks')).bookmarks || []; } catch {} };

const doAddFeed = async () => {
  if (!newUrl.value.trim()) return;
  await api('feed/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.value.trim() || newUrl.value.trim(), url: newUrl.value.trim() }) });
  newUrl.value = ''; newName.value = ''; showAdd.value = false; await loadFeeds();
};
const doRemoveFeed = async (id) => {
  await api('feed/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  if (activeFeed.value?.id === id) {
    activeFeed.value = null;
    view.value = 'empty';
    if (isMobile.value) mobilePage.value = 'feeds';
  }
  await loadFeeds();
};

const openFeed = async (feed) => {
  activeFeed.value = feed; view.value = 'articles'; articlesLoading.value = true;
  if (isMobile.value) mobilePage.value = 'articles';
  try { articles.value = (await api(`fetch?url=${encodeURIComponent(feed.url)}`)).items || []; } catch { articles.value = []; }
  articlesLoading.value = false;
};
const showBookmarks = () => {
  activeFeed.value = null;
  view.value = 'bookmarks';
  if (isMobile.value) mobilePage.value = 'bookmarks';
};
const goBackToFeeds = () => {
  activeFeed.value = null;
  view.value = 'empty';
  mobilePage.value = 'feeds';
};

const doSummarize = async (item) => {
  summarizingUrl.value = item.url;
  try { summaries[item.url] = (await api('summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: item.title, description: item.description, url: item.url, locale: LOCALE }) })).summary || ''; }
  catch { summaries[item.url] = 'Failed'; } summarizingUrl.value = null;
};
const doBookmark = async (item) => { await api('bookmark/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: item.title, url: item.url, summary: summaries[item.url] || '' }) }); await loadBookmarks(); };
const doRemoveBookmark = async (id) => { await api('bookmark/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); await loadBookmarks(); };

onMounted(() => {
  syncViewport();
  window.addEventListener('resize', syncViewport);
  loadFeeds();
  loadBookmarks();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport);
});
</script>
