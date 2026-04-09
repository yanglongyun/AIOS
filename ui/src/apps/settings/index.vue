<template>
  <div class="flex h-full min-w-0 overflow-hidden" style="background:#f5f3ef">

    <!-- ── Desktop：左侧导航 + 右侧内容 ── -->
    <template v-if="!isMobile">
      <div class="flex w-[160px] shrink-0 flex-col border-r py-4" style="background:#ede9e2;border-color:rgba(0,0,0,0.07)">
        <div class="mb-3 px-4 text-[11px] font-semibold uppercase tracking-widest" style="color:rgba(0,0,0,0.3)">__T_SETTINGS_TAB_ACCOUNT__</div>
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="mx-2 mb-0.5 flex items-center gap-2 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium transition-all"
          :class="activeTab === tab.key ? 'shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'hover:bg-black/[0.05]'"
          :style="activeTab === tab.key ? 'background:#fff;color:#3d2f1e' : 'color:rgba(0,0,0,0.5)'"
          @click="activeTab = tab.key"
        >
          <span class="text-[14px]">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
        <div class="mx-auto max-w-[520px]">
          <h2 class="mb-4 text-[16px] font-bold" style="color:#2a1f13">{{ currentTabLabel }}</h2>
          <TabContent v-bind="tabContentProps" />
        </div>
      </div>
    </template>

    <!-- ── Mobile：列表 → 详情 ── -->
    <template v-else>
      <!-- 列表页 -->
      <div v-if="!activeTab" class="w-full overflow-y-auto px-4 pt-4 pb-8">
        <div class="overflow-hidden rounded-2xl" style="background:rgba(255,255,255,0.72);border:1px solid rgba(0,0,0,0.06)">
          <button
            v-for="(tab, idx) in tabs"
            :key="tab.key"
            class="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-all active:bg-black/[0.05]"
            :class="idx < tabs.length - 1 ? 'border-b border-black/[0.06]' : ''"
            @click="openMobileTab(tab)"
          >
            <span class="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] text-[16px]" style="background:rgba(0,0,0,0.06)">{{ tab.icon }}</span>
            <span class="flex-1 text-[15px] font-medium" style="color:#1a1a1a">{{ tab.label }}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:rgba(0,0,0,0.25)"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      <!-- 详情页 -->
      <div v-else class="w-full overflow-y-auto px-4 py-4 pb-8">
        <TabContent v-bind="tabContentProps" />
      </div>
    </template>

  </div>
</template>

<script setup>
import { computed, defineComponent, h, inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AccountTab from './AccountTab.vue';
import ModelTab from './ModelTab.vue';
import ContextTab from './ContextTab.vue';
import ToolTab from './ToolTab.vue';
import AboutTab from './AboutTab.vue';
import SkillTab from './SkillTab.vue';
import { createProviderCatalog } from '../../data/providers.js';
import { toast } from '../../stores/toast.js';
const router = useRouter();
const setMobileNav = inject('mobileNav', null);
const isMobile = computed(() => !!setMobileNav);

const tabs = [
  { key: 'account', label: '__T_SETTINGS_TAB_ACCOUNT__', icon: '👤' },
  { key: 'model', label: '__T_SETTINGS_TAB_MODEL__', icon: '🤖' },
  { key: 'tools', label: '__T_SETTINGS_TAB_TOOLS__', icon: '🔧' },
  { key: 'messages', label: '__T_SETTINGS_TAB_MESSAGES__', icon: '💬' },
  { key: 'skills', label: '__T_SETTINGS_TAB_SKILLS__', icon: '⚡' },
  { key: 'about', label: '__T_SETTINGS_TAB_ABOUT__', icon: 'ℹ️' }
];

const activeTab = ref('account');
const currentTabLabel = computed(() => tabs.find(t => t.key === activeTab.value)?.label || '');

function openMobileTab(tab) {
  activeTab.value = tab.key;
  setMobileNav?.(tab.label, () => {
    activeTab.value = null;
    setMobileNav?.(null, null);
  });
}

// 统一传给 TabContent 的 props
const tabContentProps = computed(() => ({
  activeTab: activeTab.value,
  username: accountUsername.value,
  oldPassword: oldPassword.value,
  newPassword: newPassword.value,
  confirmPassword: confirmPassword.value,
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
  skillItems: skillItems.value,
  skillsLoading: skillsLoading.value,
  skillsError: skillsError.value,
  onSave: save,
  onChangePassword: changePassword,
  onLogout: logout,
  'onUpdate:oldPassword': v => { oldPassword.value = v; },
  'onUpdate:newPassword': v => { newPassword.value = v; },
  'onUpdate:confirmPassword': v => { confirmPassword.value = v; },
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
        skills: SkillTab,
      };
      const C = map[props.activeTab] || AboutTab;
      return h(C, attrs);
    };
  }
});

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
const providerGroups = ref(createProviderCatalog().groups);
const providers = ref(createProviderCatalog().providers);
const skillItems = ref([]);
const skillsLoading = ref(false);
const skillsError = ref('');

const getProvider = (id) => providers.value.find((item) => item.id === id);

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

const fetchSkills = async () => {
  skillsLoading.value = true;
  skillsError.value = '';
  try {
    const data = await request('/api/settings/skills');
    skillItems.value = Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    skillsError.value = '__T_SETTINGS_SKILLS_LOAD_FAILED__'.replace('{message}', e.message);
  } finally {
    skillsLoading.value = false;
  }
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
    toast.show('__T_SETTINGS_SAVED__');
  } catch (e) {
    toast.show('__T_SETTINGS_SAVE_FAILED__'.replace('{message}', e.message), { type: 'error' });
  }
};

const changePassword = async () => {
  try {
    if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
      throw new Error('__T_SETTINGS_PASSWORD_REQUIRED__');
    }
    if (newPassword.value !== confirmPassword.value) {
      throw new Error('__T_SETTINGS_PASSWORD_MISMATCH__');
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
    toast.show('__T_SETTINGS_PASSWORD_CHANGED_RELOGIN__');
    await logout();
  } catch (e) {
    toast.show('__T_SETTINGS_SAVE_FAILED__'.replace('{message}', e.message), { type: 'error' });
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
  await Promise.all([fetchMe(), fetchSettings(), fetchSkills()]);
});
</script>
