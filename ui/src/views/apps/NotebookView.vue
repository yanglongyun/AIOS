<template>
  <!-- ======== 软木板列表视图（全屏铺满） ======== -->
  <div v-if="view === 'list'" class="cork-surface relative flex h-full w-full flex-wrap content-start gap-[30px] overflow-y-auto overflow-x-hidden p-10">

    <!-- 新建按钮 -->
    <div class="group z-20 flex h-[240px] w-[200px] shrink-0 cursor-pointer flex-col items-center justify-center rounded-t-lg rounded-b-xl border border-[#3a2515] bg-[#5c412a] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),4px_8px_15px_rgba(0,0,0,0.6)] transition-all hover:scale-[1.02] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),6px_12px_20px_rgba(0,0,0,0.7)]"
         style="transform:rotate(-2deg)" @click="openEditor(null)">
      <div class="absolute top-[5px] h-4 w-[60px] rounded-sm bg-[#888] shadow-[0_4px_6px_rgba(0,0,0,0.6)]"></div>
      <div class="mt-5 flex h-[85%] w-[85%] items-center justify-center rounded-sm bg-[rgba(253,245,211,0.9)] shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
        <span class="text-[40px] font-bold text-[#a33] opacity-70">＋</span>
      </div>
    </div>

    <!-- 卡片列表 -->
    <div v-for="(note, idx) in notes" :key="note.id"
         class="memo-card group relative z-10 shrink-0 cursor-pointer transition-all hover:z-40 hover:!scale-105 hover:!-translate-y-1"
         :class="cardStyle(note.style).cardCls"
         :style="{ transform: `rotate(${ROTATIONS[idx % 8]}deg)` }"
         @click="openEditor(note)">

      <!-- 图钉 -->
      <div v-if="idx % 3 !== 1" class="pushpin absolute left-1/2 top-[10px] z-20 h-3.5 w-3.5 -translate-x-1/2 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.6),3px_10px_6px_rgba(0,0,0,0.3)]"
           :class="PIN_COLORS[note.style % 4]"></div>
      <!-- 胶带 -->
      <div v-else class="pointer-events-none absolute -top-2.5 left-1/2 z-10 h-5 w-[50px] border-x-2 border-dashed border-white/60 bg-white/35 shadow-sm backdrop-blur-[1px]"
           :style="{ transform: `translateX(-50%) rotate(${idx % 2 ? 5 : -5}deg)` }"></div>

      <!-- 内容 -->
      <div class="line-clamp-[8] whitespace-pre-wrap break-words px-3 font-['Comic_Sans_MS','Chalkboard_SE',cursive] text-base leading-[25px]"
           :class="cardStyle(note.style).textCls">
        {{ note.content || '（空）' }}
      </div>

      <!-- 时间戳 -->
      <div class="absolute bottom-2 right-2.5 font-mono text-[10px] font-bold text-black/40">
        {{ formatTime(note.updated_at || note.created_at) }}
      </div>

      <!-- 删除 -->
      <button class="absolute -right-2 -top-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 shadow-md transition-all hover:scale-110 hover:bg-red-700 group-hover:opacity-100"
              @click.stop="deleteNote(note.id)">✕</button>
    </div>

    <div class="h-10 w-full"></div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-black/40 px-4 py-1.5 text-xs text-[#d4c0a0] backdrop-blur-sm">
      <button class="px-2 py-0.5 text-lg hover:text-white disabled:cursor-not-allowed disabled:opacity-30" :disabled="page <= 1 || loading" @click="goPrevPage">‹</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button class="px-2 py-0.5 text-lg hover:text-white disabled:cursor-not-allowed disabled:opacity-30" :disabled="page >= totalPages || loading" @click="goNextPage">›</button>
    </div>
  </div>

  <!-- ======== 夹板编辑器视图 ======== -->
  <div v-else class="flex h-full w-full items-center justify-center bg-[#2b1d14]">
    <div class="clipboard-board relative flex w-full max-w-[500px] flex-col items-center rounded-t-2xl rounded-b-3xl" style="height:90%">

      <!-- 金属弹簧夹 -->
      <div class="absolute top-[10px] z-30 flex w-[140px] flex-col items-center">
        <div class="clip-base relative h-[25px] w-full rounded border border-[#555]">
          <div class="rivet absolute left-[15px] top-[7px] h-2.5 w-2.5 rounded-full"></div>
          <div class="rivet absolute right-[15px] top-[7px] h-2.5 w-2.5 rounded-full"></div>
        </div>
        <div class="clip-jaw -mt-[5px] z-[35] h-5 w-[120px] rounded-b-[10px] border border-t-0 border-[#666]"></div>
      </div>

      <!-- 信笺纸（根据 style 变纹理） -->
      <div class="legal-pad relative z-10 mt-10 min-h-0 flex-1 w-[90%] overflow-hidden rounded-b"
           :class="cardStyle(editorStyle).padCls">
        <div class="pad-binding absolute inset-x-0 top-0 h-4 border-b border-dashed border-white/20 shadow-[0_2px_3px_rgba(0,0,0,0.4)]"></div>

        <!-- 日期戳 -->
        <div class="absolute right-4 top-[25px] rotate-2 font-mono text-[13px] font-bold opacity-50"
             :class="cardStyle(editorStyle).inkCls">
          REC: {{ currentDate }}
        </div>

        <!-- 编辑区 -->
        <textarea ref="editorRef"
          v-model="editorDraft"
          class="absolute inset-0 resize-none border-none bg-transparent pl-[55px] pr-4 pt-[50px] pb-4 font-['Comic_Sans_MS','Chalkboard_SE',cursive] text-lg leading-[30px] tracking-wide outline-none placeholder:italic placeholder:opacity-30"
          :class="cardStyle(editorStyle).inkCls"
          placeholder="在这里记下你的灵感碎片..."
          spellcheck="false"
        ></textarea>
      </div>

      <!-- 底部区域：AI抽屉 + 按钮托盘，统一绒面 -->
      <div class="bottom-zone w-full shrink-0 z-40 flex flex-col overflow-hidden rounded-b-3xl">
        <!-- AI 抽屉 -->
        <div class="ai-drawer overflow-hidden" :class="{ show: aiDrawerOpen }">
          <div class="ai-well mx-3 mt-2.5 flex flex-col overflow-hidden rounded">
            <div class="flex items-center border-b border-white/5 px-2.5 py-1.5">
              <div class="ai-tag flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-[#c8a050]">AI 润色</div>
              <div v-if="aiResult && !aiLoading" class="ml-auto flex items-center gap-1.5">
                <button class="ai-btn-apply cursor-pointer rounded px-3.5 py-1 text-[11px] font-bold tracking-wider border-none" @click="applyAI">应用</button>
                <button class="ai-btn-close cursor-pointer rounded px-3.5 py-1 text-[11px] font-bold tracking-wider border-none" @click="closeAI">关闭</button>
              </div>
            </div>
            <div v-if="aiLoading" class="ai-loading flex items-center justify-center gap-2.5 py-4 px-3">
              <div class="quill-anim relative h-[18px] w-[18px]"></div>
              <div class="ai-loading-text text-[11px] font-semibold tracking-widest">正在润色...</div>
            </div>
            <div v-else-if="aiResult" class="ai-body overflow-y-auto whitespace-pre-wrap px-3 py-2 font-['Comic_Sans_MS','Chalkboard_SE',cursive] text-sm leading-6 tracking-wide">{{ aiResult }}</div>
          </div>
        </div>

        <!-- 按钮托盘 -->
        <div class="tray-buttons flex shrink-0 items-stretch gap-2.5 px-4 py-2.5 pb-3.5">
          <button class="tray-btn tray-btn-back flex-1" @click="backToList">返回</button>
          <button class="tray-btn tray-btn-ai flex-1" :disabled="!editorDraft.trim() || aiLoading" @click="startOptimize">优化</button>
          <button v-if="editingNoteId" class="tray-btn tray-btn-del flex-1" @click="showDeleteConfirm = true">删除</button>
          <button class="tray-btn tray-btn-save flex-1" :disabled="saving || !editorDraft.trim()" @click="saveEditor">
            {{ saving ? '...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 删除确认弹窗 -->
      <Transition name="ai-modal">
        <div v-if="showDeleteConfirm" class="absolute inset-0 z-50 flex items-center justify-center rounded-t-2xl rounded-b-3xl" @click.self="showDeleteConfirm = false">
          <div class="ai-modal-backdrop absolute inset-0 rounded-t-2xl rounded-b-3xl"></div>
          <div class="ai-modal-card relative z-10 mx-8 flex w-full max-w-[320px] flex-col items-center overflow-hidden rounded-xl px-6 py-6">
            <div class="mb-4 text-sm font-semibold text-[rgba(255,200,160,0.8)]">确定要删除这条笔记吗？</div>
            <div class="flex w-full gap-3">
              <button class="tray-btn tray-btn-back flex-1 text-center" @click="showDeleteConfirm = false">取消</button>
              <button class="tray-btn tray-btn-del flex-1 text-center" @click="confirmDelete">删除</button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue';

const API_BASE = '/apps/notebook';
const PAGE_SIZE = 12;

const view = ref('list');
const notes = ref([]);
const loading = ref(false);
const error = ref('');
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);

const editorDraft = ref('');
const editingNoteId = ref(null);
const editorStyle = ref(0);
const saving = ref(false);
const editorRef = ref(null);
const aiDrawerOpen = ref(false);
const aiLoading = ref(false);
const aiResult = ref('');
const showDeleteConfirm = ref(false);

// 8种卡片样式：Tailwind类 + 需要原生CSS的用class名
// 8种卡片：每种都有独特纹理（CSS class），不再有纯色
const CARD_STYLES = [
  { cardCls: 'card-yellow-lined min-h-[200px] w-[220px] pt-[30px] px-[15px] pb-[15px]', textCls: 'text-[#1c3d5a]', padCls: 'pad-yellow-lined', inkCls: 'text-[#1c3d5a]' },
  { cardCls: 'card-pink-grid min-h-[200px] w-[200px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#a00]', padCls: 'pad-pink-grid', inkCls: 'text-[#a00]' },
  { cardCls: 'card-white-grid min-h-[200px] w-[220px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#204020]', padCls: 'pad-white-grid', inkCls: 'text-[#204020]' },
  { cardCls: 'card-green-lined min-h-[200px] w-[200px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#006600]', padCls: 'pad-green-lined', inkCls: 'text-[#006600]' },
  { cardCls: 'card-blue-dot min-h-[200px] w-[200px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#003366]', padCls: 'pad-blue-dot', inkCls: 'text-[#003366]' },
  { cardCls: 'card-orange-ruled min-h-[200px] w-[200px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#6a3000]', padCls: 'pad-orange-ruled', inkCls: 'text-[#6a3000]' },
  { cardCls: 'card-kraft min-h-[200px] w-[220px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#3a2a1a]', padCls: 'pad-kraft', inkCls: 'text-[#3a2a1a]' },
  { cardCls: 'card-pink-lined min-h-[200px] w-[220px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#5a2040]', padCls: 'pad-pink-lined', inkCls: 'text-[#5a2040]' },
  { cardCls: 'card-lavender-diag min-h-[200px] w-[200px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#4a2080]', padCls: 'pad-lavender-diag', inkCls: 'text-[#4a2080]' },
  { cardCls: 'card-mint-check min-h-[200px] w-[210px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#1a5a4a]', padCls: 'pad-mint-check', inkCls: 'text-[#1a5a4a]' },
  { cardCls: 'card-cream-cross min-h-[200px] w-[210px] pt-[25px] px-[15px] pb-[15px]', textCls: 'text-[#6a4a00]', padCls: 'pad-cream-cross', inkCls: 'text-[#6a4a00]' },
  { cardCls: 'card-sky-ruled min-h-[200px] w-[220px] pt-[30px] px-[15px] pb-[15px]', textCls: 'text-[#1a3a6a]', padCls: 'pad-sky-ruled', inkCls: 'text-[#1a3a6a]' },
];
const PIN_COLORS = ['pin-red', 'pin-blue', 'pin-yellow', 'pin-metal'];
const ROTATIONS = [3, -1, -4, 1, -3, 2, 6, -2];

const TOTAL_STYLES = CARD_STYLES.length;
const cardStyle = (s) => CARD_STYLES[(Number(s) || 0) % TOTAL_STYLES];

// 避免连续新建出相同样式
let lastStyle = -1;
const randomStyle = () => {
  let s;
  do { s = Math.floor(Math.random() * TOTAL_STYLES); } while (s === lastStyle);
  lastStyle = s;
  return s;
};

const currentDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

const fetchNotes = async () => {
  try {
    loading.value = true;
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(PAGE_SIZE) });
    const res = await fetch(`${API_BASE}/list?${params.toString()}`);
    const data = await res.json();
    notes.value = data.items || [];
    total.value = Number(data.total || 0);
    totalPages.value = Number(data.totalPages || 1);
    if (page.value > totalPages.value) { page.value = totalPages.value; return fetchNotes(); }
  } catch (e) { error.value = e.message || '加载失败'; }
  finally { loading.value = false; }
};

const openEditor = (note) => {
  editingNoteId.value = note?.id || null;
  editorDraft.value = note?.content || '';
  editorStyle.value = note ? (Number(note.style) || 0) : randomStyle();
  aiDrawerOpen.value = false;
  aiLoading.value = false;
  aiResult.value = '';
  view.value = 'editor';
  nextTick(() => editorRef.value?.focus());
};

const backToList = () => { view.value = 'list'; editingNoteId.value = null; editorDraft.value = ''; aiDrawerOpen.value = false; aiResult.value = ''; };

const saveEditor = async () => {
  const content = editorDraft.value.trim();
  if (!content || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const url = editingNoteId.value ? `${API_BASE}/update` : `${API_BASE}/create`;
    const body = editingNoteId.value
      ? { id: editingNoteId.value, content }
      : { content, style: editorStyle.value };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    page.value = 1;
    await fetchNotes();
    backToList();
  } catch (e) { error.value = e.message || '保存失败'; }
  finally { saving.value = false; }
};

const confirmDelete = async () => {
  showDeleteConfirm.value = false;
  if (!editingNoteId.value) return;
  await deleteNote(editingNoteId.value);
  backToList();
};

const deleteNote = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchNotes();
  } catch (e) { error.value = e.message || '删除失败'; }
};

const goPrevPage = async () => { if (page.value > 1 && !loading.value) { page.value--; await fetchNotes(); } };
const goNextPage = async () => { if (page.value < totalPages.value && !loading.value) { page.value++; await fetchNotes(); } };

const startOptimize = async () => {
  const content = editorDraft.value.trim();
  if (!content || aiLoading.value) return;
  aiLoading.value = true;
  aiResult.value = '';
  aiDrawerOpen.value = true;
  try {
    const res = await fetch(`${API_BASE}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
    aiResult.value = data.result || '';
  } catch (e) {
    error.value = e.message || '优化失败';
    aiDrawerOpen.value = false;
  } finally {
    aiLoading.value = false;
  }
};

const applyAI = () => {
  if (aiResult.value) editorDraft.value = aiResult.value;
  closeAI();
};

const closeAI = () => {
  aiDrawerOpen.value = false;
  aiResult.value = '';
};

const formatTime = (v) => {
  if (!v) return '';
  const d = new Date(v.replace(' ', 'T'));
  if (isNaN(d)) return v;
  const diff = Date.now() - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

onMounted(fetchNotes);
</script>

<style scoped>
/* ── 软木板纹理（SVG噪声+暗角，Tailwind无法实现） ── */
.cork-surface {
  background-color: #b5835a;
  background-image:
    radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.3'/%3E%3C/svg%3E");
  box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
}

/* ── 图钉颜色（radial-gradient） ── */
.pin-red { background: radial-gradient(circle at 30% 30%, #ff5252, #b71c1c); }
.pin-blue { background: radial-gradient(circle at 30% 30%, #448aff, #0d47a1); }
.pin-yellow { background: radial-gradient(circle at 30% 30%, #ffd740, #ff6f00); }
.pin-metal { background: radial-gradient(circle at 30% 30%, #eceff1, #78909c); }

/* ── 8种卡片纹理（每种都有线条/纹理，不再有纯色） ── */

/* 0: 黄色信笺 - 蓝横线 + 红边距 + 撕裂顶边 */
.card-yellow-lined {
  background-color: #fdf5d3;
  background-image: repeating-linear-gradient(180deg, transparent 0, transparent 24px, #a4c8e1 24px, #a4c8e1 25px);
  box-shadow: 2px 4px 10px rgba(0,0,0,0.4);
  border-radius: 2px 2px 4px 6px;
}
.card-yellow-lined::before {
  content: ''; position: absolute; top: -4px; left: 0; right: 0; height: 8px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='8'%3E%3Cpath d='M0 8 L4 2 L8 6 L12 0 L16 8 Z' fill='%23fdf5d3'/%3E%3C/svg%3E") repeat-x;
}
.card-yellow-lined::after {
  content: ''; position: absolute; top: 4px; bottom: 0; left: 30px; width: 1px;
  background: rgba(220,100,100,0.4); z-index: -1;
}

/* 1: 粉色方格纸 */
.card-pink-grid {
  background-color: #ffcdd2;
  background-image:
    linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
  background-size: 18px 18px;
  box-shadow: 2px 4px 6px rgba(0,0,0,0.25);
  border-radius: 2px;
}
.card-pink-grid::after {
  content: ''; position: absolute; z-index: -1; bottom: 5px; right: 5px;
  width: 50%; height: 20px; box-shadow: 4px 10px 10px rgba(0,0,0,0.3); transform: rotate(4deg);
}

/* 2: 白色方格纸 - 工程网格 */
.card-white-grid {
  background-color: #fafafa;
  background-image:
    linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: 15px 15px;
  box-shadow: 2px 4px 8px rgba(0,0,0,0.3);
  border-radius: 1px;
}

/* 3: 绿色横线纸 */
.card-green-lined {
  background-color: #c8e6c9;
  background-image: repeating-linear-gradient(180deg, transparent 0, transparent 22px, rgba(0,80,0,0.12) 22px, rgba(0,80,0,0.12) 23px);
  box-shadow: 2px 4px 6px rgba(0,0,0,0.25);
  border-radius: 2px;
}
.card-green-lined::after {
  content: ''; position: absolute; z-index: -1; bottom: 5px; right: 5px;
  width: 50%; height: 20px; box-shadow: 4px 10px 10px rgba(0,0,0,0.3); transform: rotate(4deg);
}

/* 4: 蓝色点阵纸 */
.card-blue-dot {
  background-color: #b3e5fc;
  background-image: radial-gradient(circle, rgba(0,50,100,0.12) 1px, transparent 1px);
  background-size: 12px 12px;
  box-shadow: 2px 4px 6px rgba(0,0,0,0.25);
  border-radius: 2px;
}
.card-blue-dot::after {
  content: ''; position: absolute; z-index: -1; bottom: 5px; right: 5px;
  width: 50%; height: 20px; box-shadow: 4px 10px 10px rgba(0,0,0,0.3); transform: rotate(4deg);
}

/* 5: 橙色竖线纸 */
.card-orange-ruled {
  background-color: #ffe0b2;
  background-image: repeating-linear-gradient(90deg, transparent 0, transparent 20px, rgba(180,100,0,0.1) 20px, rgba(180,100,0,0.1) 21px);
  box-shadow: 2px 4px 6px rgba(0,0,0,0.25);
  border-radius: 2px;
}
.card-orange-ruled::after {
  content: ''; position: absolute; z-index: -1; bottom: 5px; right: 5px;
  width: 50%; height: 20px; box-shadow: 4px 10px 10px rgba(0,0,0,0.3); transform: rotate(4deg);
}

/* 6: 牛皮纸 - 噪声纹理 */
.card-kraft {
  background-color: #c9a96e;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E");
  box-shadow: 2px 4px 8px rgba(0,0,0,0.35);
  border-radius: 2px;
}

/* 7: 粉色信笺 - 横线 + 左边距 */
.card-pink-lined {
  background-color: #fce4ec;
  background-image: repeating-linear-gradient(180deg, transparent 0, transparent 24px, #e8a0b0 24px, #e8a0b0 25px);
  box-shadow: 2px 4px 8px rgba(0,0,0,0.3);
  border-radius: 2px;
}
.card-pink-lined::after {
  content: ''; position: absolute; top: 4px; bottom: 0; left: 30px; width: 1px;
  background: rgba(200,80,120,0.3); z-index: -1;
}

/* 8: 薰衣草斜线纸 */
.card-lavender-diag {
  background-color: #e8daef;
  background-image: repeating-linear-gradient(135deg, transparent 0, transparent 10px, rgba(100,50,150,0.08) 10px, rgba(100,50,150,0.08) 11px);
  box-shadow: 2px 4px 6px rgba(0,0,0,0.25);
  border-radius: 2px;
}
.card-lavender-diag::after {
  content: ''; position: absolute; z-index: -1; bottom: 5px; right: 5px;
  width: 50%; height: 20px; box-shadow: 4px 10px 10px rgba(0,0,0,0.3); transform: rotate(4deg);
}

/* 9: 薄荷棋盘格纸 */
.card-mint-check {
  background-color: #c8f7e1;
  background-image:
    linear-gradient(45deg, rgba(0,80,60,0.06) 25%, transparent 25%, transparent 75%, rgba(0,80,60,0.06) 75%),
    linear-gradient(45deg, rgba(0,80,60,0.06) 25%, transparent 25%, transparent 75%, rgba(0,80,60,0.06) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  box-shadow: 2px 4px 6px rgba(0,0,0,0.25);
  border-radius: 2px;
}

/* 10: 奶油十字纹纸 */
.card-cream-cross {
  background-color: #faf0d8;
  background-image:
    radial-gradient(circle, rgba(160,120,40,0.12) 1px, transparent 1px),
    linear-gradient(rgba(160,120,40,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(160,120,40,0.06) 1px, transparent 1px);
  background-size: 16px 16px;
  box-shadow: 2px 4px 8px rgba(0,0,0,0.3);
  border-radius: 2px;
}

/* 11: 天蓝横线信笺 - 类似黄色信笺但天蓝底 + 深蓝横线 + 撕裂顶边 */
.card-sky-ruled {
  background-color: #dceefb;
  background-image: repeating-linear-gradient(180deg, transparent 0, transparent 24px, #90b8d8 24px, #90b8d8 25px);
  box-shadow: 2px 4px 10px rgba(0,0,0,0.4);
  border-radius: 2px 2px 4px 6px;
}
.card-sky-ruled::before {
  content: ''; position: absolute; top: -4px; left: 0; right: 0; height: 8px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='8'%3E%3Cpath d='M0 8 L4 2 L8 6 L12 0 L16 8 Z' fill='%23dceefb'/%3E%3C/svg%3E") repeat-x;
}
.card-sky-ruled::after {
  content: ''; position: absolute; top: 4px; bottom: 0; left: 30px; width: 1px;
  background: rgba(80,120,180,0.35); z-index: -1;
}

/* ── 夹板编辑器（多层阴影+渐变，Tailwind写不了或太长） ── */
.clipboard-board {
  background: linear-gradient(135deg, #5c412a, #3a2515);
  box-shadow: inset 0 2px 5px rgba(255,255,255,0.1), inset 0 -4px 10px rgba(0,0,0,0.4), 10px 20px 30px rgba(0,0,0,0.8);
}
.clip-base {
  background: linear-gradient(180deg, #d4d4d4, #a3a3a3 40%, #888);
  box-shadow: inset 0 2px 2px rgba(255,255,255,0.8), 0 4px 6px rgba(0,0,0,0.4);
}
.clip-jaw {
  background: linear-gradient(180deg, #f0f0f0, #b3b3b3 50%, #999);
  box-shadow: inset 0 2px 3px rgba(255,255,255,0.9), 0 8px 10px rgba(0,0,0,0.5);
}
.rivet {
  background: radial-gradient(circle at 35% 35%, #fff, #999);
  box-shadow: inset 0 -1px 2px rgba(0,0,0,0.5), 0 2px 3px rgba(0,0,0,0.5);
}

/* 编辑器纸张基础 */
.legal-pad {
  box-shadow: inset 0 0 40px rgba(0,0,0,0.08);
}

/* 0: 黄色信笺 */
.pad-yellow-lined {
  background-color: #fdf5d3;
  background-image: repeating-linear-gradient(180deg, transparent 0, transparent 29px, #a4c8e1 29px, #a4c8e1 30px);
  background-position: 0 50px;
}
.pad-yellow-lined::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: 45px; width: 2px;
  background: rgba(220,100,100,0.5); box-shadow: 4px 0 0 rgba(220,100,100,0.15); pointer-events: none;
}

/* 1: 粉色方格 */
.pad-pink-grid {
  background-color: #ffcdd2;
  background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
  background-size: 30px 30px; background-position: 0 50px;
}

/* 2: 白色网格 */
.pad-white-grid {
  background-color: #fafafa;
  background-image: linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: 30px 30px; background-position: 0 50px;
}

/* 3: 绿色横线 */
.pad-green-lined {
  background-color: #c8e6c9;
  background-image: repeating-linear-gradient(180deg, transparent 0, transparent 29px, rgba(0,80,0,0.12) 29px, rgba(0,80,0,0.12) 30px);
  background-position: 0 50px;
}

/* 4: 蓝色点阵 */
.pad-blue-dot {
  background-color: #b3e5fc;
  background-image: radial-gradient(circle, rgba(0,50,100,0.12) 1px, transparent 1px);
  background-size: 20px 20px; background-position: 0 50px;
}

/* 5: 橙色竖线 */
.pad-orange-ruled {
  background-color: #ffe0b2;
  background-image: repeating-linear-gradient(90deg, transparent 0, transparent 28px, rgba(180,100,0,0.1) 28px, rgba(180,100,0,0.1) 29px);
}

/* 6: 牛皮纸 */
.pad-kraft {
  background-color: #c9a96e;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E");
}

/* 7: 粉色横线 */
.pad-pink-lined {
  background-color: #fce4ec;
  background-image: repeating-linear-gradient(180deg, transparent 0, transparent 29px, #e8a0b0 29px, #e8a0b0 30px);
  background-position: 0 50px;
}
.pad-pink-lined::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: 45px; width: 1px;
  background: rgba(200,80,120,0.3); pointer-events: none;
}

/* 8: 薰衣草斜线 */
.pad-lavender-diag {
  background-color: #e8daef;
  background-image: repeating-linear-gradient(135deg, transparent 0, transparent 14px, rgba(100,50,150,0.08) 14px, rgba(100,50,150,0.08) 15px);
}

/* 9: 薄荷棋盘格 */
.pad-mint-check {
  background-color: #c8f7e1;
  background-image:
    linear-gradient(45deg, rgba(0,80,60,0.06) 25%, transparent 25%, transparent 75%, rgba(0,80,60,0.06) 75%),
    linear-gradient(45deg, rgba(0,80,60,0.06) 25%, transparent 25%, transparent 75%, rgba(0,80,60,0.06) 75%);
  background-size: 30px 30px;
  background-position: 0 0, 15px 15px;
}

/* 10: 奶油十字纹 */
.pad-cream-cross {
  background-color: #faf0d8;
  background-image:
    radial-gradient(circle, rgba(160,120,40,0.12) 1px, transparent 1px),
    linear-gradient(rgba(160,120,40,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(160,120,40,0.06) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: 0 50px;
}

/* 11: 天蓝横线 */
.pad-sky-ruled {
  background-color: #dceefb;
  background-image: repeating-linear-gradient(180deg, transparent 0, transparent 29px, #90b8d8 29px, #90b8d8 30px);
  background-position: 0 50px;
}
.pad-sky-ruled::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: 45px; width: 2px;
  background: rgba(80,120,180,0.4); box-shadow: 4px 0 0 rgba(80,120,180,0.12); pointer-events: none;
}

.pad-binding {
  background: linear-gradient(180deg, #111, #333, #111);
}

/* ── 底部绒面区域 ── */
.bottom-zone {
  background: linear-gradient(180deg, #3a1818, #2a0e0e);
  border-top: 3px solid #5a3020;
  box-shadow: inset 0 4px 12px rgba(0,0,0,0.6);
  background-image:
    repeating-linear-gradient(135deg, rgba(255,255,255,0.005) 0px, rgba(255,255,255,0.005) 1px, transparent 1px, transparent 3px);
}

/* AI 抽屉 */
.ai-drawer {
  max-height: 0;
  transition: max-height 0.4s ease;
}
.ai-drawer.show { max-height: 50vh; }

.ai-well {
  background: rgba(0,0,0,0.25);
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.03);
}

/* 删除确认弹窗 */
.ai-modal-backdrop {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
}
.ai-modal-card {
  background: linear-gradient(180deg, #3a1818, #2a0e0e);
  box-shadow: 0 12px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05);
  background-image:
    repeating-linear-gradient(135deg, rgba(255,255,255,0.005) 0px, rgba(255,255,255,0.005) 1px, transparent 1px, transparent 3px);
}
.ai-modal-enter-active { transition: all 0.25s ease-out; }
.ai-modal-leave-active { transition: all 0.2s ease-in; }
.ai-modal-enter-from { opacity: 0; }
.ai-modal-enter-from .ai-modal-card { transform: scale(0.9); }
.ai-modal-leave-to { opacity: 0; }
.ai-modal-leave-to .ai-modal-card { transform: scale(0.9); }

.ai-tag::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #e8c060, #a08030);
  box-shadow: 0 0 4px rgba(200,160,60,0.4);
}

.ai-btn-apply {
  background: linear-gradient(180deg, #4a7a40, #306828);
  color: #d0e8c0;
  text-shadow: 0 1px 1px rgba(0,0,0,0.3);
  box-shadow: 0 2px 0 rgba(20,50,10,0.5), inset 0 1px 0 rgba(200,255,200,0.12);
  transition: all 0.1s;
}
.ai-btn-apply:hover { background: linear-gradient(180deg, #5a8a50, #407838); }
.ai-btn-apply:active { box-shadow: inset 0 1px 3px rgba(0,0,0,0.3); }

.ai-btn-close {
  background: rgba(255,255,255,0.06);
  color: rgba(200,160,100,0.5);
  box-shadow: 0 2px 0 rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
  transition: all 0.1s;
}
.ai-btn-close:hover { background: rgba(255,255,255,0.1); color: rgba(200,160,100,0.8); }
.ai-btn-close:active { box-shadow: inset 0 1px 3px rgba(0,0,0,0.3); }

.ai-body {
  color: rgba(220,200,160,0.75);
  max-height: 28vh;
}
.ai-body::-webkit-scrollbar { width: 3px; }
.ai-body::-webkit-scrollbar-thumb { background: rgba(200,160,80,0.15); border-radius: 2px; }

/* loading */
.ai-loading-text {
  color: rgba(200,160,80,0.6);
  animation: loadPulse 1.5s ease-in-out infinite;
}
.quill-anim::before {
  content: '\270D'; font-size: 14px; position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  animation: quillWrite 1.2s ease-in-out infinite;
  filter: grayscale(0.3) brightness(0.8);
}
@keyframes quillWrite {
  0%,100% { transform: rotate(-5deg) translateY(0); }
  25% { transform: rotate(3deg) translateY(-2px); }
  50% { transform: rotate(-3deg) translateY(1px); }
  75% { transform: rotate(2deg) translateY(-1px); }
}
@keyframes loadPulse {
  0%,100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* ── 托盘按钮 ── */
.tray-btn {
  padding: 10px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.1s;
  position: relative;
  top: 0;
  border: 1px solid rgba(0,0,0,0.3);
  box-shadow: 0 3px 0 rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.12);
}
.tray-btn:active {
  top: 3px;
  box-shadow: 0 0 0 rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.4);
}
.tray-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tray-btn-back {
  background: linear-gradient(180deg, #6a5838, #4a3820, #3a2810);
  color: rgba(255,220,180,0.5);
  text-shadow: 0 1px 1px rgba(0,0,0,0.5);
  border-color: #2a1808;
}
.tray-btn-back:hover { background: linear-gradient(180deg, #7a6848, #5a4830, #4a3820); }

.tray-btn-ai {
  background: linear-gradient(180deg, #4a3848, #3a2838, #2a1828);
  color: rgba(220,200,255,0.6);
  text-shadow: 0 1px 1px rgba(0,0,0,0.5);
  border-color: #1a0828;
}
.tray-btn-ai:hover { background: linear-gradient(180deg, #5a4858, #4a3848, #3a2838); }

.tray-btn-del {
  background: linear-gradient(180deg, #8a3028, #6a1818, #501010);
  color: rgba(255,200,180,0.7);
  text-shadow: 0 1px 1px rgba(0,0,0,0.5);
  border-color: #3a0808;
}
.tray-btn-del:hover { background: linear-gradient(180deg, #9a4038, #7a2828, #601818); }

.tray-btn-save {
  background: linear-gradient(180deg, #d0a848, #a88028, #886818);
  color: #fff;
  text-shadow: 0 1px 1px rgba(0,0,0,0.3);
  border-color: #604010;
  box-shadow: 0 3px 0 rgba(80,50,10,0.6), inset 0 1px 1px rgba(255,255,200,0.25);
}
.tray-btn-save:hover { background: linear-gradient(180deg, #e0b858, #b89038, #988028); }
.tray-btn-save:active { top: 3px; box-shadow: 0 0 0 rgba(80,50,10,0.6), inset 0 2px 4px rgba(0,0,0,0.4); }
</style>
