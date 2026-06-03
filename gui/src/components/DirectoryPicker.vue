<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[420] flex items-center justify-center bg-[rgba(1,5,12,0.6)] px-6 py-8 backdrop-blur" @click="emit('close')">
      <div class="flex h-[560px] w-[760px] max-w-full flex-col overflow-hidden rounded-xl border border-line bg-card shadow-[0_0_0_1px_rgba(0,215,255,0.14),0_18px_52px_rgba(0,7,20,0.6)]" @click.stop>
        <div class="border-b border-line-soft px-5 py-4">
          <div class="text-[15px] font-semibold text-ink">选择目录</div>
          <div class="mt-1 text-[12px] text-muted">为 Claude Code 会话选择工作目录。</div>
        </div>

        <div class="border-b border-line-soft px-4 py-3">
          <div class="flex flex-wrap items-center gap-y-1 text-[12px]">
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
              <button
                type="button"
                class="max-w-[180px] rounded-lg px-1.5 py-1 transition-colors"
                :class="index === breadcrumbs.length - 1
                  ? 'cursor-default bg-bg-hi text-ink'
                  : 'text-muted hover:bg-bg-hi hover:text-ink'"
                @click="openBreadcrumb(crumb.path)"
              >
                <span class="truncate">{{ crumb.label }}</span>
              </button>
              <span v-if="index < breadcrumbs.length - 1" class="px-1 text-faint">/</span>
            </template>
          </div>
          <div class="mt-2 truncate text-[11px] text-faint">{{ currentBase || '/' }}</div>
        </div>

        <div class="min-h-0 flex-1 overflow-auto px-3 py-3 [scrollbar-width:thin]">
          <div v-if="loading" class="px-2 py-6 text-[12px] text-faint">加载中...</div>
          <div v-else-if="error" class="px-2 py-6 text-[12px] text-bad">{{ error }}</div>
          <div v-else-if="!folders.length" class="px-2 py-6 text-[12px] text-faint">没有子目录</div>
          <div v-else class="space-y-1">
            <button
              v-for="folder in folders"
              :key="folder.path"
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] transition-colors"
              :class="selectedPath === folderPath(folder)
                ? 'bg-accent-soft text-accent-hi'
                : 'bg-bg-elev text-ink hover:bg-bg-hi'"
              @click="selectedPath = folderPath(folder)"
              @dblclick="enterFolder(folder)"
            >
              <span class="text-[14px]">📁</span>
              <span class="min-w-0 flex-1 truncate">{{ folder.name }}</span>
              <span class="text-[10px] uppercase tracking-[0.12em] text-faint">打开</span>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-line-soft px-4 py-3">
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-[12px] text-muted transition-colors hover:bg-bg-hi hover:text-ink"
            @click="openParent"
          >上一级</button>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-accent hover:text-accent-hi"
              @click="emit('close')"
            >取消</button>
            <button
              type="button"
              class="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-[#001019] shadow-[0_0_18px_rgba(0,215,255,0.35)] transition-colors hover:bg-accent-hi"
              @click="selectCurrent"
            >选择</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialBase: { type: String, default: '/' }
});

const emit = defineEmits(['close', 'select']);

const currentBase = ref('/');
const selectedPath = ref('/');
const folders = ref([]);
const loading = ref(false);
const error = ref('');

const request = async (url) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `${res.status}`);
  return data;
};

const normalizePath = (path = '/') => {
  const clean = String(path || '/').replace(/\/+$/, '');
  return clean || '/';
};

const joinPath = (base = '/', rel = '') => {
  const cleanBase = normalizePath(base);
  const cleanRel = String(rel || '').replace(/^\/+/, '');
  if (!cleanRel) return cleanBase;
  if (cleanBase === '/') return `/${cleanRel}`;
  return `${cleanBase}/${cleanRel}`;
};

const parentPath = (path = '/') => {
  const normalized = normalizePath(path);
  if (normalized === '/') return '/';
  const index = normalized.lastIndexOf('/');
  return index <= 0 ? '/' : normalized.slice(0, index);
};

const folderPath = (folder) => joinPath(currentBase.value, folder.path || folder.name || '');

const breadcrumbs = computed(() => {
  const segments = normalizePath(currentBase.value).split('/').filter(Boolean);
  const list = [{ label: '根目录', path: '/' }];
  let current = '';
  for (const segment of segments) {
    current = `${current}/${segment}`;
    list.push({ label: segment, path: current || '/' });
  }
  return list;
});

const loadFolders = async (base) => {
  loading.value = true;
  error.value = '';
  try {
      const data = await request(`/api/fs/list?path=${encodeURIComponent(base)}&showHidden=1`);
      currentBase.value = data.path || normalizePath(base);
      selectedPath.value = currentBase.value;
      folders.value = Array.isArray(data.entries) ? data.entries.filter((item) => item.type === 'dir') : [];
  } catch (e) {
    error.value = e.message || '目录加载失败';
    folders.value = [];
  } finally {
    loading.value = false;
  }
};

const openBreadcrumb = async (path) => {
  if (!path || path === currentBase.value) return;
  await loadFolders(path);
};

const openParent = async () => {
  await loadFolders(parentPath(currentBase.value));
};

const enterFolder = async (folder) => {
  await loadFolders(folderPath(folder));
};

const selectCurrent = () => {
  emit('select', normalizePath(selectedPath.value || currentBase.value));
};

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return;
    await loadFolders(normalizePath(props.initialBase || '/'));
  }
);
</script>
