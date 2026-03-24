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

        <!-- Step 1: 欢迎 + 语言选择 -->
        <div v-if="step === 1" class="px-10 py-12">
          <h2
            class="bg-gradient-to-r from-[#e8d4b8] to-[#c8a060] bg-clip-text text-[60px] font-extrabold leading-none tracking-tight text-transparent">
            AIOS</h2>
          <div class="mt-8 h-px w-full bg-gradient-to-r from-[#c8a060] to-transparent opacity-30"></div>
          <p class="mt-8 max-w-[450px] space-y-3 text-[14px] leading-relaxed tracking-wide text-[#a09078]">
            <span>{{ t('welcome_desc_1') }}</span><br>
            <span>{{ t('welcome_desc_2') }}</span><br>
            <span>{{ t('welcome_desc_3') }}</span>
          </p>
          <div class="mt-12 flex items-end justify-between">
            <div class="flex gap-4">
              <button v-for="lang in [{ id: 'zh', label: '中文' }, { id: 'en', label: 'English' }]" :key="lang.id"
                class="relative text-[13px] tracking-wider transition-colors cursor-pointer"
                :class="model.language === lang.id ? 'text-[#c8a060] font-bold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-[#c8a060]' : 'text-[#6a5840] hover:text-[#a08c70]'"
                @click="model.language = lang.id">{{ lang.label }}</button>
            </div>
            <button
              class="rounded bg-[#c8a060] px-8 py-3 text-[14px] font-semibold text-[#1a1008] hover:bg-[#d4b070] shadow-[0_4px_14px_rgba(200,160,96,0.3)] transition-all cursor-pointer"
              @click="step = 2">{{ t('welcome_next') }}</button>
          </div>
        </div>

        <!-- Step 2: 创建管理员 -->
        <div v-if="step === 2" class="px-10 py-10">
          <h2 class="text-2xl font-bold tracking-wide text-[#e8d4b8]">{{ t('welcome_admin_title') }}</h2>
          <p class="mt-2 text-[13px] text-[#8a7860]">{{ t('welcome_admin_hint') }}</p>

          <div class="mt-8 space-y-5">
            <div>
              <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">{{ t('welcome_username') }}</label>
              <input v-model.trim="admin.username" :placeholder="t('welcome_username_ph')" class="wiz-input" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">{{ t('welcome_password') }}</label>
                <input v-model="admin.password" type="password" :placeholder="t('welcome_password_ph')" class="wiz-input" />
              </div>
              <div>
                <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">{{ t('welcome_confirm') }}</label>
                <input v-model="admin.confirm" type="password" :placeholder="t('welcome_confirm_ph')" class="wiz-input" />
              </div>
            </div>
          </div>
          <div v-if="error" class="mt-4 rounded-lg border border-[#a94f4f] bg-[#5a2727]/80 px-3 py-2 text-sm">{{ error }}</div>

          <div class="mt-10 flex items-center justify-between">
            <button class="text-[13px] tracking-wide text-[#6a5840] hover:text-[#c8a060] transition-colors cursor-pointer"
              @click="step = 1">{{ t('welcome_prev') }}</button>
            <button
              class="rounded bg-[#c8a060] px-8 py-3 text-[14px] font-semibold text-[#1a1008] hover:bg-[#d4b070] shadow-[0_4px_14px_rgba(200,160,96,0.3)] transition-all disabled:opacity-40 cursor-pointer"
              :disabled="pending" @click="createAdmin">
              {{ pending ? t('welcome_creating') : t('welcome_next') }}
            </button>
          </div>
        </div>

        <!-- Step 3: 配置模型 -->
        <div v-if="step === 3" class="px-10 py-10">
          <h2 class="text-2xl font-bold tracking-wide text-[#e8d4b8]">{{ t('welcome_model_title') }}</h2>
          <p class="mt-2 text-[13px] text-[#8a7860]">{{ t('welcome_model_hint') }}</p>

          <div class="mt-8 space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">{{ t('welcome_provider') }}</label>
                <select v-model="model.provider" class="wiz-input wiz-select" @change="applyProviderDefault">
                  <optgroup v-for="group in PROVIDER_GROUPS" :key="group.id" :label="group.name">
                    <option v-for="p in getProvidersByGroup(group.id)" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">{{ t('welcome_model') }}</label>
                <input v-model.trim="model.model" placeholder="gpt-5.4" class="wiz-input" />
              </div>
            </div>
            <div>
              <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">{{ t('welcome_api_url') }}</label>
              <input v-model.trim="model.apiUrl" placeholder="https://..." class="wiz-input" />
            </div>
            <div>
              <label class="mb-2 block text-[11px] uppercase tracking-widest text-[#8a7860]">{{ t('welcome_api_key') }}</label>
              <input v-model.trim="model.apiKey" placeholder="sk-..." class="wiz-input" />
            </div>
          </div>
          <div v-if="error" class="mt-4 rounded-lg border border-[#a94f4f] bg-[#5a2727]/80 px-3 py-2 text-sm">{{ error }}</div>

          <div class="mt-10 flex items-center justify-between">
            <button class="text-[13px] tracking-wide text-[#6a5840] hover:text-[#c8a060] transition-colors cursor-pointer"
              @click="step = 2">{{ t('welcome_prev') }}</button>
            <button
              class="rounded bg-[#c8a060] px-8 py-3 text-[14px] font-semibold text-[#1a1008] hover:bg-[#d4b070] shadow-[0_4px_14px_rgba(200,160,96,0.3)] transition-all disabled:opacity-40 cursor-pointer"
              :disabled="pending" @click="saveModelAndTest">
              {{ pending ? t('welcome_testing') : t('welcome_save_test') }}
            </button>
          </div>
        </div>

        <!-- Step 4: 完成 -->
        <div v-if="step === 4" class="px-10 py-12">
          <div class="flex items-start gap-6">
            <div>
              <h2 class="text-2xl font-bold tracking-wide text-[#e8d4b8]">{{ t('welcome_intro_title') }}</h2>
              <p class="mt-2 text-[13px] text-[#8a7860]">{{ t('welcome_intro_hint') }}</p>
            </div>
          </div>

          <div
            class="mt-8 min-h-[100px] rounded-lg border border-[rgba(200,160,96,0.2)] bg-[rgba(0,0,0,0.3)] p-6 text-[14px] leading-relaxed tracking-wide text-[#c8b898]">
            <span>{{ displayedText }}</span><span v-if="typing"
              class="ml-0.5 inline-block h-[1em] w-[4px] animate-pulse bg-[#c8a060] align-text-bottom"></span>
          </div>

          <div class="mt-12 flex items-center justify-between transition-opacity duration-500"
            :class="typing ? 'opacity-0' : 'opacity-100'">
            <button class="cursor-pointer text-[13px] tracking-wide text-[#6a5840] transition-colors hover:text-[#c8a060]"
              @click="step = 3">{{ t('welcome_prev') }}</button>
            <button
              class="cursor-pointer rounded bg-[#c8a060] px-10 py-3 text-[14px] font-semibold text-[#1a1008] shadow-[0_4px_14px_rgba(200,160,96,0.3)] transition-all hover:bg-[#d4b070]"
              @click="enterSystem">{{ t('welcome_enter') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { PROVIDER_GROUPS, getProvidersByGroup, getProvider } from '../data/providers.ts';
import { clearAuthCache } from '../auth/session.ts';
import { setLocale, useI18n } from '../i18n/index.ts';

const { t } = useI18n();
const router = useRouter();
const step = ref(1);
const pending = ref(false);
const error = ref('');
const welcomeText = ref('');
const displayedText = ref('');
const typing = ref(false);
let typeTimer = null;

const detectedLanguage = String(navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';

const admin = ref({ username: '', password: '', confirm: '' });

const model = ref({
  provider: 'openai',
  apiUrl: getProvider('openai')?.apiUrl || '',
  model: getProvider('openai')?.defaultModel || '',
  apiKey: '',
  language: detectedLanguage
});

watch(() => model.value.language, (lang) => setLocale(lang), { immediate: true });

const applyProviderDefault = () => {
  const item = getProvider(model.value.provider);
  model.value.apiUrl = item?.apiUrl || '';
  model.value.model = item?.defaultModel || '';
};

const createAdmin = async () => {
  error.value = '';
  if (admin.value.password !== admin.value.confirm) {
    error.value = t('welcome_err_mismatch');
    return;
  }
  pending.value = true;
  try {
    const res = await fetch('/aios/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: admin.value.username, password: admin.value.password })
    });
    const data = await res.json();
    if (!res.ok || data?.success === false) throw new Error(data?.message || t('welcome_err_admin'));
    clearAuthCache();
    step.value = 3;
  } catch (e) {
    error.value = e?.message || t('welcome_err_admin');
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
    const saveRes = await fetch('/aios/api/settings', {
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
      throw new Error(saveData?.message || saveData?.error || t('welcome_err_save'));
    }
    setLocale(model.value.language);
    const isZh = model.value.language === 'zh';
    const testRes = await fetch('/aios/api/task/create/instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        app: 'setup',
        title: '初始化欢迎语',
        prompt: isZh ? '生成初始化欢迎介绍。' : 'Generate onboarding intro.',
        schema: { required: ['intro'] },
        messages: [
          { role: 'system', content: '只输出 JSON：{"intro":"..."}' },
          {
            role: 'system',
            content: isZh
              ? '你是 AIOS，一个 AI 驱动的个人操作系统。现在是初始化完成后的第一次启动，请做一段简短的自我介绍（3-5句），像第一次见面打招呼一样自然。告诉用户你能做什么、你的特点。'
              : 'You are AIOS, an AI-driven personal operating system. This is the first boot after initialization. Give a brief self-introduction (3-5 sentences), naturally like greeting someone for the first time. Tell the user what you can do.'
          },
          { role: 'user', content: isZh ? '你好，介绍一下你自己。' : 'Hello, introduce yourself.' }
        ]
      })
    });
    const testData = await testRes.json();
    if (!testRes.ok || testData?.success === false) {
      throw new Error(testData?.message || t('welcome_err_test'));
    }
    const parsed = JSON.parse(String(testData.response || '{}'));
    step.value = 4;
    welcomeText.value = parsed?.intro || (isZh ? '你好，我是 AIOS。很高兴认识你。' : 'Hello, I am AIOS. Nice to meet you.');
    startTypewriter(welcomeText.value);
  } catch (e) {
    error.value = e?.message || t('welcome_err_test');
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

.wiz-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238a7860'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 40px;
}
</style>
