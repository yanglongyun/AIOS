<template>
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

    <!-- 顶部标题栏 -->
    <div class="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-gray-100 dark:border-neutral-800">
      <button v-if="!sidebarOpen"
        @click="$emit('open-sidebar')"
        title="展开侧边栏"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="2.5" height="12" rx="1"/>
          <rect x="5.5" y="2" width="2.5" height="12" rx="1"/>
          <path d="M10.5 8l3.5-3.5v7L10.5 8z"/>
        </svg>
      </button>
      <span class="flex-1 min-w-0 text-sm font-medium text-neutral-700 dark:text-neutral-300" :class="!sidebarOpen ? '' : 'pl-1'">设置</span>
    </div>

    <!-- Tab 导航 -->
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
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab 内容 -->
    <div class="flex-1 overflow-y-auto p-5">
      <div class="max-w-2xl mx-auto">
        <ModelTab
          v-if="activeTab === 'model'"
          :provider="provider"
          :api-url="editApiUrl"
          :api-key="editApiKey"
          :model="editModel"
          :model-items="modelItems"
          :loading-models="loadingModels"
          :model-hint="modelHint"
          @save="save"
          @update:provider="provider = $event"
          @update:api-url="editApiUrl = $event"
          @update:api-key="editApiKey = $event"
          @update:model="editModel = $event"
          @fetch-models="fetchModels"
        />
        <ConversationTab
          v-else-if="activeTab === 'conversation'"
          :enable-followup-suggestions="enableFollowupSuggestions"
          @save="save"
          @update:enable-followup-suggestions="enableFollowupSuggestions = $event"
        />
        <ContextTab
          v-else-if="activeTab === 'context'"
          :context-rounds="editRounds"
          @save="save"
          @update:context-rounds="editRounds = $event"
        />
        <GeneralTab
          v-else
          :theme="theme"
          @save="save"
          @set-theme="setTheme"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import ModelTab from '../components/settings/ModelTab.vue';
import ConversationTab from '../components/settings/ConversationTab.vue';
import ContextTab from '../components/settings/ContextTab.vue';
import GeneralTab from '../components/settings/GeneralTab.vue';

const props = defineProps(['sidebarOpen']);
defineEmits(['toggle-sidebar', 'open-sidebar']);

const tabs = [
  { key: 'model', label: '模型' },
  { key: 'conversation', label: '对话' },
  { key: 'context', label: '上下文' },
  { key: 'general', label: '通用' }
];

const activeTab = ref('model');
const theme = ref(localStorage.getItem('theme') || 'dark');
const provider = ref('openrouter');
const editRounds = ref(30);
const editApiUrl = ref('');
const editApiKey = ref('');
const editModel = ref('');
const enableFollowupSuggestions = ref(true);
const modelItems = ref([]);
const loadingModels = ref(false);
const modelHint = ref('可手动输入，也可加载可用模型列表');

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
};

const fetchSettings = async () => {
  const data = await request('/api/settings');
  editRounds.value = data.contextRounds || 30;
  editApiUrl.value = data.apiUrl || '';
  editApiKey.value = data.apiKey || '';
  editModel.value = data.model || '';
  enableFollowupSuggestions.value = data.enableFollowupSuggestions !== false;
  if (editApiUrl.value.includes('openrouter.ai')) provider.value = 'openrouter';
  else if (editApiUrl.value.includes('api.openai.com')) provider.value = 'openai';
  else provider.value = 'custom';
};

const fetchModels = async () => {
  loadingModels.value = true;
  modelHint.value = '正在加载可用模型...';
  try {
    const data = await request('/api/settings/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiUrl: editApiUrl.value, apiKey: editApiKey.value })
    });
    modelItems.value = Array.isArray(data.items) ? data.items : [];
    modelHint.value = modelItems.value.length ? `已加载 ${modelItems.value.length} 个可用模型` : '未获取到模型，请检查 URL/Key';
  } catch (err) {
    modelItems.value = [];
    modelHint.value = `加载失败：${err.message}`;
  } finally {
    loadingModels.value = false;
  }
};

const setTheme = (t) => {
  theme.value = t;
  localStorage.setItem('theme', t);
  document.documentElement.classList.toggle('dark', t === 'dark');
};

const save = async () => {
  await request('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contextRounds: editRounds.value,
      apiUrl: editApiUrl.value,
      apiKey: editApiKey.value,
      model: editModel.value,
      enableFollowupSuggestions: enableFollowupSuggestions.value
    })
  });
};

onMounted(async () => {
  await fetchSettings();
  await fetchModels();
});
</script>
