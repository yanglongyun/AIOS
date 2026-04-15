<template>
  <div class="relative flex h-full min-h-0 flex-col bg-[#f7f4ef]" @click="closeCtx">

    <!-- Breadcrumb bar -->
    <div class="flex h-9 shrink-0 items-center border-b px-4" style="border-color:rgba(0,0,0,0.06);background:rgba(247,244,239,0.9)">
      <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path">
        <button
          class="inline-flex max-w-[160px] items-center gap-1 rounded-[7px] px-[7px] py-[3px] text-[12px] font-semibold transition"
          :class="i === breadcrumbs.length - 1
            ? 'cursor-default text-[#2a1f13]'
            : 'text-[rgba(42,31,19,0.5)] hover:bg-black/[0.06] hover:text-[#2a1f13]'"
          @click.stop="i < breadcrumbs.length - 1 && navigate(crumb.path)"
        >
          <span class="text-[11px]">{{ crumb.icon }}</span>
          <span class="truncate">{{ crumb.name }}</span>
        </button>
        <span v-if="i < breadcrumbs.length - 1" class="mx-0.5 select-none text-[11px]" style="color:rgba(0,0,0,0.2)">›</span>
      </template>
    </div>

    <!-- Icon grid -->
    <div
      class="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]"
      @contextmenu.prevent="onBgCtx"
      @click.self="clearSelection"
    >
      <div v-if="treeLoading" class="py-16 text-center text-[13px]" style="color:rgba(0,0,0,0.35)">__T_MEMORY_LOADING__</div>

      <div v-else-if="!currentChildren.length" class="flex flex-col items-center justify-center py-16">
        <div class="text-[40px] opacity-40">🌳</div>
        <div class="mt-3 text-[15px] font-semibold" style="color:#2a1f13">__T_MEMORY_EMPTY__</div>
      </div>

      <div
        v-else
        class="grid content-start justify-start"
        style="grid-template-columns:repeat(auto-fill,88px);gap:6px 4px"
      >
        <div
          v-for="item in currentChildren"
          :key="item.path"
          class="flex flex-col items-center gap-[5px] rounded-[12px] border-[1.5px] px-[6px] py-[10px] text-center transition select-none"
          :style="selectedPath === item.path
            ? 'background:rgba(140,100,60,0.13);border-color:rgba(140,100,60,0.25)'
            : 'border-color:transparent'"
          :class="selectedPath !== item.path && 'hover:bg-[rgba(140,100,60,0.07)]'"
          @click.stop="selectedPath = item.path"
          @dblclick.stop="handleOpen(item)"
          @contextmenu.prevent.stop="onItemCtx($event, item)"
        >
          <div v-if="item.type === 'dir'" class="relative h-10 w-12">
            <div class="absolute left-[2px] top-0 h-2 w-[18px] rounded-t" style="background:linear-gradient(135deg,#c9a56e,#b8904e)"></div>
            <div class="absolute inset-x-0 bottom-0 top-[5px] rounded-[3px_8px_8px_8px]" style="background:linear-gradient(160deg,#d4b07a,#c49a5a);box-shadow:0 2px 8px rgba(150,90,20,0.2),inset 0 1px 0 rgba(255,255,255,0.25)"></div>
            <div class="absolute left-[3px] right-[3px] top-[7px] h-[10px] rounded-[2px_5px_0_0]" style="background:linear-gradient(180deg,rgba(255,255,255,0.22),transparent)"></div>
          </div>
          <div v-else class="relative" style="width:38px;height:46px">
            <div class="absolute inset-0" style="background:#fff;border-radius:4px 10px 4px 4px;box-shadow:0 2px 6px rgba(0,0,0,0.1),0 0 0 1px rgba(0,0,0,0.07)"></div>
            <div class="absolute right-0 top-0" style="width:11px;height:11px;background:#e8e3da;border-radius:0 0 0 5px"></div>
            <div class="absolute flex flex-col" style="top:17px;left:7px;right:7px;gap:3.5px">
              <span class="block h-0.5 rounded" style="background:rgba(160,120,80,0.2)"></span>
              <span class="block h-0.5 rounded" style="background:rgba(160,120,80,0.2)"></span>
              <span class="block h-0.5 rounded" style="width:65%;background:rgba(160,120,80,0.2)"></span>
            </div>
          </div>
          <div class="line-clamp-2 break-all text-[11.5px] font-medium leading-[1.3]" style="max-width:78px;color:#2a1f13">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- Context menu -->
    <div
      v-if="ctx.visible"
      class="fixed z-50 overflow-hidden border p-1 backdrop-blur"
      style="min-width:180px;border-radius:13px;border-color:rgba(0,0,0,0.1);background:rgba(250,247,242,0.97);box-shadow:0 2px 8px rgba(0,0,0,0.08),0 16px 48px rgba(0,0,0,0.16)"
      :style="{ left: `${ctx.x}px`, top: `${ctx.y}px` }"
      @click.stop
    >
      <template v-if="!ctx.item">
        <button class="ctx-row" @click="createDir(null)">📁 __T_MEMORY_CREATE_DIR__</button>
        <button class="ctx-row" @click="createFile(null)">📄 __T_MEMORY_CREATE_FILE__</button>
      </template>
      <template v-else-if="ctx.item.type === 'dir'">
        <button class="ctx-row" @click="handleOpen(ctx.item)">📂 __T_MEMORY_CREATE_DIR__</button>
        <div class="ctx-sep"></div>
        <button class="ctx-row" @click="createDir(ctx.item)">📁 __T_MEMORY_CREATE_DIR__</button>
        <button class="ctx-row" @click="createFile(ctx.item)">📄 __T_MEMORY_CREATE_FILE__</button>
        <div class="ctx-sep"></div>
        <button class="ctx-row" @click="renameNode(ctx.item)">✏️ __T_MEMORY_RENAME__</button>
        <button class="ctx-row ctx-danger" @click="deleteNode(ctx.item)">🗑 __T_MEMORY_DELETE__</button>
      </template>
      <template v-else>
        <button class="ctx-row" @click="handleOpen(ctx.item)">✏️ __T_MEMORY_SAVE__</button>
        <div class="ctx-sep"></div>
        <button class="ctx-row" @click="renameNode(ctx.item)">🔤 __T_MEMORY_RENAME__</button>
        <button class="ctx-row ctx-danger" @click="deleteNode(ctx.item)">🗑 __T_MEMORY_DELETE__</button>
      </template>
    </div>

    <!-- In-app modal -->
    <Transition name="modal-fade">
      <div v-if="modal" class="absolute inset-0 z-50 flex items-center justify-center px-6 py-8">
        <button type="button" class="absolute inset-0 border-none bg-[rgba(28,20,12,0.36)]" @click="cancelModal" />
        <div class="relative z-10 flex w-full max-w-[400px] flex-col overflow-hidden rounded-[18px] border bg-[#fbfaf7] shadow-[0_18px_48px_rgba(0,0,0,0.22)]" style="border-color:rgba(92,67,50,0.16)">
          <div class="px-5 pb-3 pt-5">
            <div class="text-[14.5px] font-semibold" style="color:#2a1f13">{{ modal.title }}</div>
            <input
              v-if="modal.type === 'prompt'"
              ref="modalInputRef"
              v-model="modal.value"
              :placeholder="modal.placeholder"
              class="mt-3 w-full rounded-[9px] border px-3 py-2 text-[13px] outline-none transition-colors"
              style="border-color:rgba(92,67,50,0.18);background:#fff;color:#2a1f13"
              @keydown.enter.prevent="submitModal"
              @keydown.esc.prevent="cancelModal"
            />
          </div>
          <div class="flex items-center justify-end gap-2 border-t px-5 py-3" style="border-color:rgba(92,67,50,0.1)">
            <button
              type="button"
              class="rounded-[9px] border px-4 py-[6px] text-[12px] font-semibold transition-colors hover:bg-black/[0.03]"
              style="border-color:rgba(92,67,50,0.16);background:#fff;color:rgba(61,47,30,0.6)"
              @click="cancelModal"
            >__T_COMMON_CANCEL__</button>
            <button
              type="button"
              class="rounded-[9px] px-4 py-[6px] text-[12px] font-semibold text-white transition-all hover:brightness-110"
              :style="modal.danger ? 'background:#b03a20' : 'background:#5c4332'"
              @click="submitModal"
            >__T_COMMON_CONFIRM__</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { windowManager } from '../../system/windows.js';
import { toast } from '../../stores/toast.js';

const tree = ref(null);
const treeLoading = ref(false);
const currentPath = ref('');
const selectedPath = ref(null);
const ctx = ref({ visible: false, x: 0, y: 0, item: null });

// In-app modal: promise-based confirm / prompt, hand-crafted per app
const modal = ref(null);
const modalInputRef = ref(null);

const openPrompt = ({ title, placeholder = '', defaultValue = '' }) =>
  new Promise((resolve) => {
    modal.value = { type: 'prompt', title, placeholder, value: defaultValue, danger: false, resolve };
    nextTick(() => {
      modalInputRef.value?.focus();
      modalInputRef.value?.select?.();
    });
  });

const openConfirm = ({ title, danger = false }) =>
  new Promise((resolve) => {
    modal.value = { type: 'confirm', title, danger, resolve };
  });

const closeModal = (result) => {
  const fn = modal.value?.resolve;
  modal.value = null;
  if (fn) fn(result);
};

const submitModal = () => {
  if (!modal.value) return;
  if (modal.value.type === 'prompt') closeModal(modal.value.value);
  else closeModal(true);
};

const cancelModal = () => {
  if (!modal.value) return;
  if (modal.value.type === 'prompt') closeModal(null);
  else closeModal(false);
};

const CTX_W = 188;
const CTX_H = 200;

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || data.error || `${res.status}`);
  return data;
};

const findNode = (node, path) => {
  if (!node) return null;
  if ((node.path || '') === path) return node;
  for (const child of (node.children || [])) {
    const found = findNode(child, path);
    if (found) return found;
  }
  return null;
};

const currentNode = computed(() => {
  if (!tree.value) return null;
  return findNode(tree.value, currentPath.value) || tree.value;
});

const currentChildren = computed(() => currentNode.value?.children || []);

const breadcrumbs = computed(() => {
  const parts = String(currentPath.value || '').split('/').filter(Boolean);
  return [
    { name: '__T_MEMORY_TITLE__', icon: '🌳', path: '' },
    ...parts.map((name, i) => ({
      name,
      icon: '📁',
      path: parts.slice(0, i + 1).join('/')
    }))
  ];
});

const loadTree = async () => {
  treeLoading.value = true;
  try {
    const data = await request('/api/memory/tree');
    tree.value = data.tree || null;
  } finally {
    treeLoading.value = false;
  }
};

const navigate = (path) => {
  currentPath.value = path;
  selectedPath.value = null;
  closeCtx();
};

const handleOpen = async (item) => {
  closeCtx();
  if (item.type === 'dir') { navigate(item.path); return; }
  await windowManager.openComponent({
    key: `memory-view:${item.path}`,
    appId: 'memory',
    title: item.name,
    icon: '🌳',
    load: () => import('./viewer.vue'),
    defaultDesktopWindowSize: { w: 560, h: 420 },
    minDesktopWindowSize: { w: 320, h: 240 },
    props: { path: item.path },
    singleton: true
  });
};

const closeOpenedViewer = (path) => {
  const w = windowManager.state.windows.find(w => w.windowKey === `memory-view:${path}`);
  if (w) windowManager.close(w.id);
};

const closeCtx = () => { ctx.value = { visible: false, x: 0, y: 0, item: null }; };
const clearSelection = () => { selectedPath.value = null; closeCtx(); };

const placeCtx = (event, item = null) => {
  if (item) selectedPath.value = item.path;
  const x = Math.min(event.clientX + 4, window.innerWidth - CTX_W - 8);
  const y = Math.min(event.clientY + 4, window.innerHeight - CTX_H - 8);
  ctx.value = { visible: true, x, y, item };
};

const onBgCtx = (event) => { placeCtx(event, null); };
const onItemCtx = (event, item) => placeCtx(event, item);

const joinPath = (base, name) => base ? `${base}/${name}` : name;

const createDir = async (baseItem) => {
  closeCtx();
  const name = await openPrompt({ title: '__T_MEMORY_CREATE_DIR_PROMPT__' });
  if (!name || !name.trim()) return;
  const base = baseItem?.type === 'dir' ? baseItem.path : currentPath.value;
  try {
    await request('/api/memory/create-dir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: joinPath(base, name.trim()) })
    });
    await loadTree();
  } catch (e) {
    toast.show(e.message || '创建失败', { type: 'error' });
  }
};

const createFile = async (baseItem) => {
  closeCtx();
  const name = await openPrompt({ title: '__T_MEMORY_CREATE_FILE_PROMPT__' });
  if (!name || !name.trim()) return;
  const base = baseItem?.type === 'dir' ? baseItem.path : currentPath.value;
  try {
    await request('/api/memory/create-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: joinPath(base, name.trim()), content: '' })
    });
    await loadTree();
  } catch (e) {
    toast.show(e.message || '创建失败', { type: 'error' });
  }
};

const renameNode = async (item) => {
  closeCtx();
  const nextName = await openPrompt({
    title: '__T_MEMORY_RENAME_PROMPT__',
    defaultValue: item.name
  });
  if (!nextName || !nextName.trim() || nextName.trim() === item.name) return;
  try {
    const data = await request('/api/memory/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: item.path, name: nextName.trim() })
    });
    const newPath = data.item?.path ?? '';
    if (currentPath.value === item.path) currentPath.value = newPath;
    if (currentPath.value.startsWith(item.path + '/')) {
      currentPath.value = newPath + currentPath.value.slice(item.path.length);
    }
    if (selectedPath.value === item.path) selectedPath.value = newPath;
    closeOpenedViewer(item.path);
    await loadTree();
  } catch (e) {
    toast.show(e.message || '重命名失败', { type: 'error' });
  }
};

const deleteNode = async (item) => {
  closeCtx();
  const ok = await openConfirm({
    title: '__T_MEMORY_DELETE_CONFIRM__',
    danger: true
  });
  if (!ok) return;
  try {
    await request('/api/memory/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: item.path })
    });
    if (selectedPath.value === item.path) selectedPath.value = null;
    if (currentPath.value === item.path || currentPath.value.startsWith(item.path + '/')) {
      currentPath.value = item.path.split('/').slice(0, -1).join('/');
    }
    closeOpenedViewer(item.path);
    await loadTree();
  } catch (e) {
    toast.show(e.message || '删除失败', { type: 'error' });
  }
};

onMounted(loadTree);
</script>

<style scoped>
.ctx-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: #2a1f13;
  text-align: left;
  transition: background 0.1s;
}
.ctx-row:hover { background: rgba(140,100,60,0.1); }
.ctx-danger { color: #b03a20; }
.ctx-danger:hover { background: rgba(176,58,32,0.09); }
.ctx-sep { height: 1px; margin: 3px 6px; background: rgba(0,0,0,0.07); }

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.14s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
