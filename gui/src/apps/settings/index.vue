<template>
  <div class="flex h-full flex-col bg-bg">
    <header class="flex-none border-b border-line pt-7 max-md:pt-5">
      <div class="mx-auto flex max-w-[720px] flex-col gap-4.5 px-8 max-md:px-4">
        <div class="flex items-center justify-between gap-3">
          <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">__T_SETTINGS_TITLE__</h1>
          <AppLauncher />
        </div>
        <nav class="tabs flex items-stretch gap-1 -mx-8 overflow-x-auto px-8 max-md:-mx-4 max-md:px-4" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            :aria-selected="activeTab === tab.key"
            class="tab relative inline-flex cursor-pointer items-center gap-2 whitespace-nowrap border-0 bg-transparent px-3.5 pb-3.5 pt-3 text-[14px] font-medium transition-colors max-md:px-3 max-md:pb-3 max-md:pt-2.5 max-md:text-[13.5px]"
            :class="activeTab === tab.key ? 'text-accent is-active' : 'text-muted hover:text-ink'"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto max-w-[720px] px-8 pb-15 pt-7 max-md:px-4 max-md:pb-10 max-md:pt-5">
        <TabContent v-bind="tabContentProps" />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppLauncher from '@/components/AppLauncher.vue';
import { computed, defineComponent, h, onMounted, ref, watchEffect } from 'vue';
import { useQuickChatStore } from '@/stores/quickChat';

const qc = useQuickChatStore();
import AccountTab from './AccountTab.vue';
import ModelTab from './ModelTab.vue';
import ContextTab from './ContextTab.vue';
import ContextsTab from './ContextsTab.vue';
import ToolTab from './ToolTab.vue';
import AboutTab from './AboutTab.vue';
import PromptTab from './PromptTab.vue';

const tabs = [
  { key: 'account', label: '__T_SETTINGS_TAB_ACCOUNT__', icon: '👤' },
  { key: 'model', label: '__T_SETTINGS_TAB_MODEL__', icon: '🤖' },
  { key: 'prompt', label: '__T_SETTINGS_TAB_PROMPT__', icon: '📜' },
  { key: 'messages', label: '__T_SETTINGS_TAB_MESSAGES__', icon: '💬' },
  { key: 'contexts', label: '__T_SETTINGS_TAB_CONTEXTS__', icon: '📚' },
  { key: 'tools', label: '__T_SETTINGS_TAB_TOOLS__', icon: '🔧' },
  { key: 'about', label: '__T_SETTINGS_TAB_ABOUT__', icon: 'ℹ️' }
];

const activeTab = ref('account');
const currentTabLabel = computed(() => tabs.find(t => t.key === activeTab.value)?.label || '');
const saveNotice = ref({ type: '', message: '' });

// 统一传给 TabContent 的 props
const tabContentProps = computed(() => ({
  activeTab: activeTab.value,
  provider: provider.value,
  providerGroups: providerGroups.value,
  providers: providers.value,
  apiUrl: editApiUrl.value,
  apiKey: editApiKey.value,
  model: editModel.value,
  enableToolResultTruncate: enableToolResultTruncate.value,
  toolResultMaxChars: toolResultMaxChars.value,
  enableToolLoopLimit: enableToolLoopLimit.value,
  toolMaxRounds: toolMaxRounds.value,
  contextRounds: editRounds.value,
  saveNotice: saveNotice.value,
  onSave: save,
  'onUpdate:provider': onProviderChange,
  'onUpdate:apiUrl': v => { editApiUrl.value = v; },
  'onUpdate:apiKey': v => { editApiKey.value = v; },
  'onUpdate:model': v => { editModel.value = v; },
  'onUpdate:enableToolResultTruncate': v => { enableToolResultTruncate.value = v; },
  'onUpdate:toolResultMaxChars': v => { toolResultMaxChars.value = v; },
  'onUpdate:enableToolLoopLimit': v => { enableToolLoopLimit.value = v; },
  'onUpdate:toolMaxRounds': v => { toolMaxRounds.value = v; },
  'onUpdate:contextRounds': v => { editRounds.value = v; },
}));

// TabContent 动态分发到各子 Tab
const TabContent = defineComponent({
  props: { activeTab: String },
  setup(props, { attrs }) {
    return () => {
      const map = {
        account: AccountTab,
        model: ModelTab,
        tools: ToolTab,
        messages: ContextTab,
        contexts: ContextsTab,
        prompt: PromptTab,
      };
      const C = map[props.activeTab] || AboutTab;
      return h(C, attrs);
    };
  }
});

const DEFAULT_PROVIDER = 'deepseek';
const provider = ref(DEFAULT_PROVIDER);
const editRounds = ref(100);
const enableToolResultTruncate = ref(true);
const toolResultMaxChars = ref(12000);
const enableToolLoopLimit = ref(true);
const toolMaxRounds = ref(50);
const editApiUrl = ref('');
const editApiKey = ref('');
const editModel = ref('');
const providerConfigs = ref({});
const providerGroups = ref([]);
const providers = ref([]);

const getProvider = (id) => providers.value.find((item) => item.id === id);

const PROVIDER_CONFIGS_KEY = 'aios.providerConfigs.v1';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `${res.status} ${res.statusText}`);
  return data;
};

const fetchProviders = async () => {
  const data = await request('/api/llm/providers');
  providerGroups.value = Array.isArray(data.groups) ? data.groups : [];
  providers.value = Array.isArray(data.providers) ? data.providers : [];
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
  provider.value = getProvider(data.provider) ? data.provider : DEFAULT_PROVIDER;
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

const save = async () => {
  try {
    saveNotice.value = { type: '', message: '' };
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
    saveNotice.value = { type: 'success', message: '__T_SETTINGS_SAVE_SUCCESS__' };
  } catch (e) {
    saveNotice.value = {
      type: 'error',
      message: '__T_SETTINGS_SAVE_FAILED__'.replace('{message}', e.message)
    };
  }
};

onMounted(async () => {
  loadProviderConfigs();
  await fetchProviders();
  await fetchSettings();
});

watchEffect(() => {
  qc.setContext({
    scope: `settings:${activeTab.value}`,
    label: '__T_QC_LABEL_SETTINGS__'.replace('{tab}', currentTabLabel.value),
    snapshot: '__T_QC_FIELD_ACTIVE_TAB__'.replace('{tab}', currentTabLabel.value),
  });
});
</script>

<style scoped>
/* 隐藏 tabs 的横滚条 + active tab 底部 2px 蓝条:这两个用 Tailwind 写都太长 */
.tabs { scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }

.tab::after {
    content: "";
    position: absolute;
    left: 8px; right: 8px; bottom: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: transparent;
    transition: background .18s ease;
}
.tab.is-active::after { background: var(--color-accent); }
</style>
