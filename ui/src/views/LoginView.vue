<template>
  <div class="flex min-h-screen items-center justify-center bg-[#2a2218] px-4">
    <div class="w-full max-w-md rounded-2xl border border-[#3a2010] bg-[linear-gradient(180deg,#4a3020_0%,#3a2618_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
      <h1 class="text-center text-2xl font-black tracking-wide text-[#f0e0c0]">__T_LOGIN_TITLE__</h1>
      <p class="mt-1 text-center text-sm text-[#c8b090]">__T_LOGIN_SUBTITLE__</p>

      <div v-if="error" class="mt-4 rounded-lg border border-[#8a4030] bg-[#5a2a20] px-3 py-2 text-sm text-[#ffd8d0]">
        {{ error }}
      </div>

      <div class="mt-4 space-y-3">
        <input
          v-model.trim="username"
          class="w-full rounded-xl border border-[#5a4030] bg-[#26180f] px-3 py-2 text-sm text-[#f0e0c0] outline-none placeholder:text-[#8a7058] focus:border-[#c8a060]"
          placeholder="__T_LOGIN_USERNAME_PLACEHOLDER__"
          autocomplete="username"
        />
        <input
          v-model="password"
          type="password"
          class="w-full rounded-xl border border-[#5a4030] bg-[#26180f] px-3 py-2 text-sm text-[#f0e0c0] outline-none placeholder:text-[#8a7058] focus:border-[#c8a060]"
          placeholder="__T_LOGIN_PASSWORD_PLACEHOLDER__"
          autocomplete="current-password"
        />
      </div>

      <div class="mt-5">
        <button
          @click="submitLogin"
          :disabled="pending"
          class="w-full rounded-xl bg-[#c8a060] px-4 py-2 text-sm font-semibold text-[#24140a] transition hover:bg-[#d8b070] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ pending ? '__T_LOGIN_PROCESSING__' : '__T_LOGIN_BUTTON__' }}
        </button>
        <button
          type="button"
          @click="showResetHint = !showResetHint"
          class="mt-2 w-full text-center text-xs text-[#b89a72] transition-colors hover:text-[#d8b890]"
        >
          __T_LOGIN_FORGOT_PASSWORD__
        </button>
        <div v-if="showResetHint" class="mt-2 rounded-lg border border-[#5a4030] bg-[#26180f] px-3 py-2 text-xs leading-relaxed text-[#c8b090]">
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
