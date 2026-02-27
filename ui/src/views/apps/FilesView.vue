<template>
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

    <div class="flex flex-1 min-h-0 overflow-hidden">

      <!-- 左侧：文件列表 -->
      <div class="flex flex-col w-72 shrink-0 border-r border-gray-100 dark:border-neutral-800 overflow-hidden">
        <!-- 路径导航 -->
        <div class="flex items-center gap-1 px-3 py-2 border-b border-gray-100 dark:border-neutral-800 shrink-0">
          <button v-if="currentPath !== '/'" @click="goUp"
            class="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <span class="text-xs text-neutral-400 dark:text-neutral-500 truncate flex-1 font-mono">{{ currentPath }}</span>
        </div>

        <!-- 文件列表 -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <span class="text-xs text-neutral-400">加载中...</span>
          </div>
          <div v-else-if="error" class="px-4 py-3 text-xs text-red-500">{{ error }}</div>
          <div v-else class="py-1">
            <button
              v-for="item in items"
              :key="item.path"
              @click="handleClick(item)"
              class="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors cursor-pointer"
              :class="selectedPath === item.path
                ? 'bg-gray-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/60'">
              <!-- 图标 -->
              <span class="shrink-0 text-base leading-none">{{ item.isDir ? '📁' : getFileEmoji(item.ext) }}</span>
              <span class="flex-1 min-w-0 truncate text-xs">{{ item.name }}</span>
              <span v-if="!item.isDir && item.size != null" class="text-[10px] text-neutral-400 shrink-0">{{ formatSize(item.size) }}</span>
            </button>
            <div v-if="!items.length" class="px-4 py-6 text-xs text-neutral-400 text-center">空目录</div>
          </div>
        </div>
      </div>

      <!-- 右侧：文件预览 -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- 无选中 -->
        <div v-if="!selectedPath" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="text-3xl mb-2">📂</div>
            <p class="text-sm text-neutral-400">选择文件预览内容</p>
          </div>
        </div>

        <!-- 目录信息 -->
        <div v-else-if="selectedItem?.isDir" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="text-3xl mb-2">📁</div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ selectedItem.name }}</p>
            <p class="text-xs text-neutral-400 mt-1">点击进入目录</p>
          </div>
        </div>

        <!-- 文件预览 -->
        <template v-else>
          <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-neutral-800 shrink-0">
            <span class="text-sm">{{ getFileEmoji(selectedItem?.ext) }}</span>
            <span class="text-xs text-neutral-600 dark:text-neutral-300 truncate flex-1 font-mono">{{ selectedItem?.name }}</span>
            <span v-if="selectedItem?.size != null" class="text-[10px] text-neutral-400 shrink-0">{{ formatSize(selectedItem.size) }}</span>
          </div>
          <div class="flex-1 overflow-auto">
            <div v-if="previewLoading" class="flex items-center justify-center py-8">
              <span class="text-xs text-neutral-400">加载中...</span>
            </div>
            <div v-else-if="previewError" class="px-4 py-4 text-xs text-neutral-400 italic">{{ previewError }}</div>
            <pre v-else class="px-4 py-4 text-xs text-neutral-700 dark:text-neutral-300 font-mono whitespace-pre-wrap break-all leading-relaxed">{{ previewContent }}</pre>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';


const currentPath = ref('');
const items = ref([]);
const loading = ref(false);
const error = ref('');
const selectedPath = ref('');
const selectedItem = ref(null);
const previewContent = ref('');
const previewError = ref('');
const previewLoading = ref(false);

const request = async (url) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status}`);
  return data;
};

const formatSize = (bytes) => {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

const getFileEmoji = (ext) => {
  const map = {
    '.md': '📝', '.txt': '📄', '.json': '📋', '.js': '⚡', '.ts': '⚡',
    '.vue': '💚', '.css': '🎨', '.html': '🌐', '.sh': '⚙️', '.py': '🐍',
    '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️', '.svg': '🖼️',
    '.mp4': '🎬', '.mp3': '🎵', '.pdf': '📕', '.zip': '📦', '.tar': '📦',
    '.log': '📜', '.env': '🔑', '.yaml': '⚙️', '.yml': '⚙️', '.toml': '⚙️',
  };
  return map[ext] || '📄';
};

const loadDir = async (dirPath) => {
  loading.value = true;
  error.value = '';
  items.value = [];
  selectedPath.value = '';
  selectedItem.value = null;
  previewContent.value = '';
  previewError.value = '';
  try {
    const data = await request(`/api/apps/files/list?path=${encodeURIComponent(dirPath)}`);
    if (data.error) { error.value = data.error; return; }
    currentPath.value = data.path;
    items.value = data.items;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const loadPreview = async (filePath) => {
  previewLoading.value = true;
  previewContent.value = '';
  previewError.value = '';
  try {
    const data = await request(`/api/apps/files/read?path=${encodeURIComponent(filePath)}`);
    if (data.error) previewError.value = data.error;
    else previewContent.value = data.content;
  } catch (e) {
    previewError.value = e.message;
  } finally {
    previewLoading.value = false;
  }
};

const handleClick = (item) => {
  if (item.isDir) {
    loadDir(item.path);
    return;
  }
  selectedPath.value = item.path;
  selectedItem.value = item;
  loadPreview(item.path);
};

const goUp = () => {
  const url = new URL(window.location.href);
  // 取 currentPath 的上级
  const parent = currentPath.value.split('/').slice(0, -1).join('/') || '/';
  loadDir(parent);
};

onMounted(() => {
  // 默认从 home 目录开始
  loadDir('~');
});
</script>
