// 本机 ws 状态:无登录、无鉴权生命周期.

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useWsStore = defineStore('ws', () => {
    const state = ref('ready');
    const statusText = ref('已连接');

    const configured = ref(true);

    const showActions = computed(() => true);
    const requiresPassword = computed(() => false);

    function init() {}
    function refreshState() { return Promise.resolve({ configured: true }); }
    function sendMsg() {}
    function onMessage() { return () => {}; }

    return {
        state, statusText,
        configured,
        showActions, requiresPassword,
        init, refreshState,
        sendMsg, onMessage,
    };
});
