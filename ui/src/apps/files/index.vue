<template>
  <div
    class="h-full overflow-y-auto bg-white p-6">
    <div class="mx-auto max-w-[960px]">
      <!-- 顶栏 -->
      <div class="mb-4 flex items-center justify-between gap-3">
        <h1 class="m-0 text-xl font-bold text-[#222]">__T_APP_SIDEBAR_FILES__</h1>
        <label
          class="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-black/50 transition hover:bg-black/[0.04]">
          __T_FILES_UPLOAD__
          <input type="file" class="hidden" multiple @change="onUpload" />
        </label>
      </div>

      <!-- 面包屑 -->
      <div class="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-black/40">
        <template v-for="(seg, i) in fullBreadcrumbs" :key="i">
          <span v-if="i > 0" class="text-black/20">/</span>
          <button v-if="seg.clickable" @click="goDir(seg.dir)"
            class="rounded px-1.5 py-0.5 hover:bg-black/[0.05]">{{ seg.name }}</button>
          <span v-else class="px-1.5 py-0.5 text-black/30">{{ seg.name }}</span>
        </template>
      </div>

      <!-- 文件列表 -->
      <div
        class="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop">

        <!-- 拖拽提示 -->
        <div v-if="dragOver"
          class="flex items-center justify-center rounded-lg border-2 border-dashed border-black/20 bg-black/[0.02] py-12 text-sm text-black/40">
          __T_FILES_DROP_HINT__
        </div>

        <div v-else-if="loading" class="py-8 text-center text-xs text-black/35">...</div>

        <div v-else-if="items.length === 0"
          class="rounded-lg border border-dashed border-black/10 py-8 text-center text-xs text-black/35">
          __T_FILES_EMPTY__
        </div>

        <div v-else class="space-y-1">
          <div v-for="item in items" :key="item.name"
            class="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition hover:border-black/[0.06] hover:bg-black/[0.02]">
            <!-- 图标 -->
            <span class="shrink-0 text-[14px]">{{ item.type === 'dir' ? '📁' : fileIcon(item.name) }}</span>

            <!-- 名称（目录可点击） -->
            <button v-if="item.type === 'dir'" @click="goDir(absPath(currentDir, item.name))"
              class="flex-1 truncate text-left text-[13px] font-medium text-[#222] hover:underline">
              {{ item.name }}
            </button>
            <span v-else class="flex-1 truncate text-[13px] text-[#333]">{{ item.name }}</span>

            <!-- 大小 -->
            <span class="shrink-0 text-[11px] text-black/35">
              {{ item.type === 'dir' ? '' : formatSize(item.size) }}
            </span>

            <!-- 时间 -->
            <span class="hidden shrink-0 text-[11px] text-black/35 sm:inline">
              {{ formatTime(item.modified) }}
            </span>

            <!-- 操作 -->
            <div v-if="item.type === 'file'"
              class="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
              <button @click="download(item)"
                class="rounded px-1.5 py-0.5 text-[11px] text-black/40 hover:bg-black/[0.05]"
                title="__T_FILES_DOWNLOAD__">↓</button>
              <button @click="confirmDelete(item)"
                class="rounded px-1.5 py-0.5 text-[11px] text-red-500 hover:bg-red-50"
                title="__T_FILES_DELETE__">{{ item._deleting ? '确认?' : '×' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploading" class="mt-3 text-center text-[11px] text-black/35">
        __T_FILES_UPLOADING__ {{ uploadCount }}...
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';

const items = ref([]);
const currentDir = ref('files');
const rootPath = ref('');
const loading = ref(true);
const dragOver = ref(false);
const uploading = ref(false);
const uploadCount = ref(0);

// 完整面包屑：全部可点击
const fullBreadcrumbs = computed(() => {
  const dir = currentDir.value || '';
  const isAbs = dir.startsWith('/');

  // 绝对路径：直接拆分显示
  if (isAbs) {
    const parts = dir.split('/').filter(Boolean);
    return parts.map((name, i) => ({
      name,
      clickable: true,
      dir: '/' + parts.slice(0, i + 1).join('/')
    }));
  }

  // 相对路径：rootPath + currentDir
  const crumbs = [];
  if (rootPath.value) {
    const parts = rootPath.value.split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      crumbs.push({
        name: parts[i],
        clickable: true,
        dir: '/' + parts.slice(0, i + 1).join('/')
      });
    }
  }
  if (dir) {
    const segs = dir.split('/');
    for (let i = 0; i < segs.length; i++) {
      crumbs.push({
        name: segs[i],
        clickable: true,
        dir: segs.slice(0, i + 1).join('/')
      });
    }
  }
  return crumbs;
});

const loadDir = async (dir = '') => {
  loading.value = true;
  try {
    const res = await fetch(`/aios/api/files/list?dir=${encodeURIComponent(dir)}`);
    const data = await res.json();
    items.value = (data.data || []).map(f => ({ ...f, _deleting: false }));
    currentDir.value = dir;
    if (data.root && !rootPath.value) rootPath.value = data.root;
  } catch { items.value = []; }
  loading.value = false;
};

const goDir = (dir) => loadDir(dir);

const fileIcon = (name) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const map = {
    pdf: '📄', doc: '📝', docx: '📝', txt: '📃', md: '📃',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', webp: '🖼️',
    json: '📋', csv: '📊', xlsx: '📊', pptx: '📊',
    log: '📜'
  };
  return map[ext] || '📄';
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const absPath = (base, name) => {
  if (!base) return name;
  return base.endsWith('/') ? base + name : base + '/' + name;
};

const filePath = (item) => currentDir.value ? absPath(currentDir.value, item.name) : item.name;

const download = (item) => {
  const a = document.createElement('a');
  a.href = `/aios/api/files/download?path=${encodeURIComponent(filePath(item))}`;
  a.download = item.name;
  a.click();
};

const confirmDelete = async (item) => {
  if (!item._deleting) {
    item._deleting = true;
    setTimeout(() => { item._deleting = false; }, 2000);
    return;
  }
  await fetch('/aios/api/files/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath(item) })
  });
  await loadDir(currentDir.value);
};

const uploadFiles = async (fileList) => {
  if (!fileList?.length) return;
  uploading.value = true;
  uploadCount.value = fileList.length;

  for (const file of fileList) {
    const reader = new FileReader();
    await new Promise((resolve) => {
      reader.onload = async () => {
        await fetch('/aios/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            data: reader.result,
            dir: currentDir.value || 'files/uploads/chat'
          })
        });
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  uploading.value = false;
  await loadDir(currentDir.value);
};

const onUpload = (e) => uploadFiles(e.target.files);
const onDrop = (e) => { dragOver.value = false; uploadFiles(e.dataTransfer.files); };

onMounted(() => {
  loadDir('files');
});
</script>
