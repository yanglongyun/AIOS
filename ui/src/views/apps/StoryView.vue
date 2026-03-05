<template>
  <div class="story-root">

    <!-- ========== 列表页：书架 ========== -->
    <template v-if="view === 'list'">
      <div class="beam">
        <span class="beam-t">书 架</span>
        <button @click="view = 'create'" class="beam-btn">+ 新故事</button>
      </div>
      <div class="shelf-area wood-dark">
        <div v-if="!sessions.length" class="empty-hint">还没有故事，新建一个开始吧</div>
        <template v-else>
          <div v-for="(tier, ti) in shelfTiers" :key="ti" class="shelf-tier">
            <div class="book-row">
              <button
                v-for="(s, i) in tier" :key="s.id"
                class="book" @click="selectSession(s.id)"
              >
                <div class="book-cover" :class="'c' + ((ti * 4 + i) % 9)">
                  <div class="cover-frame"></div>
                  <div class="cv-body">
                    <div class="cv-title">{{ s.title }}</div>
                    <div class="cv-line"></div>
                    <div class="cv-sub">{{ s.chapterCount || 0 }} 章</div>
                  </div>
                </div>
                <div class="book-name">{{ s.title }}</div>
              </button>
              <!-- 最后一层末尾加新建按钮 -->
              <button v-if="ti === shelfTiers.length - 1" class="book book-add" @click="view = 'create'">
                <div class="book-cover"><span class="add-icon">+</span></div>
                <div class="book-name" style="color:#5a4828">新建</div>
              </button>
            </div>
            <div class="plank wood-plank"></div>
            <div class="plank-shadow"></div>
          </div>
        </template>
      </div>
    </template>

    <!-- ========== 详情页 ========== -->
    <template v-if="view === 'detail' && activeSession">
      <div class="beam">
        <button class="beam-back" @click="backToList">
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          书架
        </button>
        <span class="beam-title">{{ activeSession.title }}</span>
        <button @click="resetStory" :disabled="loading" class="beam-btn" style="font-size:11px;padding:4px 10px">重置</button>
      </div>
      <div ref="timelineRef" class="detail-area wood-dark">
        <div class="detail-inner">
          <!-- 章节列表 -->
          <div v-if="!chapters.length" class="empty-chapter">
            还没有章节，点击下面「开始故事」即可生成第一章
          </div>
          <div v-for="ch in chapters" :key="ch.id" class="chapter-card">
            <div v-if="ch.action && ch.action !== '开始故事'" class="chapter-action">
              <span class="chapter-action-line"></span>
              <span class="chapter-action-text">{{ ch.action }}</span>
              <span class="chapter-action-line"></span>
            </div>
            <div class="chapter-body">
              <div class="chapter-head">
                <span class="chapter-idx">第 {{ ch.idx }} 章</span>
                <span class="chapter-progress">{{ ch.progress }}</span>
              </div>
              <p class="chapter-text">{{ ch.content }}</p>
            </div>
          </div>

          <div v-if="loading" class="loading-hint">
            <div class="loading-spinner"></div>
            Agent 正在推进剧情...
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="detail-action">
        <div class="detail-action-inner">
          <div v-if="error" class="error-bar">{{ error }}</div>
          <div v-if="currentChoices.length" class="choices-row">
            <button
              v-for="(c, i) in currentChoices" :key="`${i}-${c}`"
              @click="runGenerate(c)" :disabled="loading"
              class="choice-btn"
            >{{ c }}</button>
          </div>
          <div class="input-row">
            <input
              v-model="customAction"
              :placeholder="chapters.length ? '自定义行动...' : '描述开场，或直接开始...'"
              @keyup.enter="chapters.length ? runCustom() : runGenerate('开始故事')"
              class="action-input"
            />
            <button
              @click="chapters.length ? runCustom() : runGenerate('开始故事')"
              :disabled="loading" class="action-go"
            >{{ loading ? '生成中...' : (chapters.length ? '行动' : '开始故事') }}</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== 创建页 ========== -->
    <template v-if="view === 'create'">
      <div class="beam">
        <button class="beam-back" @click="view = 'list'">
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          书架
        </button>
        <span></span>
      </div>
      <div class="create-area wood-dark">
        <div class="create-card">
          <div class="create-title">新建故事</div>
          <div class="create-field">
            <div class="create-label">故事标题</div>
            <input v-model="newTitle" class="create-input" placeholder="给你的故事起个名字" />
          </div>
          <div class="create-field">
            <div class="create-label">世界观设定（可选）</div>
            <textarea v-model="newPremise" class="create-input create-textarea" placeholder="描述故事的背景、时代、主角特征..."></textarea>
          </div>
          <button @click="createStory" :disabled="creating" class="create-submit">
            {{ creating ? '创建中...' : '开始创作' }}
          </button>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';

const BOOKS_PER_SHELF = 4;
const API_BASE = '/apps/story';

const view = ref('list');
const sessions = ref([]);
const activeSession = ref(null);
const chapters = ref([]);
const error = ref('');
const creating = ref(false);
const loading = ref(false);
const newTitle = ref('');
const newPremise = ref('');
const customAction = ref('');
const timelineRef = ref(null);

const shelfTiers = computed(() => {
  const tiers = [];
  for (let i = 0; i < sessions.value.length; i += BOOKS_PER_SHELF) {
    tiers.push(sessions.value.slice(i, i + BOOKS_PER_SHELF));
  }
  if (!tiers.length) tiers.push([]);
  return tiers;
});

const currentChoices = computed(() => {
  for (let i = chapters.value.length - 1; i >= 0; i--) {
    const ch = chapters.value[i];
    if (Array.isArray(ch.choices) && ch.choices.length) return ch.choices.slice(0, 3);
  }
  return [];
});

const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};

const scrollToBottom = async () => {
  await nextTick();
  if (timelineRef.value) timelineRef.value.scrollTop = timelineRef.value.scrollHeight;
};

const loadSessions = async () => {
  const data = await request(`${API_BASE}/list`);
  sessions.value = data.items || [];
};

const selectSession = async (id) => {
  const data = await request(`${API_BASE}/history?sessionId=${id}`);
  activeSession.value = data.session;
  chapters.value = data.chapters || [];
  error.value = '';
  view.value = 'detail';
  await scrollToBottom();
};

const backToList = async () => {
  view.value = 'list';
  activeSession.value = null;
  await loadSessions();
};

const createStory = async () => {
  error.value = '';
  creating.value = true;
  try {
    const data = await request(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.value.trim(), premise: newPremise.value.trim() })
    });
    newTitle.value = '';
    newPremise.value = '';
    await loadSessions();
    await selectSession(data.session.id);
  } catch (e) {
    error.value = e.message || '创建失败';
  } finally {
    creating.value = false;
  }
};

const runGenerate = async (action) => {
  if (!activeSession.value || loading.value) return;
  error.value = '';
  loading.value = true;
  try {
    await request(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: activeSession.value.id, action })
    });
    await selectSession(activeSession.value.id);
  } catch (e) {
    error.value = e.message || '生成失败';
  } finally {
    loading.value = false;
    customAction.value = '';
  }
};

const runCustom = async () => {
  const text = customAction.value.trim();
  if (!text) return;
  await runGenerate(text);
};

const resetStory = async () => {
  if (!activeSession.value || loading.value) return;
  if (!confirm(`重置「${activeSession.value.title}」？所有章节将被清除。`)) return;
  error.value = '';
  loading.value = true;
  try {
    await request(`${API_BASE}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: activeSession.value.id })
    });
    await selectSession(activeSession.value.id);
  } catch (e) {
    error.value = e.message || '重置失败';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await loadSessions();
  } catch (e) {
    error.value = e.message || '初始化失败';
  }
});
</script>

<style scoped>
/* ======================================================
   根容器
   ====================================================== */
.story-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'PingFang SC', -apple-system, serif;
  background: #e8ddd0;
  color: #3a2e20;
}

/* ======================================================
   木纹工具类
   ====================================================== */
.wood-dark {
  background-color: #d8c8ae;
  background-image:
    repeating-linear-gradient(92deg, transparent 0px, transparent 18px, rgba(160,120,60,.06) 18px, rgba(160,120,60,.06) 20px, transparent 20px, transparent 46px, rgba(120,80,30,.04) 46px, rgba(120,80,30,.04) 48px),
    repeating-linear-gradient(88deg, transparent 0px, transparent 5px, rgba(160,120,60,.04) 5px, rgba(160,120,60,.04) 6px, transparent 6px, transparent 12px),
    repeating-linear-gradient(180deg, rgba(160,120,60,.02) 0px, rgba(160,120,60,.02) 1px, transparent 1px, transparent 40px);
}
.wood-plank {
  background-color: #b89868;
  background-image:
    linear-gradient(180deg, rgba(255,240,200,.2) 0%, transparent 25%, rgba(0,0,0,.08) 80%, rgba(255,220,160,.1) 100%),
    repeating-linear-gradient(90deg, transparent 0px, transparent 32px, rgba(0,0,0,.05) 32px, rgba(0,0,0,.05) 33px, transparent 33px, transparent 68px);
}

/* ======================================================
   顶梁
   ====================================================== */
.beam {
  flex-shrink: 0;
  height: 50px;
  background-color: #b89060;
  background-image:
    linear-gradient(180deg, rgba(255,240,200,.18) 0%, transparent 40%, rgba(0,0,0,.1) 100%),
    repeating-linear-gradient(90deg, transparent 0px, transparent 24px, rgba(0,0,0,.05) 24px, rgba(0,0,0,.05) 26px, transparent 26px, transparent 58px),
    repeating-linear-gradient(90deg, transparent 0px, transparent 7px, rgba(0,0,0,.03) 7px, rgba(0,0,0,.03) 8px);
  box-shadow: 0 3px 0 #8a6438, 0 4px 0 #a07848, 0 6px 16px rgba(0,0,0,.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative;
  z-index: 20;
}
.beam::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 3px;
  background: linear-gradient(180deg, rgba(255,240,200,.1), transparent);
}
.beam-t {
  font-size: 15px;
  font-weight: 800;
  color: #fff8ee;
  text-shadow: 0 1px 3px rgba(0,0,0,.3);
  letter-spacing: .06em;
  font-family: serif;
}
.beam-btn {
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #fff8ee;
  cursor: pointer;
  transition: background .15s;
}
.beam-btn:hover { background: rgba(255,255,255,.25); }
.beam-btn:disabled { opacity: .4; cursor: default; }
.beam-back {
  background: none;
  border: none;
  font-size: 13px;
  color: rgba(255,255,255,.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: inherit;
}
.beam-back:hover { color: #fff; }
.beam-back svg { width: 14px; height: 14px; fill: currentColor; }
.beam-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 800;
  color: #fff8ee;
  text-shadow: 0 1px 3px rgba(0,0,0,.3);
  font-family: serif;
  max-width: 50%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ======================================================
   书架区
   ====================================================== */
.shelf-area { flex: 1; overflow-y: auto; }
.shelf-tier { position: relative; }
.book-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px 10px;
  padding: 32px 20px 18px;
  position: relative;
  z-index: 2;
}
.plank {
  height: 22px;
  position: relative;
  z-index: 3;
  box-shadow: 0 3px 0 #8a6030, 0 4px 0 #a07840, 0 6px 14px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,240,200,.15);
}
.plank-shadow {
  height: 18px;
  background: radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,0,0,.08) 0%, transparent 70%);
  z-index: 1;
  position: relative;
}

.empty-hint {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #9a8060;
}

/* ======================================================
   书本封面
   ====================================================== */
.book {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  color: inherit;
}
.book-cover {
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 2px 6px 6px 2px;
  position: relative;
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px 9px 9px;
  box-shadow: -2px 1px 0 rgba(0,0,0,.15), -4px 2px 0 rgba(0,0,0,.06), 2px 4px 12px rgba(0,0,0,.12);
}
.book:hover .book-cover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: -2px 1px 0 rgba(0,0,0,.15), -5px 3px 0 rgba(0,0,0,.06), 4px 14px 20px rgba(0,0,0,.16);
}
.book-cover::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 7px;
  background: linear-gradient(90deg, rgba(0,0,0,.2), rgba(0,0,0,.06) 50%, rgba(255,255,255,.08));
  border-radius: 2px 0 0 2px;
}
.book-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,.14) 0%, transparent 45%, rgba(0,0,0,.1) 100%);
  pointer-events: none;
  border-radius: 2px 6px 6px 2px;
}

/* 封面线框装饰 */
.cover-frame {
  position: absolute;
  inset: 8px 7px 8px 12px;
  border: 1px solid rgba(255,220,160,.15);
  border-radius: 2px;
  pointer-events: none;
}
.cover-frame::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid rgba(255,220,160,.08);
  border-radius: 1px;
}

.cv-body { position: relative; z-index: 1; }
.cv-title {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.3;
  text-shadow: 0 1px 4px rgba(0,0,0,.6);
  font-family: serif;
  text-align: left;
}
.cv-line {
  width: 22px;
  height: 1.5px;
  background: currentColor;
  opacity: .35;
  margin: 4px 0 3px;
}
.cv-sub {
  font-size: 9px;
  opacity: .55;
  letter-spacing: .06em;
}
.book-name {
  font-size: 10px;
  font-weight: 600;
  color: #6a5838;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* 新建按钮 */
.book-add .book-cover {
  background: rgba(0,0,0,.02) !important;
  border: 2px dashed rgba(0,0,0,.1);
  box-shadow: none;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.book-add .book-cover::before,
.book-add .book-cover::after,
.book-add .cover-frame { display: none; }
.book-add:hover .book-cover {
  border-color: rgba(0,0,0,.2);
  background: rgba(0,0,0,.04) !important;
  transform: none;
  box-shadow: none;
}
.add-icon { font-size: 28px; color: rgba(0,0,0,.15); }

/* 封面配色 */
.c0 { background: linear-gradient(160deg, #d4564c, #e87870 50%, #c84840); color: #fff8f4; }
.c1 { background: linear-gradient(160deg, #4878b8, #6098d8 50%, #4070b0); color: #f0f6ff; }
.c2 { background: linear-gradient(160deg, #48906a, #60b088 50%, #408060); color: #f0fff6; }
.c3 { background: linear-gradient(160deg, #b88840, #d0a858 50%, #a87830); color: #fffaf0; }
.c4 { background: linear-gradient(160deg, #8060b8, #9878d0 50%, #7050a8); color: #f6f0ff; }
.c5 { background: linear-gradient(160deg, #d87848, #e89868 50%, #c86838); color: #fff6f0; }
.c6 { background: linear-gradient(160deg, #5080a0, #6898b8 50%, #487898); color: #f0f8ff; }
.c7 { background: linear-gradient(160deg, #408888, #58a8a8 50%, #387878); color: #f0ffff; }
.c8 { background: linear-gradient(160deg, #c86088, #d878a0 50%, #b85078); color: #fff0f6; }

/* ======================================================
   详情页
   ====================================================== */
.detail-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px 140px;
}
.detail-inner {
  max-width: 640px;
  margin: 0 auto;
}
/* 章节 */
.empty-chapter {
  border: 1px dashed rgba(0,0,0,.1);
  border-radius: 12px;
  padding: 48px 0;
  text-align: center;
  font-size: 13px;
  color: #9a8060;
}
.chapter-action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.chapter-action-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,.08), transparent);
}
.chapter-action-text {
  font-size: 10px;
  color: #8a7050;
  white-space: nowrap;
  padding: 2px 10px;
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 20px;
  background: rgba(255,255,255,.3);
}
.chapter-body {
  background: rgba(255,255,255,.5);
  border: 1px solid rgba(0,0,0,.04);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.chapter-body:hover { background: rgba(255,255,255,.65); }
.chapter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.chapter-idx {
  font-size: 10px;
  font-weight: 700;
  color: #b08040;
  letter-spacing: .08em;
}
.chapter-progress {
  font-size: 10px;
  color: #a09070;
}
.chapter-text {
  font-size: 13px;
  color: #4a3a28;
  line-height: 1.9;
  white-space: pre-wrap;
}

.loading-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
  font-size: 12px;
  color: #9a8060;
}
.loading-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,.08);
  border-top-color: #b08040;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 底部操作 */
.detail-action {
  flex-shrink: 0;
  padding: 12px 20px 16px;
  position: relative;
  background: #c8b898;
  border-top: 1px solid rgba(0,0,0,.06);
}
.detail-action-inner {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.error-bar {
  font-size: 11px;
  color: #e07050;
  padding: 6px 12px;
  background: rgba(200,60,40,.08);
  border: 1px solid rgba(200,60,40,.12);
  border-radius: 8px;
}
.choices-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.choice-btn {
  background: rgba(255,255,255,.4);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 8px;
  padding: 8px 6px;
  font-size: 11px;
  color: #5a4828;
  cursor: pointer;
  text-align: left;
  line-height: 1.4;
  transition: background .15s, border-color .15s;
  font-family: inherit;
}
.choice-btn:hover {
  background: rgba(255,255,255,.6);
  border-color: rgba(0,0,0,.1);
}
.choice-btn:disabled { opacity: .4; cursor: default; }
.input-row { display: flex; gap: 8px; }
.action-input {
  flex: 1;
  background: rgba(255,255,255,.6);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #3a2a18;
  outline: none;
  font-family: inherit;
}
.action-input::placeholder { color: rgba(0,0,0,.25); }
.action-input:focus { border-color: rgba(160,120,60,.4); }
.action-go {
  flex-shrink: 0;
  background: linear-gradient(135deg, #b08040, #8a5c28);
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 700;
  color: #fff8ee;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,.15);
  transition: transform .12s;
  font-family: inherit;
}
.action-go:hover { transform: scale(1.03); }
.action-go:disabled { opacity: .4; cursor: default; transform: none; }

/* ======================================================
   创建页
   ====================================================== */
.create-area {
  flex: 1;
  overflow-y: auto;
  padding: 32px 20px 40px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.create-card {
  width: 100%;
  max-width: 460px;
  background: rgba(255,255,255,.45);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 14px;
  padding: 28px 24px;
}
.create-title {
  font-size: 17px;
  font-weight: 800;
  color: #3a2a18;
  margin-bottom: 20px;
  font-family: serif;
}
.create-field { margin-bottom: 16px; }
.create-label {
  font-size: 11px;
  font-weight: 600;
  color: #9a8060;
  letter-spacing: .06em;
  margin-bottom: 6px;
}
.create-input {
  width: 100%;
  background: rgba(255,255,255,.6);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #3a2a18;
  outline: none;
  font-family: inherit;
}
.create-input:focus { border-color: rgba(160,120,60,.35); }
.create-input::placeholder { color: rgba(0,0,0,.22); }
.create-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.6;
}
.create-submit {
  width: 100%;
  background: linear-gradient(135deg, #b08040, #8a5c28);
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #fff8ee;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
  margin-top: 4px;
  transition: transform .12s;
  font-family: inherit;
}
.create-submit:hover { transform: scale(1.02); }
.create-submit:disabled { opacity: .4; cursor: default; transform: none; }

/* 滚动条 */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,.08); border-radius: 3px; }
</style>
