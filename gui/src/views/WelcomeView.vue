<template>
  <div class="relative min-h-screen overflow-hidden bg-[#f7f3ee] [font-family:'Barlow',system-ui,sans-serif] text-[#222]">
    <div
      class="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_0%,rgba(255,220,160,.55)_0%,transparent_55%),radial-gradient(ellipse_60%_55%_at_90%_95%,rgba(200,210,255,.50)_0%,transparent_55%),radial-gradient(ellipse_50%_45%_at_75%_10%,rgba(220,200,255,.35)_0%,transparent_50%)]"
    ></div>

    <div class="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
      <div v-if="step === 1" class="flex w-full items-center justify-center">
        <div class="w-full max-w-[540px] overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.06)]">
          <div class="border-b border-black/[0.06] px-6 py-8 sm:px-10 sm:py-9">
            <div class="mb-[10px] text-[11px] font-bold uppercase tracking-[0.18em] text-black/30">AIOS</div>
            <h1 class="mb-1.5 text-[28px] font-bold leading-[1.2] tracking-[-0.5px] text-[#222]">{{ t.connect_title }}</h1>
            <p class="max-w-[540px] text-[14px] font-medium leading-[1.65] text-black/45">{{ t.connect_subline }}</p>
          </div>

          <div class="flex min-h-[360px] flex-col">
            <div class="flex min-w-0 flex-col px-6 py-7 sm:px-9 sm:pb-8">
              <div class="flex min-w-0 flex-1 flex-col gap-2.5">
                <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div class="flex flex-col gap-[5px]">
                    <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-black/35">{{ t.provider }}</label>
                    <div class="relative">
                      <select
                        v-model="model.provider"
                        class="w-full appearance-none rounded-[10px] border-[1.5px] border-black/[0.09] bg-black/[0.02] px-3 py-[10px] pr-8 text-[13.5px] font-medium text-[#222] outline-none transition-all focus:border-[#222] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                        @change="applyProviderDefault"
                      >
                        <optgroup v-for="group in providerGroups" :key="group.id" :label="group.name">
                          <option v-for="p in getProvidersByGroup(group.id)" :key="p.id" :value="p.id">
                            {{ p.name }}
                          </option>
                        </optgroup>
                      </select>
                      <svg class="pointer-events-none absolute right-[11px] top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  <div class="flex flex-col gap-[5px]">
                    <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-black/35">{{ t.model_label }}</label>
                    <input
                      v-model.trim="model.model"
                      :placeholder="t.model_placeholder"
                      class="w-full rounded-[10px] border-[1.5px] border-black/[0.09] bg-black/[0.02] px-3 py-[10px] text-[13.5px] font-medium text-[#222] outline-none transition-all placeholder:text-black/25 focus:border-[#222] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-[5px]">
                  <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-black/35">{{ t.api_url }}</label>
                  <input
                    v-model.trim="model.apiUrl"
                    placeholder="https://..."
                    class="w-full rounded-[10px] border-[1.5px] border-black/[0.09] bg-black/[0.02] px-3 py-[10px] text-[13.5px] font-medium text-[#222] outline-none transition-all placeholder:text-black/25 focus:border-[#222] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                  />
                </div>

                <div class="flex flex-col gap-[5px]">
                  <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-black/35">{{ t.api_key }}</label>
                  <input
                    v-model.trim="model.apiKey"
                    type="password"
                    placeholder="sk-..."
                    class="w-full rounded-[10px] border-[1.5px] border-black/[0.09] bg-black/[0.02] px-3 py-[10px] text-[13.5px] font-medium text-[#222] outline-none transition-all placeholder:text-black/25 focus:border-[#222] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
                  />
                </div>

                <div
                  class="max-h-[120px] overflow-y-auto break-all rounded-[10px] border border-[rgba(220,60,60,.2)] bg-[rgba(220,60,60,.05)] px-3 py-[9px] text-[12.5px] font-medium leading-[1.5] text-[#c0392b] [overflow-wrap:anywhere]"
                  :class="error ? 'block' : 'hidden'"
                >
                  {{ error }}
                </div>
              </div>

              <div class="mt-auto flex flex-col gap-2.5 pt-[18px]">
                <button
                  class="inline-flex w-full items-center justify-between rounded-full bg-[#222] px-5 py-[11px] pl-[22px] text-[13.5px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-px hover:bg-[#111] hover:shadow-[0_8px_24px_rgba(0,0,0,0.24)] disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none"
                  :disabled="pending"
                  @click="saveModelAndTest"
                >
                  <span>{{ pending ? t.testing : t.save_test }}</span>
                  <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#222]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </span>
                </button>
                <button
                  type="button"
                  class="self-center text-[12.5px] font-medium text-black/45 underline-offset-[3px] transition-colors hover:text-black/70 hover:underline disabled:cursor-not-allowed disabled:opacity-45"
                  :disabled="pending"
                  @click="skipToDesktop"
                >
                  {{ t.skip }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex w-full items-center justify-center">
        <div class="w-full max-w-[540px] overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.06)]">
          <div class="flex flex-col items-start px-8 py-12 sm:px-12 sm:pb-11">
            <div class="mb-8 min-h-[100px] w-full text-[18px] font-medium leading-[1.7] text-[#333]">
              <span class="whitespace-pre-wrap break-words">{{ displayedText }}</span><span v-if="typing" class="cursor"></span>
            </div>

            <div class="flex w-full flex-col items-center gap-2.5 border-t border-black/[0.06] pt-6">
              <button
                class="inline-flex w-full max-w-[240px] items-center justify-between self-center rounded-full bg-[#222] px-5 py-[11px] pl-[22px] text-[13.5px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-px hover:bg-[#111] hover:shadow-[0_8px_24px_rgba(0,0,0,0.24)] disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none"
                :disabled="entering"
                @click="enterSystem"
              >
                <span>{{ t.enter }}</span>
                <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#222]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { createProviderCatalog } from '../data/providers.js';

const texts = {
  zh: {
    connect_title: '欢迎使用 AIOS',
    connect_subline: 'AI 驱动的个人操作系统。我可以根据你的需求构建应用、执行任务，打造你的专属数字世界。',
    provider: '供应商',
    model_label: '模型',
    model_placeholder: 'gpt-5.4',
    api_url: 'API URL',
    api_key: 'API Key',
    testing: '连接中…',
    save_test: '连接大模型',
    skip: '跳过，先进桌面',
    enter: '进入系统',
    err_key_required: '请填写 API Key',
    err_url_required: '请填写 API URL',
    err_model_required: '请填写模型名称',
    err_save: '模型配置保存失败',
    err_test: '模型连通测试失败',
    default_intro: '你好，我是 AIOS。\n\n很高兴认识你。我是一个 AI 驱动的个人操作系统，可以根据你的需求构建应用、执行任务、管理信息——一切都在本地运行，属于你。\n\n我们开始吧。',
    prompt_intro: '生成初始化欢迎介绍。',
    prompt_system: '你是 AIOS，一个 AI 驱动的个人操作系统。现在是初始化完成后的第一次启动，请做一段简短的自我介绍（3-5句），像第一次见面打招呼一样自然。告诉用户你能做什么、你的特点。',
    prompt_user: '请按上述要求做一段简短的自我介绍，只输出 JSON：{"intro":"..."}。',
  }
};

const step = ref(1);
const pending = ref(false);
const error = ref('');
const welcomeText = ref('');
const displayedText = ref('');
const typing = ref(false);
let typeTimer = null;

const fallbackCatalog = createProviderCatalog();
const providerGroups = ref(fallbackCatalog.groups);
const providers = ref(fallbackCatalog.providers);

const getProvider = (id) => providers.value.find((item) => item.id === id);
const getProvidersByGroup = (groupId) => providers.value.filter((item) => item.group === groupId);

const model = ref({
  provider: 'openai',
  apiUrl: getProvider('openai')?.apiUrl || '',
  model: getProvider('openai')?.defaultModel || '',
  apiKey: ''
});

const t = computed(() => texts.zh);

const applyProviderDefault = () => {
  const item = getProvider(model.value.provider);
  model.value.apiUrl = item?.apiUrl || '';
  model.value.model = item?.defaultModel || '';
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
  }, 38);
};

const showWelcome = (intro) => {
  step.value = 2;
  welcomeText.value = intro || t.value.default_intro;
  startTypewriter(welcomeText.value);
};

const generateIntro = async () => {
  const testRes = await fetch('/api/task/create/instant', {
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

const saveModelAndTest = async () => {
  error.value = '';

  if (!model.value.apiKey.trim()) {
    error.value = t.value.err_key_required;
    return;
  }
  if (!model.value.apiUrl.trim()) {
    error.value = t.value.err_url_required;
    return;
  }
  if (!model.value.model.trim()) {
    error.value = t.value.err_model_required;
    return;
  }

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

const entering = ref(false);

const enterSystem = () => {
  if (entering.value) return;
  entering.value = true;
  window.location.href = '/';
};

const skipToDesktop = async () => {
  if (pending.value) return;
  try {
    await fetch('/api/system/setup/skip', { method: 'POST', credentials: 'include' });
  } catch {}
  window.location.href = '/';
};

onUnmounted(() => {
  if (typeTimer) clearInterval(typeTimer);
});
</script>

<style scoped>
.cursor {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background: #222;
  vertical-align: text-bottom;
  margin-left: 2px;
  animation: blink 0.9s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
