<template>
  <div class="relative min-h-screen overflow-hidden bg-[#1a1410] text-[#e8d4b8] font-['Georgia','PingFang_SC',serif]">
    <!-- 背景纹理 -->
    <div class="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(180deg,transparent_0,transparent_6px,rgba(255,255,255,0.015)_6px,rgba(255,255,255,0.015)_7px),radial-gradient(ellipse_at_50%_0%,rgba(200,160,96,0.12),transparent_60%)]"></div>

    <!-- 顶栏 -->
    <div class="relative z-10 flex h-12 items-center border-b-2 border-[#3a2010] bg-[linear-gradient(180deg,#5a3e28,#4a3020)] px-6 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
      <span class="text-[15px] font-bold tracking-[0.12em] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">AIOS</span>
      <span class="ml-auto text-[11px] text-[#a08c70]">{{ t('welcome_init') }} · {{ step }} / 4</span>
    </div>

    <!-- 内容 -->
    <div class="relative z-[1] flex h-[calc(100vh-48px)] items-center justify-center p-5">
      <div class="w-[540px] max-w-[96vw] overflow-hidden rounded-[14px] border border-[#3a2a18] bg-[linear-gradient(180deg,#2e2218,#261c14)] shadow-[0_16px_60px_rgba(0,0,0,0.6)]">
        <!-- 进度条 -->
        <div class="h-[3px] bg-[#2a1e14]">
          <div class="h-full bg-[linear-gradient(90deg,#c8a060,#d4b878)] transition-all duration-400" :style="{ width: step / 4 * 100 + '%' }"></div>
        </div>

        <!-- Step 1: 欢迎 -->
        <div v-if="step === 1" class="px-10 py-12 text-center">
          <h2 class="bg-gradient-to-b from-[#e8d4b8] from-20% to-[#c8a060] bg-clip-text text-[56px] font-extrabold leading-none tracking-[0.08em] text-transparent">AIOS</h2>
          <div class="mx-auto mt-6 h-[2px] w-10 rounded-full bg-[#c8a060] opacity-50"></div>
          <p class="mt-6 text-[13px] leading-[2] tracking-[0.02em] text-[#8a7a60]">{{ t('welcome_desc') }}</p>
          <div class="mt-7 flex items-center justify-between border-t border-[#3a2a1a] pt-6">
            <div class="flex gap-2">
              <button
                v-for="lang in [{ id: 'zh', label: '中文' }, { id: 'en', label: 'English' }]"
                :key="lang.id"
                class="rounded-lg border px-4 py-1.5 text-[13px] transition-all"
                :class="model.language === lang.id ? 'border-[#c8a060] bg-[rgba(200,160,96,0.12)] text-[#c8a060] font-semibold' : 'border-[#3a2a1a] text-[#6a5840] hover:border-[#5a4a30] hover:text-[#a08c70]'"
                @click="model.language = lang.id"
              >{{ lang.label }}</button>
            </div>
            <button class="rounded-lg bg-[#c8a060] px-7 py-2.5 text-[13px] font-semibold text-[#1a1008] hover:bg-[#d4b070]" @click="step = 2">{{ t('welcome_start') }}</button>
          </div>
        </div>

        <!-- Step 2: 创建管理员 -->
        <div v-if="step === 2" class="p-8">
          <h2 class="text-lg font-bold">{{ t('welcome_admin_title') }}</h2>
          <div class="mt-1 mb-6 text-xs text-[#8a7860]">{{ t('welcome_admin_hint') }}</div>
          <div class="mb-3.5">
            <label class="mb-1 block text-[11px] uppercase tracking-wider text-[#6a5840]">{{ t('welcome_username') }}</label>
            <input v-model.trim="admin.username" :placeholder="t('welcome_username_ph')" class="wiz-input" />
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="mb-1 block text-[11px] uppercase tracking-wider text-[#6a5840]">{{ t('welcome_password') }}</label>
              <input v-model="admin.password" type="password" :placeholder="t('welcome_password_ph')" class="wiz-input" />
            </div>
            <div>
              <label class="mb-1 block text-[11px] uppercase tracking-wider text-[#6a5840]">{{ t('welcome_confirm') }}</label>
              <input v-model="admin.confirm" type="password" :placeholder="t('welcome_confirm_ph')" class="wiz-input" />
            </div>
          </div>
          <div v-if="error" class="mt-3 rounded-lg border border-[#a94f4f] bg-[#5a2727]/80 px-3 py-2 text-sm">{{ error }}</div>
          <div class="mt-6 h-px bg-[#3a2a1a]"></div>
          <div class="mt-6 flex items-center justify-between">
            <button class="text-[13px] text-[#6a5840] hover:text-[#c8a060]" @click="step = 1">← {{ t('welcome_back') }}</button>
            <button class="rounded-lg bg-[#c8a060] px-5 py-2.5 text-[13px] font-semibold text-[#1a1008] hover:bg-[#d4b070] disabled:opacity-40" :disabled="pending" @click="createAdmin">
              {{ pending ? t('welcome_creating') : t('welcome_create_continue') }}
            </button>
          </div>
        </div>

        <!-- Step 3: 配置模型 -->
        <div v-if="step === 3" class="p-8">
          <h2 class="text-lg font-bold">{{ t('welcome_model_title') }}</h2>
          <div class="mt-1 mb-6 text-xs text-[#8a7860]">{{ t('welcome_model_hint') }}</div>
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="mb-1 block text-[11px] uppercase tracking-wider text-[#6a5840]">{{ t('welcome_provider') }}</label>
              <select v-model="model.provider" class="wiz-input" @change="applyProviderDefault">
                <option v-for="p in PROVIDERS" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-[11px] uppercase tracking-wider text-[#6a5840]">{{ t('welcome_model') }}</label>
              <input v-model.trim="model.model" placeholder="gpt-5.2" class="wiz-input" />
            </div>
          </div>
          <div class="mt-3.5">
            <label class="mb-1 block text-[11px] uppercase tracking-wider text-[#6a5840]">API {{ t('welcome_api_url') }}</label>
            <input v-model.trim="model.apiUrl" placeholder="https://..." class="wiz-input" />
          </div>
          <div class="mt-3.5">
            <label class="mb-1 block text-[11px] uppercase tracking-wider text-[#6a5840]">API Key</label>
            <input v-model.trim="model.apiKey" placeholder="sk-..." class="wiz-input" />
          </div>
          <div v-if="error" class="mt-3 rounded-lg border border-[#a94f4f] bg-[#5a2727]/80 px-3 py-2 text-sm">{{ error }}</div>
          <div class="mt-6 h-px bg-[#3a2a1a]"></div>
          <div class="mt-6 flex items-center justify-between">
            <button class="text-[13px] text-[#6a5840] hover:text-[#c8a060]" @click="step = 2">← {{ t('welcome_back') }}</button>
            <button class="rounded-lg bg-[#c8a060] px-5 py-2.5 text-[13px] font-semibold text-[#1a1008] hover:bg-[#d4b070] disabled:opacity-40" :disabled="pending" @click="saveModelAndTest">
              {{ pending ? t('welcome_testing') : t('welcome_save_test') }}
            </button>
          </div>
        </div>

        <!-- Step 4: 完成 -->
        <div v-if="step === 4" class="p-8 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#7a9a6a] bg-[rgba(122,154,106,0.15)] text-xl">✓</div>
          <h2 class="text-lg font-bold">{{ t('welcome_intro_title') }}</h2>
          <div class="mt-1 mb-5 text-xs text-[#8a7860]">{{ t('welcome_intro_hint') }}</div>
          <div class="min-h-[80px] rounded-[10px] border border-[#3a2a1a] bg-[#1a1410] px-6 py-5 text-left text-sm leading-8 text-[#c8b898]">
            <span>{{ displayedText }}</span><span v-if="typing" class="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-[#c8a060] align-text-bottom"></span>
          </div>
          <div class="mt-6 h-px bg-[#3a2a1a]"></div>
          <div class="mt-6 transition-opacity duration-500" :class="typing ? 'opacity-0' : 'opacity-100'">
            <button class="rounded-lg bg-[#c8a060] px-8 py-2.5 text-[13px] font-semibold text-[#1a1008] hover:bg-[#d4b070]" @click="enterSystem">{{ t('welcome_enter') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { PROVIDERS, getProvider } from '../data/providers.js';
import { clearAuthCache } from '../auth/session.js';
import { setLocale, useI18n } from '../i18n/index.js';

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

watch(() => model.value.language, (lang) => setLocale(lang));

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
    const res = await fetch('/api/auth/register', {
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
      throw new Error(saveData?.message || saveData?.error || t('welcome_err_save'));
    }

    setLocale(model.value.language);
    const isZh = model.value.language === 'zh';
    const testRes = await fetch('/api/task/create/instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        app: 'setup',
        title: '初始化欢迎语',
        prompt: isZh ? '生成初始化欢迎介绍。' : 'Generate onboarding intro.',
        schema: { required: ['intro'] },
        messages: [
          {
            role: 'system',
            content: '只输出 JSON：{"intro":"..."}'
          },
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
    startTypewriter(parsed?.intro || (isZh ? '你好，我是 AIOS。很高兴认识你。' : 'Hello, I am AIOS. Nice to meet you.'));
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
  border-radius: 8px;
  border: 1px solid #3a2a1a;
  background: #1a1410;
  padding: 9px 12px;
  font-size: 13px;
  color: #e8d4b8;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.wiz-input::placeholder { color: #4a3a28; }
.wiz-input:focus { border-color: #c8a060; }
</style>
