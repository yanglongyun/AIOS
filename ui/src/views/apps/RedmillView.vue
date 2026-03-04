<template>
  <div class="flex h-full flex-col bg-[#f5f0e8] font-['Georgia','PingFang_SC',serif] dark:bg-[#1a1410]">
    <div class="flex items-center justify-between border-b border-[#dcd0b8] bg-[#fffdf8] px-6 py-4 dark:border-[#2a1e14] dark:bg-[#221a12]">
      <div>
        <h1 class="text-lg font-bold text-[#5a4a38] dark:text-[#e8d4b8]">红磨坊</h1>
        <p class="mt-0.5 text-xs text-[#8a7a60] dark:text-[#6a5840]">小红书风格图文创作台</p>
      </div>
      <button v-if="project" @click="backToList" class="text-xs text-[#8a7a60] hover:text-[#c8a060]">← 返回列表</button>
    </div>

    <!-- 列表模式 -->
    <div v-if="!project" class="flex-1 overflow-y-auto p-6">
      <div class="mx-auto max-w-[600px]">
        <div class="mb-4 flex gap-2">
          <input v-model="newTopic" placeholder="输入创作主题，如：秋冬穿搭指南" class="flex-1 rounded-lg border border-[#dcd0b8] bg-[#fffdf8] px-3 py-2 text-sm text-[#5a4a38] outline-none focus:border-[#c8a060] dark:border-[#3a2a1a] dark:bg-[#1a1410] dark:text-[#e8d4b8]" />
          <button @click="createProject" :disabled="!newTopic.trim() || creating"
            class="rounded-lg bg-[#c8a060] px-5 py-2 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d4b070] disabled:opacity-40">
            {{ creating ? '生成中...' : '开始创作' }}
          </button>
        </div>
        <div v-if="projects.length" class="space-y-2">
          <div v-for="p in projects" :key="p.id"
            class="flex cursor-pointer items-center justify-between rounded-lg border border-[#dcd0b8] bg-[#fffdf8] px-4 py-3 transition hover:border-[#c8a060] dark:border-[#3a2a1a] dark:bg-[#221a12]"
            @click="openProject(p.id)">
            <div>
              <div class="text-sm font-semibold text-[#5a4a38] dark:text-[#e8d4b8]">{{ p.topic }}</div>
              <div class="mt-0.5 text-[11px] text-[#b8a888] dark:text-[#5a4a38]">{{ p.pageCount }} 页 · {{ formatTime(p.createdAt) }}</div>
            </div>
            <button @click.stop="deleteProject(p.id)" class="text-xs text-[#b8a888] hover:text-[#a05050]">删除</button>
          </div>
        </div>
        <div v-else class="mt-12 text-center text-sm text-[#b8a888] dark:text-[#4a3a28]">输入主题，开始你的第一篇创作</div>
      </div>
    </div>

    <!-- 编辑模式 -->
    <div v-else class="flex flex-1 overflow-hidden">
      <!-- 左：页面列表 + 编辑 -->
      <div class="flex w-[360px] flex-shrink-0 flex-col border-r border-[#dcd0b8] dark:border-[#2a1e14]">
        <div class="border-b border-[#dcd0b8] px-4 py-3 dark:border-[#2a1e14]">
          <div class="text-sm font-semibold text-[#5a4a38] dark:text-[#e8d4b8]">{{ project.topic }}</div>
          <div class="mt-0.5 text-[11px] text-[#b8a888] dark:text-[#5a4a38]">{{ project.pages?.length || 0 }} 页</div>
        </div>
        <div class="flex-1 overflow-y-auto p-3">
          <div class="space-y-2">
            <div v-for="(page, i) in project.pages" :key="page.id"
              class="cursor-pointer rounded-lg border p-3 transition"
              :class="activePage === i ? 'border-[#c8a060] bg-[rgba(200,160,96,0.08)]' : 'border-[#dcd0b8] bg-[#fffdf8] hover:border-[#c8a060] dark:border-[#3a2a1a] dark:bg-[#221a12]'"
              @click="activePage = i">
              <div class="mb-1 flex items-center gap-2">
                <span class="rounded bg-[#c8a060] px-1.5 py-0.5 text-[10px] font-bold text-[#1a1008]">P{{ i + 1 }}</span>
                <span class="text-[10px] uppercase text-[#b8a888]">{{ page.pageType }}</span>
              </div>
              <div class="text-xs leading-relaxed text-[#5a4a38] dark:text-[#d4c0a0]" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                {{ page.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：编辑 + 预览 -->
      <div v-if="currentPage" class="flex flex-1 flex-col p-6">
        <div class="mb-3 flex items-center gap-2">
          <span class="rounded bg-[#c8a060] px-2 py-0.5 text-xs font-bold text-[#1a1008]">P{{ activePage + 1 }}</span>
          <span class="text-xs uppercase text-[#b8a888]">{{ currentPage.pageType }}</span>
        </div>
        <!-- 预览卡片 -->
        <div class="mx-auto mb-4 w-[280px] rounded-xl border border-[#dcd0b8] bg-gradient-to-b from-[#fffdf8] to-[#f5edd8] p-5 shadow-md dark:border-[#3a2a1a] dark:from-[#2a1e14] dark:to-[#221a10]"
          style="aspect-ratio: 3/4;">
          <div class="flex h-full flex-col justify-center text-center">
            <div v-if="currentPage.pageType === 'cover'" class="text-xl font-bold leading-relaxed text-[#5a4a38] dark:text-[#e8d4b8]">{{ currentPage.content }}</div>
            <div v-else-if="currentPage.pageType === 'summary'" class="text-sm leading-[2] text-[#8a7a60] dark:text-[#a08c70]">{{ currentPage.content }}</div>
            <div v-else class="text-[13px] leading-[2] text-[#5a4a38] dark:text-[#d4c0a0]">{{ currentPage.content }}</div>
          </div>
        </div>
        <!-- 编辑 -->
        <textarea v-model="currentPage.content" rows="5"
          class="w-full flex-1 resize-none rounded-lg border border-[#dcd0b8] bg-[#fffdf8] px-4 py-3 text-sm leading-relaxed text-[#5a4a38] outline-none focus:border-[#c8a060] dark:border-[#3a2a1a] dark:bg-[#1a1410] dark:text-[#e8d4b8]"
          @blur="savePage(currentPage)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const projects = ref([]);
const project = ref(null);
const activePage = ref(0);
const newTopic = ref('');
const creating = ref(false);

const currentPage = computed(() => project.value?.pages?.[activePage.value] || null);

const request = async (url, opts) => {
  const res = await fetch(url, { credentials: 'include', ...opts });
  return res.json();
};

const formatTime = (t) => t ? t.replace('T', ' ').slice(0, 16) : '';

const loadProjects = async () => {
  const data = await request('/apps/redmill/list');
  if (data.success) projects.value = data.items;
};

const createProject = async () => {
  if (!newTopic.value.trim() || creating.value) return;
  creating.value = true;
  const data = await request('/apps/redmill/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: newTopic.value.trim() })
  });
  creating.value = false;
  if (data.success) {
    project.value = data.project;
    activePage.value = 0;
    newTopic.value = '';
    loadProjects();
  }
};

const openProject = async (id) => {
  const data = await request(`/apps/redmill/detail?id=${id}`);
  if (data.success) {
    project.value = data.project;
    activePage.value = 0;
  }
};

const deleteProject = async (id) => {
  await request('/apps/redmill/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  loadProjects();
};

const backToList = () => {
  project.value = null;
  loadProjects();
};

const savePage = async (page) => {
  if (!page) return;
  await request('/apps/redmill/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageId: page.id, content: page.content })
  });
};

onMounted(loadProjects);
</script>
