<template>
  <Teleport to="body">
    <div v-if="visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        class="w-[400px] rounded-xl border border-[#3a2a18] bg-gradient-to-br from-[#2a2018] to-[#1a1410] p-6 shadow-2xl">

        <!-- 标题 -->
        <h3 class="text-base font-bold text-[#e8d4b8]">__T_RELOAD_TITLE__</h3>

        <!-- 说明 -->
        <p v-if="message" class="mt-3 rounded-lg border border-[#3a2a18] bg-[#1a1410]/60 px-3 py-2 text-[13px] leading-relaxed text-[#a09078]">{{ message }}</p>

        <!-- 操作摘要 -->
        <div class="mt-3 space-y-1 text-[12px] text-[#8a7860]">
          <div v-if="pendingOptions.build" class="flex items-center gap-1.5">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-[#c8a060]"></span>
            __T_RELOAD_WILL_BUILD__
          </div>
          <div v-if="pendingOptions.restart" class="flex items-center gap-1.5">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-[#c8a060]"></span>
            __T_RELOAD_WILL_RESTART__
          </div>
        </div>

        <!-- 状态区 -->
        <div class="mt-5">
          <!-- 确认阶段 -->
          <div v-if="phase === 'confirm'" class="flex items-center justify-end gap-3">
            <button @click="dismiss"
              class="cursor-pointer rounded-lg border border-[#3a2a18] px-4 py-2 text-[13px] text-[#a09078] transition hover:bg-white/5">
              __T_COMMON_CANCEL__
            </button>
            <button @click="doReload"
              class="cursor-pointer rounded-lg bg-gradient-to-br from-[#c8a060] to-[#a07840] px-4 py-2 text-[13px] font-semibold text-[#1a1410] transition hover:opacity-85">
              __T_RELOAD_CONFIRM__
            </button>
          </div>

          <!-- 编译中 -->
          <div v-else-if="phase === 'building'" class="flex items-center gap-3 text-[13px] text-[#c8a060]">
            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#c8a060] border-t-transparent"></span>
            __T_RELOAD_BUILDING__
          </div>

          <!-- 重启中 -->
          <div v-else-if="phase === 'restarting'" class="flex items-center gap-3 text-[13px] text-[#c8a060]">
            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#c8a060] border-t-transparent"></span>
            __T_RELOAD_RESTARTING__
          </div>

          <!-- 错误 -->
          <div v-else-if="phase === 'error'" class="space-y-3">
            <p class="text-[13px] text-red-400">{{ errorMsg }}</p>
            <div class="flex items-center justify-end gap-3">
              <button @click="dismiss"
                class="cursor-pointer rounded-lg border border-[#3a2a18] px-4 py-2 text-[13px] text-[#a09078] transition hover:bg-white/5">
                __T_COMMON_CLOSE__
              </button>
              <button @click="doReload"
                class="cursor-pointer rounded-lg bg-gradient-to-br from-[#c8a060] to-[#a07840] px-4 py-2 text-[13px] font-semibold text-[#1a1410] transition hover:opacity-85">
                __T_RELOAD_RETRY__
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, ref, reactive } from 'vue';
import { on } from '../ws.js';
const visible = ref(false);
const phase = ref('confirm'); // confirm | building | restarting | error
const message = ref('');
const errorMsg = ref('');
const pendingOptions = reactive({ build: false, restart: null });

const dismiss = () => {
  visible.value = false;
  phase.value = 'confirm';
  message.value = '';
  errorMsg.value = '';
  pendingOptions.build = false;
  pendingOptions.restart = null;
};

const doReload = async () => {
  phase.value = 'building';
  errorMsg.value = '';

  try {
    const res = await fetch('/aios/api/system/reload', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        build: pendingOptions.build,
        restart: pendingOptions.restart
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

    // 需要重启服务 → 轮询 health
    if (pendingOptions.restart === 'server' || pendingOptions.restart === 'both') {
      phase.value = 'restarting';
      await pollHealth();
    }

    location.reload();
  } catch (e) {
    phase.value = 'error';
    errorMsg.value = e.message || 'Unknown error';
  }
};

const pollHealth = () => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 60;

    const check = async () => {
      attempts++;
      if (attempts > maxAttempts) {
        reject(new Error('Server restart timed out'));
        return;
      }
      try {
        const res = await fetch('/aios/api/health', { credentials: 'include' });
        if (res.ok) { resolve(); return; }
      } catch {}
      setTimeout(check, 1000);
    };

    // 等 2 秒让旧进程退出
    setTimeout(check, 2000);
  });
};

let unsub;
onMounted(() => {
  unsub = on('reload_request', (data) => {
    pendingOptions.build = data.build ?? false;
    pendingOptions.restart = data.restart || null;
    message.value = data.message || '';
    phase.value = 'confirm';
    visible.value = true;
  });
});

onUnmounted(() => {
  unsub?.();
});
</script>
