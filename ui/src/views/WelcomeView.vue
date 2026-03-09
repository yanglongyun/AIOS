<template>
  <div class="relative min-h-screen overflow-hidden bg-[#1a1410] text-[#e8d4b8] font-['Georgia','PingFang_SC',serif]">
    <!-- 背景纹理 -->
    <div
      class="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(180deg,transparent_0,transparent_6px,rgba(255,255,255,0.015)_6px,rgba(255,255,255,0.015)_7px),radial-gradient(ellipse_at_50%_0%,rgba(200,160,96,0.12),transparent_60%)]">
    </div>

    <!-- 顶栏 -->
    <div
      class="relative z-10 flex h-12 items-center border-b-2 border-[#3a2010] bg-[linear-gradient(180deg,#5a3e28,#4a3020)] px-6 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
      <span class="text-[15px] font-bold tracking-[0.12em] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">AIOS</span>
    </div>

    <!-- 内容 -->
    <div class="relative z-[1] flex h-[calc(100vh-48px)] items-center justify-center p-5">
      <div
        class="w-[540px] max-w-[96vw] overflow-hidden rounded-[14px] border border-[#3a2a18] bg-[linear-gradient(180deg,#2e2218,#261c14)] shadow-[0_16px_60px_rgba(0,0,0,0.6)]">
        <!-- 进度条 -->
        <div class="h-[3px] bg-[#2a1e14]">
          <div class="h-full bg-[linear-gradient(90deg,#c8a060,#d4b878)] transition-all duration-500"
            :style="{ width: step / 4 * 100 + '%' }"></div>
        </div>

        <!-- Step 1: 欢迎 -->
        <div v-if="step === 1" class="px-10 py-12">
          <h2
            class="bg-gradient-to-r from-[#e8d4b8] to-[#c8a060] bg-clip-text text-[60px] font-extrabold leading-none tracking-tight text-transparent">
            AIOS</h2>
          <div class="mt-8 h-px w-full bg-gradient-to-r from-[#c8a060] to-transparent opacity-30"></div>
          <p class="mt-8 space-y-3 text-[14px] leading-relaxed tracking-wide text-[#a09078] max-w-[450px]">
            <span>欢迎使用 AIOS。</span><br>
            <span>我致力于将您的想法转化为实际行动，高效解决问题。我能依据您的愿望构建应用及改造系统，为您打造专属的数字世界。</span><br>
            <span>未来不会流于无形—— 未来，留于物形。</span>
          </p>
          <div class="mt-12 flex items-end justify-end">
            <button
              class="rounded bg-[#c8a060] px-8 py-3 text-[14px] font-semibold text-[#1a1008] hover:bg-[#d4b070] shadow-[0_4px_14px_rgba(200,160,96,0.3)] transition-all"
              @click="step = 2">下一步</button>
          </div>
        </div>

        <!-- Step 2: 创建管理员 -->
        <div v-if="step === 2" class="px-10 py-10">
          <h2 class="text-2xl font-bold tracking-wide text-[#e8d4b8]">创建管理员</h2>
          <p class="mt-2 text-[13px] text-[#8a7860]">请设置您的管理员账户以确保系统安全与权限管理。</p>

          <div class="mt-8 space-y-5">
            <div>
              <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">用户名</label>
              <input v-model.trim="admin.username" placeholder="请输入用户名" class="wiz-input" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">密码</label>
                <input v-model="admin.password" type="password" placeholder="设置密码"
                  class="wiz-input" />
              </div>
              <div>
                <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">确认密码</label>
                <input v-model="admin.confirm" type="password" placeholder="再次输入密码"
                  class="wiz-input" />
              </div>
            </div>
          </div>
          <div v-if="error" class="mt-4 rounded-lg border border-[#a94f4f] bg-[#5a2727]/80 px-3 py-2 text-sm">{{ error
          }}</div>

          <div class="mt-10 flex items-center justify-between">
            <button class="text-[13px] tracking-wide text-[#6a5840] hover:text-[#c8a060] transition-colors"
              @click="step = 1">上一步</button>
            <button
              class="rounded bg-[#c8a060] px-8 py-3 text-[14px] font-semibold text-[#1a1008] hover:bg-[#d4b070] shadow-[0_4px_14px_rgba(200,160,96,0.3)] transition-all disabled:opacity-40"
              :disabled="pending" @click="createAdmin">
              {{ pending ? '创建中…' : '下一步' }}
            </button>
          </div>
        </div>

        <!-- Step 3: 配置模型 -->
        <div v-if="step === 3" class="px-10 py-10">
          <h2 class="text-2xl font-bold tracking-wide text-[#e8d4b8]">连接大语言模型</h2>
          <p class="mt-2 text-[13px] text-[#8a7860]">配置您的 AI 核心引擎，支持多种供应商或自定义 API 接口。</p>

          <div class="mt-8 space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">供应商</label>
                <select v-model="model.provider" class="wiz-input" @change="applyProviderDefault">
                  <optgroup v-for="group in PROVIDER_GROUPS" :key="group.id" :label="group.name">
                    <option v-for="p in getProvidersByGroup(group.id)" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">模型</label>
                <input v-model.trim="model.model" placeholder="gpt-5.2" class="wiz-input" />
              </div>
            </div>
            <div>
              <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">API 链接 (可选)</label>
              <input v-model.trim="model.apiUrl" placeholder="https://..." class="wiz-input" />
            </div>
            <div>
              <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">API Key</label>
              <input v-model.trim="model.apiKey" placeholder="sk-..." class="wiz-input" />
            </div>
          </div>
          <div v-if="error" class="mt-4 rounded-lg border border-[#a94f4f] bg-[#5a2727]/80 px-3 py-2 text-sm">{{ error
          }}</div>

          <div class="mt-10 flex items-center justify-between">
            <button class="text-[13px] tracking-wide text-[#6a5840] hover:text-[#c8a060] transition-colors"
              @click="step = 2">上一步</button>
            <button
              class="rounded bg-[#c8a060] px-8 py-3 text-[14px] font-semibold text-[#1a1008] hover:bg-[#d4b070] shadow-[0_4px_14px_rgba(200,160,96,0.3)] transition-all disabled:opacity-40"
              :disabled="pending" @click="saveModelAndTest">
              {{ pending ? '测试中…' : '保存并测试' }}
            </button>
          </div>
        </div>

        <!-- Step 4: 完成 -->
        <div v-if="step === 4" class="px-10 py-12">
          <div class="flex items-start gap-6">
            <div>
              <h2 class="text-2xl font-bold tracking-wide text-[#e8d4b8]">初始化完成</h2>
              <p class="mt-2 text-[13px] text-[#8a7860]">系统已就绪，以下是来自 AI 核心的初次回应：</p>
            </div>
          </div>

          <div
            class="mt-8 min-h-[100px] rounded-lg border border-[rgba(200,160,96,0.2)] bg-[rgba(0,0,0,0.3)] p-6 text-[14px] leading-relaxed tracking-wide text-[#c8b898]">
            <span>{{ displayedText }}</span><span v-if="typing"
              class="ml-0.5 inline-block h-[1em] w-[4px] animate-pulse bg-[#c8a060] align-text-bottom"></span>
          </div>

          <div class="mt-12 flex items-center justify-between transition-opacity duration-500"
            :class="typing ? 'opacity-0' : 'opacity-100'">
            <button class="text-[13px] tracking-wide text-[#6a5840] hover:text-[#c8a060] transition-colors"
              @click="step = 3">上一步</button>
            <button
              class="rounded bg-[#c8a060] px-10 py-3 text-[14px] font-semibold text-[#1a1008] hover:bg-[#d4b070] shadow-[0_4px_14px_rgba(200,160,96,0.3)] transition-all"
              @click="enterSystem">进入系统</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { PROVIDER_GROUPS, getProvidersByGroup, getProvider } from '../data/providers.js';
import { clearAuthCache } from '../auth/session.js';
const router = useRouter();
const step = ref(1);
const pending = ref(false);
const error = ref('');
const welcomeText = ref('');
const displayedText = ref('');
const typing = ref(false);
let typeTimer = null;

const admin = ref({ username: '', password: '', confirm: '' });

const model = ref({
  provider: 'openai',
  apiUrl: getProvider('openai')?.apiUrl || '',
  model: getProvider('openai')?.defaultModel || '',
  apiKey: '',
  language: 'zh'
});


const applyProviderDefault = () => {
  const item = getProvider(model.value.provider);
  model.value.apiUrl = item?.apiUrl || '';
  model.value.model = item?.defaultModel || '';
};

const createAdmin = async () => {
  error.value = '';
  if (admin.value.password !== admin.value.confirm) {
    error.value = '两次密码不一致';
    return;
  }
  pending.value = true;
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: admin.value.username, password: admin.value.password })
    });
    const data = await res.json();
    if (!res.ok || data?.success === false) throw new Error(data?.message || '创建管理员失败');
    clearAuthCache();
    step.value = 3;
  } catch (e) {
    error.value = e?.message || '创建管理员失败';
  } finally {
    pending.value = false;
  }
};

const startTypewriter = (text) => {
  welcomeText.value = text;
  displayedText.value = '';
  typing.value = true;
  let i = 0;
  typeTimer = setInterval(() => {
    if (i < text.length) {
      displayedText.value = text.slice(0, ++i);
    } else {
      clearInterval(typeTimer);
      typing.value = false;
    }
  }, 50);
};

const saveModelAndTest = async () => {
  error.value = '';
  pending.value = true;
  try {
    const saveRes = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        provider: model.value.provider,
        apiUrl: model.value.apiUrl,
        apiKey: model.value.apiKey,
        model: model.value.model,
        language: model.value.language
      })
    });
    const saveData = await saveRes.json();
    if (!saveRes.ok || saveData?.success === false || saveData?.error) {
      throw new Error(saveData?.message || saveData?.error || '模型配置保存失败');
    }

    const testRes = await fetch('/api/task/create/instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        app: 'setup',
        title: '初始化欢迎语',
        prompt: '生成初始化欢迎介绍。',
        schema: { required: ['intro'] },
        messages: [
          {
            role: 'system',
            content: '只输出 JSON：{"intro":"..."}'
          },
          {
            role: 'system',
            content: '你是 AIOS，一个 AI 驱动的个人操作系统。现在是初始化完成后的第一次启动，请做一段简短的自我介绍（3-5句），像第一次见面打招呼一样自然。告诉用户你能做什么、你的特点。'
          },
          { role: 'user', content: '你好，介绍一下你自己。' }
        ]
      })
    });
    const testData = await testRes.json();
    if (!testRes.ok || testData?.success === false) {
      throw new Error(testData?.message || '模型连通测试失败');
    }
    const parsed = JSON.parse(String(testData.response || '{}'));

    step.value = 4;
    startTypewriter(parsed?.intro || '你好，我是 AIOS。很高兴认识你。');
  } catch (e) {
    error.value = e?.message || '模型连通测试失败';
  } finally {
    pending.value = false;
  }
};

const enterSystem = async () => {
  clearAuthCache();
  await router.replace('/chat');
};

onUnmounted(() => {
  if (typeTimer) clearInterval(typeTimer);
});
</script>

<style scoped>
.wiz-input {
  width: 100%;
  border-radius: 6px;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.3);
  padding: 12px 16px;
  font-size: 13px;
  color: #e8d4b8;
  font-family: inherit;
  outline: none;
  transition: all 0.2s;
}

.wiz-input::placeholder {
  color: #5a4a35;
}

.wiz-input:focus {
  border-color: #c8a060;
  background: rgba(0, 0, 0, 0.5);
}

select.wiz-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238a7860'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 40px;
}
</style>
