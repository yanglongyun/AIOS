<template>
  <div class="min-h-screen bg-[#f5f0e8] font-serif">
    <div class="mx-auto max-w-[520px] px-4 pb-20">
      <!-- 顶部 -->
      <div class="pb-2 pt-7">
        <h1 class="text-xl font-bold text-[#3a2e1e]">我的宝贝</h1>
        <p class="mt-1 text-[11px] tracking-wide text-[#9a8a70]">已陪伴你 {{ daysSinceFirst }} 天</p>
      </div>

      <!-- 总估值 -->
      <div class="mb-4 border-b border-[#e4ddd0] pb-5 pt-3">
        <div class="text-[34px] font-bold text-[#5a3e28]">¥{{ formatValue(totalWealth) }}</div>
        <div class="mt-1.5 flex items-center gap-4">
          <span class="rounded-full bg-[#5a3e28] px-2 py-0.5 text-[11px] text-white">{{ items.length }} 件藏品</span>
          <span class="text-[11px] text-[#9a8a70]">{{ summaryText }}</span>
        </div>
      </div>

      <!-- 错误提示 -->
      <p v-if="error" class="mb-3 text-sm text-rose-500">{{ error }}</p>

      <!-- 列表头 -->
      <div class="mb-1 flex items-center justify-between">
        <div class="text-[11px] tracking-[2px] text-[#9a8a70]">全部藏品</div>
        <div class="flex gap-1">
          <button
            v-for="s in sortOptions" :key="s.key"
            @click="sortBy = s.key"
            class="rounded px-2.5 py-1 text-[11px] transition-colors"
            :class="sortBy === s.key ? 'bg-[#5a3e28] text-[#e8d8b8]' : 'text-[#9a8a70] hover:text-[#5a3e28]'"
          >{{ s.label }}</button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="items.length === 0 && !loading" class="py-16 text-center">
        <div class="text-4xl">📦</div>
        <p class="mt-3 text-[13px] leading-relaxed text-[#9a8a70]">还没有藏品<br>点击下方「鉴宝入库」开始</p>
      </div>

      <!-- 藏品列表 -->
      <div
        v-for="item in sortedItems"
        :key="item.id"
        @click="openDetail(item)"
        class="flex cursor-pointer gap-3.5 border-b border-[#ece6d8] py-4 last:border-b-0"
      >
        <img :src="imageUrl(item.id)" class="h-20 w-20 shrink-0 rounded-xl object-cover" />
        <div class="flex min-w-0 flex-1 flex-col justify-center">
          <div class="text-[15px] font-bold text-[#3a2e1e]">{{ item.name }}</div>
          <div class="mt-0.5 text-[11px] text-[#9a8a70]">{{ item.category }} · {{ item.condition_text }} · {{ item.summary_tag }}</div>
          <div class="mt-1.5 flex items-center justify-between">
            <div class="text-base font-bold text-[#5a3e28]">¥{{ formatValue(item.value) }}</div>
            <div class="text-[10px] text-[#b8a890]">{{ formatDate(item.created_at) }} 入库</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮鉴宝按钮 - 跟内容区同宽居中 -->
    <div class="pointer-events-none fixed inset-x-0 bottom-6 z-50">
      <div class="mx-auto max-w-[520px] px-4">
        <button
          @click="pickImage"
          :disabled="loading"
          class="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full bg-[#5a3e28] px-6 py-3.5 font-serif text-[15px] font-bold tracking-wide text-[#e8d8b8] shadow-[0_4px_20px_rgba(90,62,40,0.35)] transition-colors hover:bg-[#6d4e34] disabled:opacity-60"
        >
          <svg v-if="!loading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span v-if="loading">
            <svg class="inline h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            鉴宝中...
          </span>
          <span v-else>鉴宝入库</span>
        </button>
        <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onFileChange" />
      </div>
    </div>

    <!-- 详情抽屉 -->
    <div v-if="detailItem" class="fixed inset-0 z-[100] bg-black/50" @click.self="detailItem = null"></div>
    <Transition name="drawer">
      <div v-if="detailItem" class="fixed bottom-0 left-1/2 z-[101] max-h-[85vh] w-full max-w-[520px] -translate-x-1/2 overflow-y-auto rounded-t-2xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div class="mx-auto mt-2.5 h-1 w-9 rounded-full bg-[#d8d0c0]"></div>
        <img :src="imageUrl(detailItem.id)" class="h-[260px] w-full object-cover" />
        <div class="px-5 pb-7 pt-4">
          <div class="text-xl font-bold text-[#3a2e1e]">{{ detailItem.name }}</div>
          <div class="mt-1 text-xs text-[#9a8a70]">{{ detailItem.category }} · {{ detailItem.condition_text }} · {{ detailItem.summary_tag }} · 入库于 {{ formatDate(detailItem.created_at) }}</div>
          <div class="mt-3 text-[28px] font-bold text-[#5a3e28]">¥{{ formatValue(detailItem.value) }}</div>
          <div class="mt-3 rounded-lg border-l-2 border-[#c8a06040] bg-[#f5f0e8] p-3.5 text-[13px] italic leading-relaxed text-[#7a6a50]">
            "{{ detailItem.comment || '暂无点评' }}"
          </div>
          <div class="mt-4 flex gap-2.5">
            <button @click="detailItem = null" class="flex-1 rounded-lg bg-[#f0ebe0] py-3 font-serif text-[13px] font-semibold text-[#7a6a50]">关闭</button>
            <button @click="removeFromDetail" class="flex-1 rounded-lg bg-[#fdf0f0] py-3 font-serif text-[13px] font-semibold text-[#c06040]">删除</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const API_BASE = 'http://localhost:9701/api/apps/treasure';
const fileInput = ref(null);
const loading = ref(false);
const error = ref('');
const items = ref([]);
const totalWealth = ref(0);
const detailItem = ref(null);
const sortBy = ref('latest');
const sortOptions = [
  { key: 'latest', label: '最新' },
  { key: 'value', label: '最贵' }
];

const sortedItems = computed(() => {
  const list = [...items.value];
  if (sortBy.value === 'value') list.sort((a, b) => Number(b.value) - Number(a.value));
  else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
});

const summaryText = computed(() => {
  const tags = {};
  items.value.forEach(i => { tags[i.summary_tag] = (tags[i.summary_tag] || 0) + 1; });
  return Object.entries(tags).map(([k, v]) => `${k} ${v}`).join(' · ');
});

const daysSinceFirst = computed(() => {
  if (!items.value.length) return 0;
  const dates = items.value.map(i => new Date(i.created_at)).filter(d => !isNaN(d));
  if (!dates.length) return 0;
  const earliest = new Date(Math.min(...dates));
  return Math.max(1, Math.floor((Date.now() - earliest) / 86400000));
});

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok || data.success === false) throw new Error(data.message || '请求失败');
  return data;
};

const toDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('读取图片失败'));
  reader.readAsDataURL(file);
});

const loadItems = async () => {
  const data = await request(`${API_BASE}/list?page=1&pageSize=100`);
  items.value = data.list || [];
  totalWealth.value = Number(data.totalWealth || 0);
};

const pickImage = () => fileInput.value?.click();

const onFileChange = async (e) => {
  const file = e.target?.files?.[0];
  if (!file) return;
  loading.value = true;
  error.value = '';
  try {
    const dataUrl = await toDataUrl(file);
    const upload = await request(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, data: dataUrl })
    });
    await request(`${API_BASE}/appraise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagePath: upload.image.path })
    });
    await loadItems();
  } catch (err) {
    error.value = err.message || '鉴宝失败';
  } finally {
    loading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
};

const remove = async (id) => {
  try {
    await request(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadItems();
  } catch (err) {
    error.value = err.message || '删除失败';
  }
};

const removeFromDetail = async () => {
  if (!detailItem.value) return;
  await remove(detailItem.value.id);
  detailItem.value = null;
};

const openDetail = (item) => { detailItem.value = item; };
const imageUrl = (id) => `${API_BASE}/image?id=${id}`;
const formatValue = (v) => Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

loadItems().catch((err) => { error.value = err.message || '加载失败'; });
</script>
