<template>
  <div class="cc-app-root relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" style="background:#faf6ec">
    <Onboarding v-if="cliStatus && !cliStatus.installed" :checking="checkingStatus" @recheck="fetchStatus" />

    <template v-else>
      <div class="shrink-0 flex items-stretch border-b px-2.5"
        style="border-color:rgba(140,100,60,0.12);background:#fffaf2;height:38px;overflow-x:auto;overflow-y:hidden;">
        <div v-for="t in tabs" :key="t.id" class="tab-btn"
          :class="{ 'tab-active': activeTab === t.id }" @click="activeTab = t.id">
          <span>{{ t.icon }}</span>
          <span>{{ t.label }}</span>
        </div>
      </div>

      <div class="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        <ChatTab     v-if="activeTab === 'chat'"     :installed="cliStatus?.installed || false" />
        <ProjectsTab v-else-if="activeTab === 'projects'" :data="projects" :loading="projectsLoading" />
        <MemoryTab   v-else-if="activeTab === 'memory'"   :data="memory" @refresh="loaders.memory()" />
        <HistoryTab  v-else-if="activeTab === 'history'"  :data="history" />
        <SkillsTab   v-else-if="activeTab === 'skills'"   :data="skills" />
        <McpTab      v-else-if="activeTab === 'mcp'"      :data="mcp" />
        <SettingsTab v-else-if="activeTab === 'settings'" :data="settings" @refresh="loaders.settings()" />
        <AccountTab  v-else-if="activeTab === 'account'"  :data="account" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import './ui.css';

import ChatTab from './tabs/ChatTab.vue';
import ProjectsTab from './tabs/ProjectsTab.vue';
import MemoryTab from './tabs/MemoryTab.vue';
import HistoryTab from './tabs/HistoryTab.vue';
import SkillsTab from './tabs/SkillsTab.vue';
import McpTab from './tabs/McpTab.vue';
import SettingsTab from './tabs/SettingsTab.vue';
import AccountTab from './tabs/AccountTab.vue';
import Onboarding from './Onboarding.vue';

const tabs = [
  { id: 'chat',     icon: '💬', label: '__T_CODEX_TAB_CHAT__' },
  { id: 'projects', icon: '🗂', label: '__T_CODEX_TAB_PROJECTS__' },
  { id: 'memory',   icon: '🤖', label: 'AGENTS.md' },
  { id: 'history',  icon: '🕐', label: '__T_CODEX_TAB_HISTORY__' },
  { id: 'skills',   icon: '✨', label: '__T_CODEX_TAB_SKILLS__' },
  { id: 'mcp',      icon: '🌐', label: 'MCP' },
  { id: 'settings', icon: '⚙️', label: '__T_CODEX_TAB_SETTINGS__' },
  { id: 'account',  icon: '👤', label: '__T_CODEX_TAB_ACCOUNT__' }
];

const activeTab = ref('chat');
const cliStatus = ref(null);
const checkingStatus = ref(false);

const history = ref(null);
const account = ref(null);
const settings = ref(null);
const mcp = ref(null);
const skills = ref(null);
const memory = ref(null);
const projects = ref(null);
const projectsLoading = ref(false);

const loaders = {
  history: async () => { history.value = await (await fetch('/apps/codex/history?limit=300')).json(); },
  account: async () => { account.value = await (await fetch('/apps/codex/account')).json(); },
  settings: async () => { settings.value = await (await fetch('/apps/codex/settings')).json(); },
  mcp: async () => { mcp.value = await (await fetch('/apps/codex/mcp')).json(); },
  skills: async () => { skills.value = await (await fetch('/apps/codex/skills')).json(); },
  memory: async () => { memory.value = await (await fetch('/apps/codex/memory')).json(); },
  projects: async () => {
    projectsLoading.value = true;
    try { projects.value = await (await fetch('/apps/codex/projects')).json(); }
    finally { projectsLoading.value = false; }
  }
};

watch(activeTab, (t) => { const fn = loaders[t]; if (fn) fn(); });

const fetchStatus = async () => {
  checkingStatus.value = true;
  try {
    const r = await fetch('/apps/codex/status');
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
  display: inline-flex; align-items: center; gap: 5px; padding: 0 11px;
  font-size: 12px; font-weight: 600; color: #6b5a46; white-space: nowrap;
  border: 1px solid transparent; border-bottom: 0;
  border-top-left-radius: 9px; border-top-right-radius: 9px;
  cursor: pointer; position: relative; top: 6px; transition: all 0.12s;
}
.tab-btn:hover { color: #2a1f13; background: rgba(140, 100, 60, 0.06); }
.tab-active {
  background: #faf6ec; color: #2a1f13;
  border-color: rgba(140, 100, 60, 0.12); border-bottom-color: #faf6ec;
  box-shadow: 0 -2px 0 #5c4332 inset;
}
</style>
