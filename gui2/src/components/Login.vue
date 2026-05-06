<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore();
const password = ref('');
const password2 = ref('');
const busy = ref(false);

async function submit() {
  if (busy.value) return;
  if (!password.value) return;
  busy.value = true;
  try {
    if (auth.configured) {
      await auth.login(password.value);
    } else {
      if (password.value !== password2.value) {
        auth.errMsg = '两次密码不一致';
        return;
      }
      await auth.setupPassword(password.value);
    }
    if (auth.authenticated) password.value = password2.value = '';
  } finally { busy.value = false; }
}
</script>

<template>
  <div class="login-wrap">
    <div class="card">
      <div class="logo">
        <svg viewBox="0 0 24 24" width="32" height="32">
          <circle cx="12" cy="12" r="10" fill="#1a73e8"/>
          <path d="M11 16.5L6.5 12l1.4-1.4L11 13.7l5.6-5.6L18 9.5z" fill="#fff"/>
        </svg>
      </div>
      <h1>AIOS</h1>
      <p class="sub">{{ auth.configured ? '请输入密码登录' : '初次使用,请设置一个密码' }}</p>

      <form @submit.prevent="submit">
        <input class="text-input" type="password" autofocus
          v-model="password"
          :placeholder="auth.configured ? '密码' : '设置密码'" />
        <input v-if="!auth.configured" class="text-input" type="password" style="margin-top:8px"
          v-model="password2"
          placeholder="再次输入密码" />
        <div v-if="auth.errMsg" class="err">{{ auth.errMsg }}</div>
        <button class="pill-btn solid" type="submit" :disabled="busy || !password">
          {{ auth.configured ? '登录' : '设置并登录' }}
        </button>
      </form>

      <p v-if="auth.phase === 'offline'" class="off">无法连接到 AIOS 服务,请检查后端是否启动 (端口 9501).</p>
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  position: fixed; inset: 0;
  background: #f0f4f9;
  display: grid; place-items: center;
  z-index: 100;
}
.card {
  width: 360px; max-width: calc(100vw - 32px);
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px 22px;
  box-shadow: 0 1px 3px rgba(60,64,67,0.08), 0 4px 12px rgba(60,64,67,0.06);
  text-align: center;
}
.logo { display: grid; place-items: center; margin: 4px 0 8px; }
h1 { margin: 0; font-size: 22px; font-weight: 500; letter-spacing: -0.01em; }
.sub { margin: 6px 0 18px; color: var(--text-2); font-size: 13px; }
form { display: flex; flex-direction: column; gap: 10px; }
.err { color: var(--bad); font-size: 12.5px; text-align: left; padding-left: 4px; }
.pill-btn { justify-content: center; padding: 10px; }
.off { margin-top: 14px; color: var(--text-3); font-size: 12px; }
</style>
