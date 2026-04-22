<template>
  <div class="cc-app-root relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" style="background:#faf6ec">
    <!-- Onboarding: CLI not installed -->
    <Onboarding v-if="cliStatus && !cliStatus.installed" :checking="checkingStatus" @recheck="fetchStatus" />

    <!-- Normal: tabs + content -->
    <template v-else>
    <!-- Tab strip -->
    <div class="shrink-0 flex items-stretch border-b px-2.5"
      style="border-color:rgba(140,100,60,0.12);background:#fffaf2;height:38px;overflow-x:auto;overflow-y:hidden;">
      <div v-for="t in tabs" :key="t.id" class="tab-btn"
        :class="{ 'tab-active': activeTab === t.id }" @click="activeTab = t.id">
        <span>{{ t.icon }}</span>
        <span>{{ t.label }}</span>
      </div>
    </div>

    <!-- Tab content -->
    <div class="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
      <ChatTab     v-if="activeTab === 'chat'"     :installed="cliStatus?.installed || false" />
      <ProjectsTab v-else-if="activeTab === 'projects'" :data="projects" :loading="projectsLoading" />
      <AccountTab  v-else-if="activeTab === 'account'"  :data="account" />
      <PluginTab   v-else-if="activeTab === 'plugin'"   :data="plugins" :loading="pluginsLoading" />
      <AgentsTab   v-else-if="activeTab === 'agents'"   :data="agents" />
      <McpTab      v-else-if="activeTab === 'mcp'"      :data="mcp" />
      <StatsTab    v-else-if="activeTab === 'stats'"    :data="stats" />
      <HistoryTab  v-else-if="activeTab === 'history'"  :data="history" />
      <SkillsTab   v-else-if="activeTab === 'skills'"   :data="skills" />
      <PlansTab    v-else-if="activeTab === 'plans'"    :data="plans" />
      <MemoryTab   v-else-if="activeTab === 'memory'"   :data="memory" @refresh="loaders.memory()" />
      <SettingsTab v-else-if="activeTab === 'settings'" :data="settings" @refresh="loaders.settings()" />
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import './ui.css';

import ChatTab from './tabs/ChatTab.vue';
import ProjectsTab from './tabs/ProjectsTab.vue';
import AccountTab from './tabs/AccountTab.vue';
import PluginTab from './tabs/PluginTab.vue';
import AgentsTab from './tabs/AgentsTab.vue';
import McpTab from './tabs/McpTab.vue';
import StatsTab from './tabs/StatsTab.vue';
import HistoryTab from './tabs/HistoryTab.vue';
import SkillsTab from './tabs/SkillsTab.vue';
import PlansTab from './tabs/PlansTab.vue';
import MemoryTab from './tabs/MemoryTab.vue';
import SettingsTab from './tabs/SettingsTab.vue';
import Onboarding from './Onboarding.vue';

const tabs = [
  { id: 'chat',     icon: '💬', label: '__T_CLAUDE_TAB_CHAT__' },
  { id: 'projects', icon: '🗂', label: '__T_CLAUDE_TAB_PROJECTS__' },
  { id: 'memory',   icon: '🧠', label: 'CLAUDE.md' },
  { id: 'plans',    icon: '🗺', label: '__T_CLAUDE_TAB_PLANS__' },
  { id: 'history',  icon: '🕐', label: '__T_CLAUDE_TAB_HISTORY__' },
  { id: 'skills',   icon: '✨', label: '__T_CLAUDE_TAB_SKILLS__' },
  { id: 'plugin',   icon: '🧩', label: '__T_CLAUDE_TAB_PLUGIN__' },
  { id: 'agents',   icon: '🤖', label: 'Agents' },
  { id: 'mcp',      icon: '🌐', label: 'MCP' },
  { id: 'stats',    icon: '📊', label: '__T_CLAUDE_TAB_STATS__' },
  { id: 'settings', icon: '⚙️', label: '__T_CLAUDE_TAB_SETTINGS__' },
  { id: 'account',  icon: '👤', label: '__T_CLAUDE_TAB_ACCOUNT__' }
];

const activeTab = ref('chat');
const cliStatus = ref(null);
const checkingStatus = ref(false);

const stats = ref(null);
const history = ref(null);
const account = ref(null);
const settings = ref(null);
const agents = ref(null);
const mcp = ref(null);
const plans = ref(null);
const skills = ref(null);
const plugins = ref(null);
const pluginsLoading = ref(false);
const memory = ref(null);
const projects = ref(null);
const projectsLoading = ref(false);

const loaders = {
  stats: async () => { stats.value = await (await fetch('/apps/claude-code/stats')).json(); },
  history: async () => { history.value = await (await fetch('/apps/claude-code/history?limit=300')).json(); },
  account: async () => { account.value = await (await fetch('/apps/claude-code/account')).json(); },
  settings: async () => { settings.value = await (await fetch('/apps/claude-code/settings')).json(); },
  agents: async () => { agents.value = await (await fetch('/apps/claude-code/agents')).json(); },
  mcp: async () => { mcp.value = await (await fetch('/apps/claude-code/mcp')).json(); },
  plans: async () => { plans.value = await (await fetch('/apps/claude-code/plans')).json(); },
  skills: async () => { skills.value = await (await fetch('/apps/claude-code/skills')).json(); },
  memory: async () => { memory.value = await (await fetch('/apps/claude-code/memory')).json(); },
  plugin: async () => {
    pluginsLoading.value = true;
    try { plugins.value = await (await fetch('/apps/claude-code/plugins')).json(); }
    finally { pluginsLoading.value = false; }
  },
  projects: async () => {
    projectsLoading.value = true;
    try { projects.value = await (await fetch('/apps/claude-code/projects')).json(); }
    finally { projectsLoading.value = false; }
  }
};

watch(activeTab, (t) => {
  const fn = loaders[t];
  if (fn) fn();
});

const fetchStatus = async () => {
  checkingStatus.value = true;
  try {
    const r = await fetch('/apps/claude-code/status');
    cliStatus.value = await r.json();
  } catch {
    cliStatus.value = { installed: false };
  } finally {
    checkingStatus.value = false;
  }
};

onMounted(fetchStatus);
</script>

<style scoped>
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 11px;
  font-size: 12px;
  font-weight: 600;
  color: #6b5a46;
  white-space: nowrap;
  border: 1px solid transparent;
  border-bottom: 0;
  border-top-left-radius: 9px;
  border-top-right-radius: 9px;
  cursor: pointer;
  position: relative;
  top: 6px;
  transition: all 0.12s;
}
.tab-btn:hover {
  color: #2a1f13;
  background: rgba(140, 100, 60, 0.06);
}
.tab-active {
  background: #faf6ec;
  color: #2a1f13;
  border-color: rgba(140, 100, 60, 0.12);
  border-bottom-color: #faf6ec;
  box-shadow: 0 -2px 0 #5c4332 inset;
}
</style>
