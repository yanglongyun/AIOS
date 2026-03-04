<template>
  <div class="flex h-full w-full items-start justify-center overflow-y-auto bg-black">
    <div class="mx-auto my-2 flex h-[calc(100%-1rem)] w-[calc(100%-1rem)] max-w-md flex-col overflow-hidden rounded-2xl border-2 border-white/20 bg-[#4a3728] md:my-12 md:h-[calc(100%-6rem)] md:w-[calc(100%-4rem)]">
      <div class="relative basis-[46%] overflow-hidden">
        <div
          class="absolute inset-0 bg-[#f5e6d3] [background-image:repeating-linear-gradient(90deg,transparent,transparent_60px,rgba(0,0,0,0.02)_60px,rgba(0,0,0,0.02)_61px),repeating-linear-gradient(0deg,transparent,transparent_60px,rgba(0,0,0,0.02)_60px,rgba(0,0,0,0.02)_61px)]"
        ></div>

        <div class="absolute left-1/2 top-5 h-[calc(100%-50px)] w-[min(85vw,340px)] -translate-x-1/2 overflow-hidden rounded-[6px] border-[12px] border-[#8b6914] bg-[#1a1a2e] shadow-[inset_0_0_0_3px_#a07d2e,0_8px_32px_rgba(0,0,0,0.3),inset_0_0_60px_rgba(0,0,0,0.2)]">
          <div class="absolute inset-0 transition-opacity duration-700 ease-out [&_svg]:block [&_svg]:h-full [&_svg]:w-full" :style="{ opacity: sceneTransition ? 0 : 1 }">
            <img
              v-if="currentPhoto"
              :src="currentPhoto.type === 'base64' ? `data:image/png;base64,${currentPhoto.url}` : currentPhoto.url"
              class="block h-full w-full object-cover"
              @error="currentPhoto = null"
            />
            <div v-else v-html="defaultScenes[currentScene]?.svg || ''"></div>
          </div>

          <div class="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
          <div class="absolute left-0 right-0 top-1/2 z-[4] h-2 -translate-y-1/2 bg-[#8b6914]"></div>
          <div class="absolute bottom-0 left-1/2 top-0 z-[4] w-2 -translate-x-1/2 bg-[#8b6914]"></div>

          <div v-if="generating" class="absolute inset-0 z-[6] flex items-center justify-center bg-black/40">
            <div class="flex items-center gap-2 text-base text-white/85 [font-family:'Caveat',cursive]">
              正在生成照片
              <span class="inline-flex gap-1">
                <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:0ms]"></span>
                <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:120ms]"></span>
                <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:240ms]"></span>
              </span>
            </div>
          </div>

          <div v-if="photos.length > 1" class="absolute bottom-2.5 left-1/2 z-[8] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/35 px-2.5 py-1 backdrop-blur">
            <button class="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-sm text-white transition hover:bg-white/30" @click="prevPhoto">‹</button>
            <span class="text-xs text-white/70 [font-family:'Caveat',cursive]">{{ photoIndex + 1 }} / {{ photos.length }}</span>
            <button class="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-sm text-white transition hover:bg-white/30" @click="nextPhoto">›</button>
          </div>

          <div class="absolute left-1/2 top-2.5 z-[8] max-w-[80%] -translate-x-1/2 truncate rounded-full bg-black/25 px-3 py-1 text-[13px] text-white/50 backdrop-blur [font-family:'Caveat',cursive]">
            {{ currentPhoto ? (currentPhoto.prompt || 'AI 照片') : (defaultScenes[currentScene]?.caption || '') }}
          </div>
        </div>

        <div class="absolute bottom-2.5 left-1/2 z-[6] flex w-[min(85vw,340px)] -translate-x-1/2 justify-between px-4">
          <span class="text-xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">🌵</span>
          <span class="text-xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">📷</span>
          <span class="cursor-pointer text-xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" title="设置" @click="showSettings = true">⚙️</span>
        </div>
        <div class="absolute bottom-0 left-1/2 z-[5] h-[14px] w-[calc(min(85vw,340px)+40px)] -translate-x-1/2 rounded-b-[3px] bg-gradient-to-b from-[#a07d2e] to-[#8b6914] shadow-[0_3px_8px_rgba(0,0,0,0.2)]"></div>

        <button
          v-if="!photos.length"
          class="absolute left-[calc(50%-min(42.5vw,170px)-20px)] top-1/2 z-[8] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-sm text-white/70 transition hover:bg-black/50"
          @click="prevScene"
        >‹</button>
        <button
          v-if="!photos.length"
          class="absolute right-[calc(50%-min(42.5vw,170px)-20px)] top-1/2 z-[8] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-sm text-white/70 transition hover:bg-black/50"
          @click="nextScene"
        >›</button>
      </div>

      <div class="relative flex flex-1 flex-col overflow-hidden">
        <div class="relative z-[2] h-1.5 shrink-0 bg-gradient-to-b from-[#8b6914] to-[#6b5010]"></div>
        <div class="pointer-events-none absolute inset-0 bg-[#2d3a2d] [background-image:radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.03)_0%,transparent_70%),radial-gradient(ellipse_at_80%_30%,rgba(255,255,255,0.02)_0%,transparent_60%)]"></div>

        <div ref="messagesEl" class="relative z-[1] flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-2 pt-4">
          <div v-if="messages.length" class="py-1 text-center text-[13px] text-white/20 [font-family:'Caveat',cursive]">～～～ 留言板 ～～～</div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="max-w-[80%] break-words px-0 py-0.5 text-[17px] leading-[1.6] [font-family:'Caveat',cursive,'PingFang_SC',sans-serif]"
            :class="msg.role === 'user' ? 'self-end text-right text-[#ffb6ceeb] [text-shadow:0_0_4px_rgba(255,182,206,0.15)]' : 'self-start text-white/90 [text-shadow:0_0_4px_rgba(255,255,255,0.15)]'"
          >{{ msg.content }}</div>

          <div v-if="sending" class="flex items-center gap-1 self-start text-base text-white/40 [font-family:'Caveat',cursive]">
            正在写
            <span class="inline-flex gap-1">
              <span class="h-1 w-1 animate-bounce rounded-full bg-white/40 [animation-delay:0ms]"></span>
              <span class="h-1 w-1 animate-bounce rounded-full bg-white/40 [animation-delay:120ms]"></span>
              <span class="h-1 w-1 animate-bounce rounded-full bg-white/40 [animation-delay:240ms]"></span>
            </span>
          </div>
        </div>

        <div class="relative z-[2] flex items-end gap-2 border-t border-white/5 bg-[rgba(35,45,35,0.8)] px-3 pb-3 pt-2">
          <div class="relative flex shrink-0 items-end pb-1.5">
            <button class="h-5 w-5 rounded-full border-2 border-white/25 transition hover:border-white/50" :style="{ background: chalkColor }" @click="colorPickerOpen = !colorPickerOpen"></button>
            <div v-if="colorPickerOpen" class="absolute -left-1 bottom-8 flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-[rgba(30,40,30,0.95)] p-2 backdrop-blur">
              <button
                v-for="c in chalkOptions"
                :key="c.name"
                class="h-[22px] w-[22px] rounded-full border-2 border-transparent transition hover:scale-110"
                :class="chalkColor === c.color ? 'border-white/60' : ''"
                :style="{ background: c.color }"
                @click="chalkColor = c.color; colorPickerOpen = false"
              ></button>
            </div>
          </div>

          <div class="flex flex-1 items-end">
            <textarea
              ref="inputEl"
              v-model="inputText"
              rows="1"
              placeholder="在黑板上写点什么…"
              class="max-h-20 flex-1 resize-none border-0 border-b border-dashed border-white/15 bg-transparent px-1 py-1.5 text-[17px] leading-6 outline-none placeholder:text-white/20 [font-family:'Caveat',cursive,'PingFang_SC',sans-serif]"
              :style="{ color: chalkColor }"
              @input="autoResize"
              @keydown.enter.exact.prevent="sendMsg"
            ></textarea>
          </div>

          <button
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm text-white/60 transition enabled:hover:bg-white/15 enabled:hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-30"
            @click="sendMsg"
            :disabled="sending || !inputText.trim()"
          >✎</button>
        </div>
      </div>

      <div v-if="showSettings" class="fixed inset-0 z-50 flex items-end justify-center bg-black/50" @click.self="showSettings = false">
        <div class="w-full max-w-[420px] animate-[slide-up_.3s_ease] rounded-t-[20px] bg-white px-5 pb-8 pt-4">
          <div class="mx-auto mb-4 h-1 w-9 rounded bg-gray-300"></div>
          <div class="mb-4 text-base font-semibold text-[#1a1a2e]">图片生成模型设置</div>

          <label class="mb-1 mt-3 block text-xs text-gray-500">API 地址</label>
          <input v-model="imgSettings.imgApiUrl" class="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#8b6914] focus:bg-white" placeholder="https://ark.cn-beijing.volces.com/api/v3/images/generations" />

          <label class="mb-1 mt-3 block text-xs text-gray-500">API Key</label>
          <input v-model="imgSettings.imgApiKey" class="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#8b6914] focus:bg-white" type="password" placeholder="your-api-key" />

          <label class="mb-1 mt-3 block text-xs text-gray-500">模型 ID</label>
          <input v-model="imgSettings.imgModel" class="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-[#8b6914] focus:bg-white" placeholder="doubao-seedream-4-5-251128" />

          <div class="mt-3 text-xs leading-5 text-gray-400">支持豆包 SeeDream、DALL·E、Flux 等 OpenAI 兼容格式的图片生成 API。</div>

          <div class="mt-5 flex gap-2.5">
            <button class="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500" @click="showSettings = false">取消</button>
            <button class="flex-1 rounded-xl bg-[#8b6914] px-3 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-[#a07d2e] disabled:cursor-not-allowed disabled:opacity-50" @click="saveSettings" :disabled="savingSettings">{{ savingSettings ? '保存中...' : '保存' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';

const API_BASE = '/apps/lovehouse';

// ========== 默认 SVG 场景 ==========
const defaultScenes = {
  sunset: {
    caption: '夕阳海边 🌅',
    svg: `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s0a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="0.4" stop-color="#feca57"/><stop offset="0.7" stop-color="#ff9ff3"/><stop offset="1" stop-color="#54a0ff"/></linearGradient></defs><rect width="400" height="400" fill="url(#s0a)"/><circle cx="200" cy="220" r="40" fill="#feca57" opacity="0.9"/><path d="M0 250 Q100 235 200 245 Q300 255 400 240 L400 400 L0 400Z" fill="#48dbfb" opacity="0.8"/><ellipse cx="80" cy="80" rx="50" ry="20" fill="rgba(255,255,255,0.4)"/></svg>`
  },
  night: {
    caption: '星空夜晚 🌙',
    svg: `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"><rect width="400" height="400" fill="#0c1445"/><circle cx="320" cy="60" r="25" fill="#ffd93d" opacity="0.9"/><circle cx="310" cy="55" r="20" fill="#0c1445"/><circle cx="50" cy="40" r="1.2" fill="rgba(255,255,255,0.8)"/><circle cx="120" cy="90" r="1" fill="rgba(255,255,255,0.6)"/><circle cx="200" cy="30" r="1.5" fill="rgba(255,255,255,0.9)"/><circle cx="280" cy="120" r="0.8" fill="rgba(255,255,255,0.5)"/><circle cx="350" cy="160" r="1.3" fill="rgba(255,255,255,0.7)"/><path d="M0 320 Q200 290 400 320 L400 400 L0 400Z" fill="#1a3a1a"/></svg>`
  },
  sakura: {
    caption: '樱花树下 🌸',
    svg: `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s2a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8e6cf"/><stop offset="0.6" stop-color="#dcedc1"/><stop offset="1" stop-color="#ffd3b6"/></linearGradient></defs><rect width="400" height="400" fill="url(#s2a)"/><path d="M200 400 Q195 300 180 240 Q170 200 190 160" stroke="#8d6e63" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="140" cy="120" r="30" fill="#ffb7c5" opacity="0.7"/><circle cx="180" cy="100" r="25" fill="#ffc1cc" opacity="0.6"/><circle cx="220" cy="110" r="28" fill="#ff9eb5" opacity="0.5"/><path d="M0 360 Q200 340 400 355 L400 400 L0 400Z" fill="#81c784" opacity="0.6"/></svg>`
  },
  snow: {
    caption: '雪山清晨 🏔',
    svg: `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s3a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#74b9ff"/><stop offset="0.5" stop-color="#a29bfe"/><stop offset="1" stop-color="#dfe6e9"/></linearGradient></defs><rect width="400" height="400" fill="url(#s3a)"/><path d="M0 350 L100 200 L200 280 L300 180 L400 250 L400 400 L0 400Z" fill="#dfe6e9"/><path d="M100 200 L120 220 L80 220Z" fill="#fff"/><path d="M300 180 L325 210 L275 210Z" fill="#fff"/><circle cx="80" cy="80" r="30" fill="#ffeaa7" opacity="0.9"/><path d="M0 350 Q200 340 400 345 L400 400 L0 400Z" fill="#fff" opacity="0.8"/></svg>`
  }
};

const sceneKeys = Object.keys(defaultScenes);

// ========== 状态 ==========
const messages = ref([]);
const currentScene = ref('sunset');
const inputText = ref('');
const chalkColor = ref('#ffb6ce');
const colorPickerOpen = ref(false);
const sending = ref(false);
const generating = ref(false);
const sceneTransition = ref(false);
const messagesEl = ref(null);
const inputEl = ref(null);

const photos = ref([]);
const photoIndex = ref(0);
const currentPhoto = ref(null);

const showSettings = ref(false);
const savingSettings = ref(false);
const imgSettings = reactive({ imgApiUrl: '', imgApiKey: '', imgModel: '' });

const chalkOptions = [
  { name: 'pink', color: '#ffb6ce' },
  { name: 'white', color: '#ffffff' },
  { name: 'yellow', color: '#ffd93d' },
  { name: 'blue', color: '#74b9ff' }
];

// ========== 方法 ==========
const scrollBottom = async () => { await nextTick(); if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight; };
const autoResize = () => { if (!inputEl.value) return; inputEl.value.style.height = 'auto'; inputEl.value.style.height = inputEl.value.scrollHeight + 'px'; };

const loadMessages = async () => {
  try {
    const res = await fetch(`${API_BASE}/messages?limit=100`);
    const data = await res.json();
    messages.value = data.items || [];
    if (data.currentScene && defaultScenes[data.currentScene]) currentScene.value = data.currentScene;
    scrollBottom();
  } catch (e) { console.error('load messages failed', e); }
};

const loadPhotos = async () => {
  try {
    const res = await fetch(`${API_BASE}/photos?limit=50`);
    const data = await res.json();
    photos.value = data.items || [];
    if (photos.value.length) { photoIndex.value = 0; currentPhoto.value = photos.value[0]; }
  } catch (e) { console.error('load photos failed', e); }
};

const loadSettings = async () => {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    imgSettings.imgApiUrl = data.imgApiUrl || '';
    imgSettings.imgApiKey = data.imgApiKey || '';
    imgSettings.imgModel = data.imgModel || '';
  } catch (e) { console.error('load settings failed', e); }
};

const saveSettings = async () => {
  savingSettings.value = true;
  try {
    await fetch(`${API_BASE}/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(imgSettings) });
    showSettings.value = false;
  } catch (e) { console.error('save settings failed', e); }
  finally { savingSettings.value = false; }
};

const sendMsg = async () => {
  const text = inputText.value.trim();
  if (!text || sending.value) return;
  messages.value.push({ id: Date.now(), role: 'user', content: text });
  inputText.value = '';
  if (inputEl.value) inputEl.value.style.height = 'auto';
  scrollBottom();

  sending.value = true;
  try {
    const res = await fetch(`${API_BASE}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) });
    const data = await res.json();
    if (!res.ok || !data.success) { messages.value.push({ id: Date.now(), role: 'assistant', content: data.message || '嗯…出了点小问题' }); scrollBottom(); return; }

    if (data.scene && data.scene !== currentScene.value) animateSceneChange(data.scene);
    messages.value.push({ id: Date.now(), role: 'assistant', content: data.reply });
    scrollBottom();

    if (data.generateImage && data.imagePrompt) generatePhotoFromPrompt(data.imagePrompt);
  } catch (e) {
    messages.value.push({ id: Date.now(), role: 'assistant', content: '写不动了…网络好像有问题' });
    scrollBottom();
  } finally { sending.value = false; }
};

const generatePhotoFromPrompt = async (prompt) => {
  generating.value = true;
  try {
    const res = await fetch(`${API_BASE}/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
    const data = await res.json();
    if (data.success && data.photo) { photos.value.unshift(data.photo); photoIndex.value = 0; currentPhoto.value = data.photo; }
  } catch (e) { console.error('generate photo failed', e); }
  finally { generating.value = false; }
};

const prevPhoto = () => { if (photos.value.length <= 1) return; photoIndex.value = (photoIndex.value + 1) % photos.value.length; currentPhoto.value = photos.value[photoIndex.value]; };
const nextPhoto = () => { if (photos.value.length <= 1) return; photoIndex.value = (photoIndex.value - 1 + photos.value.length) % photos.value.length; currentPhoto.value = photos.value[photoIndex.value]; };

const animateSceneChange = (s) => { sceneTransition.value = true; setTimeout(() => { currentScene.value = s; setTimeout(() => { sceneTransition.value = false; }, 100); }, 500); };
const prevScene = () => { const i = sceneKeys.indexOf(currentScene.value); switchScene(sceneKeys[(i - 1 + sceneKeys.length) % sceneKeys.length]); };
const nextScene = () => { const i = sceneKeys.indexOf(currentScene.value); switchScene(sceneKeys[(i + 1) % sceneKeys.length]); };
const switchScene = async (key) => {
  if (key === currentScene.value) return;
  animateSceneChange(key);
  try { await fetch(`${API_BASE}/scene`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene: key }) }); } catch (e) { console.error('switch scene failed', e); }
};

onMounted(() => { loadMessages(); loadPhotos(); loadSettings(); });
</script>
