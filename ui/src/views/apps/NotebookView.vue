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

      <!-- 金属边角 -->
      <div class="board-corner absolute -bottom-0.5 -left-0.5 z-[5] h-[30px] w-[30px] rounded-[0_10px_0_16px] bg-gradient-to-br from-[#a0a0a0] via-[#666] to-[#333] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),1px_1px_3px_rgba(0,0,0,0.6)]"></div>
      <div class="board-corner absolute -bottom-0.5 -right-0.5 z-[5] h-[30px] w-[30px] rounded-[10px_0_16px_0] bg-gradient-to-br from-[#a0a0a0] via-[#666] to-[#333] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),1px_1px_3px_rgba(0,0,0,0.6)]"></div>

      <!-- 金属弹簧夹 -->
      <div class="absolute top-[10px] z-30 flex w-[140px] flex-col items-center">
        <div class="clip-base relative h-[25px] w-full rounded border border-[#555]">
          <div class="rivet absolute left-[15px] top-[7px] h-2.5 w-2.5 rounded-full"></div>
          <div class="rivet absolute right-[15px] top-[7px] h-2.5 w-2.5 rounded-full"></div>
        </div>
        <div class="clip-jaw -mt-[5px] z-[35] h-5 w-[120px] rounded-b-[10px] border border-t-0 border-[#666]"></div>
      </div>

      <!-- 信笺纸（根据 style 变纹理） -->
      <div class="legal-pad relative z-10 mt-10 w-[90%] overflow-hidden rounded-b"
           :class="cardStyle(editorStyle).padCls"
           style="height:calc(100% - 100px)">
        <div class="pad-binding absolute inset-x-0 top-0 h-4 border-b border-dashed border-white/20 shadow-[0_2px_3px_rgba(0,0,0,0.4)]"></div>

        <!-- 日期戳 -->
        <div class="absolute right-4 top-[25px] rotate-2 font-mono text-[13px] font-bold opacity-50"
             :class="cardStyle(editorStyle).inkCls">
          REC: {{ currentDate }}
        </div>

        <!-- 编辑区 -->
        <textarea ref="editorRef"
          v-model="editorDraft"
          class="absolute inset-0 resize-none border-none bg-transparent pl-[55px] pr-4 pt-[50px] font-['Comic_Sans_MS','Chalkboard_SE',cursive] text-lg leading-[30px] tracking-wide outline-none placeholder:italic placeholder:opacity-30"
          :class="cardStyle(editorStyle).inkCls"
          placeholder="在这里记下你的灵感碎片..."
          spellcheck="false"
        ></textarea>
      </div>

      <!-- 底部操作栏 -->
      <div class="absolute inset-x-0 bottom-0 z-40 flex items-center justify-between rounded-b-3xl bg-[#3a2515] px-5 py-3 shadow-[inset_0_2px_4px_rgba(255,255,255,0.08)]">
        <button class="board-btn bg-gradient-to-b from-[#6b5540] to-[#4a3828] text-white/70 hover:from-[#7a6450] hover:to-[#5a4838] active:from-[#4a3828] active:to-[#3a2818]"
                @click="backToList">返回</button>
        <button v-if="editingNoteId" class="board-btn bg-gradient-to-b from-[#8b3a3a] to-[#6a2222] text-red-200 hover:from-[#9b4a4a] hover:to-[#7a3232] active:from-[#6a2222] active:to-[#5a1818]"
                @click="deleteAndBack">删除</button>
        <button class="board-btn bg-gradient-to-b from-[#c0903a] to-[#9a7028] text-white hover:from-[#d0a04a] hover:to-[#aa8038] active:from-[#9a7028] active:to-[#8a6018] disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="saving || !editorDraft.trim()"
                @click="saveEditor">
          {{ saving ? '...' : '保存' }}
        </button>
      </div>
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
  view.value = 'editor';
  nextTick(() => editorRef.value?.focus());
};

const backToList = () => { view.value = 'list'; editingNoteId.value = null; editorDraft.value = ''; };

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

const deleteAndBack = async () => {
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

/* ── 实体按钮（3D凸起+按下效果） ── */
.board-btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid rgba(0,0,0,0.3);
  box-shadow:
    0 3px 0 rgba(0,0,0,0.4),
    inset 0 1px 1px rgba(255,255,255,0.15);
  transition: all 0.1s;
  position: relative;
  top: 0;
}
.board-btn:active {
  top: 3px;
  box-shadow:
    0 0 0 rgba(0,0,0,0.4),
    inset 0 2px 4px rgba(0,0,0,0.3);
}
</style>
