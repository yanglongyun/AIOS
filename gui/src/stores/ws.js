// "ws" store —— 历史名 (一开始放过 WebSocket 客户端代码),现在职责是
// 鉴权状态 + 连接健康度.整体走 cookie session,不再做 HMAC 挑战应答.
//
// 浏览器 cookie 自动随同域请求发送 (HttpOnly + SameSite=Lax),
// AI / curl 用 Authorization: Bearer $AIOS_API_TOKEN.

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as api from '@/utils/api';

export const useWsStore = defineStore('ws', () => {
    // 'pending' | 'ready' | 'offline'
    const state = ref('pending');
    const statusText = ref('__T_CONNECTION_CONNECTING_PLAIN__');

    const configured = ref(false);
    const authenticated = ref(false);
    const authError = ref('');

    const showActions = computed(() => authenticated.value);
    // 兼容旧组件
    const requiresPassword = computed(() => !authenticated.value);

    async function refreshState() {
        try {
            const s = await api.get('/api/auth/state');
            configured.value = Boolean(s.configured);
            authenticated.value = Boolean(s.authenticated);
            state.value = 'ready';
            statusText.value = authenticated.value ? '__T_CONNECTION_CONNECTED__' : '__T_CONNECTION_NEED_AUTH__';
            return s;
        } catch (err) {
            state.value = 'offline';
            statusText.value = '__T_CONNECTION_FAILED__';
            throw err;
        }
    }

    async function init() {
        state.value = 'pending';
        statusText.value = '__T_CONNECTION_CONNECTING_PLAIN__';
        try {
            await refreshState();
        } catch {
            // 网络问题,3 秒后重试
            setTimeout(init, 3000);
        }
    }

    async function setupPassword(password) {
        authError.value = '';
        try {
            await api.post('/api/auth/setup', { password });
            await refreshState();
            return true;
        } catch (err) {
            authError.value = err?.body?.message || err.message || '__T_COMMON_SETUP_FAILED__';
            return false;
        }
    }

    async function login(password) {
        authError.value = '';
        try {
            await api.post('/api/auth/login', { password });
            await refreshState();
            return true;
        } catch (err) {
            authError.value = err?.body?.message || err.message || '__T_COMMON_LOGIN_FAILED__';
            return false;
        }
    }

    async function logout() {
        try { await api.post('/api/auth/logout'); } catch {}
        authenticated.value = false;
        state.value = 'ready';
        statusText.value = '__T_CONNECTION_NEED_AUTH__';
    }

    async function changePassword(oldPassword, newPassword) {
        authError.value = '';
        try {
            await api.post('/api/auth/change-password', { oldPassword, newPassword });
            return true;
        } catch (err) {
            authError.value = err?.body?.message || err.message || '__T_COMMON_UPDATE_FAILED__';
            return false;
        }
    }

    // 兼容旧调用
    function sendMsg() {}
    function onMessage() { return () => {}; }

    return {
        state, statusText,
        configured, authenticated, authError,
        showActions, requiresPassword,
        init, refreshState,
        setupPassword, login, logout, changePassword,
        sendMsg, onMessage,
    };
});
