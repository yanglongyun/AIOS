import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { router } from './router/index.js';
createApp(App).use(router).mount('#app');
