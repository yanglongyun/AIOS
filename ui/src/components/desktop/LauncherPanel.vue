<template>
  <div
    class="absolute bottom-[52px] left-2 z-[201] w-[300px] rounded-[16px] border p-3 shadow-[0_8px_36px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl"
    :class="panelClass"
    @click.stop
  >
    <div class="mb-2.5 flex items-center gap-1.5">
      <input
        ref="searchEl"
        v-model="search"
        class="min-w-0 flex-1 rounded-[10px] border px-3 py-1.5 text-[13px] font-medium outline-none transition-colors"
        :class="inputClass"
        placeholder="__T_LAUNCHER_SEARCH__"
      />
    </div>

    <div class="grid grid-cols-4 gap-1.5">
      <button
        v-for="app in filteredApps"
        :key="app.id"
        class="flex flex-col items-center gap-1 rounded-[10px] px-1 py-2.5 transition-colors"
        :class="appItemClass"
        @click="$emit('open', app.id)"
      >
        <span class="text-[20px]">{{ app.icon }}</span>
        <span class="text-center text-[10.5px] font-medium leading-tight" :class="secondaryTextClass">{{ app.name }}</span>
      </button>
    </div>

    <!-- 底部用户栏 -->
    <div class="mt-2.5 flex items-center gap-1.5 border-t pt-2.5" :class="footerClass">
      <div class="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold" :class="avatarClass">
        {{ usernameInitial }}
      </div>
      <span class="flex-1 truncate text-[12px] font-medium" :class="secondaryTextClass">{{ username || '...' }}</span>
      <button
        class="flex h-[26px] items-center rounded-[6px] px-2 transition-colors disabled:opacity-40"
        :class="utilityButtonClass"
        :disabled="restarting"
        @click="doRestart"
        title="重启应用服务"
      >
        <RotateCcw class="h-[13px] w-[13px]" :class="restarting ? 'animate-spin' : ''" />
      </button>
      <button
        class="flex h-[26px] items-center rounded-[6px] px-2 text-red-500 transition-colors"
        :class="logoutClass"
        @click="doLogout"
        title="退出登录"
      >
        <LogOut class="h-[13px] w-[13px]" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { LogOut, RotateCcw } from 'lucide-vue-next';
import { apps } from '../../apps.js';
import { clearAuthCache } from '../../auth/session.js';
import { desktopTheme } from '../../stores/appearance.js';

const router = useRouter();
defineEmits(['open', 'close']);

const search = ref('');
const searchEl = ref(null);
const username = ref('');
const restarting = ref(false);
const isDarkTheme = computed(() => desktopTheme.value === 'dark');
const panelClass = computed(() => isDarkTheme.value
  ? 'border-white/[0.08] bg-[#141a2b]/[0.92]'
  : 'border-black/[0.08] bg-white/[0.97]');
const inputClass = computed(() => isDarkTheme.value
  ? 'border-white/[0.08] bg-white/[0.06] text-white placeholder:text-white/28 focus:border-white/[0.22] focus:bg-white/[0.1]'
  : 'border-black/[0.1] bg-black/[0.03] text-[#222] placeholder-black/[0.28] focus:border-black/[0.35] focus:bg-white');
const appItemClass = computed(() => isDarkTheme.value ? 'hover:bg-white/[0.08]' : 'hover:bg-black/[0.05]');
const secondaryTextClass = computed(() => isDarkTheme.value ? 'text-white/78' : 'text-[#444]');
const footerClass = computed(() => isDarkTheme.value ? 'border-white/[0.08]' : 'border-black/[0.06]');
const avatarClass = computed(() => isDarkTheme.value ? 'bg-white/[0.1] text-white' : 'bg-black/[0.08] text-[#222]');
const utilityButtonClass = computed(() => isDarkTheme.value
  ? 'text-white/42 hover:bg-white/[0.08] hover:text-white'
  : 'text-black/[0.4] hover:bg-black/[0.06] hover:text-[#222]');
const logoutClass = computed(() => isDarkTheme.value ? 'hover:bg-red-500/12' : 'hover:bg-red-50');

const usernameInitial = computed(() => (username.value || '?')[0].toUpperCase());

const visibleApps = apps;

const filteredApps = computed(() => {
  if (!search.value.trim()) return visibleApps;
  const q = search.value.toLowerCase();
  return visibleApps.filter(a => a.name.toLowerCase().includes(q));
});

async function fetchMe() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    username.value = data?.user?.username || '';
  } catch {}
}

async function doLogout() {
  if (!window.confirm('__T_LOGOUT_CONFIRM__')) return;
  try {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  } catch {}
  clearAuthCache();
  router.push('/login');
}

async function doRestart() {
  if (restarting.value) return;
  restarting.value = true;
  try {
    await fetch('/api/system/reload/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ build: false, restartApps: true, restartServer: false })
    });
  } catch {}
  restarting.value = false;
}

onMounted(() => {
  searchEl.value?.focus();
  fetchMe();
});
</script>
