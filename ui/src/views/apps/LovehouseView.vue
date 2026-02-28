<template>
  <div class="w-full h-full flex items-start justify-center overflow-y-auto bg-black">
  <div class="w-[calc(100%-1rem)] h-[calc(100%-1rem)] my-2 md:w-[calc(100%-4rem)] md:h-[calc(100%-6rem)] md:my-12 max-w-md mx-auto flex flex-col overflow-hidden rounded-2xl border-2 border-white/20" style="background: #4a3728">

    <!-- ====== 上半区：窗口 ====== -->
    <div class="room">
      <div class="wall"></div>

      <div class="window-frame">
        <!-- 窗外内容：照片 or 默认场景 -->
        <div class="window-scene" :style="{ opacity: sceneTransition ? 0 : 1 }">
          <img
            v-if="currentPhoto"
            :src="currentPhoto.type === 'base64' ? `data:image/png;base64,${currentPhoto.url}` : currentPhoto.url"
            class="photo-img"
            @error="currentPhoto = null"
          />
          <div v-else v-html="defaultScenes[currentScene]?.svg || ''"></div>
        </div>
        <div class="window-glare"></div>
        <div class="window-cross-h"></div>
        <div class="window-cross-v"></div>

        <!-- 生成中遮罩 -->
        <div class="generating-overlay" v-if="generating">
          <div class="gen-text">
            正在生成照片
            <span class="dots"><span></span><span></span><span></span></span>
          </div>
        </div>

        <!-- 照片切换 -->
        <div class="photo-nav" v-if="photos.length > 1">
          <button class="pn-btn" @click="prevPhoto">‹</button>
          <span class="pn-count">{{ photoIndex + 1 }} / {{ photos.length }}</span>
          <button class="pn-btn" @click="nextPhoto">›</button>
        </div>

        <div class="scene-caption">{{ currentPhoto ? (currentPhoto.prompt || 'AI 照片') : (defaultScenes[currentScene]?.caption || '') }}</div>
      </div>

      <!-- 窗台装饰 -->
      <div class="sill-items">
        <span class="sill-item">🌵</span>
        <span class="sill-item">📷</span>
        <span class="sill-item" @click="showSettings = true" style="cursor:pointer" title="设置">⚙️</span>
      </div>
      <div class="windowsill"></div>

      <!-- 没照片时的场景切换箭头 -->
      <button v-if="!photos.length" class="scene-nav prev" @click="prevScene">‹</button>
      <button v-if="!photos.length" class="scene-nav next" @click="nextScene">›</button>
    </div>

    <!-- ====== 下半区：粉笔留言板 ====== -->
    <div class="board">
      <div class="board-frame-top"></div>
      <div class="board-bg"></div>

      <div class="messages" ref="messagesEl">
        <div class="chalk-divider" v-if="messages.length">～～～ 留言板 ～～～</div>

        <div
          v-for="msg in messages" :key="msg.id"
          class="chalk-msg fade-in"
          :class="msg.role === 'user' ? 'mine' : 'hers'"
        >{{ msg.content }}</div>

        <div class="writing-indicator" v-if="sending">
          正在写 <span class="chalk-dust"><span></span><span></span><span></span></span>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <div class="chalk-picker" :class="{ open: colorPickerOpen }">
          <button class="chalk-current" :style="{ background: chalkColor }" @click="colorPickerOpen = !colorPickerOpen"></button>
          <div class="chalk-options" v-if="colorPickerOpen">
            <button
              v-for="c in chalkOptions" :key="c.name"
              class="chalk-opt"
              :style="{ background: c.color }"
              :class="{ active: chalkColor === c.color }"
              @click="chalkColor = c.color; colorPickerOpen = false"
            ></button>
          </div>
        </div>
        <div class="input-wrap">
          <textarea
            ref="inputEl"
            v-model="inputText"
            rows="1"
            placeholder="在黑板上写点什么…"
            :style="{ color: chalkColor }"
            @input="autoResize"
            @keydown.enter.exact.prevent="sendMsg"
          ></textarea>
        </div>
        <button class="btn-write" @click="sendMsg" :disabled="sending || !inputText.trim()">✎</button>
      </div>
    </div>

    <!-- ====== 设置面板 ====== -->
    <div class="settings-overlay" v-if="showSettings" @click.self="showSettings = false">
      <div class="settings-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-title">图片生成模型设置</div>

        <label class="field-label">API 地址</label>
        <input v-model="imgSettings.imgApiUrl" class="field-input" placeholder="https://ark.cn-beijing.volces.com/api/v3/images/generations" />

        <label class="field-label">API Key</label>
        <input v-model="imgSettings.imgApiKey" class="field-input" type="password" placeholder="your-api-key" />

        <label class="field-label">模型 ID</label>
        <input v-model="imgSettings.imgModel" class="field-input" placeholder="doubao-seedream-4-5-251128" />

        <div class="sheet-hint">
          支持豆包 SeeDream、DALL·E、Flux 等 OpenAI 兼容格式的图片生成 API。
        </div>

        <div class="sheet-actions">
          <button class="btn-cancel" @click="showSettings = false">取消</button>
          <button class="btn-save" @click="saveSettings" :disabled="savingSettings">{{ savingSettings ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';

const API_BASE = 'http://localhost:9701/api/apps/lovehouse';

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

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap');

.room { flex: 0 0 46%; position: relative; overflow: hidden; }
.wall { position: absolute; inset: 0; background: #f5e6d3; background-image: repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(0,0,0,0.02) 60px, rgba(0,0,0,0.02) 61px), repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(0,0,0,0.02) 60px, rgba(0,0,0,0.02) 61px); }
.window-frame { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: min(85vw, 340px); height: calc(100% - 50px); border: 12px solid #8b6914; border-radius: 6px; background: #1a1a2e; box-shadow: inset 0 0 0 3px #a07d2e, 0 8px 32px rgba(0,0,0,0.3), inset 0 0 60px rgba(0,0,0,0.2); overflow: hidden; }
.window-cross-h { position: absolute; top: 50%; left: 0; right: 0; height: 8px; background: #8b6914; transform: translateY(-50%); z-index: 4; }
.window-cross-v { position: absolute; left: 50%; top: 0; bottom: 0; width: 8px; background: #8b6914; transform: translateX(-50%); z-index: 4; }
.window-scene { position: absolute; inset: 0; transition: opacity 0.8s ease; }
.window-scene :deep(svg) { width: 100%; height: 100%; display: block; }
.photo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.window-glare { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.05) 100%); z-index: 3; pointer-events: none; }
.windowsill { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: calc(min(85vw, 340px) + 40px); height: 14px; background: linear-gradient(180deg, #a07d2e, #8b6914); border-radius: 0 0 3px 3px; z-index: 5; box-shadow: 0 3px 8px rgba(0,0,0,0.2); }
.sill-items { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); width: min(85vw, 340px); display: flex; justify-content: space-between; padding: 0 16px; z-index: 6; }
.sill-item { font-size: 20px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3)); }
.scene-caption { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); font-family: 'Caveat', cursive; font-size: 13px; color: rgba(255,255,255,0.5); background: rgba(0,0,0,0.25); padding: 3px 12px; border-radius: 10px; z-index: 8; backdrop-filter: blur(4px); white-space: nowrap; max-width: 80%; overflow: hidden; text-overflow: ellipsis; }
.scene-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 50%; border: none; background: rgba(0,0,0,0.3); color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer; z-index: 8; display: flex; align-items: center; justify-content: center; }
.scene-nav:hover { background: rgba(0,0,0,0.5); }
.scene-nav.prev { left: calc(50% - min(42.5vw, 170px) - 20px); }
.scene-nav.next { right: calc(50% - min(42.5vw, 170px) - 20px); }

.photo-nav { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; z-index: 8; background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 14px; }
.pn-btn { width: 24px; height: 24px; border-radius: 50%; border: none; background: rgba(255,255,255,0.15); color: #fff; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.pn-btn:hover { background: rgba(255,255,255,0.3); }
.pn-count { font-size: 12px; color: rgba(255,255,255,0.7); font-family: 'Caveat', cursive; }

.generating-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 6; background: rgba(0,0,0,0.4); }
.gen-text { font-family: 'Caveat', cursive; color: rgba(255,255,255,0.85); font-size: 16px; display: flex; align-items: center; gap: 8px; }
.gen-text .dots span { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.6); animation: dustFloat 1s infinite; }
.gen-text .dots span:nth-child(2) { animation-delay: 0.2s; }
.gen-text .dots span:nth-child(3) { animation-delay: 0.4s; }

.board { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }
.board-bg { position: absolute; inset: 0; background: #2d3a2d; background-image: radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.03) 0%, transparent 70%), radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.02) 0%, transparent 60%); }
.board-frame-top { height: 6px; background: linear-gradient(180deg, #8b6914, #6b5010); flex-shrink: 0; position: relative; z-index: 2; }
.messages { flex: 1; overflow-y: auto; padding: 16px 16px 8px; display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 1; }
.messages::-webkit-scrollbar { width: 3px; }
.messages::-webkit-scrollbar-track { background: transparent; }
.messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
.chalk-msg { font-family: 'Caveat', cursive, 'PingFang SC', sans-serif; font-size: 17px; line-height: 1.6; max-width: 80%; padding: 2px 0; word-break: break-word; }
.chalk-msg.hers { color: rgba(255,255,255,0.88); text-shadow: 0 0 4px rgba(255,255,255,0.15); align-self: flex-start; }
.chalk-msg.mine { color: rgba(255,182,206,0.92); text-shadow: 0 0 4px rgba(255,182,206,0.15); align-self: flex-end; text-align: right; }
.chalk-divider { text-align: center; color: rgba(255,255,255,0.2); font-family: 'Caveat', cursive; font-size: 13px; padding: 4px 0; }
.writing-indicator { align-self: flex-start; color: rgba(255,255,255,0.4); font-family: 'Caveat', cursive; font-size: 16px; display: flex; align-items: center; gap: 4px; }
.chalk-dust { display: inline-flex; gap: 3px; }
.chalk-dust span { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.4); animation: dustFloat 1.4s infinite; }
.chalk-dust span:nth-child(2) { animation-delay: 0.3s; }
.chalk-dust span:nth-child(3) { animation-delay: 0.6s; }
@keyframes dustFloat { 0%, 100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-4px); } }

.input-area { padding: 8px 12px 12px; display: flex; align-items: flex-end; gap: 8px; position: relative; z-index: 2; background: rgba(35,45,35,0.8); border-top: 1px solid rgba(255,255,255,0.06); }
.chalk-picker { position: relative; flex-shrink: 0; display: flex; align-items: flex-end; padding-bottom: 6px; }
.chalk-current { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.25); cursor: pointer; transition: all 0.2s; }
.chalk-current:hover { border-color: rgba(255,255,255,0.5); }
.chalk-options { position: absolute; bottom: 32px; left: -4px; display: flex; flex-direction: column; gap: 6px; background: rgba(30,40,30,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 8px; backdrop-filter: blur(8px); animation: fadeIn 0.15s ease; }
.chalk-opt { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
.chalk-opt:hover { transform: scale(1.2); }
.chalk-opt.active { border-color: rgba(255,255,255,0.6); }
.input-wrap { flex: 1; display: flex; align-items: flex-end; }
.input-wrap textarea { flex: 1; background: transparent; border: none; border-bottom: 1px dashed rgba(255,255,255,0.15); color: rgba(255,182,206,0.92); font-family: 'Caveat', cursive, 'PingFang SC', sans-serif; font-size: 17px; resize: none; outline: none; padding: 6px 4px; max-height: 80px; line-height: 1.5; }
.input-wrap textarea::placeholder { color: rgba(255,255,255,0.2); font-family: 'Caveat', cursive; }
.btn-write { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; transition: all 0.2s; }
.btn-write:hover { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); }
.btn-write:disabled { opacity: 0.3; cursor: not-allowed; }
.fade-in { animation: fadeIn 0.6s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.settings-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: flex-end; justify-content: center; }
.settings-sheet { width: 100%; max-width: 420px; background: #fff; border-radius: 20px 20px 0 0; padding: 16px 20px 32px; animation: slideUp 0.3s ease; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.sheet-handle { width: 36px; height: 4px; background: #ddd; border-radius: 2px; margin: 0 auto 16px; }
.sheet-title { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
.field-label { display: block; font-size: 12px; color: #666; margin: 12px 0 4px; }
.field-input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 14px; outline: none; transition: border-color 0.2s; background: #f9fafb; }
.field-input:focus { border-color: #8b6914; background: #fff; }
.sheet-hint { margin-top: 12px; font-size: 12px; color: #999; line-height: 1.5; }
.sheet-actions { display: flex; gap: 10px; margin-top: 20px; }
.btn-cancel { flex: 1; padding: 10px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; font-size: 14px; cursor: pointer; color: #666; }
.btn-save { flex: 1; padding: 10px; border-radius: 12px; border: none; background: #8b6914; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn-save:hover { background: #a07d2e; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
