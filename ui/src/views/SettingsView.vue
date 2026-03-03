<template>
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <div class="px-3 pt-3 shrink-0 border-b border-gray-100 dark:border-neutral-800">
      <div class="flex gap-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="px-3 py-1.5 text-xs shrink-0 cursor-pointer transition-colors rounded-t border-b-2 -mb-px"
          :class="activeTab === tab.key
            ? 'border-neutral-700 dark:border-neutral-300 text-neutral-800 dark:text-neutral-100 font-medium'
            : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'"
        >
          {{ t(tab.label) }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="max-w-2xl mx-auto">
        <ModelTab
          v-if="activeTab === 'model'"
          :provider="provider"
          :api-url="editApiUrl"
          :api-key="editApiKey"
          :model="editModel"
          @save="save"
          @update:provider="onProviderChange"
          @update:api-url="editApiUrl = $event"
          @update:api-key="editApiKey = $event"
          @update:model="editModel = $event"
        />
        <ContextTab
          v-else-if="activeTab === 'messages'"
          :context-rounds="editRounds"
          @save="save"
          @update:context-rounds="editRounds = $event"
        />
        <ToolTab
          v-else-if="activeTab === 'tools'"
          :enable-tool-result-truncate="enableToolResultTruncate"
          :tool-result-max-chars="toolResultMaxChars"
          :enable-tool-loop-limit="enableToolLoopLimit"
          :tool-max-rounds="toolMaxRounds"
          @save="save"
          @update:enable-tool-result-truncate="enableToolResultTruncate = $event"
          @update:tool-result-max-chars="toolResultMaxChars = $event"
          @update:enable-tool-loop-limit="enableToolLoopLimit = $event"
          @update:tool-max-rounds="toolMaxRounds = $event"
        />
        <GeneralTab
          v-else
          :theme="theme"
          :language="language"
          @save="save"
          @set-theme="setTheme"
          @set-language="setLanguage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import ModelTab from '../components/settings/ModelTab.vue';
import ContextTab from '../components/settings/ContextTab.vue';
import ToolTab from '../components/settings/ToolTab.vue';
import GeneralTab from '../components/settings/GeneralTab.vue';
import { getProvider } from '../data/providers.js';
import { toast } from '../stores/toast.js';
import { useI18n } from '../i18n/index.js';

const { t, setLocale } = useI18n();

const tabs = [
  { key: 'model', label: 'settings_tab_model' },
  { key: 'messages', label: 'settings_tab_messages' },
  { key: 'tools', label: 'settings_tab_tools' },
  { key: 'general', label: 'settings_tab_general' }
];

const activeTab = ref('model');
const theme = ref(localStorage.getItem('theme') || 'dark');
const language = ref('zh');
const provider = ref('openai');
const editRounds = ref(30);
const enableToolResultTruncate = ref(true);
const toolResultMaxChars = ref(12000);
const enableToolLoopLimit = ref(true);
const toolMaxRounds = ref(50);
const editApiUrl = ref('');
const editApiKey = ref('');
const editModel = ref('');
const providerConfigs = ref({});

const PROVIDER_CONFIGS_KEY = 'aios.providerConfigs.v1';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
};

const loadProviderConfigs = () => {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIGS_KEY);
    providerConfigs.value = raw ? JSON.parse(raw) : {};
  } catch {
    providerConfigs.value = {};
  }
};

const saveProviderConfigs = () => {
  localStorage.setItem(PROVIDER_CONFIGS_KEY, JSON.stringify(providerConfigs.value));
};

const applyProviderConfig = (providerId) => {
  const saved = providerConfigs.value[providerId];
  if (saved) {
    editApiUrl.value = saved.apiUrl || '';
    editApiKey.value = saved.apiKey || '';
    editModel.value = saved.model || '';
    return;
  }

  const preset = getProvider(providerId);
  if (providerId === 'custom') {
    editApiUrl.value = '';
    editApiKey.value = '';
    editModel.value = '';
    return;
  }
  editApiUrl.value = preset?.apiUrl || '';
  editApiKey.value = '';
  editModel.value = preset?.defaultModel || '';
};

const onProviderChange = (nextProvider) => {
  provider.value = nextProvider;
  applyProviderConfig(nextProvider);
};

const fetchSettings = async () => {
  const data = await request('/api/settings');
  provider.value = data.provider || 'openai';
  language.value = data.language === 'en' ? 'en' : 'zh';
  setLocale(language.value);
  editRounds.value = data.contextRounds || 30;
  enableToolResultTruncate.value = data.enableToolResultTruncate !== false;
  toolResultMaxChars.value = Number(data.toolResultMaxChars) || 12000;
  enableToolLoopLimit.value = data.enableToolLoopLimit !== false;
  toolMaxRounds.value = Number(data.toolMaxRounds) || 50;
  editApiUrl.value = data.apiUrl || '';
  editApiKey.value = data.apiKey || '';
  editModel.value = data.model || '';
  providerConfigs.value[provider.value] = {
    apiUrl: editApiUrl.value,
    apiKey: editApiKey.value,
    model: editModel.value
  };
  saveProviderConfigs();
};

const setTheme = (nextTheme) => {
  theme.value = nextTheme;
  localStorage.setItem('theme', nextTheme);
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
};

const setLanguage = (lang) => {
  language.value = lang === 'en' ? 'en' : 'zh';
  setLocale(language.value);
};

const save = async () => {
  try {
    const maxChars = Math.max(1000, Math.min(50000, Number(toolResultMaxChars.value) || 12000));
    const maxRounds = Math.max(1, Math.min(500, Number(toolMaxRounds.value) || 50));
    toolResultMaxChars.value = maxChars;
    toolMaxRounds.value = maxRounds;

    await request('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider.value,
        contextRounds: editRounds.value,
        enableToolResultTruncate: enableToolResultTruncate.value,
        toolResultMaxChars: maxChars,
        enableToolLoopLimit: enableToolLoopLimit.value,
        toolMaxRounds: maxRounds,
        language: language.value,
        apiUrl: editApiUrl.value,
        apiKey: editApiKey.value,
        model: editModel.value
      })
    });

    providerConfigs.value[provider.value] = {
      apiUrl: editApiUrl.value,
      apiKey: editApiKey.value,
      model: editModel.value
    };
    saveProviderConfigs();
    toast.show(t('settings_saved'));
  } catch (e) {
    toast.show(t('settings_save_failed', { message: e.message }), { type: 'error' });
  }
};

onMounted(async () => {
  loadProviderConfigs();
  await fetchSettings();
});
</script>
