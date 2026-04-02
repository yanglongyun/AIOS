<template>
  <div
    class="absolute bottom-[52px] left-2 z-[201] w-[300px] rounded-[14px] border border-[rgba(212,192,160,0.5)] bg-[rgba(255,252,248,0.97)] p-3 shadow-[0_8px_36px_rgba(90,62,40,0.18)] backdrop-blur-xl"
    @click.stop
  >
    <div class="mb-2.5 flex items-center gap-1.5">
      <input
        ref="searchEl"
        v-model="search"
        class="min-w-0 flex-1 rounded-[8px] border border-[rgba(200,160,96,0.3)] bg-[rgba(245,240,232,0.9)] px-3 py-1.5 text-[13px] text-[#3a2a18] outline-none placeholder-[#b0a090] focus:border-[#c8a060]"
        placeholder="__T_LAUNCHER_SEARCH__"
      />
    </div>

    <div class="grid grid-cols-4 gap-1.5">
      <button
        v-for="app in filteredApps"
        :key="app.id"
        class="flex flex-col items-center gap-1 rounded-[9px] px-1 py-2.5 transition-colors hover:bg-[rgba(200,160,96,0.1)]"
        @click="$emit('open', app.id)"
      >
        <span class="text-[20px]">{{ app.icon }}</span>
        <span class="text-center text-[10.5px] leading-tight text-[#5a4a38]">{{ app.name }}</span>
      </button>
    </div>

    <!-- 底部用户栏 -->
    <div class="mt-2.5 flex items-center gap-1.5 border-t border-[rgba(200,160,96,0.2)] pt-2.5">
      <div class="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-full bg-[rgba(200,160,96,0.2)] text-[13px] font-semibold text-[#5a3e28]">
        {{ usernameInitial }}
      </div>
      <span class="flex-1 truncate text-[12px] text-[#5a4a38]">{{ username || '...' }}</span>
      <button
        class="flex h-[26px] items-center rounded-[6px] px-2 text-[#7a6a58] transition-colors hover:bg-[rgba(200,160,96,0.12)] hover:text-[#5a3e28] disabled:opacity-40"
        :disabled="restarting"
        @click="doRestart"
        title="重启应用服务"
      >
        <RotateCcw class="h-[13px] w-[13px]" :class="restarting ? 'animate-spin' : ''" />
      </button>
      <button
        class="flex h-[26px] items-center rounded-[6px] px-2 text-[#c04040] transition-colors hover:bg-[rgba(200,80,50,0.08)]"
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
import { appRegistry } from '../../apps.js';
import { clearAuthCache } from '../../auth/session.js';

const router = useRouter();
defineEmits(['open', 'close']);

const search = ref('');
const searchEl = ref(null);
const username = ref('');
const restarting = ref(false);

const usernameInitial = computed(() => (username.value || '?')[0].toUpperCase());

const visibleApps = appRegistry.filter(a => !a.hidden);

const filteredApps = computed(() => {
  if (!search.value.trim()) return visibleApps;
  const q = search.value.toLowerCase();
  return visibleApps.filter(a => a.name.toLowerCase().includes(q));
});

async function fetchMe() {
  try {
    const res = await fetch('/aios/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    username.value = data?.user?.username || '';
  } catch {}
}

async function doLogout() {
  if (!window.confirm('__T_LOGOUT_CONFIRM__')) return;
  try {
    await fetch('/aios/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  } catch {}
  clearAuthCache();
  router.push('/login');
}

async function doRestart() {
  if (restarting.value) return;
  restarting.value = true;
  try {
    await fetch('/aios/api/system/reload/request', {
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
