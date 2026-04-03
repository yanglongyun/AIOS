<template>
  <div class="flex h-full flex-col bg-[#fafaf8] text-[#333]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <!-- Header -->
    <div class="flex items-center gap-3 px-4 py-3 border-b border-[#e8e8e4] bg-white shrink-0">
      <template v-if="view === 'articles'">
        <button @click="view = 'feeds'" class="text-[#e8740c] hover:text-[#d06000] text-sm">← __T_RSS_BACK__</button>
        <span class="text-sm font-medium truncate">{{ activeFeedName }}</span>
      </template>
      <template v-else>
        <span class="text-lg">📡</span>
        <span class="font-semibold text-sm">__T_RSS_TITLE__</span>
      </template>
      <div class="ml-auto flex gap-2">
        <button @click="view = view === 'bookmarks' ? 'feeds' : 'bookmarks'"
          class="px-2.5 py-1 text-xs rounded-full transition-colors"
          :class="view === 'bookmarks' ? 'bg-[#e8740c] text-white' : 'text-[#999] hover:bg-[#f0f0ec]'">
          ★ __T_RSS_BOOKMARKS__
        </button>
        <button @click="showAddFeed = !showAddFeed"
          class="px-2.5 py-1 text-xs rounded-full text-[#999] hover:bg-[#f0f0ec] transition-colors">
          + __T_RSS_ADD_FEED__
        </button>
      </div>
    </div>

    <!-- Add Feed -->
    <div v-if="showAddFeed" class="px-4 py-3 bg-white border-b border-[#e8e8e4]">
      <div class="flex gap-2">
        <input v-model="newFeedUrl" :placeholder="'__T_RSS_ADD_FEED_PLACEHOLDER__'" class="flex-1 bg-[#f5f5f2] border border-[#e0e0dc] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#e8740c]" @keydown.enter="doAddFeed" />
        <input v-model="newFeedName" :placeholder="'__T_RSS_NAME_PLACEHOLDER__'" class="w-32 bg-[#f5f5f2] border border-[#e0e0dc] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#e8740c]" />
        <button @click="doAddFeed" class="px-4 py-2 bg-[#e8740c] text-white text-xs rounded-lg hover:bg-[#d06000]">__T_RSS_ADD__</button>
      </div>
    </div>

    <!-- Feeds List -->
    <div v-if="view === 'feeds'" class="flex-1 overflow-y-auto">
      <div v-if="!feeds.length" class="text-center text-[#999] text-sm py-12">__T_RSS_EMPTY__</div>
      <div v-for="feed in feeds" :key="feed.id"
        class="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0ec] hover:bg-[#f5f5f2] cursor-pointer transition-colors"
        @click="openFeed(feed)">
        <div class="w-8 h-8 bg-[#e8740c]/10 rounded-lg flex items-center justify-center text-[#e8740c] text-sm shrink-0">📡</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium">{{ feed.name }}</div>
          <div class="text-[11px] text-[#999] truncate">{{ feed.url }}</div>
        </div>
        <button @click.stop="doRemoveFeed(feed.id)" class="text-[#ccc] hover:text-[#f44] text-xs shrink-0">✕</button>
      </div>
    </div>

    <!-- Articles List -->
    <div v-if="view === 'articles'" class="flex-1 overflow-y-auto">
      <div v-if="articlesLoading" class="text-center text-[#999] text-sm py-12">__T_RSS_LOADING__</div>
      <div v-for="item in articles" :key="item.url"
        class="px-4 py-3 border-b border-[#f0f0ec] hover:bg-[#f5f5f2] transition-colors">
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <a :href="item.url" target="_blank" class="text-sm font-medium text-[#333] hover:text-[#e8740c]">{{ item.title }}</a>
            <p class="text-[#999] text-xs mt-1 leading-relaxed line-clamp-2">{{ item.description }}</p>
            <div class="text-[11px] text-[#ccc] mt-1">{{ item.pubDate }}</div>
          </div>
          <div class="flex gap-1 shrink-0">
            <button @click="doSummarize(item)" :disabled="summarizingUrl === item.url"
              class="px-2 py-1 text-[11px] rounded border border-[#eee] text-[#999] hover:border-[#4a9] hover:text-[#4a9] disabled:opacity-40 transition-colors">
              {{ summarizingUrl === item.url ? '...' : '✦' }}
            </button>
            <button @click="doBookmark(item)"
              class="px-2 py-1 text-[11px] rounded border border-[#eee] text-[#999] hover:border-[#e8740c] hover:text-[#e8740c] transition-colors">★</button>
          </div>
        </div>
        <div v-if="summaries[item.url]" class="mt-2 bg-[#f0faf5] border border-[#d0e8d8] rounded-lg p-2.5 text-xs text-[#666] leading-relaxed whitespace-pre-wrap">{{ summaries[item.url] }}</div>
      </div>
    </div>

    <!-- Bookmarks View -->
    <div v-if="view === 'bookmarks'" class="flex-1 overflow-y-auto">
      <div v-if="!bookmarks.length" class="text-center text-[#999] text-sm py-12">__T_RSS_NO_BOOKMARKS__</div>
      <div v-for="bm in bookmarks" :key="bm.id"
        class="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0ec] hover:bg-[#f5f5f2] transition-colors">
        <div class="flex-1 min-w-0">
          <a :href="bm.url" target="_blank" class="text-sm font-medium text-[#333] hover:text-[#e8740c]">{{ bm.title }}</a>
          <p v-if="bm.summary" class="text-[#999] text-xs mt-0.5 line-clamp-1">{{ bm.summary }}</p>
        </div>
        <button @click="doRemoveBookmark(bm.id)" class="text-[#ccc] hover:text-[#f44] text-xs shrink-0">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { chatPanel } from '../../stores/chatPanel.js';
import { LOCALE } from '../../locale.js';
const view = ref('feeds'); const feeds = ref([]); const bookmarks = ref([]);
const articles = ref([]); const articlesLoading = ref(false); const activeFeedName = ref('');
const showAddFeed = ref(false); const newFeedUrl = ref(''); const newFeedName = ref('');
const summarizingUrl = ref(null); const summaries = reactive({});

const api = async (path, opts) => { const res = await fetch(`/aios/apps/rssreader/${path}`, opts); return res.json(); };
const loadFeeds = async () => { try { const data = await api('feeds'); feeds.value = data.feeds || []; } catch {} };
const loadBookmarks = async () => { try { const data = await api('bookmarks'); bookmarks.value = data.bookmarks || []; } catch {} };

const doAddFeed = async () => {
  if (!newFeedUrl.value.trim()) return;
  await api('feed/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newFeedName.value.trim() || newFeedUrl.value.trim(), url: newFeedUrl.value.trim() }) });
  newFeedUrl.value = ''; newFeedName.value = ''; showAddFeed.value = false; await loadFeeds();
};
const doRemoveFeed = async (id) => { await api('feed/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); await loadFeeds(); };

const openFeed = async (feed) => {
  view.value = 'articles'; activeFeedName.value = feed.name; articlesLoading.value = true;
  try { const data = await api(`fetch?url=${encodeURIComponent(feed.url)}`); articles.value = data.items || []; } catch { articles.value = []; }
  articlesLoading.value = false;
};

const doSummarize = async (item) => {
  summarizingUrl.value = item.url;
  try { const data = await api('summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: item.title, description: item.description, url: item.url, locale: LOCALE }) }); summaries[item.url] = data.summary || ''; }
  catch { summaries[item.url] = 'Failed'; } summarizingUrl.value = null;
};
const doBookmark = async (item) => { await api('bookmark/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: item.title, url: item.url, summary: summaries[item.url] || '' }) }); await loadBookmarks(); };
const doRemoveBookmark = async (id) => { await api('bookmark/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); await loadBookmarks(); };

onMounted(() => { loadFeeds(); loadBookmarks(); chatPanel.setContext({ scene: 'rssreader', label: '__T_APP_SIDEBAR_RSSREADER__' }); chatPanel.setQuickMessages(['__T_RSS_CHAT_QUICK_1__', '__T_RSS_CHAT_QUICK_2__', '__T_RSS_CHAT_QUICK_3__']); });
</script>
