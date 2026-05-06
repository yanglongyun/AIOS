import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/lib/api.js';

export const useAuthStore = defineStore('auth', () => {
  // 'pending' | 'ready' | 'offline'
  const phase = ref('pending');
  const configured = ref(false);
  const authenticated = ref(false);
  const errMsg = ref('');

  async function refresh() {
    try {
      const s = await api.get('/api/auth/state');
      configured.value = !!s.configured;
      authenticated.value = !!s.authenticated;
      phase.value = 'ready';
      return s;
    } catch (e) {
      phase.value = 'offline';
      throw e;
    }
  }

  async function init() {
    phase.value = 'pending';
    try { await refresh(); }
    catch { setTimeout(init, 3000); }
  }

  async function setupPassword(password) {
    errMsg.value = '';
    try { await api.post('/api/auth/setup', { password, language: 'zh' }); await refresh(); return true; }
    catch (e) { errMsg.value = e?.body?.message || e.message || '设置失败'; return false; }
  }

  async function login(password) {
    errMsg.value = '';
    try { await api.post('/api/auth/login', { password }); await refresh(); return true; }
    catch (e) { errMsg.value = e?.body?.message || e.message || '登录失败'; return false; }
  }

  async function logout() {
    try { await api.post('/api/auth/logout'); } catch {}
    authenticated.value = false;
  }

  return { phase, configured, authenticated, errMsg, init, refresh, setupPassword, login, logout };
});
