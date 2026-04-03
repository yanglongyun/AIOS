<template>
  <div class="flex h-full flex-col bg-[#f6f5ef] text-[#2c2c2c]" style="font-family: Georgia, 'PingFang SC', serif;">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-3 border-b-2 border-[#f60] bg-[#f60] shrink-0">
      <div class="flex items-center gap-3">
        <template v-if="view === 'detail'">
          <button @click="view = 'list'" class="text-white/80 hover:text-white text-sm font-sans">← __T_HN_BACK__</button>
        </template>
        <template v-else>
          <span class="text-white font-bold text-lg tracking-tight">Y</span>
          <span class="text-white font-bold text-sm font-sans tracking-wide">__T_HN_TITLE__</span>
        </template>
      </div>
      <div v-if="view !== 'detail'" class="flex items-center gap-2">
        <button v-for="tab in tabs" :key="tab.id" @click="switchTab(tab.id)"
          class="px-2.5 py-0.5 text-[11px] font-sans rounded transition-colors"
          :class="activeTab === tab.id ? 'bg-white/25 text-white' : 'text-white/60 hover:text-white'">
          {{ tab.label }}
        </button>
        <span class="text-white/30 mx-1">|</span>
        <button @click="view = view === 'bookmarks' ? 'list' : 'bookmarks'"
          class="text-[11px] font-sans transition-colors"
          :class="view === 'bookmarks' ? 'text-white' : 'text-white/60 hover:text-white'">
          ★ __T_HN_BOOKMARKS__ ({{ bookmarks.length }})
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-if="view === 'list'" class="flex-1 overflow-y-auto">
      <div v-if="loading" class="text-center text-[#999] text-sm py-16 font-sans">__T_HN_LOADING__</div>
      <div v-else class="max-w-[680px] mx-auto py-4">
        <!-- Digest -->
        <div class="px-5 pb-3 mb-1 border-b border-[#e8e5d8]">
          <button v-if="!digestText" @click="doDigest" :disabled="digesting"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-sans font-medium rounded-lg transition-all disabled:opacity-40"
            :class="digesting ? 'bg-[#f0ede4] text-[#999]' : 'bg-[#fff8e1] text-[#f57f17] hover:bg-[#fff3c4]'">
            <span>✦</span> {{ digesting ? '__T_HN_DIGESTING__' : '__T_HN_DIGEST__' }}
          </button>
          <div v-if="digestText" class="bg-white border border-[#e0ddd0] rounded-lg p-4 text-[14px] leading-relaxed font-sans shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-bold text-[#c45500] uppercase tracking-wider">__T_HN_DIGEST__</span>
              <button @click="digestText = ''" class="text-[10px] text-[#ccc] hover:text-[#999]">✕</button>
            </div>
            <div v-html="renderMd(digestText)"></div>
          </div>
        </div>
        <div v-for="(s, i) in stories" :key="s.id"
          class="group flex gap-3 px-5 py-3.5 transition-colors hover:bg-[#eeebdf] cursor-pointer border-b border-[#e8e5d8]"
          @click="openDetail(s.id)">
          <span class="text-[#c4c0b0] text-[13px] font-sans w-6 text-right shrink-0 pt-0.5 font-medium">{{ i + 1 }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-[15px] leading-snug mb-1.5 group-hover:text-[#c45500]">{{ s.title }}</div>
            <div class="flex items-center gap-3 text-[11px] text-[#999] font-sans">
              <span>▲ {{ s.score }}</span>
              <span>{{ s.by }}</span>
              <span>{{ s.descendants }} __T_HN_COMMENTS_COUNT__</span>
              <span v-if="s.url" class="text-[#c4c0b0]">{{ getDomain(s.url) }}</span>
            </div>
          </div>
          <button @click.stop="toggleBookmark(s)"
            class="shrink-0 text-lg opacity-0 group-hover:opacity-100 transition-opacity"
            :class="isBookmarked(s.id) ? 'text-[#f60] opacity-100' : 'text-[#ddd] hover:text-[#f60]'">
            {{ isBookmarked(s.id) ? '★' : '☆' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bookmarks -->
    <div v-if="view === 'bookmarks'" class="flex-1 overflow-y-auto">
      <div class="max-w-[680px] mx-auto py-4">
        <div v-if="!bookmarks.length" class="text-center text-[#bbb] text-sm py-16 font-sans">__T_HN_NO_BOOKMARKS__</div>
        <div v-for="bm in bookmarks" :key="bm.id"
          class="group flex items-center gap-3 px-5 py-3.5 border-b border-[#e8e5d8] hover:bg-[#eeebdf] cursor-pointer transition-colors"
          @click="openDetail(bm.hn_id)">
          <div class="flex-1 min-w-0">
            <div class="text-[15px] leading-snug mb-1">{{ bm.title }}</div>
            <div class="text-[11px] text-[#999] font-sans">▲ {{ bm.score }} · {{ bm.by }}</div>
          </div>
          <button @click.stop="toggleBookmark(bm)" class="text-[#f60] text-lg shrink-0 hover:scale-110 transition-transform">★</button>
        </div>
      </div>
    </div>

    <!-- Detail -->
    <div v-if="view === 'detail'" class="flex-1 overflow-y-auto">
      <div v-if="detailLoading" class="text-center text-[#999] text-sm py-16 font-sans">__T_HN_LOADING__</div>
      <div v-else-if="story" class="max-w-[680px] mx-auto py-6 px-5">
        <!-- Article header -->
        <h1 class="text-xl font-bold leading-tight mb-2">{{ story.title }}</h1>
        <div class="flex items-center gap-3 text-[12px] text-[#999] font-sans mb-5 pb-4 border-b border-[#e8e5d8]">
          <span>▲ {{ story.score }} __T_HN_PTS__</span>
          <span>{{ story.by }}</span>
          <span>{{ story.descendants }} __T_HN_COMMENTS_COUNT__</span>
          <a v-if="story.url" :href="story.url" target="_blank"
            class="ml-auto text-[#c45500] hover:underline">{{ getDomain(story.url) }} ↗</a>
        </div>

        <!-- AI Summary -->
        <div class="mb-6">
          <button @click="doSummarize" :disabled="summarizing"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-sans font-medium rounded-lg transition-all disabled:opacity-40"
            :class="summaryText ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#fff8e1] text-[#f57f17] hover:bg-[#fff3c4]'">
            <span>✦</span> {{ summarizing ? '__T_HN_SUMMARIZING__' : '__T_HN_SUMMARIZE__' }}
          </button>
          <div v-if="summaryText" class="mt-3 bg-white border border-[#e0ddd0] rounded-lg p-4 text-[14px] leading-relaxed font-sans shadow-sm" v-html="renderMd(summaryText)"></div>
        </div>

        <!-- Comments -->
        <div v-if="comments.length">
          <div class="text-[11px] font-sans font-bold text-[#999] uppercase tracking-wider mb-4">__T_HN_COMMENTS__</div>
          <div v-for="c in comments" :key="c.id" class="mb-4 pb-4 border-b border-[#f0ede4] last:border-0">
            <div class="text-[11px] text-[#c45500] font-sans font-medium mb-1.5">{{ c.by }}</div>
            <div class="text-[13.5px] text-[#444] leading-relaxed font-sans" v-html="c.text"></div>
            <div v-for="child in c.children" :key="child.id" class="ml-5 mt-3 pl-4 border-l-2 border-[#e8e5d8]">
              <div class="text-[11px] text-[#999] font-sans mb-1">{{ child.by }}</div>
              <div class="text-[13px] text-[#666] leading-relaxed font-sans" v-html="child.text"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { marked } from 'marked';
import { LOCALE } from '../../locale.js';
marked.setOptions({ breaks: true, gfm: true });
const renderMd = (t) => marked.parse(t || '');

const view = ref('list');
const activeTab = ref('top');
const tabs = [{ id: 'top', label: '__T_HN_TOP__' }, { id: 'new', label: '__T_HN_NEW__' }, { id: 'best', label: '__T_HN_BEST__' }];
const stories = ref([]); const loading = ref(false); const bookmarks = ref([]);
const story = ref(null); const comments = ref([]); const detailLoading = ref(false);
const summarizing = ref(false); const summaryText = ref('');
const digesting = ref(false); const digestText = ref('');

const isBookmarked = (id) => bookmarks.value.some((b) => b.hn_id === id);
const getDomain = (u) => { try { return new URL(u).hostname.replace('www.', ''); } catch { return ''; } };
const api = async (p, o) => { const r = await fetch(`/aios/apps/hackernews/${p}`, o); return r.json(); };

const loadStories = async (type = 'top') => { loading.value = true; try { stories.value = (await api(`list?type=${type}`)).stories || []; } catch {} loading.value = false; };
const loadBookmarks = async () => { try { bookmarks.value = (await api('bookmarks')).bookmarks || []; } catch {} };
const switchTab = (t) => { activeTab.value = t; view.value = 'list'; digestText.value = ''; loadStories(t); };

const openDetail = async (id) => {
  view.value = 'detail'; detailLoading.value = true; summaryText.value = '';
  try { const d = await api(`detail?id=${id}`); story.value = d.story; comments.value = d.comments || []; } catch {}
  detailLoading.value = false;
};

const toggleBookmark = async (item) => {
  const hnId = item.hn_id || item.id;
  if (isBookmarked(hnId)) await api('unbookmark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hnId }) });
  else await api('bookmark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hnId, title: item.title, url: item.url, by: item.by, score: item.score }) });
  await loadBookmarks();
};

const doSummarize = async () => {
  if (!story.value) return; summarizing.value = true;
  try { summaryText.value = (await api('summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: story.value.title, url: story.value.url, text: story.value.text, locale: LOCALE }) })).summary || ''; }
  catch { summaryText.value = 'Failed'; } summarizing.value = false;
};

const doDigest = async () => {
  digesting.value = true;
  try {
    const list = stories.value.slice(0, 20).map((s, i) => `${i + 1}. ${s.title} (${s.score} pts, ${s.descendants} comments)`).join('\n');
    digestText.value = (await api('summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Hacker News Digest', text: list, locale: LOCALE }) })).summary || '';
  } catch { digestText.value = 'Failed'; }
  digesting.value = false;
};

onMounted(() => { loadStories('top'); loadBookmarks(); });
</script>
