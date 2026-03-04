<template>
  <div class="flex h-full flex-col bg-[#f5f0e8] font-['Georgia','PingFang_SC',serif] dark:bg-[#1a1410]">
    <div class="border-b border-[#dcd0b8] bg-[#fffdf8] px-6 py-4 dark:border-[#2a1e14] dark:bg-[#221a12]">
      <h1 class="text-lg font-bold text-[#5a4a38] dark:text-[#e8d4b8]">涂鸦板</h1>
      <p class="mt-0.5 text-xs text-[#8a7a60] dark:text-[#6a5840]">上传图片，圈定区域，让 AI 修改</p>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- 左：画布 -->
      <div class="flex flex-1 flex-col items-center justify-center border-r border-[#dcd0b8] p-6 dark:border-[#2a1e14]">
        <div v-if="!imageSrc" class="flex flex-col items-center gap-3">
          <div class="flex h-48 w-64 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#dcd0b8] text-sm text-[#b8a888] transition hover:border-[#c8a060] hover:text-[#c8a060] dark:border-[#3a2a1a] dark:text-[#4a3a28]"
            @click="$refs.fileInput.click()">
            点击上传图片
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />
        </div>
        <div v-else class="relative inline-block">
          <canvas ref="canvas" class="max-h-[70vh] max-w-full cursor-crosshair rounded-lg shadow-lg"
            @mousedown="startSelect" @mousemove="onDrag" @mouseup="endSelect" />
          <div v-if="selection" class="pointer-events-none absolute border-2 border-[#c8a060] bg-[rgba(200,160,96,0.15)]"
            :style="selectionStyle" />
        </div>
        <div v-if="imageSrc" class="mt-3 flex gap-2">
          <button @click="clearImage" class="rounded-lg border border-[#dcd0b8] px-3 py-1 text-xs text-[#8a7a60] hover:border-[#c8a060] dark:border-[#3a2a1a]">换一张</button>
          <button v-if="selection" @click="selection = null" class="rounded-lg border border-[#dcd0b8] px-3 py-1 text-xs text-[#8a7a60] hover:border-[#c8a060] dark:border-[#3a2a1a]">清除选区</button>
        </div>
      </div>

      <!-- 右：指令 + 结果 -->
      <div class="flex w-[340px] flex-shrink-0 flex-col p-6">
        <div class="mb-3 text-xs font-semibold text-[#8a7a60] dark:text-[#6a5840]">修改指令</div>
        <textarea v-model="prompt" placeholder="例如：把选中区域的猫变成狗" rows="3"
          class="w-full resize-none rounded-lg border border-[#dcd0b8] bg-[#fffdf8] px-3 py-2 text-sm text-[#5a4a38] outline-none placeholder:text-[#b8a888] focus:border-[#c8a060] dark:border-[#3a2a1a] dark:bg-[#1a1410] dark:text-[#e8d4b8]" />
        <button @click="submitEdit" :disabled="!imagePath || !prompt.trim() || busy"
          class="mt-3 w-full rounded-lg bg-[#c8a060] py-2.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d4b070] disabled:opacity-40">
          {{ busy ? 'AI 处理中...' : '开始修改' }}
        </button>

        <div v-if="selection" class="mt-4 rounded-lg border border-[#dcd0b8] bg-[rgba(200,160,96,0.04)] p-3 text-xs text-[#8a7a60] dark:border-[#3a2a1a]">
          选区: {{ Math.round(selection.x) }}%, {{ Math.round(selection.y) }}% → {{ Math.round(selection.x + selection.w) }}%, {{ Math.round(selection.y + selection.h) }}%
        </div>

        <!-- 结果 -->
        <div v-if="editResult" class="mt-4 flex-1 overflow-y-auto">
          <div class="text-xs font-semibold text-[#8a7a60] dark:text-[#6a5840]">AI 分析结果</div>
          <div class="mt-2 rounded-lg border border-[#dcd0b8] bg-[#fffdf8] p-3 text-[13px] leading-relaxed text-[#5a4a38] dark:border-[#3a2a1a] dark:bg-[#221a12] dark:text-[#d4c0a0]">
            {{ editResult }}
          </div>
        </div>

        <!-- 历史 -->
        <div v-if="works.length" class="mt-4 flex-1 overflow-y-auto">
          <div class="text-xs font-semibold text-[#8a7a60] dark:text-[#6a5840]">历史记录</div>
          <div class="mt-2 space-y-2">
            <div v-for="w in works" :key="w.id"
              class="rounded-lg border border-[#dcd0b8] px-3 py-2 text-xs text-[#8a7a60] dark:border-[#3a2a1a]">
              {{ w.prompt }} · {{ formatTime(w.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

const imageSrc = ref(null);
const imagePath = ref('');
const prompt = ref('');
const busy = ref(false);
const selection = ref(null);
const editResult = ref('');
const works = ref([]);
const canvas = ref(null);
let dragStart = null;
let imgEl = null;

const selectionStyle = ref({});

const updateSelectionStyle = () => {
  if (!selection.value || !canvas.value) return;
  const c = canvas.value;
  const s = selection.value;
  selectionStyle.value = {
    left: `${s.x * c.clientWidth / 100}px`,
    top: `${s.y * c.clientHeight / 100}px`,
    width: `${s.w * c.clientWidth / 100}px`,
    height: `${s.h * c.clientHeight / 100}px`
  };
};

const drawImage = () => {
  if (!canvas.value || !imgEl) return;
  const ctx = canvas.value.getContext('2d');
  const maxW = 600, maxH = 500;
  let w = imgEl.width, h = imgEl.height;
  if (w > maxW) { h *= maxW / w; w = maxW; }
  if (h > maxH) { w *= maxH / h; h = maxH; }
  canvas.value.width = w;
  canvas.value.height = h;
  ctx.drawImage(imgEl, 0, 0, w, h);
};

const onFileSelect = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result;
    imageSrc.value = base64;

    const data = await request('/apps/doodle/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, data: base64 })
    });
    if (data.success) imagePath.value = data.image.path;

    await nextTick();
    imgEl = new Image();
    imgEl.onload = drawImage;
    imgEl.src = base64;
  };
  reader.readAsDataURL(file);
};

const clearImage = () => {
  imageSrc.value = null;
  imagePath.value = '';
  selection.value = null;
  editResult.value = '';
};

const startSelect = (e) => {
  const rect = canvas.value.getBoundingClientRect();
  dragStart = { x: (e.clientX - rect.left) / rect.width * 100, y: (e.clientY - rect.top) / rect.height * 100 };
};

const onDrag = (e) => {
  if (!dragStart) return;
  const rect = canvas.value.getBoundingClientRect();
  const cx = (e.clientX - rect.left) / rect.width * 100;
  const cy = (e.clientY - rect.top) / rect.height * 100;
  selection.value = {
    x: Math.min(dragStart.x, cx), y: Math.min(dragStart.y, cy),
    w: Math.abs(cx - dragStart.x), h: Math.abs(cy - dragStart.y)
  };
  updateSelectionStyle();
};

const endSelect = () => { dragStart = null; };

const request = async (url, opts) => {
  const res = await fetch(url, { credentials: 'include', ...opts });
  return res.json();
};

const submitEdit = async () => {
  if (!imagePath.value || !prompt.value.trim() || busy.value) return;
  busy.value = true;
  editResult.value = '';

  const data = await request('/apps/doodle/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imagePath: imagePath.value,
      prompt: prompt.value.trim(),
      region: selection.value || {}
    })
  });

  if (data.success) {
    editResult.value = data.item.description;
    loadWorks();
  }
  busy.value = false;
};

const loadWorks = async () => {
  const data = await request('/apps/doodle/list');
  if (data.success) works.value = data.items;
};

const formatTime = (t) => t ? t.replace('T', ' ').slice(0, 16) : '';

onMounted(loadWorks);
</script>
