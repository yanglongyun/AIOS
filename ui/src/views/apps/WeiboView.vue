<template>
  <div class="h-full flex flex-col bg-[#e8ddd0] font-sans text-[#3a2e20] relative max-h-screen">
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div class="max-w-[600px] mx-auto px-4 py-6 pb-10">

        <!-- 顶部：个人主页链接卡 -->
        <div class="bg-white/40 border border-black/5 rounded-[14px] p-3 mb-6 flex justify-between items-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.02)]">
          <div class="flex flex-col min-w-0 flex-1 mr-4">
            <span class="text-[12px] font-semibold text-[#7a6a58]">你的公开主页，外部用户可访问这个地址查看您的主页</span>
            <span class="text-[11px] text-[#9a8a78] font-mono truncate bg-black/5 px-2 py-1.5 rounded-md mt-1.5 select-all">{{ publicFeedUrl }}</span>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button @click="copyPublicFeed" class="bg-white/60 hover:bg-white text-[#7a6a58] hover:text-[#b08040] hover:-translate-y-[1px] border border-black/5 rounded-lg w-8 h-8 flex items-center justify-center transition shadow-sm" :title="copied ? '已复制' : '复制链接'">
              <svg v-if="copied" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <svg v-else viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button @click="openPublicFeed" class="bg-white/60 hover:bg-white text-[#7a6a58] hover:text-[#b08040] hover:-translate-y-[1px] border border-black/5 rounded-lg w-8 h-8 flex items-center justify-center transition shadow-sm" title="打开">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </button>
          </div>
        </div>

        <!-- 发帖区：信纸拟物风格 -->
        <div class="relative bg-[#fdfbf7]/85 border border-black/5 rounded-2xl p-4 sm:p-5 mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] compose-paper">
          
          <!-- 作者信息与编辑入口 -->
          <div class="flex items-center gap-2.5 mb-3.5">
            <img v-if="avatarPreview" :src="avatarPreview" class="w-7 h-7 rounded-lg object-cover bg-[#ece4d8] shadow-sm" alt="avatar" />
            <div v-else class="w-7 h-7 rounded-lg bg-[#ece4d8] flex items-center justify-center text-[12px] font-bold text-[#a88a68] shadow-sm">T</div>
            <span class="text-[13px] font-bold text-[#7a6a58]">{{ profileName || 'twitter' }}</span>
            <button @click="showProfileModal = true" class="text-[#b0a088] hover:text-[#b08040] hover:bg-black/5 p-1 rounded transition ml-0.5" title="编辑资料">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>

          <!-- 输入框 -->
          <textarea
            v-model="draft"
            rows="2"
            maxlength="280"
            placeholder="有什么新鲜事？"
            class="w-full bg-transparent border-none outline-none resize-none text-[15px] leading-relaxed text-[#3a2e20] placeholder-[#c0b098] min-h-[48px]"
            @input="autoResize"
            ref="textareaRef"
          ></textarea>

          <!-- 底部发布栏 -->
          <div class="flex items-center justify-end mt-3 gap-4 pt-3 border-t border-black/5 border-dashed">
            <span class="text-[12px] font-mono transition-colors" :class="draft.length > 260 ? 'text-[#d06040]' : 'text-[#c8b898]'">{{ draft.length }}/280</span>
            <button
              class="text-[14px] font-bold px-6 py-2 rounded-full border border-white/20 bg-gradient-to-br from-[#b88d55] to-[#9c6f35] text-[#fff8ee] shadow-[0_4px_8px_rgba(156,111,53,0.2),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-[1px] hover:shadow-[0_6px_12px_rgba(156,111,53,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] active:translate-y-[1px] active:shadow-[0_2px_4px_rgba(156,111,53,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              :disabled="posting || !draft.trim()"
              @click="createPost"
            >{{ posting ? '发布中...' : '发布' }}</button>
          </div>
        </div>

        <!-- 帖子信息流 -->
        <div class="flex flex-col gap-4">
          <div v-if="!posts.length" class="py-10 text-center text-[14px] text-[#a89070] bg-white/30 rounded-xl border border-black/5 border-dashed">
            还没有内容，发一条试试
          </div>
          
          <div v-for="p in posts" :key="p.id" class="bg-[#fdfbf7]/60 hover:bg-[#fdfbf7]/95 border border-black/5 rounded-[14px] p-4 sm:p-5 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-[1px]">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2.5">
                <img v-if="avatarPreview" :src="avatarPreview" class="w-9 h-9 rounded-xl object-cover border border-black/5 bg-white shadow-sm" alt="avatar" />
                <div v-else class="w-9 h-9 rounded-xl border border-black/5 bg-white shadow-sm flex items-center justify-center font-bold text-[#a88a68]">T</div>
                <div class="flex flex-col">
                  <span class="text-[14px] font-bold text-[#5a4828]">{{ profileName || 'twitter' }}</span>
                  <span class="text-[11px] text-[#9a8a78] mt-0.5">{{ formatDate(p.created_at) }}</span>
                </div>
              </div>
              <button @click="deletePost(p.id)" class="text-[#c8b898] hover:text-[#d06040] hover:bg-[#d06040]/10 p-1 rounded transition" title="删除">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div class="text-[15px] leading-relaxed text-[#3a2e20] whitespace-pre-wrap break-words sm:pl-[46px]">
              {{ p.content }}
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 编辑个人资料 Modal (绝对定位，应用内居中) -->
    <div v-if="showProfileModal" class="absolute inset-0 z-50 flex items-center justify-center bg-[#3a2e20]/20 backdrop-blur-sm px-4" @click.self="showProfileModal = false">
      <div class="bg-[#fcfaf7] w-full max-w-[340px] rounded-2xl shadow-2xl border border-white/50 p-6 flex flex-col gap-5 relative overflow-hidden">
        <!-- 弹窗质感光效 -->
        <div class="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none"></div>
        
        <h3 class="text-[16px] font-bold text-[#5a4828] text-center relative z-10 z-10">编辑个人名片</h3>
        
        <div class="flex flex-col items-center gap-2 relative z-10">
          <div class="relative w-16 h-16 cursor-pointer group" @click="openAvatarPicker">
            <img v-if="avatarPreview" :src="avatarPreview" class="w-full h-full rounded-[14px] object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" />
            <div v-else class="w-full h-full rounded-[14px] border-2 border-white bg-[#ece4d8] flex items-center justify-center text-[24px] font-bold text-[#a88a68] shadow-sm group-hover:scale-105 transition-transform">T</div>
            <div class="absolute inset-0 bg-black/40 rounded-[14px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
               <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <div v-if="uploadingAvatar" class="absolute inset-0 bg-white/70 rounded-[14px] flex items-center justify-center text-[10px] text-[#5a4828]">...</div>
            <input ref="avatarInputRef" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onAvatarSelected" />
          </div>
          <span class="text-[11px] text-[#a88a68]">点击更换头像</span>
        </div>

        <div class="flex flex-col gap-3 relative z-10">
          <div>
            <label class="block text-[11px] text-[#9a8a78] mb-1.5 ml-1">微博名称</label>
            <input v-model="profileName" class="w-full bg-white/60 border border-black/5 rounded-xl px-3.5 py-2 text-[14px] text-[#3a2e20] focus:bg-white focus:border-[#b08040] focus:ring-1 focus:ring-[#b08040] outline-none transition shadow-inner font-bold" placeholder="输入显示名称（如 twitter）" maxlength="40" />
          </div>
          <div>
            <label class="block text-[11px] text-[#9a8a78] mb-1.5 ml-1">签名</label>
            <textarea v-model="profileSignature" rows="2" class="w-full bg-white/60 border border-black/5 rounded-xl px-3.5 py-2 text-[13px] text-[#5a4828] focus:bg-white focus:border-[#b08040] focus:ring-1 focus:ring-[#b08040] outline-none resize-none transition shadow-inner" placeholder="一句话介绍自己" maxlength="160"></textarea>
          </div>
        </div>

        <button @click="saveProfile" :disabled="savingProfile" class="w-full mt-2 py-2.5 rounded-xl text-[14px] font-bold text-[#fff8ee] bg-gradient-to-br from-[#b88d55] to-[#9c6f35] shadow-[0_4px_8px_rgba(156,111,53,0.2)] hover:-translate-y-[1px] hover:shadow-lg transition-all active:translate-y-0 relative z-10 disabled:opacity-60">
          {{ savingProfile ? '保存中...' || '保存中...' : '保存资料' || '保存并关闭' }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';
import { toast } from '../../stores/toast.js';

const API_BASE = '/apps/weibo';
const publicFeedUrl = `${window.location.origin}/apps/weibo/feed`;

const posts = ref([]);
const draft = ref('');
const posting = ref(false);
const copied = ref(false);
const textareaRef = ref(null);

// Profile
const showProfileModal = ref(false);
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
    toast.show('头像上传失败' || 'Upload failed', { type: 'error' });
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
    
    toast.show('资料已保存' || 'Profile Saved');
    showProfileModal.value = false; // 关闭弹窗
  } catch (e2) {
    toast.show('保存资料失败' || 'Failed to save', { type: 'error' });
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
  if (diff < 60) return '刚刚' || 'just now';
  if (diff < 3600) return ('{n}分钟前' || '{n}min').replace('{n}', Math.floor(diff / 60));
  if (diff < 86400) return ('{n}小时前' || '{n}h').replace('{n}', Math.floor(diff / 3600));
  if (diff < 604800) return ('{n}天前' || '{n}d').replace('{n}', Math.floor(diff / 86400));
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

onMounted(async () => {
  await Promise.all([fetchPosts(), fetchProfile()]);
});
</script>

<style scoped>
/* 自定义滚动条保留 */
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,.08); border-radius: 3px; }

/* 信纸边缘拟物打孔阴影 (仅需几行代码，Tailwind 较难纯净实现) */
.compose-paper::before {
  content: '';
  position: absolute;
  top: 12px;
  left: -4px;
  bottom: 12px;
  width: 4px;
  background-image: radial-gradient(circle, rgba(0,0,0,0.06) 2.5px, transparent 2.5px);
  background-size: 10px 14px;
}
</style>
