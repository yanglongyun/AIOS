import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { router } from './router.ts';
import { initI18n, t } from './i18n/index.ts';

initI18n();

const app = createApp(App);
app.config.globalProperties.$t = t;
app.use(router).mount('#app');
