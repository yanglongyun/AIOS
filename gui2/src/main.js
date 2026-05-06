import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router.js';
import { setOn401 } from './lib/api.js';
import { useAuthStore } from './stores/auth.js';
import './style.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia).use(router).mount('#app');

// 401 → 让 auth store 重新拉一次 state,触发 Login 蒙层
const auth = useAuthStore();
setOn401(() => { auth.authenticated = false; });
auth.init();
