<template>
  <div
    class="absolute bottom-[52px] left-2 z-[201] w-[300px] rounded-[16px] border border-black/[0.08] bg-white/[0.97] p-3 shadow-[0_8px_36px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl"
    @click.stop
  >
    <div class="mb-2.5 flex items-center gap-1.5">
      <input
        ref="searchEl"
        v-model="search"
        class="min-w-0 flex-1 rounded-[10px] border border-black/[0.1] bg-black/[0.03] px-3 py-1.5 text-[13px] font-medium text-[#222] outline-none placeholder-black/[0.28] focus:border-black/[0.35] focus:bg-white"
        placeholder="__T_LAUNCHER_SEARCH__"
      />
    </div>

    <div class="grid grid-cols-4 gap-1.5">
      <button
        v-for="app in filteredApps"
        :key="app.id"
        class="flex flex-col items-center gap-1 rounded-[10px] px-1 py-2.5 transition-colors hover:bg-black/[0.05]"
        @click="$emit('open', app.id)"
      >
        <span class="text-[20px]">{{ app.icon }}</span>
        <span class="text-center text-[10.5px] font-medium leading-tight text-[#444]">{{ app.name }}</span>
      </button>
    </div>

    <!-- 底部用户栏 -->
    <div class="mt-2.5 flex items-center gap-1.5 border-t border-black/[0.06] pt-2.5">
      <div class="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-full bg-black/[0.08] text-[13px] font-bold text-[#222]">
        {{ usernameInitial }}
      </div>
      <span class="flex-1 truncate text-[12px] font-medium text-[#444]">{{ username || '...' }}</span>
      <button
        class="flex h-[26px] items-center rounded-[6px] px-2 text-black/[0.4] transition-colors hover:bg-black/[0.06] hover:text-[#222] disabled:opacity-40"
        :disabled="restarting"
        @click="doRestart"
        title="重启应用服务"
      >
        <RotateCcw class="h-[13px] w-[13px]" :class="restarting ? 'animate-spin' : ''" />
      </button>
      <button
        class="flex h-[26px] items-center rounded-[6px] px-2 text-red-500 transition-colors hover:bg-red-50"
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
