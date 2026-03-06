<template>
  <div class="wb-root">
    <div class="wb-feed">
      <div class="wb-inner">
        <!-- 公开主页 -->
        <div class="feed-bar">
          <div class="feed-info">
            <div class="feed-url">{{ publicFeedUrl }}</div>
            <div class="feed-desc">{{ t('weibo_feed_desc') }}</div>
          </div>
          <div class="feed-btns">
            <button class="feed-btn" @click="openPublicFeed">{{ t('weibo_feed_open') }}</button>
            <button class="feed-btn primary" @click="copyPublicFeed">{{ copied ? t('weibo_feed_copied') : t('weibo_feed_copy') }}</button>
          </div>
        </div>

        <div class="profile-card">
          <div class="profile-avatar-wrap">
            <img v-if="avatarPreview" :src="avatarPreview" class="profile-avatar" alt="avatar" />
            <div v-else class="profile-avatar profile-avatar-empty">T</div>
            <button class="profile-upload-btn" :disabled="uploadingAvatar" @click="openAvatarPicker">
              {{ uploadingAvatar ? t('weibo_avatar_uploading') : t('weibo_upload_avatar') }}
            </button>
            <input ref="avatarInputRef" type="file" accept="image/png,image/jpeg,image/webp" class="hidden-file" @change="onAvatarSelected" />
          </div>
          <div class="profile-fields">
            <div class="profile-label">{{ t('weibo_name') }}</div>
            <input v-model="profileName" class="profile-input" :placeholder="t('weibo_name_placeholder')" maxlength="40" />
            <div class="profile-label">{{ t('weibo_signature') }}</div>
            <input v-model="profileSignature" class="profile-input" :placeholder="t('weibo_signature_placeholder')" maxlength="160" />
          </div>
          <div class="profile-save-row">
            <button class="compose-btn" :disabled="savingProfile" @click="saveProfile()">
              {{ savingProfile ? t('weibo_profile_saving') : t('weibo_save_profile') }}
            </button>
          </div>
        </div>

        <!-- 发布区 -->
        <div class="compose">
          <textarea
            v-model="draft"
            rows="1"
            maxlength="280"
            :placeholder="t('weibo_compose_placeholder')"
            class="compose-input"
            @input="autoResize"
            ref="textareaRef"
          ></textarea>
          <div class="compose-bottom">
            <span class="char-count" :class="draft.length > 260 && 'warn'">{{ draft.length }}/280</span>
            <button
              class="compose-btn"
              :disabled="posting || !draft.trim()"
              @click="createPost"
            >{{ posting ? t('weibo_publishing') : t('weibo_publish') }}</button>
          </div>
        </div>

        <!-- 帖子列表 -->
        <div v-if="!posts.length" class="empty">{{ t('weibo_empty') }}</div>
        <div v-for="p in posts" :key="p.id" class="post">
          <div class="post-text">{{ p.content }}</div>
          <div class="post-footer">
            <span class="post-time">{{ formatDate(p.created_at) }}</span>
            <button class="post-del" @click="deletePost(p.id)">{{ t('weibo_delete') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';
import { useI18n } from '../../i18n/index.js';
import { toast } from '../../stores/toast.js';

const { t } = useI18n();
const API_BASE = '/apps/weibo';
const publicFeedUrl = `${window.location.origin}/apps/weibo/feed`;

const posts = ref([]);
const draft = ref('');
const posting = ref(false);
const copied = ref(false);
const textareaRef = ref(null);
const avatarInputRef = ref(null);
const uploadingAvatar = ref(false);
const savingProfile = ref(false);
const profileName = ref('twitter');
const profileSignature = ref('');
const avatarPreview = ref('');
const avatarPath = ref('');

const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
};

const fetchPosts = async () => {
  const res = await fetch(`${API_BASE}/list?limit=100`);
  const data = await res.json();
  posts.value = Array.isArray(data.data) ? data.data : [];
};

const toPublicFileUrl = (input = '') => {
  const text = String(input || '').trim();
  if (!text) return '';
  if (text.startsWith('/files/')) return text;
  const idx = text.indexOf('/files/');
  if (idx >= 0) return text.slice(idx);
  return text;
};

const fetchProfile = async () => {
  const res = await fetch(`${API_BASE}/profile`);
  const data = await res.json().catch(() => ({}));
  const profile = data?.profile || {};
  profileName.value = String(profile.displayName || 'twitter');
  profileSignature.value = String(profile.signature || '');
  avatarPath.value = String(profile.avatarUrl || '');
  avatarPreview.value = toPublicFileUrl(avatarPath.value);
};

const createPost = async () => {
  const content = draft.value.trim();
  if (!content || posting.value) return;
  posting.value = true;
  try {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);
    draft.value = '';
    await nextTick();
    autoResize();
    await fetchPosts();
  } catch {}
  posting.value = false;
};

const deletePost = async (id) => {
  await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  fetchPosts();
};

const copyPublicFeed = async () => {
  try {
    await navigator.clipboard.writeText(publicFeedUrl);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1500);
  } catch {}
};

const openPublicFeed = () => {
  window.open(publicFeedUrl, '_blank', 'noopener,noreferrer');
};

const openAvatarPicker = () => {
  avatarInputRef.value?.click();
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('read failed'));
  reader.readAsDataURL(file);
});

const onAvatarSelected = async (e) => {
  const file = e.target?.files?.[0];
  e.target.value = '';
  if (!file) return;
  uploadingAvatar.value = true;
  try {
    const dataUrl = await fileToBase64(file);
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, data: dataUrl })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false || !data?.file?.path) {
      throw new Error(data.message || 'upload failed');
    }
    avatarPath.value = toPublicFileUrl(data.file.path);
    avatarPreview.value = avatarPath.value;
  } catch (e2) {
    toast.show(t('weibo_upload_failed'), { type: 'error' });
  } finally {
    uploadingAvatar.value = false;
  }
};

const saveProfile = async () => {
  if (savingProfile.value) return;
  savingProfile.value = true;
  try {
    const res = await fetch(`${API_BASE}/profile/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: profileName.value,
        signature: profileSignature.value,
        avatarPath: avatarPath.value
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'save failed');
    }
    const profile = data?.profile || {};
    profileName.value = String(profile.displayName || profileName.value);
    profileSignature.value = String(profile.signature || '');
    avatarPath.value = String(profile.avatarUrl || avatarPath.value);
    avatarPreview.value = toPublicFileUrl(avatarPath.value);
    toast.show(t('weibo_profile_saved'));
  } catch (e2) {
    toast.show(t('weibo_profile_save_failed'), { type: 'error' });
  } finally {
    savingProfile.value = false;
  }
};

const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(String(v).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return v;
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return t('weibo_just_now');
  if (diff < 3600) return t('weibo_minutes_ago', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('weibo_hours_ago', { n: Math.floor(diff / 3600) });
  if (diff < 604800) return t('weibo_days_ago', { n: Math.floor(diff / 86400) });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

onMounted(async () => {
  await Promise.all([fetchPosts(), fetchProfile()]);
});
</script>

<style scoped>
.wb-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #e8ddd0;
  font-family: 'PingFang SC', -apple-system, sans-serif;
  color: #3a2e20;
}

.wb-feed {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.wb-feed::-webkit-scrollbar { width: 5px; }
.wb-feed::-webkit-scrollbar-track { background: transparent; }
.wb-feed::-webkit-scrollbar-thumb { background: rgba(0,0,0,.08); border-radius: 3px; }

.wb-inner {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}

/* 公开主页 */
.feed-bar {
  background: rgba(255,255,255,.35);
  border: 1px solid rgba(0,0,0,.05);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.feed-info { flex: 1; min-width: 0; }
.feed-url {
  font-size: 11px;
  color: #8a7a60;
  word-break: break-all;
  font-family: 'SF Mono', Menlo, monospace;
}
.feed-desc {
  font-size: 11px;
  color: #b0a088;
  margin-top: 3px;
}
.feed-btns {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.feed-btn {
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,.08);
  background: rgba(255,255,255,.5);
  color: #5a4828;
  cursor: pointer;
  transition: background .15s;
  font-family: inherit;
}
.feed-btn:hover { background: rgba(255,255,255,.7); }
.feed-btn.primary {
  background: linear-gradient(135deg, #b08040, #8a5c28);
  color: #fff8ee;
  border-color: transparent;
}
.feed-btn.primary:hover { opacity: .9; }

.profile-card {
  background: rgba(255,255,255,.5);
  border: 1px solid rgba(0,0,0,.05);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.profile-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid rgba(0,0,0,.08);
  background: #fff;
}
.profile-avatar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #8a6a48;
}
.profile-upload-btn {
  font-size: 11px;
  font-weight: 600;
  padding: 6px 11px;
  border-radius: 7px;
  border: 1px solid rgba(0,0,0,.08);
  background: rgba(255,255,255,.62);
  color: #5a4828;
  cursor: pointer;
}
.profile-upload-btn:disabled {
  opacity: .45;
  cursor: default;
}
.hidden-file { display: none; }
.profile-fields { margin-top: 10px; }
.profile-label {
  font-size: 11px;
  color: #9a8a78;
  margin: 6px 0 4px;
}
.profile-input {
  width: 100%;
  border: 1px solid rgba(0,0,0,.08);
  outline: none;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: #3a2e20;
  background: rgba(255,255,255,.7);
  font-family: inherit;
}
.profile-input:focus { border-color: #b08040; }
.profile-save-row {
  margin-top: 12px;
  display: flex;
  justify-content: flex-start;
}

/* 发布区 */
.compose {
  background: rgba(255,255,255,.5);
  border: 1px solid rgba(0,0,0,.05);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.compose-input {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  color: #3a2e20;
  font-family: inherit;
  background: transparent;
  min-height: 24px;
}
.compose-input::placeholder { color: #b0a088; }
.compose-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}
.char-count {
  font-size: 11px;
  color: #c8b898;
  transition: color .15s;
}
.char-count.warn { color: #d06040; }
.compose-btn {
  font-size: 13px;
  font-weight: 700;
  padding: 7px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #b08040, #8a5c28);
  color: #fff8ee;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,.1);
  transition: transform .12s;
  font-family: inherit;
}
.compose-btn:hover { transform: scale(1.03); }
.compose-btn:disabled {
  opacity: .35;
  cursor: default;
  transform: none;
}

/* 空状态 */
.empty {
  padding: 60px 0;
  text-align: center;
  font-size: 13px;
  color: #9a8060;
}

/* 帖子 */
.post {
  background: rgba(255,255,255,.5);
  border: 1px solid rgba(0,0,0,.04);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 8px;
  transition: background .15s;
}
.post:hover { background: rgba(255,255,255,.65); }
.post-text {
  font-size: 14px;
  line-height: 1.8;
  color: #3a2e20;
  white-space: pre-wrap;
  word-break: break-word;
}
.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
.post-time {
  font-size: 11px;
  color: #b0a088;
}
.post-del {
  font-size: 11px;
  color: #c8b898;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: color .15s;
}
.post-del:hover { color: #d06040; }
</style>
