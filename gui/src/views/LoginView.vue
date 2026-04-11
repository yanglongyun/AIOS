<template>
  <div class="relative min-h-screen overflow-hidden bg-[#f7f3ee] [font-family:'Barlow',system-ui,sans-serif]">
    <div
      class="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_0%,rgba(255,220,160,.55)_0%,transparent_55%),radial-gradient(ellipse_60%_55%_at_90%_95%,rgba(200,210,255,.5)_0%,transparent_55%),radial-gradient(ellipse_50%_45%_at_75%_10%,rgba(220,200,255,.35)_0%,transparent_50%)]"
    ></div>

    <div class="relative z-10 flex min-h-screen items-center justify-center p-6">
      <div class="w-full max-w-[440px] rounded-[32px] border border-white/80 bg-white/90 px-10 py-9 shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.06)]">
        <div class="mb-[10px] text-[11px] font-bold uppercase tracking-[1.8px] text-black/35">Welcome back</div>
        <h2 class="mb-1.5 text-[26px] font-bold leading-[1.2] tracking-[-0.5px] text-[#222]">__T_LOGIN_TITLE__</h2>
        <p class="mb-7 text-[14px] font-medium leading-[1.6] text-black/45">__T_LOGIN_SUBTITLE__</p>

        <div v-if="error" class="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {{ error }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="mb-[7px] block text-[11px] font-bold uppercase tracking-[1px] text-black/40">__T_LOGIN_USERNAME_LABEL__</label>
            <input
              v-model.trim="username"
              class="w-full rounded-xl border-[1.5px] border-black/10 bg-black/[0.02] px-[14px] py-[11px] text-[14px] font-medium text-[#222] outline-none transition-all placeholder:text-black/25 focus:border-[#222] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
              placeholder="__T_LOGIN_USERNAME_PLACEHOLDER__"
              autocomplete="username"
              @keydown.enter="$refs.passwordInput?.focus()"
            />
          </div>
          <div>
            <label class="mb-[7px] block text-[11px] font-bold uppercase tracking-[1px] text-black/40">__T_LOGIN_PASSWORD_LABEL__</label>
            <input
              ref="passwordInput"
              v-model="password"
              type="password"
              class="w-full rounded-xl border-[1.5px] border-black/10 bg-black/[0.02] px-[14px] py-[11px] text-[14px] font-medium text-[#222] outline-none transition-all placeholder:text-black/25 focus:border-[#222] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
              placeholder="__T_LOGIN_PASSWORD_PLACEHOLDER__"
              autocomplete="current-password"
              @keydown.enter="submitLogin"
            />
          </div>
        </div>

        <div class="mt-7 flex items-center justify-between border-t border-black/[0.06] pt-[22px]">
          <button
            type="button"
            @click="showResetHint = !showResetHint"
            class="text-[13px] font-semibold text-black/35 transition-colors hover:text-[#222]"
          >
            __T_LOGIN_FORGOT_PASSWORD__
          </button>
          <button
            @click="submitLogin"
            :disabled="pending"
            class="inline-flex items-center rounded-full bg-[#222] px-[22px] py-[10px] pr-[10px] text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.04] hover:bg-black hover:shadow-[0_8px_28px_rgba(0,0,0,0.28)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span>{{ pending ? '__T_LOGIN_PROCESSING__' : '__T_LOGIN_BUTTON__' }}</span>
            <span class="ml-3 inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white text-[#222]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </span>
          </button>
        </div>

        <div v-if="showResetHint" class="mt-4 rounded-xl border border-black/[0.07] bg-black/[0.03] px-3.5 py-2.5 text-[13px] leading-relaxed text-black/50">
          __T_LOGIN_RESET_HINT__
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { clearAuthCache } from '../auth/session.js';
const router = useRouter();
const username = ref('');
const password = ref('');
const pending = ref(false);
const error = ref('');
const showResetHint = ref(false);

const requestAuth = async (url) => {
  pending.value = true;
  error.value = '';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });
    const data = await res.json();
    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || '__T_LOGIN_OPERATION_FAILED__');
    }
    clearAuthCache();
    await router.replace('/');
  } catch (e) {
    error.value = e?.message || '__T_LOGIN_REQUEST_FAILED__';
  } finally {
    pending.value = false;
  }
};

const submitLogin = async () => {
  await requestAuth('/api/auth/login');
};

</script>
