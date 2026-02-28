<template>
  <div class="min-h-screen bg-gray-50 px-4 py-6 dark:bg-neutral-900">
    <div class="mx-auto w-full max-w-4xl space-y-4">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">藏宝阁</h1>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">你的个人藏品清单，AI 鉴宝后自动入库。</p>
          </div>
          <button
            @click="pickImage"
            :disabled="loading"
            class="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-200 dark:text-neutral-900"
          >
            {{ loading ? '鉴宝中...' : '鉴宝入库' }}
          </button>
          <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onFileChange" />
        </div>

        <div class="mt-4 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
          <p class="text-xs text-emerald-700 dark:text-emerald-300">总财富</p>
          <p class="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300">¥{{ formatValue(totalWealth) }}</p>
        </div>

        <p v-if="error" class="mt-3 text-sm text-rose-500">{{ error }}</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">藏品列表</h2>
          <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ items.length }} 件</span>
        </div>

        <div v-if="items.length === 0" class="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
          还没有藏品，点击右上角“鉴宝入库”开始。
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-neutral-700"
          >
            <img :src="imageUrl(item.id)" alt="藏品图" class="h-20 w-20 rounded-lg object-cover" />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{{ item.name }}</p>
                <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">¥{{ formatValue(item.value) }}</p>
              </div>
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {{ item.category }} · {{ item.condition_text }} · {{ item.summary_tag }}
              </p>
              <p class="mt-2 line-clamp-2 text-xs leading-5 text-neutral-600 dark:text-neutral-300">{{ item.comment || '暂无点评' }}</p>
            </div>
            <button @click="remove(item.id)" class="text-xs text-rose-600 hover:underline dark:text-rose-400">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const API_BASE = 'http://localhost:9701/api/apps/treasure';
const fileInput = ref(null);
const loading = ref(false);
const error = ref('');
const items = ref([]);
const totalWealth = ref(0);

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

const imageUrl = (id) => `${API_BASE}/image?id=${id}`;
const formatValue = (v) => Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });

loadItems().catch((err) => {
  error.value = err.message || '加载失败';
});
</script>
