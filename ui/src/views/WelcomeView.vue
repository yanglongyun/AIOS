<template>
  <div class="relative min-h-screen overflow-hidden" style="background-color:#f7f3ee; font-family:'Barlow',system-ui,sans-serif;">
    <!-- 背景光晕 -->
    <div class="pointer-events-none fixed inset-0"
      style="background:radial-gradient(ellipse 70% 60% at 15% 0%,rgba(255,220,160,.55) 0%,transparent 55%),radial-gradient(ellipse 60% 55% at 90% 95%,rgba(200,210,255,.5) 0%,transparent 55%),radial-gradient(ellipse 50% 45% at 75% 10%,rgba(220,200,255,.35) 0%,transparent 50%)">
    </div>

    <!-- 居中卡片 -->
    <div class="relative z-10 flex min-h-screen items-center justify-center p-6">
      <div class="wiz-card w-full max-w-[500px]">

        <!-- 进度条 -->
        <div class="flex gap-1.5 px-10 pt-9 pb-0">
          <div v-for="i in 4" :key="i" class="h-[3px] flex-1 rounded-full transition-all duration-300"
            :style="i < step ? 'background:#222' : i === step ? 'background:#222;opacity:.45' : 'background:rgba(0,0,0,.1)'">
          </div>
        </div>

        <!-- Step 1: 欢迎 + 语言 -->
        <div v-if="step === 1" class="px-10 py-9">
          <div class="wiz-step-label">Step 01 — Language</div>
          <h2 class="wiz-heading">{{ t.desc_1 }}</h2>
          <p class="wiz-sub">{{ t.desc_2 }}</p>

          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="lang in [{ id: 'zh', flag: '🇨🇳', label: '简体中文' }, { id: 'en', flag: '🇺🇸', label: 'English' }]"
              :key="lang.id"
              class="wiz-lang-btn"
              :class="model.language === lang.id ? 'wiz-lang-sel' : 'wiz-lang-idle'"
              @click="model.language = lang.id">
              <span class="text-[20px]">{{ lang.flag }}</span>
              <span>{{ lang.label }}</span>
            </button>
          </div>

          <div class="wiz-footer">
            <span></span>
            <button class="wiz-btn-next" @click="step = 2">
              <span>{{ t.next }}</span>
              <div class="wiz-icon-circle"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
            </button>
          </div>
        </div>

        <!-- Step 2: 创建管理员 -->
        <div v-if="step === 2" class="px-10 py-9">
          <div class="wiz-step-label">Step 02 — Account</div>
          <h2 class="wiz-heading">{{ t.admin_title }}</h2>
          <p class="wiz-sub">{{ t.admin_hint }}</p>

          <div class="space-y-4">
            <div>
              <label class="wiz-label">{{ t.username }}</label>
              <input v-model.trim="admin.username" :placeholder="t.username_ph" class="wiz-input" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="wiz-label">{{ t.password }}</label>
                <input v-model="admin.password" type="password" :placeholder="t.password_ph" class="wiz-input" />
              </div>
              <div>
                <label class="wiz-label">{{ t.confirm }}</label>
                <input v-model="admin.confirm" type="password" :placeholder="t.confirm_ph" class="wiz-input" />
              </div>
            </div>
          </div>

          <div v-if="error" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">{{ error }}</div>

          <div class="wiz-footer">
            <button class="wiz-btn-back" @click="step = 1">← {{ t.prev }}</button>
            <button class="wiz-btn-next" :disabled="pending" @click="createAdmin">
              <span>{{ pending ? t.creating : t.next }}</span>
              <div class="wiz-icon-circle"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
            </button>
          </div>
        </div>

        <!-- Step 3: 配置模型 -->
        <div v-if="step === 3" class="px-10 py-9">
          <div class="wiz-step-label">Step 03 — AI Model</div>
          <h2 class="wiz-heading">{{ t.model_title }}</h2>
          <p class="wiz-sub">{{ t.model_hint }}</p>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="wiz-label">{{ t.provider }}</label>
                <select v-model="model.provider" class="wiz-input wiz-select" @change="applyProviderDefault">
                  <optgroup v-for="group in providerGroups" :key="group.id" :label="group.name">
                    <option v-for="p in getProvidersByGroup(group.id)" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label class="wiz-label">{{ t.model_label }}</label>
                <input v-model.trim="model.model" placeholder="gpt-4o" class="wiz-input" />
              </div>
            </div>
            <div>
              <label class="wiz-label">{{ t.api_url }}</label>
              <input v-model.trim="model.apiUrl" placeholder="https://..." class="wiz-input" />
            </div>
            <div>
              <label class="wiz-label">{{ t.api_key }}</label>
              <input v-model.trim="model.apiKey" placeholder="sk-..." class="wiz-input" />
            </div>
          </div>

          <div v-if="error" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">{{ error }}</div>

          <div class="wiz-footer">
            <button class="wiz-btn-back" @click="step = 2">← {{ t.prev }}</button>
            <button class="wiz-btn-next" :disabled="pending" @click="saveModelAndTest">
              <span>{{ pending ? t.testing : t.save_test }}</span>
              <div class="wiz-icon-circle"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
            </button>
          </div>
        </div>

        <!-- Step 4: 完成 -->
        <div v-if="step === 4" class="px-10 py-9">
          <div class="wiz-step-label">All set</div>
          <h2 class="wiz-heading">{{ t.intro_title }}</h2>
          <p class="wiz-sub">{{ t.intro_hint }}</p>

          <div class="min-h-[90px] rounded-2xl border border-black/[0.07] bg-black/[0.03] p-5 text-[14px] leading-relaxed text-[#444]">
            <span>{{ displayedText }}</span>
            <span v-if="typing" class="ml-0.5 inline-block h-[1em] w-[3px] animate-pulse bg-[#222] align-text-bottom"></span>
          </div>

          <div class="mt-6 flex flex-col items-center gap-3 border-t border-black/[0.06] pt-6 transition-opacity duration-500"
            :class="typing ? 'opacity-0 pointer-events-none' : 'opacity-100'">
            <p class="text-[12px] font-medium text-black/40">{{ installMessage }}</p>
            <button class="wiz-btn-next wiz-btn-finish" :disabled="installing || !installReady" @click="enterSystem">
              <span>{{ enterButtonLabel }}</span>
              <div class="wiz-icon-circle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { createProviderCatalog } from '../data/providers.js';
import { clearAuthCache } from '../auth/session.js';

const texts = {
  zh: {
    desc_1: '欢迎使用 AIOS。',
    desc_2: '我致力于将您的想法转化为实际行动，高效解决问题。我能依据您的愿望构建应用及改造系统，为您打造专属的数字世界。',
    desc_3: '未来不会流于无形—— 未来，留于物形。',
    next: '下一步',
    prev: '上一步',
    admin_title: '创建管理员',
    admin_hint: '请设置您的管理员账户以确保系统安全与权限管理。',
    username: '用户名',
    username_ph: '请输入用户名',
    password: '密码',
    password_ph: '设置密码',
    confirm: '确认密码',
    confirm_ph: '再次输入密码',
    creating: '创建中…',
    model_title: '连接大语言模型',
    model_hint: '配置您的 AI 核心引擎，支持多种供应商或自定义 API 接口。',
    provider: '供应商',
    model_label: '模型',
    api_url: 'API 链接',
    api_key: 'API Key',
    testing: '检查中…',
    save_test: '连接大模型',
    intro_title: '初始化完成',
    intro_hint: '系统已就绪，以下是来自 AI 核心的初次回应：',
    enter: '进入系统',
    installing_hint: '正在应用语言并编译前端，请稍候…',
    install_ready_hint: '系统已准备完成，可以进入系统。',
    install_failed_hint: '系统准备失败，请返回上一页重新检查。',
    enter_preparing: '准备中…',
    err_mismatch: '两次密码不一致',
    err_admin: '创建管理员失败',
    err_save: '模型配置保存失败',
    err_test: '模型连通测试失败',
    default_intro: '你好，我是 AIOS。很高兴认识你。',
    prompt_intro: '生成初始化欢迎介绍。',
    prompt_system: '你是 AIOS，一个 AI 驱动的个人操作系统。现在是初始化完成后的第一次启动，请做一段简短的自我介绍（3-5句），像第一次见面打招呼一样自然。告诉用户你能做什么、你的特点。',
    prompt_user: '你好，介绍一下你自己。',
  },
  en: {
    desc_1: 'Welcome to AIOS.',
    desc_2: 'I am dedicated to turning your ideas into real actions and solving problems efficiently. I can build apps and transform systems according to your desires, crafting your exclusive digital world.',
    desc_3: 'The future will not remain formless — the future takes physical shape.',
    next: 'Next',
    prev: 'Back',
    admin_title: 'Create Admin',
    admin_hint: 'Please set up your administrator account for system security.',
    username: 'Username',
    username_ph: 'Enter username',
    password: 'Password',
    password_ph: 'Set password',
    confirm: 'Confirm',
    confirm_ph: 'Enter again',
    creating: 'Creating…',
    model_title: 'Language Model',
    model_hint: 'Configure your AI core engine, supporting multiple providers.',
    provider: 'Provider',
    model_label: 'Model',
    api_url: 'API URL',
    api_key: 'API Key',
    testing: 'Checking…',
    save_test: 'Connect Model',
    intro_title: 'Initialization Complete',
    intro_hint: 'System is ready. Here is the first response from the AI core:',
    enter: 'Enter System',
    installing_hint: 'Applying language and rebuilding the frontend. Please wait…',
    install_ready_hint: 'The system is ready. You can enter now.',
    install_failed_hint: 'System preparation failed. Please go back and check again.',
    enter_preparing: 'Preparing…',
    err_mismatch: 'Passwords do not match',
    err_admin: 'Failed to create admin',
    err_save: 'Failed to save model config',
    err_test: 'Model connection test failed',
    default_intro: 'Hi, I am AIOS. Nice to meet you.',
    prompt_intro: 'Generate onboarding intro.',
    prompt_system: 'You are AIOS, an AI-driven personal operating system. This is the first boot after initialization. Give a brief self-introduction (3-5 sentences), naturally like greeting someone for the first time. Tell the user what you can do.',
    prompt_user: 'Hello, introduce yourself.',
  }
};

const step = ref(1);
const pending = ref(false);
const error = ref('');
const welcomeText = ref('');
const displayedText = ref('');
const typing = ref(false);
const installing = ref(false);
const installReady = ref(false);
let typeTimer = null;

const detectedLanguage = String(navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';

const admin = ref({ username: '', password: '', confirm: '' });
const fallbackCatalog = createProviderCatalog();
const providerGroups = ref(fallbackCatalog.groups);
const providers = ref(fallbackCatalog.providers);

const getProvider = (id) => providers.value.find((item) => item.id === id);
const getProvidersByGroup = (groupId) => providers.value.filter((item) => item.group === groupId);

const model = ref({
  provider: 'openai',
  apiUrl: getProvider('openai')?.apiUrl || '',
  model: getProvider('openai')?.defaultModel || '',
  apiKey: '',
  language: detectedLanguage
});

const t = computed(() => texts[model.value.language] || texts.en);
const installMessage = computed(() => {
  if (error.value && !pending.value && !installing.value && !installReady.value && step.value === 4) {
    return error.value || t.value.install_failed_hint;
  }
  if (installing.value) return t.value.installing_hint;
  if (installReady.value) return t.value.install_ready_hint;
  return t.value.installing_hint;
});
const enterButtonLabel = computed(() => (installing.value || !installReady.value ? t.value.enter_preparing : t.value.enter));

const applyProviderDefault = () => {
  const item = getProvider(model.value.provider);
  model.value.apiUrl = item?.apiUrl || '';
  model.value.model = item?.defaultModel || '';
};

const hasBootstrapModel = (settings) => {
  return Boolean(settings?.provider && settings?.apiUrl && settings?.apiKey && settings?.model);
};

const loadSettings = async () => {
  const res = await fetch('/aios/api/settings', {
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok || data?.success === false || data?.error) {
    throw new Error(data?.message || data?.error || t.value.err_save);
  }
  return data?.data || data || {};
};

const showWelcome = (intro) => {
  step.value = 4;
  welcomeText.value = intro || t.value.default_intro;
  startTypewriter(welcomeText.value);
  prepareSystem().catch((e) => {
    error.value = e instanceof Error ? e.message : '安装完成失败';
    installing.value = false;
    installReady.value = false;
  });
};

const generateIntro = async () => {
  const testRes = await fetch('/aios/api/task/create/instant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      app: 'setup',
      title: t.value.prompt_intro,
      prompt: t.value.prompt_intro,
      schema: { required: ['intro'] },
      messages: [
        { role: 'system', content: '只输出 JSON：{"intro":"..."}' },
        { role: 'system', content: t.value.prompt_system },
        { role: 'user', content: t.value.prompt_user }
      ]
    })
  });
  const testData = await testRes.json();
  if (!testRes.ok || testData?.success === false) {
    throw new Error(testData?.message || t.value.err_test);
  }
  const parsed = JSON.parse(String(testData.response || '{}'));
  return parsed?.intro || t.value.default_intro;
};

const enterWelcome = async () => {
  const intro = await generateIntro();
  showWelcome(intro);
};

const createAdmin = async () => {
  error.value = '';
  if (admin.value.password !== admin.value.confirm) {
    error.value = t.value.err_mismatch;
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
    if (!res.ok || data?.success === false) throw new Error(data?.message || t.value.err_admin);
    clearAuthCache();
    const settings = await loadSettings();
    if (hasBootstrapModel(settings)) {
      model.value.provider = settings.provider;
      model.value.apiUrl = settings.apiUrl;
      model.value.apiKey = settings.apiKey;
      model.value.model = settings.model;
      await enterWelcome();
      return;
    }
    step.value = 3;
  } catch (e) {
    error.value = e?.message || t.value.err_admin;
  } finally {
    pending.value = false;
  }
};

const startTypewriter = (text) => {
  if (typeTimer) clearInterval(typeTimer);
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

const prepareSystem = async () => {
  installing.value = true;
  installReady.value = false;
  error.value = '';
  const res = await fetch('/aios/api/system/install/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ language: model.value.language })
  });
  const data = await res.json();
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || '安装完成失败');
  }
  installReady.value = true;
  installing.value = false;
};

const saveModelAndTest = async () => {
  error.value = '';
  pending.value = true;
  installReady.value = false;
  try {
    const saveRes = await fetch('/aios/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        provider: model.value.provider,
        apiUrl: model.value.apiUrl,
        apiKey: model.value.apiKey,
        model: model.value.model
      })
    });
    const saveData = await saveRes.json();
    if (!saveRes.ok || saveData?.success === false || saveData?.error) {
      throw new Error(saveData?.message || saveData?.error || t.value.err_save);
    }
    await enterWelcome();
  } catch (e) {
    error.value = e?.message || t.value.err_test;
  } finally {
    pending.value = false;
  }
};

const enterSystem = async () => {
  if (!installReady.value || installing.value) return;
  clearAuthCache();
  window.location.href = '/aios/';
};

onUnmounted(() => {
  if (typeTimer) clearInterval(typeTimer);
});

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap');

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.wiz-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 32px;
  box-shadow: 0 20px 60px rgba(0,0,0,.1), 0 4px 16px rgba(0,0,0,.06);
  animation: fadeInUp .7s cubic-bezier(.16,1,.3,1) forwards;
}

.wiz-step-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: rgba(0,0,0,.35);
  margin-bottom: 10px;
}

.wiz-heading {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #222;
  margin-bottom: 6px;
  line-height: 1.2;
}

.wiz-sub {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0,0,0,.45);
  line-height: 1.6;
  margin-bottom: 28px;
}

.wiz-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(0,0,0,.4);
  margin-bottom: 7px;
}

.wiz-input {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid rgba(0,0,0,.1);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  outline: none;
  background: rgba(0,0,0,.02);
  color: #222;
  transition: all 0.2s;
}
.wiz-input::placeholder { color: rgba(0,0,0,.25); }
.wiz-input:focus {
  border-color: #222;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0,0,0,.06);
}

.wiz-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 40px;
  cursor: pointer;
}

/* Language buttons */
.wiz-lang-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  border-radius: 14px;
  border: 1.5px solid transparent;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: all .2s cubic-bezier(.16,1,.3,1);
}
.wiz-lang-idle {
  border-color: rgba(0,0,0,.1);
  background: rgba(0,0,0,.02);
  color: rgba(0,0,0,.6);
}
.wiz-lang-idle:hover {
  border-color: rgba(0,0,0,.3);
  color: #222;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
}
.wiz-lang-sel {
  border-color: #222;
  background: #222;
  color: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,.2);
}

/* Footer row */
.wiz-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid rgba(0,0,0,.06);
}

.wiz-btn-back {
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  color: rgba(0,0,0,.35);
  cursor: pointer;
  padding: 0;
  transition: color .2s;
}
.wiz-btn-back:hover { color: #222; }

/* Next / finish pill button — matches landing page .primary-cta */
.wiz-btn-next {
  display: inline-flex;
  align-items: center;
  background: #222;
  color: #fff;
  border: none;
  padding: 10px 10px 10px 22px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all .3s cubic-bezier(.16,1,.3,1);
  box-shadow: 0 4px 16px rgba(0,0,0,.18);
}
.wiz-btn-next:hover:not(:disabled) {
  background: #000;
  transform: scale(1.04);
  box-shadow: 0 8px 28px rgba(0,0,0,.28);
}
.wiz-btn-next:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.wiz-icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: #fff;
  color: #222;
  border-radius: 50%;
  margin-left: 12px;
  transition: transform .3s ease;
  flex-shrink: 0;
}
.wiz-btn-next:hover:not(:disabled) .wiz-icon-circle {
  transform: rotate(45deg);
}
.wiz-btn-finish {
  padding: 12px 12px 12px 26px;
  font-size: 15px;
}
</style>
