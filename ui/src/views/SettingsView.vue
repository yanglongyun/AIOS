<template>
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f5f0e8] dark:bg-[#1a1410]">
    <div class="px-4 pt-4 shrink-0">
      <div class="max-w-lg mx-auto flex items-center gap-1.5">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="px-3.5 py-1.5 text-xs shrink-0 cursor-pointer transition-all rounded-full font-medium"
          :class="activeTab === tab.key
            ? 'bg-[rgba(90,58,40,0.1)] text-[#5a3e28] dark:bg-[rgba(200,160,96,0.12)] dark:text-[#c8a060]'
            : 'text-[#b8a888] hover:text-[#7a6a50] hover:bg-[rgba(90,58,40,0.06)] dark:text-[#6a5840] dark:hover:text-[#a08c70] dark:hover:bg-[rgba(200,160,96,0.06)]'"
        >
          {{ t(tab.label) }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-5">
      <div class="max-w-lg mx-auto">
        <AccountTab
          v-if="activeTab === 'account'"
          :username="accountUsername"
          :old-password="oldPassword"
          :new-password="newPassword"
          :confirm-password="confirmPassword"
          @update:old-password="oldPassword = $event"
          @update:new-password="newPassword = $event"
          @update:confirm-password="confirmPassword = $event"
          @change-password="changePassword"
          @logout="logout"
        />
        <ModelTab
          v-else-if="activeTab === 'model'"
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
import { useRouter } from 'vue-router';
import AccountTab from '../components/settings/AccountTab.vue';
import ModelTab from '../components/settings/ModelTab.vue';
import ContextTab from '../components/settings/ContextTab.vue';
import ToolTab from '../components/settings/ToolTab.vue';
import GeneralTab from '../components/settings/GeneralTab.vue';
import { getProvider } from '../data/providers.js';
import { toast } from '../stores/toast.js';
import { useI18n } from '../i18n/index.js';

const { t, setLocale } = useI18n();
const router = useRouter();

const tabs = [
  { key: 'account', label: 'settings_tab_account' },
  { key: 'model', label: 'settings_tab_model' },
  { key: 'messages', label: 'settings_tab_messages' },
  { key: 'tools', label: 'settings_tab_tools' },
  { key: 'general', label: 'settings_tab_general' }
];

const activeTab = ref('account');
const theme = ref(localStorage.getItem('theme') || 'dark');
const language = ref('zh');
const provider = ref('openai');
const editRounds = ref(100);
const enableToolResultTruncate = ref(true);
const toolResultMaxChars = ref(12000);
const enableToolLoopLimit = ref(true);
const toolMaxRounds = ref(50);
const editApiUrl = ref('');
const editApiKey = ref('');
const editModel = ref('');
const accountUsername = ref('');
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const providerConfigs = ref({});

const PROVIDER_CONFIGS_KEY = 'aios.providerConfigs.v1';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `${res.status} ${res.statusText}`);
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
  editRounds.value = data.contextRounds || 100;
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

const fetchMe = async () => {
  const data = await request('/api/auth/me');
  accountUsername.value = data?.user?.username || '';
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

const changePassword = async () => {
  try {
    if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
      throw new Error(t('settings_password_required'));
    }
    if (newPassword.value !== confirmPassword.value) {
      throw new Error(t('settings_password_mismatch'));
    }

    await request('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: oldPassword.value,
        newPassword: newPassword.value
      })
    });

    oldPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    toast.show(t('settings_password_changed_relogin'));
    await logout();
  } catch (e) {
    toast.show(t('settings_save_failed', { message: e.message }), { type: 'error' });
  }
};

const logout = async () => {
  try {
    await request('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {}
  await router.push('/login');
};

onMounted(async () => {
  loadProviderConfigs();
  await fetchMe();
  await fetchSettings();
});
</script>
