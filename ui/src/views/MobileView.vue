<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-[#f5f0e8] font-['Georgia','PingFang_SC',serif]" @click="userMenuOpen = false">

    <!-- 顶栏 -->
    <div class="flex h-[52px] shrink-0 items-center border-b border-[#e0d0b8] bg-[rgba(250,245,238,0.97)] px-4 backdrop-blur-xl">
      <!-- 应用打开状态 -->
      <template v-if="openedApp">
        <span class="mr-2 text-[22px] leading-none">{{ openedAppIcon }}</span>
        <div class="flex-1 text-[15px] font-bold text-[#3a2a18]">{{ topTitle }}</div>
        <button
          class="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#7a6a58] transition-colors active:bg-[rgba(200,160,96,0.12)]"
          @click="closeApp"
        >
          <X class="h-[18px] w-[18px]" />
        </button>
      </template>

      <!-- 默认状态 -->
      <template v-else>
        <div class="flex-1 text-[15px] font-bold text-[#3a2a18]">AIOS</div>
        <button
          ref="avatarBtn"
          class="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[rgba(200,160,96,0.22)] text-[13px] font-semibold text-[#5a3e28]"
          @click.stop="toggleUserMenu"
        >{{ usernameInitial }}</button>
      </template>
    </div>

    <!-- 内容区 -->
    <div class="relative min-h-0 flex-1 overflow-hidden">

      <!-- 打开的应用 -->
      <div v-if="openedApp" class="absolute inset-0 overflow-hidden bg-white">
        <component :is="openedApp.component" v-bind="openedApp.props" />
      </div>

      <!-- 应用网格 -->
      <div v-else class="h-full overflow-y-auto px-4 py-4">
        <input
          v-model="appSearch"
          class="mb-4 w-full rounded-[12px] border border-[rgba(200,160,96,0.3)] bg-white px-4 py-2.5 text-[14px] text-[#3a2a18] shadow-sm outline-none placeholder-[#b0a090] focus:border-[#c8a060]"
          :placeholder="t('launcher_search')"
        />
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="app in filteredApps"
            :key="app.id"
            class="flex flex-col items-center gap-1.5 rounded-[14px] px-1 py-3 transition-colors active:bg-[rgba(200,160,96,0.12)]"
            @click="openApp(app.id)"
          >
            <div class="flex h-[56px] w-[56px] items-center justify-center rounded-[16px] bg-white text-[28px] shadow-[0_2px_8px_rgba(90,62,40,0.1)]">{{ app.icon }}</div>
            <span class="text-center text-[11px] leading-tight text-[#5a4a38]">{{ t(app.name) }}</span>
          </button>
        </div>
      </div>

    </div>

  </div>

  <!-- 用户菜单：Teleport 到 body，避开 overflow-hidden 和 backdrop-filter stacking context -->
  <Teleport to="body">
    <div v-if="userMenuOpen" class="fixed inset-0 z-[9000]" @click="userMenuOpen = false">
      <div
        class="absolute w-[150px] overflow-hidden rounded-[12px] border border-[#e0d0b8] bg-[rgba(255,252,248,0.99)] shadow-[0_8px_24px_rgba(90,62,40,0.18)]"
        :style="menuStyle"
        @click.stop
      >
        <div class="border-b border-[#f0e4d0] px-3.5 py-2.5">
          <p class="truncate text-[11px] text-[#9a8870]">{{ username || '...' }}</p>
        </div>
        <button
          class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#3a2a18] transition-colors active:bg-[rgba(200,160,96,0.1)]"
          @click="doRestart"
        >
          <RotateCcw class="h-[14px] w-[14px] text-[#7a6a58]" />
          重启系统
        </button>
        <button
          class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#c04040] transition-colors active:bg-[rgba(200,80,50,0.06)]"
          @click="doLogout"
        >
          <LogOut class="h-[14px] w-[14px]" />
          退出登录
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, shallowRef, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { LogOut, RotateCcw, X } from 'lucide-vue-next';
import { appRegistry } from '../desktop/apps.js';
import { useI18n } from '../i18n/index.js';
import { clearAuthCache } from '../auth/session.js';

const { t } = useI18n();
const router = useRouter();

// 用户
const username = ref('');
const usernameInitial = computed(() => (username.value || '?')[0].toUpperCase());
const userMenuOpen = ref(false);
const avatarBtn = ref(null);
const menuStyle = ref({});

async function fetchMe() {
  try {
    const res = await fetch('/aios/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    username.value = data?.user?.username || '';
  } catch {}
}

function toggleUserMenu() {
  if (!userMenuOpen.value) {
    const rect = avatarBtn.value?.getBoundingClientRect();
    if (rect) {
      menuStyle.value = {
        top: (rect.bottom + 6) + 'px',
        right: (window.innerWidth - rect.right) + 'px',
      };
    }
  }
  userMenuOpen.value = !userMenuOpen.value;
}

async function doLogout() {
  userMenuOpen.value = false;
  try {
    await fetch('/aios/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  } catch {}
  clearAuthCache();
  router.push('/login');
}

async function doRestart() {
  userMenuOpen.value = false;
  try {
    await fetch('/aios/api/system/reload/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restart: 'server' })
    });
  } catch {}
}

// 顶栏
const topTitle = computed(() => {
  if (!openedApp.value) return 'AIOS';
  const app = appRegistry.find(a => a.id === openedApp.value.appId);
  return app ? t(app.name) : 'AIOS';
});
const openedAppIcon = computed(() => {
  if (!openedApp.value) return '';
  return appRegistry.find(a => a.id === openedApp.value.appId)?.icon || '';
});

// 应用网格
const appSearch = ref('');
const visibleApps = appRegistry.filter(a => !a.hidden);
const filteredApps = computed(() => {
  if (!appSearch.value.trim()) return visibleApps;
  const q = appSearch.value.toLowerCase();
  return visibleApps.filter(a => t(a.name).toLowerCase().includes(q));
});

// 打开的应用
const openedApp = shallowRef(null);
async function openApp(appId) {
  const app = appRegistry.find(a => a.id === appId);
  if (!app) return;
  const mod = await app.load();
  openedApp.value = { appId, component: mod.default, props: {} };
}
function closeApp() {
  openedApp.value = null;
}

onMounted(fetchMe);
</script>
