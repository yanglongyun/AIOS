<template>
  <div class="flex h-full flex-col bg-[#fafafa] text-[#1a1a1a]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <!-- Header -->
    <div class="flex items-center gap-3 px-4 py-3 border-b border-[#eee] bg-white shrink-0">
      <template v-if="view === 'detail'">
        <button @click="view = 'list'" class="text-[#f60] hover:text-[#e50] text-sm">← __T_HN_BACK__</button>
      </template>
      <template v-else>
        <span class="font-bold text-[#f60] text-sm tracking-wide">Y</span>
        <span class="font-semibold text-sm">__T_HN_TITLE__</span>
        <div class="flex gap-1 ml-3">
          <button v-for="tab in tabs" :key="tab.id" @click="switchTab(tab.id)"
            class="px-2.5 py-1 text-xs rounded-full transition-colors"
            :class="activeTab === tab.id ? 'bg-[#f60] text-white' : 'text-[#666] hover:bg-[#f0f0f0]'">
            {{ tab.label }}
          </button>
        </div>
      </template>
      <div class="ml-auto flex gap-2">
        <button @click="view = view === 'bookmarks' ? 'list' : 'bookmarks'"
          class="px-2.5 py-1 text-xs rounded-full transition-colors"
          :class="view === 'bookmarks' ? 'bg-[#f60] text-white' : 'text-[#666] hover:bg-[#f0f0f0]'">
          ★ {{ bookmarks.length }}
        </button>
      </div>
    </div>

    <!-- List View -->
    <div v-if="view === 'list'" class="flex-1 overflow-y-auto">
      <div v-if="loading" class="text-center text-[#999] text-sm py-12">__T_HN_LOADING__</div>
      <div v-else>
        <div v-for="(story, i) in stories" :key="story.id"
          class="flex gap-3 px-4 py-3 border-b border-[#f0f0f0] hover:bg-[#f5f5f5] cursor-pointer transition-colors"
          @click="openDetail(story.id)">
          <span class="text-[#999] text-xs w-5 text-right shrink-0 pt-0.5">{{ i + 1 }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-sm leading-snug mb-1">{{ story.title }}</div>
            <div class="text-[11px] text-[#999]">
              {{ story.score }} __T_HN_PTS__ · {{ story.by }} · {{ story.descendants }} __T_HN_COMMENTS_COUNT__
              <span v-if="story.url" class="text-[#ccc] ml-1">{{ getDomain(story.url) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bookmarks View -->
    <div v-if="view === 'bookmarks'" class="flex-1 overflow-y-auto">
      <div v-if="!bookmarks.length" class="text-center text-[#999] text-sm py-12">__T_HN_NO_BOOKMARKS__</div>
      <div v-for="bm in bookmarks" :key="bm.id"
        class="flex gap-3 px-4 py-3 border-b border-[#f0f0f0] hover:bg-[#f5f5f5] cursor-pointer transition-colors"
        @click="openDetail(bm.hn_id)">
        <div class="flex-1 min-w-0">
          <div class="text-sm leading-snug mb-1">{{ bm.title }}</div>
          <div class="text-[11px] text-[#999]">{{ bm.score }} __T_HN_PTS__ · {{ bm.by }}</div>
        </div>
        <button @click.stop="toggleBookmark(bm)" class="text-[#f60] text-sm shrink-0">★</button>
      </div>
    </div>

    <!-- Detail View -->
    <div v-if="view === 'detail'" class="flex-1 overflow-y-auto">
      <div v-if="detailLoading" class="text-center text-[#999] text-sm py-12">__T_HN_LOADING__</div>
      <div v-else-if="story" class="px-4 py-4">
        <h1 class="text-base font-semibold mb-2 leading-snug">{{ story.title }}</h1>
        <div class="text-[11px] text-[#999] mb-3">
          {{ story.score }} __T_HN_PTS__ · {{ story.by }} · {{ story.descendants }} __T_HN_COMMENTS_COUNT__
          <a v-if="story.url" :href="story.url" target="_blank" class="text-[#f60] ml-2 hover:underline">{{ getDomain(story.url) }} →</a>
        </div>
        <!-- Actions -->
        <div class="flex gap-2 mb-4 flex-wrap">
          <button @click="toggleBookmark(story)" class="px-3 py-1.5 text-xs rounded-full border transition-colors"
            :class="isStoryBookmarked ? 'bg-[#f60] text-white border-[#f60]' : 'border-[#ddd] text-[#666] hover:border-[#f60]'">
            {{ isStoryBookmarked ? '★ __T_HN_SAVED__' : '☆ __T_HN_SAVE__' }}
          </button>
          <button @click="doSummarize" :disabled="summarizing"
            class="px-3 py-1.5 text-xs rounded-full border border-[#ddd] text-[#666] hover:border-[#4a9] hover:text-[#4a9] disabled:opacity-40 transition-colors">
            {{ summarizing ? '__T_HN_SUMMARIZING__' : '✦ __T_HN_SUMMARIZE__' }}
          </button>
          <button @click="doTranslate" :disabled="translating"
            class="px-3 py-1.5 text-xs rounded-full border border-[#ddd] text-[#666] hover:border-[#47a] hover:text-[#47a] disabled:opacity-40 transition-colors">
            {{ translating ? '__T_HN_TRANSLATING__' : '🌐 __T_HN_TRANSLATE__' }}
          </button>
        </div>
        <div v-if="summaryText" class="bg-[#f0faf5] border border-[#d0e8d8] rounded-lg p-3 mb-4 text-sm leading-relaxed whitespace-pre-wrap">{{ summaryText }}</div>
        <div v-if="translationText" class="bg-[#f0f5fa] border border-[#d0d8e8] rounded-lg p-3 mb-4 text-sm leading-relaxed whitespace-pre-wrap">{{ translationText }}</div>
        <!-- Comments -->
        <div v-if="comments.length" class="border-t border-[#eee] pt-3">
          <div class="text-xs font-semibold text-[#999] uppercase mb-3">__T_HN_COMMENTS__</div>
          <div v-for="c in comments" :key="c.id" class="mb-3">
            <div class="text-[11px] text-[#999] mb-1">{{ c.by }}</div>
            <div class="text-sm text-[#444] leading-relaxed" v-html="c.text"></div>
            <div v-for="child in c.children" :key="child.id" class="ml-4 mt-2 pl-3 border-l-2 border-[#eee]">
              <div class="text-[11px] text-[#999] mb-1">{{ child.by }}</div>
              <div class="text-sm text-[#444] leading-relaxed" v-html="child.text"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { chatPanel } from '../../stores/chatPanel.js';
import { LOCALE } from '../../locale.js';

const view = ref('list');
const activeTab = ref('top');
const tabs = [
  { id: 'top', label: '__T_HN_TOP__' },
  { id: 'new', label: '__T_HN_NEW__' },
  { id: 'best', label: '__T_HN_BEST__' }
];
const stories = ref([]);
const loading = ref(false);
const bookmarks = ref([]);
const story = ref(null);
const comments = ref([]);
const detailLoading = ref(false);
const summarizing = ref(false);
const translating = ref(false);
const summaryText = ref('');
const translationText = ref('');

const isStoryBookmarked = computed(() => story.value && bookmarks.value.some((b) => b.hn_id === story.value.id));
const getDomain = (url) => { try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; } };

const api = async (path, opts) => { const res = await fetch(`/aios/apps/hackernews/${path}`, opts); return res.json(); };

const loadStories = async (type = 'top') => { loading.value = true; try { const data = await api(`list?type=${type}`); stories.value = data.stories || []; } catch {} loading.value = false; };
const loadBookmarks = async () => { try { const data = await api('bookmarks'); bookmarks.value = data.bookmarks || []; } catch {} };

const switchTab = (tab) => { activeTab.value = tab; view.value = 'list'; loadStories(tab); };
const openDetail = async (id) => {
  view.value = 'detail'; detailLoading.value = true; summaryText.value = ''; translationText.value = '';
  try { const data = await api(`detail?id=${id}`); story.value = data.story || null; comments.value = data.comments || []; } catch {}
  detailLoading.value = false;
};

const toggleBookmark = async (item) => {
  const hnId = item.hn_id || item.id;
  const exists = bookmarks.value.some((b) => b.hn_id === hnId);
  if (exists) { await api('unbookmark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hnId }) }); }
  else { await api('bookmark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hnId, title: item.title, url: item.url, by: item.by, score: item.score }) }); }
  await loadBookmarks();
};

const doSummarize = async () => {
  if (!story.value) return; summarizing.value = true;
  try { const data = await api('summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: story.value.title, url: story.value.url, text: story.value.text, locale: LOCALE }) }); summaryText.value = data.summary || ''; }
  catch { summaryText.value = 'Failed'; } summarizing.value = false;
};

const doTranslate = async () => {
  if (!story.value) return; translating.value = true;
  try { const topComments = comments.value.slice(0, 5).map((c) => c.text).join('\n\n'); const data = await api('translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: story.value.title, text: topComments || story.value.title, locale: LOCALE }) }); translationText.value = data.translation || ''; }
  catch { translationText.value = 'Failed'; } translating.value = false;
};

onMounted(() => {
  loadStories('top'); loadBookmarks();
  chatPanel.setContext({ scene: 'hackernews', label: '__T_APP_SIDEBAR_HACKERNEWS__' });
  chatPanel.setQuickMessages(['__T_HN_CHAT_QUICK_1__', '__T_HN_CHAT_QUICK_2__', '__T_HN_CHAT_QUICK_3__']);
});
</script>
