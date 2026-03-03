import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { router } from './router/index.js';
import { initI18n } from './i18n/index.js';

initI18n();
createApp(App).use(router).mount('#app');
