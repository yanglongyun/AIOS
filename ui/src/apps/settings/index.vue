<template>
  <div class="flex h-full min-h-0 flex-col overflow-y-auto px-3 py-3 [scrollbar-width:none]" :style="bgStyle">
    <section class="rounded-[14px] px-3.5 py-3" :style="panelStyle">
      <div class="mb-3 grid grid-cols-4 gap-1.5 rounded-[12px] bg-[rgba(120,90,40,0.08)] p-1 shadow-[inset_0_1px_3px_rgba(90,60,20,0.12)]">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="h-9 rounded-[10px] text-[12px] font-bold active:translate-y-[1px]"
          :class="activeTab === tab.id ? 'text-[#3a2415]' : 'text-[#8a7356]'"
          :style="activeTab === tab.id ? activeTabStyle : null"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'model'">
        <div class="mb-3">
          <div class="text-[15px] font-bold text-[#3a2415]">模型设置</div>
          <div class="mt-0.5 text-[11px] text-[#9a8060]">配置对话使用的大模型。</div>
        </div>

        <label class="field">
          <span>供应商</span>
          <select v-model="form.provider" class="text-input" @change="applyProviderDefaults">
            <optgroup v-for="group in groupedProviders" :key="group.id" :label="group.name">
              <option v-for="provider in group.providers" :key="provider.id" :value="provider.id">
                {{ provider.name }}
              </option>
            </optgroup>
          </select>
        </label>

        <label class="field">
          <span>模型</span>
          <input
            v-if="!activeProvider?.models?.length"
            v-model="form.model"
            class="text-input"
            placeholder="输入模型名称"
          />
          <select v-else v-model="form.model" class="text-input">
            <option v-for="model in activeProvider.models" :key="model" :value="model">{{ model }}</option>
          </select>
        </label>

        <label class="field">
          <span>请求地址</span>
          <input v-model="form.apiUrl" class="text-input font-mono text-[12px]" placeholder="https://..." />
        </label>

        <label class="field">
          <span>API Key</span>
          <input v-model="form.apiKey" class="text-input font-mono text-[12px]" type="password" autocomplete="off" placeholder="sk-..." />
        </label>

        <label class="field">
          <span>上下文轮数</span>
          <input v-model.number="form.contextTurns" class="text-input font-mono text-[12px]" type="number" min="0" step="1" />
        </label>

        <button
          class="mt-3 w-full rounded-[11px] py-2.5 text-[13px] font-bold active:translate-y-[1px] disabled:opacity-60"
          :style="buttonStyle"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>

        <div v-if="message" class="mt-2 text-center text-[11px]" :class="error ? 'text-[#a83a2a]' : 'text-[#4a7a3a]'">
          {{ message }}
        </div>
      </div>

      <div v-else-if="activeTab === 'prompt'">
        <div class="mb-3">
          <div class="text-[15px] font-bold text-[#3a2415]">提示词</div>
          <div class="mt-0.5 text-[11px] text-[#9a8060]">当前发给模型的完整系统提示词。</div>
        </div>
        <pre class="prompt-box">{{ promptPreview || '加载中...' }}</pre>
      </div>

      <div v-else-if="activeTab === 'skills'">
        <div class="mb-3">
          <div class="text-[15px] font-bold text-[#3a2415]">技能</div>
          <div class="mt-0.5 text-[11px] text-[#9a8060]">系统当前可用的能力说明。</div>
        </div>
        <div v-if="skills.length" class="space-y-2">
          <div v-for="skill in skills" :key="skill.name" class="rounded-[12px] border border-[rgba(180,150,80,0.18)] bg-[rgba(255,252,244,0.58)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <div class="text-[13px] font-bold text-[#3a2415]">{{ skill.name }}</div>
            <div class="mt-1 text-[11px] leading-[1.5] text-[#8a7356]">{{ skill.description }}</div>
          </div>
        </div>
        <div v-else class="rounded-[12px] px-3 py-8 text-center text-[12px] text-[#8a7356]">暂无技能</div>
      </div>

      <div v-else>
        <div class="mb-3">
          <div class="text-[15px] font-bold text-[#3a2415]">关于</div>
          <div class="mt-0.5 text-[11px] text-[#9a8060]">AIOS</div>
        </div>
        <div class="rounded-[12px] border border-[rgba(180,150,80,0.18)] bg-[rgba(255,252,244,0.58)] px-3 py-3 text-[12px] leading-[1.7] text-[#5f482d]">
          <div>本机运行的个人 AI 操作系统。</div>
          <div class="mt-1 font-mono text-[11px] text-[#8a7356]">system 9502 · apps 9503</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';

const groups = ref([]);
const providers = ref([]);
const saving = ref(false);
const message = ref('');
const error = ref(false);
const activeTab = ref('model');
const promptPreview = ref('');
const skills = ref([]);
const tabs = [
  { id: 'model', label: '模型' },
  { id: 'prompt', label: '提示词' },
  { id: 'skills', label: '技能' },
  { id: 'about', label: '关于' },
];
const form = reactive({
  provider: '',
  model: '',
  apiUrl: '',
  apiKey: '',
  contextTurns: 100,
});

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const activeProvider = computed(() => providers.value.find((item) => item.id === form.provider) || null);
const groupedProviders = computed(() => {
  const knownGroups = groups.value.length ? groups.value : [{ id: 'default', name: '默认' }];
  const buckets = new Map(knownGroups.map((group) => [group.id, { ...group, providers: [] }]));
  const other = { id: 'other', name: '其他', providers: [] };
  for (const provider of providers.value) {
    const group = buckets.get(provider.group);
    if (group) group.providers.push(provider);
    else other.providers.push(provider);
  }
  const list = [...buckets.values()].filter((group) => group.providers.length);
  if (other.providers.length) list.push(other);
  return list;
});

const applyProviderDefaults = () => {
  const provider = activeProvider.value;
  if (!provider) return;
  form.apiUrl = provider.apiUrl || '';
  form.model = provider.defaultModel || '';
};

const load = async () => {
  const [settingsData, modelsData] = await Promise.all([
    request('/api/settings'),
    request('/api/settings/models'),
  ]);
  groups.value = modelsData.groups || [];
  providers.value = modelsData.providers || [];
  const settings = settingsData.settings || {};
  form.provider = settings.provider || providers.value[0]?.id || '';
  form.model = settings.model || activeProvider.value?.defaultModel || '';
  form.apiUrl = settings.apiUrl || activeProvider.value?.apiUrl || '';
  form.apiKey = settings.apiKey || '';
  form.contextTurns = Number.isFinite(Number(settings.contextTurns)) ? Number(settings.contextTurns) : 100;
  promptPreview.value = settingsData.promptPreview || '';
  skills.value = settingsData.skills || [];
};

const save = async () => {
  saving.value = true;
  message.value = '';
  error.value = false;
  try {
    await request('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: form.provider,
        model: form.model,
        apiUrl: form.apiUrl,
        apiKey: form.apiKey,
        contextTurns: form.contextTurns,
      }),
    });
    message.value = '已保存';
    await load();
  } catch (err) {
    error.value = true;
    message.value = err.message || '保存失败';
  } finally {
    saving.value = false;
  }
};

onMounted(load);

const bgStyle = {
  background: 'linear-gradient(180deg,#f0e8d5 0%,#e8dfca 100%)',
};
const panelStyle = {
  background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)',
  boxShadow: '0 2px 8px rgba(90,60,20,0.1),inset 0 1px 0 rgba(255,255,255,0.8)',
  border: '1px solid rgba(180,150,80,0.18)',
};
const buttonStyle = {
  background: 'linear-gradient(180deg,#d4981e 0%,#a07010 100%)',
  boxShadow: '0 3px 0 #6a4800,0 4px 10px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,215,80,0.35)',
  color: 'rgba(255,245,190,0.95)',
};
const activeTabStyle = {
  background: 'linear-gradient(160deg,#faf5e8 0%,#e7d8b8 100%)',
  boxShadow: '0 2px 6px rgba(90,60,20,0.16),inset 0 1px 0 rgba(255,255,255,0.85)',
};
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.field span {
  font-size: 11px;
  font-weight: 700;
  color: #7a6040;
}
.prompt-box {
  min-height: 360px;
  max-height: calc(100dvh - 180px);
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 12px;
  border: 1px solid rgba(180,150,80,0.18);
  background: rgba(255,252,244,0.62);
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.55;
  color: #4a321c;
  box-shadow: inset 0 1px 4px rgba(90,60,20,0.08);
}
</style>
